import { notFound } from "next/navigation";
import { MapPin, Package, Truck } from "lucide-react";
import Card from "@/components/ui/Card";
import TrackingTimeline from "@/components/store/TrackingTimeline";
import { physicalDemoOrder, physicalStatusLabels, physicalDemoTrackingTimeline } from "@/app/demo/physical-demo-data";
import { formatPrice } from "@/lib/utils";

export default function DemoRastreioPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const events = physicalDemoTrackingTimeline.map((event) => ({ status: event.status, title: event.title, description: event.description, event_time: new Date().toISOString() }));
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] px-4 py-6 text-[var(--text-primary)]">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-[#FF4D6D]">Rastreamento demo</p>
            <h1 className="mt-2 font-heading text-3xl font-extrabold text-[var(--text-primary)]">Acompanhe seu pedido</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Código {physicalDemoOrder.trackingCode}</p>
          </div>
          <div className="rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-4 py-2 text-sm font-bold text-[#F59E0B]">
            {physicalStatusLabels[physicalDemoOrder.status]}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="p-4 md:col-span-2">
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#FF4D6D]/10 text-[#FF4D6D]">
                <Package size={22} />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-[var(--text-primary)]">{physicalDemoOrder.product}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Comprador: {physicalDemoOrder.buyer}</p>
                <p className="mt-3 text-lg font-extrabold text-[#22C55E]">{formatPrice(physicalDemoOrder.total)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <Truck className="text-[#FF4D6D]" size={22} />
            <p className="mt-3 text-xs font-bold uppercase text-[var(--text-tertiary)]">Status atual</p>
            <p className="mt-1 font-heading text-lg font-bold text-[var(--text-primary)]">{physicalStatusLabels[physicalDemoOrder.status]}</p>
          </Card>
        </section>

        <Card className="p-5">
          <div className="mb-5 flex items-start gap-3">
            <MapPin className="mt-0.5 text-[#FF4D6D]" size={20} />
            <div>
              <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Endereço de entrega</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {physicalDemoOrder.address.street}, {physicalDemoOrder.address.number} - {physicalDemoOrder.address.neighborhood}, {physicalDemoOrder.address.city}/{physicalDemoOrder.address.state}, {physicalDemoOrder.address.postalCode}
              </p>
            </div>
          </div>
          <TrackingTimeline currentStatus={physicalDemoOrder.status} events={events} />
        </Card>
      </div>
    </main>
  );
}
