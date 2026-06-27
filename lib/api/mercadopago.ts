import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { ApiError } from "./errors";
import { refreshDefaultPaymentGatewayAfterDisconnect } from "./payment-gateway";
import { createSupabaseService } from "./supabase-service";
import { centavosToReais } from "@/lib/utils";

const MP_API = "https://api.mercadopago.com";
const GATEWAY = "mercadopago";

type MarketplaceAccountRow = {
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

type MercadoPagoTokenResponse = {
  access_token: string;
  refresh_token?: string;
  public_key?: string;
  user_id?: number | string;
  scope?: string;
  expires_in?: number;
};

type MercadoPagoPreferenceResponse = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
  date_of_expiration?: string;
};

type MercadoPagoPreapprovalResponse = {
  id: string;
  init_point?: string;
  status: string;
  reason?: string;
  external_reference?: string;
  payer_email?: string;
  next_payment_date?: string;
  date_created?: string;
};

type MercadoPagoPaymentResponse = {
  id: number | string;
  status?: string;
  external_reference?: string;
  date_of_expiration?: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
    };
  };
};

export type MercadoPagoPayment = {
  id: number | string;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
  transaction_details?: { total_paid_amount?: number };
  order?: { id?: number | string };
};

export type MercadoPagoPreapproval = {
  id: string;
  status: string;
  reason?: string;
  external_reference?: string;
  payer_email?: string;
  next_payment_date?: string;
  date_created?: string;
  last_modified?: string;
  auto_recurring?: {
    frequency?: number;
    frequency_type?: string;
    transaction_amount?: number;
    currency_id?: string;
  };
};

function cryptoKey() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.MERCADO_PAGO_CLIENT_SECRET;
  if (!secret) throw new ApiError(500, "Chave de criptografia ausente");
  return createHash("sha256").update(secret).digest();
}

export function encryptGatewayToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cryptoKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptGatewayToken(value: string) {
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new ApiError(500, "Token Mercado Pago invalido");
  const decipher = createDecipheriv("aes-256-gcm", cryptoKey(), Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

async function mpFetch<T>(path: string, init: RequestInit & { accessToken?: string } = {}): Promise<T> {
  const { accessToken, headers, ...rest } = init;
  const response = await fetch(`${MP_API}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken ?? process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      ...headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload.message === "string" ? payload.message : "Erro Mercado Pago";
    console.error("[MercadoPago API Error]", {
      status: response.status,
      statusText: response.statusText,
      path,
      body: payload,
    });
    throw new ApiError(response.status, message);
  }
  return payload as T;
}

export function createMercadoPagoOAuthUrl(state: string) {
  const url = new URL("https://auth.mercadopago.com.br/authorization");
  url.searchParams.set("client_id", process.env.MERCADO_PAGO_CLIENT_ID!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", process.env.MERCADO_PAGO_REDIRECT_URI!);
  url.searchParams.set("state", state);
  return url.toString();
}

export function signOAuthState(userId: string) {
  const nonce = randomBytes(16).toString("hex");
  const payload = `${userId}.${nonce}`;
  const sig = createHmac("sha256", process.env.MERCADO_PAGO_CLIENT_SECRET!).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`, "utf8").toString("base64url");
}

export function verifyOAuthState(state: string, userId: string) {
  const decoded = Buffer.from(state, "base64url").toString("utf8");
  const [stateUserId, nonce, sig] = decoded.split(".");
  if (!stateUserId || !nonce || !sig || stateUserId !== userId) return false;
  const payload = `${stateUserId}.${nonce}`;
  const expected = createHmac("sha256", process.env.MERCADO_PAGO_CLIENT_SECRET!).update(payload).digest("hex");
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export async function exchangeOAuthCode(code: string) {
  return mpFetch<MercadoPagoTokenResponse>("/oauth/token", {
    method: "POST",
    body: JSON.stringify({
      client_secret: process.env.MERCADO_PAGO_CLIENT_SECRET,
      client_id: process.env.MERCADO_PAGO_CLIENT_ID,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.MERCADO_PAGO_REDIRECT_URI,
    }),
  });
}

export async function saveConnectedAccount(params: {
  creatorId: string;
  token: MercadoPagoTokenResponse;
}) {
  const expiresAt = params.token.expires_in
    ? new Date(Date.now() + params.token.expires_in * 1000).toISOString()
    : null;

  const supabase = createSupabaseService();
  const { data, error } = await supabase
    .from("creator_marketplace_accounts")
    .upsert({
      creator_id: params.creatorId,
      gateway: GATEWAY,
      external_user_id: params.token.user_id ? String(params.token.user_id) : null,
      access_token_encrypted: encryptGatewayToken(params.token.access_token),
      refresh_token_encrypted: params.token.refresh_token ? encryptGatewayToken(params.token.refresh_token) : null,
      public_key: params.token.public_key ?? null,
      scope: params.token.scope ?? null,
      status: "active",
      connected_at: new Date().toISOString(),
      expires_at: expiresAt,
    }, { onConflict: "creator_id,gateway" })
    .select()
    .single();

  if (error || !data) {
    console.error("[MercadoPago Save Account Error]", {
      creatorId: params.creatorId,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      error,
      hasData: Boolean(data),
    });
    throw new ApiError(500, "Erro ao salvar conta Mercado Pago");
  }
  await supabase.from("creators").update({ payment_enabled: true }).eq("id", params.creatorId);
  return data as MarketplaceAccountRow;
}

export async function getActiveMarketplaceAccount(creatorId: string) {
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

export async function disconnectMarketplaceAccount(creatorId: string) {
  const supabase = createSupabaseService();
  const { error } = await supabase
    .from("creator_marketplace_accounts")
    .update({ status: "disconnected" })
    .eq("creator_id", creatorId)
    .eq("gateway", GATEWAY);

  if (error) throw new ApiError(500, "Erro ao desconectar Mercado Pago");
  const nextGateway = await refreshDefaultPaymentGatewayAfterDisconnect(creatorId, GATEWAY);
  await supabase.from("creators").update({ payment_enabled: Boolean(nextGateway) }).eq("id", creatorId);
}

export async function createMarketplacePreference(params: {
  account: MarketplaceAccountRow;
  orderId: string;
  productTitle: string;
  amount: number;
  platformFee: number;
  buyerName: string;
  buyerEmail: string;
  buyerCpf: string;
}) {
  if (!params.account.access_token_encrypted) {
    throw new ApiError(400, "Conta Mercado Pago nao conectada");
  }

  const accessToken = decryptGatewayToken(params.account.access_token_encrypted);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const preference = await mpFetch<MercadoPagoPreferenceResponse>("/checkout/preferences", {
    method: "POST",
    accessToken,
    body: JSON.stringify({
      items: [{
        id: params.orderId,
        title: params.productTitle,
        quantity: 1,
        currency_id: "BRL",
        // Mercado Pago espera valor em reais decimais, nao centavos: converter aqui, na fronteira com a API externa.
        unit_price: centavosToReais(params.amount),
      }],
      payer: {
        name: params.buyerName,
        email: params.buyerEmail,
        identification: {
          type: "CPF",
          number: params.buyerCpf,
        },
      },
      // Mercado Pago espera valor em reais decimais, nao centavos: converter aqui, na fronteira com a API externa.
      marketplace_fee: centavosToReais(params.platformFee),
      external_reference: params.orderId,
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${appUrl}/checkout/sucesso?order=${params.orderId}`,
        pending: `${appUrl}/checkout/pendente?order=${params.orderId}`,
        failure: `${appUrl}/checkout/erro?order=${params.orderId}`,
      },
      auto_return: "approved",
      statement_descriptor: "PIKBIO",
    }),
  });

  return {
    preferenceId: preference.id,
    checkoutUrl: preference.init_point ?? preference.sandbox_init_point,
    expiresAt: preference.date_of_expiration ?? null,
  };
}

export async function createMercadoPagoPixPayment(params: {
  account: MarketplaceAccountRow;
  orderId: string;
  productTitle: string;
  amount: number;
  platformFee: number;
  buyerName: string;
  buyerEmail: string;
  buyerCpf: string;
}) {
  if (!params.account.access_token_encrypted) {
    throw new ApiError(400, "Conta Mercado Pago nao conectada");
  }

  const accessToken = decryptGatewayToken(params.account.access_token_encrypted);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const payment = await mpFetch<MercadoPagoPaymentResponse>("/v1/payments", {
    method: "POST",
    accessToken,
    headers: {
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      // Mercado Pago espera valor em reais decimais, nao centavos: converter aqui, na fronteira com a API externa.
      transaction_amount: centavosToReais(params.amount),
      description: params.productTitle,
      payment_method_id: "pix",
      payer: {
        email: params.buyerEmail,
        first_name: params.buyerName,
        identification: {
          type: "CPF",
          number: params.buyerCpf,
        },
      },
      external_reference: params.orderId,
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      // Em /v1/payments, o Mercado Pago desconta primeiro a taxa propria dele
      // e depois aplica o application_fee da plataforma sobre o restante.
      // Mercado Pago espera valor em reais decimais, nao centavos: converter aqui, na fronteira com a API externa.
      application_fee: centavosToReais(params.platformFee),
      statement_descriptor: "PIKBIO",
    }),
  });

  return {
    paymentId: String(payment.id),
    qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? "",
    pixCopiaECola: payment.point_of_interaction?.transaction_data?.qr_code ?? "",
    expiresAt: payment.date_of_expiration ?? null,
  };
}

export async function getMercadoPagoPayment(paymentId: string, accessToken?: string) {
  return mpFetch<MercadoPagoPayment>(`/v1/payments/${encodeURIComponent(paymentId)}`, { accessToken });
}

export async function getCreatorPayment(paymentId: string, creatorId: string) {
  const account = await getActiveMarketplaceAccount(creatorId);
  if (!account?.access_token_encrypted) throw new ApiError(404, "Conta Mercado Pago nao encontrada");
  return getMercadoPagoPayment(paymentId, decryptGatewayToken(account.access_token_encrypted));
}

export function mapMercadoPagoStatus(status: string) {
  if (status === "approved") return "paid";
  if (status === "pending" || status === "in_process") return "pending";
  if (status === "rejected") return "failed";
  if (status === "cancelled") return "canceled";
  if (status === "refunded" || status === "charged_back") return "refunded";
  return "pending";
}

export function mapMercadoPagoSubscriptionStatus(status: string) {
  if (status === "authorized" || status === "active") return "active";
  if (status === "pending") return "pending";
  if (status === "paused") return "paused";
  if (status === "cancelled") return "cancelled";
  if (status === "rejected") return "rejected";
  if (status === "expired") return "expired";
  return "pending";
}

export async function createCreatorSubscription(params: {
  creatorId: string;
  payerEmail: string;
  planSlug?: "pro";
}) {
  const amount = 29.9;
  const planSlug = params.planSlug ?? "pro";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const preapproval = await mpFetch<MercadoPagoPreapprovalResponse>("/preapproval", {
    method: "POST",
    body: JSON.stringify({
      reason: "Pikbio Pro",
      external_reference: params.creatorId,
      payer_email: params.payerEmail,
      back_url: `${appUrl}/dashboard/configuracoes?section=plan`,
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "BRL",
      },
      status: "pending",
    }),
  });

  const supabase = createSupabaseService();
  const { data, error } = await supabase
    .from("creator_subscriptions")
    .upsert({
      creator_id: params.creatorId,
      gateway: GATEWAY,
      mercado_pago_preapproval_id: preapproval.id,
      payer_email: params.payerEmail,
      plan_slug: planSlug,
      status: mapMercadoPagoSubscriptionStatus(preapproval.status),
      amount,
      currency: "BRL",
      frequency: 1,
      frequency_type: "months",
      next_payment_date: preapproval.next_payment_date ?? null,
      started_at: preapproval.status === "authorized" ? new Date().toISOString() : null,
    }, { onConflict: "mercado_pago_preapproval_id" })
    .select()
    .single();

  if (error || !data) throw new ApiError(500, "Erro ao salvar assinatura Mercado Pago");
  return {
    subscription: data,
    checkoutUrl: preapproval.init_point,
    preapprovalId: preapproval.id,
  };
}

export async function getMercadoPagoPreapproval(preapprovalId: string) {
  return mpFetch<MercadoPagoPreapproval>(`/preapproval/${encodeURIComponent(preapprovalId)}`);
}

export async function cancelMercadoPagoPreapproval(preapprovalId: string) {
  return mpFetch<MercadoPagoPreapproval>(`/preapproval/${encodeURIComponent(preapprovalId)}`, {
    method: "PUT",
    body: JSON.stringify({ status: "cancelled" }),
  });
}

export async function applyCreatorSubscriptionStatus(params: {
  creatorId: string;
  subscriptionId?: string;
  preapprovalId?: string;
  status: string;
  planSlug?: string;
  nextPaymentDate?: string | null;
  lastPaymentDate?: string | null;
}) {
  const internalStatus = mapMercadoPagoSubscriptionStatus(params.status);
  const isPaid = internalStatus === "active";
  const now = new Date().toISOString();
  const supabase = createSupabaseService();

  const updates: Record<string, unknown> = {
    status: internalStatus,
    next_payment_date: params.nextPaymentDate ?? null,
    last_payment_date: params.lastPaymentDate ?? null,
    ...(isPaid ? { started_at: now } : {}),
    ...(internalStatus === "cancelled" ? { canceled_at: now } : {}),
  };

  let query = supabase.from("creator_subscriptions").update(updates);
  if (params.subscriptionId) query = query.eq("id", params.subscriptionId);
  else if (params.preapprovalId) query = query.eq("mercado_pago_preapproval_id", params.preapprovalId);
  else throw new ApiError(400, "Assinatura sem identificador");
  await query;

  await supabase
    .from("creators")
    .update({
      plan: isPaid ? (params.planSlug ?? "pro") : "free",
      plan_expires_at: isPaid ? (params.nextPaymentDate ?? null) : null,
    })
    .eq("id", params.creatorId);

  return internalStatus;
}

export function validateMercadoPagoWebhook(request: Request, rawBody: string) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) throw new ApiError(500, "MERCADO_PAGO_WEBHOOK_SECRET ausente");

  const signature = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";

  const parts = Object.fromEntries(signature.split(",").map((part) => {
    const [key, value] = part.trim().split("=");
    return [key, value];
  }));

  if (!parts.ts || !parts.v1 || !requestId || !dataId) {
    const fallback = createHmac("sha256", secret).update(rawBody).digest("hex");
    if (!signature || signature.length !== fallback.length) return false;
    return Boolean(signature) && timingSafeEqual(Buffer.from(signature), Buffer.from(fallback));
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  if (parts.v1.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected));
}

export const mercadoPagoGateway = GATEWAY;
