"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";

export type SalesChartPoint = {
  day: string;
  revenue: number;
  upsell_revenue: number;
};

const emptyWeek = [
  { day: "Seg", value: 0, upsell: 0 },
  { day: "Ter", value: 0, upsell: 0 },
  { day: "Qua", value: 0, upsell: 0 },
  { day: "Qui", value: 0, upsell: 0 },
  { day: "Sex", value: 0, upsell: 0 },
  { day: "Sab", value: 0, upsell: 0 },
  { day: "Dom", value: 0, upsell: 0 },
];

export default function SalesChart({ data = [] }: { data?: SalesChartPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = useMemo(() => data.map((item) => ({
    day: item.day,
    value: item.revenue,
    upsell: item.upsell_revenue,
  })), [data]);

  const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0);
  const hasSales = totalRevenue > 0;

  const { points, upsellPoints, linePath, upsellPath, areaPath } = useMemo(() => {
    const width = 700;
    const height = 160;
    const top = 18;
    const bottom = 34;
    const left = 18;
    const right = 18;
    const source = chartData.length ? chartData : emptyWeek;
    const max = Math.max(1, ...source.map((item) => item.value), ...source.map((item) => item.upsell));
    const min = Math.min(...source.map((item) => item.value));
    const range = Math.max(1, max - min);

    const mapped = source.map((item, index) => {
      const divisor = Math.max(1, source.length - 1);
      const x = left + (index / divisor) * (width - left - right);
      const normalized = (item.value - min) / range;
      const y = height - bottom - normalized * (height - top - bottom);
      return { ...item, x, y };
    });

    const mappedUpsell = source.map((item, index) => {
      const divisor = Math.max(1, source.length - 1);
      const x = left + (index / divisor) * (width - left - right);
      const y = height - bottom - (item.upsell / max) * (height - top - bottom);
      return { ...item, x, y };
    });

    const buildPath = (items: typeof mapped) =>
      items.reduce((current, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        const previous = items[index - 1];
        const control = (point.x - previous.x) / 2;
        return `${current} C ${previous.x + control} ${previous.y}, ${point.x - control} ${point.y}, ${point.x} ${point.y}`;
      }, "");

    const path = buildPath(mapped);
    const area = `${path} L ${mapped[mapped.length - 1].x} ${height - bottom} L ${mapped[0].x} ${height - bottom} Z`;

    return {
      points: mapped,
      upsellPoints: mappedUpsell,
      linePath: path,
      upsellPath: buildPath(mappedUpsell),
      areaPath: area,
    };
  }, [chartData]);

  const activePoint = activeIndex === null ? null : points[activeIndex];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Vendas</h2>
          <p className="text-sm text-[var(--text-secondary)]">Ultimos 7 dias</p>
        </div>
        <span className="rounded-full bg-[#FF4D6D]/10 px-3 py-1 text-xs font-bold text-[#FF4D6D]">
          {formatPrice(totalRevenue)}
        </span>
      </div>

      <div className="relative mt-7">
        {!hasSales && (
          <div className="absolute inset-x-0 top-12 z-10 text-center text-sm font-semibold text-[var(--text-secondary)]">
            Nenhuma venda paga nos ultimos 7 dias.
          </div>
        )}

        {activePoint && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs shadow-2xl"
            style={{ left: `${(activePoint.x / 700) * 100}%`, top: `${Math.max(0, activePoint.y - 54)}px` }}
          >
            <p className="font-bold text-[var(--text-primary)]">{activePoint.day}</p>
            <p className="mt-0.5 text-[#FF4D6D]">{formatPrice(activePoint.value)}</p>
            <p className="mt-0.5 text-[#22C55E]">Upsell: {formatPrice(activePoint.upsell)}</p>
          </div>
        )}

        <svg viewBox="0 0 700 160" className={`h-56 w-full overflow-visible ${hasSales ? "" : "opacity-50"}`} role="img" aria-label="Grafico de vendas dos ultimos 7 dias" onMouseLeave={() => setActiveIndex(null)}>
          <defs>
            <linearGradient id="salesAreaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,77,109,0.3)" />
              <stop offset="100%" stopColor="rgba(255,77,109,0)" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#salesAreaGradient)" />
          <path d={linePath} fill="none" stroke="#FF4D6D" strokeLinecap="round" strokeWidth="2" />
          <path d={upsellPath} fill="none" stroke="#22C55E" strokeDasharray="6 6" strokeLinecap="round" strokeWidth="2" />
          {points.map((point, index) => (
            <g key={`${point.day}-${index}`}>
              <circle cx={point.x} cy={point.y} r={activeIndex === index ? 5.5 : 4} fill="var(--bg-primary)" stroke="#FF4D6D" strokeWidth="2" className="opacity-70 transition-opacity hover:opacity-100" />
              <circle cx={point.x} cy={point.y} r="18" fill="transparent" onMouseEnter={() => setActiveIndex(index)} />
              <text x={point.x} y="154" textAnchor="middle" className="fill-[var(--text-secondary)] text-[12px] font-semibold">{point.day}</text>
            </g>
          ))}
          {upsellPoints.map((point, index) => <circle key={`upsell-${point.day}-${index}`} cx={point.x} cy={point.y} r="3" fill="#22C55E" />)}
        </svg>

        <div className="mt-3 flex justify-center gap-5 text-xs font-semibold text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[#FF4D6D]" /> Receita total</span>
          <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[#22C55E]" /> Receita de upsells</span>
        </div>
      </div>
    </Card>
  );
}
