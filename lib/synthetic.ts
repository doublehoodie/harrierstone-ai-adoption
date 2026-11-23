import { addDays, daysBetween, mondayOf, todayISO, weeksFrom } from "./dates"
import { gaussian, hashSeed, mulberry32 } from "./rng"
import { addExtraRole, installOrg } from "./org"
import { getTemplate } from "./templates"
import { SECTION_IDS, type Arm, type FunctionId, type InvestmentKind, type Origin, type SegmentId, type Study, type TemplateMetric } from "./types"
import { blankStudy } from "./study"

export interface RosterRow {
  title: string
  team: string
  headcount: number
  arm?: Arm | "unassigned"
}

export const ROSTERS: Record<FunctionId, RosterRow[]> = {
  engineering: [
    { title: "Software Engineer", team: "Platform", headcount: 36 },
    { title: "Software Engineer", team: "Product", headcount: 28 },
    { title: "Data Engineer", team: "Data", headcount: 16 },
    { title: "Mobile Engineer", team: "Mobile", headcount: 18 },
    { title: "Security Engineer", team: "Security", headcount: 12 },
    { title: "Site Reliability Engineer", team: "Reliability", headcount: 14 },
  ],
  support: [
    { title: "Customer Support Specialist", team: "Billing", headcount: 24 },
    { title: "Customer Support Specialist", team: "Orders", headcount: 20 },
    { title: "Customer Support Specialist", team: "Trust", headcount: 16 },
    { title: "Customer Support Specialist", team: "Logistics", headcount: 18 },
  ],
  hr: [
    { title: "Recruiter", team: "Recruiting", headcount: 9 },
    { title: "Compensation Specialist", team: "Total rewards", headcount: 8 },
    { title: "People Operations", team: "People ops", headcount: 7 },
    { title: "Training Specialist", team: "Learning", headcount: 6 },
  ],
  sales: [
    { title: "Account Executive", team: "East", headcount: 28 },
    { title: "Account Executive", team: "West", headcount: 26 },
    { title: "Account Executive", team: "Central", headcount: 24 },
    { title: "Account Executive", team: "Public sector", headcount: 22 },
  ],
  finance: [
    { title: "Accountant", team: "Close", headcount: 14 },
    { title: "Financial Analyst", team: "FP&A", headcount: 11 },
    { title: "Bookkeeper", team: "Payables", headcount: 16 },
    { title: "Accountant", team: "Revenue", headcount: 12 },
  ],
  marketing: [
    { title: "Product Marketing", team: "Product marketing", headcount: 12 },
    { title: "Demand Gen", team: "Demand", headcount: 15 },
    { title: "Content Marketing", team: "Content", headcount: 10 },
    { title: "Marketing Manager", team: "Brand", headcount: 8 },
  ],
}

const ARM_PLAN: Record<FunctionId, Record<string, Arm>> = {
  engineering: { Platform: "treatment", Product: "treatment", Data: "treatment", Mobile: "control", Security: "control", Reliability: "control" },
  support: { Billing: "treatment", Orders: "treatment", Trust: "control", Logistics: "control" },
  hr: { Recruiting: "treatment", "Total rewards": "treatment", "People ops": "control", Learning: "control" },
  sales: { East: "treatment", West: "treatment", Central: "control", "Public sector": "control" },
  finance: { Close: "treatment", "FP&A": "treatment", Payables: "control", Revenue: "control" },
  marketing: { "Product marketing": "treatment", Demand: "treatment", Content: "control", Brand: "control" },
}

export function loadSampleOrg(study: Study): void {
  installOrg(study, ROSTERS[study.functionId], "synthetic")
  if (study.functionId === "engineering") {
    addExtraRole(study, "Engineering Manager", 12)
    addExtraRole(study, "QA Engineer", 10)
    addExtraRole(study, "Developer Advocate", 4)
  }
}

export function fillBaseline(study: Study): void {
  const template = getTemplate(study.functionId)
  const preStart = addDays(study.design.rolloutDate, -8 * 7)
  const periods = weeksFrom(preStart, 8)
  const kept = study.outcomes.filter((point) => point.period >= study.design.rolloutDate)
  const next = [...kept]
  for (const metric of template.metrics) {
    if (!study.metrics.some((item) => item.id === metric.id)) continue
    for (const team of study.teams) {
      if (team.headcount < study.privacyFloor) continue
      periods.forEach((period, index) => {
        next.push({
          period,
          teamId: team.id,
          metricId: metric.id,
          value: roundMetric(metric, draw(metric.demo.baseline, metric.demo.noise, `${study.id}:${team.id}:${metric.id}:pre:${index}`)),
          n: team.headcount,
        })
      })
    }
  }
  study.outcomes = next
  study.origin.outcomes = "synthetic"
}

export function fillMeasurement(study: Study, weeks?: number): void {
  const count = weeks ?? (study.design.plannedPostWeeks || 8)
  const template = getTemplate(study.functionId)
  const periods = weeksFrom(study.design.rolloutDate, count)
  const kept = study.outcomes.filter((point) => point.period < study.design.rolloutDate)
  const next = [...kept]
  for (const metric of template.metrics) {
    if (!study.metrics.some((item) => item.id === metric.id)) continue
    for (const team of study.teams) {
      if (team.arm === "unassigned" || team.headcount < study.privacyFloor) continue
      const shift = team.arm === "treatment" ? metric.demo.treatShift : metric.demo.controlShift
      periods.forEach((period, index) => {
        next.push({
          period,
          teamId: team.id,
          metricId: metric.id,
          value: roundMetric(metric, draw(metric.demo.baseline + shift, metric.demo.noise, `${study.id}:${team.id}:${metric.id}:post:${index}`)),
          n: team.headcount,
        })
      })
    }
  }
  study.outcomes = next
  study.origin.outcomes = "synthetic"
  writeUsage(study, periods)
  writeAgent(study, periods)
  writeBands(study)
  if (count >= (study.design.plannedPostWeeks || count)) {
    writePulse(study, "followup", periods[periods.length - 1] ?? study.design.rolloutDate)
  }
}

const REPLY_RATE = [0, 0, 0.18, 0.33, 0.47]

export function repliesFor(day: number, invited: number): number {
  return Math.round(invited * (REPLY_RATE[day] ?? 0))
}

export function seatSnapshot(study: Study, index: number): { active: number; seats: number } | null {
  if (study.investmentKind === "agent" || study.investmentKind === "training") return null
  let active = 0
  let seats = 0
  for (const team of study.teams) {
    if (team.arm !== "treatment") continue
    const jitter = gaussian(mulberry32(hashSeed(`${team.id}:use:${index}`)))
    const rate = Math.min(0.95, Math.max(0.35, 0.7 + jitter * 0.04))
    active += Math.round(team.headcount * rate)
    seats += team.headcount
  }
  if (seats === 0) return null
  return { active, seats }
}

export function appendPostWeek(study: Study, index: number): void {
  const period = addDays(study.design.rolloutDate, index * 7)
  if (study.outcomes.some((point) => point.period === period)) return
  const template = getTemplate(study.functionId)
  for (const metric of template.metrics) {
    if (!study.metrics.some((item) => item.id === metric.id)) continue
    for (const team of study.teams) {
      if (team.arm === "unassigned" || team.headcount < study.privacyFloor) continue
      const shift = team.arm === "treatment" ? metric.demo.treatShift : metric.demo.controlShift
      study.outcomes.push({
        period,
        teamId: team.id,
        metricId: metric.id,
        value: roundMetric(metric, draw(metric.demo.baseline + shift, metric.demo.noise, `${study.id}:${team.id}:${metric.id}:post:${index}`)),
        n: team.headcount,
      })
    }
  }
  appendUsageWeek(study, period, index)
  appendAgentWeek(study, period)
  study.origin.outcomes = "synthetic"
}

function appendUsageWeek(study: Study, period: string, index: number): void {
  if (study.investmentKind === "agent" || study.investmentKind === "training") return
  const monthly = study.functionId === "sales" ? 65 : 39
  study.usage = study.usage.filter((point) => point.period !== period)
  for (const team of study.teams) {
    if (team.arm !== "treatment") continue
    const jitter = gaussian(mulberry32(hashSeed(`${team.id}:use:${index}`)))
    const rate = Math.min(0.95, Math.max(0.35, 0.7 + jitter * 0.04))
    study.usage.push({
      period,
      teamId: team.id,
      activeUsers: Math.round(team.headcount * rate),
      sessionsPerUser: Math.round((8 + jitter) * 10) / 10,
      breadth: Math.round(Math.min(0.9, Math.max(0.2, 0.52 + jitter * 0.05)) * 100) / 100,
      seatCost: Math.round(team.headcount * monthly * (12 / 52)),
      tokenCost: Math.round(team.headcount * 2.1),
    })
  }
  study.origin.usage = "synthetic"
}

function appendAgentWeek(study: Study, period: string): void {
  if (study.investmentKind !== "agent" && study.investmentKind !== "mixed") return
  const metric = study.metrics.find((item) => item.costDenominator)
  if (!metric) return
  const teams = study.teams.filter((team) => team.arm === "treatment")
  if (teams.length === 0) return
  study.agents = study.agents.filter((point) => point.period !== period)
  for (const team of teams) {
    study.agents.push({
      period,
      agent: study.tool || "Agent",
      teamId: team.id,
      spend: Math.round(1400 / teams.length),
      units: team.headcount * 8,
      metricId: metric.id,
    })
  }
}

/** File the next weekday of an open measurement week. The fifth filing closes that week onto the chart. */
export function fileNextDay(study: Study): string {
  const open = study.openWeek
  if (!open) return "This rollout is not waiting on another file."
  if (open.day >= 4) {
    appendPostWeek(study, open.index)
    const next = open.index + 1
    if (next >= study.design.plannedPostWeeks) {
      study.openWeek = undefined
      return "That outcome file closed the last planned week. The decision can be read."
    }
    study.openWeek = {
      period: addDays(study.design.rolloutDate, next * 7),
      index: next,
      day: 0,
      invited: open.invited,
      replies: 0,
    }
    return "That outcome file closed the week. It is now on the chart. The next week has not started arriving."
  }
  open.day += 1
  open.replies = repliesFor(open.day, open.invited)
  if (open.day >= 2 && open.invited > 0) {
    writePulse(study, "followup", addDays(open.period, 1), open.replies / open.invited)
  }
  if (open.day === 1) return "Monday's seat file is in."
  if (open.day === 2) return "The check-in went out to the first wave."
  if (open.day === 3) return "More check-in replies came in."
  return "Replies are still arriving. The outcome file has not closed the week."
}

export function writePulse(
  study: Study,
  kind: "baseline" | "followup",
  sentAt: string,
  rate = 0.58,
  channel?: "email" | "slack",
): void {
  const template = getTemplate(study.functionId)
  let counted = study.teams.filter((team) => team.arm === "treatment" || team.arm === "control")
  let pooled = false
  if (counted.reduce((sum, team) => sum + team.headcount, 0) === 0) {
    counted = study.teams
      .filter((team) => team.headcount >= study.privacyFloor)
      .map((team) => ({ ...team, arm: "treatment" as const }))
    pooled = true
  }
  const invited = counted.reduce((sum, team) => sum + team.headcount, 0)
  if (invited === 0) return
  const responses = Math.round(invited * rate)
  const chosen = channel ?? (study.investmentKind === "agent" ? "slack" : "email")
  const scores = []
  const suppressed = []
  for (const item of template.pulse) {
    for (const arm of ["treatment", "control"] as const) {
      const head = counted.filter((team) => team.arm === arm).reduce((sum, team) => sum + team.headcount, 0)
      const n = Math.round(responses * (head / invited))
      const base = item.construct === "Cognitive load" ? 3.5 : 3.45
      const bump = arm === "treatment" && kind === "followup" ? (item.construct === "Cognitive load" ? -0.3 : 0.25) : 0
      if (n < study.privacyFloor) {
        if (n > 0) suppressed.push({ arm, construct: item.construct, n })
        continue
      }
      scores.push({ arm, construct: item.construct, mean: Math.round((base + bump) * 100) / 100, n })
    }
  }
  study.pulses = study.pulses.filter((wave) => wave.kind !== kind)
  study.pulses.push({
    id: `${kind}-${study.id}`,
    kind,
    channel: chosen,
    sentAt,
    invited,
    responses,
    items: template.pulse,
    scores,
    suppressed,
    note: pooled ? "Groups were not assigned yet, so this wave is everyone in the study, not a rollout-versus-comparison split." : undefined,
  })
  study.origin.pulse = "synthetic"
  study.pulseSkipped = false
}

function writeUsage(study: Study, periods: string[]): void {
  if (study.investmentKind === "agent" || study.investmentKind === "training") {
    study.usage = []
    if (study.investmentKind === "training" && study.otherSpend === 0) {
      const head = study.teams.filter((team) => team.arm === "treatment").reduce((sum, team) => sum + team.headcount, 0)
      study.otherSpend = head * 500
    }
    return
  }
  const monthly = study.functionId === "sales" ? 65 : 39
  study.usage = []
  for (const team of study.teams) {
    if (team.arm !== "treatment") continue
    periods.forEach((period, index) => {
      const jitter = gaussian(mulberry32(hashSeed(`${team.id}:use:${index}`)))
      const rate = Math.min(0.95, Math.max(0.35, 0.7 + jitter * 0.04))
      study.usage.push({
        period,
        teamId: team.id,
        activeUsers: Math.round(team.headcount * rate),
        sessionsPerUser: Math.round((8 + jitter) * 10) / 10,
        breadth: Math.round(Math.min(0.9, Math.max(0.2, 0.52 + jitter * 0.05)) * 100) / 100,
        seatCost: Math.round(team.headcount * monthly * (12 / 52)),
        tokenCost: Math.round(team.headcount * 2.1),
      })
    })
  }
  study.origin.usage = "synthetic"
}

function writeAgent(study: Study, periods: string[]): void {
  study.agents = []
  if (study.investmentKind !== "agent" && study.investmentKind !== "mixed") return
  const metric = study.metrics.find((item) => item.costDenominator)
  if (!metric) return
  const teams = study.teams.filter((team) => team.arm === "treatment")
  if (teams.length === 0) return
  periods.forEach((period) => {
    teams.forEach((team) => {
      study.agents.push({
        period,
        agent: study.tool || "Agent",
        teamId: team.id,
        spend: Math.round(1400 / teams.length),
        units: team.headcount * 8,
        metricId: metric.id,
      })
    })
  })
  study.origin.usage = "synthetic"
}

function writeBands(study: Study): void {
  if (study.investmentKind === "agent" || study.investmentKind === "training") {
    study.bands = []
    return
  }
  const primary = getTemplate(study.functionId).metrics.find((metric) => metric.id === study.primaryMetricId)
  const shift = primary?.demo.treatShift ?? 0
  const plan: { segment: SegmentId; share: number; sessions: number; breadth: number; portion: number }[] = [
    { segment: "light", share: 0.34, sessions: 2.1, breadth: 0.22, portion: 0.15 },
    { segment: "selective", share: 0.4, sessions: 7.5, breadth: 0.48, portion: 0.4 },
    { segment: "embedded", share: 0.26, sessions: 14, breadth: 0.74, portion: 1 },
  ]
  study.bands = []
  for (const team of study.teams) {
    if (team.arm !== "treatment") continue
    for (const band of plan) {
      const n = Math.round(team.headcount * band.share)
      if (n < study.privacyFloor) continue
      study.bands.push({
        teamId: team.id,
        segment: band.segment,
        n,
        sessionsPerUser: band.sessions,
        breadth: band.breadth,
        primaryDelta: Math.round(shift * band.portion * 10) / 10,
      })
    }
  }
}

function draw(mean: number, noise: number, seedText: string): number {
  return mean + gaussian(mulberry32(hashSeed(seedText))) * noise
}

function roundMetric(metric: TemplateMetric, value: number): number {
  const safe = metric.unit === "share" ? Math.min(1, Math.max(0, value)) : Math.max(0, value)
  if (metric.unit === "share") return Math.round(safe * 1000) / 1000
  if (metric.unit === "score") return Math.round(safe * 100) / 100
  if (Math.abs(safe) >= 100) return Math.round(safe)
  return Math.round(safe * 100) / 100
}

interface DemoInput {
  id: string
  company: string
  name: string
  functionId: FunctionId
  investmentKind: InvestmentKind
  tool: string
  summary: string
  population: string
  owner: string
  rolloutDate: string
  expandIntoControl: boolean
  extraRoles?: { title: string; headcount: number }[]
  responseRate: number
  /** Measurement weeks to store now. Omit to fill the whole planned window. */
  postWeeks?: number
}

function buildDemo(input: DemoInput): Study {
  const study = blankStudy({
    company: input.company,
    name: input.name,
    functionId: input.functionId,
    investmentKind: input.investmentKind,
    tool: input.tool,
    summary: input.summary,
    population: input.population,
    owner: input.owner,
    rolloutDate: input.rolloutDate,
  })
  study.id = input.id
  study.demo = true
  study.design.expandIntoControl = input.expandIntoControl
  study.design.plannedPostWeeks = 10
  installOrg(
    study,
    ROSTERS[input.functionId].map((row) => ({ ...row, headcount: row.headcount })),
    "synthetic",
  )
  for (const extra of input.extraRoles ?? []) addExtraRole(study, extra.title, extra.headcount)
  const arms = ARM_PLAN[input.functionId]
  for (const team of study.teams) team.arm = arms[team.name] ?? "unassigned"
  for (const role of study.roles) role.reviewed = true
  study.metricsLocked = true
  study.registeredAt = addDays(input.rolloutDate, -21)
  study.design.locked = true
  study.design.lockedAt = addDays(input.rolloutDate, -14)
  study.design.retrospective = false
  study.noticePlanned = true
  study.sections = Object.fromEntries(SECTION_IDS.map((id) => [id, "done"]))
  const weeks = input.postWeeks ?? study.design.plannedPostWeeks
  fillBaseline(study)
  fillMeasurement(study, weeks)
  writePulse(study, "baseline", addDays(input.rolloutDate, -7), input.responseRate)
  if (weeks >= study.design.plannedPostWeeks) {
    writePulse(study, "followup", addDays(input.rolloutDate, (study.design.plannedPostWeeks - 1) * 7), input.responseRate)
  } else {
    const invited = study.teams.filter((team) => team.arm === "treatment").reduce((sum, team) => sum + team.headcount, 0)
    const period = addDays(input.rolloutDate, weeks * 7)
    const day = Math.max(0, Math.min(4, daysBetween(period, todayISO())))
    study.openWeek = { period, index: weeks, day, invited, replies: repliesFor(day, invited) }
    if (day >= 2 && invited > 0) writePulse(study, "followup", addDays(period, 1), study.openWeek.replies / invited)
  }
  return study
}

export function buildDemos(): Study[] {
  const liveMonday = mondayOf(todayISO())
  return [
    buildDemo({
      id: "meridian",
      company: "Meridian",
      name: "Cursor for platform engineering",
      functionId: "engineering",
      investmentKind: "seats",
      tool: "Cursor",
      summary: "Platform, product, and data engineering are in the first wave. Mobile, security, and reliability are held back. Ten weeks were planned. This week is still being filed.",
      population: "Platform engineering",
      owner: "VP Engineering",
      rolloutDate: addDays(liveMonday, -4 * 7),
      expandIntoControl: true,
      extraRoles: [
        { title: "Engineering Manager", headcount: 12 },
        { title: "QA Engineer", headcount: 10 },
        { title: "Developer Advocate", headcount: 4 },
      ],
      responseRate: 0.62,
      postWeeks: 4,
    }),
    buildDemo({
      id: "northwind",
      company: "Northwind Robotics",
      name: "GitHub Copilot for product engineering",
      functionId: "engineering",
      investmentKind: "seats",
      tool: "GitHub Copilot",
      summary: "Seat rollout to platform, product, and data engineering. Mobile, security, and reliability stayed on the existing workflow.",
      population: "Product engineering",
      owner: "VP Engineering",
      rolloutDate: "2026-08-17",
      expandIntoControl: true,
      extraRoles: [
        { title: "Engineering Manager", headcount: 12 },
        { title: "QA Engineer", headcount: 10 },
        { title: "Developer Advocate", headcount: 4 },
      ],
      responseRate: 0.64,
    }),
    buildDemo({
      id: "brightline",
      company: "Brightline",
      name: "Tier-1 resolution agent",
      functionId: "support",
      investmentKind: "agent",
      tool: "Resolve",
      summary: "An agent closes routine billing and orders tickets. Trust and logistics are specialist desks and are not candidates for it.",
      population: "Customer support",
      owner: "Head of Support",
      rolloutDate: "2026-08-17",
      expandIntoControl: false,
      responseRate: 0.71,
    }),
    buildDemo({
      id: "halcyon",
      company: "Halcyon",
      name: "HR assistant pilot",
      functionId: "hr",
      investmentKind: "seats",
      tool: "People Assistant",
      summary: "A small pilot for recruiting and total rewards. People ops and learning are the comparison. The groups are small and the outcome is noisy.",
      population: "People team",
      owner: "CHRO",
      rolloutDate: "2026-08-17",
      expandIntoControl: true,
      responseRate: 0.34,
    }),
    buildDemo({
      id: "lumen",
      company: "Lumen",
      name: "CRM writing assistant",
      functionId: "sales",
      investmentKind: "seats",
      tool: "Lumen Assist",
      summary: "A writing assistant for East and West. Central and public sector are the comparison. The question was whether win rate moved.",
      population: "Quota-carrying sales",
      owner: "VP Sales",
      rolloutDate: "2026-08-17",
      expandIntoControl: true,
      responseRate: 0.52,
    }),
  ]
}
