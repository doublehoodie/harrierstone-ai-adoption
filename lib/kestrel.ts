import "server-only"
import { KESTREL_TOKEN_CAP, metricCatalog, readGameplan, type Gameplan } from "./kestrel-plan"

export interface KestrelMessage {
  role: "user" | "assistant"
  content: string
}

export interface KestrelTurn {
  ok: true
  reply: string
  plan: Gameplan
  tokensUsed: number
  tokenCap: number
}

const RESERVE = 800

export function kestrelTokenCap(): number {
  const raw = Number(process.env.KESTREL_TOKEN_CAP)
  if (!Number.isFinite(raw) || raw < 1000) return KESTREL_TOKEN_CAP
  return Math.min(2_000_000, Math.round(raw))
}

export async function askKestrel(
  transcript: KestrelMessage[],
  tokensUsed: number,
): Promise<{ turn: KestrelTurn; spent: number } | { error: string; spent: number }> {
  const cap = kestrelTokenCap()
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return { error: "Add OPENAI_API_KEY to .env.local and restart the dev server.", spent: 0 }
  }
  if (tokensUsed + RESERVE > cap) {
    return { error: `The testing cap of ${cap.toLocaleString("en-US")} tokens is used.`, spent: 0 }
  }
  const messages = transcript
    .filter((message) => message.content.trim())
    .slice(-8)
    .map((message) => ({ role: message.role, content: message.content.slice(0, 2000) }))
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return { error: "Describe what you want to measure.", spent: 0 }
  }

  let response: Response
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        temperature: 0.2,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: systemPrompt() }, ...messages],
      }),
      signal: AbortSignal.timeout(25_000),
    })
  } catch {
    return { error: "Kestrel could not reach OpenAI. Try again in a moment.", spent: 0 }
  }

  const body = (await response.json().catch(() => null)) as {
    error?: { message?: string }
    usage?: { total_tokens?: number }
    choices?: { message?: { content?: string } }[]
  } | null
  const spent = body?.usage?.total_tokens ?? (response.ok ? RESERVE : 0)
  if (!response.ok) {
    const message = body?.error?.message || "OpenAI refused the request."
    return { error: message.slice(0, 280), spent }
  }
  const content = body?.choices?.[0]?.message?.content
  if (!content) return { error: "Kestrel returned an empty reply.", spent }
  let parsed: unknown
  try {
    parsed = JSON.parse(stripFence(content))
  } catch {
    return { error: "Kestrel's reply could not be read. Ask again in one sentence.", spent }
  }
  const gameplan = readGameplan(parsed)
  if ("error" in gameplan) return { error: gameplan.error, spent }
  return {
    turn: { ok: true, reply: gameplan.plan.reply, plan: gameplan.plan, tokensUsed: tokensUsed + spent, tokenCap: cap },
    spent,
  }
}

function systemPrompt(): string {
  return `You are Kestrel, the helper inside HarrierStone. The user is a program manager, not a statistician. Use short sentences and plain words.

They describe an AI rollout, agent, or training program they want to measure. You write a specific gameplan. You do not create the study yourself. The product creates it after they confirm.

Return one JSON object with these fields:
reply, company, name, functionId, investmentKind, tool, population, owner, rolloutDate, primaryMetricId, comparison, practicalEffectPct, holdBack, fileNeeded, questions.

functionId is one of engineering, support, hr, sales, finance, marketing.
investmentKind is one of seats, agent, training, mixed.
comparison is "comparison" when one group is held back, or "staggered" when a later wave gets it. Never use before_after. If they have no group to hold back, ask who can wait, and put that ask in questions.
primaryMetricId must be an id from this list:
${metricCatalog()}
practicalEffectPct is a whole number from 1 to 80, the size of change that would matter. Leave it out if they did not say.
rolloutDate is YYYY-MM-DD. Leave it empty if they did not give a date.
questions is an array of plain questions for anything still missing. Empty when the plan is complete.
holdBack names the group that stays on the old way of working.
fileNeeded names the export or system that already has the metric.

Do not state a return, ROI, payback, or NPV. Do not invent a dollar. Do not choose keep, expand, or cut. Do not invent headcount or an org chart. Do not offer to lower the privacy floor. Groups under five stay out of every result.
The reply field is what the person reads. Restate the plan in their words. Mention the metric, who gets it first, who waits, and which file they need to bring.`
}

function stripFence(value: string): string {
  const trimmed = value.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return fenced ? fenced[1] : trimmed
}
