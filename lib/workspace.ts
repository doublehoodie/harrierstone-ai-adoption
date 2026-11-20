export interface Connection {
  connected: boolean
  connectedAt: string | null
  address: string | null
}

export interface Workspace {
  name: string
  privacyFloor: number
  /** Whole percent, 1 to 80. New rollouts copy this into the study. */
  practicalEffectPct: number
  connections: Record<string, Connection>
}

export function defaultWorkspace(): Workspace {
  return {
    name: "Workspace",
    privacyFloor: 5,
    practicalEffectPct: 10,
    connections: {},
  }
}

export function normalizeWorkspace(value: Partial<Workspace> | undefined): Workspace {
  const base = defaultWorkspace()
  const floor = Number(value?.privacyFloor)
  const effect = Number(value?.practicalEffectPct)
  const connections: Record<string, Connection> = {}
  for (const [id, row] of Object.entries(value?.connections ?? {})) {
    if (!row || typeof row !== "object") continue
    connections[id] = {
      connected: row.connected === true,
      connectedAt: typeof row.connectedAt === "string" ? row.connectedAt : null,
      address: typeof row.address === "string" ? row.address : null,
    }
  }
  return {
    name: typeof value?.name === "string" && value.name.trim() ? value.name.trim() : base.name,
    privacyFloor: Number.isFinite(floor) ? Math.min(500, Math.max(5, Math.round(floor))) : base.privacyFloor,
    practicalEffectPct: Number.isFinite(effect) ? Math.min(80, Math.max(1, Math.round(effect))) : base.practicalEffectPct,
    connections,
  }
}

export function connectedCount(workspace: Workspace, ids: string[]): number {
  return ids.filter((id) => workspace.connections[id]?.connected).length
}
