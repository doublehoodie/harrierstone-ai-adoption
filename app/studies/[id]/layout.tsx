import Link from "next/link"
import { notFound } from "next/navigation"
import { EnginePanel } from "@/components/engine-panel"
import { StudyNav } from "@/components/study-nav"
import { rolloutPhase, stage, steps } from "@/lib/progress"
import { getStudy } from "@/lib/store"

export default async function StudyLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  const study = getStudy(id)
  if (!study) notFound()
  const where = stage(study)
  const tone = `status-dot ${where.tone}`
  return (
    <div className="study-frame">
      <div className="shell study-frame-inner">
        <div className="workspace-top no-print">
          <Link href="/rollouts" className="crumb">
            Rollouts
          </Link>
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{study.name}</p>
            <p className="text-sm text-muted">
              {study.company} · {study.tool}
            </p>
          </div>
          <span className="status">
            <span className={tone} />
            {where.label}
          </span>
        </div>
        <div className="study-shell">
          <div className="no-print">
            <StudyNav steps={steps(study)} studyId={study.id} phase={rolloutPhase(study)} />
          </div>
          <div className="study-content">
            {children}
            <EnginePanel study={study} />
          </div>
        </div>
      </div>
    </div>
  )
}
