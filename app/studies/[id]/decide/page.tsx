import { notFound } from "next/navigation"
import { analyze } from "@/lib/analysis"
import { DecisionView } from "@/components/decision-view"
import { SectionActions } from "@/components/section-actions"
import { getStudy } from "@/lib/store"

export default async function DecidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const study = getStudy(id)
  if (!study) notFound()
  return (
    <div>
      <DecisionView study={study} report={analyze(study)} />
      <SectionActions studyId={study.id} section="decide" />
    </div>
  )
}
