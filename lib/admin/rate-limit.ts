import { Redis } from "@upstash/redis"
import { sendNotificationEmail } from "@/lib/api/mailer"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const WINDOW_SECONDS = 15 * 60
const MAX_ATTEMPTS = 5
const BLOCK_SECONDS = 60 * 60

export async function checkAdminRateLimit(identifier: string, adminEmail: string) {
  const blockedKey = `admin-blocked:${identifier}`
  const attemptsKey = `admin-attempts:${identifier}`

  const blocked = await redis.get(blockedKey)
  if (blocked) return { allowed: false }

  const attempts = await redis.incr(attemptsKey)
  if (attempts === 1) {
    await redis.expire(attemptsKey, WINDOW_SECONDS)
  }

  if (attempts > MAX_ATTEMPTS) {
    await redis.set(blockedKey, "1", { ex: BLOCK_SECONDS })
    await redis.del(attemptsKey)

    try {
      await sendNotificationEmail({
        to: adminEmail,
        subject: "Tentativa suspeita de acesso ao admin Pikbio",
        body: [
          "Uma tentativa de acesso ao painel admin foi bloqueada após exceder o limite.",
          "",
          `IP: ${identifier}`,
          `Horário: ${new Date().toISOString()}`,
          "",
          "Se não foi você, verifique a segurança da conta imediatamente.",
        ].join("\n"),
      })
    } catch {
      // email failure does not weaken protection
    }

    return { allowed: false }
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - attempts }
}
