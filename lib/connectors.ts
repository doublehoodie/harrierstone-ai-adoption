export type SourceCategory = "usage" | "outcomes" | "spend" | "existing" | "mcp"

export interface SourceAdapter {
  id: string
  name: string
  category: SourceCategory
  /** Live pulls stay unwired until a company can sign in. CSV is the working path. */
  mode: "csv" | "unconfigured"
  note: string
  /** Label on the Connect button. Absent for a plain CSV. */
  button?: string
  /** The read-only access the button will ask for. */
  access?: string
  /** The only row this source is allowed to write. */
  writes?: string
}

export const SOURCES: SourceAdapter[] = [
  { id: "csv-usage", name: "Usage CSV", category: "usage", mode: "csv", note: "Who (team), how often, how broadly, and seat or token cost." },
  {
    id: "chatgpt",
    name: "ChatGPT Enterprise",
    category: "usage",
    mode: "unconfigured",
    note: "Workspace admin, read-only usage.",
    button: "Connect ChatGPT",
    access: "A workspace admin key with read-only access to usage. This is one of the first two connections, with Claude.",
    writes: "Team-week usage: active people, sessions, breadth, seat cost, and token cost.",
  },
  {
    id: "claude",
    name: "Claude",
    category: "usage",
    mode: "unconfigured",
    note: "Organization admin, read-only usage.",
    button: "Connect Claude",
    access: "An organization admin key with read-only access to usage. This is one of the first two connections, with ChatGPT.",
    writes: "Team-week usage: active people, sessions, breadth, seat cost, and token cost.",
  },
  {
    id: "copilot-m365",
    name: "Microsoft Copilot",
    category: "usage",
    mode: "unconfigured",
    note: "Admin center, read-only usage.",
    button: "Connect Microsoft 365",
    access: "A Microsoft 365 admin with read-only access to the Copilot usage report.",
    writes: "Team-week usage: active people, sessions, breadth, seat cost, and token cost.",
  },
  {
    id: "gemini",
    name: "Gemini for Workspace",
    category: "usage",
    mode: "unconfigured",
    note: "Workspace admin, read-only usage.",
    button: "Connect Google",
    access: "A Workspace admin with read-only access to Gemini usage.",
    writes: "Team-week usage: active people, sessions, breadth, seat cost, and token cost.",
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    category: "usage",
    mode: "unconfigured",
    note: "Org owner, read-only Copilot report.",
    button: "Connect GitHub",
    access: "An organization owner with read-only access to the Copilot usage report.",
    writes: "Team-week usage: active people, sessions, breadth, seat cost, and token cost.",
  },
  {
    id: "cursor",
    name: "Cursor",
    category: "usage",
    mode: "unconfigured",
    note: "Team admin, read-only usage.",
    button: "Connect Cursor",
    access: "A team admin with read-only access to Cursor usage.",
    writes: "Team-week usage: active people, sessions, breadth, seat cost, and token cost.",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    category: "usage",
    mode: "unconfigured",
    note: "Org admin, read-only usage.",
    button: "Connect Claude Code",
    access: "An organization admin with read-only access to Claude Code usage.",
    writes: "Team-week usage: active people, sessions, breadth, seat cost, and token cost.",
  },
  { id: "csv-outcomes", name: "Outcome CSV", category: "outcomes", mode: "csv", note: "Period, team, metric, value, and n." },
  {
    id: "hris",
    name: "HRIS",
    category: "outcomes",
    mode: "unconfigured",
    note: "Headcount, retention, and case time.",
    button: "Connect HR system",
    access: "Read-only access to headcount, retention, and case cycle time.",
    writes: "Team-week outcome: metric, value, and n.",
  },
  {
    id: "ats",
    name: "ATS",
    category: "outcomes",
    mode: "unconfigured",
    note: "Time to fill and requisitions.",
    button: "Connect ATS",
    access: "Read-only access to time to fill and requisitions.",
    writes: "Team-week outcome: metric, value, and n.",
  },
  {
    id: "tickets",
    name: "Ticketing",
    category: "outcomes",
    mode: "unconfigured",
    note: "Resolution, CSAT, and reopen rate.",
    button: "Connect tickets",
    access: "Read-only access to resolution time, CSAT, and reopen rate.",
    writes: "Team-week outcome: metric, value, and n.",
  },
  {
    id: "crm",
    name: "CRM",
    category: "outcomes",
    mode: "unconfigured",
    note: "Win rate, cycle, and pipeline.",
    button: "Connect CRM",
    access: "Read-only access to win rate, cycle length, and pipeline.",
    writes: "Team-week outcome: metric, value, and n.",
  },
  {
    id: "github",
    name: "GitHub or GitLab",
    category: "outcomes",
    mode: "unconfigured",
    note: "Cycle time, throughput, and review wait.",
    button: "Connect the repo host",
    access: "Read-only access to cycle time, throughput, and review wait.",
    writes: "Team-week outcome: metric, value, and n.",
  },
  {
    id: "jira",
    name: "Jira",
    category: "outcomes",
    mode: "unconfigured",
    note: "Throughput and cycle time.",
    button: "Connect Jira",
    access: "Read-only access to throughput and cycle time.",
    writes: "Team-week outcome: metric, value, and n.",
  },
  { id: "csv-spend", name: "Spend CSV", category: "spend", mode: "csv", note: "Seat cost, token cost, or a category column." },
  {
    id: "billing",
    name: "Provider billing",
    category: "spend",
    mode: "unconfigured",
    note: "Invoices for seats and tokens.",
    button: "Connect billing",
    access: "Read-only access to invoices for seats and tokens.",
    writes: "Spend on the same week: seat, token, or other.",
  },
  {
    id: "cloudzero",
    name: "CloudZero",
    category: "spend",
    mode: "unconfigured",
    note: "Cost the client already pays to compute.",
    button: "Connect CloudZero",
    access: "Read-only access to the CloudZero cost export or API.",
    writes: "Spend on the same week. This does not build a new cost model.",
  },
  {
    id: "dx",
    name: "DX",
    category: "existing",
    mode: "unconfigured",
    note: "Engineering metrics the client already pays for.",
    button: "Connect DX",
    access: "Read-only access to a DX export or API. Recognized engineering columns land as outcomes.",
    writes: "Team-week outcome: metric, value, and n.",
  },
  {
    id: "jellyfish",
    name: "Jellyfish",
    category: "existing",
    mode: "unconfigured",
    note: "Engineering metrics the client already pays for.",
    button: "Connect Jellyfish",
    access: "Read-only access to Jellyfish engineering metrics.",
    writes: "Team-week outcome: metric, value, and n.",
  },
  {
    id: "mcp",
    name: "MCP server",
    category: "mcp",
    mode: "unconfigured",
    note: "A server you already run. HarrierStone calls it.",
    button: "Connect MCP",
    access: "A server address and a read-only token. A tool that returns people is refused. The token is not stored in this workspace.",
    writes: "Whichever you choose: usage, outcomes, or spend, as a team-week row.",
  },
]

export const SOURCE_GROUPS: { id: SourceCategory; label: string }[] = [
  { id: "usage", label: "Admin usage" },
  { id: "outcomes", label: "System of record" },
  { id: "spend", label: "Billing" },
  { id: "existing", label: "Tools already in use" },
  { id: "mcp", label: "Custom server" },
]

export function connectableSources(): SourceAdapter[] {
  return SOURCES.filter((source) => source.mode === "unconfigured" && source.button && source.access && source.writes)
}

export function sourcesBy(category: SourceCategory): SourceAdapter[] {
  return SOURCES.filter((source) => source.category === category)
}

/** Accounts that can fill one file on a study. The custom server stays in Settings. */
export function sourcesFor(slot: "usage" | "outcomes" | "spend"): SourceAdapter[] {
  const live = connectableSources().filter((source) => source.id !== "mcp")
  if (slot === "usage") return live.filter((source) => source.category === "usage")
  if (slot === "spend") return live.filter((source) => source.category === "spend")
  return live.filter((source) => source.category === "outcomes" || source.category === "existing")
}

export function uploadAnchor(category: SourceCategory): string {
  if (category === "usage") return "#upload-usage"
  if (category === "spend") return "#upload-spend"
  return "#upload-outcomes"
}
