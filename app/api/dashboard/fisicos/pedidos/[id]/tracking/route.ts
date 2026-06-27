import { addTrackingEvent, auditLog, getCreatorContext } from "@/lib/api/physical-orders";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { TrackingUpdateSchema, UuidSchema } from "@/lib/schemas/physical.schema";

function sanitizeTrackingUrl(value?: string | null) {
  if (!value) return null;
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new ApiError(400, "URL de rastreio invalida");
  return url.toString();
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const creator = await getCreatorContext();
    await applyRateLimit("mutations", creator.userId);
    const { id } = await context.params;
    const parsedId = UuidSchema.safeParse(id);
    if (!parsedId.success) throw new ApiError(400, "Pedido invalido");
    const body = await request.json();
    const parsed = TrackingUpdateSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Rastreio invalido");

    const supabase = createSupabaseService();
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, order_shipments(id)")
      .eq("id", parsedId.data)
      .eq("creator_id", creator.creatorId)
      .single();
    if (!order) throw new ApiError(404, "Pedido nao encontrado");
    if (order.status !== "paid") throw new ApiError(400, "Rastreio so pode ser informado apos pagamento aprovado");

    const shipment = Array.isArray(order.order_shipments) ? order.order_shipments[0] : order.order_shipments;
    if (!shipment) throw new ApiError(404, "Envio nao encontrado");

    const trackingUrl = sanitizeTrackingUrl(parsed.data.tracking_url);
    const { data, error } = await supabase
      .from("order_shipments")
      .update({
        tracking_code: parsed.data.tracking_code,
        tracking_url: trackingUrl,
        shipping_carrier: parsed.data.carrier ?? null,
        status: "posted",
        last_tracking_event_at: new Date().toISOString(),
        posted_at: new Date().toISOString(),
      })
      .eq("id", shipment.id)
      .eq("creator_id", creator.creatorId)
      .select()
      .single();

    if (error || !data) throw new ApiError(500, "Erro ao salvar rastreio");
    await addTrackingEvent({
      orderId: order.id,
      shipmentId: shipment.id,
      creatorId: creator.creatorId,
      status: "posted",
      title: "Codigo de rastreio adicionado",
      description: `Pedido postado com rastreio ${parsed.data.tracking_code}.`,
      createdBy: "creator",
    });
    await auditLog({ creatorId: creator.creatorId, actorId: creator.userId, action: "tracking_updated", entityType: "order", entityId: order.id });

    return ok(data);
  } catch (e) {
    return err(e);
  }
}
