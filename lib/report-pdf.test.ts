import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { reportPdf } from "./report-pdf"
import { buildDemos } from "./synthetic"

describe("report pdf", () => {
  it("downloads a PDF for a finished study", async () => {
    const northwind = buildDemos().find((demo) => demo.id === "northwind")
    assert.ok(northwind)
    const bytes = await reportPdf(northwind)
    assert.ok(bytes.byteLength > 2000)
    assert.equal(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]), "%PDF")
  })
})
