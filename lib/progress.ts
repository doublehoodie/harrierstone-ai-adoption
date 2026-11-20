import { isPost, isPre } from "./dates"
import type { Study } from "./types"

export interface StepState {
  id: string
  href: string
  label: string
  done: boolean
  hint: string
}

export function weekCounts(study: Study): { pre: number; post: number } {
  const metricId = study.primaryMetricId
  if (!metricId) return { pre: 0, post: 0 }
  const periods = [...new Set(study.outcomes.filter((point) => point.metricId === metricId).map((point) => point.period))]
  const staggered = study.design.type === "staggered"
  return {
    pre: periods.filter((period) => isPre(period, study.design.rolloutDate)).length,
    post: periods.filter((period) => isPost(period, study.design.rolloutDate, study.design.secondWaveDate, staggered)).length,
  }
}

export function steps(study: Study): StepState[] {
  const id = study.id
  const gaps = study.roles.filter((role) => !role.reviewed).length
  const weeks = weekCounts(study)
  const pulse = study.pulses.some((wave) => wave.kind === "baseline") || study.pulseSkipped
  return [
    {
      id: "overview",
      href: `/studies/${id}`,
      label: "Status",
      done: true,
      hint: "Where this rollout stands",
    },
    {
      id: "setup",
      href: `/studies/${id}/setup`,
      label: "Rollout",
      done: Boolean(study.company && study.name && study.tool),
      hint: study.tool || "Name what is going out",
    },
    {
      id: "roles",
      href: `/studies/${id}/roles`,
      label: "People",
      done: study.roles.length > 0 && gaps === 0,
      hint:
        study.roles.length === 0
          ? "Add the teams"
          : gaps === 1
            ? "1 title to confirm"
            : gaps
              ? `${gaps} titles to confirm`
              : "Titles confirmed",
    },
    {
      id: "outcomes",
      href: `/studies/${id}/outcomes`,
      label: "Metrics",
      done: study.metricsLocked,
      hint: study.metricsLocked ? "Metric agreed" : "Pick the number that matters",
    },
    {
      id: "baseline",
      href: `/studies/${id}/baseline`,
      label: "History",
      done: weeks.pre >= 4 && pulse,
      hint: weeks.pre ? `${weeks.pre} weeks on file` : "Upload the weeks before",
    },
    {
      id: "design",
      href: `/studies/${id}/design`,
      label: "Groups",
      done: study.design.locked,
      hint: study.design.locked ? "Groups set" : "Who gets it first",
    },
    {
      id: "measure",
      href: `/studies/${id}/measure`,
      label: "Data",
      done: weeks.post >= 2,
      hint: weeks.post ? `${weeks.post} weeks in` : "Admin export or CSV",
    },
    {
      id: "decide",
      href: `/studies/${id}/decide`,
      label: "Outcome",
      done: study.metricsLocked && study.design.locked && weeks.pre >= 2 && weeks.post >= 2,
      hint: "Keep, expand, or cut",
    },
  ]
}

export function dataBadge(study: Study): { label: string; tone: "demo" | "mixed" | "live" | "empty" } {
  if (study.demo) return { label: "Sample", tone: "demo" }
  const origins = [study.origin.org, study.origin.outcomes, study.origin.usage, study.origin.pulse]
  if (origins.every((origin) => origin === "none")) return { label: "No data yet", tone: "empty" }
  if (origins.some((origin) => origin === "synthetic")) return { label: "Sample numbers", tone: "mixed" }
  return { label: "Your data", tone: "live" }
}

export function stage(study: Study): { label: string; tone: "good" | "warn" | "neutral" } {
  const weeks = weekCounts(study)
  if (study.metricsLocked && study.design.locked && weeks.pre >= 2 && weeks.post >= 2) {
    return { label: "Outcome ready", tone: "good" }
  }
  if (study.design.locked) return { label: "Measuring", tone: "warn" }
  if (study.metricsLocked) return { label: "Set the groups", tone: "neutral" }
  if (study.roles.length > 0) return { label: "Choose metrics", tone: "neutral" }
  return { label: "Setting up", tone: "neutral" }
}
