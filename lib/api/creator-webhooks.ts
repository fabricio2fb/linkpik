import { signWebhookBody } from "./web-push";
import { createSupabaseService } from "./supabase-service";

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
  return events.includes(event) || (event === "order.paid" && (events.includes("paid_order") || events.includes("new_sale")));
}

export async function dispatchCreatorWebhook(params: {
  creatorId: string;
  event: "order.pending" | "order.paid" | "order.refused" | "order.canceled" | "order.refunded" | "access.granted";
  payload: Record<string, unknown>;
}) {
  const supabase = createSupabaseService();
  const { data: settings } = await supabase
    .from("creator_settings")
    .select("webhook_url, webhook_events, webhook_secret")
    .eq("creator_id", params.creatorId)
    .maybeSingle();

  if (!settings || !isSafeWebhookUrl(settings.webhook_url) || !acceptsEvent(settings, params.event)) return;

  const body = JSON.stringify({
    event: params.event,
    created_at: new Date().toISOString(),
    data: params.payload,
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Pikbio-Webhooks/1.0",
  };
  if (settings.webhook_secret) {
    headers["X-Pikbio-Signature"] = `sha256=${signWebhookBody(body, settings.webhook_secret)}`;
  }

  await fetch(settings.webhook_url, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(5000),
  }).catch(() => undefined);
}
