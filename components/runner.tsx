"use client"

import { useState, useTransition } from "react"
import type { ActionResult } from "@/lib/result"

export function useRunner() {
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [pending, start] = useTransition()

  function run(work: () => Promise<ActionResult | void>) {
    setError(null)
    start(async () => {
      const result = await work()
      if (result && !result.ok) {
        setError(result.error)
        setWarnings([])
        return
      }
      setWarnings(result?.warnings ?? [])
    })
  }

  return { error, warnings, pending, run }
}

export function Status({ error, warnings }: { error: string | null; warnings: string[] }) {
  if (!error && warnings.length === 0) return null
  return (
    <div className="stack">
      {error && <p className="form-error">{error}</p>}
      {warnings.map((warning) => (
        <p key={warning} className="form-note">
          {warning}
        </p>
      ))}
    </div>
  )
}

export function UploadButton({
  label,
  onFile,
  ghost = false,
}: {
  label: string
  onFile: (csv: string) => Promise<ActionResult>
  ghost?: boolean
}) {
  const { error, warnings, pending, run } = useRunner()
  return (
    <div className="stack">
      <label className={ghost ? "btn btn-ghost" : "btn"}>
        {pending ? "Working…" : label}
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.currentTarget.value = ""
            if (!file) return
            void file.text().then((csv) => run(() => onFile(csv)))
          }}
        />
      </label>
      <Status error={error} warnings={warnings} />
    </div>
  )
}

export function ActionButton({
  label,
  action,
  ghost = false,
  danger = false,
}: {
  label: string
  action: () => Promise<ActionResult | void>
  ghost?: boolean
  danger?: boolean
}) {
  const { error, warnings, pending, run } = useRunner()
  const className = danger ? "btn btn-rust" : ghost ? "btn btn-ghost" : "btn"
  return (
    <div className="stack">
      <button type="button" className={className} disabled={pending} onClick={() => run(action)}>
        {pending ? "Working…" : label}
      </button>
      <Status error={error} warnings={warnings} />
    </div>
  )
}

export function PrintButton() {
  return (
    <button type="button" className="btn btn-ghost no-print" onClick={() => window.print()}>
      Save as PDF
    </button>
  )
}
