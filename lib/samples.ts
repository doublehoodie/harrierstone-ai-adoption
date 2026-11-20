import { isPre } from "./dates"
import { buildDemos } from "./synthetic"
import type { Study } from "./types"

export function sampleCsv(kind: string): string | null {
  const northwind = buildDemos().find((study) => study.id === "northwind")
  const brightline = buildDemos().find((study) => study.id === "brightline")
  if (!northwind || !brightline) return null
  if (kind === "roles") return rolesCsv(northwind)
  if (kind === "outcomes-baseline") return outcomesCsv(northwind, "pre")
  if (kind === "outcomes-followup") return outcomesCsv(northwind, "post")
  if (kind === "usage") return usageCsv(northwind)
  if (kind === "agents") return agentsCsv(brightline)
  if (kind === "dx") return dxCsv(northwind)
  return null
}

function teamName(study: Study, teamId: string): string {
  return study.teams.find((team) => team.id === teamId)?.name ?? teamId
}

function rolesCsv(study: Study): string {
  const lines = ["title,team,headcount"]
  for (const team of study.teams) {
    const role = study.roles.find((item) => item.id === team.roleId)
    lines.push(csvRow([role?.title ?? "", team.name, String(team.headcount)]))
  }
  return lines.join("\n")
}

function outcomesCsv(study: Study, phase: "pre" | "post"): string {
  const lines = ["period,team,metric,value,n"]
  for (const point of study.outcomes) {
    const pre = isPre(point.period, study.design.rolloutDate)
    if (phase === "pre" ? !pre : pre) continue
    lines.push(csvRow([point.period, teamName(study, point.teamId), point.metricId, String(point.value), String(point.n)]))
  }
  return lines.join("\n")
}

function usageCsv(study: Study): string {
  const lines = ["period,team,active_users,sessions_per_user,breadth,seat_cost,token_cost"]
  for (const point of study.usage) {
    lines.push(
      csvRow([
        point.period,
        teamName(study, point.teamId),
        String(point.activeUsers),
        String(point.sessionsPerUser),
        String(point.breadth),
        String(point.seatCost),
        String(point.tokenCost),
      ]),
    )
  }
  return lines.join("\n")
}

function agentsCsv(study: Study): string {
  const lines = ["period,agent,team,spend,units,metric"]
  for (const point of study.agents) {
    lines.push(csvRow([point.period, point.agent, teamName(study, point.teamId), String(point.spend), String(point.units), point.metricId]))
  }
  return lines.join("\n")
}

function dxCsv(study: Study): string {
  const lines = ["week,team,pr_cycle_time_hours,change_failure_rate,prs_per_engineer"]
  const periods = [...new Set(study.outcomes.map((point) => point.period))].sort()
  for (const period of periods) {
    for (const team of study.teams) {
      const cycle = study.outcomes.find((point) => point.period === period && point.teamId === team.id && point.metricId === "eng.cycle_time")
      const fail = study.outcomes.find((point) => point.period === period && point.teamId === team.id && point.metricId === "eng.change_fail")
      const throughput = study.outcomes.find((point) => point.period === period && point.teamId === team.id && point.metricId === "eng.throughput")
      if (!cycle || !fail || !throughput) continue
      lines.push(csvRow([period, team.name, String(cycle.value), String(fail.value), String(throughput.value)]))
    }
  }
  return lines.join("\n")
}

function csvRow(cells: string[]): string {
  return cells.map((cell) => (cell.includes(",") ? `"${cell.replaceAll('"', '""')}"` : cell)).join(",")
}
