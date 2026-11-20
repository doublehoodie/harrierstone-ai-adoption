import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { analyze, calculation } from "./analysis"
import { parseCsv, parseOrgCsv, parseOutcomeCsv } from "./csv"
import { weeksFrom } from "./dates"
import { mapTitle } from "./ontology"
import { weekCounts } from "./progress"
import { blankStudy } from "./study"
import { buildDemos, fileNextDay } from "./synthetic"
import type { Metric, Study } from "./types"

function metric(partial: Partial<Metric> & Pick<Metric, "id" | "name" | "direction" | "unit">): Metric {
  return {
    description: partial.name,
    sourceHint: "Test",
    custom: true,
    perPerson: false,
    costDenominator: false,
    costUnit: "unit",
    ...partial,
  }
}

function study(): Study {
  const next = blankStudy({
    company: "Test Co",
    name: "Test study",
    functionId: "engineering",
    investmentKind: "seats",
    tool: "Tool",
    population: "Engineering",
    owner: "VP Engineering",
    rolloutDate: "2026-08-17",
  })
  next.metrics = [metric({ id: "cycle", name: "Cycle time", direction: "lower_better", unit: "hours" })]
  next.primaryMetricId = "cycle"
  next.metricsLocked = true
  next.registeredAt = "2026-07-01"
  next.design.locked = true
  next.design.lockedAt = "2026-08-01"
  next.design.practicalEffectPct = 0.1
  next.teams = [
    { id: "t", name: "Rollout", roleId: "r", headcount: 40, arm: "treatment" },
    { id: "c", name: "Holdout", roleId: "r", headcount: 40, arm: "control" },
  ]
  return next
}

function addWeeks(target: Study, teamId: string, periods: string[], value: number, metricId = "cycle", n = 40) {
  for (const period of periods) {
    target.outcomes.push({ period, teamId, metricId, value, n })
  }
}

const pre = weeksFrom("2026-06-22", 8)
const post = weeksFrom("2026-08-17", 8)

describe("decisions", () => {
  it("estimates a noiseless difference-in-differences", () => {
    const target = study()
    addWeeks(target, "t", pre, 10)
    addWeeks(target, "t", post, 6)
    addWeeks(target, "c", pre, 10)
    addWeeks(target, "c", post, 9)
    const report = analyze(target)
    assert.equal(report.primary?.did, -3)
    assert.equal(report.decision, "expand")
    assert.ok(report.rules.includes("favorable_expand"))
  })

  it("keeps a favorable result when the comparison group is not a candidate", () => {
    const target = study()
    target.design.expandIntoControl = false
    addWeeks(target, "t", pre, 10)
    addWeeks(target, "t", post, 6)
    addWeeks(target, "c", pre, 10)
    addWeeks(target, "c", post, 9)
    const report = analyze(target)
    assert.equal(report.decision, "keep")
  })

  it("cuts a powered null when money was spent", () => {
    const target = study()
    target.metrics = [metric({ id: "win", name: "Win rate", direction: "higher_better", unit: "share" })]
    target.primaryMetricId = "win"
    target.otherSpend = 12000
    addWeeks(target, "t", pre, 0.24, "win")
    addWeeks(target, "t", post, 0.24, "win")
    addWeeks(target, "c", pre, 0.24, "win")
    addWeeks(target, "c", post, 0.24, "win")
    const report = analyze(target)
    assert.equal(report.decision, "cut")
    assert.ok(report.rules.includes("benefit_ruled_out"))
  })

  it("does not decide from a before/after", () => {
    const target = study()
    target.design.type = "before_after"
    target.teams = target.teams.filter((team) => team.arm === "treatment")
    addWeeks(target, "t", pre, 10)
    addWeeks(target, "t", post, 6)
    const report = analyze(target)
    assert.equal(report.decision, "inconclusive")
    assert.ok(report.rules.includes("no_comparison"))
  })

  it("voids the decision after an amendment", () => {
    const target = study()
    target.amendments.push({ at: "2026-09-01", note: "Swapped the primary metric.", what: "metrics" })
    addWeeks(target, "t", pre, 10)
    addWeeks(target, "t", post, 6)
    addWeeks(target, "c", pre, 10)
    addWeeks(target, "c", post, 9)
    const report = analyze(target)
    assert.equal(report.decision, "inconclusive")
    assert.ok(report.rules.includes("amended"))
  })

  it("hides groups under the privacy floor", () => {
    const target = study()
    target.teams.push({ id: "tiny", name: "Tiny", roleId: "r", headcount: 4, arm: "treatment" })
    addWeeks(target, "t", pre, 10)
    addWeeks(target, "t", post, 10)
    addWeeks(target, "c", pre, 10)
    addWeeks(target, "c", post, 10)
    addWeeks(target, "tiny", pre, 100, "cycle", 4)
    addWeeks(target, "tiny", post, 100, "cycle", 4)
    const report = analyze(target)
    assert.equal(report.primary?.did, 0)
    assert.ok(report.suppressed.some((line) => line.includes("Tiny")))
  })

  it("refuses a rollout group under five people", () => {
    const target = study()
    target.teams = [
      { id: "t", name: "Rollout", roleId: "r", headcount: 4, arm: "treatment" },
      { id: "c", name: "Holdout", roleId: "r", headcount: 40, arm: "control" },
    ]
    addWeeks(target, "t", pre, 10, "cycle", 4)
    addWeeks(target, "t", post, 6, "cycle", 4)
    addWeeks(target, "c", pre, 10)
    addWeeks(target, "c", post, 9)
    const report = analyze(target)
    assert.equal(report.decision, "inconclusive")
    assert.ok(report.rules.includes("no_treatment"))
  })

  it("flags a smooth pre-trend that already explains the change", () => {
    const target = study()
    target.design.practicalEffectPct = 1
    const rising = [10, 12, 14, 16, 18, 20, 22, 24]
    pre.forEach((period, index) => target.outcomes.push({ period, teamId: "t", metricId: "cycle", value: rising[index], n: 40 }))
    addWeeks(target, "t", post, 24)
    addWeeks(target, "c", pre, 10)
    addWeeks(target, "c", post, 10)
    const report = analyze(target)
    assert.equal(report.decision, "inconclusive")
    assert.ok(report.rules.includes("pretrend"), report.reasons.join(" "))
  })

  it("does not claim causation in the copy", () => {
    for (const demo of buildDemos()) {
      const report = analyze(demo)
      const blob = `${report.title} ${report.lede} ${report.reasons.join(" ")} ${report.warnings.join(" ")}`
      assert.doesNotMatch(blob, /proves|caused by|statistically significant/i)
    }
  })
})

describe("demo studies", () => {
  const demos = Object.fromEntries(buildDemos().map((demo) => [demo.id, analyze(demo)]))

  it("northwind expands", () => {
    assert.equal(demos.northwind.decision, "expand", `${demos.northwind.lede} :: ${demos.northwind.reasons.join(" | ")}`)
  })

  it("brightline keeps the agent where it is", () => {
    assert.equal(demos.brightline.decision, "keep", `${demos.brightline.lede} :: ${demos.brightline.reasons.join(" | ")}`)
  })

  it("halcyon does not decide", () => {
    assert.equal(demos.halcyon.decision, "inconclusive", `${demos.halcyon.lede} :: ${demos.halcyon.reasons.join(" | ")}`)
    assert.ok(demos.halcyon.rules.includes("underpowered"), demos.halcyon.reasons.join(" | "))
  })

  it("lumen cuts a flat win rate", () => {
    assert.equal(demos.lumen.decision, "cut", `${demos.lumen.lede} :: ${demos.lumen.reasons.join(" | ")}`)
  })

  it("meridian stays open until the planned weeks are in", () => {
    assert.equal(demos.meridian.decision, "inconclusive", demos.meridian.reasons.join(" | "))
    assert.ok(demos.meridian.rules.includes("window_open"), demos.meridian.reasons.join(" | "))
    assert.equal(demos.meridian.title, "Still measuring")
  })

  it("files the open week onto the chart", () => {
    const study = structuredClone(buildDemos().find((demo) => demo.id === "meridian"))
    assert.ok(study?.openWeek)
    study.openWeek.day = 4
    const before = weekCounts(study).post
    const index = study.openWeek.index
    const note = fileNextDay(study)
    assert.match(note, /closed the week/)
    assert.equal(weekCounts(study).post, before + 1)
    assert.equal(study.openWeek?.index, index + 1)
    assert.equal(study.openWeek?.day, 0)
    assert.equal(analyze(study).rules.includes("window_open"), true)
  })

  it("writes the same change the workbook repeats", () => {
    const northwind = buildDemos().find((demo) => demo.id === "northwind")
    assert.ok(northwind)
    const report = analyze(northwind)
    const calc = calculation(northwind).metrics.find((metric) => metric.primary)
    assert.ok(calc)
    assert.equal(calc.fit.did, report.primary?.did)
    assert.equal(calc.fit.ciLow, report.primary?.ciLow)
    assert.equal(calc.fit.ciHigh, report.primary?.ciHigh)
  })

  it("maps at least 70% of Northwind roles without a manual edit", () => {
    const northwind = buildDemos().find((demo) => demo.id === "northwind")
    assert.ok(northwind)
    const rate = northwind.roles.filter((role) => role.autoMapped).length / northwind.roles.length
    assert.ok(rate >= 0.7, `${rate} from ${northwind.roles.map((role) => `${role.title}:${role.confidence}`).join(", ")}`)
  })
})

describe("ontology and csv", () => {
  it("maps common titles and leaves weak matches for review", () => {
    const software = mapTitle("Senior Software Engineer")
    assert.ok(software && software.confidence >= 0.75)
    assert.equal(software?.code, "15-1252.00")
    const sre = mapTitle("Site Reliability Engineer")
    assert.ok(sre && sre.confidence < 0.75)
    assert.equal(mapTitle("Chief Happiness Officer"), null)
  })

  it("parses quotes and drops identifiers", () => {
    const table = parseCsv('title,team,headcount,email\n"Software Engineer, Staff",Platform,12,a@example.com\n')
    assert.equal(table.rows[0].title, "Software Engineer, Staff")
    assert.equal(table.rows[0].email, "a@example.com")
    const org = parseOrgCsv('title,team,headcount,email\n"Software Engineer",Platform,12,a@example.com\n')
    assert.equal(org.errors.length, 0)
    assert.equal(org.rows[0].headcount, 12)
    assert.ok(org.warnings.some((warning) => warning.includes("discarded")))
  })

  it("rejects a person-level outcome file", () => {
    const target = study()
    const result = parseOutcomeCsv("email,value\na@example.com,10\n", target)
    assert.ok(result.errors.some((error) => error.includes("team")))
  })
})
