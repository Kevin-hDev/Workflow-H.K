---
name: architecture
description: "Fourth workflow of the H.K-UP Standard and Full paths — L'Architecte reads the PRD and existing codebase, designs the technical architecture, breaks down work into Quests/Missions, and defines the git strategy"
agent: architecte
mode: PLANNING
---

# Architecture Workflow — L'Architecte

**Goal:** Turn the validated PRD into a concrete technical plan. Design the architecture
that makes every Must Have feature achievable. Break work into executable Quests and Missions.
Define the git strategy. Nothing is built until this plan is validated.
**Agent:** L'Architecte
**Mode:** PLANNING — read and write documents. No code modifications.

---

## INITIALIZATION

**Agent:** L'Architecte
**Load:** `data/global-rules.md`

**Receives:**
- Standard/Full path: `{output_folder}/project-context.md` + `{output_folder}/prd.md` + `{output_folder}/brainstorm-session.md`
- Express path: `{output_folder}/project-context.md` only (PRD was skipped)

**Express path behavior:**
If the confirmed path is Express → skip all PRD references.
Work directly from project-context.md + user objective confirmed by L'Éclaireur.
All checkup steps compare against project-context.md objectives instead of prd.md.

**Resume check — read `hk-up-status.yaml`:**
- If architecture steps are `in-progress` → propose:
  1. Resume where we left off
  2. Review the plan before continuing
  3. Restart the architecture workflow from scratch
- If fresh start → proceed to step-01.

---

## PRE-EXECUTION

> These rules apply to every step in this workflow.

1. **Rule 9 first** — The first 10 lines of each step file contain the critical instructions.
   Read them before anything else.
2. **Rule 2** — Read prd.md in full before designing anything. Never design from memory.
3. **Rule 1** — The user confirms at each step. Never auto-advance.
4. **Rule 4** — Blocking checkup: architecture must cover 100% of PRD Must Have features
   before transmitting the plan to Le Chirurgien.
5. **Think in systems, not files** — Reason by components, layers and responsibilities.
   The physical structure of files is a consequence, not a starting point.
6. **Every decision has a justification** — "Because it's clean" is not a justification.
   Cost, risk, maintainability, project constraint: be precise.
7. **BROWNFIELD focus** — The architecture must work WITH the existing code.
   Strangler fig is the default migration strategy. Big bang is never recommended.

---

## EXECUTION

Execute steps in order. Never skip. Never reorder.

| Step | File | Description | Output |
|------|------|-------------|--------|
| 01 | `steps/step-01-analyse.md` | Read PRD + deep codebase analysis | Analysis findings confirmed |
| 02 | `steps/step-02-design.md` | Propose architecture with ADRs + checkup vs PRD | `architecture.md` |
| 03 | `steps/step-03-plan.md` | Decompose into Quests and Missions (2-3 tasks max) | `plan.md` |
| 04 | `steps/step-04-status.md` | Generate hk-up-status.yaml + define git strategy | `hk-up-status.yaml` |
| 05 | `steps/step-05-validation.md` | User validates complete plan + blocking checkup vs PRD | Handoff to Le Chirurgien |

---

## Deliverables

| File | Created in step |
|------|-----------------|
| `{output_folder}/architecture.md` | step-02 |
| `{output_folder}/plan.md` | step-03 |
| `{output_folder}/hk-up-status.yaml` | step-04 |

---

## End condition

This workflow is complete when:
- [ ] Existing codebase has been analysed and findings confirmed (step-01)
- [ ] Architecture has been designed with ADRs for every major decision (step-02)
- [ ] Checkup confirms architecture covers 100% of PRD Must Have features (step-02)
- [ ] Work has been decomposed into Quests and Missions of 2-3 tasks max (step-03)
- [ ] Dependencies between missions are explicit (step-03)
- [ ] `architecture.md` has been saved to `{output_folder}/` (step-02)
- [ ] `plan.md` has been saved to `{output_folder}/` (step-03)
- [ ] `hk-up-status.yaml` has been generated with all missions at `backlog` status (step-04)
- [ ] Git strategy has been defined and documented (step-04)
- [ ] User has validated the complete plan (step-05)
- [ ] Explicit handoff to Le Chirurgien has been announced (Rule 10)
