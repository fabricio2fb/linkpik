import { createHash } from "crypto";
import sanitizeHtmlLib from "sanitize-html";
export { sanitizeUrl } from "@/lib/api/sanitize-url";

const BLOG_HTML_CLASSES = [
  "blog-badge",
  "blog-meta",
  "blog-callout",
  "blog-callout-tip",
  "blog-callout-warning",
  "blog-card",
  "blog-checklist",
  "blog-cta",
  "blog-faq-item",
];

export function sanitizeText(input: string): string {
  return sanitizeHtmlLib(input, { allowedTags: [], allowedAttributes: {} }).trim();
}

export function sanitizeHtml(input: string): string {
  return sanitizeHtmlLib(input, {
    allowedAttributes: {
      ...sanitizeHtmlLib.defaults.allowedAttributes,
      "*": [
        ...(sanitizeHtmlLib.defaults.allowedAttributes["*"] ?? []),
        "class",
      ],
    },
    allowedClasses: {
      "*": BLOG_HTML_CLASSES,
    },
  }).trim();
}

export function hashCpf(cpf: string): string {
  return createHash("sha256")
    .update(cpf.replace(/\D/g, "") + process.env.ANALYTICS_SALT)
    .digest("hex");
}
