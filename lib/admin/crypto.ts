import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-cbc"
const IV_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.ADMIN_TOTP_ENCRYPTION_KEY
  if (!key) throw new Error("ADMIN_TOTP_ENCRYPTION_KEY not configured")
  return Buffer.from(key.padEnd(32, "x").slice(0, 32))
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  return iv.toString("hex") + ":" + encrypted
}

export function decrypt(encryptedText: string): string {
  const key = getKey()
  const parts = encryptedText.split(":")
  const iv = Buffer.from(parts[0]!, "hex")
  const encrypted = parts[1]!
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}
