import { createHash, randomBytes } from "crypto";

export function generateAccessToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  const hash = hashAccessToken(token);
  return { token, hash };
}

export function hashAccessToken(token: string): string {
  return createHash("sha256")
    .update(token + process.env.ANALYTICS_SALT)
    .digest("hex");
}

