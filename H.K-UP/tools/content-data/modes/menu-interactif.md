---
type: system-reference
loaded_by: all step files
rule: Rule 3 — Interactive menu between each step
---

# Interactive Menu — System Reference

> **CRITICAL — Rule 3:** At the end of every step, present the relevant reflection modes + "Save and continue".
> **CRITICAL — Rule 1:** The user picks what to explore. Never skip or auto-select modes.
> **CRITICAL:** Each completed mode is marked ✓. Re-show the menu after each mode completes.
> **CRITICAL:** "S. Save and continue" always ends the menu and moves to the next step.

---

## What it is

The interactive menu is the transition layer between every step in every workflow.
It gives the user the opportunity to explore the current deliverable more deeply
before moving forward. It is never skipped — only bypassed by the user choosing S.

This document defines the master rules. Step files implement the menu for their specific context.

---

## Core rules

1. **Always present at end of step** — every step file ends with this menu. Exception: `workflows/dev/steps/step-02-implement.md` and `workflows/review/steps/step-01-check.md` — Le Chirurgien and Le Gardien do not show reflection menus during active coding/review.
2. **Only relevant modes** — not all 7 modes appear every time; the table below defines which modes appear where
3. **User-selected, user-paced** — the user picks one or more modes in any order
4. **Chaining** — after each mode completes, re-show the menu with ✓ on the completed mode
5. **S to exit** — "S. Save and continue" closes the menu and moves to the next step
6. **Mode output persists** — each completed mode appends its output to the current step's deliverable

---

## Menu format

<output-format>
{step_name} complete. Would you like to explore further?

  REFLECTION MODES
  1. {mode_name}     — {short description, max 8 words}    {✓ if completed}
  2. {mode_name}     — {short description, max 8 words}
  [3. ...]

  ─────────────────────────────────────────
  S. Save and continue to {next_step_name}
</output-format>

**Rules for the menu block:**
- Mode names are left-aligned
- Descriptions are separated by em dash (—)
- ✓ appears after the description, right-aligned, only when the mode is done
- "S." line is always last, always separated by a horizontal rule
- Next step name must be specific (not "the next step")

### Example — after brainstorm synthesis

<output-format>
Synthesis complete. Would you like to explore further?

  REFLECTION MODES
  1. Table Ronde     — Final debate with agents on the direction   ✓
  2. Prisme          — Multi-perspective check (Business + Temps)
  3. Conformité      — Legal check before committing to build

  ─────────────────────────────────────────
  S. Save and proceed to Direction Decision
</output-format>

---

## Mode relevance by workflow and step

Only show the modes listed for each step. Do not show all 7 modes every time.

| Workflow | Step | Relevant modes |
|----------|------|----------------|
| **Diagnostic** | After report (step-02) | Prisme (technique, echec), Archéologie |
| **Diagnostic** | After objective (step-03) | Prisme (user, business) |
| **Diagnostic** | After path selection (step-04) | Table Ronde, Conformité, Benchmark Vivant |
| **Brainstorming** | After method selection (step-01) | Table Ronde, Prisme (user) |
| **Brainstorming** | After session (step-02) | Table Ronde, Prisme, Benchmark Vivant |
| **Brainstorming** | After techniques (step-03) | Table Ronde, Prisme |
| **Brainstorming** | After synthesis (step-04) | Table Ronde, Prisme (business, temps), Tribunal, Conformité |
| **Brainstorming** | After direction (step-05) | Table Ronde, Prisme (business, temps), Conformité |
| **PRD** | After gather (step-01) | Prisme (user, business), Benchmark Vivant |
| **PRD** | After draft (step-02) | Table Ronde, Prisme (user, business), Conformité |
| **PRD** | After validation (step-03) | Table Ronde, Conformité |
| **Architecture** | After analysis (step-01) | Prisme (technique, echec), Simulation, Archéologie |
| **Architecture** | After design (step-02) | Table Ronde (with Zero), Simulation |
| **Architecture** | After plan (step-03) | Table Ronde, Simulation (Rollback) |
| **Design** | After audit (step-01) | Prisme (user), Simulation (User Journey) |
| **Design** | After directions (step-02) | Prisme (user), Table Ronde |
| **Design** | After mockups (step-03) | Prisme (user) |
| **Security** | After scan (step-01) | Table Ronde, Prisme (securite), Conformité |
| **Security** | After duel (step-02) | Table Ronde, Prisme (securite, business), Conformité, Simulation (Incident) |
| **Security** | After report (step-03) | Conformité, Table Ronde |
| **Review** | After phase checkup | Table Ronde, Prisme (technique, echec) |

**When in doubt:** Offer Table Ronde + Prisme as the safe default pair.

---

## Mode descriptions for the menu

Use these exact descriptions in the menu:

| Mode | Menu description |
|------|-----------------|
| Table Ronde | Multi-agent debate on this deliverable |
| Prisme | Analyze from multiple perspectives |
| Simulation | Test a decision before committing |
| Archéologie | Trace the code's history and evolution |
| Benchmark Vivant | Compare against current state of the art |
| Tribunal | Judge technical debt, get user verdicts |
| Conformité | Check legal and compliance exposure |

When a mode is suggested with a specific focus, add it in parentheses:
- `Prisme (user)` → description: `Analyze from user perspectives`
- `Prisme (securite)` → description: `Analyze security angles`
- `Simulation (Rollback)` → description: `Simulate a rollback scenario`
- `Table Ronde (with Zero)` → description: `Debate with Zero on alternatives`

---

## After a mode completes

1. Present the mode's output (summary block — see individual mode files)
2. Re-show the full menu with ✓ on the completed mode
3. Wait for user to pick another mode or type S

<output-format>
{mode_name} complete.

[mode output block]

─────────────────────────────────────────
Back to the menu:

  REFLECTION MODES
  1. {mode_1}     — {description}    ✓
  2. {mode_2}     — {description}
  [3. ...]

  ─────────────────────────────────────────
  S. Save and continue to {next_step_name}
</output-format>

---

## Saving mode output

Each completed mode appends a section to the current step's deliverable.
The section format depends on the mode — see the individual mode files.

All sections are placed under a `## Reflection Modes` heading at the bottom of the deliverable:

```markdown
## Reflection Modes

### Table Ronde OUVERTE (validated)
- Participants: L'Architecte, Le Stratège, Zero
- Topic: {topic}
- Key decisions:
  - {decision_1}
  - {decision_2}
- Points of disagreement:
  - {point_1}
- Action items:
  - {action_1}

### Prisme (validated)
- Facettes explored: Performance, Scalability, Pre-mortem
- Key insights:
  | Facette | Key insight |
  |---------|-------------|
  | Performance | {finding} |
  | Scalability | {finding} |
  | Pre-mortem | {finding} |
- Recommended action: {action}
```

---

## When NOT to show the menu

The interactive menu is skipped for exactly 2 step files:
- `workflows/dev/steps/step-02-implement.md` — Le Chirurgien is mid-mission
- `workflows/review/steps/step-01-check.md` — Le Gardien is validating

In all other cases, the menu is mandatory.

---

## Quick implementation guide for step files

Every step file that implements this menu should:

1. End with a `## Reflection modes` section
2. List only the modes from the relevance table above for that step
3. Use the exact menu format from this document
4. Include the `S. Save and continue to {next_step_name}` line
5. Reference this file: `See data/modes/menu-interactif.md for the full system.`

Step files do not re-document how modes work — they only list which modes are available.
The mode logic lives in `data/modes/table-ronde.md`, `data/modes/prisme.md`, and the other mode files.
