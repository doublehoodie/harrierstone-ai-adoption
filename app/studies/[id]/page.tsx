import { notFound } from "next/navigation"
import { analyze } from "@/lib/analysis"
import { StatusBoard } from "@/components/status-board"
import { steps } from "@/lib/progress"
import { getStudy } from "@/lib/store"

export default async function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const study = getStudy(id)
  if (!study) notFound()
  const report = analyze(study)
  const flow = steps(study).filter((step) => step.id !== "overview")
  const next = flow.find((step) => !step.done) ?? flow[flow.length - 1]
  return (
    <StatusBoard
      study={study}
      report={report}
      steps={flow}
      nextHref={next.href}
      nextLabel={next.done ? "Open the outcome" : `Continue · ${next.label}`}
    />
  )
}
