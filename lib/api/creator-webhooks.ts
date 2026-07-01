import { createSupabaseService } from "@/lib/api/supabase-service";
import { signWebhookBody } from "@/lib/api/web-push";
import { WEBHOOK_EVENTS, type WebhookEvent } from "@/lib/constants/webhook-events";

type CreatorWebhookSettings = {
  webhook_url?: string | null;
  webhook_events?: string[] | null;
  webhook_secret?: string | null;
};

function isSafeWebhookUrl(value?: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function acceptsEvent(settings: CreatorWebhookSettings, event: string) {
  const events = settings.webhook_events ?? [];
  if (!events.length) return true;
  return events.includes(event) || (event === WEBHOOK_EVENTS.ORDER_PAID && (events.includes("paid_order") || events.includes("new_sale")));
}

async function logWebhookDelivery(params: {
  creatorId: string;
  event: string;
  webhookUrl: string;
  requestPayload: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: string | null;
  responseTimeMs: number;
  success: boolean;
  errorMessage?: string | null;
  isTest?: boolean;
}) {
  try {
    await createSupabaseService()
      .from("webhook_logs")
      .insert({
        creator_id: params.creatorId,
        event_type: params.event,
        webhook_url: params.webhookUrl,
        request_payload: params.requestPayload,
        response_status: params.responseStatus,
        response_body: params.responseBody,
        response_time_ms: params.responseTimeMs,
        success: params.success,
        error_message: params.errorMessage ?? null,
        is_test: params.isTest ?? false,
      });
  } catch {
    // fire-and-forget, nao travar o fluxo principal
  }
}

/**
 * Dispara um webhook para o criador e registra o resultado na tabela webhook_logs.
 *
 * Payload do evento `order.pending`:
 * - `order_id`: string — ID do pedido
 * - `status`: "pending"
 * - `gateway`: string — "mercadopago" | "efipay"
 * - `amount`: number — valor total
 * - `currency`: string — "BRL"
 * - `product`: { id: string, title: string, type: "digital" | "physical" }
 *
 * Payload do evento `order.paid`:
 * - `order_id`: string
 * - `status`: "paid"
 * - `gateway`: string
 * - `amount`: number
 * - `currency`: string
 * - `product`: { id, title, type }
 * - `paid_at`: string (ISO date)
 * - `buyer_email?`: string
 *
 * Payload do evento `order.refused` | `order.canceled` | `order.refunded`:
 * - `order_id`: string
 * - `status`: string
 * - `gateway`: string
 * - `gateway_status?`: string
 * - `amount`: number
 * - `currency`: string
 * - `product`: { id, title, type }
 *
 * Payload do evento `access.granted`:
 * - `order_id`: string
 * - `product`: string — nome do produto
 * - `buyer_email`: string
 * - `access_expires_at`: string (ISO date)
 */
export async function dispatchCreatorWebhook(params: {
  creatorId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  overrideUrl?: string;
  overrideSecret?: string;
  isTest?: boolean;
}) {
  const supabase = createSupabaseService();

  let webhookUrl: string | null | undefined;
  let webhookSecret: string | null | undefined;

  if (params.overrideUrl) {
    webhookUrl = params.overrideUrl;
    webhookSecret = params.overrideSecret ?? null;
  } else {
    const { data: settings } = await supabase
      .from("creator_settings")
      .select("webhook_url, webhook_events, webhook_secret")
      .eq("creator_id", params.creatorId)
      .maybeSingle();

    if (!settings || !isSafeWebhookUrl(settings.webhook_url) || !acceptsEvent(settings, params.event)) return;
    webhookUrl = settings.webhook_url;
    webhookSecret = settings.webhook_secret;
  }

  if (!webhookUrl) return;

  const body = JSON.stringify({
    event: params.event,
    created_at: new Date().toISOString(),
    data: params.payload,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Pikbio-Webhooks/1.0",
  };
  if (webhookSecret) {
    headers["X-Pikbio-Signature"] = `sha256=${signWebhookBody(body, webhookSecret)}`;
  }

  const start = performance.now();
  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  let errorMessage: string | null = null;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(5000),
    });
    responseStatus = res.status;
    responseBody = (await res.text().catch(() => "")).slice(0, 2000);
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      errorMessage = "Timeout";
    } else {
      errorMessage = e instanceof Error ? e.message : "Erro desconhecido";
    }
  }

  const elapsed = Math.round(performance.now() - start);
  const success = errorMessage === null && responseStatus !== null && responseStatus >= 200 && responseStatus < 300;

  logWebhookDelivery({
    creatorId: params.creatorId,
    event: params.event,
    webhookUrl,
    requestPayload: { event: params.event, data: params.payload },
    responseStatus,
    responseBody,
    responseTimeMs: elapsed,
    success,
    errorMessage,
    isTest: params.isTest,
  });
}
