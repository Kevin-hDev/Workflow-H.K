---
name: brainstorming
description: "Second workflow of every H.K-UP journey — guides the user through a structured brainstorm using a directive method and techniques"
agent: stratege
mode: PLANNING
---

# Brainstorming Workflow — Le Stratège

**Goal:** Choose a directive method, run a structured brainstorm session, synthesize ideas, and prepare a clear direction for the PRD.
**Agent:** Le Stratège
**Mode:** PLANNING — read and write plans. No code modifications.

---

## INITIALIZATION

**Agent:** Le Stratège
**Load:** `data/global-rules.md` + `data/brain-methods.csv` + `data/brainstorm-techniques.csv`

**Receives from L'Éclaireur:**
- `{output_folder}/project-context.md` — full project diagnosis
- Confirmed objective(s) and user vision

**Pre-flight check — verify before starting:**

1. **Resume check** — Read `{output_folder}/hk-up-status.yaml`
   - If found with brainstorming steps `in-progress` → propose:
     1. Resume where we left off
     2. Review the plan before continuing
     3. Restart this workflow from scratch
   - If not found → verify that the diagnostic workflow has been completed.

2. **Required files — verify these exist before proceeding:**
   - `{output_folder}/project-context.md` — required. Created by L'Éclaireur in diagnostic workflow. If missing: run `/hkup-start` first.

3. **If any required file is missing:**
   ```
   ⚠ Cannot start Brainstorming.
   Missing: project-context.md
   This file should have been created by L'Éclaireur during the diagnostic workflow.
   Run /hkup-start first, or check {output_folder}/ for the file.
   ```

**Web search — Benchmark Vivant:**
Before starting, search for the current state of the art:
- Query format: `"{stack} {domain} best practices {current_year}"`
- Query format: `"{stack} {version} latest features {current_year}"`
- Store results to enrich the session with up-to-date references.

---

## PRE-EXECUTION

> These rules apply to every step in this workflow.

1. **Rule 9 first** — The first 10 lines of each step file contain the critical instructions.
   Read them before anything else.
2. **Rule 1** — The user chooses the method and validates every direction. Never decide alone.
3. **Rule 8** — Web search must have a PRECISE subject: stack + version + exact domain.
   Never generic "best practices". Be specific.
4. **Options always** — Propose at least 2-3 directions at each decision point.
   A single option is not a choice.
5. **Rule 3** — Offer the reflection modes menu at the end of each step.

---

## EXECUTION

Execute steps in order. Never skip. Never reorder.

| Step | File | Description | Output |
|------|------|-------------|--------|
| 01 | `steps/step-01-method.md` | Present 8 directive methods + 'recommend' option | Chosen method |
| 02 | `steps/step-02-session.md` | Run the chosen method (structured phases) | Session output |
| 03 | `steps/step-03-techniques.md` | Offer 20 techniques menu (by category), chainable | Enriched ideas |
| 04 | `steps/step-04-synthesis.md` | Organize ideas, prioritize, checkup | Synthesis doc |
| 05 | `steps/step-05-decision.md` | User decides direction + interactive modes menu | Confirmed direction |

---

## Deliverables

| File | Created in step |
|------|-----------------|
| `{output_folder}/brainstorm-session.md` | step-04 |
| `{output_folder}/direction.md` | step-05 |

---

## End condition

This workflow is complete when:
- [ ] User has chosen their directive method (step-01)
- [ ] Brainstorm session has been run through all method phases (step-02)
- [ ] At least one technique has been applied (step-03)
- [ ] Ideas have been synthesized and prioritized (step-04)
- [ ] User has confirmed the direction (step-05)
- [ ] `hk-up-status.yaml` has been updated
- [ ] Explicit handoff to Le Stratège's PRD workflow has been announced (Rule 10)
