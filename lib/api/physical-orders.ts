import { ApiError } from "@/lib/api/errors";
import { getAuthUser } from "@/lib/api/auth";
import { generatePublicOrderToken, hashPublicOrderToken } from "@/lib/api/public-order-token";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { createSupabaseServer } from "@/lib/api/supabase-server";

export type CreatorContext = {
  userId: string;
  creatorId: string;
  username: string;
};

export async function getCreatorContext(): Promise<CreatorContext> {
  const user = await getAuthUser();
  const supabase = await createSupabaseServer();
  const { data: creator } = await supabase
    .from("creators")
    .select("id, username")
    .eq("user_id", user.id)
    .single();

  if (!creator) throw new ApiError(404, "Creator nao encontrado");
  return { userId: user.id, creatorId: creator.id, username: creator.username };
}

export async function createPublicOrderStatusToken(params: {
  orderId: string;
  creatorId: string;
  expiresAt?: string | null;
}) {
  const token = generatePublicOrderToken();
  const supabase = createSupabaseService();
  const { error } = await supabase.from("public_order_status_tokens").insert({
    order_id: params.orderId,
    creator_id: params.creatorId,
    token_hash: token.hash,
    token_prefix: token.prefix,
    expires_at: params.expiresAt ?? null,
  });

  if (error) throw new ApiError(500, "Erro ao criar link publico do pedido");
  return token;
}

export async function addTrackingEvent(params: {
  orderId: string;
  shipmentId: string;
  creatorId: string;
  status: string;
  title: string;
  description?: string | null;
  location?: string | null;
  createdBy?: "system" | "creator";
}) {
  const supabase = createSupabaseService();
  await supabase.from("order_tracking_events").insert({
    order_id: params.orderId,
    shipment_id: params.shipmentId,
    creator_id: params.creatorId,
    status: params.status,
    title: params.title,
    description: params.description ?? null,
    location: params.location ?? null,
    created_by: params.createdBy ?? "system",
  });
}

export async function auditLog(params: {
  creatorId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseService();
  const { error } = await supabase.from("audit_log").insert({
    action: params.action,
    resource: params.entityType,
    resource_id: params.entityId ?? null,
    metadata: {
      creator_id: params.creatorId,
      actor_id: params.actorId ?? null,
      ...(params.metadata ?? {}),
    },
  });

  if (error && error.code !== "42P01") {
    console.error("[Audit]", { action: params.action, entityType: params.entityType, error: error.message });
  }
}

export function maskZipcode(zipcode?: string | null) {
  const digits = (zipcode ?? "").replace(/\D/g, "");
  if (digits.length < 3) return "";
  return `*****-${digits.slice(-3)}`;
}

export function publicStatusUrl(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pik.bio";
  return `${baseUrl.replace(/\/$/, "")}/pedido/status/${token}`;
}

export async function getPublicOrderStatus(token: string) {
  const tokenHash = hashPublicOrderToken(token);
  const supabase = createSupabaseService();

  const { data: tokenRow } = await supabase
    .from("public_order_status_tokens")
    .select("id, order_id, creator_id, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!tokenRow || tokenRow.revoked_at || (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() < Date.now())) {
    throw new ApiError(404, "Pedido nao encontrado");
  }

  await supabase.from("public_order_status_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", tokenRow.id);

  const { data: order } = await supabase
    .from("orders")
    .select(`
      id, status, created_at, paid_at,
      products(title, cover_url),
      order_shipments(
        status, shipping_method, shipping_carrier, shipping_deadline_days,
        tracking_code, tracking_url, posted_at, delivered_at
      ),
      order_shipping_addresses(city, state, zipcode),
      order_tracking_events(status, title, description, location, event_time)
    `)
    .eq("id", tokenRow.order_id)
    .single();

  if (!order) throw new ApiError(404, "Pedido nao encontrado");

  const product = Array.isArray(order.products) ? order.products[0] : order.products;
  const shipment = Array.isArray(order.order_shipments) ? order.order_shipments[0] : order.order_shipments;
  const address = Array.isArray(order.order_shipping_addresses) ? order.order_shipping_addresses[0] : order.order_shipping_addresses;
  const timeline = Array.isArray(order.order_tracking_events) ? order.order_tracking_events : [];

  return {
    product: {
      title: product?.title ?? "Produto Pikbio",
      image: product?.cover_url ?? null,
    },
    order: {
      status: order.status,
      created_at: order.created_at,
      paid_at: order.paid_at,
    },
    shipment: shipment
      ? {
          status: shipment.status,
          method: shipment.shipping_method,
          carrier: shipment.shipping_carrier,
          deadline_days: shipment.shipping_deadline_days,
          tracking_code: shipment.tracking_code,
          tracking_url: shipment.tracking_url,
          posted_at: shipment.posted_at,
          delivered_at: shipment.delivered_at,
        }
      : null,
    destination: address
      ? {
          city: address.city,
          state: address.state,
          zipcode: maskZipcode(address.zipcode),
        }
      : null,
    timeline: timeline
      .sort((a: { event_time: string }, b: { event_time: string }) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime())
      .map((event: Record<string, unknown>) => ({
        status: String(event.status),
        title: String(event.title),
        description: event.description ? String(event.description) : null,
        location: event.location ? String(event.location) : null,
        event_time: String(event.event_time),
      })),
  };
}
