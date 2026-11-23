import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="market-inner site-footer-row">
        <p>HarrierStone · New York</p>
        <nav className="site-footer-nav" aria-label="Company">
          <Link href="/research">Research</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/rollouts">Demo</Link>
        </nav>
      </div>
    </footer>
  )
}
