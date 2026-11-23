import type { Effect, Report } from "@/lib/analysis"
import { ChartLegend, CompareChart } from "@/components/charts"
import { formatChange, formatDelta, formatMoney, formatPct, formatRange, formatValue, plural, readingClass } from "@/lib/format"
import { FUNCTION_LABEL } from "@/lib/templates"
import type { Study } from "@/lib/types"

export function DecisionBanner({ report, study }: { report: Report; study: Study }) {
  return (
    <section className="banner">
      <p className="kicker">
        {study.company} · {FUNCTION_LABEL[study.functionId]} · {study.tool}
      </p>
      <h2 className={readingClass(report.primary, report.decision !== "inconclusive")}>{report.title}</h2>
      <p className="max-w-3xl text-[1.05rem] leading-relaxed">{report.lede}</p>
      {report.reasons.length > 0 && (
        <ul className="mt-4 max-w-3xl list-disc space-y-1 pl-5 text-sm">
          {report.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function DecisionView({ study, report, reportPage = false }: { study: Study; report: Report; reportPage?: boolean }) {
  const primary = report.primary
  return (
    <div className="stack" style={{ gap: "1.6rem" }}>
      <div className="row no-print justify-between">
        <h1 className="screen-title">{reportPage ? "Report" : "Outcome"}</h1>
        <div className="row">
          <a className="btn btn-ghost" href={`/studies/${study.id}/calculations`}>
            Download calculations
          </a>
          <a className="btn btn-ghost" href={`/studies/${study.id}/pdf`} download>
            Save as PDF
          </a>
        </div>
      </div>
      <DecisionBanner report={report} study={study} />
      {report.exploratory && (
        <div className="callout callout-warn">
          <p className="callout-title">Exploratory</p>
          <p>The pre-registration was changed, or the design was locked after the measurement data was already in. The estimate describes what is on file.</p>
        </div>
      )}
        {study.demo && (
        <div className="callout">
          <p>These are sample numbers. Replace them with an admin export or CSV.</p>
        </div>
      )}
      {!study.demo && study.origin.outcomes === "synthetic" && (
        <div className="callout callout-warn">
          <p>Some of these numbers are sample data. Replace them with an admin export or CSV.</p>
        </div>
      )}
      {report.warnings.length > 0 && (
        <div className="callout callout-warn">
          <p className="callout-title">Read this too</p>
          <ul className="list-disc space-y-1 pl-5">
            {report.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="card stack">
        <div className="row justify-between">
          <h3 className="section-title">{primary?.name ?? "Primary outcome"}</h3>
          {primary && <Confidence confidence={primary.confidence} />}
        </div>
        {primary && primary.series.length > 1 ? (
          <>
            <ChartLegend comparison={report.comparison && primary.series.some((point) => point.control != null)} />
            <CompareChart series={primary.series} unit={primary.unit} rollout={study.design.rolloutDate} />
            <EffectTable effects={[primary]} mark={report.decision !== "inconclusive"} />
            <p className="text-sm text-muted">{primary.note}</p>
          </>
        ) : (
          <p className="text-muted">The chart appears once the primary metric has weeks before and after the rollout.</p>
        )}
      </section>

      {report.effects.length > 1 && (
        <section>
          <h3 className="section-title">The other metrics</h3>
          <p className="mb-3 max-w-3xl text-sm text-muted">The agreed metric is the one in the reading above. These are the other metrics on file.</p>
          <div className="card">
            <EffectTable effects={report.effects.filter((effect) => !effect.primary)} mark={report.decision !== "inconclusive"} />
          </div>
        </section>
      )}

      <section id="spend">
        <h3 className="section-title">What it cost</h3>
        <p className="mb-3 max-w-3xl text-sm text-muted">{report.costNote}</p>
        <div className="card stack">
          <div className="grid-2">
            <Fact label="Seat spend" value={formatMoney(report.spend.seats)} />
            <Fact label="Token and API spend" value={formatMoney(report.spend.tokens)} />
            <Fact label="Agent spend" value={formatMoney(report.spend.agents)} />
            <Fact label="Other spend" value={formatMoney(report.spend.other)} />
          </div>
          <p className="num text-lg">
            {formatMoney(report.spend.total)} <span className="text-sm text-muted">in this window</span>
          </p>
          {report.spend.activeRate != null && (
            <p className="text-sm">
              In a typical measurement week, {formatPct(report.spend.activeRate)} of the {plural(report.spend.treatmentHeadcount, "seat")} in the rollout group were used.
            </p>
          )}
          {report.costs.length > 0 && (
            <table className="data">
              <thead>
                <tr>
                  <th>Way of working</th>
                  <th>Cost</th>
                  <th>What is in the number</th>
                </tr>
              </thead>
              <tbody>
                {report.costs.map((row) => (
                  <tr key={row.id}>
                    <td>{row.label}</td>
                    <td className="num">{row.cost == null ? "—" : `${formatMoney(row.cost)} per ${row.unit}`}</td>
                    <td className="text-muted">{row.includes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section id="people">
        <h3 className="section-title">Adoption</h3>
        <p className="mb-3 max-w-3xl text-sm text-muted">Who used it, at the team. This explains the rollout. It is not a second result. Teams that use a tool more may already have been different.</p>
        <div className="card stack">
          {report.autoMapRate != null && (
            <p className="text-sm text-muted">
              {formatPct(report.autoMapRate)} of job titles were recognized without an edit.
              {report.autoMapRate < 0.7 ? " Several still needed a person, so the picture of the work is thin." : ""}
            </p>
          )}
          {report.segments.length === 0 ? (
            <p className="text-muted">No adoption segments yet. They appear when usage is stored for at least three teams, or when a segment file is loaded.</p>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>People</th>
                  <th>Sessions / person</th>
                  <th>Breadth</th>
                  <th>Outcome change</th>
                </tr>
              </thead>
              <tbody>
                {report.segments.map((segment) => (
                  <tr key={segment.id}>
                    <td>{segment.label}</td>
                    <td className="num">{segment.suppressed ? "Hidden" : segment.n}</td>
                    <td className="num">{segment.suppressed ? "—" : formatValue(segment.sessionsPerUser, "score")}</td>
                    <td className="num">{segment.suppressed ? "—" : formatPct(segment.breadth)}</td>
                    <td className="num">
                      {segment.suppressed || segment.primaryDelta == null || !primary
                        ? "—"
                        : formatDelta(segment.primaryDelta, primary.unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <PulseTable report={report} />
          {report.pulseResponseRate != null && (
            <p className="text-sm text-muted">
              Baseline response {formatPct(report.pulseResponseRate)} of {plural(study.pulses.find((wave) => wave.kind === "baseline")?.invited ?? 0, "person")} invited.
              {report.pulseResponseRate < 0.4 ? " Under 40%, so treat it as thin." : " At or above the 40% mark."}
            </p>
          )}
        </div>
      </section>

      <section id="operations">
        <h3 className="section-title">Reading</h3>
        <div className="card stack">
          <p>{report.nextStep}</p>
          <p className="text-sm text-muted">Same numbers for everyone in the room. People look at adoption. Finance looks at cost. Operations looks at whether the work moved.</p>
          <div className="lens-nav no-print">
            <a className="pill" href="#people">People</a>
            <a className="pill" href="#spend">Spend</a>
            <a className="pill" href="#operations">Operations</a>
          </div>
        </div>
      </section>

      {report.suppressed.length > 0 && (
        <section>
          <h3 className="section-title">Hidden because the group was too small</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {report.suppressed.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      {reportPage && (
        <section>
          <h3 className="section-title">Who was in it</h3>
          <div className="card">
            <table className="data">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Group</th>
                  <th>People</th>
                </tr>
              </thead>
              <tbody>
                {study.teams.map((team) => (
                  <tr key={team.id}>
                    <td>{team.name}</td>
                    <td>{team.arm === "treatment" ? "First wave" : team.arm === "control" ? "Hold back" : "Left out"}</td>
                    <td className="num">{team.headcount < study.privacyFloor ? "Hidden" : team.headcount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted">
            The workbook repeats this from the stored rows. On the Estimate sheet, column B is an Excel formula and column C is the number this report published. They should match.
          </p>
        </section>
      )}

    </div>
  )
}

function EffectTable({ effects, mark }: { effects: Effect[]; mark: boolean }) {
  return (
    <table className="data">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Change</th>
          <th>95% range</th>
          <th>Read</th>
        </tr>
      </thead>
      <tbody>
        {effects.map((effect) => (
          <tr key={effect.metricId}>
            <td>
              {effect.name}
              {effect.primary && <span className="pill pill-teal ml-2">Primary</span>}
            </td>
            <td className={`num ${readingClass(effect, mark)}`}>{effect.did == null ? "—" : formatChange(effect.did, effect.unit)}</td>
            <td className="num">{effect.ciLow == null || effect.ciHigh == null ? "—" : formatRange(effect.ciLow, effect.ciHigh, effect.unit)}</td>
            <td>{readEffect(effect, mark)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function readEffect(effect: Effect, settled: boolean): string {
  if (effect.did == null) return "Not enough weeks"
  if (!effect.detectable) return "Range includes no change"
  if (!settled) return "Unmarked"
  return effect.favorable ? "Agreed direction" : "Other direction"
}

function Confidence({ confidence }: { confidence: Effect["confidence"] }) {
  const label = { high: "Narrow range", moderate: "Usable range", low: "Fragile", insufficient: "Not enough" }[confidence]
  const tone = confidence === "high" ? "pill-good" : confidence === "moderate" ? "pill-teal" : confidence === "low" ? "pill-amber" : "pill"
  return <span className={`pill ${tone}`}>{label}</span>
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="kicker">{label}</p>
      <p className="num mt-1 text-lg">{value}</p>
    </div>
  )
}

function PulseTable({ report }: { report: Report }) {
  if (report.pulses.length === 0) return <p className="text-sm text-muted">No pulse scores to show.</p>
  return (
    <table className="data">
      <thead>
        <tr>
          <th>Question</th>
          <th>Group</th>
          <th>Baseline</th>
          <th>Follow-up</th>
          <th>n</th>
        </tr>
      </thead>
      <tbody>
        {report.pulses.map((row) => (
          <tr key={`${row.arm}-${row.construct}`}>
            <td>{row.construct}</td>
            <td>{row.arm === "treatment" ? "Rollout" : "Comparison"}</td>
            <td className="num">{row.baseline == null ? "—" : row.baseline.toFixed(2)}</td>
            <td className="num">{row.followup == null ? "—" : row.followup.toFixed(2)}</td>
            <td className="num">{row.n}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
