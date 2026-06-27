import { AlertCircle, CheckCircle, Clock, Package, Truck } from "lucide-react";

type TrackingEvent = {
  status: string;
  title: string;
  description?: string | null;
  event_time?: string | null;
};

export default function TrackingTimeline({ events, currentStatus }: { events: TrackingEvent[]; currentStatus?: string }) {
  return (
    <div className="grid gap-4">
      {events.map((item, index) => {
        const active = item.status === currentStatus || index === events.length - 1;
        const Icon = item.status === "delivered" ? CheckCircle : item.status === "in_transit" || item.status === "out_for_delivery" ? Truck : item.status === "posted" ? Package : item.status === "delivery_issue" ? AlertCircle : Clock;
        return (
          <div key={`${item.status}-${item.event_time ?? index}`} className="grid grid-cols-[40px_1fr] gap-3">
            <div className="grid justify-items-center">
              <div className={`grid size-10 place-items-center rounded-full border ${active ? "border-[#FF4D6D]/40 bg-[#FF4D6D]/10 text-[#FF4D6D]" : "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]"}`}>
                <Icon size={18} />
              </div>
              {index < events.length - 1 && <div className="mt-2 h-full min-h-8 w-px bg-[var(--border-subtle)]" />}
            </div>
            <div className={`rounded-[8px] border p-4 ${active ? "border-[#FF4D6D]/40 bg-[#FF4D6D]/10" : "border-[var(--border-subtle)] bg-[var(--bg-elevated)]"}`}>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-bold text-[var(--text-primary)]">{item.title}</p>
                {item.event_time && <span className="text-xs font-semibold text-[var(--text-secondary)]">{new Date(item.event_time).toLocaleString("pt-BR")}</span>}
              </div>
              {item.description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
