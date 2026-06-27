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
    .select("user_id")
    .eq("id", id)
    .single()

  if (fetchError || !creator) {
    return NextResponse.json({ error: "Criador nao encontrado" }, { status: 404 })
  }

  const { error: signOutError } = await supabase.auth.admin.signOut(creator.user_id)

  if (signOutError) {
    return NextResponse.json({ error: "Erro ao revogar sessoes" }, { status: 500 })
  }

  await logAdminAction({
    action: "forcou_logout",
    targetTable: "creators",
    targetId: id,
    adminEmail: adminUser.email,
    metadata: { user_id: creator.user_id },
  })

  return NextResponse.json({ message: "Sessoes revogadas" })
}
