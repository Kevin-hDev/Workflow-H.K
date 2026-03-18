---
step: "05"
name: "Validation"
workflow: architecture
agent: architecte
---

# Step 05 — Validation

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL — Rule 4:** The final checkup is BLOCKING. Every PRD Must Have must map to a Mission.
> **CRITICAL — Rule 10:** Announce the handoff explicitly — agent name, first Mission, files transmitted.
> **CRITICAL — Rule 1:** The user gives final confirmation before anything is handed to Le Chirurgien.
> **CRITICAL:** Do not mark phase-6 `done` until the user says "go".

---

## Goal

Present the complete plan. Run the final blocking checkup: every PRD Must Have feature must
be traceable to at least one Mission. Get user confirmation. Hand off to Le Chirurgien.

---

## Phase 1 — Present the complete plan

Give the user a full picture of what was built in this workflow:

<output-format>
ARCHITECTURE WORKFLOW COMPLETE — {project_name}

DELIVERABLES PRODUCED
  ├── architecture.md       — {N} Architecture Decision Records
  ├── plan.md               — {N} Quests, {M} Missions, {T} tasks
  ├── hk-up-status.yaml     — Execution registry ({M} missions at pending)
  └── missions/              ← briefs created later via /hkup-create-mission

ARCHITECTURE APPROACH CHOSEN
  {Name of the selected approach from step-02}
  Migration strategy: {Strangler Fig | Parallel Run | Phased Replacement}

EXECUTION PLAN SUMMARY
  Quest 1: {quest_name} — {M} missions
  Quest 2: {quest_name} — {M} missions
  ...

  Total effort: {T} tasks across {M} missions
  Parallelizable: {count} missions can run in parallel
  Critical path: {Mission X.Y} → {Mission X.Z} → ... → {last blocking Mission}

GIT STRATEGY
  {path}: {strategy summary}
  First branch: {branch_name} (from {base_branch})
</output-format>

---

## Phase 2 — Final blocking checkup: PRD Must Have → Missions

**This checkup is a blocking gate.** Every Must Have feature from `prd.md`
(or project-context.md objectives if Express) must be traceable to at least one Mission.

Use this exact format:

<output-format>
Final Checkup — PRD Must Have features vs Execution Plan

  Feature                          Quest → Mission
  ──────────────────────────────   ─────────────────────────────────────────
  F1 — {Must Have feature name}    ✓  Quest 1 → Mission 1.2
  F2 — {Must Have feature name}    ✓  Quest 2 → Mission 2.1, 2.2
  F3 — {Must Have feature name}    ✓  Quest 1 → Mission 1.1 + Quest 3 → Mission 3.1
  F4 — {Must Have feature name}    ✗  NOT MAPPED — no Mission covers this

  Result: {N}/{total} Must Have features covered

  → {If 100%}: All Must Have features are mapped. Plan is complete.
  → {If <100%}: F4 is not covered. Adding Mission {N.M} before proceeding.
</output-format>

If any Must Have is unmapped:
1. Create the missing Mission immediately (brief + plan.md + hk-up-status.yaml update)
2. Re-run the checkup
3. Do not proceed until all Must Have features are covered

---

## Phase 3 — User confirmation

Once the checkup passes 100%:

<output-format>
Checkup passed. All {N} Must Have features are mapped to Missions.

Here is the complete plan. Is this what you want to execute?

  {condensed plan view — Quest by Quest, Mission list, total count}

Any final adjustments? Or ready to hand off to Le Chirurgien?

  1. Adjust something (specify what)
  2. Let's go — start execution
</output-format>

Wait for explicit confirmation. Do not proceed until the user says so.

---

## Phase 4 — Handoff to execution phase

Once the user confirms:

**Update hk-up-status.yaml:**
1. Mark the first Mission as `in-progress`
2. Mark phase-6 (architecture) as `done` in the **H.K-UP build status**

**Announce the handoff:**

<output-format>
Plan validated. Handing off to execution.

  PLAN VALIDATED
  Quests: {N}
  Missions: {M}
  Total tasks: {T}
  Git strategy: {strategy}

  NEXT STEP
  Next step: Run /hkup-create-mission to create enriched mission briefs
  before starting development with /hkup-dev-and-review.

  WHAT LE GARDIEN RECEIVES
  - Plan for phase checkups: {output_folder}/plan.md
  - Reference PRD: {output_folder}/prd.md (Standard/Full) or project-context.md (Express)
  - Status registry: {output_folder}/hk-up-status.yaml

  FIRST MISSION: {mission_id} — {title}
    Branch to create: {branch_name}

  → Create Mission Briefs — /hkup-create-mission
    Load: workflows/create-mission/workflow.md
    Next step: Run /hkup-create-mission to create enriched mission briefs
    before starting development with /hkup-dev-and-review.
</output-format>

---

## Reflection modes menu

This menu is offered before the user gives final confirmation (Phase 3).

<output-format>
Everything is ready. One last review before we start building?

  REFLECTION MODES
  1. Table Ronde  — Final debate: is this the right plan?
  2. Simulation   — "The first Mission hits an unexpected blocker — what do we do?"

  ─────────────────────────────────────────
  S. Confirm and hand off to Le Chirurgien
</output-format>

---

## Transition

<output-format>
Step 05 complete. Architecture workflow done.

architecture.md:     {N} ADRs
plan.md:             {N} Quests, {M} Missions
hk-up-status.yaml:  {M} missions registered (Mission 1.1: in-progress)
Mission briefs:      to be created via /hkup-create-mission

→ Dev Workflow — Le Chirurgien
  First mission: {mission_id} — {title}
  Branch: {branch_name} (to create from {base_branch})
</output-format>

Update `hk-up-status.yaml` (H.K-UP build status): `6-2-plan-missions → done`, `phase-6-architecture → done`
