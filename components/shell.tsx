import Link from "next/link"
import { Icon } from "@/components/icon"

export function Shell() {
  return (
    <header className="no-print border-b border-line">
      <div className="shell flex items-center justify-between py-4">
        <Link href="/" className="wordmark" aria-label="HarrierStone">
          <img src="/harrierstone-logo.png" alt="" className="logo" />
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/rollouts" className="text-muted hover:text-ink">
            Rollouts
          </Link>
          <Link href="/studies/new" className="text-muted hover:text-ink">
            New rollout
          </Link>
          <Link href="/settings" className="nav-icon-link" aria-label="Settings">
            <Icon name="settings" size={18} />
          </Link>
        </nav>
      </div>
    </header>
  )
}

