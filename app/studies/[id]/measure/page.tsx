import Link from "next/link"
import { notFound } from "next/navigation"
import { MeasurePanel } from "@/components/client"
import { SectionActions } from "@/components/section-actions"
import { ConnectorList } from "@/components/connector-list"
import { connectableSources } from "@/lib/connectors"
import { courseOf } from "@/lib/method"
import { weekCounts } from "@/lib/progress"
import { getStudy, getWorkspace } from "@/lib/store"

export default async function MeasurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const study = getStudy(id)
  if (!study) notFound()
  const weeks = weekCounts(study)
  const course = courseOf(study)
  const workspace = getWorkspace()
  return (
    <div>
      <h1 className="screen-title">Data</h1>
      <p className="screen-note">
        {weeks.post > 0 ? `${weeks.post} weeks since the rollout are on file.` : "Nothing since the rollout is on file yet."} Bring the file in below, or use a source that is already connected. Seat use is a weekly total. The metric you agreed is the result.
      </p>
      {course.length > 0 && (
        <section className="card stack mt-8">
          <h2 className="font-semibold">On file</h2>
          <p className="text-sm text-muted">
            Seat use, the agreed metric, and check-ins, by week. Totals only. A group under {study.privacyFloor} is left out.
          </p>
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Outcomes</th>
                  <th>Seats used</th>
                  <th>Check-in</th>
                </tr>
              </thead>
              <tbody>
                {course.map((row) => (
                  <tr key={row.period}>
                    <td>{row.when}</td>
                    <td className="num">{row.outcome}</td>
                    <td className="num">{row.seats}</td>
                    <td className="num">{row.checkIn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <div className="mt-8">
        <MeasurePanel study={study} />
      </div>
      <section className="mt-8 stack">
        <div className="row justify-between">
          <h2 className="font-semibold">Connections</h2>
          <Link href="/settings?section=connectors" className="text-link">
            Manage in Settings
          </Link>
        </div>
        <ConnectorList sources={connectableSources()} connections={workspace.connections} fileLink />
      </section>
      <SectionActions studyId={study.id} section="measure" />
    </div>
  )
}
