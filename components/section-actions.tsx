"use client"

import { markSectionDone, saveSection } from "@/app/actions"
import type { SectionId } from "@/lib/types"
import { Status, useRunner } from "./use-runner"

export function SectionActions({ studyId, section }: { studyId: string; section: SectionId }) {
  const { run, pending, error, warnings } = useRunner()
  return (
    <div className="row mt-8">
      <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => run(() => saveSection(studyId, section))}>
        Save
      </button>
      <button type="button" className="btn" disabled={pending} onClick={() => run(() => markSectionDone(studyId, section))}>
        Mark as done
      </button>
      <Status error={error} warnings={warnings} />
    </div>
  )
}
