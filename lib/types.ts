export type FunctionId =
  | "hr"
  | "engineering"
  | "support"
  | "sales"
  | "finance"
  | "marketing"

export type Direction = "higher_better" | "lower_better"

export type Arm = "treatment" | "control"

export type InvestmentKind = "seats" | "agent" | "training" | "mixed"

export type Origin = "none" | "synthetic" | "upload"

export type Exposure = "high" | "medium" | "low"

export type Decision = "keep" | "expand" | "cut" | "inconclusive"

export type Confidence = "high" | "moderate" | "low" | "insufficient"

export interface Task {
  name: string
  exposure: Exposure
}

export interface Role {
  id: string
  title: string
  headcount: number
  onetCode: string | null
  onetTitle: string | null
  confidence: number
  tasks: Task[]
  reviewed: boolean
  /** First automatic match cleared 75% and was not replaced by hand. */
  autoMapped: boolean
  overridden: boolean
}

export interface Team {
  id: string
  name: string
  roleId: string
  headcount: number
  arm: Arm | "unassigned"
}

export interface Metric {
  id: string
  name: string
  description: string
  unit: string
  direction: Direction
  sourceHint: string
  custom: boolean
  /** When true, values are already per person and get multiplied by headcount for cost. */
  perPerson: boolean
  costDenominator: boolean
  /** Short noun for "cost per ___". */
  costUnit: string
}

export interface OutcomePoint {
  period: string
  teamId: string
  metricId: string
  value: number
  n: number
}

export interface UsagePoint {
  period: string
  teamId: string
  activeUsers: number
  sessionsPerUser: number
  breadth: number
  seatCost: number
  tokenCost: number
}

export interface AgentPoint {
  period: string
  agent: string
  teamId: string
  spend: number
  units: number
  metricId: string
}

export type SegmentId = "light" | "selective" | "embedded"

export interface UsageBand {
  teamId: string
  segment: SegmentId
  n: number
  sessionsPerUser: number
  breadth: number
  /** Change on the primary metric versus that team's own baseline. Descriptive only. */
  primaryDelta: number | null
}

export interface PulseItem {
  id: string
  text: string
  construct: string
}

export interface PulseScore {
  arm: Arm
  construct: string
  mean: number
  n: number
}

export interface SuppressedScore {
  arm: Arm
  construct: string
  n: number
}

export interface PulseWave {
  id: string
  kind: "baseline" | "followup"
  channel: "email" | "slack"
  sentAt: string
  invited: number
  responses: number
  items: PulseItem[]
  scores: PulseScore[]
  suppressed: SuppressedScore[]
  /** Set when the wave could not be split by group. */
  note?: string
}

export interface Amendment {
  at: string
  note: string
  what: "metrics" | "design"
}

/** A group check-in for one week. Counts only. Never a person. */
export interface CheckIn {
  period: string
  invited: number
  replies: number
}

/** A measurement week that is still being filed, one weekday at a time. */
export interface OpenWeek {
  /** Monday of the week being collected. */
  period: string
  /** Index in the measurement window, starting at 0. */
  index: number
  /** Weekdays already filed. 0–4. The next filing closes the week into the chart. */
  day: number
  invited: number
  replies: number
}

export interface StudyDesign {
  type: "comparison" | "staggered" | "before_after"
  rolloutDate: string
  secondWaveDate: string | null
  plannedPostWeeks: number
  /** Share of baseline that would be enough to matter. 0.1 = 10%. */
  practicalEffectPct: number
  locked: boolean
  lockedAt: string | null
  /** When false, a favorable result stays "keep" rather than "expand". */
  expandIntoControl: boolean
  /** True when the design was locked after measurement-window data already existed. */
  retrospective: boolean
}

export const SECTION_IDS = ["setup", "roles", "outcomes", "baseline", "design", "measure", "decide"] as const
export type SectionId = (typeof SECTION_IDS)[number]
export type SectionMark = "saved" | "done"

export interface Study {
  id: string
  demo: boolean
  company: string
  name: string
  functionId: FunctionId
  investmentKind: InvestmentKind
  tool: string
  summary: string
  population: string
  owner: string
  privacyFloor: number
  weeklyLoadedCost: number
  /** Training, services, or anything that is not seats, tokens, or agent spend. */
  otherSpend: number
  createdAt: string

  roles: Role[]
  teams: Team[]

  metrics: Metric[]
  primaryMetricId: string | null
  metricsLocked: boolean
  registeredAt: string | null

  design: StudyDesign
  /** Set while the current measurement week is still arriving day by day. */
  openWeek?: OpenWeek

  outcomes: OutcomePoint[]
  usage: UsagePoint[]
  agents: AgentPoint[]
  bands: UsageBand[]
  pulses: PulseWave[]
  /** Weekly check-in totals. Group counts only. */
  checkIns: CheckIn[]
  pulseSkipped: boolean
  noticePlanned: boolean
  amendments: Amendment[]

  origin: {
    org: Origin
    outcomes: Origin
    usage: Origin
    pulse: Origin
  }

  /** Saved keeps an outline check. Done fills it. */
  sections?: Partial<Record<SectionId, SectionMark>>
  /** Set when someone sends the rollout live. */
  wentLiveAt?: string | null
  /** Set while collection is paused. */
  pausedAt?: string | null
}

export interface TemplateMetric extends Omit<Metric, "custom"> {
  demo: {
    baseline: number
    noise: number
    treatShift: number
    controlShift: number
  }
}

export interface Template {
  id: FunctionId
  name: string
  audience: string
  blurb: string
  primaryMetricId: string
  defaultWeeklyLoadedCost: number
  metrics: TemplateMetric[]
  pulse: PulseItem[]
}
