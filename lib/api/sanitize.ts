import { createHash } from "crypto";
import sanitizeHtmlLib from "sanitize-html";
export { sanitizeUrl } from "@/lib/api/sanitize-url";

export function sanitizeText(input: string): string {
  return sanitizeHtmlLib(input, { allowedTags: [], allowedAttributes: {} }).trim();
}

export function sanitizeHtml(input: string): string {
  return sanitizeHtmlLib(input).trim();
}

export function hashCpf(cpf: string): string {
  return createHash("sha256")
    .update(cpf.replace(/\D/g, "") + process.env.ANALYTICS_SALT)
    .digest("hex");
}
