"use client"

import { useState, useTransition } from "react"
import { setAllConnections, setConnection } from "@/app/actions"
import { Icon, sourceIcon } from "@/components/icon"
import { SOURCE_GROUPS, uploadAnchor, type SourceAdapter } from "@/lib/connectors"
import type { Connection } from "@/lib/workspace"

export function ConnectorList({
  sources,
  connections,
  bulk = false,
  fileLink = false,
}: {
  sources: SourceAdapter[]
  connections: Record<string, Connection>
  bulk?: boolean
  fileLink?: boolean
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const live = sources.filter((source) => source.mode === "unconfigured")
  const onCount = live.filter((source) => connections[source.id]?.connected).length

  function run(work: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    start(async () => {
      const result = await work()
      if (!result.ok) setError(result.error ?? "That did not save.")
    })
  }

  return (
    <div className="stack">
      <div className="row justify-between">
        <p className="text-sm text-muted">
          {onCount} of {live.length} connected. A connection records the source. Rows still arrive by upload until the admin grant is in place.
        </p>
        {bulk && (
          <div className="row">
            <button type="button" className="btn" disabled={pending || onCount === live.length} onClick={() => run(() => setAllConnections(true))}>
              Connect remaining
            </button>
            <button type="button" className="btn btn-ghost" disabled={pending || onCount === 0} onClick={() => run(() => setAllConnections(false))}>
              Disconnect all
            </button>
          </div>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
      {SOURCE_GROUPS.map((group) => {
        const rows = live.filter((source) => source.category === group.id)
        if (rows.length === 0) return null
        return (
          <section key={group.id} className="connector-group">
            <h2 className="connector-group-title">{group.label}</h2>
            <ul className="connector-list">
              {rows.map((source) => {
                const connection = connections[source.id]
                const connected = connection?.connected === true
                const expanded = open === source.id
                return (
                  <li key={source.id} className={expanded ? "connector-row open" : "connector-row"}>
                    <button type="button" className="connector-main" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : source.id)}>
                      <span className="connector-icon">
                        <Icon name={sourceIcon(source.id)} />
                      </span>
                      <span className="min-w-0">
                        <span className="connector-name">{source.name}</span>
                        <span className="connector-note">{source.note}</span>
                      </span>
                      <span className="status">
                        <span className={connected ? "status-dot good" : "status-dot"} />
                        {connected ? "Connected" : "Not connected"}
                      </span>
                    </button>
                    <div className="connector-actions">
                      {connected ? (
                        <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => setConnection(source.id, false))}>
                          Disconnect
                        </button>
                      ) : (
                        <button type="button" className="btn" disabled={pending} onClick={() => setOpen(source.id)}>
                          Connect
                        </button>
                      )}
                    </div>
                    {expanded && (
                      <div className="connector-detail">
                        <p>{source.access}</p>
                        <p>Stored as {source.writes} Email and user ids are dropped. A week that already exists is replaced.</p>
                        {connection?.address && <p>Server address on file: {connection.address}</p>}
                        {source.id === "mcp" && !connected && <McpAddress disabled={pending} onConnect={(address) => run(() => setConnection("mcp", true, address))} />}
                        {source.id !== "mcp" && !connected && (
                          <button type="button" className="btn" disabled={pending} onClick={() => run(() => setConnection(source.id, true))}>
                            Connect {source.name}
                          </button>
                        )}
                        {fileLink && (
                          <a className="text-link" href={uploadAnchor(source.category === "mcp" || source.category === "existing" ? "outcomes" : source.category)}>
                            <Icon name="upload" size={14} /> Use a file on this rollout
                          </a>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function McpAddress({ disabled, onConnect }: { disabled: boolean; onConnect: (address: string) => void }) {
  const [address, setAddress] = useState("")
  return (
    <div className="stack">
      <label className="field">
        <span>Server address</span>
        <input className="input" type="url" value={address} placeholder="https://mcp.example.com" onChange={(event) => setAddress(event.target.value)} />
      </label>
      <button type="button" className="btn" disabled={disabled || address.trim().length === 0} onClick={() => onConnect(address.trim())}>
        Connect MCP server
      </button>
    </div>
  )
}
