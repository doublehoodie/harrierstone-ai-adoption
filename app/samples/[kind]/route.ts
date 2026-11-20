import { sampleCsv } from "@/lib/samples"

export async function GET(_request: Request, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params
  const csv = sampleCsv(kind)
  if (!csv) return new Response("Not found", { status: 404 })
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind}.csv"`,
    },
  })
}
