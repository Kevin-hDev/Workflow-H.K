---
step: "04"
name: "Synthesis"
workflow: brainstorming
agent: stratege
---

# Step 04 — Synthesis

> **CRITICAL — Rule 4:** The checkup is a BLOCKING gate. Do NOT proceed to step-05 with missing coverage.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** Collect ALL ideas from step-02 AND step-03 before grouping.
> **CRITICAL — Rule 1:** User validates every theme, priority, and grouping decision.
> **CRITICAL:** Save `brainstorm-session.md` before transition.

---

## Goal

Collect every idea from the session. Group by theme. Prioritize using MoSCoW.
Run a coverage checkup against the confirmed objective.
Fix any gaps before moving to the decision step.

---

## Phase 1 — Collect all ideas

Gather everything produced in step-02 and step-03:
- Decisions from each method phase
- Ideas generated during techniques
- Benchmark Vivant findings (state of the art)
- Risk items (pre-mortem, chaos monkey, SWOT threats)

List them all before grouping. Do not discard anything at this stage.

---

## Phase 2 — Group by theme

Themes emerge from the ideas themselves — do not force predefined categories.
Typical themes (examples — adapt to the actual project):

- User Experience (UX) — how it feels to use
- Core Features — what it does
- Architecture & Performance — how it's built
- Security & Privacy — how it protects
- Business & Growth — how it creates value
- Technical Debt & Modernization — what needs fixing
- Future / Deferred — interesting but not now

Group every idea under the most fitting theme.
Present the grouped list to the user for validation:

> "Here's how I grouped the ideas. Do you want to rename a theme, move an idea, or merge groups?"

---

## Phase 3 — Prioritize (MoSCoW)

For each idea within its theme, assign a MoSCoW priority:

| Priority | Meaning |
|----------|---------|
| **Must Have** | Non-negotiable. The project fails without it. |
| **Should Have** | Important but not blocking for launch. |
| **Could Have** | Nice to have if effort is low. |
| **Won't Have** | Out of scope for now. Documented and deferred. |

Le Stratège proposes initial priorities based on the session context.
User validates or overrides each one.

Present the result:

```
SYNTHESIS — {project_name}

Theme: {theme_name}
  ✓  {idea}  —  Must Have
  ✓  {idea}  —  Should Have
  △  {idea}  —  Could Have
  ×  {idea}  —  Won't Have (deferred)

Theme: {theme_name}
  ✓  {idea}  —  Must Have
  ...
```

---

## Phase 4 — Objective coverage checkup

Compare the synthesis against the confirmed objective(s) from L'Éclaireur.
This is a BLOCKING gate — proceed only when all objectives show "OK".

```
Checkup — Synthesis vs. Confirmed Objective

  Objective                     Covered by                  Status
  ─────────────────────────── ─ ─────────────────────────── ─ ─────────
  {objective_1}                 {theme + idea references}    ✓ OK
  {objective_2}                 {theme + idea references}    ✓ OK
  {objective_3}                 —                            ✗ MISSING
```

**If anything is MISSING:**
> "Your objective '{objective}' isn't covered yet.
> Let's fix that before we move on.
> Here are 2-3 ideas that would address it: ..."

Propose ideas. User selects. Add to the synthesis. Re-run checkup.
Repeat until all objectives show ✓ OK.

---

## Save brainstorm-session.md

Once the checkup passes, save the full synthesis as:
`{output_folder}/brainstorm-session.md`

File structure:

```markdown
# Brainstorm Session — {project_name}

**Date:** {date}
**Objective:** {confirmed_objective}
**Method used:** {method_name}
**Techniques applied:** {list}

---

## Synthesis

### {Theme 1}
- {idea} — Must Have
- {idea} — Should Have

### {Theme 2}
- {idea} — Must Have
- {idea} — Could Have

---

## Won't Have (deferred)
- {idea} — reason: {why deferred}

---

## State of the Art
{benchmark vivant summary from step-02}

---

## Key Decisions
{3-5 most important decisions made during the session}
```

---

## Reflection modes menu

```
Step 04 complete. Would you like to explore further before deciding?

  REFLECTION MODES
  1. Table Ronde      — Debate priorities with multiple agents
  2. Prisme           — Analyze the synthesis from multiple perspectives
  3. Tribunal         — Review if existing code impacts any priorities
  4. Conformité       — Check legal implications of proposed ideas

  ─────────────────────────────────────────
  S. Save and continue to decision (step-05)
```

**Before executing any mode above, LOAD its data file:**
- Table Ronde → `data/modes/table-ronde.md`
- Prisme → `data/modes/prisme.md` + `data/prisme-facettes.csv`
- Tribunal → `data/modes/tribunal.md`
- Conformité → `data/modes/conformite.md`

---

## Transition

```
Step 04 complete.

brainstorm-session.md saved.
Objective coverage: {N}/{N} — all confirmed objectives are covered.

Ideas summary:
  Must Have: {count}
  Should Have: {count}
  Could Have: {count}
  Won't Have: {count}

→ Step 05 — You'll now confirm the direction we'll take into the PRD.
```

Update `hk-up-status.yaml`: `4-2-creation-synthese → step-04: done`
Proceed to **step-05-decision.md**
