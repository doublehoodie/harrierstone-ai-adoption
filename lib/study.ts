import { todayISO } from "./dates"
import { getTemplate, toMetric } from "./templates"
import type { FunctionId, InvestmentKind, Study } from "./types"

export function slug(value: string): string {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return cleaned || "group"
}

export function blankStudy(input: {
  company: string
  name: string
  functionId: FunctionId
  investmentKind: InvestmentKind
  tool: string
  summary?: string
  population: string
  owner: string
  rolloutDate?: string
}): Study {
  const template = getTemplate(input.functionId)
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    demo: false,
    company: input.company.trim(),
    name: input.name.trim(),
    functionId: input.functionId,
    investmentKind: input.investmentKind,
    tool: input.tool.trim(),
    summary: (input.summary ?? "").trim(),
    population: input.population.trim(),
    owner: input.owner.trim(),
    privacyFloor: 5,
    weeklyLoadedCost: template.defaultWeeklyLoadedCost,
    otherSpend: 0,
    createdAt: now,
    roles: [],
    teams: [],
    metrics: template.metrics.map(toMetric),
    primaryMetricId: template.primaryMetricId,
    metricsLocked: false,
    registeredAt: null,
    design: {
      type: "comparison",
      rolloutDate: input.rolloutDate || todayISO(),
      secondWaveDate: null,
      plannedPostWeeks: 8,
      practicalEffectPct: 0.1,
      locked: false,
      lockedAt: null,
      expandIntoControl: true,
      retrospective: false,
    },
    outcomes: [],
    usage: [],
    agents: [],
    bands: [],
    pulses: [],
    pulseSkipped: false,
    noticePlanned: false,
    amendments: [],
    origin: { org: "none", outcomes: "none", usage: "none", pulse: "none" },
  }
}

export function applyTemplateMetrics(study: Study): void {
  const template = getTemplate(study.functionId)
  study.metrics = template.metrics.map(toMetric)
  study.primaryMetricId = template.primaryMetricId
  study.weeklyLoadedCost = template.defaultWeeklyLoadedCost
}
