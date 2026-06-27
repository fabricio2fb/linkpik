import { NextRequest, NextResponse } from "next/server"
import { verify } from "otplib"
import { requireAdminUser } from "@/lib/admin/guard"
import { checkAdminRateLimit } from "@/lib/admin/rate-limit"
import { createAdminSession } from "@/lib/admin/session"
import { logAdminAction } from "@/lib/admin/audit"
import { decrypt } from "@/lib/admin/crypto"
import { createSupabaseService } from "@/lib/api/supabase-service"

export async function POST(request: NextRequest) {
  const adminUser = await requireAdminUser()
  if (!adminUser) return NextResponse.json(null, { status: 404 })

  const ip = request.headers.get("x-forwarded-for")
    ?? request.headers.get("x-real-ip")
    ?? "unknown"

  const rateCheck = await checkAdminRateLimit(`admin-totp:${ip}`, adminUser.email)
  if (!rateCheck.allowed) {
    await logAdminAction({
      action: "verify_totp_rate_limited",
      adminEmail: adminUser.email,
      ip,
    })
    return NextResponse.json({ success: false }, { status: 429 })
  }

  const { code } = await request.json()

  if (!code || typeof code !== "string" || code.length !== 6 || !/^\d{6}$/.test(code)) {
    await logAdminAction({
      action: "verify_totp_invalid_format",
      adminEmail: adminUser.email,
      ip,
    })
    return NextResponse.json({ success: false })
  }

  const svc = createSupabaseService()

  const { data: adminRecord } = await svc
    .from("admin_users")
    .select("totp_secret_encrypted, totp_configured")
    .eq("id", adminUser.id)
    .single()

  if (!adminRecord?.totp_secret_encrypted) {
    return NextResponse.json({ success: false, needs_setup: true })
  }

  const secret = decrypt(adminRecord.totp_secret_encrypted)

  const result = await verify({ secret, token: code, epoch: Math.floor(Date.now() / 1000), epochTolerance: 60 })

  if (!result.valid) {
    await logAdminAction({
      action: "verify_totp_failed",
      adminEmail: adminUser.email,
      ip,
    })
    return NextResponse.json({ success: false })
  }

  await createAdminSession(adminUser.id)

  const updates: Record<string, unknown> = { last_login_at: new Date().toISOString() }
  if (!adminRecord.totp_configured) {
    updates.totp_configured = true
  }

  await svc
    .from("admin_users")
    .update(updates)
    .eq("id", adminUser.id)

  await logAdminAction({
    action: adminRecord.totp_configured ? "admin_login_success" : "setup_totp_confirmed",
    adminEmail: adminUser.email,
    ip,
  })

  return NextResponse.json({ success: true })
}
