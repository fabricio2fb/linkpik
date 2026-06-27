import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/admin/guard"
import { getAdminSession } from "@/lib/admin/session"
import { createSupabaseService } from "@/lib/api/supabase-service"
import { logAdminAction } from "@/lib/admin/audit"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await requireAdminUser()
  if (!adminUser) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })

  const adminSession = await getAdminSession()
  if (!adminSession) return NextResponse.json({ error: "Sessao admin necessaria" }, { status: 401 })

  const { id } = await params

  const supabase = createSupabaseService()

  const { data: creator, error: fetchError } = await supabase
    .from("creators")
    .select("suspended")
    .eq("id", id)
    .single()

  if (fetchError || !creator) {
    return NextResponse.json({ error: "Criador nao encontrado" }, { status: 404 })
  }

  const newStatus = !creator.suspended

  const { error: updateError } = await supabase
    .from("creators")
    .update({ suspended: newStatus })
    .eq("id", id)

  if (updateError) {
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 })
  }

  await logAdminAction({
    action: newStatus ? "suspendeu_criador" : "reativou_criador",
    targetTable: "creators",
    targetId: id,
    adminEmail: adminUser.email,
  })

  return NextResponse.json({
    suspended: newStatus,
    message: newStatus ? "Conta suspensa" : "Conta reativada",
  })
}
