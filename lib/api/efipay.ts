import { createHash, timingSafeEqual } from "crypto";
import { Redis } from "@upstash/redis";
import { ApiError } from "./errors";
import { createSupabaseService } from "./supabase-service";
import { decryptGatewayToken, encryptGatewayToken } from "./mercadopago";
import { refreshDefaultPaymentGatewayAfterDisconnect } from "./payment-gateway";
import { centavosToReais } from "@/lib/utils";

const EFIPAY_API = process.env.EFIPAY_API_BASE_URL ?? "https://pix.api.efipay.com.br";
const GATEWAY = "efipay";
const TOKEN_CACHE_TTL_SEC = 3300; // 55 minutos (token Efí expira em 3600s)
const EFIPAY_WEBHOOK_IP = "34.193.116.226";

type EfipayTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export type EfipayPixChargeResponse = {
  txid: string;
  pixCopiaECola: string;
  qrCodeImage: string;
  chargeId?: number;
};

export type EfipayBankSlipResponse = {
  chargeId: number;
  checkoutUrl: string;
  barcodeUrl: string;
};

type EfipayAccountInfo = {
  account_code?: string;
  pix_key?: string;
};

export type MarketplaceAccountRow = {
  creator_id: string;
  external_user_id: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  public_key: string | null;
  scope: string | null;
  status: string;
  connected_at: string | null;
  expires_at: string | null;
};

export class EfipayAuthError extends ApiError {
  constructor(message: string) {
    super(502, `Efipay auth error: ${message}`);
    this.name = "EfipayAuthError";
  }
}

export class EfipayChargeError extends ApiError {
  constructor(message: string) {
    super(502, `Efipay charge error: ${message}`);
    this.name = "EfipayChargeError";
  }
}

/** Cache em memória (fallback quando Redis não está disponível).
 *  ATENÇÃO: em ambiente multi-worker (Vercel serverless), cada worker
 *  tem seu próprio cache em memória, gerando OAuth calls redundantes. */
let memTokenCache: { token: string; expiresAt: number } | null = null;

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function getCacheKey(clientId: string) {
  const hashed = createHash("sha256").update(clientId).digest("hex").slice(0, 16);
  return `efipay:token:${hashed}`;
}

export async function getEfipayToken(clientId: string, clientSecret: string): Promise<string> {
  // 1. Tenta Redis primeiro (compartilhado entre workers)
  const redis = getRedisClient();
  const cacheKey = getCacheKey(clientId);
  if (redis) {
    try {
      const cached = await redis.get<string>(cacheKey);
      if (cached) return cached;
    } catch {
      // fallback silencioso para cache em memória
    }
  }

  // 2. Fallback: cache em memória
  if (memTokenCache && Date.now() < memTokenCache.expiresAt) return memTokenCache.token;

  // 3. Fetch novo token da API Efí
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${EFIPAY_API}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });
  if (!res.ok) throw new EfipayAuthError(await res.text().catch(() => "unknown"));
  const data = (await res.json()) as EfipayTokenResponse;

  // 4. Popula ambos os caches
  const ttlMs = (process.env.EFIPAY_TOKEN_CACHE_TTL_SECONDS
    ? Number(process.env.EFIPAY_TOKEN_CACHE_TTL_SECONDS)
    : TOKEN_CACHE_TTL_SEC) * 1000;

  memTokenCache = { token: data.access_token, expiresAt: Date.now() + ttlMs };

  if (redis) {
    try {
      await redis.set(cacheKey, data.access_token, { ex: TOKEN_CACHE_TTL_SEC });
    } catch {
      // fallback silencioso
    }
  }

  return data.access_token;
}

function hashClientId(clientId: string): string {
  return createHash("sha256").update(clientId).digest("hex").slice(0, 16);
}

function efipayWebhookUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const hmac = process.env.EFIPAY_WEBHOOK_SECRET;
  if (!appUrl || !hmac) throw new ApiError(500, "Webhook Efipay nao configurado");

  const url = new URL("/api/webhooks/efipay", appUrl);
  url.searchParams.set("hmac", hmac);
  return url.toString();
}

export async function validateEfipayCredentials(
  clientId: string,
  clientSecret: string,
): Promise<{ valid: boolean; accountInfo?: EfipayAccountInfo }> {
  try {
    const token = await getEfipayToken(clientId, clientSecret);
    const res = await fetch(`${EFIPAY_API}/v2/gn/config`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { valid: false };
    const accountInfo = (await res.json()) as EfipayAccountInfo;
    return { valid: true, accountInfo };
  } catch {
    return { valid: false };
  }
}

export async function saveEfipayAccount(params: {
  creatorId: string;
  clientId: string;
  clientSecret: string;
  pixKey?: string;
  accountInfo?: EfipayAccountInfo;
}) {
  const supabase = createSupabaseService();
  const { data: existing } = await supabase
    .from("creator_marketplace_accounts")
    .select("id, status")
    .eq("creator_id", params.creatorId)
    .eq("gateway", GATEWAY)
    .maybeSingle();

  const payload = {
    creator_id: params.creatorId,
    gateway: GATEWAY,
    external_user_id: params.clientId,
    access_token_encrypted: encryptGatewayToken(params.clientSecret),
    public_key: params.pixKey ?? null,
    scope: params.accountInfo?.account_code ?? null,
    status: "active" as const,
    connected_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase
        .from("creator_marketplace_accounts")
        .update(payload)
        .eq("id", existing.id)
    : await supabase
        .from("creator_marketplace_accounts")
        .insert(payload);

  if (error) throw new ApiError(500, "Erro ao salvar conta Efipay");
  await supabase.from("creators").update({ payment_enabled: true }).eq("id", params.creatorId);
}

export async function getActiveEfipayAccount(creatorId: string) {
  const supabase = createSupabaseService();
  const { data } = await supabase
    .from("creator_marketplace_accounts")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("gateway", GATEWAY)
    .eq("status", "active")
    .maybeSingle();
  return data as MarketplaceAccountRow | null;
}

export async function disconnectEfipayAccount(creatorId: string) {
  const supabase = createSupabaseService();
  const { error } = await supabase
    .from("creator_marketplace_accounts")
    .update({ status: "disconnected" })
    .eq("creator_id", creatorId)
    .eq("gateway", GATEWAY);
  if (error) throw new ApiError(500, "Erro ao desconectar Efipay");

  const nextGateway = await refreshDefaultPaymentGatewayAfterDisconnect(creatorId, GATEWAY);
  await supabase.from("creators").update({ payment_enabled: Boolean(nextGateway) }).eq("id", creatorId);
}

export async function createEfipayPixCharge(params: {
  account: MarketplaceAccountRow;
  orderId: string;
  productTitle: string;
  amount: number;
  platformFee: number;
  buyerName: string;
  buyerEmail: string;
  buyerCpf: string;
}): Promise<EfipayPixChargeResponse> {
  if (!params.account.access_token_encrypted) {
    throw new ApiError(400, "Conta Efipay nao conectada");
  }

  const clientId = params.account.external_user_id;
  const clientSecret = decryptGatewayToken(params.account.access_token_encrypted);
  if (!clientId) throw new ApiError(400, "Client ID ausente na conta Efipay");

  const token = await getEfipayToken(clientId, clientSecret);
  const pixKey = params.account.public_key;

  // Efi PIX espera valor em reais decimais, nao centavos: converter aqui, na fronteira com a API externa.
  const valorBruto = centavosToReais(params.amount);
  const taxaPikbio = centavosToReais(params.platformFee);

  const body: Record<string, unknown> = {
    calendario: { expiracao: 3600 },
    devedor: { cpf: params.buyerCpf.replace(/\D/g, ""), nome: params.buyerName },
    valor: { original: valorBruto.toFixed(2) },
    infoAdicionais: [{ nome: "Pedido", valor: params.orderId }],
  };

  if (pixKey) body.chave = pixKey;

  // Split da Efí Bank API v2 (PIX): https://dev.efipay.com.br/docs/split
  //   valor deve ser string com 2 casas decimais: "10.00" = 10%
  const accountCode = process.env.EFIPAY_PIKBIO_ACCOUNT_CODE;
  if (accountCode && taxaPikbio > 0) {
    body.split = {
      tipo: "porcentagem",
      descricao: "Comissao da plataforma",
      favorecido: { account: accountCode },
      valor: ((taxaPikbio / valorBruto) * 100).toFixed(2),
    };
  }

  // POST /v2/cob — Efí Bank API v2: Criação de cobrança PIX com split
  const res = await fetch(`${EFIPAY_API}/v2/cob`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new EfipayChargeError(await res.text().catch(() => "unknown"));

  const data = (await res.json()) as {
    txid: string;
    pixCopiaECola?: string;
    loc?: { location?: string };
    id?: number;
  };

  return {
    txid: data.txid,
    pixCopiaECola: data.pixCopiaECola ?? "",
    qrCodeImage: data.loc?.location ?? "",
    chargeId: data.id,
  };
}

export async function createEfipayBankSlip(params: {
  account: MarketplaceAccountRow;
  orderId: string;
  productTitle: string;
  amount: number;
  platformFee: number;
  buyerName: string;
  buyerEmail: string;
  buyerCpf: string;
}): Promise<EfipayBankSlipResponse> {
  if (!params.account.access_token_encrypted) {
    throw new ApiError(400, "Conta Efipay nao conectada");
  }

  const clientId = params.account.external_user_id;
  const clientSecret = decryptGatewayToken(params.account.access_token_encrypted);
  if (!clientId) throw new ApiError(400, "Client ID ausente na conta Efipay");

  const token = await getEfipayToken(clientId, clientSecret);
  const valorBruto = Math.round(params.amount);
  const feePercent = Math.round((params.platformFee / params.amount) * 100);
  const body: Record<string, unknown> = {
    items: [{
      name: params.productTitle,
      value: valorBruto,
      amount: 1,
    }],
    customer: {
      name: params.buyerName,
      cpf: params.buyerCpf.replace(/\D/g, ""),
      email: params.buyerEmail,
    },
    expire_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notification_url: efipayWebhookUrl(),
  };

  // Split da Efí Bank API v1 (boleto/cartão): https://dev.efipay.com.br/docs/split
  //   percent deve ser number inteiro (0-100). Ex: 10 = 10%
  const accountCode = process.env.EFIPAY_PIKBIO_ACCOUNT_CODE;
  if (accountCode && feePercent > 0) {
    body.split = [{
      account_code: accountCode,
      percent: feePercent,
    }];
  }

  // POST /v1/charge/one-step/billets — Efí Bank API v1: Boleto/cartão one-step
  const res = await fetch(`${EFIPAY_API}/v1/charge/one-step/billets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new EfipayChargeError(await res.text().catch(() => "unknown"));

  const data = (await res.json()) as {
    id?: number;
    link?: string;
    barcode?: string;
    charge_id?: number;
    payment_url?: string;
  };

  return {
    chargeId: data.id ?? data.charge_id ?? 0,
    checkoutUrl: data.link ?? data.payment_url ?? "",
    barcodeUrl: data.barcode ?? "",
  };
}

export function mapEfipayStatus(status: string): string {
  if (status === "CONCLUIDA" || status === "paid") return "paid";
  if (status === "ATIVA" || status === "active") return "pending";
  if (status === "REMOVIDA" || status === "canceled" || status === "cancelled") return "canceled";
  if (status === "DEVOLVIDA" || status === "refunded") return "refunded";
  if (status === "EXPIRADA" || status === "expired") return "failed";
  return "pending";
}

export function validateEfipayWebhook(request: Request): boolean {
  const url = new URL(request.url);
  const receivedHmac = url.searchParams.get("hmac");
  const expectedHmac = process.env.EFIPAY_WEBHOOK_SECRET;

  if (!receivedHmac || !expectedHmac) return false;
  if (receivedHmac.length !== expectedHmac.length) return false;

  return timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(expectedHmac));
}

export function isValidEfipayIp(request: Request): boolean {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp?.trim();

  return ip === EFIPAY_WEBHOOK_IP;
}

export async function registerEfipayPixWebhook(params: {
  account: MarketplaceAccountRow;
  pixKey: string;
}) {
  if (!params.account.access_token_encrypted) {
    throw new ApiError(400, "Conta Efipay nao conectada");
  }

  const clientId = params.account.external_user_id;
  const clientSecret = decryptGatewayToken(params.account.access_token_encrypted);
  if (!clientId) throw new ApiError(400, "Client ID ausente na conta Efipay");

  return registerEfipayPixWebhookWithCredentials({
    clientId,
    clientSecret,
    pixKey: params.pixKey,
  });
}

export async function registerEfipayPixWebhookWithCredentials(params: {
  clientId: string;
  clientSecret: string;
  pixKey: string;
}) {
  const token = await getEfipayToken(params.clientId, params.clientSecret);
  const res = await fetch(`${EFIPAY_API}/v2/webhook/${encodeURIComponent(params.pixKey)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-skip-mtls-checking": "true",
    },
    body: JSON.stringify({
      webhookUrl: efipayWebhookUrl(),
    }),
  });

  if (!res.ok) throw new EfipayChargeError(await res.text().catch(() => "unknown"));
}

export async function getEfipayPayment(pixTxid: string, account: MarketplaceAccountRow) {
  const clientId = account.external_user_id ?? "";
  if (!clientId) throw new ApiError(400, "Client ID ausente na conta Efipay");
  const clientSecret = decryptGatewayToken(account.access_token_encrypted ?? "");

  const token = await getEfipayToken(clientId, clientSecret);
  const res = await fetch(`${EFIPAY_API}/v2/pix/${encodeURIComponent(pixTxid)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError(502, "Erro ao consultar pagamento Efipay");
  return res.json() as Promise<{
    status: string;
    valor?: { original?: string };
    txid?: string;
  }>;
}

export async function getEfipayCharge(chargeId: number, account: MarketplaceAccountRow) {
  const clientId = account.external_user_id ?? "";
  if (!clientId) throw new ApiError(400, "Client ID ausente na conta Efipay");
  const clientSecret = decryptGatewayToken(account.access_token_encrypted ?? "");

  const token = await getEfipayToken(clientId, clientSecret);
  const res = await fetch(`${EFIPAY_API}/v1/charge/${chargeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError(502, "Erro ao consultar charge Efipay");
  return res.json() as Promise<{
    status: string;
    value?: number;
    id?: number;
  }>;
}

export const efipayGateway = GATEWAY;
