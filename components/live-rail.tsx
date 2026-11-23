import { analyze } from "@/lib/analysis"
import { ChartLegend, CompareChart } from "@/components/charts"
import { liveLabel, weekCounts } from "@/lib/progress"
import type { Study } from "@/lib/types"

export function LiveRail({ study }: { study: Study }) {
  const label = liveLabel(study)
  if (!label) return null
  const report = analyze(study)
  const primary = report.primary
  const weeks = weekCounts(study)
  const open = study.openWeek
  const planned = study.design.plannedPostWeeks

  return (
    <section className="live-rail no-print" aria-label="Live study">
      <div className="live-rail-meta">
        <span className="status">
          <span className="status-dot warn" />
          Live
        </span>
        <strong>{label}</strong>
        <span className="text-sm text-muted">
          {weeks.post} closed of {planned}
        </span>
        {open ? (
          <span className="text-sm text-muted">
            {open.day < 2
              ? `Check-in not sent · ${open.invited} people in the first wave`
              : `${open.replies} of ${open.invited} replies`}
          </span>
        ) : (
          <span className="text-sm text-muted">Waiting on the next file</span>
        )}
        {primary?.did != null && <span className="text-sm text-muted">{primary.name}</span>}
      </div>
      {primary && primary.series.length > 1 ? (
        <div className="live-rail-chart">
          <div className="row justify-between">
            <span className="text-sm text-muted">Closed weeks</span>
            {primary.series.some((point) => point.control != null) && <ChartLegend comparison />}
          </div>
          <CompareChart series={primary.series} unit={primary.unit} rollout={study.design.rolloutDate} compact />
        </div>
      ) : (
        <p className="text-sm text-muted">The chart starts once two weeks are on file.</p>
      )}
    </section>
  )
}
