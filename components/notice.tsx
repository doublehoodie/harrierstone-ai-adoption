import type { Study } from "@/lib/types"

export function NoticeBody({ study }: { study?: Study | null }) {
  const company = study?.company ?? "[Company]"
  const tool = study?.tool ?? "[the AI tool or agent]"
  const population = study?.population ?? "[the teams in the study]"
  const floor = study?.privacyFloor ?? 5
  const owner = study?.owner ?? "[study owner]"
  return (
    <article className="stack max-w-3xl text-[1.02rem] leading-relaxed" style={{ gap: "1rem" }}>
      <p>
        {company} is running a study of {tool} for {population}. This note says what is collected, what is not, and who sees the result.
      </p>
      <h2 className="section-title">What is collected</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Team-level outcomes from systems the company already uses, such as tickets, the CRM, the HR system, or engineering tools.</li>
        <li>Team-level usage of {tool}: how many people on a team used it, how often, and how many kinds of tasks it touched.</li>
        <li>Seat, token, and agent spend.</li>
        <li>Short pulse answers, four questions, asked the same way more than once. Answers are stored as a group average.</li>
      </ul>
      <h2 className="section-title">What is not collected</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>No software is installed on your devices.</li>
        <li>No one is scored, ranked, or reported on as an individual.</li>
        <li>Names, emails, and employee ids are not stored. If a file contains them, those columns are thrown away on import.</li>
        <li>Prompt text, source code, and message contents are not part of this study.</li>
      </ul>
      <h2 className="section-title">How small groups are handled</h2>
      <p>
        Any result with fewer than {floor} people is hidden. That includes a team, a pulse, and an adoption segment. Hiding is the default. It is not something a manager can turn off.
      </p>
      <h2 className="section-title">Who sees it</h2>
      <p>
        The study owner ({owner}) and the people reading {tool}. They see group results and a range, not a point with false certainty, and not a person.
      </p>
      <h2 className="section-title">Questions</h2>
      <p>Ask {owner}. Participation in the pulse is voluntary. The outcome and usage measures come from systems the company already operates.</p>
    </article>
  )
}
