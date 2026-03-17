---
mode: prisme
type: reflection-mode
loaded_by: agents, step files
source_data: data/prisme-facettes.csv
---

# Prisme — Multi-Facette Analysis Mode

> **CRITICAL — Rule 1:** The user selects which facettes to explore. The agent never auto-selects all.
> **CRITICAL:** One facette at a time. Present question → analyze → key insight → user responds.
> **CRITICAL:** The user can skip, challenge, or end at any facette. Never force completion.

---

## What it is

The Prisme lets **one agent** analyze a topic through multiple lenses, one at a time.
Unlike the Table Ronde (multiple agents, one topic), the Prisme is a single agent exploring
multiple perspectives in sequence.

The facettes come from `data/prisme-facettes.csv`.
The user selects which families or individual facettes to explore.

---

## The 7 Families

**31 facettes total across 7 families.**

```
USER — See through different user eyes
  End User | Admin | Newcomer | Power User | Frustrated User

TECHNIQUE — Analyze technical qualities
  Performance | Scalability | Maintainability | Testability | Portability

BUSINESS — Assess business impact
  Cost | Time-to-market | ROI | Business risk | Competition

SECURITE — Evaluate security angles
  External attacker | Insider | Compliance | Privacy | Supply chain

TEMPS — Consider time horizons
  Short term (1-3 months) | Medium term (6 months) | Long term (2 years) | Legacy

ECHEC — Anticipate failures
  Pre-mortem | Worst case | Domino effect | Point of no return

INVERSION — Think backwards
  Anti-brainstorm | Remove constraints | Competitor view
```

---

## Facette reference

All questions sourced from `data/prisme-facettes.csv`:

| ID | Facette | Family | Question |
|----|---------|--------|----------|
| 1 | End User | user | How would an average user experience this? |
| 2 | Admin | user | What administration tools are missing or poorly designed? |
| 3 | Newcomer | user | Is the onboarding intuitive without external help? |
| 4 | Power User | user | What advanced features are missing or too slow? |
| 5 | Frustrated User | user | Which friction points are unbearable over time? |
| 6 | Performance | technique | Does the system remain smooth under real load? |
| 7 | Scalability | technique | What happens with 10x or 100x the current users? |
| 8 | Maintainability | technique | Can a new dev understand and modify it in under an hour? |
| 9 | Testability | technique | Can each module be tested without depending on others? |
| 10 | Portability | technique | Can the project run on another cloud or OS without a redesign? |
| 11 | Cost | business | Is this technical choice too expensive to operate? |
| 12 | Time-to-market | business | How long to deliver the next critical feature? |
| 13 | ROI | business | Does the invested effort produce measurable value? |
| 14 | Business risk | business | What external events could make this project obsolete? |
| 15 | Competition | business | Are competitors doing better? On which points exactly? |
| 16 | External attacker | securite | What attack surfaces are accessible from the outside? |
| 17 | Insider | securite | Can a dishonest employee extract or corrupt data? |
| 18 | Compliance | securite | GDPR, PCI-DSS, HIPAA: which obligations are not met? |
| 19 | Privacy | securite | Are we collecting more data than necessary? |
| 20 | Supply chain | securite | Would a compromised dependency impact the system? |
| 21 | Short term | temps | Does this decision create short-term debt? |
| 22 | Medium term | temps | Will the architecture hold with 2x growth? |
| 23 | Long term | temps | Will this choice still be relevant in 2 years? |
| 24 | Legacy | temps | If we start from scratch tomorrow, what is worth keeping? |
| 25 | Pre-mortem | echec | It failed in 6 months. Why? |
| 26 | Worst case | echec | What sequence of events would lead to the worst outcome? |
| 27 | Domino effect | echec | If this component goes down, what goes down with it? |
| 28 | Point of no return | echec | What decision made today would be impossible to undo tomorrow? |
| 29 | Anti-brainstorm | inversion | How could we deliberately sabotage this project? |
| 30 | Remove constraints | inversion | If the budget were unlimited, what would we do differently? |
| 31 | Competitor view | inversion | How would a competitor exploit our current weaknesses? |

---

## How to run a Prisme session

### Step 1 — Present the selection menu

```
Which Prisme families would you like to explore?

  USER — See through different user eyes
    End User | Admin | Newcomer | Power User | Frustrated User

  TECHNIQUE — Analyze technical qualities
    Performance | Scalability | Maintainability | Testability | Portability

  BUSINESS — Assess business impact
    Cost | Time-to-market | ROI | Business risk | Competition

  SECURITE — Evaluate security angles
    External attacker | Insider | Compliance | Privacy | Supply chain

  TEMPS — Consider time horizons
    Short term (1-3 months) | Medium term (6 months) | Long term (2 years) | Legacy

  ECHEC — Anticipate failures
    Pre-mortem | Worst case | Domino effect | Point of no return

  INVERSION — Think backwards
    Anti-brainstorm | Remove constraints | Competitor view

  Choose families (e.g., user, technique) or specific facettes (e.g., End User, Performance):
```

**Selection options:**
- Full family: `user` → runs all 5 user facettes
- Multiple families: `user, echec` → runs all 9 facettes in sequence
- Specific facettes: `End User, Performance, Pre-mortem` → runs only those 3
- Everything: `all` → runs all 31 facettes (warn the user this is extensive)

### Step 2 — Run each facette

For each selected facette, present this block:

```
PRISME — {facette_name} ({family})

Question: {question from prisme-facettes.csv}

Analysis:
{Agent's analysis from this perspective — 4 to 8 sentences}
{Be specific to the actual topic being analyzed, not generic}
{Reference concrete elements from the project/decision when possible}

Key insight: {one-sentence takeaway — the most actionable finding}
```

After presenting the block:
- Wait for user response (they may agree, challenge, ask follow-up, or skip)
- Discuss if the user engages
- Then proceed to the next facette

### Step 3 — Between facettes

After each facette discussion, ask:
```
Continue to {next_facette_name}? (or type 'done' to close the Prisme)
```

The user can stop at any point. Never auto-continue through all facettes without checking.

### Step 4 — Prisme summary

After the last selected facette (or when user says done):

```
PRISME SUMMARY

  Facettes explored: {count}
  {facette_1}: {one-line finding}
  {facette_2}: {one-line finding}
  ...

  Cross-cutting insight: {if applicable — a pattern that emerged across multiple facettes}
  Recommended next action: {based on the most critical finding}
```

---

## Suggested families by step context

Step files may suggest which families are most relevant. Always respect those suggestions as defaults — but the user can override.

| Context | Suggested families |
|---------|-------------------|
| After diagnostic scan | technique, echec |
| After objective setting | user, business |
| After brainstorm synthesis | business, temps |
| After PRD draft | user, business, conformité |
| After architecture design | technique, echec |
| After design audit | user |
| After security scan | securite |
| Before delivery | business, temps |

---

## Saving output

Each Prisme session is appended to the current step's deliverable:

```markdown
### Prisme (validated)

- Facettes explored: {count}
- Families: {list}

| Facette | Family | Key insight |
|---------|--------|-------------|
| {facette_1} | {family} | {one-line finding} |
| {facette_2} | {family} | {one-line finding} |

**Cross-cutting insight:** {if applicable}
**Recommended action:** {most critical finding → action}
```
