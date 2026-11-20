export function parseDate(value: string): string | null {
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10)
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00Z`).getTime()
  const b = new Date(`${end}T00:00:00Z`).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** Monday of the week containing `iso`, in UTC. */
export function mondayOf(iso: string): string {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay()
  const delta = day === 0 ? -6 : 1 - day
  return addDays(iso, delta)
}

export function weeksFrom(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i * 7))
}

export function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

export function longDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function isPre(period: string, rollout: string): boolean {
  return period < rollout
}

export function isPost(
  period: string,
  rollout: string,
  secondWave: string | null,
  staggered: boolean,
): boolean {
  if (period < rollout) return false
  if (staggered && secondWave && period >= secondWave) return false
  return true
}
