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
      if (!result) return
      if (!result.ok) {
        setError(result.error)
        setWarnings([])
        return
      }
      setWarnings(result.warnings ?? [])
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
  disabled,
  onFile,
}: {
  label: string
  disabled?: boolean
  onFile: (text: string) => void
}) {
  return (
    <label className="btn btn-ghost">
      {label}
      <input
        type="file"
        accept=".csv,text/csv,text/plain"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (!file) return
          void file.text().then(onFile)
        }}
      />
    </label>
  )
}
