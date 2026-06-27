import { createPrivateKey, createSign, createHmac } from "crypto";
import { ApiError } from "./errors";
import { createSupabaseService } from "./supabase-service";

type PushSubscriptionRow = {
  id: string;
  creator_id: string;
  endpoint: string;
};

function base64UrlToBuffer(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

function base64Url(value: Buffer | string) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getVapidConfig() {
  const subject = process.env.WEB_PUSH_SUBJECT ?? `mailto:${process.env.RESEND_FROM_EMAIL ?? "admin@pikbio.com"}`;
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new ApiError(500, "Web Push nao configurado");
  return { subject, publicKey, privateKey };
}

function createVapidJwt(audience: string) {
  const { subject, publicKey, privateKey } = getVapidConfig();
  const publicBuffer = base64UrlToBuffer(publicKey);
  if (publicBuffer.length !== 65 || publicBuffer[0] !== 4) throw new ApiError(500, "Chave publica Web Push invalida");

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: base64Url(publicBuffer.subarray(1, 33)),
    y: base64Url(publicBuffer.subarray(33, 65)),
    d: privateKey,
  };
  const key = createPrivateKey({ key: jwk, format: "jwk" });
  const header = base64Url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = base64Url(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  }));
  const token = `${header}.${payload}`;
  const signature = createSign("SHA256").update(token).sign({ key, dsaEncoding: "ieee-p1363" });
  return `${token}.${base64Url(signature)}`;
}

export function getPublicWebPushKey() {
  return process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? process.env.WEB_PUSH_PUBLIC_KEY ?? null;
}

export async function sendWebPushNotification(subscription: PushSubscriptionRow) {
  const endpoint = new URL(subscription.endpoint);
  const audience = `${endpoint.protocol}//${endpoint.host}`;
  const publicKey = getVapidConfig().publicKey;
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      TTL: "86400",
      Authorization: `vapid t=${createVapidJwt(audience)}, k=${publicKey}`,
    },
  });

  if (response.status === 404 || response.status === 410) {
    await createSupabaseService().from("web_push_subscriptions").delete().eq("id", subscription.id);
    return;
  }
  if (!response.ok) throw new ApiError(502, "Erro ao enviar push");
}

export async function notifyCreatorPush(creatorId: string) {
  if (!getPublicWebPushKey()) return;
  const supabase = createSupabaseService();
  const { data } = await supabase
    .from("web_push_subscriptions")
    .select("id, creator_id, endpoint")
    .eq("creator_id", creatorId)
    .limit(10);

  await Promise.allSettled((data ?? []).map((subscription) => sendWebPushNotification(subscription as PushSubscriptionRow)));
}

export function signWebhookBody(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}
