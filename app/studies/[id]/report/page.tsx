import { notFound } from "next/navigation"
import { analyze } from "@/lib/analysis"
import { DecisionView } from "@/components/decision-view"
import { getStudy } from "@/lib/store"

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const study = getStudy(id)
  if (!study) notFound()
  return <DecisionView study={study} report={analyze(study)} reportPage />
}
