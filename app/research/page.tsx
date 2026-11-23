import type { Metadata } from "next"
import Link from "next/link"
import { Reveal } from "@/components/reveal"
import { SiteFooter } from "@/components/site-footer"
import { RESEARCH } from "@/lib/site"

export const metadata: Metadata = {
  title: "Research · HarrierStone",
  description: "What buyers are being asked to show, and what a HarrierStone study puts on the table.",
}

export default function ResearchPage() {
  return (
    <div className="marketing">
      <section className="hero hero-quiet">
        <div className="market-inner">
          <p className="kicker">Research</p>
          <h1 className="page-title">What did the rollout return?</h1>
          <p className="lede">Buyers are asking what the AI accomplished, what the ROI was, and how much value the tool provided.</p>
        </div>
      </section>

      <section className="band">
        <div className="market-inner stack-loose">
          {RESEARCH.map((item) => (
            <Reveal key={item.figure}>
              <article className="research-row">
                <p className="market-figure">{item.figure}</p>
                <div>
                  <p>{item.text}</p>
                  <p className="market-source">{item.source}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="market-section">
        <div className="market-inner narrow">
          <Reveal>
            <p>
              In 2025 Atlassian acquired DX for $1 billion to measure how AI changes engineering work. The budget conversation is leaving the usage chart.
            </p>
            <h2 className="market-title mt-10">How a study answers those questions</h2>
            <ul className="market-points">
              <li>A baseline taken before go-live, in the metric the function already manages by.</li>
              <li>The same weeks for the group that received the tool and the group that is waiting.</li>
              <li>The cost of the work three ways: people, people with the tool, and an agent.</li>
            </ul>
            <p className="mt-8">
              Each title is read for the tasks in the role, and those tasks point at the metric. Your team confirms the match. The task library behind that reading is still being extended.
            </p>
            <div className="row mt-8">
              <Link href="/rollouts" className="btn">
                Open the demo
              </Link>
              <Link href="/contact" className="btn btn-ghost">
                Talk with us
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
