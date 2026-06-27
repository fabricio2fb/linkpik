import { createSupabaseServer } from "@/lib/api/supabase-server"
import { createSupabaseService } from "@/lib/api/supabase-service"

export async function requireAdminUser() {
  const supabase = await createSupabaseServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user?.email) return null

  const supabaseAdmin = createSupabaseService()
  const { data: adminUser } = await supabaseAdmin
    .from("admin_users")
    .select("id, email, totp_configured")
    .eq("email", user.email)
    .maybeSingle()

  return adminUser ?? null
}
