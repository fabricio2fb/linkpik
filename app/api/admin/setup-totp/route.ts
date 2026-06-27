import { NextRequest, NextResponse } from "next/server"
import { generateSecret, generateURI } from "otplib"
import { requireAdminUser } from "@/lib/admin/guard"
import { logAdminAction } from "@/lib/admin/audit"
import { encrypt, decrypt } from "@/lib/admin/crypto"
import { createSupabaseService } from "@/lib/api/supabase-service"

export async function POST(request: NextRequest) {
  const adminUser = await requireAdminUser()
  if (!adminUser) return NextResponse.json(null, { status: 404 })

  if (adminUser.totp_configured) {
    return NextResponse.json({ error: "TOTP ja configurado" }, { status: 403 })
  }

  const svc = createSupabaseService()

  const { data: existing } = await svc
    .from("admin_users")
    .select("totp_configured, totp_secret_encrypted")
    .eq("id", adminUser.id)
    .single()

  if (existing?.totp_configured) {
    return NextResponse.json({ error: "TOTP ja configurado" }, { status: 403 })
  }

  const ip = request.headers.get("x-forwarded-for")
    ?? request.headers.get("x-real-ip")
    ?? "unknown"

  // Se já existe um secret gerado (setup pendente, não confirmado), reusá-lo
  if (existing?.totp_secret_encrypted) {
    const existingSecret = decrypt(existing.totp_secret_encrypted)
    const existingUri = generateURI({
      issuer: "Pikbio Admin",
      label: adminUser.email,
      secret: existingSecret,
    })

    return NextResponse.json({ uri: existingUri })
  }

  const secret = generateSecret()

  const encrypted = encrypt(secret)
  const uri = generateURI({
    issuer: "Pikbio Admin",
    label: adminUser.email,
    secret,
  })

  const { error: upsertError } = await svc
    .from("admin_users")
    .update({
      totp_secret_encrypted: encrypted,
      totp_configured: false,
    })
    .eq("id", adminUser.id)

  if (upsertError) {
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 })
  }

  await logAdminAction({
    action: "setup_totp_generated",
    adminEmail: adminUser.email,
    ip,
  })

  return NextResponse.json({ uri })
}
