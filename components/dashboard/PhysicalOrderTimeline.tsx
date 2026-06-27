import { CheckCircle, Clock, Package, Truck } from "lucide-react";

export type PhysicalOrderStatus = "paid" | "label_generated" | "posted" | "in_transit" | "out_for_delivery" | "delivered";

const labels: Record<PhysicalOrderStatus, string> = {
  paid: "Pagamento aprovado",
  label_generated: "Etiqueta gerada",
  posted: "Pedido postado",
  in_transit: "Em transporte",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
};

const dashboardStatuses: PhysicalOrderStatus[] = ["paid", "label_generated", "posted", "in_transit", "out_for_delivery", "delivered"];

export default function PhysicalOrderTimeline({ status }: { status: PhysicalOrderStatus }) {
  const currentIndex = dashboardStatuses.indexOf(status);

  return (
    <div className="grid gap-3">
      {dashboardStatuses.map((item, index) => {
        const done = currentIndex >= index;
        const Icon = item === "delivered" ? CheckCircle : item === "posted" || item === "in_transit" || item === "out_for_delivery" ? Truck : item === "label_generated" ? Package : Clock;
        return (
          <div key={item} className="flex items-center gap-3">
            <div className={`grid size-8 shrink-0 place-items-center rounded-full ${done ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"}`}>
              <Icon size={16} />
            </div>
            <span className={`text-sm font-semibold ${done ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{labels[item]}</span>
          </div>
        );
      })}
    </div>
  );
}
