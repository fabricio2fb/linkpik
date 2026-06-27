import { createSupabaseService } from "@/lib/api/supabase-service"

export async function logAdminAction(params: {
  action: string
  targetTable?: string
  targetId?: string
  adminEmail: string
  ip?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const supabase = createSupabaseService()
    await supabase.from("admin_audit_log").insert({
      action: params.action,
      target_table: params.targetTable ?? null,
      target_id: params.targetId ?? null,
      admin_email: params.adminEmail,
      ip: params.ip ?? null,
      metadata: params.metadata ?? {},
    })
  } catch {
    // audit never blocks the operation
  }
}
