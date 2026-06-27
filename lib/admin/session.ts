import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const SESSION_COOKIE = "admin_session"
const SESSION_DURATION = 4 * 60 * 60

function getJWTSecret() {
  const secret = process.env.ADMIN_SESSION_JWT_SECRET
  if (!secret) throw new Error("ADMIN_SESSION_JWT_SECRET not configured")
  return new TextEncoder().encode(secret)
}

export async function createAdminSession(adminUserId: string) {
  const cookieStore = await cookies()
  const token = await new SignJWT({ sub: adminUserId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DURATION}s`)
    .setIssuedAt()
    .sign(getJWTSecret())

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  })
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getJWTSecret())
    return payload.sub as string
  } catch {
    return null
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
}
