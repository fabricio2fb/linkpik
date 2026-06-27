import { AlertCircle, CheckCircle, Info } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { SmartAlert } from "@/lib/dashboard/types";

const toneMap = {
  success: { icon: CheckCircle, color: "#22C55E", border: "border-[#22C55E]/20", bg: "bg-[#22C55E]/10" },
  warning: { icon: AlertCircle, color: "#F59E0B", border: "border-[#F59E0B]/20", bg: "bg-[#F59E0B]/10" },
  danger: { icon: AlertCircle, color: "#EF4444", border: "border-red-500/20", bg: "bg-red-500/10" },
  accent: { icon: Info, color: "#FF4D6D", border: "border-[#FF4D6D]/20", bg: "bg-[#FF4D6D]/10" },
};

export default function ActionAlert({ alert }: { alert: SmartAlert }) {
  const tone = toneMap[alert.tone];
  const Icon = tone.icon;

  return (
    <Card className={`p-4 ${tone.border} ${tone.bg}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Icon className="mt-0.5 shrink-0" style={{ color: tone.color }} size={20} />
          <div>
            <p className="font-bold text-[var(--text-primary)]">{alert.title}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{alert.text}</p>
          </div>
        </div>
        {alert.action && <Button variant="secondary" className="h-9 shrink-0">{alert.action}</Button>}
      </div>
    </Card>
  );
}
