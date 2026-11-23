import Link from "next/link"
import type { Report } from "@/lib/analysis"
import { ChartLegend, CompareChart } from "@/components/charts"
import { DecisionBanner } from "@/components/decision-view"
import { WarRoom } from "@/components/war-room"
import { formatChange, formatDelta, formatMoney, formatPct, readingClass } from "@/lib/format"
import { liveLabel } from "@/lib/progress"
import type { Study } from "@/lib/types"

export function StatusBoard({
  study,
  report,
  nextHref,
  nextLabel,
}: {
  study: Study
  report: Report
  nextHref: string
  nextLabel: string
}) {
  const primary = report.primary
  const live = liveLabel(study)
  const ready = !live && primary?.did != null && study.metricsLocked && study.design.locked
  const first = study.teams.filter((team) => team.arm === "treatment" && team.headcount >= study.privacyFloor)
  const held = study.teams.filter((team) => team.arm === "control" && team.headcount >= study.privacyFloor)
  const firstN = first.reduce((sum, team) => sum + team.headcount, 0)
  const heldN = held.reduce((sum, team) => sum + team.headcount, 0)
  const totalN = firstN + heldN
  const planned = study.design.plannedPostWeeks
  const historyPct = Math.min(100, ((primary?.weeksPre ?? 0) / 4) * 100)
  const measurePct = Math.min(100, planned > 0 ? ((primary?.weeksPost ?? 0) / planned) * 100 : 0)

  return (
    <div className="stack" style={{ gap: "1.1rem" }}>
      <header className="row justify-between">
        <div>
          <h1 className="screen-title">Status</h1>
          <p className="screen-note">{study.summary || `${study.tool} for ${study.population}.`}</p>
        </div>
        <div className="row">
          <Link href={nextHref} className="btn">
            {nextLabel}
          </Link>
          <a className="btn btn-ghost" href={`/studies/${study.id}/report`}>
            Report
          </a>
          <a className="btn btn-ghost" href={`/studies/${study.id}/calculations`}>
            Calculations
          </a>
        </div>
      </header>

      {live && <WarRoom study={study} report={report} />}
      {ready && <DecisionBanner report={report} study={study} />}

      <div className="stat-grid">
        <Stat
          label="Change"
          value={primary?.did == null ? "—" : formatChange(primary.did, primary.unit)}
          note={primary?.name ?? "No metric yet"}
          tone={readingClass(primary, report.decision !== "inconclusive")}
        />
        <Stat
          label="Range"
          value={
            primary?.ciLow == null || primary?.ciHigh == null
              ? "—"
              : `${formatDelta(primary.ciLow, primary.unit).replace(` ${primary.unit}`, "")} to ${formatDelta(primary.ciHigh, primary.unit).replace(` ${primary.unit}`, "")}`
          }
          note={primary?.ciLow == null ? "Needs weeks before and after" : live ? "So far. The planned window is still open." : `95% range${primary.unit === "share" || primary.unit === "score" || primary.unit === "dollars" ? "" : `, ${primary.unit}`}`}
        />
        <Stat label="People" value={totalN ? String(totalN) : "—"} note={totalN ? `${firstN} first wave · ${heldN} held back` : "Groups not set"} />
        <Stat label="Spend" value={formatMoney(report.spend.total)} note={report.spend.activeRate == null ? "No usage yet" : `${formatPct(report.spend.activeRate)} of seats used`} />
      </div>

      <div className="dash-grid">
        <section className="card stack">
          <div className="row justify-between">
            <h2 className="font-semibold">{primary?.name ?? "Primary metric"}</h2>
            {live && <span className="text-sm text-muted">Closed weeks</span>}
            {primary && primary.series.some((point) => point.control != null) && <ChartLegend comparison />}
          </div>
          {primary && primary.series.length > 1 ? (
            <CompareChart series={primary.series} unit={primary.unit} rollout={study.design.rolloutDate} />
          ) : (
            <p className="text-sm text-muted">The chart appears once the metric has weeks before and after the rollout.</p>
          )}
        </section>
        <section className="card stack">
          <h2 className="font-semibold">Coverage</h2>
          <Meter label="History" detail={`${primary?.weeksPre ?? 0} weeks on file`} pct={historyPct} />
          <Meter
            label="Since launch"
            detail={live ? `${primary?.weeksPost ?? 0} closed of ${planned}` : `${primary?.weeksPost ?? 0} of ${planned} planned weeks`}
            pct={measurePct}
          />
          <Meter label="First wave" detail={totalN ? `${firstN} people` : "Not set"} pct={totalN ? (firstN / totalN) * 100 : 0} />
          {study.openWeek ? (
            <Meter
              label="This week's check-in"
              detail={`${study.openWeek.replies} of ${study.openWeek.invited}`}
              pct={study.openWeek.invited ? (study.openWeek.replies / study.openWeek.invited) * 100 : 0}
            />
          ) : (
            report.pulseResponseRate != null && (
              <Meter label="Check-in replies" detail={formatPct(report.pulseResponseRate)} pct={report.pulseResponseRate * 100} />
            )
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value, note, tone = "" }: { label: string; value: string; note: string; tone?: string }) {
  return (
    <div className="stat">
      <p className="kicker">{label}</p>
      <p className={`stat-value ${tone}`}>{value}</p>
      <p className="text-sm text-muted">{note}</p>
    </div>
  )
}

function Meter({ label, detail, pct }: { label: string; detail: string; pct: number }) {
  return (
    <div>
      <div className="row justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-muted">{detail}</span>
      </div>
      <div className="meter" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
    </div>
  )
}
