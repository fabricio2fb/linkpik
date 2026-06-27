import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"
import { Resend } from "resend"
import { createSupabaseService } from "@/lib/api/supabase-service"
import { sendNotificationEmail } from "@/lib/api/mailer"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const resend = new Resend(process.env.RESEND_API_KEY!)

const ALLOWED_USER_TYPES = ["creator", "buyer"] as const
const ALLOWED_REQUEST_TYPES = ["delete", "export"] as const

const REQUEST_TYPE_LABELS: Record<string, string> = {
  delete: "exclusao",
  export: "exportacao",
}

const USER_TYPE_LABELS: Record<string, string> = {
  creator: "Criador",
  buyer: "Comprador",
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"

  const rateKey = `privacy-rate:${ip}`
  const requests = await redis.incr(rateKey)
  if (requests === 1) {
    await redis.expire(rateKey, 3600)
  }
  if (requests > 3) {
    return NextResponse.json(
      { error: "Muitas solicitacoes deste IP. Tente novamente em 1 hora." },
      { status: 429 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 })
  }

  const email = (body.email as string)?.trim().toLowerCase()
  const userType = body.user_type as string
  const requestType = body.request_type as string
  const notes = (body.notes as string)?.trim() ?? ""

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "E-mail invalido" }, { status: 400 })
  }

  if (!ALLOWED_USER_TYPES.includes(userType as typeof ALLOWED_USER_TYPES[number])) {
    return NextResponse.json({ error: "Tipo de conta invalido" }, { status: 400 })
  }

  if (!ALLOWED_REQUEST_TYPES.includes(requestType as typeof ALLOWED_REQUEST_TYPES[number])) {
    return NextResponse.json({ error: "Tipo de solicitacao invalido" }, { status: 400 })
  }

  const supabase = createSupabaseService()

  const { error: insertError } = await supabase.from("privacy_requests").insert({
    email,
    user_type: userType,
    request_type: requestType,
    status: "pending",
    notes: notes || null,
  })

  if (insertError) {
    return NextResponse.json({ error: "Erro ao registrar solicitacao" }, { status: 500 })
  }

  const requestLabel = REQUEST_TYPE_LABELS[requestType] ?? requestType
  const userLabel = USER_TYPE_LABELS[userType] ?? userType
  const safeEmail = escapeHtml(email)

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: `Recebemos sua solicitacao de ${requestLabel} de dados`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#FF4D6D">Solicitacao recebida</h2>
          <p>Ola,</p>
          <p>Recebemos sua solicitacao de <strong>${requestLabel}</strong> de dados como <strong>${userLabel}</strong> para o e-mail <strong>${safeEmail}</strong>.</p>
          <p>Vamos processar sua solicitacao em ate <strong>15 dias uteis</strong>, conforme a Lei Geral de Protecao de Dados (LGPD).</p>
          <p>Se voce nao solicitou esta alteracao, ignore este e-mail ou responda para nos avisar.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
          <p style="color:#888;font-size:12px">Pikbio - Loja na bio para criadores brasileiros</p>
        </div>
      `,
    })
  } catch {
    // confirmation email failure does not block the request
  }

  try {
    await sendNotificationEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL ?? "pikbiosite@gmail.com",
      subject: `Nova solicitacao LGPD: ${requestLabel} - ${safeEmail}`,
      body: [
        `Tipo: ${requestLabel}`,
        `Conta: ${userLabel}`,
        `E-mail: ${email}`,
        notes ? `Detalhes: ${notes}` : "",
        `IP: ${ip}`,
        new Date().toISOString(),
      ]
        .filter(Boolean)
        .join("\n"),
    })
  } catch {
    // admin notification failure does not block
  }

  return NextResponse.json({
    message: "Solicitacao recebida. Voce recebera um e-mail de confirmacao.",
  })
}
