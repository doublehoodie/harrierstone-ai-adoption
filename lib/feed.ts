import { addDays, shortDate } from "./dates"
import { plural } from "./format"
import { weekCounts } from "./progress"
import { repliesFor, seatSnapshot } from "./synthetic"
import type { Study } from "./types"

export interface FeedEntry {
  at: string
  when: string
  text: string
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

export function nextArrival(study: Study): string | null {
  const open = study.openWeek
  if (!open) return null
  if (open.day >= 4) return "Friday's outcome file"
  const names = ["Monday's seat file", "Tuesday's check-in", "Wednesday's replies", "Thursday's replies"]
  return names[open.day] ?? null
}

export function feed(study: Study): FeedEntry[] {
  const entries: FeedEntry[] = []
  const open = study.openWeek
  if (open) {
    for (let day = open.day; day >= 1; day -= 1) {
      const at = addDays(open.period, day - 1)
      entries.push({ at, when: `${WEEKDAYS[day - 1]} ${shortDate(at)}`, text: dayLine(study, day, open.invited, open.index) })
    }
    entries.unshift({
      at: addDays(open.period, Math.min(open.day, 4)),
      when: "Waiting",
      text: `${nextArrival(study)} has not arrived.`,
    })
  }

  const post = new Set(
    study.outcomes.filter((point) => point.period >= study.design.rolloutDate).map((point) => point.period),
  )
  const closed = [...post].sort((a, b) => b.localeCompare(a))
  for (const period of closed) {
    const teams = new Set(study.outcomes.filter((point) => point.period === period).map((point) => point.teamId))
    const usage = study.usage.filter((point) => point.period === period)
    const active = usage.reduce((sum, point) => sum + point.activeUsers, 0)
    const seats = study.teams
      .filter((team) => usage.some((point) => point.teamId === team.id))
      .reduce((sum, team) => sum + team.headcount, 0)
    const seat = seats > 0 ? ` ${active} of ${plural(seats, "seat")} were used.` : ""
    entries.push({
      at: period,
      when: shortDate(period),
      text: `Week closed. Outcome file for ${plural(teams.size, "team")}.${seat}`,
    })
  }

  const baseline = study.pulses.find((wave) => wave.kind === "baseline")
  if (baseline) {
    entries.push({
      at: baseline.sentAt,
      when: shortDate(baseline.sentAt),
      text: `Baseline check-in closed. ${baseline.responses} of ${plural(baseline.invited, "person")} replied.`,
    })
  }
  if (study.design.lockedAt) {
    entries.push({
      at: study.design.lockedAt,
      when: shortDate(study.design.lockedAt),
      text: "Groups locked. First wave and hold-back stay as agreed.",
    })
  }
  if (study.registeredAt) {
    entries.push({
      at: study.registeredAt,
      when: shortDate(study.registeredAt),
      text: "The metric was agreed. It stays the metric through the planned weeks.",
    })
  }
  for (const role of study.roles) {
    if (role.headcount > 0 && role.headcount < study.privacyFloor) {
      entries.push({
        at: study.design.rolloutDate,
        when: shortDate(study.design.rolloutDate),
        text: `${role.title} is ${plural(role.headcount, "person")}, under ${study.privacyFloor}, so that title stays out of the result.`,
      })
    }
  }

  const weeks = weekCounts(study)
  if (!open && weeks.post >= study.design.plannedPostWeeks && weeks.post > 0) {
    const last = closed[0]
    if (last) {
      entries.unshift({
        at: last,
        when: shortDate(last),
        text: "The planned window is complete. The decision can be read.",
      })
    }
  }

  return entries.slice(0, 14)
}

function dayLine(study: Study, day: number, invited: number, index: number): string {
  if (day === 1) {
    const seats = seatSnapshot(study, index)
    if (!seats) return "Monday's usage file is in."
    return `Seat file is in. ${seats.active} of ${plural(seats.seats, "seat")} were used.`
  }
  if (day === 2) return `Check-in sent to ${plural(invited, "person")} in the first wave.`
  const replies = repliesFor(day, invited)
  if (day === 3) return `${replies} check-in replies so far.`
  return `${replies} of ${plural(invited, "person")} have replied. The check-in is still open.`
}
