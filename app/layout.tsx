import type { Metadata } from "next"
import { Newsreader, Public_Sans } from "next/font/google"
import { KestrelDock } from "@/components/kestrel-panel"
import { Shell } from "@/components/shell"
import { kestrelTokenCap } from "@/lib/kestrel"
import { getWorkspace } from "@/lib/store"
import "./globals.css"

const sans = Public_Sans({ subsets: ["latin"], variable: "--font-public" })
const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-newsreader" })

export const metadata: Metadata = {
  title: "HarrierStone",
  description: "Decide whether an AI investment worked.",
}

export const dynamic = "force-dynamic"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${sans.variable} ${serif.variable}`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <Shell />
        <main id="main" className="app-main">{children}</main>
        <KestrelDock configured={Boolean(process.env.OPENAI_API_KEY)} tokensUsed={getWorkspace().kestrelTokensUsed} tokenCap={kestrelTokenCap()} />
      </body>
    </html>
  )
}
