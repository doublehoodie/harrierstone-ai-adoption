import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import { analyze } from "./analysis"
import { formatDelta, formatMoney, formatPct, formatRange, formatValue, plural } from "./format"
import { FUNCTION_LABEL } from "./templates"
import type { Study } from "./types"

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 54
const INK = rgb(0.11, 0.1, 0.09)
const MUTED = rgb(0.38, 0.35, 0.31)
const UP = rgb(0.114, 0.42, 0.235)
const DOWN = rgb(0.616, 0.263, 0.157)

export async function reportPdf(study: Study): Promise<Uint8Array> {
  const report = analyze(study)
  const doc = await PDFDocument.create()
  doc.setTitle(`${study.company} — ${study.name}`)
  doc.setAuthor("HarrierStone")
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const writer = new Writer(doc, font, bold)

  writer.kicker(`${study.company}  ·  ${FUNCTION_LABEL[study.functionId]}  ·  ${study.tool}`)
  const tone =
    report.decision !== "inconclusive" && report.primary?.detectable ? (report.primary.favorable ? UP : DOWN) : INK
  writer.heading(report.title, 22, report.rules.includes("window_open") ? INK : tone)
  writer.paragraph(report.lede)
  for (const reason of report.reasons) writer.bullet(reason)

  if (study.demo) writer.paragraph("These are sample numbers. Replace them with an admin export or CSV.")
  else if (study.origin.outcomes === "synthetic") writer.paragraph("Some of these numbers are sample data. Replace them with an admin export or CSV.")
  if (report.exploratory) writer.paragraph("The metric or the groups changed after they were confirmed, or the groups were confirmed after measurement data was already in. The estimate describes what is on file.")
  for (const warning of report.warnings) writer.bullet(warning)

  const primary = report.primary
  writer.heading(primary?.name ?? "Primary outcome", 14)
  if (primary?.did == null || primary.ciLow == null || primary.ciHigh == null) {
    writer.paragraph("The chart and the change appear once this metric has weeks before and after the rollout.")
  } else {
    writer.line("Change", unitDelta(primary.did, primary.unit), tone)
    writer.line("95% range", formatRange(primary.ciLow, primary.ciHigh, primary.unit))
    writer.paragraph(primary.note)
  }

  const others = report.effects.filter((effect) => !effect.primary)
  if (others.length > 0) {
    writer.heading("The other metrics", 14)
    writer.paragraph("The agreed metric is the one in the reading above. These are the other metrics on file.")
    for (const effect of others) {
      const change = effect.did == null ? "Not enough weeks" : unitDelta(effect.did, effect.unit)
      const range = effect.ciLow == null || effect.ciHigh == null ? "" : `, range ${formatRange(effect.ciLow, effect.ciHigh, effect.unit)}`
      const read = effect.did == null ? "" : effect.detectable ? (effect.favorable ? ", agreed direction" : ", other direction") : ", range includes no change"
      writer.bullet(`${effect.name}: ${change}${range}${read}`)
    }
  }

  writer.heading("What it cost", 14)
  writer.paragraph(report.costNote)
  writer.line("Seat spend", formatMoney(report.spend.seats))
  writer.line("Token and API spend", formatMoney(report.spend.tokens))
  writer.line("Agent spend", formatMoney(report.spend.agents))
  writer.line("Other spend", formatMoney(report.spend.other))
  writer.line("In this window", formatMoney(report.spend.total))
  if (report.spend.activeRate != null) {
    writer.paragraph(`In a typical measurement week, ${formatPct(report.spend.activeRate)} of the ${plural(report.spend.treatmentHeadcount, "seat")} in the rollout group were used.`)
  }
  for (const row of report.costs) {
    const cost = row.cost == null ? "—" : `${formatMoney(row.cost)} per ${row.unit}`
    writer.bullet(`${row.label}: ${cost}. ${row.includes}`)
  }

  writer.heading("Adoption", 14)
  writer.paragraph("Who used it, at the team. This explains the rollout. It is not a second result.")
  if (report.autoMapRate != null) writer.paragraph(`${formatPct(report.autoMapRate)} of job titles were recognized without an edit.`)
  for (const segment of report.segments) {
    if (segment.suppressed) {
      writer.bullet(`${segment.label}: hidden`)
      continue
    }
    const delta = segment.primaryDelta == null || !primary ? "—" : formatDelta(segment.primaryDelta, primary.unit)
    writer.bullet(`${segment.label}: ${plural(segment.n, "person")}, ${formatValue(segment.sessionsPerUser, "score")} sessions each, breadth ${formatPct(segment.breadth)}, outcome change ${delta}`)
  }
  if (report.pulseResponseRate != null) {
    const invited = study.pulses.find((wave) => wave.kind === "baseline")?.invited ?? 0
    writer.paragraph(`Baseline response ${formatPct(report.pulseResponseRate)} of ${plural(invited, "person")} invited.`)
  }

  writer.heading("Reading", 14)
  writer.paragraph(report.nextStep)

  writer.heading("Who was in it", 14)
  for (const team of study.teams) {
    const group = team.arm === "treatment" ? "First wave" : team.arm === "control" ? "Hold back" : "Left out"
    const people = team.headcount < study.privacyFloor ? "Hidden" : plural(team.headcount, "person")
    writer.bullet(`${team.name}: ${group}, ${people}`)
  }

  writer.heading("How this was calculated", 14)
  writer.paragraph("The number is the first wave's change minus the held-back group's change over the same weeks. Each week counts equally. Inside a week, each team counts by the number of observations on that row. A row under the privacy floor is left out, and a week is left out when the included observations add up to less than the floor. The range is how much those weekly results bounced. It is not proof the tool caused the change.")
  writer.paragraph(`The reading stays a description when the metric or the groups were changed after they were confirmed, when everyone got it at once, when the range still includes both no change and an improvement that would matter, or when the groups are too small to see that improvement. Groups under ${study.privacyFloor} are hidden before any of this runs.`)
  if (report.power) writer.paragraph(report.power.note)
  writer.paragraph("The calculations workbook repeats every row. On its Estimate sheet, column B is a formula and column C is the number in this report. They should match.")

  writer.footer()
  const bytes = await doc.save()
  return new Uint8Array(bytes)
}

function unitDelta(value: number, unit: string): string {
  const delta = formatDelta(value, unit)
  if (unit === "share" || unit === "score" || unit === "dollars") return delta
  return `${delta} ${unit}`
}

class Writer {
  private page: PDFPage
  private y: number

  constructor(
    private doc: PDFDocument,
    private font: PDFFont,
    private bold: PDFFont,
  ) {
    this.page = doc.addPage([PAGE_W, PAGE_H])
    this.y = PAGE_H - MARGIN
  }

  kicker(text: string) {
    this.draw(text.toUpperCase(), 9, this.bold, MUTED)
    this.y -= 8
  }

  heading(text: string, size: number, color: ReturnType<typeof rgb> = INK) {
    this.y -= size === 22 ? 4 : 12
    this.ensure(size + 8)
    this.draw(text, size, this.bold, color)
    this.y -= 6
  }

  paragraph(text: string) {
    this.block(text, 11, this.font, INK, 0)
  }

  bullet(text: string) {
    this.block(text, 11, this.font, INK, 12)
  }

  line(label: string, value: string, valueColor: ReturnType<typeof rgb> = INK) {
    this.ensure(16)
    const plain = ascii(label)
    this.page.drawText(plain, { x: MARGIN, y: this.y - 11, size: 11, font: this.font, color: MUTED })
    this.page.drawText(ascii(value), { x: MARGIN + 150, y: this.y - 11, size: 11, font: this.bold, color: valueColor })
    this.y -= 16
  }

  footer() {
    const pages = this.doc.getPages()
    pages.forEach((page, index) => {
      page.drawText(ascii(`HarrierStone  ·  ${index + 1} of ${pages.length}`), {
        x: MARGIN,
        y: 28,
        size: 9,
        font: this.font,
        color: MUTED,
      })
    })
  }

  private block(text: string, size: number, font: PDFFont, color: ReturnType<typeof rgb>, indent: number) {
    const lines = wrap(ascii(text), size, font, PAGE_W - MARGIN * 2 - indent)
    for (const line of lines) {
      this.ensure(size + 4)
      if (indent > 0) {
        this.page.drawText("-", { x: MARGIN, y: this.y - size, size, font: this.font, color })
      }
      this.page.drawText(line, { x: MARGIN + indent, y: this.y - size, size, font, color })
      this.y -= size + 4
    }
    this.y -= 4
  }

  private draw(text: string, size: number, font: PDFFont, color: ReturnType<typeof rgb>) {
    const lines = wrap(ascii(text), size, font, PAGE_W - MARGIN * 2)
    for (const line of lines) {
      this.ensure(size + 4)
      this.page.drawText(line, { x: MARGIN, y: this.y - size, size, font, color })
      this.y -= size + 4
    }
  }

  private ensure(height: number) {
    if (this.y - height < MARGIN) {
      this.page = this.doc.addPage([PAGE_W, PAGE_H])
      this.y = PAGE_H - MARGIN
    }
  }
}

function wrap(text: string, size: number, font: PDFFont, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) > width && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : [""]
}

function ascii(text: string): string {
  return text
    .replaceAll("−", "-")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll(" ", " ")
    .replace(/[^\x20-\x7E]/g, "")
}
