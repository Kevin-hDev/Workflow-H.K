---
step: "02"
name: "Design"
workflow: architecture
agent: architecte
---

# Step 02 — Design

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** ALWAYS propose 2-3 options. Never present a single approach as the only one.
> **CRITICAL:** Big bang migration is NEVER recommended. Strangler fig is the default.
> **CRITICAL — Rule 4:** The PRD checkup at the end of this step is BLOCKING. 100% Must Have coverage required.
> **CRITICAL — Rule 1:** User chooses the approach. L'Architecte never decides alone.

---

## Goal

Based on the analysis from step-01, propose 2-3 architectural approaches with trade-offs.
User chooses. L'Architecte details the chosen approach with Architecture Decision Records (ADRs).
A blocking checkup verifies 100% coverage of PRD Must Have features.
Save as `{output_folder}/architecture.md`.

---

## Phase 1 — Propose approaches

Always propose 2-3 options. Never present a single approach.

For each approach, use this format:

```
APPROACH {N} — {Name}

Description:
  {What changes, what stays the same. Be specific about modules/layers affected.}

Migration strategy: {Strangler Fig | Parallel Run | Phased Replacement}
  {Brief explanation of how the migration would proceed step by step}

Pros:
  + {concrete advantage — reference specific PRD features or codebase constraints}
  + {concrete advantage}

Cons:
  - {concrete trade-off — be honest about what this approach sacrifices}
  - {concrete trade-off}

Effort: Low | Medium | High
  {Justification: how many modules touched, what level of refactoring}

Risk: Low | Medium | High
  {Justification: what could go wrong, how reversible is this}
```

**Migration strategy guidance:**
- **Strangler Fig** (default) — new code wraps or replaces old code piece by piece.
  Old system stays running. No big bang. Recommended whenever possible.
- **Parallel Run** — new implementation runs alongside the old one. Switch when stable.
  Use when: you can't do an incremental strangler fig (e.g., schema migration).
- **Phased Replacement** — replace module by module in a defined sequence.
  Use when: modules are loosely coupled and can be replaced independently.
- **Big bang** — full replacement at once. NEVER recommend this. Flag it as high risk
  if the user suggests it.

**Typical set of approaches to consider:**

| Scenario | Approach A | Approach B | Approach C |
|----------|-----------|-----------|-----------|
| Adding a new layer | Thin service layer | Full service layer | Event-driven |
| Restructuring modules | Feature-based grouping | Domain-driven | Hybrid |
| Replacing a component | Strangler fig | Parallel run | Adapt in place |
| Scaling a data model | Add tables | Normalize | CQRS |

Tailor to the actual project. Do not use generic options — reference the specific gaps from step-01.

---

## Phase 2 — User chooses

Present the options and ask:

```
Here are {N} approaches for this architecture:

{Approach 1 summary}
{Approach 2 summary}
{Approach 3 summary}

My recommendation: Approach {N} — {brief reason tied to the project's specific context}

Which approach do you want to go with?
(or: "Let's discuss before deciding" → Table Ronde mode)
```

Wait for user choice before proceeding to Phase 3.

---

## Phase 3 — Architecture Decision Records

For each major architectural decision in the chosen approach, write an ADR.
Typically 3-5 decisions for Standard/Full. 1-2 for Express.

```markdown
## Architecture Decision Record — {N}

### Decision: {decision_title}

- **Status:** Proposed
- **Context:** {why this decision is needed — reference specific PRD features or codebase gaps}
- **Options considered:**
  1. {option_1} — {one-line pros/cons summary}
  2. {option_2} — {one-line pros/cons summary}
  3. {option_3} — {one-line pros/cons summary}
- **Decision:** {chosen option}
- **Justification:** {specific reasons — cost, risk, maintainability, project constraint.
  "Because it's clean" is not a justification.}
- **Consequences:** {what this means for the rest of the system — what becomes easier,
  what becomes harder, what is no longer possible}
- **Migration path:** {how to get from current state to this decision — step by step}
```

Present each ADR to the user. Adjust if they challenge the justification.

**What warrants an ADR?** Decisions that:
- Change the module/layer structure
- Introduce a new dependency or pattern
- Affect how Le Chirurgien will write code for multiple missions
- Have non-obvious trade-offs that future contributors should understand

**What does NOT need an ADR?**
- File naming choices
- Minor refactors within a single module
- Decisions with no trade-offs (obvious choices)

---

## Phase 4 — Architecture summary

After all ADRs, write a concise architecture summary:

```markdown
## Architecture Summary

### Final Structure
{Describe the target architecture — what the key modules/layers will look like after implementation}

  Example:
  src/
    features/          ← Feature-based grouping (replacing flat structure)
      auth/            ← Authentication feature (extracted from routes/auth.js)
      dashboard/       ← Dashboard feature (new)
      reports/         ← Reports feature (new)
    shared/            ← Shared utilities, hooks, types
    api/               ← API layer (thin controllers only — logic moves to features/)
    db/                ← Database models and migrations

### Key Changes
  - {Change 1}: {from what → to what, why}
  - {Change 2}: {from what → to what, why}

### What Stays the Same
  - {Module or pattern preserved — explain why it's good as-is}

### Migration Sequence
  {High-level order: which changes come first, which unlock the next ones}
  Phase 1: {foundational changes}
  Phase 2: {depends on Phase 1}
  Phase 3: {final state}
```

---

## Phase 5 — Blocking checkup: architecture vs PRD

**This checkup is a blocking gate.** The workflow does not continue to step-03 until
coverage reaches 100% of Must Have features.

Use this format:

```
Checkup Architecture vs PRD

  Feature                          Covered by Architecture?
  ──────────────────────────────   ─────────────────────────
  F1 — {Must Have feature name}    ✓ (ADR-2: service layer handles this)
  F2 — {Must Have feature name}    ✓ (ADR-1: feature-based structure enables this)
  F3 — {Must Have feature name}    ✗ MISSING — not addressed in any ADR

  Result: {N}/{total} Must Have features covered

  → {If 100%}: All Must Have features are covered. Proceeding to step-03.
  → {If <100%}: F3 must be addressed before continuing. Adding ADR-{N}.
```

If anything is missing, write the missing ADR(s) before proceeding.
Do not move to step-03 with uncovered Must Have features.

---

## Save architecture.md

Once all ADRs are written, the summary is confirmed, and the checkup passes:

Save as `{output_folder}/architecture.md`:

```markdown
---
version: "1.0"
date: {date}
agent: L'Architecte
status: validated
path: {Express | Standard | Full}
---

# Architecture — {project_name}

## Selected Approach
{Name and one-paragraph description of the chosen approach}

{All ADRs — complete, in order}

{Architecture Summary}

## Checkup Result
All {N} Must Have features covered. ✓
```

---

## Reflection modes menu

```
Architecture designed and checked. Want to stress-test before breaking it down?

  REFLECTION MODES
  1. Table Ronde  — Debate the architecture with Zero (challenge the ADRs)
  2. Simulation   — Stress Test: "What if the user base grows 10x?"
                  — Migration Dry Run: simulate the migration step by step

  ─────────────────────────────────────────
  S. Save and move to mission breakdown (step-03)
```

**Before executing any mode above, LOAD its data file:**
- Table Ronde → `data/modes/table-ronde.md`
- Simulation → `data/modes/simulation.md`

---

## Transition

```
Step 02 complete.

architecture.md saved.
ADRs written: {count}
Must Have features covered: {count}/{total} ✓
Architecture approach: {approach name}
Migration strategy: {strategy name}

→ Step 03 — I'll now break down the work into Quests and Missions.
  Each Mission will have 2-3 tasks max, with explicit dependencies.
```

Update `hk-up-status.yaml`: `6-1-conception → step-02: done`
Proceed to **step-03-plan.md**
