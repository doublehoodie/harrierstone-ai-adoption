# HarrierStone — Product Plan

> Guidance for building the product. This sets direction, principles and boundaries. It is **not** a spec: implementation choices (stack, data model, UI, libraries, sequencing) are left to whoever is building. When this document and a better idea conflict, take the better idea and update this file.

## 1. What we're building

HarrierStone measures whether an AI investment actually worked.

A company is about to roll out an AI tool, deploy an agent, run an AI training program, or renew AI seats. HarrierStone captures a **baseline before**, measures **outcomes during**, and ends with a **keep / expand / cut decision** backed by evidence.

**One-line test for any feature:** does it help a company make a better decision about an AI investment? If not, it probably doesn't belong.

## 2. Who it's for

- **Target companies:** ~200–5,000 employees, for-profit, already using AI tools (not just exploring), no large in-house analytics team.
- **Buyer (varies by company):** CHRO / VP People, Head of AI or Transformation, or COO — whoever owns the rollout.
- **Day-to-day user:** a people analytics lead, HR business partner or program manager who sets up and runs studies. Not a data scientist — the product must do the statistics for them.
- **Results audience:** the CFO and executive team.
- **Employees:** answer short pulse surveys. Never individually tracked or reported on.

## 3. The core flow

Everything in the product supports this loop:

1. **Set up a study** — what's being rolled out, to whom, when, and which outcomes matter.
2. **Map roles** — import roles/org chart; auto-map roles to O*NET tasks; user reviews and edits.
3. **Choose outcomes** — pick metrics from function templates or define custom ones. Metrics are locked before go-live (pre-registration), so no one can cherry-pick afterward.
4. **Capture the baseline** — pull pre-rollout outcome data and run a baseline pulse.
5. **Design the comparison** — propose comparison groups or a staggered rollout; warn if groups are too small to support a conclusion.
6. **Measure** — usage, spend, outcomes and pulses flow in over time.
7. **Decide** — report impact, cost per outcome gained, confidence, and a recommendation.

## 4. Capabilities (MVP scope)

The MVP aims to cover all of these. Depth per area is the builder's call.

| Area | What it needs to do |
|---|---|
| **AI usage data** | Pull usage from major AI platforms (ChatGPT Enterprise, Microsoft Copilot, Gemini for Workspace, Claude), coding tools (GitHub Copilot, Cursor, Claude Code), and CSV upload. Normalize everything into a small common shape: *who* (joined to org/team), *how often*, *how broadly*. |
| **Outcome data** | Pull business outcomes from systems of record — HR/HRIS, recruiting (ATS), ticketing, CRM, engineering (GitHub/GitLab, Jira) — plus CSV upload. Organized as **function templates** (HR, customer support, sales, engineering, finance/ops, marketing). |
| **AI spend & agents** | Seat costs plus token/API spend (provider billing APIs or imports from cost tools). **Agents are treated as workers:** measured against the same outcome metrics as people, with their spend as their cost. |
| **Role mapping** | Map client roles to O*NET tasks automatically; human review screen. Keep the mapping layer swappable (it may later be replaced by a better ontology). |
| **Pulse surveys** | Short (3–5 items), frequent, validated I/O measures; baseline + follow-up waves; delivered via email or Slack/Teams. |
| **Study design** | Comparison groups or staggered rollout; sample-size/power check; pre-registered metrics. |
| **Analysis** | Before/after with comparison (e.g., difference-in-differences); adoption segments (behavioral clustering of usage); cost per outcome for **human / human + AI / agent-only** work. Show ranges and confidence, not just point estimates. |
| **Decision report** | One-page executive summary + drill-downs. Three lenses on the same data: people/adoption (CHRO), portfolio/spend (Head of AI), operations/throughput (COO). Export to PDF/slides. |
| **Existing tools** | If a client already uses DX, Jellyfish, CloudZero, etc., import their exports rather than duplicating them. |

**Out of scope:** shadow-AI detection or anything requiring software on employee devices.

## 5. Principles (non-negotiable)

1. **Outcomes over activity.** Usage is an input, never the headline result.
2. **Privacy by design.** Results only for groups above a minimum size (e.g., 5+). No individual-level reports. Read-only connections. Ship an employee-notice template.
3. **Every source is optional.** Each connector can be turned off; CSV upload always works as a fallback. A client waiting on IT access should still be able to start.
4. **Honest statistics.** Show uncertainty. Say "not enough data" when that's the truth. Never let the UI imply causation the design doesn't support.
5. **Integrate, don't rebuild.** Prefer importing from tools clients already have.
6. **Demo-able without a client.** Ship realistic synthetic data so the full flow can be shown end to end.
7. **Built for non-statisticians.** Plain language everywhere; methods explained on demand.

## 6. What good looks like

- Contract to captured baseline in **≤ 2 weeks**.
- **≥ 70%** of a client's roles map to O*NET tasks without manual edits.
- Pulse response rate **≥ 40%**.
- Every completed study ends in a decision the buyer says they acted on.

## 7. Known risks to design around

- **Data access is slow** (client IT and security reviews) → CSV path and synthetic demo data from day one.
- **Small teams** make results noisy → power check up front; ranges in reports.
- **Employee trust** → group-level only; transparent notice.
- **Sensitive data types** (billing, code metadata, HR records) → minimize what's stored; keep sources separable; plan for SOC 2.
- **Vendor API changes** → isolate each connector so one breaking doesn't break the product.

## 8. Decisions made while building the MVP

- **Templates at full depth first:** HR, engineering, and customer support. Sales, finance/ops, and marketing ship with a core metric set and the shared pulse.
- **Grain of data:** team and wave. CSV uploads that contain names, emails, or employee ids drop those columns. Groups under 5 are hidden. The floor can be raised, not lowered.
- **Ontology:** O*NET-SOC titles and a short task list, behind one swappable module. AI-exposure tags are ours, not O*NET's. A match at 75% or better counts as automatic. A person still reviews the list.
- **Connectors:** each source has to land in one common shape (team, period, how often, how broadly, spend, outcome). CSV is the working path, including a DX-style export. Live vendor APIs are not simulated. They stay unwired until a client grants read-only access.
- **Statistics:** difference-in-differences on weekly team results, with a 95% range and no p-value. Keep / expand / cut is withheld when there is no comparison group, the range cannot separate "nothing" from "a gain that would matter," the power check fails, the groups were already diverging, a group is under the floor, the pre-registration was amended, or the design was locked after measurement data was already loaded.
- **Agents:** measured on the same outcomes as a team. The agent's own cost leaves human pay out and is labeled as not comparable to a fully loaded person.
- **Pulses:** four original items (quality, effectiveness, cognitive load, autonomy), fixed across waves. They are not a published instrument, and they do not decide the study. Sending a wave is simulated in this preview.
- **Pricing:** still open. Spend, agents, and engineering stay in their own modules so they can be packaged separately later.
- **Beyond O*NET:** still open. Only the mapping module needs to change.
