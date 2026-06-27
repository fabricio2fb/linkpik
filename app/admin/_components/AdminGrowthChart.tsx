"use client"

import { useMemo, useState } from "react"
import Card from "@/components/ui/Card"
import { formatPrice } from "@/lib/utils"

export type GrowthPoint = {
  month: string
  creators: number
  gmv: number
}

export default function AdminGrowthChart({ data = [] }: { data?: GrowthPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const totalCreators = data.reduce((sum, p) => sum + p.creators, 0)
  const totalGmv = data.reduce((sum, p) => sum + p.gmv, 0)
  const hasData = totalCreators > 0 || totalGmv > 0

  const { points, linePath, areaPath, barMaxHeight } = useMemo(() => {
    const width = 700
    const height = 180
    const top = 18
    const bottom = 34
    const left = 18
    const right = 18

    const source = data.length ? data : []
    const maxCreators = Math.max(1, ...source.map((p) => p.creators))
    const maxGmv = Math.max(1, ...source.map((p) => p.gmv))

    const barMaxHeight = height - top - bottom

    const mapped = source.map((item, index) => {
      const divisor = Math.max(1, source.length - 1)
      const x = left + (index / divisor) * (width - left - right)
      const normalized = item.creators / maxCreators
      const y = height - bottom - normalized * barMaxHeight
      return { ...item, x, y, barHeight: (item.creators / maxCreators) * barMaxHeight }
    })

    const buildPath = (items: typeof mapped, accessor: (item: typeof mapped[number]) => number) => {
      const yValues = items.map((p, i) => {
        const divisor = Math.max(1, items.length - 1)
        const x = left + (i / divisor) * (width - left - right)
        const normalized = accessor(p) / maxGmv
        const y = height - bottom - normalized * barMaxHeight
        return { x, y }
      })
      return yValues.reduce((cur, pt, i) => {
        if (i === 0) return `M ${pt.x} ${pt.y}`
        const prev = yValues[i - 1]
        const control = (pt.x - prev.x) / 2
        return `${cur} C ${prev.x + control} ${prev.y}, ${pt.x - control} ${pt.y}, ${pt.x} ${pt.y}`
      }, "")
    }

    const gmvPath = buildPath(mapped, (p) => p.gmv)
    const last = mapped[mapped.length - 1]
    const first = mapped[0]
    const gmvArea = last
      ? `${gmvPath} L ${last.x} ${height - bottom} L ${first.x} ${height - bottom} Z`
      : ""

    return { points: mapped, linePath: gmvPath, areaPath: gmvArea, barMaxHeight }
  }, [data])

  const activePoint = activeIndex === null ? null : points[activeIndex]

  if (!data.length) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Crescimento</h2>
            <p className="text-sm text-[var(--text-secondary)]">Ultimos 6 meses</p>
          </div>
        </div>
        <div className="mt-10 text-center text-sm text-[var(--text-secondary)]">Sem dados para exibir.</div>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">Crescimento</h2>
          <p className="text-sm text-[var(--text-secondary)]">Ultimos 6 meses</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[#FF4D6D]" />
            Criadores
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#22C55E]" />
            GMV
          </span>
        </div>
      </div>

      <div className="relative mt-7">
        {activePoint && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs shadow-2xl"
            style={{ left: `${(activePoint.x / 700) * 100}%`, top: `${Math.max(0, activePoint.y - 50)}px` }}
          >
            <p className="font-bold text-[var(--text-primary)]">{activePoint.month}</p>
            <p className="mt-0.5 text-[#FF4D6D]">{activePoint.creators} criadores</p>
            <p className="mt-0.5 text-[#22C55E]">GMV: {formatPrice(activePoint.gmv)}</p>
          </div>
        )}

        <svg
          viewBox="0 0 700 180"
          className="h-56 w-full overflow-visible"
          role="img"
          aria-label="Grafico de crescimento de criadores e GMV"
          onMouseLeave={() => setActiveIndex(null)}
        >
          <defs>
            <linearGradient id="gmvAreaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(34,197,94,0.2)" />
              <stop offset="100%" stopColor="rgba(34,197,94,0)" />
            </linearGradient>
          </defs>

          {/* GMV area fill */}
          <path d={areaPath} fill="url(#gmvAreaGradient)" />

          {/* Creators bars */}
          {points.map((point, index) => (
            <g key={`bar-${point.month}-${index}`}>
              <rect
                x={point.x - 8}
                y={180 - 34 - point.barHeight}
                width={12}
                height={point.barHeight}
                rx={3}
                fill="#FF4D6D"
                opacity={activeIndex === index ? 0.9 : 0.6}
                className="transition-opacity"
                onMouseEnter={() => setActiveIndex(index)}
                style={{ cursor: "pointer" }}
              />
              <text x={point.x} y="175" textAnchor="middle" className="fill-[var(--text-secondary)] text-[11px] font-semibold">
                {point.month}
              </text>
            </g>
          ))}

          {/* GMV line */}
          <path d={linePath} fill="none" stroke="#22C55E" strokeLinecap="round" strokeWidth="2" />

          {/* GMV dots */}
          {points.map((point, index) => {
            const divisor = Math.max(1, points.length - 1)
            const x = 18 + (index / divisor) * (700 - 18 - 18)
            const maxGmv = Math.max(1, ...data.map((p) => p.gmv))
            const barMaxHeight2 = 180 - 18 - 34
            const gmvY = 180 - 34 - (point.gmv / maxGmv) * barMaxHeight2

            return (
              <g key={`dot-${point.month}-${index}`}>
                <circle
                  cx={x}
                  cy={gmvY}
                  r={activeIndex === index ? 5 : 3.5}
                  fill="var(--bg-primary)"
                  stroke="#22C55E"
                  strokeWidth="2"
                  className="transition-all"
                  onMouseEnter={() => setActiveIndex(index)}
                  style={{ cursor: "pointer" }}
                />
              </g>
            )
          })}
        </svg>
      </div>
    </Card>
  )
}
