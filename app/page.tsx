import Link from "next/link"

const SITUATIONS = [
  {
    title: "The renewal is already on the calendar",
    text: "The seats are bought. The only report anyone can produce is who logged in. Someone still has to tell the CFO whether the work moved.",
  },
  {
    title: "The rollout has not started, and the “before” is about to disappear",
    text: "A tool, an agent, or a training program is about to go out. Once everyone has it, there is no baseline left to compare against.",
  },
  {
    title: "The question is the return, and there is no statistics team",
    text: "In PwC’s 2026 Global CEO Survey, 56% of CEOs reported neither higher revenue nor lower costs from AI over the prior year. The person who owns the rollout is usually a people lead, a head of AI, or a COO.",
  },
]

const PATH = [
  {
    when: "Before",
    title: "We frame the decision with you",
    text: "Which investment, which teams, and which number would change a keep, expand, or cut. That metric is locked before go-live. We pull the weeks already on file and run a short check-in, so the baseline exists. A signed study is meant to have that baseline within two weeks. It cannot be reconstructed after the fact.",
  },
  {
    when: "Roles",
    title: "Your titles, your tasks, your metric",
    text: "You bring the org chart or a simple title list. We read each title for the work that role actually does, and we propose the metrics that follow from those tasks. Your team edits the match and the metric until they describe your company. A title we are unsure of waits for a person. Groups under five stay out of every result.",
  },
  {
    when: "Design",
    title: "We decide who gets it first",
    text: "Together we hold a group back, or we stagger the wave. That comparison is what lets the weeks speak for the rollout. If the groups are too small to support a conclusion, we say so before more money goes out.",
  },
  {
    when: "During",
    title: "The study stays open while the rollout runs",
    text: "Outcomes, seats, spend, and check-in replies arrive as the weeks do. You watch them in a live view, and we help keep the files coming. A CSV is enough when IT has not opened a connector yet. Nothing is installed on a laptop. Employees see a notice, and results are never about a named person.",
  },
  {
    when: "Readout",
    title: "You leave with a decision and the math",
    text: "When the planned weeks are in, the same numbers are written for the CFO, the head of AI, and the operator who owns the work. Keep, expand, or cut. The change and its range. What the work cost. A workbook that repeats every calculation. We can walk that readout with you.",
  },
]

export default function LandingPage() {
  return (
    <div className="shell landing py-10">
      <h1 className="page-title">AI Adoption made easy</h1>
      <p className="lede">
        HarrierStone runs the study around a rollout, an agent, or a training program, and stays with you from the baseline to the decision. It is built for a company of a few hundred to a few thousand people, in the metric that company already uses to judge the work.
      </p>
      <div className="row mt-6">
        <Link href="/rollouts" className="btn">
          Open the demo
        </Link>
      </div>

      <section className="landing-block">
        <h2>The meeting you are heading into</h2>
        <div className="landing-steps">
          {SITUATIONS.map((item) => (
            <article key={item.title} className="landing-situation">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-block">
        <h2>What you take into that meeting</h2>
        <p>
          A keep, expand, or cut, in the outcome your function already manages by: cycle time, tickets closed, time to fill, days to close, pipeline. Next to it, the cost of getting that outcome three ways — people before the tool, people plus the tool, and an agent’s own work. The range is on the page. When the weeks cannot separate a real gain from no change, the study says so, and it withholds the decision.
        </p>
        <p>
          That is the return. You name the metric and the size of change that would matter. We measure that change against what the rollout cost. Finance can open the workbook and repeat the arithmetic.
        </p>
      </section>

      <section className="landing-block">
        <h2>Kestrel starts the study with you</h2>
        <p>
          Kestrel is the assistant in the corner of this page. Describe the rollout the way you would to a colleague: which tool, which teams, and what you hope moved. Kestrel writes the plan in the chat, including the metric, who gets it first, who waits, and which file already has the number.
        </p>
        <p>
          You confirm, and the study is created. You can keep editing it. Kestrel speaks with the person who owns the program, and it waits for that confirmation before anything is saved.
        </p>
      </section>

      <section className="landing-block">
        <h2>From the first working session to the readout</h2>
        <p>A study is an engagement. We set it up with you, and we stay through the weeks and the readout.</p>
        <ol className="landing-steps">
          {PATH.map((step) => (
            <li key={step.when}>
              <span className="landing-num">{step.when}</span>
              <div>
                <p className="font-semibold">{step.title}</p>
                <p className="text-sm text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-block">
        <h2>Tailored to the roles you actually have</h2>
        <p>
          A generic job title is a starting point. Each title is read for its tasks, and those tasks point to the metrics worth watching. Your team changes the reading: the title, the tasks we attached, and the metric itself. The version you confirm is the one the study uses.
        </p>
        <p>
          Under that review is a task library — an ontology of role, task, and metric — that we are still extending. It is how a study starts from the work instead of from a blank form, and it gets sharper each time a company edits it. The edit is already part of every study. The library is the part still being deepened.
        </p>
      </section>

      <section className="landing-block">
        <h2>What changes when you have the study</h2>
        <ul className="landing-steps landing-outcomes">
          <li>
            <span className="landing-num">Keep</span>
            <p>Leave a rollout where it is when the work moved and there is no further group to give it to.</p>
          </li>
          <li>
            <span className="landing-num">Expand</span>
            <p>Give the same tool to the group you held back, on the same metric you already locked.</p>
          </li>
          <li>
            <span className="landing-num">Cut</span>
            <p>Stop paying for a rollout that did not move the work, before the renewal signs it for another year.</p>
          </li>
        </ul>
        <p>
          The best time is before the rollout or the renewal. After everyone has it, the baseline is gone. The demo uses sample companies: one study is still open, and the others have already reached a decision. Replace the numbers before anyone acts on them.
        </p>
        <div className="row mt-5">
          <Link href="/rollouts" className="btn">
            Open the demo
          </Link>
        </div>
      </section>
    </div>
  )
}
