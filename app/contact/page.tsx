import type { Metadata } from "next"
import Link from "next/link"
import { ContactForm } from "@/components/contact-form"
import { Reveal } from "@/components/reveal"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Contact · HarrierStone",
  description: "Bring a rollout before the baseline disappears.",
}

const BRING = [
  { title: "The investment", text: "A tool, an agent, a training program, or a renewal." },
  { title: "The people", text: "The teams who would receive it, and a group that can wait." },
  { title: "The metric", text: "The number that function already uses to judge the work." },
]

export default function ContactPage() {
  return (
    <div className="marketing">
      <section className="hero hero-quiet">
        <div className="market-inner">
          <p className="kicker">Contact</p>
          <h1 className="page-title">Bring the question of what it returned.</h1>
          <p className="lede">A working session names the metric and the baseline, so the value of the tool can be read. The demo is open if you want to see the shape of it first.</p>
          <div className="row mt-8">
            <Link href="/rollouts" className="btn">
              Open the demo
            </Link>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="market-inner">
          <Reveal>
            <h2 className="market-title">What to have in mind</h2>
            <div className="market-grid">
              {BRING.map((item) => (
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
        <div className="market-inner contact-layout">
          <Reveal>
            <div>
              <h2 className="market-title">Write to us</h2>
              <p className="text-muted">Tell us the company, the tool, and the metric. We reply in U.S. Eastern business hours.</p>
            </div>
            <ContactForm />
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
