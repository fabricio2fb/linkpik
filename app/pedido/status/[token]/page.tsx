import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MapPin, Package, Truck } from "lucide-react";
import CopyTrackingButton from "@/components/store/CopyTrackingButton";
import { getPublicOrderStatus } from "@/lib/api/physical-orders";
import { PublicTokenSchema } from "@/lib/schemas/physical.schema";

const statusLabels: Record<string, string> = {
  awaiting_payment: "Aguardando pagamento",
  paid: "Pagamento aprovado",
  awaiting_preparation: "Preparando envio",
  awaiting_label: "Aguardando etiqueta",
  label_generated: "Etiqueta gerada",
  awaiting_postage: "Aguardando postagem",
  posted: "Pedido postado",
  in_transit: "Em transporte",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  delivery_issue: "Problema na entrega",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

export default async function PublicOrderStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const parsed = PublicTokenSchema.safeParse(token);
  if (!parsed.success) notFound();

  let status: Awaited<ReturnType<typeof getPublicOrderStatus>>;
  try {
    status = await getPublicOrderStatus(parsed.data);
  } catch {
    notFound();
  }

  const currentStatus = status.shipment?.status ?? status.order.status;
  const currentLabel = statusLabels[currentStatus] ?? "Pedido em andamento";

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-4 py-8 text-[var(--text-primary)]">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#FF4D6D]">Pikbio</p>
            <h1 className="mt-2 font-heading text-3xl font-extrabold">Acompanhe seu pedido</h1>
          </div>
          <div className="grid size-12 place-items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[#FF4D6D]">
            <Package size={22} />
          </div>
        </header>

        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Produto</p>
              <h2 className="mt-1 text-xl font-extrabold">{status.product.title}</h2>
            </div>
            <div className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-bold text-[var(--text-primary)]">
              {currentLabel}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Info label="Destino" value={status.destination ? `${status.destination.city}/${status.destination.state}` : "Nao informado"} icon={<MapPin size={16} />} />
            <Info label="CEP" value={status.destination?.zipcode ?? "Protegido"} icon={<MapPin size={16} />} />
            <Info label="Frete" value={status.shipment?.method ?? "A definir"} icon={<Truck size={16} />} />
          </div>

          {status.shipment?.tracking_code && (
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase text-[var(--text-secondary)]">Codigo de rastreio</p>
                <p className="mt-1 font-mono text-lg font-bold">{status.shipment.tracking_code}</p>
              </div>
              <CopyTrackingButton code={status.shipment.tracking_code} />
            </div>
          )}
          <p className="mt-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
            O envio e realizado pelo criador. Quando ele postar o produto, o rastreio aparecera aqui.
          </p>
        </section>

        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <h2 className="font-heading text-xl font-extrabold">Linha do tempo</h2>
          <div className="mt-5 space-y-4">
            {status.timeline.length > 0 ? status.timeline.map((event, index) => (
              <div key={`${event.status}-${event.event_time}`} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`grid size-9 place-items-center rounded-full ${index === status.timeline.length - 1 ? "bg-[#FF4D6D] text-white" : "border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"}`}>
                    {index === status.timeline.length - 1 ? <Clock size={16} /> : <CheckCircle2 size={16} />}
                  </div>
                  {index < status.timeline.length - 1 && <div className="h-full w-px bg-[var(--border-subtle)]" />}
                </div>
                <div className="pb-5">
                  <p className="font-bold">{event.title}</p>
                  {event.description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.description}</p>}
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(event.event_time))}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-[var(--text-secondary)]">O pedido ainda nao possui eventos de rastreio.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <div className="flex items-center gap-2 text-xs uppercase text-[var(--text-secondary)]">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-bold">{value}</p>
    </div>
  );
}
