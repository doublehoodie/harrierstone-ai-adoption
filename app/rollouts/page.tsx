import Link from "next/link"
import { analyze, type Report } from "@/lib/analysis"
import { ChartLegend, CompareChart } from "@/components/charts"
import { ResetDemos } from "@/components/client"
import { StudyMenu } from "@/components/study-menu"
import { WarRoom } from "@/components/war-room"
import { formatChange, readingClass } from "@/lib/format"
import { liveLabel, rolloutPhase, rolloutWindow, stage } from "@/lib/progress"
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
              const phase = rolloutPhase(study)
              const active = study.id === selected?.id
              const flag = phase === "ended" ? "Ended" : phase === "paused" ? "Paused" : phase === "live" ? "Live" : where.label
              const tone = phase === "ended" ? "ended" : phase === "paused" ? "warn" : phase === "live" ? "good" : where.tone
              return (
                <div key={study.id} className={active ? "study-pick active" : "study-pick"}>
                  <Link href={`/rollouts?study=${study.id}`} className="study-pick-link" aria-current={active ? "page" : undefined}>
                    <span className="status">
                      <span className={`status-dot ${tone}`} />
                      {flag}
                    </span>
                    <span className="study-pick-name">{study.name}</span>
                    <span className="study-pick-meta">
                      {study.company} · {FUNCTION_LABEL[study.functionId]}
                    </span>
                  </Link>
                  <StudyMenu studyId={study.id} name={study.name} phase={phase} canDelete />
                </div>
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
  const when = rolloutWindow(study)
  return (
    <section className="card stack">
      <p className="kicker">{study.company}</p>
      <h2 className="screen-title">{study.name}</h2>
      {when ? <p className="text-sm text-muted">{when}</p> : null}
      {primary?.did != null && (
        <p className={readingClass(primary, report.decision !== "inconclusive")}>
          {primary.name} is {formatChange(primary.did, primary.unit)}.
        </p>
      )}
      <Link href={`/studies/${study.id}`} className="btn">
        Open the rollout
      </Link>
    </section>
  )
}
