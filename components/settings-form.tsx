"use client"

import { useActionState } from "react"
import { updateWorkspace } from "@/app/actions"
import type { ActionResult } from "@/lib/result"
import type { Workspace } from "@/lib/workspace"

const empty: ActionResult | null = null

export function SettingsForm({ workspace, mode }: { workspace: Workspace; mode: "general" | "privacy" }) {
  const [state, action, pending] = useActionState(updateWorkspace, empty)
  return (
    <form action={action} className="stack">
      {mode === "privacy" && <input type="hidden" name="name" value={workspace.name} />}
      {mode === "privacy" && <input type="hidden" name="practicalEffectPct" value={workspace.practicalEffectPct} />}
      {mode === "general" && <input type="hidden" name="privacyFloor" value={workspace.privacyFloor} />}
      {mode === "general" ? (
        <>
          <label className="field">
            <span>Workspace name</span>
            <input className="input" name="name" defaultValue={workspace.name} required />
          </label>
          <label className="field">
            <span>Improvement that would matter, %</span>
            <input className="input" name="practicalEffectPct" type="number" min={1} max={80} step={1} defaultValue={workspace.practicalEffectPct} required />
          </label>
          <p className="form-note">New rollouts start with this bar. A rollout that already exists keeps the number it was given.</p>
        </>
      ) : (
        <>
          <label className="field">
            <span>Privacy floor, people</span>
            <input className="input" name="privacyFloor" type="number" min={5} max={500} step={1} defaultValue={workspace.privacyFloor} required />
          </label>
          <p className="form-note">
            Groups under this size stay out of every result. Five is the lowest the product allows. New rollouts copy this floor. A rollout with its groups already confirmed keeps its own.
          </p>
        </>
      )}
      {state && !state.ok && <p className="form-error">{state.error}</p>}
      {state?.ok && <p className="form-note">Saved.</p>}
      <button className="btn" disabled={pending} type="submit">
        Save
      </button>
    </form>
  )
}
