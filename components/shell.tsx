"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icon } from "@/components/icon"

export function Shell() {
  const path = usePathname()
  const marketing = path === "/" || path.startsWith("/research") || path.startsWith("/contact")

  return (
    <header className="no-print border-b border-line">
      <div className="shell flex items-center justify-between py-4">
        <Link href="/" className="wordmark" aria-label="HarrierStone">
          <img src="/harrierstone-logo.png" alt="" className="logo" />
        </Link>
        {marketing ? (
          <nav className="flex items-center gap-5 text-sm" aria-label="Company">
            <Link href="/research" className="text-muted hover:text-ink">
              Research
            </Link>
            <Link href="/contact" className="text-muted hover:text-ink">
              Contact
            </Link>
            <Link href="/rollouts" className="btn nav-cta">
              Open the demo
            </Link>
          </nav>
        ) : (
          <nav className="flex items-center gap-5 text-sm" aria-label="Product">
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
        )}
      </div>
    </header>
  )
}
