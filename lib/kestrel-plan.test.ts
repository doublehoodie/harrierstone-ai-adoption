import assert from "node:assert/strict"
import { test } from "node:test"
import { gameplanReady, readGameplan, studyFromGameplan } from "./kestrel-plan"

const COMPLETE = {
  reply: "We will watch PR cycle time and hold platform back.",
  company: "Meridian",
  name: "Cursor for platform",
  functionId: "engineering",
  investmentKind: "seats",
  tool: "Cursor",
  population: "Platform engineering",
  owner: "Avery",
  rolloutDate: "2026-12-01",
  primaryMetricId: "eng.cycle_time",
  comparison: "comparison",
  practicalEffectPct: 10,
  holdBack: "The platform group that waits",
  fileNeeded: "GitHub cycle time export",
  questions: [],
}

test("a complete plan is ready to create", () => {
  const parsed = readGameplan(COMPLETE)
  assert.ok("plan" in parsed)
  assert.equal(gameplanReady(parsed.plan), true)
  const study = studyFromGameplan(parsed.plan, 5, 10)
  assert.equal(study.primaryMetricId, "eng.cycle_time")
  assert.equal(study.metricsLocked, false)
  assert.equal(study.design.locked, false)
  assert.equal(study.design.type, "comparison")
  assert.equal(study.design.practicalEffectPct, 0.1)
})

test("a before-and-after plan stays a question", () => {
  const parsed = readGameplan({ ...COMPLETE, comparison: "before_after", questions: [] })
  assert.ok("plan" in parsed)
  assert.equal(gameplanReady(parsed.plan), false)
  assert.match(parsed.plan.questions.join(" "), /held back/)
})
