import type { LucideIcon } from "lucide-react";
import Card from "@/components/ui/Card";

export default function InsightCard({ icon: Icon, title, text, color = "#FF4D6D" }: { icon: LucideIcon; title: string; text: string; color?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${color}18`, color }}>
          <Icon size={19} />
        </div>
        <div>
          <p className="font-bold text-[var(--text-primary)]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{text}</p>
        </div>
      </div>
    </Card>
  );
}
