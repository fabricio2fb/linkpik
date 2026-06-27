import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/admin/guard"
import { getAdminSession } from "@/lib/admin/session"
import { createSupabaseService } from "@/lib/api/supabase-service"
import { logAdminAction } from "@/lib/admin/audit"
import { maskEmail } from "@/lib/admin/mask"

export async function POST(request: Request) {
  const adminUser = await requireAdminUser()
  if (!adminUser) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  const adminSession = await getAdminSession()
  if (!adminSession) return NextResponse.json({ error: "Sessao admin necessaria" }, { status: 401 })

  const body = await request.json()
  const email = body.email?.trim()
  const userType = body.user_type
  const requestType = body.request_type ?? "delete"

  if (!email || !userType || !["creator", "buyer"].includes(userType)) {
    return NextResponse.json({ error: "Email e tipo (creator/buyer) sao obrigatorios" }, { status: 400 })
  }

  if (!["delete", "export"].includes(requestType)) {
    return NextResponse.json({ error: "Tipo de pedido invalido" }, { status: 400 })
  }

  const supabase = createSupabaseService()

  const { data, error } = await supabase
    .from("privacy_requests")
    .insert({
      email,
      user_type: userType,
      request_type: requestType,
      status: "pending",
      notes: "Cadastro manual pelo admin",
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 })
  }

  await logAdminAction({
    action: "criou_pedido_privacidade",
    targetTable: "privacy_requests",
    targetId: data.id,
    adminEmail: adminUser.email,
    metadata: { user_type: userType, request_type: requestType, email: maskEmail(email) },
  })

  return NextResponse.json({ id: data.id, message: "Pedido criado" })
}
