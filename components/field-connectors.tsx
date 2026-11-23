"use client"

import { useState, useTransition } from "react"
import { setConnection } from "@/app/actions"
import type { SourceAdapter } from "@/lib/connectors"
import type { Connection } from "@/lib/workspace"

export function FieldConnectors({
  sources,
  connections,
}: {
  sources: SourceAdapter[]
  connections: Record<string, Connection>
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function record(source: SourceAdapter, connected: boolean) {
    setError(null)
    start(async () => {
      const result = await setConnection(source.id, connected)
      if (!result.ok) setError(result.error ?? "That did not save.")
    })
  }

  if (sources.length === 0) return null

  return (
    <div className="stack">
      <p className="text-sm text-muted">Connect the account the company already uses. Connecting records the source. This demo does not pull rows.</p>
      <ul className="field-sources">
        {sources.map((source) => {
          const connected = connections[source.id]?.connected === true
          return (
            <li key={source.id}>
              <span className="min-w-0">
                <span className="connector-name">{connected ? `${source.name} · Recorded` : source.name}</span>
                <span className="connector-note">{source.note}</span>
              </span>
              <button type="button" className={connected ? "btn btn-ghost" : "btn"} disabled={pending} onClick={() => record(source, !connected)}>
                {connected ? "Disconnect" : "Connect"}
              </button>
            </li>
          )
        })}
      </ul>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
