import { createHash, randomBytes } from "crypto";

export function generatePublicOrderToken(): { token: string; hash: string; prefix: string } {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    hash: hashPublicOrderToken(token),
    prefix: token.slice(0, 10),
  };
}

export function hashPublicOrderToken(token: string): string {
  return createHash("sha256")
    .update(`order-status:${token}:${process.env.ANALYTICS_SALT ?? ""}`)
    .digest("hex");
}
