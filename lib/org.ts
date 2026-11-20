import { AUTO_MAP_THRESHOLD, mapTitle } from "./ontology"
import { slug } from "./study"
import type { Origin, Role, Study, Team } from "./types"

export interface OrgInput {
  title: string
  team: string
  headcount: number
}

export function installOrg(study: Study, rows: OrgInput[], origin: Origin): void {
  const roles = new Map<string, Role>()
  const teams: Team[] = []
  const usedTeamIds = new Set<string>()
  for (const row of rows) {
    const roleId = `role-${slug(row.title)}`
    let role = roles.get(roleId)
    if (!role) {
      role = roleFromTitle(roleId, row.title)
      roles.set(roleId, role)
    }
    role.headcount += row.headcount
    let teamId = `team-${slug(row.team)}`
    if (usedTeamIds.has(teamId)) teamId = `${teamId}-${usedTeamIds.size}`
    usedTeamIds.add(teamId)
    teams.push({
      id: teamId,
      name: row.team,
      roleId,
      headcount: row.headcount,
      arm: "unassigned",
    })
  }
  study.roles = [...roles.values()]
  study.teams = teams
  study.origin.org = origin
  study.outcomes = []
  study.usage = []
  study.agents = []
  study.bands = []
  study.design.locked = false
  study.design.lockedAt = null
}

export function roleFromTitle(id: string, title: string): Role {
  const mapped = mapTitle(title)
  return {
    id,
    title,
    headcount: 0,
    onetCode: mapped?.code ?? null,
    onetTitle: mapped?.title ?? null,
    confidence: mapped?.confidence ?? 0,
    tasks: mapped?.tasks ?? [],
    reviewed: false,
    autoMapped: (mapped?.confidence ?? 0) >= AUTO_MAP_THRESHOLD,
    overridden: false,
  }
}

export function addExtraRole(study: Study, title: string, headcount: number): void {
  const id = `role-${slug(title)}`
  const existing = study.roles.find((role) => role.id === id)
  if (existing) {
    existing.headcount += headcount
    return
  }
  const role = roleFromTitle(id, title)
  role.headcount = headcount
  study.roles.push(role)
}
