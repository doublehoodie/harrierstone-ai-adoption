import ExcelJS from "exceljs"
import { analyze, calculation } from "./analysis"
import type { Study } from "./types"

const LAST = 8000

export async function workbookBuffer(study: Study): Promise<Uint8Array> {
  const calc = calculation(study)
  const report = analyze(study)
  const book = new ExcelJS.Workbook()
  book.creator = "HarrierStone"
  book.created = new Date()

  const readme = book.addWorksheet("How to repeat")
  readme.columns = [{ width: 28 }, { width: 110 }]
  const lines: [string, string][] = [
    ["What this file is", "The rows behind the outcome, and the arithmetic the product used. Change a number on Rows and the formulas on Weeks and Estimate follow."],
    ["Reading", report.title],
    ["In one sentence", report.lede],
    ["Privacy floor", `A team under ${calc.floor} people is left out. An outcome row with n under ${calc.floor} is left out. A week whose included n sums to under ${calc.floor} is left out.`],
    ["Inside a week", "The week mean is the sum of value × n, divided by the sum of n, for included rows in that group."],
    ["Across weeks", "Each included week counts equally. The before number is the average of the before week means. The after number is the average of the after week means."],
    ["The change", "First wave after, minus first wave before, minus the same change in the held-back group. If everyone got it at once, only the first wave's change is shown, and it cannot be separated from other changes in the same weeks."],
    ["The range", "A 95% interval. The spread is the sample variance of the week means (divide by weeks minus 1), combined across the four blocks of weeks. The multiplier is the t value on the Estimate sheet, from the same table the product uses. Excel's T.INV may differ by a small amount. The product uses the table."],
    ["What is not in the change", "Spend, adoption, and the short check-in do not enter the change. They are on their own sheets so a reviewer can see them."],
    ["Sheets", "Groups, Rows, Weeks, Estimate, Checks, Usage. Weeks column D and F are formulas over Rows. Estimate column B is formulas over Weeks. Estimate column C is the number the product published."],
  ]
  lines.forEach((line, index) => {
    readme.getRow(index + 1).values = line
  })
  readme.getColumn(1).font = { bold: true }

  const groups = book.addWorksheet("Groups")
  groups.addRow(["Team", "Group", "People", "In the estimate", "Why"])
  for (const team of calc.teams) groups.addRow([team.name, team.arm, team.headcount, team.included ? "Yes" : "No", team.reason])
  header(groups)

  const rows = book.addWorksheet("Rows")
  rows.addRow(["Period", "Team", "Group", "Metric id", "Metric", "Value", "N", "Included"])
  for (const row of calc.rows) {
    rows.addRow([row.period, row.team, row.group, row.metricId, row.metric, row.value, row.n, row.included])
  }
  header(rows)
  rows.getColumn(6).numFmt = "0.0000"
  rows.getColumn(8).numFmt = "0"

  const weeks = book.addWorksheet("Weeks")
  weeks.addRow(["Period", "Phase", "Metric id", "First wave mean", "First wave n", "Hold back mean", "Hold back n", "Product first wave", "Product hold back"])
  const ordered = [...calc.weeks].sort((a, b) => a.metricId.localeCompare(b.metricId) || a.phase.localeCompare(b.phase) || a.period.localeCompare(b.period))
  ordered.forEach((week, index) => {
    const excelRow = index + 2
    const phase = week.phase === "pre" ? "before" : "after"
    weeks.getCell(`A${excelRow}`).value = week.period
    weeks.getCell(`B${excelRow}`).value = phase
    weeks.getCell(`C${excelRow}`).value = week.metricId
    weeks.getCell(`E${excelRow}`).value = {
      formula: `SUMPRODUCT((Rows!$A$2:$A$${LAST}=A${excelRow})*(Rows!$D$2:$D$${LAST}=C${excelRow})*(Rows!$C$2:$C$${LAST}="First wave")*(Rows!$H$2:$H$${LAST}=1)*(Rows!$G$2:$G$${LAST}))`,
    }
    weeks.getCell(`D${excelRow}`).value = {
      formula: `IF(E${excelRow}<Study!$B$7,"",IFERROR(SUMPRODUCT((Rows!$A$2:$A$${LAST}=A${excelRow})*(Rows!$D$2:$D$${LAST}=C${excelRow})*(Rows!$C$2:$C$${LAST}="First wave")*(Rows!$H$2:$H$${LAST}=1)*(Rows!$F$2:$F$${LAST})*(Rows!$G$2:$G$${LAST}))/E${excelRow},""))`,
    }
    weeks.getCell(`G${excelRow}`).value = {
      formula: `SUMPRODUCT((Rows!$A$2:$A$${LAST}=A${excelRow})*(Rows!$D$2:$D$${LAST}=C${excelRow})*(Rows!$C$2:$C$${LAST}="Hold back")*(Rows!$H$2:$H$${LAST}=1)*(Rows!$G$2:$G$${LAST}))`,
    }
    weeks.getCell(`F${excelRow}`).value = {
      formula: `IF(G${excelRow}<Study!$B$7,"",IFERROR(SUMPRODUCT((Rows!$A$2:$A$${LAST}=A${excelRow})*(Rows!$D$2:$D$${LAST}=C${excelRow})*(Rows!$C$2:$C$${LAST}="Hold back")*(Rows!$H$2:$H$${LAST}=1)*(Rows!$F$2:$F$${LAST})*(Rows!$G$2:$G$${LAST}))/G${excelRow},""))`,
    }
    weeks.getCell(`H${excelRow}`).value = week.treatment
    weeks.getCell(`I${excelRow}`).value = week.control
  })
  header(weeks)
  for (const column of ["D", "E", "F", "G", "H", "I"]) weeks.getColumn(column).numFmt = "0.0000"

  const primary = calc.metrics.find((metric) => metric.primary) ?? calc.metrics[0]
  const estimate = book.addWorksheet("Estimate")
  estimate.columns = [{ width: 42 }, { width: 22 }, { width: 22 }, { width: 64 }]
  estimate.addRow(["Piece", "From the rows", "Product published", "How the formula is built"])
  header(estimate)
  if (primary) {
    const blocks = rangesFor(ordered, primary.metricId)
    const cell = (block: Block | undefined, column: "D" | "F") => (block ? `${column}${block.start}:${column}${block.end}` : "A1:A1")
    const avg = (block: Block | undefined, column: "D" | "F") => (block ? `AVERAGE(Weeks!${cell(block, column)})` : `NA()`)
    const variance = (block: Block | undefined, column: "D" | "F") => (block && block.end > block.start ? `VAR.S(Weeks!${cell(block, column)})` : `NA()`)
    const count = (block: Block | undefined) => (block ? String(block.end - block.start + 1) : "0")
    const fit = primary.fit
    const spec: [string, string, number | string | null, string][] = [
      ["Metric", `"${primary.name}"`, primary.name, "The metric the recommendation uses."],
      ["First wave, before", avg(blocks.beforeTreat, "D"), fit.preT, "Average of the before week means. Each week counts once."],
      ["First wave, after", avg(blocks.afterTreat, "D"), fit.postT, "Average of the after week means."],
      ["Hold back, before", avg(blocks.beforeHold, "F"), fit.preC, "Blank when everyone got it at once."],
      ["Hold back, after", avg(blocks.afterHold, "F"), fit.postC, "Blank when everyone got it at once."],
      [
        "Change",
        calc.comparison ? `(B4-B3)-(B6-B5)` : `B4-B3`,
        fit.did,
        "First-wave change, minus the held-back change when there is one.",
      ],
      ["Weeks, first wave before", count(blocks.beforeTreat), fit.nPreT, "Count of included before weeks."],
      ["Variance, first wave before", variance(blocks.beforeTreat, "D"), fit.varPreT, "Sample variance of those week means."],
      ["Variance, first wave after", variance(blocks.afterTreat, "D"), fit.varPostT, ""],
      ["Variance, hold back before", variance(blocks.beforeHold, "F"), fit.varPreC, ""],
      ["Variance, hold back after", variance(blocks.afterHold, "F"), fit.varPostC, ""],
      [
        "Standard error",
        calc.comparison
          ? `SQRT(B9/B8+B10/${count(blocks.afterTreat)}+B11/${count(blocks.beforeHold)}+B12/${count(blocks.afterHold)})`
          : `SQRT(B9/B8+B10/${count(blocks.afterTreat)})`,
        fit.se,
        "Spread of the week means, not of the people inside a team.",
      ],
      ["Degrees of freedom", String(fit.df ?? ""), fit.df, "Weeks in each block, minus one per block."],
      ["t multiplier", String(fit.tCrit ?? ""), fit.tCrit, "From the product's table, not from T.INV. See Checks."],
      ["Range, low", `B7-B15*B13`, fit.ciLow, "Change minus t times the standard error."],
      ["Range, high", `B7+B15*B13`, fit.ciHigh, "Change plus t times the standard error."],
    ]
    spec.forEach((item, index) => {
      const excelRow = index + 2
      estimate.getCell(`A${excelRow}`).value = item[0]
      const formula = item[1]
      if (formula.startsWith('"') || /^[0-9]/.test(formula) || formula === "") {
        estimate.getCell(`B${excelRow}`).value = formula.startsWith('"') ? formula.slice(1, -1) : formula === "" ? null : Number(formula)
      } else {
        estimate.getCell(`B${excelRow}`).value = { formula }
      }
      estimate.getCell(`C${excelRow}`).value = item[2]
      estimate.getCell(`D${excelRow}`).value = item[3]
    })
    estimate.getColumn(2).numFmt = "0.0000"
    estimate.getColumn(3).numFmt = "0.0000"
  }

  const checks = book.addWorksheet("Checks")
  checks.columns = [{ width: 36 }, { width: 28 }, { width: 80 }]
  checks.addRow(["Check", "Result", "Note"])
  header(checks)
  checks.addRow(["Reading", report.title, report.reasons.join(" ")])
  checks.addRow(["Rules that fired", report.rules.join(", "), "A directional reading is withheld when any blocking rule is in this list."])
  for (const reason of report.reasons) checks.addRow(["Reason", reason, ""])
  for (const warning of report.warnings) checks.addRow(["Also read", warning, ""])
  checks.addRow(["t table", "df 1 → 12.71, 2 → 4.30, 3 → 3.18, 4 → 2.78, 5 → 2.57, 6 → 2.45, 8 → 2.31, 10 → 2.23, 12 → 2.18, 15 → 2.13, 20 → 2.09, 30 → 2.04, 60 → 2.00, 120 → 1.98, else 1.96", "The product steps down to the next lower row. It does not interpolate."])
  checks.addRow(["Reading note", report.nextStep, ""])

  const usage = book.addWorksheet("Usage")
  usage.addRow(["Period", "Team", "Active users", "Sessions per user", "Breadth", "Seat cost", "Token cost"])
  const teamName = new Map(study.teams.map((team) => [team.id, team.name]))
  for (const point of study.usage) {
    usage.addRow([point.period, teamName.get(point.teamId) ?? point.teamId, point.activeUsers, point.sessionsPerUser, point.breadth, point.seatCost, point.tokenCost])
  }
  header(usage)
  usage.addRow([])
  usage.addRow(["Seat spend in the window", report.spend.seats])
  usage.addRow(["Token spend", report.spend.tokens])
  usage.addRow(["Agent spend", report.spend.agents])
  usage.addRow(["Other spend", report.spend.other])
  usage.addRow(["Total", report.spend.total])

  const studySheet = book.addWorksheet("Study", { views: [{ state: "frozen", ySplit: 1 }] })
  studySheet.columns = [{ width: 32 }, { width: 48 }]
  studySheet.addRow(["Field", "Value"])
  header(studySheet)
  const fields: [string, string | number][] = [
    ["Company", study.company],
    ["Rollout", study.name],
    ["Tool", study.tool],
    ["Owner", study.owner],
    ["Rollout date", calc.rolloutDate],
    ["Privacy floor", calc.floor],
    ["Improvement that would matter", calc.practicalEffectPct],
    ["Held-back group", calc.comparison ? "Yes" : "No"],
    ["Metrics agreed", study.metricsLocked ? study.registeredAt ?? "Yes" : "No"],
    ["Groups confirmed", study.design.locked ? study.design.lockedAt ?? "Yes" : "No"],
    ["Sample data", study.demo ? "Yes" : study.origin.outcomes === "synthetic" ? "Some outcome rows" : "No"],
  ]
  fields.forEach((field, index) => {
    studySheet.getRow(index + 2).values = field
  })

  const buffer = await book.xlsx.writeBuffer()
  return new Uint8Array(buffer)
}

interface Block {
  start: number
  end: number
}

function rangesFor(weeks: { metricId: string; phase: "pre" | "post"; treatment: number | null; control: number | null }[], metricId: string): {
  beforeTreat?: Block
  afterTreat?: Block
  beforeHold?: Block
  afterHold?: Block
} {
  const out: { beforeTreat?: Block; afterTreat?: Block; beforeHold?: Block; afterHold?: Block } = {}
  const take = (phase: "pre" | "post", arm: "treatment" | "control", key: keyof typeof out) => {
    const indexes = weeks
      .map((week, index) => ({ week, index }))
      .filter(({ week }) => week.metricId === metricId && week.phase === phase && (arm === "treatment" ? week.treatment != null : week.control != null))
      .map(({ index }) => index + 2)
    if (indexes.length === 0) return
    out[key] = { start: Math.min(...indexes), end: Math.max(...indexes) }
  }
  take("pre", "treatment", "beforeTreat")
  take("post", "treatment", "afterTreat")
  take("pre", "control", "beforeHold")
  take("post", "control", "afterHold")
  return out
}

function header(sheet: ExcelJS.Worksheet) {
  const row = sheet.getRow(1)
  row.font = { bold: true }
  sheet.views = [{ state: "frozen", ySplit: 1 }]
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } }
}
