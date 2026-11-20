import { notFound } from "next/navigation"
import { PrintButton } from "@/components/client"
import { NoticeBody } from "@/components/notice"
import { getStudy } from "@/lib/store"

export default async function StudyNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const study = getStudy(id)
  if (!study) notFound()
  return (
    <div className="shell py-10">
      <div className="row no-print justify-between">
        <p className="kicker">{study.company}</p>
        <PrintButton />
      </div>
      <h1 className="page-title mt-2">What this study does with your work</h1>
      <p className="lede">
        {study.name}. Send this before the first pulse.
      </p>
      <div className="mt-8">
        <NoticeBody study={study} />
      </div>
    </div>
  )
}
