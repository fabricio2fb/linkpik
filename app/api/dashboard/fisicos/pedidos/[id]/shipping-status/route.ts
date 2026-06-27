import { addTrackingEvent, auditLog, getCreatorContext } from "@/lib/api/physical-orders";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/errors";
import { err, ok } from "@/lib/api/response";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { isAllowedShipmentTransition, UpdateShipmentStatusSchema, UuidSchema } from "@/lib/schemas/physical.schema";

const titles: Record<string, string> = {
  awaiting_preparation: "Pedido em preparacao",
  awaiting_label: "Aguardando etiqueta",
  label_generated: "Etiqueta gerada",
  awaiting_postage: "Aguardando postagem",
  posted: "Pedido postado",
  in_transit: "Em transporte",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  delivery_issue: "Problema na entrega",
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const creator = await getCreatorContext();
    await applyRateLimit("mutations", creator.userId);
    const { id } = await context.params;
    const parsedId = UuidSchema.safeParse(id);
    if (!parsedId.success) throw new ApiError(400, "Pedido invalido");
    const body = await request.json();
    const parsed = UpdateShipmentStatusSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Status invalido");

    const supabase = createSupabaseService();
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, order_shipments(id, status)")
      .eq("id", parsedId.data)
      .eq("creator_id", creator.creatorId)
      .single();
    if (!order) throw new ApiError(404, "Pedido nao encontrado");
    if (order.status !== "paid") throw new ApiError(400, "Envio so pode ser atualizado apos pagamento aprovado");

    const shipment = Array.isArray(order.order_shipments) ? order.order_shipments[0] : order.order_shipments;
    if (!shipment) throw new ApiError(404, "Envio nao encontrado");
    if (!isAllowedShipmentTransition(shipment.status, parsed.data.status)) {
      throw new ApiError(400, "Transicao de status nao permitida");
    }

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
      last_tracking_event_at: now,
    };
    if (parsed.data.status === "posted") updateData.posted_at = now;
    if (parsed.data.status === "delivered") updateData.delivered_at = now;
    if (parsed.data.status === "label_generated") updateData.label_status = "manual";

    const { data, error } = await supabase
      .from("order_shipments")
      .update(updateData)
      .eq("id", shipment.id)
      .eq("creator_id", creator.creatorId)
      .select()
      .single();
    if (error || !data) throw new ApiError(500, "Erro ao atualizar envio");

    await addTrackingEvent({
      orderId: order.id,
      shipmentId: shipment.id,
      creatorId: creator.creatorId,
      status: parsed.data.status,
      title: titles[parsed.data.status] ?? "Status atualizado",
      description: parsed.data.description ?? null,
      location: parsed.data.location ?? null,
      createdBy: "creator",
    });
    await auditLog({ creatorId: creator.creatorId, actorId: creator.userId, action: "shipment_status_updated", entityType: "order", entityId: order.id, metadata: { status: parsed.data.status } });

    return ok(data);
  } catch (e) {
    return err(e);
  }
}
