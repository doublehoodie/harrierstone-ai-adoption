import { addDays, isPost, isPre, longDate, shortDate } from "./dates"
import { SECTION_IDS, type SectionId, type SectionMark, type Study } from "./types"

export interface StepState {
  id: string
  href: string
  label: string
  done: boolean
  /** Saved is an outline check. Done fills the check. */
  mark: SectionMark | null
  hint: string
}

export function sectionMark(study: Study, id: SectionId): SectionMark | null {
  const value = study.sections?.[id]
  if (value === "saved" || value === "done") return value
  if (study.demo && study.sections == null) return "done"
  return null
}

export function sectionsMarkedDone(study: Study): boolean {
  return SECTION_IDS.every((id) => sectionMark(study, id) === "done")
}

export function windowClosed(study: Study): boolean {
  const planned = study.design.plannedPostWeeks
  if (!planned) return false
  return weekCounts(study).post >= planned
}

export function rolloutFinished(study: Study): boolean {
  return windowClosed(study) && study.metricsLocked && study.design.locked
}

export type RolloutPhase = "draft" | "live" | "paused" | "ended"

export function rolloutPhase(study: Study): RolloutPhase {
  if (rolloutFinished(study)) return "ended"
  if (study.pausedAt) return "paused"
  if (study.wentLiveAt || liveLabel(study)) return "live"
  return "draft"
}

/** Label for a rollout that is live. A finished window stays quiet. */
export function liveLabel(study: Study): string | null {
  if (rolloutFinished(study)) return null
  const post = weekCounts(study).post
  if (study.design.locked && (post > 0 || study.openWeek)) {
    const current = study.openWeek ? post + 1 : post
    return `Week ${current} of ${study.design.plannedPostWeeks}`
  }
  if (study.wentLiveAt) return "Live"
  return null
}

function metricPeriods(study: Study): string[] {
  const metricId = study.primaryMetricId
  if (!metricId) return []
  return [...new Set(study.outcomes.filter((point) => point.metricId === metricId).map((point) => point.period))].sort()
}

export function weekCounts(study: Study): { pre: number; post: number } {
  const periods = splitPeriods(study, metricPeriods(study))
  return { pre: periods.pre.length, post: periods.post.length }
}

/** Calendar span of the primary metric, through the end of each recorded week. */
export function measuredSpans(study: Study): { before: string | null; after: string | null } {
  const periods = splitPeriods(study, metricPeriods(study))
  return {
    before: periods.pre.length ? spanThroughWeek(periods.pre[0], periods.pre[periods.pre.length - 1]) : null,
    after: periods.post.length ? spanThroughWeek(periods.post[0], periods.post[periods.post.length - 1]) : null,
  }
}

function splitPeriods(study: Study, periods: string[]): { pre: string[]; post: string[] } {
  const staggered = study.design.type === "staggered"
  return {
    pre: periods.filter((period) => isPre(period, study.design.rolloutDate)),
    post: periods.filter((period) => isPost(period, study.design.rolloutDate, study.design.secondWaveDate, staggered)),
  }
}

/** One date line. A closed window is start through end. An open window is the start only. */
export function rolloutWindow(study: Study): string | null {
  if (!study.design.rolloutDate) return null
  if (windowClosed(study)) {
    const after = measuredSpans(study).after
    if (after) return after
  }
  return `Started ${longDate(study.design.rolloutDate)}`
}

function spanThroughWeek(start: string, end: string): string {
  const last = addDays(end, 6)
  if (start.slice(0, 4) === last.slice(0, 4)) return `${shortDate(start)} – ${shortDate(last)}, ${last.slice(0, 4)}`
  return `${shortDate(start)}, ${start.slice(0, 4)} – ${shortDate(last)}, ${last.slice(0, 4)}`
}

export function steps(study: Study): StepState[] {
  const id = study.id
  const gaps = study.roles.filter((role) => !role.reviewed).length
  const weeks = weekCounts(study)
  return [
    {
      id: "overview",
      href: `/studies/${id}`,
      label: "Status",
      done: false,
      mark: null,
      hint: "Where this rollout stands",
    },
    {
      id: "setup",
      href: `/studies/${id}/setup`,
      label: "Rollout",
      done: sectionMark(study, "setup") === "done",
      mark: sectionMark(study, "setup"),
      hint: study.tool || "Name what is going out",
    },
    {
      id: "roles",
      href: `/studies/${id}/roles`,
      label: "People",
      done: sectionMark(study, "roles") === "done",
      mark: sectionMark(study, "roles"),
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
      done: sectionMark(study, "outcomes") === "done",
      mark: sectionMark(study, "outcomes"),
      hint: study.metricsLocked ? "Metric agreed" : "Pick the number that matters",
    },
    {
      id: "baseline",
      href: `/studies/${id}/baseline`,
      label: "History",
      done: sectionMark(study, "baseline") === "done",
      mark: sectionMark(study, "baseline"),
      hint: weeks.pre ? `${weeks.pre} weeks on file` : "Upload the weeks before",
    },
    {
      id: "design",
      href: `/studies/${id}/design`,
      label: "Groups",
      done: sectionMark(study, "design") === "done",
      mark: sectionMark(study, "design"),
      hint: study.design.locked ? "Groups set" : "Who gets it first",
    },
    {
      id: "measure",
      href: `/studies/${id}/measure`,
      label: "Data",
      done: sectionMark(study, "measure") === "done",
      mark: sectionMark(study, "measure"),
      hint: weeks.post ? `${weeks.post} weeks in` : "Admin export or CSV",
    },
    {
      id: "decide",
      href: `/studies/${id}/decide`,
      label: "Outcome",
      done: sectionMark(study, "decide") === "done",
      mark: sectionMark(study, "decide"),
      hint: liveLabel(study) ?? "The change and the range",
    },
  ]
}

export function stage(study: Study): { label: string; tone: "good" | "warn" | "neutral" } {
  const weeks = weekCounts(study)
  if (windowClosed(study) && study.metricsLocked && study.design.locked && weeks.pre >= 2 && weeks.post >= 2) {
    return { label: "Outcome ready", tone: "good" }
  }
  const live = liveLabel(study)
  if (live) return { label: live, tone: "warn" }
  if (study.design.locked) return { label: "Measuring", tone: "warn" }
  if (study.metricsLocked) return { label: "Set the groups", tone: "neutral" }
  if (study.roles.length > 0) return { label: "Choose metrics", tone: "neutral" }
  return { label: "Setting up", tone: "neutral" }
}
