---
step: "03"
name: "Plan"
workflow: architecture
agent: architecte
---

# Step 03 — Plan

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL — Rule 6:** 2-3 tasks per Mission MAX. If a Mission exceeds 3 tasks, split it immediately.
> **CRITICAL:** Dependencies must be explicit — every Mission knows what it depends on.
> **CRITICAL — Rule 1:** Present the full plan to the user and wait for confirmation before saving.

---

## Goal

Turn the validated architecture into an executable plan. Group changes into Quests (thematic
blocks). Break each Quest into Missions of 2-3 tasks MAX. Map dependencies. Save the plan as
`{output_folder}/plan.md`. Mission briefs will be generated separately via /hkup-create-mission.

---

## Phase 1 — Identify Quests

Group the architectural changes from `architecture.md` into coherent thematic blocks.
Each Quest = a large area of work that can be described in one sentence.

**Typical Quests by project type:**

| Type of change | Example Quest name |
|----------------|-------------------|
| Structural changes | "Quest 1 — Restructure module layout" |
| Infrastructure | "Quest 2 — Set up new layers / database schema" |
| Feature group | "Quest 3 — Implement {feature_area}" |
| Integration | "Quest 4 — Connect external services" |
| Polish | "Quest 5 — Tests, error handling, documentation" |

Quests should be ordered so that foundational changes come first and dependent features come after.
The sequence must be buildable — Le Chirurgien should never be blocked waiting for a dependency.

---

## Phase 2 — Decompose each Quest into Missions

For each Quest, list Missions of **2-3 tasks MAX**.

**The 2-3 task rule is non-negotiable:**
- A task takes a single, focused action on a specific file or system
- If you need 4+ tasks to complete a Mission, split it into two Missions
- More Missions, each perfectly scoped > fewer Missions with context compaction risk

**What makes a good task:**
- Specific (references the file or module being changed)
- Completable in one focused effort
- Testable (Le Chirurgien can write a test for it)

**What is NOT a task:**
- "Refactor the whole auth module" → too broad, split into specific sub-changes
- "Set up everything for the dashboard" → split by concern (data, UI, routing)

---

## Phase 3 — Define dependencies

For each Mission, declare its dependencies explicitly.

**Dependency types:**
- **None** — independent, can start at any time
- **Depends on Mission X.Y** — cannot start until X.Y is marked `done`
- **Parallel with Mission X.Y** — independent, can run in parallel (note for the user)

Build a dependency graph after listing all Missions. This graph becomes the execution roadmap.

---

## Phase 4 — Present the plan for confirmation

Present the full plan for confirmation:

<output-format>
EXECUTION PLAN — {project_name}

  Quest 1: {quest_name}
    Mission 1.1 — {title}
      Tasks: {count}  Dependencies: None
    Mission 1.2 — {title}
      Tasks: {count}  Dependencies: Mission 1.1

  Quest 2: {quest_name}
    Mission 2.1 — {title}
      Tasks: {count}  Dependencies: None  (can run parallel with Quest 1)
    Mission 2.2 — {title}
      Tasks: {count}  Dependencies: Mission 2.1

  ...

  Dependency graph:
  Mission 1.1 → Mission 1.2 → Mission 1.3
  Mission 2.1 → Mission 2.2 → Mission 3.1
  Mission 3.1 (independent)

  Total: {N} Quests, {M} Missions, {T} tasks

Any adjustments before I save the plan?

  1. Confirm
  2. Adjust
</output-format>

Wait for confirmation. Adjust if the user wants to reorder, merge, or split Quests/Missions.

---

## Phase 5 — Save plan.md

Save the complete plan as `{output_folder}/plan.md`:

```markdown
---
version: "1.0"
date: {date}
agent: L'Architecte
status: validated
---

# Execution Plan — {project_name}

## Overview

{One paragraph: what this plan implements, how many Quests, estimated complexity}

## Quest 1: {quest_name}

**Description:** {what this Quest accomplishes}
**Dependencies:** None | Depends on: Quest {N}

### Mission 1.1 — {title}
- **Tasks:** {count}
- **Key files:** {list}
- **Dependencies:** None

### Mission 1.2 — {title}
- **Tasks:** {count}
- **Key files:** {list}
- **Dependencies:** Mission 1.1

## Quest 2: {quest_name}

{same structure}

## Dependency Graph

{ASCII or textual representation of the full dependency graph}

## Summary

| Metric | Value |
|--------|-------|
| Quests | {N} |
| Missions | {M} |
| Total tasks | {T} |
| Independent missions (parallelizable) | {P} |
```

---

## Reflection modes menu

<output-format>
Plan ready. Want to stress-test before saving?

  REFLECTION MODES
  1. Table Ronde  — Debate priorities and sequencing with Zero
  2. Simulation   — Rollback: "What if Mission 2.1 fails?"

  ─────────────────────────────────────────
  S. Save and generate hk-up-status.yaml (step-04)
</output-format>

**Before executing any mode above, LOAD its data file:**
- Table Ronde → LOAD `data/modes/table-ronde.md`
- Simulation → LOAD `data/modes/simulation.md`

---

## Transition

<output-format>
Step 03 complete.

plan.md saved.
Quests: {N}
Missions: {M} ({T} total tasks)

Mission briefs are NOT generated yet — they will be created one by one
using /hkup-create-mission before each dev session.
This keeps context fresh and briefs enriched with the latest state.

→ Step 04 — I'll now generate hk-up-status.yaml
  and define the git strategy.
</output-format>

Update `hk-up-status.yaml`: `6-2-plan-missions → step-03: done`
Proceed to **step-04-status.md**
