import { notFound } from "next/navigation"
import { analyze } from "@/lib/analysis"
import { StatusBoard } from "@/components/status-board"
import { liveLabel, steps } from "@/lib/progress"
import { getStudy } from "@/lib/store"

export default async function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const study = getStudy(id)
  if (!study) notFound()
  const report = analyze(study)
  const flow = steps(study).filter((step) => step.id !== "overview")
  const next = flow.find((step) => !step.done) ?? flow[flow.length - 1]
  const collecting = Boolean(liveLabel(study)) && next.id === "decide"
  return (
    <StatusBoard
      study={study}
      report={report}
      steps={flow}
      nextHref={collecting ? `/studies/${study.id}/measure` : next.href}
      nextLabel={collecting ? "Add this week's data" : next.done ? "Open the outcome" : `Continue · ${next.label}`}
    />
  )
}
