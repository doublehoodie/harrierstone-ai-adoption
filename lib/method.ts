import { shortDate } from "./dates"
import { weekCounts } from "./progress"
import type { CheckIn, OpenWeek, Study } from "./types"

export function lockPhrase(lockedOn: string | null, rollout: string, retrospective = false): string {
  if (!lockedOn) return "Locked"
  const day = lockedOn.slice(0, 10)
  if (retrospective) return `Locked on ${day}, after measurement data was already in`
  if (day < rollout) return `Locked on ${day}, before go-live`
  return `Locked on ${day}`
}

export function lockedBeforeGoLive(study: Study): boolean {
  const rollout = study.design.rolloutDate
  const agreed = study.registeredAt?.slice(0, 10)
  const groups = study.design.lockedAt?.slice(0, 10)
  return Boolean(
    study.metricsLocked &&
      study.design.locked &&
      !study.design.retrospective &&
      agreed &&
      groups &&
      agreed < rollout &&
      groups < rollout &&
      weekCounts(study).pre >= 4,
  )
}

export function methodFacts(study: Study): string[] {
  const rollout = study.design.rolloutDate
  const facts: string[] = []
  const agreed = study.registeredAt?.slice(0, 10) ?? null
  if (study.metricsLocked && agreed) {
    facts.push(
      agreed < rollout
        ? `The metric was agreed on ${agreed}, before go-live on ${rollout}. It stays fixed.`
        : `The metric was agreed on ${agreed}. Go-live was ${rollout}.`,
    )
  } else {
    facts.push("The metric is not agreed yet.")
  }
  const locked = study.design.lockedAt?.slice(0, 10) ?? null
  if (study.design.locked && locked) {
    if (study.design.retrospective) {
      facts.push(`The groups were locked on ${locked}, after measurement data was already in.`)
    } else if (locked < rollout) {
      facts.push("The groups were locked before go-live. The first wave and the hold-back stay as agreed.")
    } else {
      facts.push(`The groups were locked on ${locked}.`)
    }
  } else {
    facts.push("The groups are not locked.")
  }
  const pre = weekCounts(study).pre
  facts.push(pre > 0 ? `${pre} baseline ${pre === 1 ? "week is" : "weeks are"} on file from before go-live.` : "No baseline weeks are on file yet.")
  facts.push(`Results are reported for groups of ${study.privacyFloor} or more. No result names a person.`)
  return facts
}

export interface CourseRow {
  period: string
  when: string
  outcome: string
  seats: string
  checkIn: string
}

export function courseOf(study: Study): CourseRow[] {
  const metric = study.primaryMetricId
  const periods = new Set<string>()
  for (const point of study.outcomes) {
    if (point.metricId === metric) periods.add(point.period)
  }
  for (const point of study.usage) periods.add(point.period)
  for (const row of study.checkIns ?? []) periods.add(row.period)
  if (study.openWeek) periods.add(study.openWeek.period)

  return [...periods].sort().map((period) => {
    const teams = new Set(
      study.outcomes
        .filter((point) => point.period === period && point.metricId === metric && point.n >= study.privacyFloor)
        .map((point) => point.teamId),
    )
    const usage = study.usage.filter((point) => point.period === period)
    const seatTeams = study.teams.filter(
      (team) => team.headcount >= study.privacyFloor && usage.some((point) => point.teamId === team.id),
    )
    const seatCount = seatTeams.reduce((sum, team) => sum + team.headcount, 0)
    const active = usage
      .filter((point) => seatTeams.some((team) => team.id === point.teamId))
      .reduce((sum, point) => sum + point.activeUsers, 0)
    const open = study.openWeek?.period === period ? study.openWeek : null
    const check = (study.checkIns ?? []).find((row) => row.period === period)
    return {
      period,
      when: shortDate(period),
      outcome: teams.size === 0 ? "—" : teams.size === 1 ? "1 team" : `${teams.size} teams`,
      seats: seatLine(study, usage.length, seatCount, active),
      checkIn: checkInLine(study.privacyFloor, check, open),
    }
  })
}

function seatLine(study: Study, rows: number, seats: number, active: number): string {
  if (rows === 0) return "—"
  if (seats < study.privacyFloor) return "Hidden"
  return `${active} of ${seats}`
}

function checkInLine(floor: number, check: CheckIn | undefined, open: OpenWeek | null): string {
  if (open) {
    if (open.day < 2) return "Not sent"
    if (open.invited < floor) return "Hidden"
    return `${open.replies} of ${open.invited}, open`
  }
  if (!check) return "—"
  if (check.invited < floor) return "Hidden"
  return `${check.replies} of ${check.invited}`
}
