import { notFound } from "next/navigation"
import { DeleteStudy, SetupForm } from "@/components/client"
import { getStudy } from "@/lib/store"

export default async function SetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const study = getStudy(id)
  if (!study) notFound()
  return (
    <div>
      <h1 className="screen-title">Rollout</h1>
      <p className="screen-note">What is going out, who it is for, and the day people get it. Changing the team before the metric is agreed replaces the suggested metrics.</p>
      <div className="mt-8 max-w-3xl stack">
        <SetupForm study={study} />
        {!study.demo && <DeleteStudy id={study.id} />}
      </div>
    </div>
  )
}
