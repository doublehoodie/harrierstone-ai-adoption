"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { goLive } from "@/app/actions"
import type { RolloutPhase, StepState } from "@/lib/progress"
import { StudyMenu } from "./study-menu"
import { Status, useRunner } from "./use-runner"

export function StudyNav({
  steps,
  studyId,
  phase,
}: {
  steps: StepState[]
  studyId: string
  phase: RolloutPhase
}) {
  const path = usePathname()
  const { run, pending, error, warnings } = useRunner()
  const [confirming, setConfirming] = useState(false)
  const unmarked = steps.filter((step) => step.id !== "overview" && step.mark !== "done")
  function sendLive() {
    setConfirming(false)
    run(() => goLive(studyId))
  }
  return (
    <nav aria-label="Study steps" className="study-side">
      <ol className="study-nav study-progress">
        {steps.map((step) => {
          const active = path === step.href
          const marked = step.mark === "saved" || step.mark === "done"
          return (
            <li key={step.id} className={step.done ? "progress-step done" : "progress-step"}>
              <Link href={step.href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>
                <span className={step.mark === "done" ? "progress-mark done" : step.mark === "saved" ? "progress-mark saved" : "progress-mark"} aria-hidden="true">
                  {marked && <Check saved={step.mark === "saved"} />}
                </span>
                <span>
                  <span className="nav-label">
                    {step.label}
                    {step.mark === "done" && <span className="sr-only">, marked as done</span>}
                    {step.mark === "saved" && <span className="sr-only">, saved</span>}
                  </span>
                  {step.id !== "overview" && <span className="nav-hint">{step.hint}</span>}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
      <div className="study-live">
        <div className="row justify-between">
          {phase === "ended" && (
            <p className="rollout-flag ended">
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <rect x="5.35" y="5.35" width="5.3" height="5.3" rx="0.5" fill="currentColor" />
              </svg>
              Ended
            </p>
          )}
          {phase === "live" && (
            <p className="rollout-flag live">
              <span className="status-dot good" />
              Live
            </p>
          )}
          {phase === "paused" && (
            <p className="rollout-flag paused">
              <span className="status-dot warn" />
              Paused
            </p>
          )}
          {phase === "draft" && !confirming && (
            <button
              type="button"
              className="btn"
              disabled={pending}
              onClick={() => {
                if (unmarked.length > 0) setConfirming(true)
                else sendLive()
              }}
            >
              Go live
            </button>
          )}
          {(phase === "live" || phase === "paused") && <StudyMenu studyId={studyId} phase={phase} canDelete={false} />}
        </div>
        {phase === "draft" && confirming && (
          <div className="stack">
            <p className="text-sm">Some sections are not marked as done. Go live anyway?</p>
            <div className="row">
              <button type="button" className="btn" disabled={pending} onClick={sendLive}>
                Go live anyway
              </button>
              <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => setConfirming(false)}>
                Stay here
              </button>
            </div>
          </div>
        )}
        <Status error={error} warnings={warnings} />
      </div>
    </nav>
  )
}

function Check({ saved }: { saved: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      {saved && <path d="M3.2 8.3 6.4 11.4 12.8 4.6" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />}
      <path d="M3.2 8.3 6.4 11.4 12.8 4.6" stroke={saved ? "white" : "currentColor"} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
