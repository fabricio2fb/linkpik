"use client"

import { useMemo, useState } from "react"
import Card from "@/components/ui/Card"
import { formatPrice } from "@/lib/utils"

export type MrrPoint = {
  month: string
  mrr: number
  subs: number
}

export default function MrrChart({ data = [] }: { data?: MrrPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const hasData = data.length > 0 && data.some((p) => p.mrr > 0)

  const { points, linePath, areaPath } = useMemo(() => {
    const width = 700
    const height = 180
    const top = 18
    const bottom = 34
    const left = 18
    const right = 18

    const source = data.length ? data : []
    const maxMrr = Math.max(1, ...source.map((p) => p.mrr))
    const barMaxHeight = height - top - bottom

    const mapped = source.map((item, index) => {
      const divisor = Math.max(1, source.length - 1)
      const x = left + (index / divisor) * (width - left - right)
      const normalized = item.mrr / maxMrr
      const y = height - bottom - normalized * barMaxHeight
      return { ...item, x, y, barHeight: (item.mrr / maxMrr) * barMaxHeight }
    })

    const buildPath = (items: typeof mapped) =>
      items.reduce((cur, pt, i) => {
        if (i === 0) return `M ${pt.x} ${pt.y}`
        const prev = items[i - 1]
        const control = (pt.x - prev.x) / 2
        return `${cur} C ${prev.x + control} ${prev.y}, ${pt.x - control} ${pt.y}, ${pt.x} ${pt.y}`
      }, "")

    const path = buildPath(mapped)
    const last = mapped[mapped.length - 1]
    const first = mapped[0]
    const area = last
      ? `${path} L ${last.x} ${height - bottom} L ${first.x} ${height - bottom} Z`
      : ""

    return { points: mapped, linePath: path, areaPath: area }
  }, [data])

  const activePoint = activeIndex === null ? null : points[activeIndex]

  if (!data.length) {
    return (
      <Card className="p-5">
        <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">MRR</h2>
            <p className="text-sm text-[var(--text-secondary)]">Evolucao da receita recorrente</p>
          </div>
        </div>
        <div className="mt-10 text-center text-sm text-[var(--text-secondary)]">Sem dados para exibir.</div>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">MRR</h2>
          <p className="text-sm text-[var(--text-secondary)]">Evolucao da receita recorrente (ultimos 6 meses)</p>
        </div>
        <span className="rounded-full bg-[#FF4D6D]/10 px-3 py-1 text-xs font-bold text-[#FF4D6D]">
          {data.length > 0 ? formatPrice(data[data.length - 1].mrr) : "—"}
        </span>
      </div>

      <div className="relative mt-7">
        {!hasData && (
          <div className="absolute inset-x-0 top-12 z-10 text-center text-sm font-semibold text-[var(--text-secondary)]">
            Nenhuma receita de assinatura no periodo.
          </div>
        )}

        {activePoint && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs shadow-2xl"
            style={{ left: `${(activePoint.x / 700) * 100}%`, top: `${Math.max(0, activePoint.y - 50)}px` }}
          >
            <p className="font-bold text-[var(--text-primary)]">{activePoint.month}</p>
            <p className="mt-0.5 text-[#FF4D6D]">MRR: {formatPrice(activePoint.mrr)}</p>
            <p className="mt-0.5 text-[#38BDF8]">{activePoint.subs} assinantes</p>
          </div>
        )}

        <svg
          viewBox="0 0 700 180"
          className={`h-56 w-full overflow-visible ${hasData ? "" : "opacity-50"}`}
          role="img"
          aria-label="Grafico de MRR"
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id="mrrAreaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,77,109,0.2)" />
              <stop offset="100%" stopColor="rgba(255,77,109,0)" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#mrrAreaGradient)" />
          <path d={linePath} fill="none" stroke="#FF4D6D" strokeLinecap="round" strokeWidth="2" />

          {points.map((point, index) => (
            <g key={`${point.month}-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={activeIndex === index ? 5.5 : 4}
                fill="var(--bg-primary)"
                stroke="#FF4D6D"
                strokeWidth="2"
                className="transition-all"
                onMouseEnter={() => setActiveIndex(index)}
                style={{ cursor: "pointer" }}
              />
              <circle cx={point.x} cy={point.y} r="18" fill="transparent" onMouseEnter={() => setActiveIndex(index)} />
              <text x={point.x} y="175" textAnchor="middle" className="fill-[var(--text-secondary)] text-[11px] font-semibold">
                {point.month}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </Card>
  )
}
