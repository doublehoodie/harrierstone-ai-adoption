import { blankStudy } from "./study"
import { getTemplate } from "./templates"
import type { FunctionId, InvestmentKind, Study } from "./types"

export const KESTREL_TOKEN_CAP = 50_000

const FUNCTIONS: FunctionId[] = ["hr", "engineering", "support", "sales", "finance", "marketing"]
const KINDS: InvestmentKind[] = ["seats", "agent", "training", "mixed"]

export interface Gameplan {
  reply: string
  company: string
  name: string
  functionId: FunctionId
  investmentKind: InvestmentKind
  tool: string
  population: string
  owner: string
  rolloutDate: string
  primaryMetricId: string
  comparison: "comparison" | "staggered"
  practicalEffectPct: number
  holdBack: string
  fileNeeded: string
  questions: string[]
}

export function metricCatalog(): string {
  return getTemplate("engineering")
    ? FUNCTIONS.map((id) => {
        const template = getTemplate(id)
        const metrics = template.metrics
          .filter((metric) => !metric.id.includes("quality") && metric.id.includes("."))
          .map((metric) => `${metric.id} (${metric.name})`)
          .join(", ")
        return `${id}: ${metrics}`
      }).join("\n")
    : ""
}

export function readGameplan(value: unknown): { plan: Gameplan } | { error: string } {
  if (!value || typeof value !== "object") return { error: "Kestrel's reply could not be read." }
  const raw = value as Record<string, unknown>
  const functionId = FUNCTIONS.includes(raw.functionId as FunctionId) ? (raw.functionId as FunctionId) : null
  const investmentKind = KINDS.includes(raw.investmentKind as InvestmentKind) ? (raw.investmentKind as InvestmentKind) : null
  const comparison = raw.comparison === "staggered" ? "staggered" : raw.comparison === "comparison" ? "comparison" : null
  const effect = Number(raw.practicalEffectPct)
  const questions = Array.isArray(raw.questions) ? raw.questions.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : []
  const plan: Gameplan = {
    reply: text(raw.reply).slice(0, 1600),
    company: text(raw.company),
    name: text(raw.name),
    functionId: functionId ?? "engineering",
    investmentKind: investmentKind ?? "seats",
    tool: text(raw.tool),
    population: text(raw.population),
    owner: text(raw.owner),
    rolloutDate: text(raw.rolloutDate),
    primaryMetricId: text(raw.primaryMetricId),
    comparison: comparison ?? "comparison",
    practicalEffectPct: Number.isFinite(effect) ? Math.min(80, Math.max(1, Math.round(effect))) : 10,
    holdBack: text(raw.holdBack),
    fileNeeded: text(raw.fileNeeded),
    questions,
  }
  if (!functionId) plan.questions.push("Which function owns the work: engineering, support, HR, sales, finance, or marketing?")
  if (!investmentKind) plan.questions.push("Is this seats, an agent, a training program, or a mix?")
  if (!comparison || raw.comparison === "before_after") {
    plan.comparison = "comparison"
    plan.questions.push("Who can be held back so the weeks can be compared?")
  }
  if (!plan.company) plan.questions.push("What is the company name?")
  if (!plan.name) plan.questions.push("What should the study be called?")
  if (!plan.tool) plan.questions.push("Which tool, agent, or training program is going out?")
  if (!plan.population) plan.questions.push("Who is covered, in plain language?")
  if (!plan.owner) plan.questions.push("Who owns the rollout?")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(plan.rolloutDate)) plan.questions.push("What date does the rollout start? Use a calendar date.")
  const template = functionId ? getTemplate(functionId) : null
  const known = template?.metrics.some((metric) => metric.id === plan.primaryMetricId)
  if (!known) {
    plan.questions.push("Which metric should the decision hang on? Pick one from the list for that function.")
  }
  if (!Number.isFinite(effect)) plan.questions.push("What size of change would be enough to matter?")
  if (!plan.holdBack) plan.questions.push("Which group stays on the old way of working?")
  if (!plan.fileNeeded) plan.questions.push("Which file or system already has that metric?")
  plan.questions = [...new Set(plan.questions)]
  if (!plan.reply) {
    plan.reply = plan.questions[0] ?? "Here is the plan. Confirm it and I will create the study."
  }
  return { plan }
}

export function gameplanReady(plan: Gameplan): boolean {
  return plan.questions.length === 0
}

export function studyFromGameplan(plan: Gameplan, privacyFloor: number, practicalFallback: number): Study {
  if (!gameplanReady(plan)) throw new Error("The plan still has open questions.")
  const study = blankStudy({
    company: plan.company,
    name: plan.name,
    functionId: plan.functionId,
    investmentKind: plan.investmentKind,
    tool: plan.tool,
    population: plan.population,
    owner: plan.owner,
    summary: `${plan.reply} Hold back: ${plan.holdBack}. File: ${plan.fileNeeded}`,
    rolloutDate: plan.rolloutDate,
  })
  study.privacyFloor = Math.max(5, privacyFloor)
  study.design.type = plan.comparison
  study.design.expandIntoControl = plan.comparison === "comparison"
  study.design.practicalEffectPct = (plan.practicalEffectPct || practicalFallback) / 100
  if (study.metrics.some((metric) => metric.id === plan.primaryMetricId)) {
    study.primaryMetricId = plan.primaryMetricId
  }
  return study
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}
