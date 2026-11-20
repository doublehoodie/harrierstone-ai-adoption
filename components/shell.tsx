import Link from "next/link"
import { Icon } from "@/components/icon"

export function Shell() {
  return (
    <header className="no-print border-b border-line">
      <div className="shell flex items-center justify-between py-4">
        <Link href="/" className="wordmark">
          <Mark />
          HarrierStone
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

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#1c1916" />
      <path d="M7 23 L16 8 L25 23" fill="none" stroke="#f3efe6" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M11.2 16.5 H20.8" stroke="#f3efe6" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
