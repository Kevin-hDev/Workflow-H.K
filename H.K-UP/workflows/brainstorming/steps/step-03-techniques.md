---
step: "03"
name: "Brainstorming Techniques"
workflow: brainstorming
agent: stratege
---

# Step 03 — Brainstorming Techniques

> **CRITICAL — Rule 1:** This step is OPTIONAL. If the user says "skip", go straight to step-04.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** Techniques are chainable — re-show the menu after each one with ✓ marks.
> **CRITICAL:** Each technique must be RUN interactively, not just mentioned.
> **CRITICAL — Rule 3:** After all chosen techniques, offer the reflection modes menu.

---

## Goal

Deepen specific areas of the brainstorm using targeted techniques.
The user picks one or more techniques, runs them, and accumulates additional insights
before synthesis in step-04.

---

⛔ STOP CHECK
- data/brainstorm-techniques.csv READ (not just listed)? [YES/NO]
- Session results from step-02 in memory? [YES/NO]
- Ready to proceed? [YES/NO]

⛔ STOP CONDITION: If any check = NO → Go back and READ the file contents before continuing.

---

## Techniques menu

Present this menu:

```
Want to explore deeper? Choose one or more techniques:

  FIND DIRECTION
  1. SCAMPER            — 7 questions: Substitute, Combine, Adapt, Modify, Reuse, Eliminate, Reverse
  2. What If            — Explore possibilities without limits
  3. First Principles   — Remove all assumptions, start from zero
  4. Cross-Pollination  — Draw inspiration from other domains

  UNDERSTAND USERS
  5. Focus Group        — Simulate 4-5 user types reacting to your ideas
  6. Jobs to Be Done    — "When [situation], I want [action], so that [result]"
  7. Customer Support   — Simulate an angry user + a support agent

  CHALLENGE & DEBATE
  8. Six Thinking Hats  — 6 perspectives: Facts, Emotions, Risks, Benefits, Creativity, Process
  9. Debate Club        — Two opposing positions, a moderator decides
  10. Socratic Questioning — Questions that reveal blind spots
  11. Shark Tank         — Pitch the idea, agents stress-test it

  ANTICIPATE RISKS
  12. Pre-mortem        — "It failed in 6 months. Why?"
  13. Five Whys         — Ask "why" 5 times to find the root cause
  14. Chaos Monkey      — Break things deliberately to test resilience

  CREATE SOMETHING NEW
  15. Blue Sky          — Ideal vision without constraints, then come back to reality
  16. Competitor Teardown — Analyze competition, find the gaps
  17. User Wishlist     — "3 magic wishes from your users?"
  18. Tech Radar        — Emerging technologies = new possibilities
  19. Concept Blending  — Fuse 2 existing ideas into something new
  20. Dream Mockup      — Describe the dream version BEFORE thinking about code

  ─────────────────────────────────────────
  Choose one or more numbers (e.g. 5, 12, 15), or S to skip:
```

---

## How to run each technique

Run ONLY the techniques the user selects. After each one, briefly summarize
what was discovered, then re-show the menu with a ✓ next to completed techniques.

---

### 1 — SCAMPER

Apply the 7 SCAMPER questions to the project/idea from step-02.
Ask each question one at a time and wait for the user's answer before continuing.

```
S — Substitute: What could we replace in this project? (technology, process, material)
C — Combine: What two elements could we merge to create something better?
A — Adapt: What from another product or domain could we adapt here?
M — Modify: What could we change? (size, shape, speed, format)
P — Put to other use: What else could this be used for?
E — Eliminate: What could we remove entirely and still deliver value?
R — Reverse: What if we reversed the flow, the role, or the logic?
```

After all 7: "Here's what SCAMPER revealed: {summary of notable answers}"

---

### 2 — What If

Propose 5 "What If" scenarios based on the project. Let the user react to each.

Generate scenarios relevant to the context. Examples of the form to follow:
- "What if this project had to work with zero internet connection?"
- "What if your primary user was a 65-year-old non-tech-savvy person?"
- "What if the project had to be free forever — no revenue model at all?"
- "What if you had to ship in 2 weeks — what would you cut?"
- "What if a competitor copied your entire idea tomorrow — what's your advantage?"

For each scenario: discuss implications. No right or wrong answers.

After all: "What If revealed these possibilities: {key insights}"

---

### 3 — First Principles

Break the project down to its foundational assumptions, then rebuild from zero.

Step 1 — List assumptions:
> "What do you assume must be true about this project?"
Collect 5-8 assumptions (e.g., "users need an account", "this must be a mobile app").

Step 2 — Challenge each one:
> "What if this assumption were completely wrong?"
For each assumption: discuss what the project would look like without it.

Step 3 — Rebuild:
> "Starting from scratch with only the core goal, what would you build?"
Co-construct a fresh vision without the constraints of the original assumptions.

After all: "First Principles revealed: {what changed when we removed assumptions}"

---

### 4 — Cross-Pollination

Find inspiration from 3 industries or domains that solve a similar problem differently.

Step 1 — Name 3 domains:
Le Stratège proposes 3 relevant analogous domains based on the project type.
Examples: gaming (engagement), banking (trust + security), healthcare (simplicity for non-tech users).

Step 2 — For each domain:
> "How does {domain} handle {the core problem of the project}?"
Discuss the approach. Extract the transferable principle.

Step 3 — Apply:
> "Could we borrow this principle? What would it look like in our context?"

After all 3 domains: "Cross-Pollination insight: {transferable principle + proposed application}"

---

### 5 — Focus Group

Simulate 4-5 distinct user personas reacting to the direction from step-02.

Le Stratège plays each persona in turn. For each:
1. Introduce the persona (name, role, tech comfort, main goal)
2. Show them the proposed direction
3. Voice their reaction: excitement, frustration, confusion, request

Example personas (adapt to the actual project):
- The Power User — expert, wants speed and control
- The Newcomer — first time, needs clarity and guidance
- The Admin — manages others, needs visibility
- The Reluctant User — doesn't want to be there, needs minimal friction
- The Mobile-only User — no desktop, needs everything to work on small screen

After all personas: "Focus Group revealed: {patterns in reactions, top friction points}"

---

### 6 — Jobs to Be Done

Co-write 3-5 JTBD statements based on the real user needs identified so far.

Format:
```
When [situation],
I want to [motivation/action],
so that [desired outcome].
```

Le Stratège proposes the first one based on step-02 data. User reacts and refines.
Repeat for 3-5 statements.

Ask: "Does this statement capture a real moment in a user's life? Or is it too generic?"
Push toward specific, observable situations — not abstract goals.

After all: "JTBD revealed: {the 3-5 statements, the most important one highlighted}"

---

### 7 — Customer Support

Roleplay a support call to stress-test the user experience.

Le Stratège plays: an angry user who just encountered a major problem.
User plays: the support agent trying to help.

After 2-3 exchanges, pause and analyze:
> "What did this reveal? What was the root cause of the user's frustration?
> Could this have been prevented by design?"

Run 2-3 different scenarios (different user problems, different failure modes).

After all: "Customer Support revealed: {top UX risks and design gaps}"

---

### 8 — Six Thinking Hats

Analyze the proposed direction through 6 distinct perspectives, one at a time.

```
White Hat — Facts only: What do we know for certain? What data do we have?
Red Hat   — Emotions: What does your gut say? What worries you?
Black Hat — Risks: What could go wrong? What are the dangers?
Yellow Hat — Benefits: What's genuinely good about this direction?
Green Hat — Creativity: What new ideas does this spark?
Blue Hat  — Process: How should we organize all of this?
```

For each hat: Le Stratège asks the framing question, user responds, Le Stratège adds.
Move through all 6 hats in order.

After all 6: "Six Hats synthesis: {key insight from each hat, overall balance}"

---

### 9 — Debate Club

Two opposing positions are argued and a decision is made.

Le Stratège sets up the debate:
> "Let's debate: {Position A} vs. {Position B}"
Example: "Build the MVP now with limited features" vs. "Wait and build the full product right"

Le Stratège argues both sides with equal conviction.
User acts as moderator — they can ask questions, push back, and ultimately decide.

After the debate:
> "You've heard both sides. What's your verdict?"
Record the decision and why.

After: "Debate Club outcome: {winning position, key arguments that decided it}"

---

### 10 — Socratic Questioning

Le Stratège asks increasingly deep questions to surface assumptions and blind spots.

Start with the stated direction from step-02, then drill down with 5-7 questions:

- "Why does this matter to your users?"
- "What makes you believe that's true?"
- "What would have to be true for this to fail?"
- "Is there any evidence that contradicts this?"
- "What are you not seeing because you're too close to it?"
- "If you're wrong about this, what's the cost?"
- "What would a skeptic say right now?"

Don't rush. Wait for full answers before the next question.

After: "Socratic Questioning revealed: {the core assumption challenged, the insight gained}"

---

### 11 — Shark Tank

User pitches the direction from step-02. Le Stratège plays skeptical investors.

User has 3 minutes (or ~5 sentences) to pitch:
- What the project does
- Who it's for
- Why now
- Why it will succeed

Le Stratège fires back with tough questions:
- "What's your moat? Why can't a bigger player copy this?"
- "Who else has tried this and failed? Why are you different?"
- "What's your worst-case scenario? How long can you survive it?"
- "Why would a user switch from what they're using now?"
- "What does success look like in 12 months — in numbers?"

After the Q&A:
> "Based on what I heard, I'd {invest / pass} because {reason}. Here's what you need to strengthen: ..."

After: "Shark Tank revealed: {weakest points in the case, what needs reinforcement}"

---

### 12 — Pre-mortem

Imagine the project has failed 6 months from now. Diagnose why.

Step 1 — Set the scene:
> "It's 6 months from now. The project launched but failed. Users left, the team is demoralized.
> What happened?"

Step 2 — Brainstorm failure causes (no filtering — list everything):
- Technical failures
- Wrong assumptions about users
- Timing (too early / too late)
- Competitive response
- Internal execution issues

Step 3 — Prioritize top 3 causes by likelihood × impact.

Step 4 — Mitigation:
> "For each top cause: what could we do NOW to prevent it?"

After: "Pre-mortem revealed: {top 3 risks + mitigation actions}"

---

### 13 — Five Whys

Pick one specific problem or risk identified in step-02. Ask "why" 5 times.

Le Stratège guides:
- "Why does this problem exist?" → [answer]
- "Why is that?" → [answer]
- "Why is that?" → [answer]
- "Why is that?" → [answer]
- "Why is that?" → [root cause]

At the 5th why, a root cause should be visible.
Propose a solution that addresses the ROOT cause, not the symptom.

Run on 2 different problems if time allows.

After: "Five Whys revealed: {root causes found, proposed solutions}"

---

### 14 — Chaos Monkey

Deliberately break things to test resilience.

Name 3 things that could go wrong in the proposed system:
1. Infrastructure failure (server down, API timeout, database error)
2. User behavior failure (unexpected input, edge case, misuse)
3. External dependency failure (third-party service changes, API deprecation)

For each:
> "If this broke right now, what would happen to the user?
> How would we detect it? How would we recover?"

Score resilience: High / Medium / Low for each.
Propose design changes where resilience is Low.

After: "Chaos Monkey revealed: {top fragility points, hardening recommendations}"

---

### 15 — Blue Sky

No constraints. Describe the ideal version of the project, then come back to reality.

Step 1 — Remove all constraints:
> "Forget budget, time, team size, and technology.
> What would the perfect version of this project look like?
> Describe it as if anything were possible."

Let the user dream freely. Record everything.

Step 2 — Reality check:
> "Now let's bring it back to reality.
> Which parts of this vision are actually achievable in the first version?
> What's worth fighting for? What can wait?"

Step 3 — Distill:
Extract the 2-3 "Blue Sky" ideas that are ambitious but not impossible.

After: "Blue Sky revealed: {the bold vision, the 2-3 ideas worth keeping}"

---

### 16 — Competitor Teardown

Analyze existing competitors to find gaps and opportunities.

Step 1 — Web search:
Run: `"{domain} competitors {year}"` and `"best {domain} apps {year}"`

Step 2 — Pick 3-4 competitors (or reference products) from the results.

Step 3 — For each competitor, analyze:
- What they do well
- What users complain about (look for patterns in reviews)
- What they DON'T offer

Step 4 — Find the gap:
> "Where is the unmet need? What do users want that no one is giving them?"

After: "Competitor Teardown revealed: {key gaps, differentiation opportunity}"

---

### 17 — User Wishlist

If your users could make 3 magic wishes about this project, what would they be?

Le Stratège plays 3 user personas (from the project context) and voices their wishes.
Each wish is specific and in the user's voice — not a feature request, but a desire.

Examples of the form:
- "I wish I didn't have to log in every time I open the app."
- "I wish it just told me what to do instead of showing me 10 options."
- "I wish my team could see my progress without me having to report it."

After the 3 personas: user reacts and adds their own interpretation.

After: "User Wishlist revealed: {the 3 core desires, design implications}"

---

### 18 — Tech Radar

Explore emerging technologies that could be applied to the project.

Step 1 — Web search:
Run: `"{stack} emerging tools {year}"` and `"new {domain} technology {year}"`

Step 2 — Organize findings into 4 rings (classic Tech Radar format):

| Ring | Meaning |
|------|---------|
| Adopt | Proven, should use now |
| Trial | Worth trying on this project |
| Assess | Interesting, monitor |
| Hold | Avoid for now |

Step 3 — For each relevant technology:
> "Could this change how we build or deliver this project? What's the opportunity?"

After: "Tech Radar revealed: {top 2-3 technologies worth adopting or trialing}"

---

### 19 — Concept Blending

Pick 2 concepts from the session and fuse them into something new.

Step 1 — List 5-6 key ideas that came up in step-02 and step-03.
Step 2 — Le Stratège proposes 2 combinations:
> "What if we combined {concept A} with {concept B}?"
Describe what the fusion would look like in practice.

Step 3 — User reacts and refines.
Try a second combination.

Goal: find unexpected synthesis that neither concept could achieve alone.

After: "Concept Blending revealed: {the fusion idea and its unique value}"

---

### 20 — Dream Mockup

Describe the perfect version of the project in plain language — no code, no tech.

Le Stratège guides the description:
> "Walk me through the first 3 minutes a new user spends in this project.
> What do they see? What do they do? What do they feel?"

Follow-up:
> "What's the single screen or moment that would make them say 'wow'?"
> "What would make them come back tomorrow?"

Record the description in non-technical language.
This becomes a reference point for the PRD and design phases.

After: "Dream Mockup revealed: {the key experience moments, the 'wow' factor}"

---

## After all chosen techniques

Re-show the menu with ✓ marks on completed techniques.
When user selects S:

```
Techniques session complete.

Techniques used: {list with ✓}
Key additional insights:
- {insight_1}
- {insight_2}
- {insight_3}
```

---

## Reflection modes menu

```
Technique session done. Would you like to explore further?

  REFLECTION MODES
  1. Table Ronde   — Debate technique findings with multiple agents
  2. Prisme        — Multi-perspective analysis of what emerged

  ─────────────────────────────────────────
  S. Save and continue to synthesis (step-04)
```

---

## Transition

```
Step 03 complete.

Techniques applied: {list}
Additional ideas collected: {count}

→ Step 04 — I'll now organize all ideas into a structured synthesis
  and check coverage against your objective.
```

Update `hk-up-status.yaml`: `4-2-creation-synthese → step-03: done`
Proceed to **step-04-synthesis.md**
