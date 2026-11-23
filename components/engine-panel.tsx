import { analyze, calculation } from "@/lib/analysis"
import { formatMoney, formatValue } from "@/lib/format"
import type { Study } from "@/lib/types"

export function EnginePanel({ study }: { study: Study }) {
  const calc = calculation(study)
  const report = analyze(study)
  const primary = report.primary
  const metric = calc.metrics.find((item) => item.primary) ?? calc.metrics[0]
  const dropped = calc.rows.filter((row) => row.included === 0).length
  const kept = calc.rows.length - dropped
  const excluded = calc.teams.filter((team) => !team.included)
  const denominator = study.metrics.find((item) => item.costDenominator)

  const filled =
    primary?.pre.treatment == null
      ? "Not enough closed weeks to fill the formula."
      : [
          `preT = ${num(primary.pre.treatment, primary.unit)}`,
          `postT = ${num(primary.post.treatment, primary.unit)}`,
          `preC = ${num(primary.pre.control, primary.unit)}`,
          `postC = ${num(primary.post.control, primary.unit)}`,
          `did = ${num(primary.did, primary.unit)}`,
          `range = ${num(primary.ciLow, primary.unit)} to ${num(primary.ciHigh, primary.unit)}`,
        ].join("\n")

  return (
    <details className="engine no-print">
      <summary>Engine</summary>
      <p className="text-sm text-muted">
        The same calculation the workbook repeats. This window reads the study. It does not change it.
      </p>
      <pre className="engine-code">{FORMULA}</pre>
      <pre className="engine-code">{filled}</pre>
      <dl className="engine-facts">
        <div>
          <dt>Primary metric</dt>
          <dd>
            {metric ? `${metric.name} · ${metric.direction === "lower_better" ? "lower is better" : "higher is better"}` : "None chosen"}
          </dd>
        </div>
        <div>
          <dt>Privacy floor</dt>
          <dd>{calc.floor} people. A row or a week under that floor is left out.</dd>
        </div>
        <div>
          <dt>Rows</dt>
          <dd>
            {kept} kept, {dropped} dropped.
          </dd>
        </div>
        <div>
          <dt>Comparison</dt>
          <dd>{calc.comparison ? "First wave against the group held back." : "Before and after only. The formula cannot separate the rollout from other changes."}</dd>
        </div>
        <div>
          <dt>Teams left out</dt>
          <dd>{excluded.length === 0 ? "None." : excluded.map((team) => `${team.name}: ${team.reason}`).join(" · ")}</dd>
        </div>
        <div>
          <dt>Rules fired</dt>
          <dd>{report.rules.length ? report.rules.join(", ") : "None."}</dd>
        </div>
        <div>
          <dt>Cost</dt>
          <dd>
            {denominator
              ? `Pay, then pay plus tool spend, divided by weekly ${denominator.costUnit}. Treatment only.`
              : "No volume metric is marked as the cost denominator."}
            {report.costs.length > 0 &&
              ` ${report.costs.map((row) => `${row.label}: ${row.cost == null ? "—" : formatMoney(row.cost)} per ${row.unit}`).join(". ")}.`}
          </dd>
        </div>
        <div>
          <dt>Return</dt>
          <dd>Not computed. The dollar stays blank until the company states how a movement becomes money.</dd>
        </div>
      </dl>
      {study.roles.length > 0 && (
        <ul className="engine-roles">
          {study.roles.slice(0, 12).map((role) => (
            <li key={role.id}>
              <span className="font-semibold">{role.title}</span>
              <span className="text-sm text-muted">
                {role.onetTitle ? ` ${role.onetCode} ${role.onetTitle}` : " Waiting for a person"}
                {role.tasks.length > 0 ? ` · ${role.tasks.map((task) => task.name).slice(0, 3).join(", ")}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}

function num(value: number | null, unit: string): string {
  if (value == null) return "—"
  return formatValue(value, unit)
}

const FORMULA = `did = (postT - preT) - (postC - preC)
se = sqrt(varPreT / nPreT + varPostT / nPostT + varPreC / nPreC + varPostC / nPostC)
range = did ± tCrit(df) * se
human = headcount * weeklyLoadedCost / weeklyVolumeBefore
humanAi = (headcount * weeklyLoadedCost + toolSpend / postWeeks) / weeklyVolumeAfter
agent = agentSpend / agentUnits`
