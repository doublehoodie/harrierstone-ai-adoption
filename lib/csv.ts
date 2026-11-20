import { parseDate } from "./dates"
import type { AgentPoint, OutcomePoint, Study, UsagePoint } from "./types"

export interface CsvTable {
  headers: string[]
  rows: Record<string, string>[]
}

const ID_HEADERS = new Set([
  "email",
  "name",
  "employee_id",
  "employeeid",
  "user_id",
  "userid",
  "user",
  "employee",
  "first_name",
  "last_name",
  "full_name",
])

export function parseCsv(text: string): CsvTable {
  const clean = text.replace(/^\uFEFF/, "").trim()
  if (!clean) return { headers: [], rows: [] }
  const firstLine = clean.split(/\r?\n/, 1)[0]
  const commas = firstLine.match(/,/g)?.length ?? 0
  const semis = firstLine.match(/;/g)?.length ?? 0
  const delim = semis > commas ? ";" : ","
  const matrix: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]
    if (quoted) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += char
    } else if (char === '"') quoted = true
    else if (char === delim) {
      row.push(cell.trim())
      cell = ""
    } else if (char === "\n") {
      row.push(cell.trim())
      matrix.push(row)
      row = []
      cell = ""
    } else if (char !== "\r") cell += char
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim())
    matrix.push(row)
  }
  const headers = (matrix[0] ?? []).map(normalizeHeader)
  const rows = matrix.slice(1).filter((line) => line.some((value) => value !== "")).map((line) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = line[index] ?? ""
    })
    return record
  })
  return { headers, rows }
}

export function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
}

export function identifierWarning(headers: string[]): string | null {
  const found = headers.filter((header) => ID_HEADERS.has(header))
  if (found.length === 0) return null
  return "Name and identifier columns were discarded. Nothing is stored below the team."
}

function pick(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value != null && value !== "") return value
  }
  return ""
}

function num(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const pct = trimmed.endsWith("%")
  const parsed = Number(trimmed.replace(/[$,%\s]/g, "").replace(/,/g, ""))
  if (!Number.isFinite(parsed)) return null
  return pct ? parsed / 100 : parsed
}

export interface OrgRow {
  title: string
  team: string
  headcount: number
}

export function parseOrgCsv(text: string): { rows: OrgRow[]; warnings: string[]; errors: string[] } {
  const table = parseCsv(text)
  const warnings: string[] = []
  const errors: string[] = []
  const id = identifierWarning(table.headers)
  if (id) warnings.push(id)
  if (table.rows.length === 0) errors.push("The file has no rows.")
  const rows: OrgRow[] = []
  table.rows.forEach((row, index) => {
    const title = pick(row, ["title", "role", "job_title", "job"])
    const team = pick(row, ["team", "department", "org", "queue", "group"]) || title
    const head = num(pick(row, ["headcount", "count", "employees", "n", "people"]))
    if (!title || head == null) {
      errors.push(`Row ${index + 2} needs a title and a headcount.`)
      return
    }
    rows.push({ title, team, headcount: Math.round(head) })
  })
  return { rows, warnings, errors }
}

const DX: Record<string, string> = {
  pr_cycle_time_hours: "eng.cycle_time",
  pr_cycle_time: "eng.cycle_time",
  cycle_time: "eng.cycle_time",
  change_failure_rate: "eng.change_fail",
  prs_merged_per_engineer: "eng.throughput",
  prs_per_engineer: "eng.throughput",
  time_to_first_review: "eng.review_wait",
  time_to_resolution: "sup.resolution",
  resolution_hours: "sup.resolution",
  csat: "sup.csat",
  reopen_rate: "sup.reopen",
  tickets_per_agent: "sup.throughput",
  time_to_fill: "hr.time_to_fill",
  time_to_fill_days: "hr.time_to_fill",
}

export function parseOutcomeCsv(text: string, study: Study): { points: OutcomePoint[]; warnings: string[]; errors: string[] } {
  const table = parseCsv(text)
  const warnings: string[] = []
  const errors: string[] = []
  const id = identifierWarning(table.headers)
  if (id) warnings.push(id)
  if (!table.headers.some((header) => ["team", "department", "org", "queue"].includes(header))) {
    errors.push("This file has no team column. Aggregate it to a team before uploading. Person-level files are not stored.")
    return { points: [], warnings, errors }
  }
  const wide = table.headers.filter((header) => DX[header])
  const points: OutcomePoint[] = []
  table.rows.forEach((row, index) => {
    const period = parseDate(pick(row, ["period", "week", "date", "month"]))
    const teamName = pick(row, ["team", "department", "org", "queue"])
    const team = study.teams.find((item) => item.name.toLowerCase() === teamName.toLowerCase())
    if (!period || !team) {
      errors.push(`Row ${index + 2} needs a date and a team that is already in this study (${teamName || "missing"}).`)
      return
    }
    if (team.headcount < study.privacyFloor) {
      warnings.push(`${team.name} is under ${study.privacyFloor} people, so its rows were dropped.`)
      return
    }
    const n = num(pick(row, ["n", "sample", "headcount", "respondents"])) ?? team.headcount
    if (n < study.privacyFloor) {
      warnings.push(`A row for ${team.name} on ${period} was dropped because n is under ${study.privacyFloor}.`)
      return
    }
    if (wide.length > 0 && !pick(row, ["metric", "metric_id", "measure"])) {
      for (const header of wide) {
        const value = num(row[header] ?? "")
        if (value == null) continue
        const metricId = DX[header]
        if (!study.metrics.some((metric) => metric.id === metricId)) continue
        points.push({ period, teamId: team.id, metricId, value, n })
      }
      return
    }
    const metricToken = pick(row, ["metric", "metric_id", "measure"])
    const metric = study.metrics.find(
      (item) => item.id.toLowerCase() === metricToken.toLowerCase() || item.name.toLowerCase() === metricToken.toLowerCase(),
    )
    const value = num(pick(row, ["value", "amount", "result"]))
    if (!metric || value == null) {
      errors.push(`Row ${index + 2} needs a metric from this study and a numeric value.`)
      return
    }
    points.push({ period, teamId: team.id, metricId: metric.id, value, n })
  })
  if (points.length === 0 && errors.length === 0) errors.push("No outcome rows were usable.")
  return { points, warnings: unique(warnings), errors }
}

export function parseUsageCsv(text: string, study: Study): { points: UsagePoint[]; warnings: string[]; errors: string[] } {
  const table = parseCsv(text)
  const warnings: string[] = []
  const errors: string[] = []
  const id = identifierWarning(table.headers)
  if (id) warnings.push(id)
  if (!table.headers.some((header) => ["team", "department", "org", "queue"].includes(header))) {
    errors.push("Usage files need a team column. Person-level files are not stored.")
    return { points: [], warnings, errors }
  }
  const points: UsagePoint[] = []
  table.rows.forEach((row, index) => {
    const period = parseDate(pick(row, ["period", "week", "date", "month"]))
    const teamName = pick(row, ["team", "department", "org", "queue"])
    const team = study.teams.find((item) => item.name.toLowerCase() === teamName.toLowerCase())
    if (!period || !team) {
      errors.push(`Row ${index + 2} needs a date and a known team.`)
      return
    }
    if (team.headcount < study.privacyFloor) {
      warnings.push(`${team.name} is under ${study.privacyFloor} people, so its usage was dropped.`)
      return
    }
    const active = num(pick(row, ["active_users", "wau", "weekly_active_users", "active"])) ?? 0
    const sessions = num(pick(row, ["sessions_per_user", "uses_per_user", "sessions"])) ?? 0
    const breadth = num(pick(row, ["breadth", "feature_breadth", "task_breadth"])) ?? 0
    const seat = num(pick(row, ["seat_cost", "license_cost", "seats_cost"])) ?? 0
    const token = num(pick(row, ["token_cost", "api_cost", "model_cost"])) ?? 0
    points.push({
      period,
      teamId: team.id,
      activeUsers: active,
      sessionsPerUser: sessions,
      breadth: Math.max(0, Math.min(1, breadth)),
      seatCost: seat,
      tokenCost: token,
    })
  })
  if (points.length === 0 && errors.length === 0) errors.push("No usage rows were usable.")
  return { points, warnings: unique(warnings), errors }
}

export function parseAgentCsv(text: string, study: Study): { points: AgentPoint[]; warnings: string[]; errors: string[] } {
  const table = parseCsv(text)
  const warnings: string[] = []
  const errors: string[] = []
  const points: AgentPoint[] = []
  table.rows.forEach((row, index) => {
    const period = parseDate(pick(row, ["period", "week", "date", "month"]))
    const teamName = pick(row, ["team", "department", "queue"])
    const team = study.teams.find((item) => item.name.toLowerCase() === teamName.toLowerCase())
    const agent = pick(row, ["agent", "agent_name", "worker"]) || "Agent"
    const spend = num(pick(row, ["spend", "cost", "agent_cost"]))
    const units = num(pick(row, ["units", "completed", "tickets", "volume"]))
    const metricToken = pick(row, ["metric", "metric_id"])
    const metric =
      study.metrics.find((item) => item.id === metricToken || item.name.toLowerCase() === metricToken.toLowerCase()) ??
      study.metrics.find((item) => item.costDenominator)
    if (!period || !team || spend == null || units == null || !metric) {
      errors.push(`Row ${index + 2} needs a date, team, spend, units, and a metric.`)
      return
    }
    points.push({ period, agent, teamId: team.id, spend, units, metricId: metric.id })
  })
  if (points.length === 0 && errors.length === 0) errors.push("No agent rows were usable.")
  return { points, warnings, errors }
}

export function parseSpendCsv(text: string, study: Study): { points: UsagePoint[]; other: number; warnings: string[]; errors: string[] } {
  const table = parseCsv(text)
  const warnings: string[] = []
  const errors: string[] = []
  let other = 0
  const points: UsagePoint[] = []
  const hasCategory = table.headers.includes("category")
  table.rows.forEach((row, index) => {
    const period = parseDate(pick(row, ["period", "week", "date", "month"]))
    const amount = num(pick(row, ["amount", "spend", "cost", "value"]))
    if (!period || amount == null) {
      errors.push(`Row ${index + 2} needs a date and an amount.`)
      return
    }
    const category = pick(row, ["category", "type", "kind"]).toLowerCase()
    const teamName = pick(row, ["team", "department"])
    const team = study.teams.find((item) => item.name.toLowerCase() === teamName.toLowerCase()) ?? study.teams.find((item) => item.arm === "treatment")
    if (!team) {
      other += amount
      return
    }
    const seat = !hasCategory || /seat|licen/.test(category)
    const token = /token|api|model|usage/.test(category)
    if (!seat && !token) {
      other += amount
      return
    }
    points.push({
      period,
      teamId: team.id,
      activeUsers: 0,
      sessionsPerUser: 0,
      breadth: 0,
      seatCost: seat && !token ? amount : 0,
      tokenCost: token ? amount : 0,
    })
  })
  if (points.length === 0 && other === 0 && errors.length === 0) errors.push("No spend rows were usable.")
  return { points, other, warnings, errors }
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}
