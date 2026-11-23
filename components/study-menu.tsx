"use client"

import { useEffect, useRef, useState } from "react"
import { deleteStudy, pauseRollout, resumeRollout } from "@/app/actions"
import type { RolloutPhase } from "@/lib/progress"
import { Status, useRunner } from "./use-runner"

export function StudyMenu({ studyId, name = "", phase, canDelete }: { studyId: string; name?: string; phase: RolloutPhase; canDelete: boolean }) {
  const { run, pending, error, warnings } = useRunner()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [phrase, setPhrase] = useState("")
  const [place, setPlace] = useState<{ top: number; left: number } | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const confirmField = useRef<HTMLInputElement>(null)
  const matches = phrase === name && name.length > 0
  const canPause = phase === "live"
  const canResume = phase === "paused"

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false)
        setConfirming(false)
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
        setConfirming(false)
      }
    }
    document.addEventListener("pointerdown", onPointer)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  useEffect(() => {
    if (!confirming) return
    confirmField.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConfirming(false)
        setPhrase("")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [confirming])

  return (
    <div className="study-menu" ref={root}>
      <button
        type="button"
        className="study-menu-btn"
        aria-label="Rollout settings"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const width = 196
          const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8)
          const below = window.innerHeight - rect.bottom
          const top = below < 150 ? Math.max(8, rect.top - 132) : rect.bottom + 6
          setPlace({ top, left })
          setOpen((value) => !value)
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="3.2" cy="8" r="1.15" fill="currentColor" />
          <circle cx="8" cy="8" r="1.15" fill="currentColor" />
          <circle cx="12.8" cy="8" r="1.15" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="study-menu-panel" role="menu" style={place ? { top: place.top, left: place.left } : undefined}>
            <>
              {canPause && (
                <button
                  type="button"
                  className="study-menu-item"
                  role="menuitem"
                  disabled={pending}
                  onClick={() => {
                    setOpen(false)
                    run(() => pauseRollout(studyId))
                  }}
                >
                  Pause rollout
                </button>
              )}
              {canResume && (
                <button
                  type="button"
                  className="study-menu-item"
                  role="menuitem"
                  disabled={pending}
                  onClick={() => {
                    setOpen(false)
                    run(() => resumeRollout(studyId))
                  }}
                >
                  Resume collecting
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className="study-menu-item danger"
                  role="menuitem"
                  onClick={() => {
                    setPhrase("")
                    setOpen(false)
                    setConfirming(true)
                  }}
                >
                  Delete rollout
                </button>
              )}
              {!canPause && !canResume && !canDelete && <p className="text-sm text-muted">No changes from here.</p>}
            </>
          <Status error={error} warnings={warnings} />
        </div>
      )}
      {confirming && (
        <div className="confirm-backdrop" role="presentation" onClick={() => { setConfirming(false); setPhrase("") }}>
          <form
            className="confirm-dialog stack"
            role="alertdialog"
            aria-labelledby="delete-rollout-title"
            aria-describedby="delete-rollout-note"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault()
              if (!matches || pending) return
              void deleteStudy(studyId, phrase)
            }}
          >
            <h2 id="delete-rollout-title" className="font-semibold">Delete this rollout</h2>
            <p id="delete-rollout-note" className="text-sm">
              This removes the rollout and the files on it. Type <strong className="confirm-phrase">{name}</strong> to confirm.
            </p>
            <label className="field">
              <span className="sr-only">Rollout name</span>
              <input
                ref={confirmField}
                className="input"
                value={phrase}
                autoComplete="off"
                spellCheck={false}
                aria-label="Type the rollout name to confirm"
                onChange={(event) => setPhrase(event.target.value)}
              />
            </label>
            <div className="row">
              <button type="submit" className="btn btn-rust" disabled={!matches || pending}>
                {pending ? "Deleting…" : "Delete this rollout"}
              </button>
              <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => { setConfirming(false); setPhrase("") }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
