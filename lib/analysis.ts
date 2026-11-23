import { isPost, isPre } from "./dates"
import { weekCounts, windowClosed } from "./progress"
import { formatChange, formatDelta, formatMoney, formatNumber, formatPct, formatRange, formatValue, plural } from "./format"
import type {
  Arm,
  Confidence,
  Decision,
  Direction,
  Metric,
  OutcomePoint,
  SegmentId,
  Study,
  Team,
} from "./types"

export interface WeekPoint {
  period: string
  treatment: number | null
  control: number | null
  phase: "pre" | "post"
}

export interface Effect {
  metricId: string
  name: string
  unit: string
  direction: Direction
  primary: boolean
  did: number | null
  ciLow: number | null
  ciHigh: number | null
  baseline: number | null
  relative: number | null
  favorable: boolean
  detectable: boolean
  rulesOutPractical: boolean
  confidence: Confidence
  pre: { treatment: number | null; control: number | null }
  post: { treatment: number | null; control: number | null }
  series: WeekPoint[]
  weeksPre: number
  weeksPost: number
  note: string
}

export interface PowerResult {
  treatmentN: number
  controlN: number
  sigma: number | null
  mde: number | null
  practical: number | null
  adequate: boolean
  weeksPre: number
  weeksPost: number
  note: string
}

export interface Segment {
  id: SegmentId
  label: string
  n: number
  sessionsPerUser: number
  breadth: number
  primaryDelta: number | null
  suppressed: boolean
}

export interface CostRow {
  id: "human" | "human_ai" | "agent"
  label: string
  includes: string
  cost: number | null
  unit: string
}

export interface PulseRow {
  construct: string
  arm: Arm
  baseline: number | null
  followup: number | null
  n: number
}

export interface Report {
  decision: Decision
  title: string
  lede: string
  reasons: string[]
  warnings: string[]
  nextStep: string
  rules: string[]
  exploratory: boolean
  comparison: boolean
  primary: Effect | null
  effects: Effect[]
  power: PowerResult | null
  preTrendNote: string | null
  segments: Segment[]
  costs: CostRow[]
  costNote: string
  pulses: PulseRow[]
  pulseInvited: number
  pulseResponses: number
  pulseResponseRate: number | null
  spend: {
    seats: number
    tokens: number
    agents: number
    other: number
    total: number
    activeRate: number | null
    treatmentHeadcount: number
  }
  suppressed: string[]
  autoMapRate: number | null
}

const SEGMENT_LABEL: Record<SegmentId, string> = {
  light: "Light",
  selective: "Selective",
  embedded: "Embedded",
}

function readingTitle(effect: Effect | null): string {
  if (!effect || effect.did == null) return "Not enough on file"
  return `${effect.name} is ${formatChange(effect.did, effect.unit)}`
}

function reportTitle(rules: string[], decision: Decision, effect: Effect | null): string {
  if (rules.includes("window_open")) return "Still measuring"
  if (decision === "inconclusive") return effect?.did == null ? "Not enough on file" : "Unmarked"
  return readingTitle(effect)
}

export function analyze(study: Study): Report {
  const floor = study.privacyFloor
  const suppressed: string[] = []
  const visible = study.teams.filter((team) => {
    if (team.headcount < floor) {
      suppressed.push(
        `${team.name} is hidden. Groups under ${floor} are not reported.`,
      )
      return false
    }
    return true
  })
  for (const role of study.roles) {
    if (role.headcount <= 0 || role.headcount >= floor) continue
    if (study.teams.some((team) => team.roleId === role.id)) continue
    suppressed.push(`${role.title} is hidden. Groups under ${floor} are not reported.`)
  }

  const treatment = visible.filter((team) => team.arm === "treatment")
  const control = visible.filter((team) => team.arm === "control")
  const comparison = study.design.type !== "before_after"
  const primaryMetric = study.metrics.find((metric) => metric.id === study.primaryMetricId) ?? null

  const effects = study.metrics.map((metric) =>
    effectFor(study, metric, treatment, control, comparison, primaryMetric?.id === metric.id),
  )
  const primary = effects.find((effect) => effect.primary) ?? null
  const power = primaryMetric
    ? powerFor(study, primaryMetric, treatment, control, comparison, primary)
    : null
  const preTrendNote = preTrend(primary, comparison)
  for (const effect of effects) {
    if (effect.confidence === "insufficient") continue
    if (!study.metricsLocked || !study.design.locked || study.amendments.length > 0 || study.design.retrospective) {
      effect.confidence = "low"
    }
    if ((power && !power.adequate) || preTrendNote) effect.confidence = "low"
  }

  const spend = spendFor(study, treatment)
  const rules: string[] = []
  const reasons: string[] = []

  if (!study.metricsLocked) {
    rules.push("metrics_unlocked")
    reasons.push("The metrics are not confirmed yet.")
  }
  if (!study.design.locked) {
    rules.push("design_unlocked")
    reasons.push("The comparison is not locked.")
  }
  if (!primaryMetric) {
    rules.push("no_primary")
    reasons.push("No primary metric is chosen. The reading hangs on a single outcome.")
  }
  if (treatment.length === 0 || sumHead(treatment) < floor) {
    rules.push("no_treatment")
    reasons.push(`The rollout group needs at least ${floor} people, and those people have to be assigned.`)
  }
  if (comparison && (control.length === 0 || sumHead(control) < floor)) {
    rules.push("no_control")
    reasons.push("There is no comparison group large enough to report.")
  }
  if (study.design.type === "before_after") {
    rules.push("no_comparison")
    reasons.push(
      "There is no comparison group. A before-and-after number describes what happened. It cannot separate the rollout from everything else that changed in the same weeks.",
    )
  }
  if (!primary || primary.did == null || primary.ciLow == null || primary.ciHigh == null) {
    rules.push("no_data")
    reasons.push("There are not at least two baseline weeks and two measurement weeks on the primary metric.")
  }
  if (study.amendments.length > 0) {
    rules.push("amended")
    reasons.push(
      "Metrics or the design changed after they were locked. The estimate below is exploratory.",
    )
  }
  if (study.design.retrospective) {
    rules.push("retrospective")
    reasons.push(
      "The design was locked after measurement-window data was already loaded. That is a retrospective look, not a pre-registered one.",
    )
  }
  if (power && !power.adequate && !rules.includes("no_data")) {
    rules.push("underpowered")
    reasons.push(power.note)
  }
  if (preTrendNote && primary?.did != null) {
    rules.push("pretrend")
    reasons.push(preTrendNote)
  }
  if (
    study.metricsLocked &&
    study.design.locked &&
    primary?.did != null &&
    !windowClosed(study) &&
    !rules.includes("no_data")
  ) {
    const planned = study.design.plannedPostWeeks
    const posted = weekCounts(study).post
    rules.push("window_open")
    reasons.push(
      `The plan is ${planned} measurement weeks. ${posted} ${posted === 1 ? "is" : "are"} on file, so this is a reading so far.`,
    )
  }

  let decision: Decision = "inconclusive"
  if (rules.length === 0 && primary && primary.did != null && primary.ciLow != null && primary.ciHigh != null) {
    const room =
      comparison &&
      study.design.expandIntoControl &&
      sumHead(control) >= floor
    if (primary.detectable && !primary.favorable) {
      decision = "cut"
      rules.push("unfavorable")
      reasons.push(
        `${primary.name} moved the other way, and the 95% range does not include zero.`,
      )
    } else if (primary.detectable && primary.favorable && room) {
      decision = "expand"
      rules.push("favorable_expand")
      reasons.push(
        `${primary.name} improved, the 95% range does not include zero, and ${plural(sumHead(control), "person")} in the comparison group can still receive it.`,
      )
    } else if (primary.detectable && primary.favorable) {
      decision = "keep"
      rules.push("favorable_keep")
      reasons.push(
        `${primary.name} improved, and the 95% range does not include zero. The comparison group is not a candidate for this rollout.`,
      )
    } else if (primary.rulesOutPractical && spend.total > 0) {
      decision = "cut"
      rules.push("benefit_ruled_out")
      reasons.push(
        `A gain of the size you said would matter sits outside the 95% range. ${formatMoney(spend.total)} has been spent.`,
      )
    } else if (primary.rulesOutPractical) {
      decision = "keep"
      rules.push("benefit_ruled_out_free")
      reasons.push(
        "A gain of the size you said would matter sits outside the 95% range. There is no tool spend recorded.",
      )
    } else {
      rules.push("benefit_ambiguous")
      reasons.push(
        "The 95% range includes no change and also includes a gain that would matter.",
      )
    }
  }

  const warnings: string[] = []
  for (const effect of effects) {
    if (!effect.primary && effect.detectable && !effect.favorable) {
      warnings.push(
        `${effect.name} moved the other way (${formatDelta(effect.did ?? 0, effect.unit)}). The reading follows the primary metric.`,
      )
    }
  }
  if (spend.activeRate != null && spend.activeRate < 0.5 && spend.seats > 0) {
    warnings.push(
      `In a typical measurement week, ${formatPct(spend.activeRate)} of rollout seats were used.`,
    )
  }
  const baselinePulse = study.pulses.find((wave) => wave.kind === "baseline")
  if (baselinePulse && baselinePulse.invited > 0 && baselinePulse.responses / baselinePulse.invited < 0.4) {
    warnings.push(
      `Baseline pulse response is ${formatPct(baselinePulse.responses / baselinePulse.invited)}, under the 40% mark. Treat the experience numbers as thin.`,
    )
  }
  if (!baselinePulse && !study.pulseSkipped && study.metricsLocked) {
    warnings.push("There is no baseline pulse, so employee experience is not in this reading.")
  }
  if (study.pulses.some((wave) => wave.suppressed.length > 0)) {
    suppressed.push(`A check-in is hidden. Groups under ${floor} are not reported.`)
  }

  const autoMapped = study.roles.filter((role) => role.autoMapped).length
  const autoMapRate = study.roles.length ? autoMapped / study.roles.length : null

  return {
    decision,
    title: reportTitle(rules, decision, primary),
    lede: ledeFor(primary, comparison),
    reasons,
    warnings,
    nextStep: nextStepFor(rules),
    rules,
    exploratory: rules.includes("amended") || rules.includes("retrospective"),
    comparison,
    primary,
    effects,
    power,
    preTrendNote,
    segments: segmentsFor(study, visible, floor, suppressed),
    costs: costsFor(study, treatment, comparison ? control : []),
    costNote: costNote(study),
    pulses: pulseRows(study, floor),
    pulseInvited: study.pulses.reduce((sum, wave) => sum + wave.invited, 0),
    pulseResponses: study.pulses.reduce((sum, wave) => sum + wave.responses, 0),
    pulseResponseRate: responseRate(study),
    spend,
    suppressed,
    autoMapRate,
  }
}

function ledeFor(effect: Effect | null, comparison: boolean): string {
  if (!effect || effect.did == null || effect.ciLow == null || effect.ciHigh == null) {
    return "There is not enough before-and-after data on the primary metric to estimate a change."
  }
  const where = comparison
    ? "in the rollout group relative to the comparison group"
    : "in the rollout group, with no comparison group"
  const delta = formatDelta(effect.did, effect.unit)
  const shown = effect.unit === "share" || effect.unit === "score" || effect.unit === "dollars" ? delta : `${delta} ${effect.unit}`
  let text = `${effect.name} changed by ${shown} ${where} (95% range ${formatRange(effect.ciLow, effect.ciHigh, effect.unit)}).`
  if (effect.baseline != null && effect.baseline > 0) {
    const start = formatValue(effect.baseline, effect.unit)
    const suffix = effect.unit === "share" || effect.unit === "score" || effect.unit === "dollars" ? "" : ` ${effect.unit}`
    text += ` The rollout group started at ${start}${suffix}.`
  }
  return text
}

function nextStepFor(rules: string[]): string {
  if (rules.includes("metrics_unlocked")) return "The metrics are not confirmed yet."
  if (rules.includes("design_unlocked")) return "The groups are not confirmed yet."
  if (rules.includes("no_data")) return "There are not at least two weeks before and two weeks after on the primary metric."
  if (rules.includes("window_open")) return "The planned weeks are not all on file. This is a reading so far."
  if (rules.includes("underpowered")) return "The smallest change these groups can see is larger than the gain that was set as mattering."
  if (rules.includes("amended") || rules.includes("retrospective")) {
    return "The metric or the groups changed after confirmation, or the groups were confirmed after measurement data was already in. This reading describes what is on file."
  }
  if (rules.includes("favorable_expand")) {
    return "The primary metric moved in the agreed direction. The 95% range does not include zero. The comparison group has not received it."
  }
  if (rules.includes("favorable_keep")) {
    return "The primary metric moved in the agreed direction. The 95% range does not include zero. The comparison group is not a candidate for this rollout."
  }
  if (rules.includes("unfavorable")) return "The primary metric moved the other way. The 95% range does not include zero."
  if (rules.includes("benefit_ruled_out")) {
    return "A gain of the size that was set as mattering sits outside the 95% range. Tool spend is on file."
  }
  if (rules.includes("benefit_ruled_out_free")) {
    return "A gain of the size that was set as mattering sits outside the 95% range. No tool spend is on file."
  }
  return "The 95% range includes no change and also includes a gain of the size that was set as mattering."
}

function effectFor(
  study: Study,
  metric: Metric,
  treatment: Team[],
  control: Team[],
  comparison: boolean,
  primary: boolean,
): Effect {
  const empty = baseEffect(metric, primary)
  const staggered = study.design.type === "staggered"
  const periods = uniquePeriods(study.outcomes, metric.id)
  const preP = periods.filter((period) => isPre(period, study.design.rolloutDate))
  const postP = periods.filter((period) =>
    isPost(period, study.design.rolloutDate, study.design.secondWaveDate, staggered),
  )

  const tPre = weekMeans(study, metric.id, treatment, preP)
  const tPost = weekMeans(study, metric.id, treatment, postP)
  const cPre = comparison ? weekMeans(study, metric.id, control, preP) : []
  const cPost = comparison ? weekMeans(study, metric.id, control, postP) : []

  const series = mergeSeries(tPre, tPost, cPre, cPost)
  const fit = fitWeeks(tPre, tPost, cPre, cPost, comparison)
  const preT = fit.preT
  const postT = fit.postT
  const preC = fit.preC
  const postC = fit.postC

  if (fit.did == null || fit.ciLow == null || fit.ciHigh == null || preT == null) {
    const note =
      comparison && preT != null && postT != null && (preC == null || postC == null || cPre.length < 2 || cPost.length < 2)
        ? "The comparison group does not have two weeks before and two weeks after."
        : empty.note
    return { ...empty, series, weeksPre: tPre.length, weeksPost: tPost.length, pre: { treatment: preT, control: preC }, post: { treatment: postT, control: postC }, note }
  }

  const did = fit.did
  const ciLow = fit.ciLow
  const ciHigh = fit.ciHigh
  const detectable = ciLow > 0 || ciHigh < 0
  const favorable = metric.direction === "higher_better" ? did > 0 : did < 0
  const practical = Math.abs(preT * study.design.practicalEffectPct)
  const rulesOutPractical =
    metric.direction === "higher_better" ? ciHigh < practical : ciLow > -practical
  const relative = preT !== 0 ? did / preT : null

  let confidence: Confidence = "low"
  if (comparison && detectable && study.design.locked && study.amendments.length === 0 && !study.design.retrospective) {
    const half = (ciHigh - ciLow) / 2
    confidence = half < practical ? "high" : "moderate"
  }
  if (!comparison || study.amendments.length > 0 || study.design.retrospective) confidence = "low"

  return {
    ...empty,
    did,
    ciLow,
    ciHigh,
    baseline: preT,
    relative,
    favorable,
    detectable,
    rulesOutPractical,
    confidence,
    pre: { treatment: preT, control: preC },
    post: { treatment: postT, control: postC },
    series,
    weeksPre: tPre.length,
    weeksPost: tPost.length,
    note: comparison
      ? "Change in the rollout group minus change in the comparison group. Each week counts equally. Inside a week, each team counts by the number of observations on that row. The range is a 95% interval from week-to-week variation."
      : "Change from the baseline weeks to the measurement weeks in the rollout group only. Other things that happened in those weeks are still in this number.",
  }
}

function baseEffect(metric: Metric, primary: boolean): Effect {
  return {
    metricId: metric.id,
    name: metric.name,
    unit: metric.unit,
    direction: metric.direction,
    primary,
    did: null,
    ciLow: null,
    ciHigh: null,
    baseline: null,
    relative: null,
    favorable: false,
    detectable: false,
    rulesOutPractical: false,
    confidence: "insufficient",
    pre: { treatment: null, control: null },
    post: { treatment: null, control: null },
    series: [],
    weeksPre: 0,
    weeksPost: 0,
    note: "Not enough weeks to estimate a change.",
  }
}

function powerFor(
  study: Study,
  metric: Metric,
  treatment: Team[],
  control: Team[],
  comparison: boolean,
  effect: Effect | null,
): PowerResult {
  const treatmentN = sumHead(treatment)
  const controlN = sumHead(control)
  const weeksPre = effect?.weeksPre ?? 0
  const observedPost = effect?.weeksPost ?? 0
  const weeksPost = observedPost >= 2 ? observedPost : study.design.plannedPostWeeks
  const sigma = sigmaOf(effect)
  const baseline = effect?.pre.treatment ?? null
  const practical = baseline == null ? null : Math.abs(baseline * study.design.practicalEffectPct)
  let mde: number | null = null
  if (sigma != null && weeksPre >= 2 && weeksPost >= 2) {
    const se = comparison
      ? sigma * Math.sqrt(1 / weeksPre + 1 / weeksPost + 1 / weeksPre + 1 / weeksPost)
      : sigma * Math.sqrt(1 / weeksPre + 1 / weeksPost)
    let raw = (1.96 + 0.8416) * se
    const smallest = Math.min(treatmentN, comparison ? controlN : treatmentN)
    if (smallest > 0 && smallest < 30) raw *= Math.sqrt(30 / smallest)
    mde = raw
  }
  const adequate = mde != null && practical != null && practical > 0 && mde <= practical
  const unit = metric.unit === "share" ? "pp" : metric.unit
  const mdeText = mde == null ? null : metric.unit === "share" ? `${(mde * 100).toFixed(1)} percentage points` : `${formatNumber(mde)} ${unit}`
  const practicalText =
    practical == null
      ? null
      : metric.unit === "share"
        ? `${(practical * 100).toFixed(1)} percentage points`
        : `${formatNumber(practical)} ${unit}`
  let note: string
  if (mdeText == null || practicalText == null) {
    note = "Capture a baseline of at least four weeks to see whether these groups can support a conclusion."
  } else if (adequate) {
    note = `The smallest change these groups can reliably detect is about ${mdeText}. You said ${practicalText} would matter, and this study can detect a change of that size.`
  } else {
    note = `The smallest change these groups can reliably detect is about ${mdeText}. You said ${practicalText} would matter, and this study is unlikely to see a change that small. A flat result would be ambiguous.`
  }
  return { treatmentN, controlN, sigma, mde, practical, adequate, weeksPre, weeksPost, note }
}

function sigmaOf(effect: Effect | null): number | null {
  if (!effect) return null
  const pre = effect.series.filter((point) => point.phase === "pre" && point.treatment != null)
  const values = pre.map((point) => point.treatment as number)
  if (effect.series.some((point) => point.phase === "pre" && point.control != null)) {
    for (const point of effect.series) {
      if (point.phase === "pre" && point.control != null) values.push(point.control)
    }
  }
  if (values.length < 2) return null
  return Math.sqrt(sampleVar(values))
}

function preTrend(effect: Effect | null, comparison: boolean): string | null {
  if (!comparison || !effect || effect.did == null) return null
  const pre = effect.series.filter((point) => point.phase === "pre" && point.treatment != null && point.control != null)
  if (pre.length < 4) return null
  const treatment = pre.map((point) => point.treatment as number)
  const control = pre.map((point) => point.control as number)
  const span = treatment.length - 1
  const drift = Math.abs(treatment[span] - treatment[0] - (control[span] - control[0]))
  const resid = Math.max(residualSd(treatment), residualSd(control))
  if (drift > Math.abs(effect.did) && drift > resid * 3) {
    return "Before the rollout, the groups were already moving apart by more than the estimated effect. The comparison is too weak to decide on."
  }
  return null
}

function residualSd(values: number[]): number {
  const span = values.length - 1
  const slope = (values[span] - values[0]) / span
  const residuals = values.map((value, index) => value - (values[0] + slope * index))
  return Math.sqrt(sampleVar(residuals))
}

function segmentsFor(study: Study, visible: Team[], floor: number, suppressed: string[]): Segment[] {
  const bands = study.bands.filter((band) => visible.some((team) => team.id === band.teamId))
  if (bands.length === 0) {
    return clustersFromUsage(study, visible, floor, suppressed)
  }
  const ids: SegmentId[] = ["light", "selective", "embedded"]
  return ids
    .map((id): Segment | null => {
      const rows = bands.filter((band) => band.segment === id)
      const n = rows.reduce((sum, row) => sum + row.n, 0)
      if (n === 0) return null
      if (n < floor) {
        suppressed.push(`${SEGMENT_LABEL[id]} adoption is hidden. Groups under ${floor} are not reported.`)
        return { id, label: SEGMENT_LABEL[id], n, sessionsPerUser: 0, breadth: 0, primaryDelta: null, suppressed: true }
      }
      return {
        id,
        label: SEGMENT_LABEL[id],
        n,
        sessionsPerUser: weighted(rows, (row) => row.sessionsPerUser, (row) => row.n),
        breadth: weighted(rows, (row) => row.breadth, (row) => row.n),
        primaryDelta: weighted(rows.filter((row) => row.primaryDelta != null), (row) => row.primaryDelta ?? 0, (row) => row.n),
        suppressed: false,
      }
    })
    .filter((row): row is Segment => row != null)
}

function clustersFromUsage(study: Study, visible: Team[], floor: number, suppressed: string[]): Segment[] {
  const post = study.usage.filter((point) =>
    isPost(point.period, study.design.rolloutDate, study.design.secondWaveDate, study.design.type === "staggered"),
  )
  const points = visible
    .map((team) => {
      const rows = post.filter((point) => point.teamId === team.id)
      if (rows.length === 0) return null
      const sessions = avg(rows.map((row) => row.sessionsPerUser)) ?? 0
      const breadth = avg(rows.map((row) => row.breadth)) ?? 0
      return { id: team.id, sessions, breadth, n: team.headcount }
    })
    .filter((row): row is { id: string; sessions: number; breadth: number; n: number } => row != null)
  if (points.length < 3) return []
  const assignments = assignSegments(points)
  const ids: SegmentId[] = ["light", "selective", "embedded"]
  return ids
    .map((id): Segment | null => {
      const rows = points.filter((point) => assignments.get(point.id) === id)
      const n = rows.reduce((sum, row) => sum + row.n, 0)
      if (n === 0) return null
      if (n < floor) {
        suppressed.push(`${SEGMENT_LABEL[id]} adoption is hidden. Groups under ${floor} are not reported.`)
        return { id, label: SEGMENT_LABEL[id], n, sessionsPerUser: 0, breadth: 0, primaryDelta: null, suppressed: true }
      }
      return {
        id,
        label: SEGMENT_LABEL[id],
        n,
        sessionsPerUser: weighted(rows, (row) => row.sessions, (row) => row.n),
        breadth: weighted(rows, (row) => row.breadth, (row) => row.n),
        primaryDelta: null,
        suppressed: false,
      }
    })
    .filter((row): row is Segment => row != null)
}

function assignSegments(points: { id: string; sessions: number; breadth: number }[]): Map<string, SegmentId> {
  const order: SegmentId[] = ["light", "selective", "embedded"]
  const map = new Map<string, SegmentId>()
  if (points.length < 3) {
    const sorted = [...points].sort((a, b) => a.sessions - b.sessions)
    sorted.forEach((point, index) => {
      map.set(point.id, order[Math.min(order.length - 1, Math.floor((index / sorted.length) * 3))])
    })
    return map
  }
  const sessions = points.map((point) => point.sessions)
  const breadths = points.map((point) => point.breadth)
  const sMean = avg(sessions) ?? 0
  const bMean = avg(breadths) ?? 0
  const sSd = Math.sqrt(sampleVar(sessions)) || 1
  const bSd = Math.sqrt(sampleVar(breadths)) || 1
  const norm = points.map((point) => ({
    id: point.id,
    x: (point.sessions - sMean) / sSd,
    y: (point.breadth - bMean) / bSd,
    score: point.sessions + point.breadth,
  }))
  const sorted = [...norm].sort((a, b) => a.score - b.score)
  let centroids = [sorted[0], sorted[Math.floor(sorted.length / 2)], sorted[sorted.length - 1]].map((point) => ({
    x: point.x,
    y: point.y,
  }))
  let labels = norm.map(() => 0)
  for (let iter = 0; iter < 12; iter++) {
    labels = norm.map((point) => {
      let best = 0
      let bestDist = Infinity
      centroids.forEach((centroid, index) => {
        const dist = (point.x - centroid.x) ** 2 + (point.y - centroid.y) ** 2
        if (dist < bestDist) {
          bestDist = dist
          best = index
        }
      })
      return best
    })
    centroids = centroids.map((centroid, index) => {
      const members = norm.filter((_, i) => labels[i] === index)
      if (members.length === 0) return centroid
      return {
        x: members.reduce((sum, point) => sum + point.x, 0) / members.length,
        y: members.reduce((sum, point) => sum + point.y, 0) / members.length,
      }
    })
  }
  const intensity = centroids.map((centroid, index) => ({ index, score: centroid.x + centroid.y }))
  intensity.sort((a, b) => a.score - b.score)
  const remap = new Map(intensity.map((item, rank) => [item.index, order[rank]]))
  norm.forEach((point, index) => map.set(point.id, remap.get(labels[index]) ?? "selective"))
  return map
}

function costsFor(study: Study, treatment: Team[], _control: Team[]): CostRow[] {
  const denominator = study.metrics.find((metric) => metric.costDenominator) ?? null
  const unit = denominator?.costUnit ?? "outcome"
  if (!denominator || treatment.length === 0) {
    return []
  }
  const preUnits = weeklyVolume(study, denominator, treatment, "pre")
  const postUnits = weeklyVolume(study, denominator, treatment, "post")
  const labor = sumHead(treatment) * study.weeklyLoadedCost
  const postWeeks = countPhaseWeeks(study, denominator.id, "post")
  const toolWeekly = postWeeks > 0 ? toolSpend(study, treatment) / postWeeks : 0
  const human = preUnits && preUnits > 0 ? labor / preUnits : null
  const humanAi = postUnits && postUnits > 0 ? (labor + toolWeekly) / postUnits : null
  const rows: CostRow[] = [
    {
      id: "human",
      label: "People, before",
      includes: "Loaded pay in the rollout group, divided by weekly volume before the rollout.",
      cost: human,
      unit,
    },
    {
      id: "human_ai",
      label: "People plus the tool, after",
      includes: "Loaded pay plus seat, token, and other tool spend, divided by weekly volume after.",
      cost: humanAi,
      unit,
    },
  ]
  const agentSpend = study.agents.reduce((sum, point) => sum + point.spend, 0)
  const agentUnits = study.agents.reduce((sum, point) => sum + point.units, 0)
  if (agentSpend > 0 && agentUnits > 0) {
    rows.push({
      id: "agent",
      label: "The agent's own work",
      includes: "Agent spend divided by the units the agent completed. This is not a fully loaded human cost.",
      cost: agentSpend / agentUnits,
      unit,
    })
  }
  return rows
}

function costNote(study: Study): string {
  const denominator = study.metrics.find((metric) => metric.costDenominator)
  const loaded = formatMoney(study.weeklyLoadedCost)
  if (!denominator) return `Loaded pay is an assumption: ${loaded} per person per week. Add a volume metric to see cost per outcome.`
  return `Loaded pay is an assumption you can edit: ${loaded} per person per week. Cost per ${denominator.costUnit} uses the rollout group's before and after. It is not adjusted by the comparison group. The agent's own cost, when shown, leaves human pay out and is not comparable to the other rows.`
}

function spendFor(study: Study, treatment: Team[]) {
  const teamIds = new Set(treatment.map((team) => team.id))
  const usage = study.usage.filter((point) => teamIds.has(point.teamId) && isPost(point.period, study.design.rolloutDate, study.design.secondWaveDate, study.design.type === "staggered"))
  const seats = usage.reduce((sum, point) => sum + point.seatCost, 0)
  const tokens = usage.reduce((sum, point) => sum + point.tokenCost, 0)
  const agents = study.agents.reduce((sum, point) => sum + point.spend, 0)
  const other = study.otherSpend
  const head = sumHead(treatment)
  const byWeek = new Map<string, number>()
  for (const point of usage) byWeek.set(point.period, (byWeek.get(point.period) ?? 0) + point.activeUsers)
  const rates = [...byWeek.values()].map((active) => (head > 0 ? active / head : 0))
  return {
    seats,
    tokens,
    agents,
    other,
    total: seats + tokens + agents + other,
    activeRate: rates.length ? (avg(rates) ?? null) : null,
    treatmentHeadcount: head,
  }
}

function pulseRows(study: Study, floor: number): PulseRow[] {
  const baseline = study.pulses.find((wave) => wave.kind === "baseline")
  const follow = study.pulses.find((wave) => wave.kind === "followup")
  const keys = new Map<string, PulseRow>()
  for (const wave of [baseline, follow]) {
    if (!wave) continue
    for (const score of wave.scores) {
      if (score.n < floor) continue
      const key = `${score.arm}:${score.construct}`
      const row = keys.get(key) ?? { construct: score.construct, arm: score.arm, baseline: null, followup: null, n: score.n }
      if (wave.kind === "baseline") row.baseline = score.mean
      else row.followup = score.mean
      row.n = Math.min(row.n, score.n)
      keys.set(key, row)
    }
  }
  return [...keys.values()]
}

function responseRate(study: Study): number | null {
  const wave = study.pulses.find((item) => item.kind === "baseline") ?? study.pulses[0]
  if (!wave || wave.invited <= 0) return null
  return wave.responses / wave.invited
}

function weeklyVolume(study: Study, metric: Metric, teams: Team[], phase: "pre" | "post"): number | null {
  const weeks = phaseWeeks(study, metric.id, phase)
  if (weeks.length === 0) return null
  const totals = weeks.map((period) => {
    let total = 0
    let seen = false
    for (const team of teams) {
      const point = study.outcomes.find((row) => row.period === period && row.teamId === team.id && row.metricId === metric.id)
      if (!point || point.n < study.privacyFloor) continue
      total += metric.perPerson ? point.value * team.headcount : point.value
      seen = true
    }
    return seen ? total : null
  }).filter((value): value is number => value != null)
  return avg(totals)
}

function toolSpend(study: Study, teams: Team[]): number {
  const ids = new Set(teams.map((team) => team.id))
  const usage = study.usage
    .filter((point) => ids.has(point.teamId) && isPost(point.period, study.design.rolloutDate, study.design.secondWaveDate, study.design.type === "staggered"))
    .reduce((sum, point) => sum + point.seatCost + point.tokenCost, 0)
  return usage + study.otherSpend
}

function countPhaseWeeks(study: Study, metricId: string, phase: "pre" | "post"): number {
  return phaseWeeks(study, metricId, phase).length
}

function phaseWeeks(study: Study, metricId: string, phase: "pre" | "post"): string[] {
  const staggered = study.design.type === "staggered"
  return uniquePeriods(study.outcomes, metricId).filter((period) =>
    phase === "pre"
      ? isPre(period, study.design.rolloutDate)
      : isPost(period, study.design.rolloutDate, study.design.secondWaveDate, staggered),
  )
}

interface WeekMean {
  period: string
  value: number
  /** Sum of n on the rows that entered this week. */
  weight: number
}

function weekMeans(study: Study, metricId: string, teams: Team[], periods: string[]): WeekMean[] {
  const out: WeekMean[] = []
  for (const period of periods) {
    let num = 0
    let den = 0
    for (const team of teams) {
      const point = findPoint(study.outcomes, period, team.id, metricId)
      if (!point || point.n < study.privacyFloor) continue
      num += point.value * point.n
      den += point.n
    }
    if (den >= study.privacyFloor) out.push({ period, value: num / den, weight: den })
  }
  return out
}

interface Fit {
  preT: number | null
  postT: number | null
  preC: number | null
  postC: number | null
  did: number | null
  se: number | null
  df: number | null
  tCrit: number | null
  ciLow: number | null
  ciHigh: number | null
  varPreT: number
  varPostT: number
  varPreC: number
  varPostC: number
  nPreT: number
  nPostT: number
  nPreC: number
  nPostC: number
}

function fitWeeks(tPre: WeekMean[], tPost: WeekMean[], cPre: WeekMean[], cPost: WeekMean[], comparison: boolean): Fit {
  const preT = avg(tPre.map((week) => week.value))
  const postT = avg(tPost.map((week) => week.value))
  const preC = avg(cPre.map((week) => week.value))
  const postC = avg(cPost.map((week) => week.value))
  const base: Fit = {
    preT,
    postT,
    preC,
    postC,
    did: null,
    se: null,
    df: null,
    tCrit: null,
    ciLow: null,
    ciHigh: null,
    varPreT: sampleVar(tPre.map((week) => week.value)),
    varPostT: sampleVar(tPost.map((week) => week.value)),
    varPreC: sampleVar(cPre.map((week) => week.value)),
    varPostC: sampleVar(cPost.map((week) => week.value)),
    nPreT: tPre.length,
    nPostT: tPost.length,
    nPreC: cPre.length,
    nPostC: cPost.length,
  }
  if (preT == null || postT == null || tPre.length < 2 || tPost.length < 2) return base
  if (comparison && (preC == null || postC == null || cPre.length < 2 || cPost.length < 2)) return base
  const did = comparison ? postT - preT - ((postC as number) - (preC as number)) : postT - preT
  const se = comparison
    ? Math.sqrt(base.varPreT / tPre.length + base.varPostT / tPost.length + base.varPreC / cPre.length + base.varPostC / cPost.length)
    : Math.sqrt(base.varPreT / tPre.length + base.varPostT / tPost.length)
  const df = tPre.length + tPost.length + (comparison ? cPre.length + cPost.length : 0) - (comparison ? 4 : 2)
  const crit = tCrit(df)
  return { ...base, did, se, df, tCrit: crit, ciLow: did - crit * se, ciHigh: did + crit * se }
}

function mergeSeries(tPre: WeekMean[], tPost: WeekMean[], cPre: WeekMean[], cPost: WeekMean[]): WeekPoint[] {
  const map = new Map<string, WeekPoint>()
  const put = (rows: WeekMean[], arm: "treatment" | "control", phase: "pre" | "post") => {
    for (const row of rows) {
      const current = map.get(row.period) ?? { period: row.period, treatment: null, control: null, phase }
      current[arm] = row.value
      current.phase = phase
      map.set(row.period, current)
    }
  }
  put(tPre, "treatment", "pre")
  put(cPre, "control", "pre")
  put(tPost, "treatment", "post")
  put(cPost, "control", "post")
  return [...map.values()].sort((a, b) => a.period.localeCompare(b.period))
}

function uniquePeriods(points: OutcomePoint[], metricId: string): string[] {
  return [...new Set(points.filter((point) => point.metricId === metricId).map((point) => point.period))].sort()
}

function findPoint(points: OutcomePoint[], period: string, teamId: string, metricId: string): OutcomePoint | undefined {
  return points.find((point) => point.period === period && point.teamId === teamId && point.metricId === metricId)
}

function sumHead(teams: Team[]): number {
  return teams.reduce((sum, team) => sum + team.headcount, 0)
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function sampleVar(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
}

function weighted<T>(rows: T[], value: (row: T) => number, weight: (row: T) => number): number {
  let num = 0
  let den = 0
  for (const row of rows) {
    const w = weight(row)
    num += value(row) * w
    den += w
  }
  return den === 0 ? 0 : num / den
}

function tCrit(df: number): number {
  const table: [number, number][] = [
    [1, 12.71],
    [2, 4.3],
    [3, 3.18],
    [4, 2.78],
    [5, 2.57],
    [6, 2.45],
    [8, 2.31],
    [10, 2.23],
    [12, 2.18],
    [15, 2.13],
    [20, 2.09],
    [30, 2.04],
    [60, 2.0],
    [120, 1.98],
  ]
  if (df < 1) return 12.71
  let previous = table[0][1]
  for (const [d, value] of table) {
    if (df < d) return previous
    previous = value
    if (df === d) return value
  }
  return 1.96
}

export function armHeadcount(study: Study, arm: Arm | "unassigned"): number {
  return study.teams.filter((team) => team.arm === arm && team.headcount >= study.privacyFloor).reduce((sum, team) => sum + team.headcount, 0)
}

export function proposeArms(study: Study): { teamId: string; arm: Arm }[] {
  const eligible = study.teams.filter((team) => team.headcount >= study.privacyFloor)
  if (study.design.type === "before_after") {
    return eligible.map((team) => ({ teamId: team.id, arm: "treatment" as const }))
  }
  const primary = study.primaryMetricId
  const scored = eligible.map((team) => {
    const pre = study.outcomes.filter(
      (point) => point.teamId === team.id && point.metricId === primary && isPre(point.period, study.design.rolloutDate),
    )
    const baseline = avg(pre.map((point) => point.value)) ?? team.headcount
    return { team, baseline }
  })
  scored.sort((a, b) => b.baseline - a.baseline || b.team.headcount - a.team.headcount)
  let treatN = 0
  let controlN = 0
  const out: { teamId: string; arm: Arm }[] = []
  for (const row of scored) {
    const arm: Arm = treatN <= controlN ? "treatment" : "control"
    if (arm === "treatment") treatN += row.team.headcount
    else controlN += row.team.headcount
    out.push({ teamId: row.team.id, arm })
  }
  return out
}

export interface CalcTeam {
  id: string
  name: string
  arm: string
  headcount: number
  included: boolean
  reason: string
}

export interface CalcRow {
  period: string
  team: string
  group: string
  metricId: string
  metric: string
  value: number
  n: number
  included: number
}

export interface CalcWeek {
  period: string
  phase: "pre" | "post"
  metricId: string
  treatment: number | null
  treatmentWeight: number
  control: number | null
  controlWeight: number
}

export interface CalcMetric {
  metricId: string
  name: string
  unit: string
  direction: Direction
  primary: boolean
  fit: Fit
}

export interface Calculation {
  floor: number
  comparison: boolean
  rolloutDate: string
  practicalEffectPct: number
  teams: CalcTeam[]
  rows: CalcRow[]
  weeks: CalcWeek[]
  metrics: CalcMetric[]
}

function groupLabel(arm: string): string {
  if (arm === "treatment") return "First wave"
  if (arm === "control") return "Hold back"
  return "Left out"
}

export function calculation(study: Study): Calculation {
  const floor = study.privacyFloor
  const comparison = study.design.type !== "before_after"
  const staggered = study.design.type === "staggered"
  const teams: CalcTeam[] = study.teams.map((team) => {
    const small = team.headcount < floor
    const unassigned = team.arm === "unassigned"
    return {
      id: team.id,
      name: team.name,
      arm: groupLabel(team.arm),
      headcount: team.headcount,
      included: !small && !unassigned,
      reason: small ? `Under ${floor} people` : unassigned ? "Not assigned to a wave" : "In the estimate",
    }
  })
  const byId = new Map(study.teams.map((team) => [team.id, team]))
  const rows: CalcRow[] = study.outcomes.map((point) => {
    const team = byId.get(point.teamId)
    const metric = study.metrics.find((item) => item.id === point.metricId)
    const included = Boolean(team && team.headcount >= floor && team.arm !== "unassigned" && point.n >= floor)
    return {
      period: point.period,
      team: team?.name ?? point.teamId,
      group: groupLabel(team?.arm ?? "unassigned"),
      metricId: point.metricId,
      metric: metric?.name ?? point.metricId,
      value: point.value,
      n: point.n,
      included: included ? 1 : 0,
    }
  })
  const visible = study.teams.filter((team) => team.headcount >= floor)
  const treatment = visible.filter((team) => team.arm === "treatment")
  const control = visible.filter((team) => team.arm === "control")
  const metrics: CalcMetric[] = []
  const weeks: CalcWeek[] = []
  for (const metric of study.metrics) {
    const periods = uniquePeriods(study.outcomes, metric.id)
    const preP = periods.filter((period) => isPre(period, study.design.rolloutDate))
    const postP = periods.filter((period) => isPost(period, study.design.rolloutDate, study.design.secondWaveDate, staggered))
    const tPre = weekMeans(study, metric.id, treatment, preP)
    const tPost = weekMeans(study, metric.id, treatment, postP)
    const cPre = comparison ? weekMeans(study, metric.id, control, preP) : []
    const cPost = comparison ? weekMeans(study, metric.id, control, postP) : []
    for (const point of mergeSeries(tPre, tPost, cPre, cPost)) {
      const sourceT = point.phase === "pre" ? tPre : tPost
      const sourceC = point.phase === "pre" ? cPre : cPost
      const treat = sourceT.find((row) => row.period === point.period)
      const hold = sourceC.find((row) => row.period === point.period)
      weeks.push({
        period: point.period,
        phase: point.phase,
        metricId: metric.id,
        treatment: treat?.value ?? null,
        treatmentWeight: treat?.weight ?? 0,
        control: comparison ? (hold?.value ?? null) : null,
        controlWeight: comparison ? (hold?.weight ?? 0) : 0,
      })
    }
    metrics.push({
      metricId: metric.id,
      name: metric.name,
      unit: metric.unit,
      direction: metric.direction,
      primary: metric.id === study.primaryMetricId,
      fit: fitWeeks(tPre, tPost, cPre, cPost, comparison),
    })
  }
  return { floor, comparison, rolloutDate: study.design.rolloutDate, practicalEffectPct: study.design.practicalEffectPct, teams, rows, weeks, metrics }
}
