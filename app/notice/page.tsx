import { NoticeBody } from "@/components/notice"
import { PrintButton } from "@/components/client"

export default function NoticePage() {
  return (
    <div className="shell py-10">
      <div className="row no-print justify-between">
        <p className="kicker">Employee notice</p>
        <PrintButton />
      </div>
      <h1 className="page-title mt-2">What this study does with your work</h1>
      <p className="lede">A template. Open it from a study to fill in the company, the tool, and the owner.</p>
      <div className="mt-8">
        <NoticeBody />
      </div>
    </div>
  )
}
