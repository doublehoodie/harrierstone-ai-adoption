import { notFound } from "next/navigation"
import { analyze } from "@/lib/analysis"
import { DesignPanel } from "@/components/client"
import { SectionActions } from "@/components/section-actions"
import { isPre } from "@/lib/dates"
import { formatValue } from "@/lib/format"
import { weekCounts } from "@/lib/progress"
import { getStudy } from "@/lib/store"
import type { Arm, Study } from "@/lib/types"

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const study = getStudy(id)
  if (!study) notFound()
  const report = analyze(study)
  const weeks = weekCounts(study)
  const metric = study.metrics.find((item) => item.id === study.primaryMetricId)
  const treat = armBaseline(study, "treatment")
  const control = armBaseline(study, "control")
  let balance: string | null = null
  if (metric && treat != null && control != null) {
    balance = `Before the rollout, the first wave was at ${formatValue(treat, metric.unit)} ${metric.unit === "share" ? "" : metric.unit} and the held-back group at ${formatValue(control, metric.unit)} ${metric.unit === "share" ? "" : metric.unit}.`
  }
  return (
    <div>
      <h1 className="screen-title">Who gets it first</h1>
      <p className="screen-note">Hold some teams back, or give it to them in a later wave. That is what separates the rollout from everything else that changed in the same weeks. Giving it to everyone at once still records what happened. Without a comparison group, the change cannot be separated from other things that changed in the same weeks.</p>
      {report.power && <div className="callout mt-6">{report.power.note}</div>}
      <div className="mt-6">
        <DesignPanel study={study} balance={balance} postAlreadyIn={weeks.post >= 2} />
        <SectionActions studyId={study.id} section="design" />
      </div>
    </div>
  )
}

function armBaseline(study: Study, arm: Arm): number | null {
  const teams = new Set(study.teams.filter((team) => team.arm === arm).map((team) => team.id))
  const rows = study.outcomes.filter(
    (point) => point.metricId === study.primaryMetricId && teams.has(point.teamId) && isPre(point.period, study.design.rolloutDate),
  )
  if (rows.length === 0) return null
  const total = rows.reduce((sum, row) => sum + row.value * row.n, 0)
  const weight = rows.reduce((sum, row) => sum + row.n, 0)
  return weight ? total / weight : null
}
