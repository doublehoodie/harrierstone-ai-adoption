import { reportPdf } from "@/lib/report-pdf"
import { getStudy } from "@/lib/store"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const study = getStudy(id)
  if (!study) return new Response("Not found", { status: 404 })
  const bytes = await reportPdf(study)
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const name = `${study.company}-${study.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}-report.pdf"`,
    },
  })
}
