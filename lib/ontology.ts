import type { Exposure, Task } from "./types"

/**
 * O*NET-SOC titles and a short task list. AI exposure is HarrierStone's
 * reading of the task, not an O*NET field. Swap this module later without
 * touching the rest of the product: callers only use mapTitle and listOccupations.
 */
export interface Occupation {
  code: string
  title: string
  tasks: Task[]
}

export interface Mapping {
  code: string
  title: string
  confidence: number
  tasks: Task[]
}

const t = (name: string, exposure: Exposure): Task => ({ name, exposure })

const OCCUPATIONS: Occupation[] = [
  {
    code: "15-1252.00",
    title: "Software Developers",
    tasks: [
      t("Write and edit application code", "high"),
      t("Review and debug code", "high"),
      t("Write tests", "high"),
      t("Write technical documentation", "high"),
      t("Design a change with the people who will use it", "low"),
      t("Estimate work and sequence it", "low"),
    ],
  },
  {
    code: "15-1253.00",
    title: "Software Quality Assurance Analysts and Testers",
    tasks: [
      t("Write and run test cases", "high"),
      t("Log and triage defects", "medium"),
      t("Read requirements and spot gaps", "medium"),
      t("Decide whether a release is fit to ship", "low"),
    ],
  },
  {
    code: "15-1254.00",
    title: "Web Developers",
    tasks: [
      t("Build and adjust web interfaces", "high"),
      t("Fix front-end defects", "high"),
      t("Check a page in multiple browsers", "medium"),
      t("Talk through a layout with design", "low"),
    ],
  },
  {
    code: "15-1251.00",
    title: "Computer Programmers",
    tasks: [
      t("Convert specifications into code", "high"),
      t("Update existing programs", "high"),
      t("Write comments and support notes", "high"),
      t("Review results with the requester", "low"),
    ],
  },
  {
    code: "15-1211.00",
    title: "Computer Systems Analysts",
    tasks: [
      t("Document how a system works today", "medium"),
      t("Write requirements for a change", "medium"),
      t("Analyze logs and exception reports", "high"),
      t("Facilitate a decision between teams", "low"),
    ],
  },
  {
    code: "15-1212.00",
    title: "Information Security Analysts",
    tasks: [
      t("Review alerts and false positives", "medium"),
      t("Write security findings", "high"),
      t("Check configurations against a standard", "medium"),
      t("Respond to an active incident", "low"),
    ],
  },
  {
    code: "15-1242.00",
    title: "Database Administrators",
    tasks: [
      t("Write and tune queries", "high"),
      t("Review access requests", "medium"),
      t("Plan backup and recovery", "low"),
      t("Investigate a slow or failed job", "medium"),
    ],
  },
  {
    code: "15-1243.00",
    title: "Database Architects",
    tasks: [
      t("Design tables, pipelines, and data models", "medium"),
      t("Write transformation code", "high"),
      t("Check data quality", "high"),
      t("Agree definitions with the teams who use the data", "low"),
    ],
  },
  {
    code: "15-1244.00",
    title: "Network and Computer Systems Administrators",
    tasks: [
      t("Respond to system alerts", "medium"),
      t("Write and run operational scripts", "high"),
      t("Document incidents and runbooks", "high"),
      t("Plan capacity and maintenance windows", "low"),
    ],
  },
  {
    code: "15-2051.00",
    title: "Data Scientists",
    tasks: [
      t("Explore a dataset and write the code to do it", "high"),
      t("Fit and compare models", "high"),
      t("Write up a finding", "high"),
      t("Decide whether a model is fit to use", "low"),
    ],
  },
  {
    code: "11-3021.00",
    title: "Computer and Information Systems Managers",
    tasks: [
      t("Review status and unblock a team", "low"),
      t("Write a plan or a decision memo", "medium"),
      t("Hire and coach", "low"),
      t("Prioritize a portfolio of work", "low"),
    ],
  },
  {
    code: "13-1071.00",
    title: "Human Resources Specialists",
    tasks: [
      t("Screen applications against a role", "high"),
      t("Write job posts and candidate messages", "high"),
      t("Answer routine policy questions", "high"),
      t("Interview candidates", "low"),
      t("Advise a manager on a sensitive case", "low"),
    ],
  },
  {
    code: "11-3121.00",
    title: "Human Resources Managers",
    tasks: [
      t("Review a people proposal and decide", "low"),
      t("Write a policy or a leadership update", "medium"),
      t("Coach a manager through a hard conversation", "low"),
      t("Look across programs and choose where to spend", "low"),
    ],
  },
  {
    code: "13-1151.00",
    title: "Training and Development Specialists",
    tasks: [
      t("Draft training materials", "high"),
      t("Adapt a course to a team", "medium"),
      t("Deliver a session", "low"),
      t("Follow up on whether behavior changed", "medium"),
    ],
  },
  {
    code: "13-1141.00",
    title: "Compensation, Benefits, and Job Analysis Specialists",
    tasks: [
      t("Benchmark a role against market data", "medium"),
      t("Draft offer and pay-range language", "high"),
      t("Answer routine benefits questions", "high"),
      t("Recommend a pay decision", "low"),
    ],
  },
  {
    code: "43-4051.00",
    title: "Customer Service Representatives",
    tasks: [
      t("Answer a routine question from a knowledge base", "high"),
      t("Draft a customer reply", "high"),
      t("Look up an account and explain its state", "medium"),
      t("Handle an exception or an angry escalation", "low"),
      t("Write up a new issue for the product team", "medium"),
    ],
  },
  {
    code: "43-1011.00",
    title: "First-Line Supervisors of Office and Administrative Support Workers",
    tasks: [
      t("Review queue health and reassign work", "low"),
      t("Coach an agent on a case", "low"),
      t("Write a weekly operations note", "medium"),
      t("Handle the cases agents escalate", "low"),
    ],
  },
  {
    code: "41-3091.00",
    title: "Sales Representatives of Services",
    tasks: [
      t("Research an account before a call", "high"),
      t("Draft outreach and follow-up", "high"),
      t("Update the opportunity record", "high"),
      t("Run a sales conversation", "low"),
      t("Build a proposal with pricing judgment", "medium"),
    ],
  },
  {
    code: "41-9031.00",
    title: "Sales Engineers",
    tasks: [
      t("Prepare a demo environment", "medium"),
      t("Draft a technical answer to a prospect", "high"),
      t("Run a technical evaluation", "low"),
      t("Write the security and integration section of a proposal", "high"),
    ],
  },
  {
    code: "11-2022.00",
    title: "Sales Managers",
    tasks: [
      t("Review pipeline and forecast", "medium"),
      t("Coach a rep on a deal", "low"),
      t("Decide discounting and resourcing", "low"),
      t("Write a forecast note for leadership", "medium"),
    ],
  },
  {
    code: "13-2011.00",
    title: "Accountants and Auditors",
    tasks: [
      t("Reconcile accounts", "medium"),
      t("Draft footnotes and variance explanations", "high"),
      t("Check entries against a policy", "medium"),
      t("Sign off on a judgment call", "low"),
    ],
  },
  {
    code: "43-3031.00",
    title: "Bookkeeping, Accounting, and Auditing Clerks",
    tasks: [
      t("Enter and code transactions", "high"),
      t("Match invoices to receipts", "high"),
      t("Answer a vendor about a payment", "medium"),
      t("Flag something that does not match", "medium"),
    ],
  },
  {
    code: "13-2051.00",
    title: "Financial Analysts",
    tasks: [
      t("Build and update a forecast model", "high"),
      t("Write a variance commentary", "high"),
      t("Pull and check the source numbers", "medium"),
      t("Recommend a planning decision", "low"),
    ],
  },
  {
    code: "11-3031.00",
    title: "Financial Managers",
    tasks: [
      t("Review the close and the forecast", "low"),
      t("Write a decision memo for the leadership team", "medium"),
      t("Decide what to accrue or reserve", "low"),
      t("Set the close calendar and the owners", "low"),
    ],
  },
  {
    code: "13-1161.00",
    title: "Market Research Analysts and Marketing Specialists",
    tasks: [
      t("Draft campaign and lifecycle copy", "high"),
      t("Summarize performance of a campaign", "high"),
      t("Pull audience and pipeline numbers", "medium"),
      t("Choose a position and an offer", "low"),
    ],
  },
  {
    code: "11-2021.00",
    title: "Marketing Managers",
    tasks: [
      t("Review a campaign plan and decide", "low"),
      t("Rewrite a brief", "medium"),
      t("Allocate budget across channels", "low"),
      t("Report results to the executive team", "medium"),
    ],
  },
  {
    code: "27-3031.00",
    title: "Public Relations Specialists",
    tasks: [
      t("Draft a post, a pitch, or a release", "high"),
      t("Adapt a technical change for a general reader", "high"),
      t("Brief an executive before a conversation", "medium"),
      t("Handle a sensitive public question", "low"),
    ],
  },
  {
    code: "27-3042.00",
    title: "Technical Writers",
    tasks: [
      t("Draft and revise product documentation", "high"),
      t("Turn a changelog into release notes", "high"),
      t("Interview an engineer about how something works", "low"),
      t("Decide what a reader needs first", "low"),
    ],
  },
  {
    code: "13-1111.00",
    title: "Management Analysts",
    tasks: [
      t("Gather and clean operating data", "medium"),
      t("Draft findings and recommendations", "high"),
      t("Build the model behind a recommendation", "high"),
      t("Facilitate a decision with the operators", "low"),
    ],
  },
  {
    code: "11-1021.00",
    title: "General and Operations Managers",
    tasks: [
      t("Review operating results and choose a response", "low"),
      t("Write a plan or an update", "medium"),
      t("Remove a blocker between teams", "low"),
      t("Set priorities for the week", "low"),
    ],
  },
]

const BY_CODE = new Map(OCCUPATIONS.map((o) => [o.code, o]))

/** First match wins, so keep specific titles above general ones. */
const RULES: { re: RegExp; code: string; confidence: number }[] = [
  { re: /developer advocate|devrel|developer relations/i, code: "27-3031.00", confidence: 0.46 },
  { re: /technical writer|documentation engineer/i, code: "27-3042.00", confidence: 0.9 },
  { re: /site reliability|\bsre\b|devops/i, code: "15-1244.00", confidence: 0.62 },
  { re: /sales engineer|solutions engineer/i, code: "41-9031.00", confidence: 0.86 },
  { re: /information security|\bsecurity engineer\b|appsec|infosec|security analyst/i, code: "15-1212.00", confidence: 0.9 },
  { re: /data scientist|machine learning|ml engineer/i, code: "15-2051.00", confidence: 0.9 },
  { re: /data engineer|analytics engineer/i, code: "15-1243.00", confidence: 0.8 },
  { re: /database administrator|\bdba\b/i, code: "15-1242.00", confidence: 0.92 },
  { re: /\bqa\b|quality assurance|\bsdet\b|test engineer/i, code: "15-1253.00", confidence: 0.9 },
  { re: /mobile|ios engineer|android engineer/i, code: "15-1252.00", confidence: 0.84 },
  { re: /engineering manager|director of engineering|vp of engineering|head of engineering/i, code: "11-3021.00", confidence: 0.9 },
  { re: /software|backend|back-end|front[- ]?end|full[- ]?stack|product engineer|platform engineer|web developer/i, code: "15-1252.00", confidence: 0.93 },
  { re: /systems analyst|business systems/i, code: "15-1211.00", confidence: 0.84 },
  { re: /recruiter|talent partner|sourcer|talent acquisition/i, code: "13-1071.00", confidence: 0.9 },
  { re: /total rewards|compensation|benefits specialist/i, code: "13-1141.00", confidence: 0.9 },
  { re: /learning and development|\bl&d\b|training specialist|instructional/i, code: "13-1151.00", confidence: 0.88 },
  { re: /hr manager|human resources manager|head of people|chro|chief people/i, code: "11-3121.00", confidence: 0.86 },
  { re: /hr business partner|\bhrbp\b|people partner|people operations|human resources specialist|hr specialist|people ops/i, code: "13-1071.00", confidence: 0.88 },
  { re: /customer support|customer service|support specialist|support agent|contact center/i, code: "43-4051.00", confidence: 0.92 },
  { re: /support lead|support manager|support supervisor/i, code: "43-1011.00", confidence: 0.8 },
  { re: /account executive|\bae\b|sales representative|account manager/i, code: "41-3091.00", confidence: 0.88 },
  { re: /sales manager|head of sales|vp of sales/i, code: "11-2022.00", confidence: 0.9 },
  { re: /bookkeeper/i, code: "43-3031.00", confidence: 0.94 },
  { re: /financial analyst|\bfp&a\b/i, code: "13-2051.00", confidence: 0.9 },
  { re: /controller|finance manager|head of finance/i, code: "11-3031.00", confidence: 0.84 },
  { re: /accountant|accounting manager/i, code: "13-2011.00", confidence: 0.9 },
  { re: /marketing manager|head of marketing|vp of marketing/i, code: "11-2021.00", confidence: 0.88 },
  { re: /product marketing|demand gen|content market|growth market|marketing specialist/i, code: "13-1161.00", confidence: 0.84 },
  { re: /management consultant|business analyst|strategy analyst|operations analyst/i, code: "13-1111.00", confidence: 0.8 },
  { re: /general manager|operations manager|\bcoo\b/i, code: "11-1021.00", confidence: 0.78 },
  { re: /programmer/i, code: "15-1251.00", confidence: 0.8 },
]

export function listOccupations(): Occupation[] {
  return [...OCCUPATIONS].sort((a, b) => a.title.localeCompare(b.title))
}

export function occupation(code: string): Occupation | undefined {
  return BY_CODE.get(code)
}

export function mapTitle(title: string): Mapping | null {
  const trimmed = title.trim()
  if (!trimmed) return null
  const exact = OCCUPATIONS.find((o) => o.title.toLowerCase() === trimmed.toLowerCase())
  if (exact) {
    return { code: exact.code, title: exact.title, confidence: 0.97, tasks: exact.tasks }
  }
  for (const rule of RULES) {
    if (rule.re.test(trimmed)) {
      const occ = BY_CODE.get(rule.code)
      if (!occ) continue
      return { code: occ.code, title: occ.title, confidence: rule.confidence, tasks: occ.tasks }
    }
  }
  return null
}

export const AUTO_MAP_THRESHOLD = 0.75
