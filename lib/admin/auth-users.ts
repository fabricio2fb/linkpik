import { createSupabaseService } from "@/lib/api/supabase-service"

export async function getEmailsByUserId(userIds: string[]): Promise<Map<string, string>> {
  if (!userIds.length) return new Map()

  const supabase = createSupabaseService()

  const uniqueIds = [...new Set(userIds)]

  const result = new Map<string, string>()

  const { data: { users } } = await supabase.auth.admin.listUsers()

  for (const user of users) {
    if (uniqueIds.includes(user.id) && user.email) {
      result.set(user.id, user.email)
    }
  }

  return result
}
