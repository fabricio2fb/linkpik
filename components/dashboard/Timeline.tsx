import { CheckCircle, Circle } from "lucide-react";

export default function Timeline({ steps, activeIndex = 3 }: { steps: string[]; activeIndex?: number }) {
  return (
    <div className="grid gap-3">
      {steps.map((step, index) => {
        const done = index <= activeIndex;
        const Icon = done ? CheckCircle : Circle;
        return (
          <div key={step} className="flex items-center gap-3">
            <div className={`grid size-8 shrink-0 place-items-center rounded-full ${done ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"}`}>
              <Icon size={16} />
            </div>
            <span className={`text-sm font-semibold ${done ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}
