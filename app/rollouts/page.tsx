import Link from "next/link"
import { analyze, type Report } from "@/lib/analysis"
import { ChartLegend, CompareChart } from "@/components/charts"
import { ResetDemos } from "@/components/client"
import { WarRoom } from "@/components/war-room"
import { formatDelta } from "@/lib/format"
import { dataBadge, liveLabel, stage, weekCounts } from "@/lib/progress"
import { listStudies } from "@/lib/store"
import { FUNCTION_LABEL } from "@/lib/templates"
import type { Study } from "@/lib/types"

export default async function RolloutsPage({ searchParams }: { searchParams: Promise<{ study?: string }> }) {
  const { study: requested } = await searchParams
  const studies = listStudies()
  const selected =
    studies.find((study) => study.id === requested) ??
    studies.find((study) => study.openWeek) ??
    studies.find((study) => liveLabel(study)) ??
    [...studies].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const report = selected ? analyze(selected) : null
  const live = selected ? liveLabel(selected) : null

  return (
    <div className="study-frame">
      <div className="shell study-frame-inner">
        <div className="workspace-top justify-between">
          <div className="min-w-0">
            <h1 className="screen-title">Rollouts</h1>
            <p className="screen-note">The open study stays on the right. Pick another one from the list.</p>
          </div>
          <Link href="/studies/new" className="btn">
            New rollout
          </Link>
        </div>
        <div className="study-shell">
          <nav className="study-nav" aria-label="Studies">
            {studies.map((study) => {
              const where = stage(study)
              const mark = liveLabel(study)
              const active = study.id === selected?.id
              return (
                <Link key={study.id} href={`/rollouts?study=${study.id}`} className={active ? "study-pick active" : "study-pick"} aria-current={active ? "page" : undefined}>
                  <span className="status">
                    <span className={`status-dot ${mark ? "warn" : where.tone}`} />
                    {mark ? "Live" : where.label}
                  </span>
                  <span className="study-pick-name">{study.name}</span>
                  <span className="study-pick-meta">
                    {study.company} · {FUNCTION_LABEL[study.functionId]}
                  </span>
                </Link>
              )
            })}
            <div className="mt-4">
              <ResetDemos />
            </div>
          </nav>
          <div className="study-content stack">
            {selected && report && live && <WarRoom study={selected} report={report} home />}
            {selected && report && !live && <FinishedStudy study={selected} report={report} />}
            {selected && report?.primary && report.primary.series.length > 1 && (
              <section className="card stack">
                <div className="row justify-between">
                  <h2 className="font-semibold">{report.primary.name}</h2>
                  {report.primary.series.some((point) => point.control != null) && <ChartLegend comparison />}
                </div>
                <CompareChart series={report.primary.series} unit={report.primary.unit} rollout={selected.design.rolloutDate} />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FinishedStudy({ study, report }: { study: Study; report: Report }) {
  const primary = report.primary
  const weeks = weekCounts(study)
  const ready = primary?.did != null && study.metricsLocked && study.design.locked
  const where = stage(study)
  const badge = dataBadge(study)
  return (
    <section className="card stack">
      <p className="kicker">{study.company}</p>
      <h2 className="screen-title">{study.name}</h2>
      <p className="text-sm text-muted">
        {study.tool} · {weeks.pre} weeks before · {weeks.post} after · {badge.label}
      </p>
      <p className={ready ? `decision-${report.decision}` : "text-muted"}>{ready ? report.title : where.label}</p>
      {primary?.did != null && (
        <p>
          {primary.name} is {formatDelta(primary.did, primary.unit)}
          {primary.unit === "share" || primary.unit === "score" || primary.unit === "dollars" ? "" : ` ${primary.unit}`}.
        </p>
      )}
      <Link href={`/studies/${study.id}`} className="btn">
        Open the rollout
      </Link>
    </section>
  )
}
