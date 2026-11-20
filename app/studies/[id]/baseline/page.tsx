import { notFound } from "next/navigation"
import { BaselinePanel } from "@/components/client"
import { weekCounts } from "@/lib/progress"
import { getStudy } from "@/lib/store"

export default async function BaselinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const study = getStudy(id)
  if (!study) notFound()
  const weeks = weekCounts(study)
  return (
    <div>
      <h1 className="screen-title">History</h1>
      <p className="screen-note">
        {weeks.pre > 0 ? `${weeks.pre} weeks from before ${study.design.rolloutDate} are on file.` : "Nothing from before the rollout date is on file yet."} Four weeks is the minimum before you confirm who gets it first.
      </p>
      <div className="mt-8">
        <BaselinePanel study={study} />
      </div>
    </div>
  )
}
