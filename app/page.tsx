import type { Metadata } from "next"
import Link from "next/link"
import { Reveal } from "@/components/reveal"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "HarrierStone",
  description: "What did the AI rollout accomplish, what did it return, and how much value did the tool provide?",
}

const QUESTIONS = [
  {
    title: "What did it accomplish?",
    text: "The seats are live. The report on the table is still who logged in. The meeting is about the work that moved.",
  },
  {
    title: "What is the ROI?",
    text: "The CFO wants the gain in the metric you already manage by, set against what the rollout cost.",
  },
  {
    title: "How much value did the tool provide?",
    text: "People before the tool, people with the tool, and an agent do not cost the same.",
  },
]

const LEAVES = [
  { title: "The change", text: "Cycle time, tickets, time to fill, days to close, pipeline. The metric you already manage by." },
  { title: "The range", text: "When the weeks cannot separate a gain from no change, the number stays unmarked." },
  { title: "The cost", text: "People before the tool, people with the tool, and an agent’s own work." },
]

const STEPS = [
  { when: "Before", text: "The metric is agreed, and the weeks already on file are pulled in. A baseline is meant to be ready within two weeks." },
  { when: "During", text: "Outcomes, seats, and check-ins arrive with the weeks. You watch the study while it is still open." },
  { when: "Readout", text: "The change, the range, and the cost. A workbook repeats every calculation. The study reports the reading." },
]

export default function LandingPage() {
  return (
    <div className="marketing">
      <section className="hero">
        <div className="market-inner">
          <p className="kicker">For the company that already rolled the AI out</p>
          <h1 className="page-title">AI Adoption made easy</h1>
          <p className="lede">What did it accomplish for the business, what did it return, and how much value did the tool provide?</p>
          <div className="row mt-8">
            <Link href="/rollouts" className="btn">
              Open the demo
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Talk with us
            </Link>
          </div>
          <p className="demo-note">
            The demo runs on sample companies. Connecting ChatGPT, Claude, or another system records that source. It does not pull rows, send check-ins, or sign a company in. Numbers in the sample rollouts are sample data.
          </p>
        </div>
      </section>

      <section className="band">
        <div className="market-inner">
          <Reveal>
            <h2 className="market-title market-lead">The enterprise AI is in. What has it actually accomplished for the business?</h2>
            <div className="market-grid">
              {QUESTIONS.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="market-section">
        <div className="market-inner">
          <Reveal>
            <h2 className="market-title">The answer you take into that meeting</h2>
            <div className="market-grid">
              {LEAVES.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="band">
        <div className="market-inner">
          <Reveal>
            <h2 className="market-title">From the first session to the readout</h2>
            <ol className="market-steps">
              {STEPS.map((step) => (
                <li key={step.when}>
                  <span>{step.when}</span>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="market-section">
        <div className="market-inner market-stat">
          <Reveal>
            <p className="market-figure">56%</p>
            <p className="market-stat-text">of CEOs reported neither higher revenue nor lower costs from AI over the prior year.</p>
            <p className="market-source">PwC Global CEO Survey, January 2026</p>
            <Link href="/research" className="market-more">
              The research behind the claim
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="band">
        <div className="market-inner market-close">
          <Reveal>
            <h2 className="market-title">Ask it while a baseline still exists.</h2>
            <p>After everyone has the tool, there is nothing left to compare the value against.</p>
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
