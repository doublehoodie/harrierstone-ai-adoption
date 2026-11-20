"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icon, type IconName } from "@/components/icon"
import type { StepState } from "@/lib/progress"

const ICONS: Record<string, IconName> = {
  overview: "status",
  setup: "rollout",
  roles: "people",
  outcomes: "metrics",
  baseline: "history",
  design: "groups",
  measure: "data",
  decide: "outcome",
}

export function StudyNav({ steps }: { steps: StepState[] }) {
  const path = usePathname()
  return (
    <nav className="study-nav" aria-label="Study steps">
      {steps.map((step) => {
        const active = path === step.href
        return (
          <Link key={step.id} href={step.href} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>
            <span className={step.done && step.id !== "overview" ? "nav-icon done" : "nav-icon"}>
              <Icon name={ICONS[step.id] ?? "status"} size={16} />
            </span>
            <span>
              <span className="nav-label">{step.label}</span>
              {step.id !== "overview" && <span className="nav-hint">{step.hint}</span>}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
