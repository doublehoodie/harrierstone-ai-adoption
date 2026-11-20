import { notFound } from "next/navigation"
import { OutcomesPanel } from "@/components/client"
import { getStudy } from "@/lib/store"
import { listTemplates } from "@/lib/templates"

export default async function OutcomesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const study = getStudy(id)
  if (!study) notFound()
  return (
    <div>
      <h1 className="screen-title">Metrics</h1>
      <p className="screen-note">Pick the one number this rollout has to move, plus any others you want in the room. Agree the list before go-live. Changing it later means the outcome is no longer a decision.</p>
      <div className="mt-8">
        <OutcomesPanel study={study} templates={listTemplates()} />
      </div>
    </div>
  )
}
