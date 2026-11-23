import type { Metadata } from "next"
import Link from "next/link"
import { Reveal } from "@/components/reveal"
import { SiteFooter } from "@/components/site-footer"
import { RESEARCH } from "@/lib/site"

export const metadata: Metadata = {
  title: "Research · HarrierStone",
  description: "What buyers are being asked to show, and the research behind mapping a job title to the work.",
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
              Each title is read for the tasks in the role, and those tasks point at the metric. Your team confirms the match.
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

      <section className="band" id="mapping">
        <div className="market-inner narrow">
          <Reveal>
            <h2 className="market-title">The research behind the mapping</h2>
            <p className="mt-6">
              Measuring whether AI changed the work starts with knowing what the work is. HarrierStone maps each job title to the tasks it involves, and each task to a metric the business already tracks. The team confirms each match.
            </p>
            <p className="mt-6">
              Doing that for a whole company depends on the title-to-task step. Founder Yan (Paul) Zhou is researching that question. He is an M.A. candidate in Industrial-Organizational Psychology at New York University, expected May 2027. The working title is Ontology Building. The question is how well public occupational taxonomies, and different AI designs, support workforce planning tasks such as mapping a job title to the tasks and skills it involves.
            </p>
            <p className="mt-6">
              The taxonomies are O*NET, the U.S. occupational database; ESCO, the European classification of skills, competences, qualifications and occupations; and SSOC, Singapore’s standard occupational classification. The designs are an advanced knowledge-graph retrieval system, a standard knowledge-graph retrieval system, and a language model with no knowledge graph. Open-source models, including Qwen, run locally for the comparison. Part of the work is a crosswalk that links an O*NET task to an ESCO task.
            </p>
            <p className="mt-6">
              HarrierStone’s task library starts from O*NET. This research is how the library grows: which taxonomy to use for a title, and how a knowledge graph can propose the tasks for the team to confirm. The work is in progress. No finding is final.
            </p>
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
