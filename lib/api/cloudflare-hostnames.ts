import { ApiError } from "./errors";

function getConfig() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) {
    throw new ApiError(500, "Cloudflare nao configurado");
  }
  return { token, zoneId };
}

async function cfFetch(path: string, options: RequestInit = {}) {
  const { token } = getConfig();
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) {
    console.error("Cloudflare API error:", { status: response.status, body });
    const errors = (body.errors ?? []).map((e: { message: string }) => e.message).join("; ");
    throw new ApiError(502, errors || "Erro na API da Cloudflare");
  }
  return body.result;
}

export type CustomHostnameStatus = "pending" | "active" | "verifying" | "error";

export type CloudflareHostnameResult = {
  id: string;
  hostname: string;
  status: CustomHostnameStatus;
  ssl: {
    status: string;
    validation_errors?: Array<{ message: string }>;
  } | null;
  ownership_verification?: {
    type: string;
    name: string;
    value: string;
  };
};

export async function createCustomHostname(domain: string) {
  const { zoneId } = getConfig();
  const result = await cfFetch(`/zones/${zoneId}/custom_hostnames`, {
    method: "POST",
    body: JSON.stringify({
      hostname: domain,
      ssl: { method: "http", type: "dv" },
    }),
  });
  console.error("Cloudflare createCustomHostname response:", JSON.stringify(result, null, 2));
  return result as CloudflareHostnameResult;
}

export async function getCustomHostname(hostnameId: string) {
  const { zoneId } = getConfig();
  const result = await cfFetch(`/zones/${zoneId}/custom_hostnames/${hostnameId}`);
  return result as CloudflareHostnameResult;
}

export async function getFallbackOrigin() {
  const { zoneId } = getConfig();
  try {
    const result = await cfFetch(`/zones/${zoneId}/custom_hostnames/fallback_origin`);
    return (result as { origin: string }).origin;
  } catch {
    return "";
  }
}

export async function deleteCustomHostname(hostnameId: string) {
  const { zoneId } = getConfig();
  await cfFetch(`/zones/${zoneId}/custom_hostnames/${hostnameId}`, { method: "DELETE" });
}

export async function findCustomHostnameByDomain(domain: string) {
  const { zoneId } = getConfig();
  const result = await cfFetch(`/zones/${zoneId}/custom_hostnames?hostname=${encodeURIComponent(domain)}`);
  const list = result as CloudflareHostnameResult[];
  const lower = domain.toLowerCase();
  return list.find((h) => h.hostname.toLowerCase() === lower) ?? null;
}

export async function getFallbackCnameTarget() {
  try {
    const origin = await getFallbackOrigin();
    if (!origin) return "pik.bio";
    const hostname = origin.replace(/^https?:\/\//, "").split("/")[0];
    if (hostname) {
      console.error("Cloudflare fallback origin resolved to:", hostname);
      return hostname;
    }
  } catch {
    // fallback abaixo
  }
  return "pik.bio";
}
