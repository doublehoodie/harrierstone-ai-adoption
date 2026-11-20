import type { FunctionId, Metric, PulseItem, Template, TemplateMetric } from "./types"

const sharedPulse = (work: string): PulseItem[] => [
  {
    id: "quality",
    construct: "Quality",
    text: `The ${work} I finished this week met the bar I hold for quality.`,
  },
  {
    id: "flow",
    construct: "Effectiveness",
    text: `I could finish core ${work} without avoidable waiting.`,
  },
  {
    id: "load",
    construct: "Cognitive load",
    text: "My work this week took more mental effort than it needed to.",
  },
  {
    id: "autonomy",
    construct: "Autonomy",
    text: "I had real discretion over how I did my work.",
  },
]

function m(metric: TemplateMetric): TemplateMetric {
  return metric
}

const engineering: Template = {
  id: "engineering",
  name: "Engineering",
  audience: "Product and platform engineering",
  blurb: "Cycle time, throughput, and whether changes hold up after they ship.",
  primaryMetricId: "eng.cycle_time",
  defaultWeeklyLoadedCost: 4500,
  pulse: sharedPulse("engineering work"),
  metrics: [
    m({
      id: "eng.cycle_time",
      name: "PR cycle time",
      description: "Median hours from a pull request opening to merge.",
      unit: "hours",
      direction: "lower_better",
      sourceHint: "GitHub, GitLab, or a DX export",
      perPerson: false,
      costDenominator: false,
      costUnit: "pull request",
      demo: { baseline: 46, noise: 1.3, treatShift: -10, controlShift: -1 },
    }),
    m({
      id: "eng.throughput",
      name: "PRs merged",
      description: "Merged pull requests per person per week.",
      unit: "PRs per person per week",
      direction: "higher_better",
      sourceHint: "GitHub or GitLab",
      perPerson: true,
      costDenominator: true,
      costUnit: "merged PR",
      demo: { baseline: 1.6, noise: 0.06, treatShift: 0.35, controlShift: 0.05 },
    }),
    m({
      id: "eng.change_fail",
      name: "Change failure rate",
      description: "Share of merged changes that needed a restore, hotfix, or rollback.",
      unit: "share",
      direction: "lower_better",
      sourceHint: "GitHub, incident tracker, or DX",
      perPerson: false,
      costDenominator: false,
      costUnit: "change",
      demo: { baseline: 0.12, noise: 0.006, treatShift: 0, controlShift: 0 },
    }),
    m({
      id: "eng.review_wait",
      name: "Time to first review",
      description: "Median hours a pull request waits for the first review.",
      unit: "hours",
      direction: "lower_better",
      sourceHint: "GitHub or GitLab",
      perPerson: false,
      costDenominator: false,
      costUnit: "review",
      demo: { baseline: 18, noise: 0.8, treatShift: -4, controlShift: -0.4 },
    }),
  ],
}

const support: Template = {
  id: "support",
  name: "Customer support",
  audience: "Support and success operations",
  blurb: "How long customers wait, whether the answer holds, and what a resolved ticket costs.",
  primaryMetricId: "sup.resolution",
  defaultWeeklyLoadedCost: 1900,
  pulse: [
    {
      id: "quality",
      construct: "Quality",
      text: "The replies I sent this week were ones I would stand behind.",
    },
    {
      id: "flow",
      construct: "Effectiveness",
      text: "I could resolve routine tickets without avoidable waiting.",
    },
    {
      id: "load",
      construct: "Cognitive load",
      text: "My queue this week took more mental effort than it needed to.",
    },
    {
      id: "autonomy",
      construct: "Autonomy",
      text: "I had real discretion over how I handled a ticket.",
    },
  ],
  metrics: [
    m({
      id: "sup.resolution",
      name: "Time to resolution",
      description: "Median hours from a ticket opening to resolution.",
      unit: "hours",
      direction: "lower_better",
      sourceHint: "Zendesk, Intercom, or a ticket export",
      perPerson: false,
      costDenominator: false,
      costUnit: "ticket",
      demo: { baseline: 18, noise: 0.45, treatShift: -7, controlShift: -0.4 },
    }),
    m({
      id: "sup.csat",
      name: "CSAT",
      description: "Mean customer satisfaction on resolved tickets, from 1 to 5.",
      unit: "score",
      direction: "higher_better",
      sourceHint: "The support tool's CSAT export",
      perPerson: false,
      costDenominator: false,
      costUnit: "response",
      demo: { baseline: 4.1, noise: 0.05, treatShift: 0.04, controlShift: 0.02 },
    }),
    m({
      id: "sup.reopen",
      name: "Reopen rate",
      description: "Share of resolved tickets that the customer reopened.",
      unit: "share",
      direction: "lower_better",
      sourceHint: "The support tool",
      perPerson: false,
      costDenominator: false,
      costUnit: "ticket",
      demo: { baseline: 0.08, noise: 0.004, treatShift: 0.004, controlShift: 0.002 },
    }),
    m({
      id: "sup.throughput",
      name: "Tickets resolved",
      description: "Tickets resolved per person per week.",
      unit: "tickets per person per week",
      direction: "higher_better",
      sourceHint: "The support tool",
      perPerson: true,
      costDenominator: true,
      costUnit: "resolved ticket",
      demo: { baseline: 20, noise: 0.4, treatShift: 4, controlShift: 0.3 },
    }),
  ],
}

const hr: Template = {
  id: "hr",
  name: "HR",
  audience: "People, talent, and HR operations",
  blurb: "Time to fill, whether new hires stay, and how fast internal HR cases close.",
  primaryMetricId: "hr.time_to_fill",
  defaultWeeklyLoadedCost: 2800,
  pulse: [
    {
      id: "quality",
      construct: "Quality",
      text: "The people work I finished this week was work I would stand behind.",
    },
    {
      id: "flow",
      construct: "Effectiveness",
      text: "I could finish core people-team tasks without avoidable waiting.",
    },
    {
      id: "load",
      construct: "Cognitive load",
      text: "My work this week took more mental effort than it needed to.",
    },
    {
      id: "autonomy",
      construct: "Autonomy",
      text: "I had real discretion over how I handled a case.",
    },
  ],
  metrics: [
    m({
      id: "hr.time_to_fill",
      name: "Time to fill",
      description: "Median days from a requisition opening to an accepted offer.",
      unit: "days",
      direction: "lower_better",
      sourceHint: "Greenhouse, Lever, Ashby, or an ATS export",
      perPerson: false,
      costDenominator: false,
      costUnit: "requisition",
      demo: { baseline: 48, noise: 6, treatShift: -1, controlShift: 0 },
    }),
    m({
      id: "hr.retention_90",
      name: "90-day retention",
      description: "Share of hires still employed 90 days after the start date.",
      unit: "share",
      direction: "higher_better",
      sourceHint: "HRIS",
      perPerson: false,
      costDenominator: false,
      costUnit: "hire",
      demo: { baseline: 0.91, noise: 0.02, treatShift: 0, controlShift: 0 },
    }),
    m({
      id: "hr.cycle",
      name: "HR case cycle time",
      description: "Median hours to close an internal HR case.",
      unit: "hours",
      direction: "lower_better",
      sourceHint: "ServiceNow, Jira, or the HR case tool",
      perPerson: false,
      costDenominator: false,
      costUnit: "case",
      demo: { baseline: 30, noise: 2, treatShift: -1, controlShift: -0.5 },
    }),
    m({
      id: "hr.reqs",
      name: "Requisitions filled",
      description: "Requisitions filled per week across the team in the study.",
      unit: "requisitions per week",
      direction: "higher_better",
      sourceHint: "ATS",
      perPerson: false,
      costDenominator: true,
      costUnit: "requisition filled",
      demo: { baseline: 3.2, noise: 0.3, treatShift: 0.1, controlShift: 0 },
    }),
  ],
}

const sales: Template = {
  id: "sales",
  name: "Sales",
  audience: "Quota-carrying sales teams",
  blurb: "Whether deals are won, how long they take, and pipeline created per rep.",
  primaryMetricId: "sales.win_rate",
  defaultWeeklyLoadedCost: 3200,
  pulse: sharedPulse("sales work"),
  metrics: [
    m({
      id: "sales.win_rate",
      name: "Win rate",
      description: "Share of decided opportunities that were won.",
      unit: "share",
      direction: "higher_better",
      sourceHint: "Salesforce or the CRM",
      perPerson: false,
      costDenominator: false,
      costUnit: "decided opportunity",
      demo: { baseline: 0.24, noise: 0.006, treatShift: 0, controlShift: 0 },
    }),
    m({
      id: "sales.cycle",
      name: "Sales cycle",
      description: "Median days from opportunity open to close.",
      unit: "days",
      direction: "lower_better",
      sourceHint: "CRM",
      perPerson: false,
      costDenominator: false,
      costUnit: "opportunity",
      demo: { baseline: 54, noise: 1.5, treatShift: -1, controlShift: -0.5 },
    }),
    m({
      id: "sales.pipeline",
      name: "Pipeline created",
      description: "New pipeline dollars per rep per week.",
      unit: "dollars",
      direction: "higher_better",
      sourceHint: "CRM",
      perPerson: true,
      costDenominator: true,
      costUnit: "pipeline dollar",
      demo: { baseline: 18000, noise: 400, treatShift: 200, controlShift: 100 },
    }),
  ],
}

const finance: Template = {
  id: "finance",
  name: "Finance and ops",
  audience: "Accounting, FP&A, and internal operations",
  blurb: "Close length, manual touches, and volume processed per person.",
  primaryMetricId: "fin.close",
  defaultWeeklyLoadedCost: 3000,
  pulse: sharedPulse("finance work"),
  metrics: [
    m({
      id: "fin.close",
      name: "Days to close",
      description: "Business days from period end to a closed set of books.",
      unit: "days",
      direction: "lower_better",
      sourceHint: "The close checklist or ERP",
      perPerson: false,
      costDenominator: false,
      costUnit: "close",
      demo: { baseline: 8, noise: 0.3, treatShift: -1.2, controlShift: -0.1 },
    }),
    m({
      id: "fin.touches",
      name: "Manual touches per close",
      description: "Hand-offs and spreadsheet fixes in a close.",
      unit: "touches",
      direction: "lower_better",
      sourceHint: "Close checklist",
      perPerson: false,
      costDenominator: false,
      costUnit: "touch",
      demo: { baseline: 40, noise: 1, treatShift: -6, controlShift: -1 },
    }),
    m({
      id: "fin.invoices",
      name: "Invoices processed",
      description: "Invoices processed per person per week.",
      unit: "invoices per person per week",
      direction: "higher_better",
      sourceHint: "AP system",
      perPerson: true,
      costDenominator: true,
      costUnit: "invoice",
      demo: { baseline: 45, noise: 1, treatShift: 6, controlShift: 1 },
    }),
  ],
}

const marketing: Template = {
  id: "marketing",
  name: "Marketing",
  audience: "Campaign, content, and product marketing",
  blurb: "How long a campaign takes, how much ships, and what a qualified lead costs.",
  primaryMetricId: "mkt.cycle",
  defaultWeeklyLoadedCost: 2600,
  pulse: sharedPulse("marketing work"),
  metrics: [
    m({
      id: "mkt.cycle",
      name: "Campaign cycle time",
      description: "Median days from a brief to launch.",
      unit: "days",
      direction: "lower_better",
      sourceHint: "Work management tool or a marketing ops export",
      perPerson: false,
      costDenominator: false,
      costUnit: "campaign",
      demo: { baseline: 21, noise: 0.8, treatShift: -4, controlShift: -0.5 },
    }),
    m({
      id: "mkt.output",
      name: "Assets shipped",
      description: "Finished assets per person per week.",
      unit: "assets per person per week",
      direction: "higher_better",
      sourceHint: "Work management tool",
      perPerson: true,
      costDenominator: true,
      costUnit: "asset",
      demo: { baseline: 3.4, noise: 0.15, treatShift: 0.8, controlShift: 0.1 },
    }),
    m({
      id: "mkt.cpl",
      name: "Cost per qualified lead",
      description: "Spend divided by marketing-qualified leads.",
      unit: "dollars",
      direction: "lower_better",
      sourceHint: "Ads platform plus CRM",
      perPerson: false,
      costDenominator: false,
      costUnit: "qualified lead",
      demo: { baseline: 180, noise: 6, treatShift: -15, controlShift: -2 },
    }),
  ],
}

const TEMPLATES: Template[] = [hr, engineering, support, sales, finance, marketing]

export function listTemplates(): Template[] {
  return TEMPLATES
}

export function getTemplate(id: FunctionId): Template {
  const found = TEMPLATES.find((t) => t.id === id)
  if (!found) throw new Error(`Unknown function ${id}`)
  return found
}

export function templateMetric(id: string): TemplateMetric | undefined {
  for (const template of TEMPLATES) {
    const metric = template.metrics.find((m) => m.id === id)
    if (metric) return metric
  }
  return undefined
}

export function toMetric(metric: TemplateMetric): Metric {
  const { demo: _demo, ...rest } = metric
  return { ...rest, custom: false }
}

export const FUNCTION_LABEL: Record<FunctionId, string> = {
  hr: "HR",
  engineering: "Engineering",
  support: "Customer support",
  sales: "Sales",
  finance: "Finance and ops",
  marketing: "Marketing",
}
