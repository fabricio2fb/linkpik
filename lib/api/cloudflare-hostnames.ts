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
  return result as CloudflareHostnameResult;
}

export async function getCustomHostname(hostnameId: string) {
  const { zoneId } = getConfig();
  const result = await cfFetch(`/zones/${zoneId}/custom_hostnames/${hostnameId}`);
  return result as CloudflareHostnameResult;
}

export async function deleteCustomHostname(hostnameId: string) {
  const { zoneId } = getConfig();
  await cfFetch(`/zones/${zoneId}/custom_hostnames/${hostnameId}`, { method: "DELETE" });
}

export function getDnsInstructions(domain: string) {
  return [
    { type: "CNAME", name: domain, value: "pik.bio", ttl: "Auto" },
  ];
}
