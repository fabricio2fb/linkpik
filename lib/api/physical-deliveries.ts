import { getCreatorContext } from "@/lib/api/physical-orders";
import { createSupabaseService } from "@/lib/api/supabase-service";
import { shipmentStatusLabel } from "@/lib/api/dashboard-utils";
import type { KanbanColumn, TimelineStep } from "@/lib/dashboard/types";

const deliveryColumns = [
  { id: "awaiting_label", title: "Aguardando etiqueta" },
  { id: "label_generated", title: "Etiqueta gerada" },
  { id: "awaiting_postage", title: "Aguardando postagem" },
  { id: "in_transit", title: "Em transporte" },
  { id: "delivered", title: "Entregue" },
];

export async function getPhysicalDeliveries() {
  const creator = await getCreatorContext();
  const supabase = createSupabaseService();
  const { data, error } = await supabase
    .from("order_shipments")
    .select(`
      id, order_id, status, shipping_method, shipping_carrier, tracking_code, shipping_deadline_days,
      orders(buyer_name, created_at),
      products(title),
      order_tracking_events(title, description, status, event_time)
    `)
    .eq("creator_id", creator.creatorId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const shipments = data ?? [];
  const columns: KanbanColumn[] = deliveryColumns.map((column) => ({
    id: column.id,
    title: column.title,
    cards: shipments.filter((shipment) => shipment.status === column.id).map((shipment) => {
      const order = Array.isArray(shipment.orders) ? shipment.orders[0] : shipment.orders;
      const product = Array.isArray(shipment.products) ? shipment.products[0] : shipment.products;
      return {
        id: shipment.id,
        title: `#${String(shipment.order_id).slice(0, 8)}`,
        subtitle: `${order?.buyer_name ?? "Cliente"} - ${product?.title ?? "Produto"} - ${shipment.shipping_method}`,
        meta: shipmentStatusLabel(shipment.status),
        action: shipment.tracking_code ? "Ver rastreio" : "Atualizar envio",
      };
    }),
  }));

  const selected = shipments[0];
  const events = selected?.order_tracking_events ?? [];
  const timeline: TimelineStep[] = (Array.isArray(events) ? events : []).map((event) => ({
    title: event.title,
    text: event.description ?? shipmentStatusLabel(event.status),
    status: event.status,
    time: event.event_time ? new Date(event.event_time).toLocaleString("pt-BR") : undefined,
  }));

  return {
    metrics: {
      awaiting_preparation: shipments.filter((shipment) => shipment.status === "awaiting_preparation").length,
      label_generated: shipments.filter((shipment) => shipment.status === "label_generated").length,
      posted_today: shipments.filter((shipment) => shipment.status === "posted").length,
      in_transit: shipments.filter((shipment) => shipment.status === "in_transit").length,
      delivered_week: shipments.filter((shipment) => shipment.status === "delivered").length,
      issues: shipments.filter((shipment) => shipment.status === "delivery_issue").length,
    },
    columns,
    timeline,
  };
}
