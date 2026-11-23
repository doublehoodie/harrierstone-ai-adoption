"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { proposeArms } from "@/lib/analysis"
import { parseAgentCsv, parseOrgCsv, parseOutcomeCsv, parseSpendCsv, parseUsageCsv } from "@/lib/csv"
import { todayISO } from "@/lib/dates"
import { occupation } from "@/lib/ontology"
import { installOrg } from "@/lib/org"
import { rolloutFinished, weekCounts } from "@/lib/progress"
import type { ActionResult } from "@/lib/result"
import { applyTemplateMetrics, blankStudy } from "@/lib/study"
import { fileNextDay, fillBaseline, fillMeasurement, loadSampleOrg, writePulse } from "@/lib/synthetic"
import { askKestrel, kestrelTokenCap, type KestrelMessage } from "@/lib/kestrel"
import { gameplanReady, readGameplan, studyFromGameplan, type Gameplan } from "@/lib/kestrel-plan"
import { getStudy, getWorkspace, removeStudy, resetDemos, saveStudy, saveWorkspace } from "@/lib/store"
import { connectableSources } from "@/lib/connectors"
import { normalizeWorkspace } from "@/lib/workspace"
import { templateMetric, toMetric } from "@/lib/templates"
import { SECTION_IDS, type Arm, type FunctionId, type InvestmentKind, type SectionId, type Study, type StudyDesign } from "@/lib/types"

const FUNCTIONS: FunctionId[] = ["hr", "engineering", "support", "sales", "finance", "marketing"]
const KINDS: InvestmentKind[] = ["seats", "agent", "training", "mixed"]

function refresh(id?: string) {
  revalidatePath("/")
  revalidatePath("/rollouts")
  if (!id) return
  revalidatePath(`/studies/${id}`, "layout")
  revalidatePath(`/notice/${id}`)
}

function edit(id: string, change: (study: Study) => ActionResult | void): ActionResult {
  const study = getStudy(id)
  if (!study) return { ok: false, error: "That study is no longer here." }
  const result = change(study) ?? { ok: true }
  if (!result.ok) return result
  saveStudy(study)
  refresh(id)
  return result
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim()
}

function asFunction(value: string): FunctionId | null {
  return FUNCTIONS.includes(value as FunctionId) ? (value as FunctionId) : null
}

function asKind(value: string): InvestmentKind | null {
  return KINDS.includes(value as InvestmentKind) ? (value as InvestmentKind) : null
}

export async function createStudy(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const company = text(formData, "company")
  const name = text(formData, "name")
  const tool = text(formData, "tool")
  const population = text(formData, "population")
  const owner = text(formData, "owner")
  const summary = text(formData, "summary")
  const functionId = asFunction(text(formData, "functionId"))
  const investmentKind = asKind(text(formData, "investmentKind"))
  const rolloutDate = text(formData, "rolloutDate")
  if (!company || !name || !tool || !population || !owner) {
    return { ok: false, error: "Company, study name, tool, who it covers, and the owner are required." }
  }
  if (!functionId || !investmentKind) return { ok: false, error: "Choose a function and an investment type." }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rolloutDate)) return { ok: false, error: "Choose a rollout date." }
  const study = blankStudy({ company, name, functionId, investmentKind, tool, population, owner, summary, rolloutDate })
  const workspace = getWorkspace()
  study.privacyFloor = workspace.privacyFloor
  study.design.practicalEffectPct = workspace.practicalEffectPct / 100
  saveStudy(study)
  redirect(`/studies/${study.id}/roles`)
}

export async function updateSetup(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = text(formData, "id")
  return edit(id, (study) => {
    const company = text(formData, "company")
    const name = text(formData, "name")
    const tool = text(formData, "tool")
    const population = text(formData, "population")
    const owner = text(formData, "owner")
    const summary = text(formData, "summary")
    const functionId = asFunction(text(formData, "functionId"))
    const investmentKind = asKind(text(formData, "investmentKind"))
    const rolloutDate = text(formData, "rolloutDate")
    const floor = Number(text(formData, "privacyFloor"))
    if (!company || !name || !tool || !population || !owner || !functionId || !investmentKind) {
      return { ok: false, error: "Company, study name, tool, who it covers, owner, function, and investment type are required." }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rolloutDate)) return { ok: false, error: "Choose a rollout date." }
    if (!Number.isFinite(floor) || floor < 5) return { ok: false, error: "The privacy floor cannot be lower than 5." }
    if (study.design.locked && (rolloutDate !== study.design.rolloutDate || floor !== study.privacyFloor)) {
      return { ok: false, error: "Rollout date and the privacy floor are part of the locked design. Amend the design before changing them." }
    }
    if (functionId !== study.functionId) {
      if (study.metricsLocked) return { ok: false, error: "Metrics are locked. Amend the pre-registration before changing the function." }
      study.functionId = functionId
      applyTemplateMetrics(study)
    }
    study.company = company
    study.name = name
    study.tool = tool
    study.population = population
    study.owner = owner
    study.summary = summary
    study.investmentKind = investmentKind
    study.design.rolloutDate = rolloutDate
    study.privacyFloor = Math.round(floor)
  })
}

export async function uploadOrg(studyId: string, csv: string): Promise<ActionResult> {
  const parsed = parseOrgCsv(csv)
  if (parsed.rows.length === 0) return { ok: false, error: parsed.errors[0] ?? "Nothing to import." }
  return edit(studyId, (study) => {
    if (study.design.locked) {
      study.amendments.push({
        at: new Date().toISOString(),
        what: "design",
        note: "The org chart was replaced after the design was locked.",
      })
    }
    installOrg(study, parsed.rows, "upload")
    return { ok: true, warnings: ["This replaced the org chart and cleared stored outcomes.", ...parsed.warnings, ...parsed.errors] }
  })
}

export async function useSampleOrg(studyId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    if (study.design.locked) {
      study.amendments.push({
        at: new Date().toISOString(),
        what: "design",
        note: "A sample org replaced the roster after the design was locked.",
      })
    }
    loadSampleOrg(study)
    return { ok: true, warnings: ["Sample org loaded and previous outcome rows were cleared. Review every match under 75%."] }
  })
}

export async function acceptRole(studyId: string, roleId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    const role = study.roles.find((item) => item.id === roleId)
    if (!role) return { ok: false, error: "That role is not in this study." }
    if (!role.onetCode) return { ok: false, error: `Choose the closest occupation for ${role.title} before accepting it.` }
    role.reviewed = true
  })
}

export async function acceptHighConfidence(studyId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    let count = 0
    for (const role of study.roles) {
      if (role.autoMapped && role.onetCode && !role.reviewed) {
        role.reviewed = true
        count += 1
      }
    }
    if (count === 0) return { ok: false, error: "No high-confidence matches are waiting. The remaining titles need a human choice." }
  })
}

export async function setRoleMapping(studyId: string, roleId: string, code: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    const role = study.roles.find((item) => item.id === roleId)
    const occ = occupation(code)
    if (!role || !occ) return { ok: false, error: "Choose an occupation from the list." }
    if (role.onetCode !== occ.code) {
      role.overridden = true
      role.autoMapped = false
      role.confidence = 1
    }
    role.onetCode = occ.code
    role.onetTitle = occ.title
    role.tasks = occ.tasks
    role.reviewed = true
  })
}

export async function toggleMetric(studyId: string, metricId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    if (study.metricsLocked) return { ok: false, error: "Metrics are locked." }
    const existing = study.metrics.find((metric) => metric.id === metricId)
    if (existing) {
      study.metrics = study.metrics.filter((metric) => metric.id !== metricId)
      if (study.primaryMetricId === metricId) study.primaryMetricId = study.metrics[0]?.id ?? null
      return
    }
    const found = templateMetric(metricId)
    if (!found) return { ok: false, error: "That metric is not in a template." }
    study.metrics.push(toMetric(found))
  })
}

export async function setPrimary(studyId: string, metricId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    if (study.metricsLocked) return { ok: false, error: "Metrics are locked." }
    if (!study.metrics.some((metric) => metric.id === metricId)) return { ok: false, error: "Add the metric before making it primary." }
    study.primaryMetricId = metricId
  })
}

export async function addCustomMetric(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = text(formData, "id")
  return edit(id, (study) => {
    if (study.metricsLocked) return { ok: false, error: "Metrics are locked." }
    const name = text(formData, "name")
    const unit = text(formData, "unit")
    const description = text(formData, "description")
    const direction = text(formData, "direction")
    if (!name || !unit) return { ok: false, error: "A custom metric needs a name and a unit." }
    if (direction !== "higher_better" && direction !== "lower_better") return { ok: false, error: "Say whether higher or lower is better." }
    const metricId = `custom-${crypto.randomUUID().slice(0, 8)}`
    study.metrics.push({
      id: metricId,
      name,
      description: description || name,
      unit,
      direction,
      sourceHint: "Custom",
      custom: true,
      perPerson: false,
      costDenominator: false,
      costUnit: name.toLowerCase(),
    })
    study.primaryMetricId ??= metricId
  })
}

export async function lockMetrics(studyId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    if (study.metrics.length === 0) return { ok: false, error: "Choose at least one metric." }
    if (!study.primaryMetricId || !study.metrics.some((metric) => metric.id === study.primaryMetricId)) {
      return { ok: false, error: "Choose a primary metric. The decision hangs on one outcome." }
    }
    study.metricsLocked = true
    study.registeredAt = new Date().toISOString()
  })
}

export async function amendStudy(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = text(formData, "id")
  const what = text(formData, "what")
  const note = text(formData, "note")
  if (what !== "metrics" && what !== "design") return { ok: false, error: "Unknown amendment." }
  if (note.length < 8) return { ok: false, error: "Write what changed and why. A blank note is how cherry-picking starts." }
  return edit(id, (study) => {
    if (what === "metrics") study.metricsLocked = false
    if (what === "design") {
      study.design.locked = false
      study.design.retrospective = false
    }
    study.amendments.push({ at: new Date().toISOString(), what, note })
    return { ok: true, warnings: ["This study is now exploratory. The estimate describes what is on file."] }
  })
}

function paused(study: Study): ActionResult | null {
  if (!study.pausedAt) return null
  return { ok: false, error: "Collection is paused. Resume it from the rollout settings." }
}

export async function uploadOutcomes(studyId: string, csv: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    const held = paused(study)
    if (held) return held
    const parsed = parseOutcomeCsv(csv, study)
    if (parsed.points.length === 0) return { ok: false, error: parsed.errors[0] ?? "No outcome rows were usable." }
    const map = new Map(study.outcomes.map((point) => [`${point.period}|${point.teamId}|${point.metricId}`, point]))
    for (const point of parsed.points) map.set(`${point.period}|${point.teamId}|${point.metricId}`, point)
    study.outcomes = [...map.values()]
    study.origin.outcomes = "upload"
    return { ok: true, warnings: [...parsed.warnings, ...parsed.errors] }
  })
}

export async function generateBaseline(studyId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    if (!study.metricsLocked) return { ok: false, error: "Lock the metrics before generating a baseline." }
    if (study.teams.length === 0) return { ok: false, error: "Import an org first." }
    fillBaseline(study)
    return { ok: true, warnings: ["Eight synthetic baseline weeks were added for the template metrics. Custom metrics are not filled."] }
  })
}

export async function launchPulse(studyId: string, channel: "email" | "slack"): Promise<ActionResult> {
  return edit(studyId, (study) => {
    const held = paused(study)
    if (held) return held
    if (study.teams.length === 0) return { ok: false, error: "Import an org before sending a pulse." }
    const kind = study.pulses.some((wave) => wave.kind === "baseline") ? "followup" : "baseline"
    writePulse(study, kind, todayISO(), 0.58, channel)
    return {
      ok: true,
      warnings: ["This wave is simulated. Response counts are not from a real send. Connect email or Slack before relying on them."],
    }
  })
}

export async function skipPulse(studyId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    study.pulseSkipped = true
  })
}

export async function markNotice(studyId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    study.noticePlanned = true
  })
}

export async function setArm(studyId: string, teamId: string, arm: Arm | "unassigned"): Promise<ActionResult> {
  return edit(studyId, (study) => {
    if (study.design.locked) return { ok: false, error: "The design is locked. Amend it before moving a team." }
    const team = study.teams.find((item) => item.id === teamId)
    if (!team) return { ok: false, error: "Unknown team." }
    if (arm !== "unassigned" && team.headcount < study.privacyFloor) {
      return { ok: false, error: `${team.name} has ${team.headcount} people. Groups under ${study.privacyFloor} stay out of the results.` }
    }
    team.arm = arm
  })
}

export async function applyProposal(studyId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    if (study.design.locked) return { ok: false, error: "The design is locked." }
    if (study.teams.length === 0) return { ok: false, error: "Import an org first." }
    for (const row of proposeArms(study)) {
      const team = study.teams.find((item) => item.id === row.teamId)
      if (team) team.arm = row.arm
    }
  })
}

export async function updateDesign(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = text(formData, "id")
  return edit(id, (study) => {
    if (study.design.locked) return { ok: false, error: "The design is locked. Amend it before changing the comparison." }
    const type = text(formData, "type") as StudyDesign["type"]
    if (type !== "comparison" && type !== "staggered" && type !== "before_after") {
      return { ok: false, error: "Choose a comparison, a staggered rollout, or a before/after." }
    }
    const pct = Number(text(formData, "practicalEffectPct"))
    const weeks = Number(text(formData, "plannedPostWeeks"))
    if (!Number.isFinite(pct) || pct < 1 || pct > 80) return { ok: false, error: "The change that would matter has to be between 1% and 80% of baseline." }
    if (!Number.isFinite(weeks) || weeks < 4 || weeks > 52) return { ok: false, error: "Plan on 4 to 52 measurement weeks." }
    const second = text(formData, "secondWaveDate")
    study.design.type = type
    study.design.practicalEffectPct = pct / 100
    study.design.plannedPostWeeks = Math.round(weeks)
    study.design.expandIntoControl = formData.get("expandIntoControl") === "on"
    study.design.secondWaveDate = second && /^\d{4}-\d{2}-\d{2}$/.test(second) ? second : null
    if (type === "before_after") {
      for (const team of study.teams) {
        if (team.arm === "control") team.arm = "treatment"
      }
    }
  })
}

export async function lockDesign(studyId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    if (!study.metricsLocked) return { ok: false, error: "Lock the metrics first." }
    const floor = study.privacyFloor
    const treatment = study.teams.filter((team) => team.arm === "treatment").reduce((sum, team) => sum + team.headcount, 0)
    const control = study.teams.filter((team) => team.arm === "control").reduce((sum, team) => sum + team.headcount, 0)
    if (treatment < floor) return { ok: false, error: `The rollout group needs at least ${floor} people.` }
    if (study.design.type !== "before_after" && control < floor) {
      return { ok: false, error: `The comparison group needs at least ${floor} people. A before/after is allowed, and it cannot separate the rollout from other changes.` }
    }
    const weeks = weekCounts(study)
    if (weeks.pre < 4) return { ok: false, error: "Need at least four baseline weeks on the primary metric before locking." }
    if (study.design.type === "staggered" && study.design.secondWaveDate && study.design.secondWaveDate <= study.design.rolloutDate) {
      return { ok: false, error: "The later wave has to start after the first rollout." }
    }
    study.design.retrospective = weeks.post >= 2
    study.design.locked = true
    study.design.lockedAt = new Date().toISOString()
    if (study.design.retrospective) {
      return { ok: true, warnings: ["Measurement data was already loaded, so this lock is retrospective. The estimate describes what is on file."] }
    }
  })
}

export async function uploadUsage(studyId: string, csv: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    const held = paused(study)
    if (held) return held
    const parsed = parseUsageCsv(csv, study)
    if (parsed.points.length === 0) return { ok: false, error: parsed.errors[0] ?? "No usage rows were usable." }
    study.usage = parsed.points
    study.origin.usage = "upload"
    return { ok: true, warnings: [...parsed.warnings, ...parsed.errors] }
  })
}

export async function uploadSpend(studyId: string, csv: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    const held = paused(study)
    if (held) return held
    const parsed = parseSpendCsv(csv, study)
    if (parsed.points.length === 0 && parsed.other === 0) return { ok: false, error: parsed.errors[0] ?? "No spend rows were usable." }
    for (const point of study.usage) {
      point.seatCost = 0
      point.tokenCost = 0
    }
    for (const point of parsed.points) {
      const found = study.usage.find((item) => item.period === point.period && item.teamId === point.teamId)
      if (found) {
        found.seatCost += point.seatCost
        found.tokenCost += point.tokenCost
      } else study.usage.push(point)
    }
    study.otherSpend = parsed.other
    study.origin.usage = "upload"
    return { ok: true, warnings: parsed.warnings }
  })
}

export async function uploadAgents(studyId: string, csv: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    const held = paused(study)
    if (held) return held
    const parsed = parseAgentCsv(csv, study)
    if (parsed.points.length === 0) return { ok: false, error: parsed.errors[0] ?? "No agent rows were usable." }
    study.agents = parsed.points
    study.origin.usage = "upload"
    return { ok: true, warnings: parsed.warnings }
  })
}

export async function generateMeasurement(studyId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    const held = paused(study)
    if (held) return held
    if (!study.design.locked) return { ok: false, error: "Lock the design before generating the measurement window. Otherwise it is too easy to rebuild the chart." }
    if (!study.teams.some((team) => team.arm === "treatment")) return { ok: false, error: "Assign a rollout group first." }
    fillMeasurement(study)
    return { ok: true, warnings: ["Measurement weeks, usage, and a follow-up pulse were simulated for the template metrics."] }
  })
}

export async function setAssumptions(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = text(formData, "id")
  return edit(id, (study) => {
    const weekly = Number(text(formData, "weeklyLoadedCost"))
    const other = Number(text(formData, "otherSpend") || "0")
    if (!Number.isFinite(weekly) || weekly <= 0) return { ok: false, error: "Loaded pay per person per week has to be a positive number." }
    if (!Number.isFinite(other) || other < 0) return { ok: false, error: "Other spend cannot be negative." }
    study.weeklyLoadedCost = weekly
    study.otherSpend = other
  })
}

export async function deleteStudy(studyId: string, phrase: string): Promise<void> {
  const study = getStudy(studyId)
  if (!study || phrase !== study.name) return
  removeStudy(studyId)
  refresh()
  redirect("/rollouts")
}

export async function resetDemoStudies(): Promise<ActionResult> {
  resetDemos()
  refresh()
  return { ok: true }
}

function refreshSettings() {
  revalidatePath("/settings")
  revalidatePath("/", "layout")
}

export async function updateWorkspace(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const current = getWorkspace()
  const next = normalizeWorkspace({
    ...current,
    name: text(formData, "name") || current.name,
    privacyFloor: Number(text(formData, "privacyFloor") || current.privacyFloor),
    practicalEffectPct: Number(text(formData, "practicalEffectPct") || current.practicalEffectPct),
  })
  saveWorkspace(next)
  refreshSettings()
  return { ok: true }
}

export async function setConnection(sourceId: string, connected: boolean, address?: string): Promise<ActionResult> {
  const known = connectableSources().some((source) => source.id === sourceId)
  if (!known) return { ok: false, error: "That source is not available." }
  const workspace = getWorkspace()
  workspace.connections[sourceId] = {
    connected,
    connectedAt: connected ? new Date().toISOString() : null,
    address: connected ? (address?.trim() || workspace.connections[sourceId]?.address || null) : null,
  }
  saveWorkspace(workspace)
  refreshSettings()
  return { ok: true }
}

export async function setAllConnections(connected: boolean): Promise<ActionResult> {
  const workspace = getWorkspace()
  const now = new Date().toISOString()
  for (const source of connectableSources()) {
    const previous = workspace.connections[source.id]
    workspace.connections[source.id] = {
      connected,
      connectedAt: connected ? (previous?.connectedAt ?? now) : null,
      address: connected ? (previous?.address ?? null) : null,
    }
  }
  saveWorkspace(workspace)
  refreshSettings()
  return { ok: true }
}

export async function askKestrelAction(transcript: KestrelMessage[]): Promise<
  | { ok: true; reply: string; plan: Gameplan; tokensUsed: number; tokenCap: number }
  | { ok: false; error: string; tokensUsed: number; tokenCap: number }
> {
  const workspace = getWorkspace()
  const cap = kestrelTokenCap()
  const result = await askKestrel(transcript, workspace.kestrelTokensUsed)
  if (result.spent > 0) {
    workspace.kestrelTokensUsed += result.spent
    saveWorkspace(workspace)
    refresh()
  }
  const tokensUsed = workspace.kestrelTokensUsed
  if ("error" in result) return { ok: false, error: result.error, tokensUsed, tokenCap: cap }
  return { ...result.turn, tokensUsed, tokenCap: cap }
}

export async function confirmKestrel(plan: Gameplan): Promise<ActionResult> {
  const checked = readGameplan(plan)
  if ("error" in checked) return { ok: false, error: checked.error }
  if (!gameplanReady(checked.plan)) return { ok: false, error: checked.plan.questions[0] ?? "The plan still has an open question." }
  const workspace = getWorkspace()
  const study = studyFromGameplan(checked.plan, workspace.privacyFloor, workspace.practicalEffectPct)
  saveStudy(study)
  refresh(study.id)
  redirect(`/studies/${study.id}`)
}

function sectionRecord(study: Study): NonNullable<Study["sections"]> {
  if (!study.sections) {
    study.sections = study.demo ? Object.fromEntries(SECTION_IDS.map((id) => [id, "done"])) : {}
  }
  return study.sections
}

export async function saveSection(studyId: string, section: SectionId): Promise<ActionResult> {
  if (!SECTION_IDS.includes(section)) return { ok: false, error: "Unknown section." }
  return edit(studyId, (study) => {
    sectionRecord(study)[section] = "saved"
  })
}

export async function markSectionDone(studyId: string, section: SectionId): Promise<ActionResult> {
  if (!SECTION_IDS.includes(section)) return { ok: false, error: "Unknown section." }
  return edit(studyId, (study) => {
    sectionRecord(study)[section] = "done"
  })
}

export async function goLive(studyId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    if (rolloutFinished(study)) return { ok: false, error: "This rollout has ended." }
    if (!study.wentLiveAt) study.wentLiveAt = new Date().toISOString()
    study.pausedAt = null
  })
}

export async function pauseRollout(studyId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    if (rolloutFinished(study)) return { ok: false, error: "This rollout has ended." }
    if (!study.wentLiveAt && !study.openWeek) return { ok: false, error: "Send the rollout live before pausing it." }
    study.pausedAt = new Date().toISOString()
  })
}

export async function resumeRollout(studyId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    study.pausedAt = null
  })
}

export async function receiveNextDay(studyId: string): Promise<ActionResult> {
  return edit(studyId, (study) => {
    const held = paused(study)
    if (held) return held
    if (!study.openWeek) return { ok: false, error: "This rollout is not waiting on another file." }
    return { ok: true, warnings: [fileNextDay(study)] }
  })
}
