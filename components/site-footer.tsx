import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="market-inner site-footer-row">
        <div>
          <p>HarrierStone · New York</p>
          <p className="site-footer-note">
            <Link href="/research#mapping">Mapping research by Yan (Paul) Zhou is in progress.</Link>
          </p>
        </div>
        <nav className="site-footer-nav" aria-label="Company">
          <Link href="/research">Research</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/rollouts">Demo</Link>
        </nav>
      </div>
    </footer>
  )
}
