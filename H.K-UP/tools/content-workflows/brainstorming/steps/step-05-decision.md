---
step: "05"
name: "Direction Decision"
workflow: brainstorming
agent: stratege
---

# Step 05 — Direction Decision

> **CRITICAL — Rule 1:** The user decides the direction. Le Stratège proposes, never imposes.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL — Rule 10:** Explicit handoff to PRD workflow — announce what is transmitted.
> **CRITICAL:** Save `direction.md` before announcing the handoff.
> **CRITICAL — Rule 4:** Do not hand off without confirming the direction is complete.

---

## Goal

Present the synthesis from step-04. Let the user confirm what to build,
what to defer, and what to drop. Record the confirmed direction.
Hand off explicitly to the PRD workflow.

---

## Phase 1 — Present the synthesis

Summarize `brainstorm-session.md` in a compact, decision-ready format:

```
Here's what we built during this brainstorm:

  MUST BUILD
  ✓ {idea_1}
  ✓ {idea_2}
  ✓ {idea_3}

  SHOULD BUILD
  △ {idea_4}
  △ {idea_5}

  COULD BUILD (if time allows)
  ◇ {idea_6}

  DEFERRED (Won't Have for now)
  × {idea_7} — reason: {why}
  × {idea_8} — reason: {why}

  OBJECTIVE COVERAGE
  All {N} confirmed objectives are addressed.
```

---

## Phase 2 — Direction confirmation

Ask the user to validate or adjust:

```
Based on everything we explored, here's the direction I'd recommend:

  Focus on: {top 2-3 Must Have ideas that form a coherent core}
  Leave out for now: {Could Have + Won't Have}

Does this feel right? Would you change anything?
```

Wait for the user's response. They may:
- Confirm as-is
- Move items between priority tiers
- Add something we missed
- Remove something they changed their mind about

Record all adjustments.

---

## Phase 3 — Direction summary

Once confirmed, write the direction statement in plain language:

```
Confirmed direction for {project_name}:

  "{one or two sentences describing what we're going to build and why}"

  Core scope:
  - {confirmed_must_have_1}
  - {confirmed_must_have_2}
  - {confirmed_must_have_3}

  Out of scope (this version):
  - {deferred_1}
  - {deferred_2}
```

Read it back to the user and ask for final confirmation:
> "Is this the direction you want to commit to? This is what the PRD will be built on."

---

## Save direction.md

Save as `{output_folder}/direction.md`:

```markdown
# Direction — {project_name}

**Date:** {date}
**Objective:** {confirmed_objective}
**Method used:** {method_name}

---

## Confirmed Direction

{direction_statement}

---

## In Scope

| Feature / Idea | Priority | Source |
|----------------|----------|--------|
| {idea_1} | Must Have | {step-02 / technique name} |
| {idea_2} | Must Have | {step-02 / technique name} |
| {idea_3} | Should Have | {step-03 technique} |

---

## Out of Scope (this version)

| Feature / Idea | Reason |
|----------------|--------|
| {idea} | {why deferred} |

---

## Key Decisions

1. {decision_1}
2. {decision_2}
3. {decision_3}

---

## State of the Art Reference

{key findings from benchmark vivant that informed this direction}
```

---

## Reflection modes menu

After direction is confirmed but before handoff:

```
Direction confirmed. Would you like one final exploration before we move to the PRD?

  REFLECTION MODES
  1. Table Ronde   — Final debate with agents on the direction
  2. Prisme        — Last multi-perspective check (Business + Temps)
  3. Conformité    — Legal check before committing to build

  ─────────────────────────────────────────
  S. Save and proceed to PRD
```

**Before executing any mode above, LOAD its data file:**
- Table Ronde → `data/modes/table-ronde.md`
- Prisme → `data/modes/prisme.md` + `data/prisme-facettes.csv`
- Conformité → `data/modes/conformite.md`

---

## Handoff — PRD Workflow

```
Brainstorming complete.

direction.md saved.
brainstorm-session.md saved.

What was decided:
  Method: {method_name}
  Core direction: {direction_summary}
  Must Have items: {count}
  Deferred items: {count}

→ PRD Workflow — Le Stratège

  I'll now write the Product Requirements Document based on everything
  we decided in this session. Each feature from the confirmed direction
  will become a precise requirement in the PRD.

  The PRD is the contract between what you want and what gets built.
  Nothing implicit — everything written.
```

---

## Update status

Update `hk-up-status.yaml`:
- `4-2-creation-synthese → step-05: done`
- `phase-4-brainstorming → status: done`
- `phase-5-prd → status: in-progress`
- `5-1-prd-draft → in-progress`

Proceed to **workflows/prd/workflow.md**
