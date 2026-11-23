import { notFound } from "next/navigation"
import { RolesPanel } from "@/components/client"
import { SectionActions } from "@/components/section-actions"
import { listOccupations } from "@/lib/ontology"
import { getStudy } from "@/lib/store"

export default async function RolesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const study = getStudy(id)
  if (!study) notFound()
  return (
    <div>
      <h1 className="screen-title">People</h1>
      <p className="screen-note">Add the teams in this rollout. Titles we recognize are filled in. Anything uncertain waits until someone confirms the closest job. Results never go below the team, and groups under five stay hidden.</p>
      <div className="mt-8">
        <RolesPanel study={study} occupations={listOccupations()} />
        <SectionActions studyId={study.id} section="roles" />
      </div>
    </div>
  )
}
