"use client"

import { useActionState } from "react"
import {
  acceptHighConfidence,
  acceptRole,
  addCustomMetric,
  amendStudy,
  applyProposal,
  createStudy,
  generateBaseline,
  generateMeasurement,
  launchPulse,
  lockDesign,
  lockMetrics,
  markNotice,
  resetDemoStudies,
  setArm,
  setAssumptions,
  setPrimary,
  setRoleMapping,
  skipPulse,
  toggleMetric,
  updateDesign,
  updateSetup,
  uploadAgents,
  uploadOrg,
  uploadOutcomes,
  uploadSpend,
  uploadUsage,
  useSampleOrg,
} from "@/app/actions"
import { Status, UploadButton, useRunner } from "@/components/use-runner"
import { formatPct } from "@/lib/format"
import { lockPhrase } from "@/lib/method"
import type { ActionResult } from "@/lib/result"
import type { Occupation } from "@/lib/ontology"
import type { Arm, Study, Template } from "@/lib/types"

const empty: ActionResult | null = null

export function PrintButton() {
  return (
    <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
      Save as PDF
    </button>
  )
}

export function ResetDemos() {
  const { run, pending, error } = useRunner()
  return (
    <div>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={pending}
        onClick={() => {
          if (!confirm("Reset the four demo studies? Studies you created stay.")) return
          run(() => resetDemoStudies())
        }}
      >
        {pending ? "Resetting…" : "Reset sample rollouts"}
      </button>
      {error && <p className="form-error mt-2">{error}</p>}
    </div>
  )
}

export function NewStudyForm({ defaultDate }: { defaultDate: string }) {
  const [state, action, pending] = useActionState(createStudy, empty)
  return (
    <form action={action} className="stack">
      <StudyFields defaultDate={defaultDate} />
      {state && !state.ok && <p className="form-error">{state.error}</p>}
      <button className="btn" disabled={pending} type="submit">
        {pending ? "Creating…" : "Create study"}
      </button>
    </form>
  )
}

export function SetupForm({ study }: { study: Study }) {
  const [state, action, pending] = useActionState(updateSetup, empty)
  return (
    <form action={action} className="stack">
      <input type="hidden" name="id" value={study.id} />
      <StudyFields study={study} />
      <label className="field">
        <span>Privacy floor</span>
        <input className="input" name="privacyFloor" type="number" min={5} defaultValue={study.privacyFloor} />
      </label>
      <p className="form-note">Groups smaller than this are hidden in every result. It cannot go below 5.</p>
      {state && !state.ok && <p className="form-error">{state.error}</p>}
      {state?.ok && <p className="form-note">Saved.</p>}
      <div className="row">
        <button className="btn" disabled={pending} type="submit">
          {pending ? "Saving…" : "Save setup"}
        </button>
      </div>
    </form>
  )
}

function StudyFields({ study, defaultDate }: { study?: Study; defaultDate?: string }) {
  return (
    <>
      <div className="grid-2">
        <label className="field">
          <span>Company</span>
          <input className="input" name="company" required defaultValue={study?.company ?? ""} />
        </label>
        <label className="field">
          <span>Study name</span>
          <input className="input" name="name" required defaultValue={study?.name ?? ""} />
        </label>
        <label className="field">
          <span>Tool or agent</span>
          <input className="input" name="tool" required defaultValue={study?.tool ?? ""} />
        </label>
        <label className="field">
          <span>Who it covers</span>
          <input className="input" name="population" required defaultValue={study?.population ?? ""} placeholder="Product engineering" />
        </label>
        <label className="field">
          <span>Owner</span>
          <input className="input" name="owner" required defaultValue={study?.owner ?? ""} placeholder="VP Engineering" />
        </label>
        <label className="field">
          <span>Rollout date</span>
          <input className="input" name="rolloutDate" type="date" required defaultValue={study?.design.rolloutDate ?? defaultDate} />
        </label>
        <label className="field">
          <span>Function</span>
          <select className="input" name="functionId" defaultValue={study?.functionId ?? "engineering"}>
            <option value="hr">HR</option>
            <option value="engineering">Engineering</option>
            <option value="support">Customer support</option>
            <option value="sales">Sales</option>
            <option value="finance">Finance and ops</option>
            <option value="marketing">Marketing</option>
          </select>
        </label>
        <label className="field">
          <span>Investment</span>
          <select className="input" name="investmentKind" defaultValue={study?.investmentKind ?? "seats"}>
            <option value="seats">Seats</option>
            <option value="agent">Agent</option>
            <option value="training">Training</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
      </div>
      <label className="field">
        <span>What is being rolled out</span>
        <textarea className="input" name="summary" defaultValue={study?.summary ?? ""} placeholder="Who gets it, who is held back, and which number this study will read." />
      </label>
    </>
  )
}

export function RolesPanel({ study, occupations }: { study: Study; occupations: Occupation[] }) {
  const { run, pending, error, warnings } = useRunner()
  const roles = [...study.roles].sort((a, b) => Number(a.reviewed) - Number(b.reviewed) || a.confidence - b.confidence)
  const auto = study.roles.filter((role) => role.autoMapped).length
  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn" disabled={pending} onClick={() => run(() => useSampleOrg(study.id))}>
          Load a sample org
        </button>
        <UploadButton label="Upload CSV" disabled={pending} onFile={(csv) => run(() => uploadOrg(study.id, csv))} />
        <a className="btn btn-ghost" href="/samples/roles">
          Sample file
        </a>
        <button type="button" className="btn btn-ghost" disabled={pending || roles.length === 0} onClick={() => run(() => acceptHighConfidence(study.id))}>
          Accept high-confidence matches
        </button>
      </div>
      <Status error={error} warnings={warnings} />
      <p className="form-note">
        Columns: title, team, headcount. Names and emails are discarded. {study.roles.length > 0 && `${auto} of ${study.roles.length} titles matched at 75% or better.`}
      </p>
      {roles.map((role) => (
        <article key={role.id} className="card stack">
          <div className="row justify-between">
            <div>
              <h3 className="text-lg font-semibold">{role.title}</h3>
              <p className="text-sm text-muted">
                {role.headcount} {role.headcount === 1 ? "person" : "people"}
                {role.headcount < study.privacyFloor ? ` · under ${study.privacyFloor}, so this title stays out of results` : ""}
                {role.onetTitle ? ` · ${role.onetTitle}` : " · no match yet"}
                {role.onetCode ? ` · ${role.onetCode}` : ""}
              </p>
            </div>
            <div className="row">
              {role.reviewed && <span className="pill pill-good">Reviewed</span>}
              {role.overridden && <span className="pill">Edited</span>}
              {!role.autoMapped && !role.reviewed && <span className="pill pill-amber">Needs a look</span>}
              {role.autoMapped && <span className="pill pill-teal">{formatPct(role.confidence)} match</span>}
              {!role.autoMapped && role.confidence > 0 && <span className="pill">{formatPct(role.confidence)} match</span>}
            </div>
          </div>
          <div className="row">
            <label className="field" style={{ minWidth: "16rem", flex: 1 }}>
              <span>Closest occupation</span>
              <select
                className="input"
                value={role.onetCode ?? ""}
                onChange={(event) => {
                  const code = event.target.value
                  if (!code) return
                  run(() => setRoleMapping(study.id, role.id, code))
                }}
              >
                <option value="">Choose…</option>
                {occupations.map((occupation) => (
                  <option key={occupation.code} value={occupation.code}>
                    {occupation.title}
                  </option>
                ))}
              </select>
            </label>
            {!role.reviewed && (
              <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => acceptRole(study.id, role.id))}>
                Accept
              </button>
            )}
          </div>
          {role.tasks.length > 0 && (
            <div className="row">
              {role.tasks.map((task) => (
                <span key={task.name} className={`pill exposure-${task.exposure}`} title={`AI exposure: ${task.exposure}`}>
                  {task.name}
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
      <p className="form-note">Confirm a title when the suggested job looks wrong. Groups under five people stay out of every result.</p>
    </div>
  )
}

export function OutcomesPanel({ study, templates }: { study: Study; templates: Template[] }) {
  const { run, pending, error, warnings } = useRunner()
  const [amendState, amendAction, amendPending] = useActionState(amendStudy, empty)
  const [customState, customAction, customPending] = useActionState(addCustomMetric, empty)
  const selected = new Set(study.metrics.map((metric) => metric.id))
  return (
    <div className="stack">
      {study.metricsLocked && (
        <div className="callout callout-good">
          <p className="callout-title">{lockPhrase(study.registeredAt, study.design.rolloutDate)}</p>
          <p>These are the metrics you agreed. They stay fixed. Changing them marks the estimate exploratory.</p>
        </div>
      )}
      {study.metrics.map((metric) => (
        <article key={metric.id} className="card">
          <div className="row justify-between">
            <div>
              <h3 className="font-semibold">
                {metric.name} {study.primaryMetricId === metric.id && <span className="pill pill-teal">Primary</span>}
              </h3>
              <p className="text-sm text-muted">{metric.description}</p>
              <p className="text-sm text-muted">
                {metric.direction === "lower_better" ? "Lower is better" : "Higher is better"} · {metric.unit} · {metric.sourceHint}
              </p>
            </div>
            {!study.metricsLocked && (
              <div className="row">
                {study.primaryMetricId !== metric.id && (
                  <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => setPrimary(study.id, metric.id))}>
                    Make primary
                  </button>
                )}
                <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => toggleMetric(study.id, metric.id))}>
                  Remove
                </button>
              </div>
            )}
          </div>
        </article>
      ))}
      {!study.metricsLocked && (
        <>
          <div className="card stack">
            <h3 className="font-semibold">Add a template metric</h3>
            {templates.map((template) => {
              const available = template.metrics.filter((metric) => !selected.has(metric.id))
              if (available.length === 0) return null
              return (
                <div key={template.id}>
                  <p className="kicker mb-2">{template.name}</p>
                  <div className="row">
                    {available.map((metric) => (
                      <button key={metric.id} type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => toggleMetric(study.id, metric.id))}>
                        {metric.name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <form action={customAction} className="card stack">
            <h3 className="font-semibold">Custom metric</h3>
            <input type="hidden" name="id" value={study.id} />
            <div className="grid-2">
              <label className="field">
                <span>Name</span>
                <input className="input" name="name" />
              </label>
              <label className="field">
                <span>Unit</span>
                <input className="input" name="unit" placeholder="hours" />
              </label>
              <label className="field">
                <span>Direction</span>
                <select className="input" name="direction" defaultValue="lower_better">
                  <option value="lower_better">Lower is better</option>
                  <option value="higher_better">Higher is better</option>
                </select>
              </label>
              <label className="field">
                <span>Description</span>
                <input className="input" name="description" />
              </label>
            </div>
            {customState && !customState.ok && <p className="form-error">{customState.error}</p>}
            <button className="btn btn-ghost" disabled={customPending} type="submit">
              Add metric
            </button>
          </form>
          <button type="button" className="btn" disabled={pending} onClick={() => run(() => lockMetrics(study.id))}>
            Agree these metrics
          </button>
          <p className="form-note">After this, the outcome hangs on this list, and on the primary metric.</p>
        </>
      )}
      {study.metricsLocked && (
        <form action={amendAction} className="card stack">
          <h3 className="font-semibold">Change the agreed metrics</h3>
          <p className="text-sm text-muted">Changing the agreed metrics marks this estimate exploratory.</p>
          <input type="hidden" name="id" value={study.id} />
          <input type="hidden" name="what" value="metrics" />
          <textarea className="input" name="note" placeholder="What changed, and why." />
          {amendState && !amendState.ok && <p className="form-error">{amendState.error}</p>}
          <button className="btn btn-rust" disabled={amendPending} type="submit">
            Amend and unlock
          </button>
        </form>
      )}
      <Status error={error} warnings={warnings} />
    </div>
  )
}

export function BaselinePanel({ study }: { study: Study }) {
  const { run, pending, error, warnings } = useRunner()
  return (
    <div className="stack">
      <div className="card stack">
        <h3 className="font-semibold">Weeks before the rollout</h3>
        <p className="text-sm text-muted">Upload a CSV from the system you already use. Columns: period, team, metric, value, n. An engineering export with pr_cycle_time_hours works too.</p>
        <div className="row">
          <UploadButton label="Upload CSV" disabled={pending} onFile={(csv) => run(() => uploadOutcomes(study.id, csv))} />
          <a className="btn btn-ghost" href="/samples/outcomes-baseline">
            Example file
          </a>
        </div>
        <details>
          <summary className="cursor-pointer text-sm text-muted">Use sample numbers instead</summary>
          <div className="row mt-3">
            <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => generateBaseline(study.id))}>
              Fill eight sample weeks
            </button>
          </div>
        </details>
      </div>
      <div className="card stack">
        <h3 className="font-semibold">Short check-in</h3>
        <p className="text-sm text-muted">Four questions, same wording every time. Sending from here records sample answers. It does not email anyone yet.</p>
        <div className="row">
          <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => launchPulse(study.id, "email"))}>
            Record an email wave
          </button>
          <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => launchPulse(study.id, "slack"))}>
            Record a Slack wave
          </button>
          <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => skipPulse(study.id))}>
            Skip it
          </button>
        </div>
        {study.pulses.map((wave) => (
          <p key={wave.id} className="text-sm">
            {wave.kind === "baseline" ? "Baseline" : "Follow-up"} via {wave.channel}: {wave.responses} of {wave.invited} responses
            {wave.note ? `. ${wave.note}` : ""}
          </p>
        ))}
        {study.pulseSkipped && <p className="text-sm">Pulse marked as skipped. The reading will say employee experience is not in it.</p>}
      </div>
      <div className="card stack">
        <h3 className="font-semibold">Employee notice</h3>
        <p className="text-sm text-muted">Send this before the first pulse. People should know what is collected and that they will not be reported on individually.</p>
        <div className="row">
          <a className="btn btn-ghost" href={`/notice/${study.id}`}>
            Open the notice
          </a>
          {!study.noticePlanned && (
            <button type="button" className="btn" disabled={pending} onClick={() => run(() => markNotice(study.id))}>
              Notice is planned
            </button>
          )}
          {study.noticePlanned && <span className="pill pill-good">Notice planned</span>}
        </div>
      </div>
      <Status error={error} warnings={warnings} />
    </div>
  )
}

export function DesignPanel({
  study,
  balance,
  postAlreadyIn,
}: {
  study: Study
  balance: string | null
  postAlreadyIn: boolean
}) {
  const { run, pending, error, warnings } = useRunner()
  const [state, action, formPending] = useActionState(updateDesign, empty)
  const [amendState, amendAction, amendPending] = useActionState(amendStudy, empty)
  return (
    <div className="stack">
      {!study.design.locked && (
        <form action={action} className="card stack">
          <input type="hidden" name="id" value={study.id} />
          <label className="field">
            <span>How it rolls out</span>
            <select className="input" name="type" defaultValue={study.design.type}>
              <option value="comparison">Hold a group back</option>
              <option value="staggered">Give it to them later</option>
              <option value="before_after">Everyone at once</option>
            </select>
          </label>
          <div className="grid-2">
            <label className="field">
              <span>Improvement that would make this worth it, %</span>
              <input className="input" name="practicalEffectPct" type="number" min={1} max={80} step={1} defaultValue={Math.round(study.design.practicalEffectPct * 100)} />
            </label>
            <label className="field">
              <span>Planned measurement weeks</span>
              <input className="input" name="plannedPostWeeks" type="number" min={4} max={52} defaultValue={study.design.plannedPostWeeks} />
            </label>
            <label className="field">
              <span>Later wave starts</span>
              <input className="input" name="secondWaveDate" type="date" defaultValue={study.design.secondWaveDate ?? ""} />
            </label>
          </div>
          <label className="row text-sm">
            <input type="checkbox" name="expandIntoControl" defaultChecked={study.design.expandIntoControl} />
            The held-back group can receive this later.
          </label>
          {state && !state.ok && <p className="form-error">{state.error}</p>}
          <button className="btn btn-ghost" disabled={formPending} type="submit">
            Save
          </button>
        </form>
      )}
      <div className="card stack">
        <div className="row">
          <button type="button" className="btn btn-ghost" disabled={pending || study.design.locked} onClick={() => run(() => applyProposal(study.id))}>
            Suggest a split
          </button>
          <button type="button" className="btn" disabled={pending || study.design.locked} onClick={() => run(() => lockDesign(study.id))}>
            Confirm groups
          </button>
        </div>
        {balance && <p className="text-sm">{balance}</p>}
        {postAlreadyIn && !study.design.locked && (
          <div className="callout callout-warn">
            <p>Measurement-window data is already loaded. Locking now marks this study retrospective. The estimate describes what is on file.</p>
          </div>
        )}
        {study.design.locked && (
          <p className="text-sm">{lockPhrase(study.design.lockedAt, study.design.rolloutDate, study.design.retrospective)}.</p>
        )}
        {study.teams.map((team) => (
          <div key={team.id} className="row justify-between border-t border-line py-2">
            <div>
              <p className="font-semibold">{team.name}</p>
              <p className="text-sm text-muted">{team.headcount} people</p>
            </div>
            <div className="row">
              {(["treatment", "control", "unassigned"] as const).map((arm) => (
                <ArmButton key={arm} studyId={study.id} teamId={team.id} arm={arm} current={team.arm} disabled={pending || study.design.locked} run={run} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {study.design.locked && (
        <form action={amendAction} className="card stack">
          <h3 className="font-semibold">Change the groups</h3>
          <input type="hidden" name="id" value={study.id} />
          <input type="hidden" name="what" value="design" />
          <textarea className="input" name="note" placeholder="What changed, and why." />
          {amendState && !amendState.ok && <p className="form-error">{amendState.error}</p>}
          <button className="btn btn-rust" disabled={amendPending} type="submit">
            Amend and unlock
          </button>
        </form>
      )}
      <Status error={error} warnings={warnings} />
    </div>
  )
}

function ArmButton({
  studyId,
  teamId,
  arm,
  current,
  disabled,
  run,
}: {
  studyId: string
  teamId: string
  arm: Arm | "unassigned"
  current: string
  disabled: boolean
  run: (work: () => Promise<ActionResult | void>) => void
}) {
  const label = arm === "treatment" ? "First wave" : arm === "control" ? "Hold back" : "Leave out"
  const on = current === arm
  return (
    <button type="button" className={on ? "btn" : "btn btn-ghost"} disabled={disabled} aria-pressed={on} onClick={() => run(() => setArm(studyId, teamId, arm))}>
      {label}
    </button>
  )
}

export function MeasurePanel({ study }: { study: Study }) {
  const { run, pending, error, warnings } = useRunner()
  const [state, action, formPending] = useActionState(setAssumptions, empty)
  return (
    <div className="stack">
      <div className="card stack">
        <h3 className="font-semibold">Since the rollout</h3>
        <p className="text-sm text-muted">Upload the admin export or a CSV. Each source is optional. A week you upload replaces that week.</p>
        <details>
          <summary className="cursor-pointer text-sm text-muted">Use sample numbers instead</summary>
          <div className="row mt-3">
            <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => generateMeasurement(study.id))}>
              Fill a sample window
            </button>
          </div>
          <p className="form-note mt-2">This stays off until the groups are confirmed.</p>
        </details>
      </div>
      <div className="grid-2">
        <div className="card stack" id="upload-usage">
          <h3 className="font-semibold">Usage</h3>
          <p className="text-sm text-muted">period, team, active_users, sessions_per_user, breadth, seat_cost, token_cost</p>
          <div className="row">
            <UploadButton label="Upload admin export" disabled={pending} onFile={(csv) => run(() => uploadUsage(study.id, csv))} />
            <a className="btn btn-ghost" href="/samples/usage">Example file</a>
          </div>
        </div>
        <div className="card stack" id="upload-outcomes">
          <h3 className="font-semibold">Outcomes</h3>
          <p className="text-sm text-muted">period, team, metric, value, n. Uploading a week replaces that week.</p>
          <div className="row">
            <UploadButton label="Upload outcomes" disabled={pending} onFile={(csv) => run(() => uploadOutcomes(study.id, csv))} />
            <a className="btn btn-ghost" href="/samples/outcomes-followup">Example file</a>
            <a className="btn btn-ghost" href="/samples/dx">Engineering export</a>
          </div>
        </div>
        <div className="card stack" id="upload-spend">
          <h3 className="font-semibold">Spend</h3>
          <p className="text-sm text-muted">period, amount, and optionally team and category (seat, token, other).</p>
          <UploadButton label="Upload spend" disabled={pending} onFile={(csv) => run(() => uploadSpend(study.id, csv))} />
        </div>
        <div className="card stack">
          <h3 className="font-semibold">Agents</h3>
          <p className="text-sm text-muted">period, agent, team, spend, units, metric. An agent is measured on the same outcomes as a team, with its spend as its cost.</p>
          <div className="row">
            <UploadButton label="Upload agent work" disabled={pending} onFile={(csv) => run(() => uploadAgents(study.id, csv))} />
            <a className="btn btn-ghost" href="/samples/agents">Sample</a>
          </div>
        </div>
      </div>
      <form action={action} className="card stack">
        <h3 className="font-semibold">Cost assumptions</h3>
        <input type="hidden" name="id" value={study.id} />
        <div className="grid-2">
          <label className="field">
            <span>Loaded pay, $ per person per week</span>
            <input className="input" name="weeklyLoadedCost" type="number" min={1} step="1" defaultValue={study.weeklyLoadedCost} />
          </label>
          <label className="field">
            <span>Other spend in this window, $</span>
            <input className="input" name="otherSpend" type="number" min={0} step="1" defaultValue={study.otherSpend} />
          </label>
        </div>
        {state && !state.ok && <p className="form-error">{state.error}</p>}
        <button className="btn btn-ghost" disabled={formPending} type="submit">
          Save assumptions
        </button>
      </form>
      <Status error={error} warnings={warnings} />
    </div>
  )
}
