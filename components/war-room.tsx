"use client"

import Link from "next/link"
import { receiveNextDay } from "@/app/actions"
import { feed, nextArrival } from "@/lib/feed"
import { formatDelta } from "@/lib/format"
import { liveLabel } from "@/lib/progress"
import type { Report } from "@/lib/analysis"
import type { Study } from "@/lib/types"
import { Status, useRunner } from "./use-runner"

export function WarRoom({ study, report, home = false }: { study: Study; report: Report; home?: boolean }) {
  const { run, pending, error, warnings } = useRunner()
  const primary = report.primary
  const label = liveLabel(study)
  const items = feed(study)
  const arrival = nextArrival(study)
  const reading =
    primary?.did == null
      ? "Not enough closed weeks for a reading yet."
      : `${primary.name} is ${formatDelta(primary.did, primary.unit)} ${primary.unit === "share" || primary.unit === "score" || primary.unit === "dollars" ? "" : primary.unit} so far.`

  return (
    <section className="war-room">
      <div className="stack">
        <p className="kicker">Live rollout</p>
        <h2>{home ? study.name : "This week"}</h2>
        <p className="text-sm text-muted">
          {study.company} · {study.tool}
          {label ? ` · ${label}` : ""}
        </p>
        <p>{reading} The decision waits until the planned weeks are in.</p>
        {study.openWeek && (
          <p className="text-sm text-muted">
            {study.openWeek.day < 2
              ? `The check-in has not gone out this week. ${study.openWeek.invited} people are in the first wave.`
              : `Check-in: ${study.openWeek.replies} of ${study.openWeek.invited} replies, still open.`}
          </p>
        )}
        {arrival && (
          <div className="row">
            <button type="button" className="btn" disabled={pending} onClick={() => run(() => receiveNextDay(study.id))}>
              {pending ? "Filing" : `File ${arrival}`}
            </button>
            {home && (
              <Link href={`/studies/${study.id}`} className="btn btn-ghost">
                Open the rollout
              </Link>
            )}
          </div>
        )}
        {!arrival && home && (
          <Link href={`/studies/${study.id}`} className="btn btn-ghost">
            Open the rollout
          </Link>
        )}
        <Status error={error} warnings={warnings} />
      </div>
      <ol className="feed">
        {items.map((item) => (
          <li key={`${item.at}:${item.text}`}>
            <span className="feed-when">{item.when}</span>
            <span>{item.text}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
