import Link from "next/link"
import { notFound } from "next/navigation"
import { MeasurePanel } from "@/components/client"
import { SectionActions } from "@/components/section-actions"
import { ConnectorList } from "@/components/connector-list"
import { connectableSources } from "@/lib/connectors"
import { weekCounts } from "@/lib/progress"
import { getStudy, getWorkspace } from "@/lib/store"

export default async function MeasurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const study = getStudy(id)
  if (!study) notFound()
  const weeks = weekCounts(study)
  const workspace = getWorkspace()
  return (
    <div>
      <h1 className="screen-title">Data</h1>
      <p className="screen-note">
        {weeks.post > 0 ? `${weeks.post} weeks since the rollout are on file.` : "Nothing since the rollout is on file yet."} Bring the file in below, or use a source that is already connected. Usage says who used it. The metric you agreed is the result.
      </p>
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
