export type IconName =
  | "settings"
  | "general"
  | "connectors"
  | "privacy"
  | "status"
  | "rollout"
  | "people"
  | "metrics"
  | "history"
  | "groups"
  | "data"
  | "outcome"
  | "upload"
  | "chatgpt"
  | "claude"
  | "copilot-m365"
  | "gemini"
  | "github-copilot"
  | "github"
  | "cursor"
  | "claude-code"
  | "hris"
  | "ats"
  | "tickets"
  | "crm"
  | "jira"
  | "billing"
  | "cloudzero"
  | "dx"
  | "jellyfish"
  | "mcp"

const PATHS: Record<IconName, string> = {
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
  general: "M4 20V10l8-6 8 6v10 M9 20v-6h6v6",
  connectors: "M9 7v4a3 3 0 0 0 3 3h0a3 3 0 0 1 3 3v0 M8 7h2 M14 17h2 M12 3v2 M12 19v2",
  privacy: "M7 11V8a5 5 0 0 1 10 0v3 M6 11h12v9H6z",
  status: "M4 19V5 M4 19h16 M8 15l3-4 3 2 4-6",
  rollout: "M5 12h14 M13 6l6 6-6 6",
  people: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20 M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M20 20v-1.2a3 3 0 0 0-2.2-2.9 M16.5 5.2a3 3 0 0 1 0 5.6",
  metrics: "M4 19h16 M7 16v-5 M12 16V8 M17 16v-3",
  history: "M12 8v5l3 2 M12 21a9 9 0 1 0-8.5-6 M3 12v4H7",
  groups: "M4 7h7v5H4z M13 12h7v5h-7z M8 12v2 M16 7v5",
  data: "M4 7h16v10H4z M8 7V5h8v2 M8 17v2h8v-2",
  outcome: "M5 12l5 5L20 7",
  upload: "M12 16V5 M7 10l5-5 5 5 M5 19h14",
  chatgpt: "M12 4l2.2 4.6L19 11l-4.8 2.4L12 18l-2.2-4.6L5 11l4.8-2.4L12 4Z",
  claude: "M7 17c2-6 3-9 5-9s3 3 5 9 M9 13h6",
  "copilot-m365": "M4 16l8-9 8 9 M8 16v3h8v-3",
  gemini: "M12 3l2 7h7l-5.5 4 2 7L12 17l-5.5 4 2-7L3 10h7l2-7Z",
  "github-copilot": "M9 19c-4 1.5-4-2.5-6-3 M15 21v-3.2a2.7 2.7 0 0 0-.8-2.1c2.7-.3 5.5-1.3 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.3 1.2a11.4 11.4 0 0 0-6 0C6.7 2.7 5.7 3 5.7 3a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.3 9.7c0 4.6 2.8 5.6 5.5 6a2.7 2.7 0 0 0-.8 2.1V21",
  github: "M9 19c-4 1.5-4-2.5-6-3 M15 21v-3.2a2.7 2.7 0 0 0-.8-2.1c2.7-.3 5.5-1.3 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.3 1.2a11.4 11.4 0 0 0-6 0C6.7 2.7 5.7 3 5.7 3a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.3 9.7c0 4.6 2.8 5.6 5.5 6a2.7 2.7 0 0 0-.8 2.1V21",
  cursor: "M5 19L19 5 M14 5h5v5",
  "claude-code": "M8 8l-4 4 4 4 M16 8l4 4-4 4 M13 6l-2 12",
  hris: "M4 20V9l8-5 8 5v11 M9 20v-6h6v6",
  ats: "M8 6h8v14H8z M10 6V4h4v2 M10 11h4 M10 14h4",
  tickets: "M4 8h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V8Z",
  crm: "M4 16l4-5 3 3 5-7 4 4",
  jira: "M6 18l6-12 6 12 M9 14h6",
  billing: "M4 7h16v10H4z M4 11h16 M8 15h3",
  cloudzero: "M7 17h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.5A3.5 3.5 0 0 0 7 17Z",
  dx: "M5 19V5h10l4 4v10z M15 5v4h4",
  jellyfish: "M8 14c0 4 8 4 8 0 M8 14c-2 0-3-2-2-4s4-1 4 1 M16 14c2 0 3-2 2-4s-4-1-4 1 M12 10V6",
  mcp: "M8 8H5v8h3 M16 8h3v8h-3 M9 12h6",
}

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}

export function sourceIcon(id: string): IconName {
  if (id in PATHS) return id as IconName
  return "connectors"
}
