"use client"

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { askKestrelAction, confirmKestrel } from "@/app/actions"
import { gameplanReady, type Gameplan } from "@/lib/kestrel-plan"
import { FUNCTION_LABEL } from "@/lib/templates"
import { Status, useRunner } from "./use-runner"

export function KestrelDock({
  configured,
  tokensUsed,
  tokenCap,
}: {
  configured: boolean
  tokensUsed: number
  tokenCap: number
}) {
  const { run, pending, error } = useRunner()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [transcript, setTranscript] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [plan, setPlan] = useState<Gameplan | null>(null)
  const [used, setUsed] = useState(tokensUsed)
  const field = useRef<HTMLTextAreaElement>(null)
  const titleId = useId()
  const [size, setSize] = useState({ width: 384, height: 480 })
  const ready = plan ? gameplanReady(plan) : false

  useEffect(() => {
    if (!open) return
    setSize((current) => ({
      width: Math.min(current.width, window.innerWidth - 32),
      height: Math.min(current.height, window.innerHeight - 96),
    }))
    field.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  function startResize(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    const startX = event.clientX
    const startY = event.clientY
    const startW = size.width
    const startH = size.height
    function move(next: PointerEvent) {
      setSize({
        width: clamp(startW + (startX - next.clientX), 300, window.innerWidth - 32),
        height: clamp(startH + (startY - next.clientY), 280, window.innerHeight - 96),
      })
    }
    function stop() {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", stop)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", stop)
  }

  function ask() {
    const content = draft.trim()
    if (!content) return
    const next = [...transcript, { role: "user" as const, content }]
    setTranscript(next)
    setDraft("")
    run(async () => {
      const result = await askKestrelAction(next)
      setUsed(result.tokensUsed)
      if (!result.ok) return { ok: false, error: result.error }
      setPlan(result.plan)
      setTranscript((current) => [...current, { role: "assistant", content: messageFor(result.plan) }])
      return { ok: true }
    })
  }

  return (
    <div className="kestrel-dock no-print">
      {open && (
        <section className="kestrel-window" role="dialog" aria-labelledby={titleId} style={{ width: size.width, height: size.height }}>
          <button type="button" className="kestrel-resize" aria-label="Resize Kestrel" onPointerDown={startResize} />
          <div className="row justify-between">
            <h2 id={titleId} className="font-semibold">
              Kestrel
            </h2>
            <button type="button" className="kestrel-close" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <p className="text-sm text-muted">
            Testing cap: {used.toLocaleString("en-US")} of {tokenCap.toLocaleString("en-US")} tokens. Describe the rollout the way you would to a colleague.
          </p>
          {transcript.length > 0 && (
            <ol className="kestrel-log">
              {transcript.map((message, index) => (
                <li key={`${message.role}-${index}`} className={message.role === "user" ? "kestrel-user" : ""}>
                  {message.content}
                </li>
              ))}
            </ol>
          )}
          {!configured && <p className="form-note">Add OPENAI_API_KEY to .env.local and restart the dev server.</p>}
          <label className="stack">
            <span className="sr-only">What do you want to measure?</span>
            <textarea
              ref={field}
              className="input"
              rows={3}
              value={draft}
              disabled={!configured || pending}
              placeholder="We bought Cursor for platform engineering and I need to know if cycle time moved."
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  ask()
                }
              }}
            />
          </label>
          <div className="row">
            <button type="button" className="btn" disabled={!configured || pending || !draft.trim()} onClick={ask}>
              {pending ? "Writing the plan" : "Ask Kestrel"}
            </button>
            {ready && plan && (
              <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => confirmKestrel(plan))}>
                Create this study
              </button>
            )}
          </div>
          <Status error={error} warnings={[]} />
        </section>
      )}
      <button
        type="button"
        className="kestrel-fab"
        aria-expanded={open}
        aria-label={open ? "Close Kestrel" : "Open Kestrel"}
        onClick={() => setOpen((value) => !value)}
      >
        <img src="/kestrel-emblem.png" alt="" />
      </button>
    </div>
  )
}

function messageFor(plan: Gameplan): string {
  const lines = [plan.reply]
  const study = [plan.name, plan.tool].filter(Boolean).join(" · ")
  if (study) lines.push(`Study: ${study}`)
  if (plan.primaryMetricId) lines.push(`Metric: ${plan.primaryMetricId} · ${FUNCTION_LABEL[plan.functionId]}`)
  if (plan.holdBack) lines.push(`Groups: ${plan.holdBack}`)
  if (plan.fileNeeded) lines.push(`File: ${plan.fileNeeded}`)
  if (plan.questions[0]) lines.push(plan.questions[0])
  return lines.filter(Boolean).join("\n")
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}
