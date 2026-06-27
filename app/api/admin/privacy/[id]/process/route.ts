import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/admin/guard"
import { getAdminSession } from "@/lib/admin/session"
import { createSupabaseService } from "@/lib/api/supabase-service"
import { logAdminAction } from "@/lib/admin/audit"
import { maskEmail } from "@/lib/admin/mask"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await requireAdminUser()
  if (!adminUser) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  const adminSession = await getAdminSession()
  if (!adminSession) return NextResponse.json({ error: "Sessao admin necessaria" }, { status: 401 })

  const { id } = await params
  const supabase = createSupabaseService()

  const { data: req, error: fetchError } = await supabase
    .from("privacy_requests")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !req) {
    return NextResponse.json({ error: "Pedido nao encontrado" }, { status: 404 })
  }

  if (req.status !== "pending") {
    return NextResponse.json({ error: "Pedido ja processado ou em andamento" }, { status: 409 })
  }

  if (req.request_type === "export") {
    return await handleExport(supabase, req, adminUser.email)
  }

  return await handleDelete(supabase, req, adminUser.email)
}

async function handleDelete(
  supabase: ReturnType<typeof createSupabaseService>,
  req: Record<string, unknown>,
  adminEmail: string,
) {
  const id = req.id as string
  const email = req.email as string
  const userType = req.user_type as string

  await supabase.from("privacy_requests").update({ status: "processing" }).eq("id", id)

  try {
    const rpcName = userType === "creator" ? "privacy_delete_creator" : "privacy_delete_buyer"
    const { error: rpcError } = await supabase.rpc(rpcName, { p_email: email })

    if (rpcError) throw new Error(rpcError.message)

    await supabase.from("privacy_requests").update({
      status: "done",
      processed_at: new Date().toISOString(),
      processed_by: adminEmail,
    }).eq("id", id)

    await logAdminAction({
      action: "processou_exclusao_lgpd",
      targetTable: "privacy_requests",
      targetId: id,
      adminEmail,
      metadata: { user_type: userType, request_type: "delete", email: maskEmail(email) },
    })

    return NextResponse.json({ type: "delete", message: "Dados anonimizados com sucesso" })
  } catch (err) {
    await supabase.from("privacy_requests").update({ status: "pending" }).eq("id", id)

    const message = err instanceof Error ? err.message : "Erro interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function handleExport(
  supabase: ReturnType<typeof createSupabaseService>,
  req: Record<string, unknown>,
  adminEmail: string,
) {
  const id = req.id as string
  const email = req.email as string
  const userType = req.user_type as string

  await supabase.from("privacy_requests").update({ status: "processing" }).eq("id", id)

  try {
    const exportData: Record<string, unknown> = {
      tipo: userType,
      email,
      data_geracao: new Date().toISOString(),
    }

    if (userType === "creator") {
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const authUser = users.find((u) => u.email === email)

      if (authUser) {
        const { data: creator } = await supabase
          .from("creators")
          .select("id, name, username, bio, avatar_url, plan, created_at")
          .eq("user_id", authUser.id)
          .maybeSingle()

        if (creator) {
          exportData.dados_pessoais = {
            nome: creator.name,
            username: creator.username,
            bio: creator.bio,
            avatar_url: creator.avatar_url,
            plano: creator.plan,
            cadastro: creator.created_at,
          }

          const { data: settings } = await supabase
            .from("creator_settings")
            .select("bank_name, bank_account_type, meta_pixel_id, tiktok_pixel_id, google_analytics_measurement_id, default_gateway, webhook_url")
            .eq("creator_id", creator.id)
            .maybeSingle()

          if (settings) {
            exportData.configuracoes = settings
          }

          const { data: products } = await supabase
            .from("products")
            .select("id, title, description, price, type, status, created_at")
            .eq("creator_id", creator.id)

          if (products) {
            exportData.produtos = products
          }

          const { data: orders } = await supabase
            .from("orders")
            .select("id, amount, platform_fee, status, gateway, created_at, paid_at, buyer_name, buyer_email")
            .eq("creator_id", creator.id)

          if (orders) {
            exportData.pedidos = orders
          }
        }
      }
    } else {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, product_id, amount, platform_fee, status, gateway, created_at, paid_at, buyer_name, buyer_email")
        .eq("buyer_email", email)

      if (orders) {
        exportData.pedidos = orders
      }
    }

    await supabase.from("privacy_requests").update({
      status: "done",
      processed_at: new Date().toISOString(),
      processed_by: adminEmail,
    }).eq("id", id)

    await logAdminAction({
      action: "processou_exportacao_lgpd",
      targetTable: "privacy_requests",
      targetId: id,
      adminEmail,
      metadata: { user_type: userType, request_type: "export", email: maskEmail(email) },
    })

    return NextResponse.json({ type: "export", data: exportData })
  } catch (err) {
    await supabase.from("privacy_requests").update({ status: "pending" }).eq("id", id)

    const message = err instanceof Error ? err.message : "Erro interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
