import { shortDate } from "@/lib/dates"
import { formatValue } from "@/lib/format"
import type { WeekPoint } from "@/lib/analysis"

export function CompareChart({
  series,
  unit,
  rollout,
  compact = false,
}: {
  series: WeekPoint[]
  unit: string
  rollout: string
  compact?: boolean
}) {
  if (series.length < 2) return null
  const width = 720
  const height = compact ? 120 : 250
  const pad = compact ? { l: 44, r: 8, t: 8, b: 22 } : { l: 48, r: 12, t: 16, b: 32 }
  const values = series.flatMap((point) => [point.treatment, point.control].filter((value): value is number => value != null))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || Math.abs(max) || 1
  const yMin = min - span * 0.12
  const yMax = max + span * 0.12
  const y = (value: number) => pad.t + (1 - (value - yMin) / (yMax - yMin)) * (height - pad.t - pad.b)
  const x = (index: number) => pad.l + (index / (series.length - 1)) * (width - pad.l - pad.r)
  const rolloutIndex = series.findIndex((point) => point.phase === "post")
  const ticks = [yMax, (yMax + yMin) / 2, yMin]
  const treatment = linePath(series, "treatment", x, y)
  const control = linePath(series, "control", x, y)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Weekly results for the rollout and comparison groups" className="w-full">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={pad.l} x2={width - pad.r} y1={y(tick)} y2={y(tick)} stroke="#e0d8ca" />
          <text x={pad.l - 8} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="#6a6258">
            {formatValue(tick, unit)}
          </text>
        </g>
      ))}
      {rolloutIndex > 0 && (
        <g>
          <line x1={x(rolloutIndex)} x2={x(rolloutIndex)} y1={pad.t} y2={height - pad.b} stroke="#0e5c54" strokeDasharray="3 4" />
          <text x={x(rolloutIndex) + 6} y={pad.t + 12} fontSize="11" fill="#0e5c54">
            Rollout {shortDate(rollout)}
          </text>
        </g>
      )}
      {control && <path d={control} fill="none" stroke="#9d4328" strokeWidth="2" strokeDasharray="5 4" />}
      {treatment && <path d={treatment} fill="none" stroke="#1c1916" strokeWidth="2.4" />}
      <text x={pad.l} y={height - 6} fontSize="11" fill="#6a6258">
        {shortDate(series[0].period)}
      </text>
      <text x={width - pad.r} y={height - 6} textAnchor="end" fontSize="11" fill="#6a6258">
        {shortDate(series[series.length - 1].period)}
      </text>
    </svg>
  )
}

function linePath(
  series: WeekPoint[],
  key: "treatment" | "control",
  x: (index: number) => number,
  y: (value: number) => number,
): string | null {
  let path = ""
  let drawing = false
  series.forEach((point, index) => {
    const value = point[key]
    if (value == null) {
      drawing = false
      return
    }
    path += `${drawing ? "L" : "M"}${x(index).toFixed(1)},${y(value).toFixed(1)} `
    drawing = true
  })
  return path.trim() || null
}

export function ChartLegend({ comparison }: { comparison: boolean }) {
  return (
    <div className="row text-sm text-muted">
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-0.5 w-6 bg-ink" /> Rollout
      </span>
      {comparison && (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 border-t-2 border-dashed border-rust" /> Comparison
        </span>
      )}
    </div>
  )
}
