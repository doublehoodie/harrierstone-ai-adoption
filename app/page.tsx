import Link from "next/link"
import { analyze } from "@/lib/analysis"
import { ResetDemos } from "@/components/client"
import { dataBadge, stage, weekCounts } from "@/lib/progress"
import { listStudies } from "@/lib/store"
import { FUNCTION_LABEL } from "@/lib/templates"

export default function HomePage() {
  const studies = listStudies()
  return (
    <div className="shell py-8">
      <div className="row justify-between">
        <div>
          <h1 className="screen-title">Rollouts</h1>
          <p className="screen-note">Each rollout runs from the metric you care about to a keep, expand, or cut.</p>
        </div>
        <Link href="/studies/new" className="btn">
          New rollout
        </Link>
      </div>
      <div className="work-table-wrap mt-6">
        <table className="work">
          <thead>
            <tr>
              <th>Rollout</th>
              <th>Company</th>
              <th>Where it is</th>
              <th>Outcome</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {studies.map((study) => {
              const report = analyze(study)
              const where = stage(study)
              const weeks = weekCounts(study)
              const ready = report.primary?.did != null && study.metricsLocked && study.design.locked
              const badge = dataBadge(study)
              const tone = `status-dot ${where.tone}`
              return (
                <tr key={study.id}>
                  <td>
                    <Link href={`/studies/${study.id}`}>{study.name}</Link>
                    <span className="block text-sm text-muted">
                      {FUNCTION_LABEL[study.functionId]} · {study.tool}
                    </span>
                  </td>
                  <td>{study.company}</td>
                  <td>
                    <span className="status">
                      <span className={tone} />
                      {where.label}
                    </span>
                    <span className="block text-sm text-muted">
                      {weeks.pre} weeks before · {weeks.post} after
                    </span>
                  </td>
                  <td className={ready ? `decision-${report.decision}` : "text-muted"}>{ready ? report.title : "Not yet"}</td>
                  <td>
                    <span className="quiet">{badge.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <ResetDemos />
      </div>
    </div>
  )
}
