export function signed(n: number, body: string): string {
  if (n > 0) return `+${body}`
  if (n < 0) return `−${body}`
  return body
}

export function formatNumber(n: number, digits?: number): string {
  if (!Number.isFinite(n)) return "—"
  const abs = Math.abs(n)
  const d = digits ?? (abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 1 : 2)
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: d,
  })
}

export function formatValue(n: number, unit: string): string {
  if (!Number.isFinite(n)) return "—"
  if (unit === "share") return `${(n * 100).toFixed(1)}%`
  if (unit === "score") return n.toFixed(2)
  if (unit === "dollars") {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: Math.abs(n) >= 100 ? 0 : 2,
    })
  }
  return formatNumber(n)
}

export function formatDelta(n: number, unit: string): string {
  if (!Number.isFinite(n)) return "—"
  if (Math.abs(n) < 0.0005) return unit === "share" ? "0 pp" : "0"
  const abs = Math.abs(n)
  if (unit === "share") return signed(n, `${(abs * 100).toFixed(1)} pp`)
  if (unit === "score") return signed(n, abs.toFixed(2))
  if (unit === "dollars") return signed(n, formatValue(abs, unit))
  return signed(n, formatNumber(abs))
}

export function formatRange(low: number, high: number, unit: string): string {
  const suffix =
    unit === "share" || unit === "score" || unit === "dollars" ? "" : ` ${unit}`
  return `${formatDelta(low, unit)} to ${formatDelta(high, unit)}${suffix}`
}

export function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(n) >= 100 ? 0 : 2,
  })
}

export function formatPct(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return "—"
  return `${(n * 100).toFixed(digits)}%`
}

export function plural(n: number, word: string): string {
  const count = formatNumber(n, 0)
  if (n === 1) return `${count} ${word}`
  if (word === "person") return `${count} people`
  return `${count} ${word}s`
}
