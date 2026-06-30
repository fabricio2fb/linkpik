import { ApiError } from "@/lib/api/errors";
import { sanitizeUrl } from "@/lib/api/sanitize-url";

const PRODUCT_URL_FIELDS = ["cover_url", "image_url"] as const;
const PRODUCT_DETAILS_URL_FIELDS = ["deliveryUrl", "accessLink", "courseUrl"] as const;

type ProductUrlPayload = {
  cover_url?: string | null;
  image_url?: string | null;
  details?: Record<string, unknown>;
};

function sanitizeImageUrl(input: string) {
  const safeUrl = sanitizeUrl(input);
  if (!safeUrl) return "";
  try {
    const url = new URL(safeUrl);
    const allowed =
      url.protocol === "https:"
      && (
        url.hostname === "res.cloudinary.com"
        || url.hostname.endsWith(".supabase.co")
        || url.hostname === "lh3.googleusercontent.com"
      );
    return allowed ? url.toString() : "";
  } catch {
    return "";
  }
}

export function sanitizeProductUrlFields<T extends ProductUrlPayload>(payload: T): T {
  const next = { ...payload };

  for (const field of PRODUCT_URL_FIELDS) {
    const value = next[field];
    if (typeof value !== "string") continue;
    const safeUrl = field === "cover_url" || field === "image_url" ? sanitizeImageUrl(value) : sanitizeUrl(value);
    if (!safeUrl) throw new ApiError(400, `${field} invalido`);
    next[field] = safeUrl as T[typeof field];
  }

  if (next.details && typeof next.details === "object" && !Array.isArray(next.details)) {
    const details = { ...next.details };
    for (const field of PRODUCT_DETAILS_URL_FIELDS) {
      const value = details[field];
      if (typeof value !== "string") continue;
      const safeUrl = sanitizeUrl(value);
      if (!safeUrl) throw new ApiError(400, `details.${field} invalido`);
      details[field] = safeUrl;
    }
    next.details = details as T["details"];
  }

  return next as T;
}
