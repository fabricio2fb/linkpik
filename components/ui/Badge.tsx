import { clsx } from "clsx";
import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "accent" | "danger";
  className?: string;
};

export default function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        tone === "neutral" && "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
        tone === "success" && "border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]",
        tone === "warning" && "border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#F59E0B]",
        tone === "accent" && "border-[#FF4D6D]/20 bg-[#FF4D6D]/10 text-[#FF4D6D]",
        tone === "danger" && "border-red-500/20 bg-red-500/10 text-red-400",
        className,
      )}
    >
      {children}
    </span>
  );
}

