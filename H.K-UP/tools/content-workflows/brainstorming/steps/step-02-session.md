---
step: "02"
name: "Brainstorm Session"
workflow: brainstorming
agent: stratege
---

# Step 02 — Brainstorm Session

> **CRITICAL — Rule 1:** User decides at every phase. Never skip or auto-fill a phase.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL — Rule 8:** At the end, run a web search with PRECISE subject (stack + domain + year).
> **CRITICAL:** Run ONLY the section matching the method chosen in step-01.
> **CRITICAL — Rule 3:** Offer the reflection modes menu after each phase if the user asks.

---

## Goal

Run the brainstorm session using the method chosen in step-01.
Guide the user through each phase interactively. Ask questions, propose ideas,
record decisions. At the end, enrich with a Benchmark Vivant web search.

---

## How to run the session

- One phase at a time. Ask questions, wait for answers.
- Propose options at each phase — never a single direction.
- Record everything the user says. Summarize at the end of each phase.
- If the user is stuck, offer examples or use a technique from step-03.
- Keep the confirmed objective from L'Éclaireur visible throughout.

---

## Session by method

Run only the section matching the chosen method.

---

### METHOD 1 — Design Thinking

**Phase 1 — Empathize**
> Who are your users? What do they struggle with?
> What frustrations do they face today with this project?

Questions to ask:
- "Who uses this project? Can you describe 2-3 types of users?"
- "What is the main pain point they have right now?"
- "What do they try to do but fail at, or find too hard?"

Record: user types + their core frustrations.

**Phase 2 — Define**
> Based on what we just learned, what is THE core problem to solve?

Propose a "How Might We" statement:
```
"How might we help [user type] to [do something] so that [desired outcome]?"
```
Present 2-3 candidate statements. User picks or refines.

Record: confirmed problem statement.

**Phase 3 — Ideate**
> Generate solutions. Quantity over quality at this stage.

Ask: "If anything were possible, what would this look like?"
Propose 5-7 solution directions. User reacts, adds, or removes.
Note: step-03 techniques can be used here for deeper exploration.

Record: list of candidate solutions.

**Phase 4 — Prototype**
> What would the solution look like? Describe it without thinking about code.

Ask: "If a user opened this tomorrow, what would they see and do?"
Help the user describe the experience in plain language (no technical terms).

Record: prototype description.

**Phase 5 — Test**
> How would we validate this works?

Ask: "What's the simplest way to test this with a real user?"
Propose: landing page test, prototype walkthrough, A/B test, early access.

Record: validation approach.

---

### METHOD 2 — Story Mapping

**Phase 1 — Activities**
> What are the big things a user does with this project? (horizontal axis)

Ask: "Walk me through a typical user session, step by step."
Extract 5-8 high-level activities (e.g., Sign up → Browse → Select → Checkout → Review).

Record: activity list.

**Phase 2 — Tasks**
> Under each activity, what specific tasks does the user perform?

For each activity, ask: "What exactly does the user do here?"
Expand into 3-5 tasks per activity.

Record: activity → tasks map.

**Phase 3 — Stories**
> Under each task, what features or changes are needed?

For each task, ask: "What does the system need to support this?"
Assign each feature to a priority tier: Must Have / Should Have / Could Have.

Result: a 2D map — activities across the top, priority from top to bottom.

Record: complete story map with priority tiers.

---

### METHOD 3 — Lean Canvas

Fill each section interactively, one by one.

**1. Problem**
> "What are the top 3 problems your users face?"
List them. Note existing alternatives users use today.

**2. Customer Segments**
> "Who exactly has these problems?"
Define the primary and secondary segments.

**3. Unique Value Proposition**
> "In one sentence, why would someone choose this over everything else?"
Propose 3 options. User selects or writes their own.

**4. Solution**
> "What are the top 3 features that solve the problems?"
Keep it high-level — this feeds the PRD later.

**5. Channels**
> "How do you reach your users? How do they find this project?"
(App stores, social media, word of mouth, SEO, etc.)

**6. Revenue Streams**
> "How does this project make money? Or what value does it create?"
(If non-commercial, describe the value metric instead.)

**7. Cost Structure**
> "What are the main costs to build and run this?"
(Infrastructure, team, tools, licensing.)

**8. Key Metrics**
> "How will you know if this is working?"
Define 3-5 measurable success indicators.

**9. Unfair Advantage**
> "What do you have that cannot be easily copied or bought?"
(Team expertise, existing users, proprietary data, network effect.)

Record: completed Lean Canvas (all 9 sections).

---

### METHOD 4 — Blue Ocean

**Four Actions Framework**

Ask each question in turn. Propose examples for each to help the user think.

**ELIMINATE**
> "What does the industry take for granted that you should completely remove?"
> Example: "Most apps require account creation — could you eliminate that friction?"

**REDUCE**
> "What should be reduced well below the current industry standard?"
> Example: "Most dashboards show 20 metrics — could you reduce to the 3 that matter?"

**RAISE**
> "What should be raised well above the current standard?"
> Example: "Could you offer 10× faster response time than competitors?"

**CREATE**
> "What should you create that the industry has never offered?"
> Example: "What if users could collaborate in real time where no one else allows it?"

After all four: draw the Strategy Canvas.
Compare the current state vs. the proposed Blue Ocean profile on each factor.

Record: Four Actions answers + Strategy Canvas summary.

---

### METHOD 5 — Impact Mapping

Work strictly top-down: Why → Who → How → What.

**WHY — The goal**
> Read the confirmed objective from L'Éclaireur.
Ask: "Is this still the right goal? Would you change or refine it?"

Record: confirmed goal statement.

**WHO — The actors**
> "Who are the people or systems that can help or hinder this goal?"
List: end users, admins, external services, stakeholders, third-party APIs.

Record: actor list.

**HOW — The behaviors**
> For each actor: "What behavior do we want to change or enable?"
> Example: "We want admins to spend less time on manual approval."

Record: actor → desired behavior map.

**WHAT — The features**
> For each behavior: "What features or changes support this behavior?"

Each feature must trace back to a behavior → actor → goal.
Features with no clear trace are candidates for removal.

Record: complete Impact Map (Goal → Actors → Behaviors → Features).

---

### METHOD 6 — SWOT

**STRENGTHS**
> "What does this project do well today?"
> "What advantages does it have over alternatives?"

Ask for 3-5 specific strengths. Not generic ("good team") — concrete ("80% test coverage").

**WEAKNESSES**
> "Where does this project fall short today?"
> "What do users complain about most?"

Ask for 3-5 specific weaknesses.

**OPPORTUNITIES**
> "What external factors could help this project grow?"
> "What trends or market changes are in your favor?"

(This is where the Benchmark Vivant web search is especially useful — run it now.)

**THREATS**
> "What external factors could hurt this project?"
> "Who are the competitors? What regulations might affect you?"

**Cross-analysis:**
After all four quadrants, run the strategic analysis:

| Combination | Strategy |
|------------|---------|
| S + O | Leverage strengths to capture opportunities |
| W + T | Mitigate weaknesses before threats materialize |
| S + T | Use strengths to defend against threats |
| W + O | Improve weaknesses to take advantage of opportunities |

Record: complete SWOT + cross-analysis.

---

### METHOD 7 — Double Diamond

**Diamond 1 — Problem space**

*Discover (diverge):*
> "What's going on? What problems, observations, signals do you see?"
Explore widely. No filtering yet. List everything.
Ask: "What surprises you? What frustrates users most? What do you wish worked differently?"

*Define (converge):*
> "Out of everything we just explored, what is THE problem worth solving?"
Narrow to 1-2 problem statements. User confirms.

**Diamond 2 — Solution space**

*Develop (diverge):*
> "How might we solve this? What are all the possible approaches?"
Generate 5-8 solution directions. No filtering yet.
Note: step-03 techniques can be used here for deeper generation.

*Deliver (converge):*
> "Which approach is most promising? What will we actually build?"
Narrow to 1-2 preferred solutions. User confirms.

Record: problem definition + chosen solution direction.

---

### METHOD 8 — Opportunity Tree

**1. Desired outcome**
> Read the confirmed objective. Refine it into a measurable outcome.
Ask: "What does success look like 6 months from now? In numbers if possible."

Record: outcome statement.

**2. Opportunities**
> "What problems or gaps stand between you and this outcome?"
Brainstorm freely — 8-12 opportunities minimum.

Record: opportunity list.

**3. Solutions**
> For each opportunity: "What solutions could address this?"
Generate 2-4 solutions per opportunity.

Record: opportunity → solutions map.

**4. Experiments**
> For each solution: "What's the cheapest way to test if this works?"
(A landing page, a prototype, a survey, a manual process before automating.)

**Prioritize:**
Score each solution on impact × effort:

| Score | Impact | Effort | Priority |
|-------|--------|--------|---------|
| High | High | Low | Start here |
| Medium | High | High | Plan carefully |
| Low | Low | Low | Optional |
| Skip | Low | High | Drop it |

Record: prioritized opportunity tree.

---

## Benchmark Vivant — Web search

At the end of the session (regardless of method), run targeted searches:

- `"{stack} {version} best practices {year}"` — current standards
- `"{domain} competitors {year}"` — competitive landscape
- `"{stack} {specific_problem} solution {year}"` — if a specific challenge emerged

Present findings as a brief "State of the Art" summary:
> "Here's what the current best practices say about [topic]:..."

Highlight anything that changes or validates a decision made during the session.

---

## Session summary

After completing all phases:

```
Session complete — {method_name}

Key decisions:
- {decision_1}
- {decision_2}
- {decision_3}

State of the art findings:
- {finding_1}
- {finding_2}
```

---

## Reflection modes menu

```
Step 02 complete. Would you like to explore further before continuing?

  REFLECTION MODES
  1. Table Ronde      — Debate session decisions with multiple agents
  2. Prisme           — Analyze decisions from multiple perspectives
  3. Benchmark Vivant — Deeper web research on a specific topic   (done)

  ─────────────────────────────────────────
  S. Save and continue to techniques (step-03)
```

---

## Transition

```
Step 02 complete.

Method used: {method_name}
Key decisions: {summary}
State of the art: {benchmark_summary}

→ Step 03 — I'll now offer 20 brainstorming techniques to deepen
  specific areas where you want more exploration.
```

Update `hk-up-status.yaml`: `4-1-methode-directrice → step-02: done`
Proceed to **step-03-techniques.md**
