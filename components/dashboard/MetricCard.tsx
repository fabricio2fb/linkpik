import type { LucideIcon } from "lucide-react";
import Card from "@/components/ui/Card";

type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
  icon: LucideIcon;
  color: string;
};

export default function MetricCard({
  label,
  value,
  delta,
  positive = true,
  icon: Icon,
  color,
}: MetricCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{label}</p>
          <p className="mt-3 font-heading text-2xl font-extrabold text-[var(--text-primary)] sm:text-3xl">{value}</p>
        </div>
        <div className="grid size-10 place-items-center rounded-xl" style={{ backgroundColor: `${color}18`, color }}>
          <Icon size={20} />
        </div>
      </div>
      <p className={`mt-3 text-sm font-semibold ${positive ? "text-[#22C55E]" : "text-red-400"}`}>
        {delta}
      </p>
    </Card>
  );
}

