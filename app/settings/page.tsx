import Link from "next/link"
import { ConnectorList } from "@/components/connector-list"
import { Icon, type IconName } from "@/components/icon"
import { SettingsForm } from "@/components/settings-form"
import { connectableSources } from "@/lib/connectors"
import { getWorkspace } from "@/lib/store"
import { connectedCount } from "@/lib/workspace"

const SECTIONS: { id: string; label: string; icon: IconName }[] = [
  { id: "general", label: "General", icon: "general" },
  { id: "connectors", label: "Connectors", icon: "connectors" },
  { id: "privacy", label: "Privacy", icon: "privacy" },
]

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section } = await searchParams
  const current = SECTIONS.some((item) => item.id === section) ? section! : "general"
  const workspace = getWorkspace()
  const sources = connectableSources()
  const on = connectedCount(workspace, sources.map((source) => source.id))

  return (
    <div className="shell py-8">
      <h1 className="screen-title">Settings</h1>
      <p className="screen-note">Workspace defaults, the sources a rollout can use, and the privacy floor.</p>
      <div className="settings-shell">
        <nav className="settings-nav" aria-label="Settings">
          {SECTIONS.map((item) => (
            <Link key={item.id} href={`/settings?section=${item.id}`} className={item.id === current ? "settings-link active" : "settings-link"} aria-current={item.id === current ? "page" : undefined}>
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
              {item.id === "connectors" && <span className="settings-count">{on}</span>}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">
          {current === "general" && (
            <section className="card stack">
              <h2 className="font-semibold">General</h2>
              <SettingsForm workspace={workspace} mode="general" />
            </section>
          )}
          {current === "privacy" && (
            <section className="card stack">
              <h2 className="font-semibold">Privacy</h2>
              <SettingsForm workspace={workspace} mode="privacy" />
            </section>
          )}
          {current === "connectors" && (
            <ConnectorList sources={sources} connections={workspace.connections} bulk />
          )}
        </div>
      </div>
    </div>
  )
}
