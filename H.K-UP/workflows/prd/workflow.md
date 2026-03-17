---
name: prd
description: "Third workflow of every H.K-UP journey — turns the brainstorm direction into a formal Product Requirements Document"
agent: stratege
mode: PLANNING
---

# PRD Workflow — Le Stratège

**Goal:** Write a complete, validated Product Requirements Document based on the confirmed
direction from the brainstorming workflow. Every feature becomes a precise requirement.
Nothing implicit — everything written.
**Agent:** Le Stratège
**Mode:** PLANNING — read and write documents. No code modifications.

---

## INITIALIZATION

**Agent:** Le Stratège
**Load:** `data/global-rules.md`

**Receives from Brainstorming workflow:**
- `{output_folder}/project-context.md` — full project diagnosis (from L'Éclaireur)
- `{output_folder}/direction.md` — confirmed direction (from brainstorming step-05)
- `{output_folder}/brainstorm-session.md` — full session data

**Pre-flight check — verify before starting:**

1. **Resume check** — Read `{output_folder}/hk-up-status.yaml`
   - If found with prd steps `in-progress` → propose:
     1. Resume where we left off
     2. Review the plan before continuing
     3. Restart this workflow from scratch
   - If not found → verify that the brainstorming workflow has been completed.

2. **Required files — verify these exist before proceeding:**
   - `{output_folder}/project-context.md` — required. Created by L'Éclaireur in diagnostic workflow. If missing: run `/hkup-start` first.
   - `{output_folder}/direction.md` — required. Created by Le Stratège in brainstorming workflow. If missing: run `/hkup-brainstorm` first.
   - `{output_folder}/brainstorm-session.md` — required. Created by Le Stratège in brainstorming workflow. If missing: run `/hkup-brainstorm` first.

3. **If any required file is missing:**
   ```
   ⚠ Cannot start PRD.
   Missing: {file_name}
   This file should have been created by {agent_name} during the {workflow_name} workflow.
   Run /hkup-{command} first, or check {output_folder}/ for the file.
   ```

**Express path check:**
If the user confirmed an Express path during the diagnostic → this workflow is SKIPPED.
Proceed directly to the Architecture workflow.

---

## PRE-EXECUTION

> These rules apply to every step in this workflow.

1. **Rule 9 first** — The first 10 lines of each step file contain the critical instructions.
   Read them before anything else.
2. **Rule 1** — The user validates every section. Never write and auto-advance.
3. **Rule 8** — Web search with a PRECISE subject: stack + version + feature domain.
   Never generic "best practices". Each search has a specific question.
4. **Rule 4** — The PRD checkup is a BLOCKING gate before handoff to L'Architecte.
5. **The PRD is a contract** — Every item from direction.md must appear in the PRD.
   Nothing implicit. Every feature has measurable acceptance criteria.

---

## EXECUTION

Execute steps in order. Never skip. Never reorder.

| Step | File | Description | Output |
|------|------|-------------|--------|
| 01 | `steps/step-01-gather.md` | Collect inputs + targeted web research | Consolidated brief |
| 02 | `steps/step-02-draft.md` | Write the complete PRD section by section | `prd.md` (draft) |
| 03 | `steps/step-03-validate.md` | Review with user section by section | `prd.md` (validated) |
| 04 | `steps/step-04-checkup.md` | Blocking checkup: direction.md vs PRD | `prd.md` (final) |

---

## Deliverables

| File | Created in step |
|------|-----------------|
| `{output_folder}/prd.md` | step-02, finalized in step-04 |

---

## End condition

This workflow is complete when:
- [ ] All inputs have been collected and confirmed (step-01)
- [ ] PRD draft has been written and presented (step-02)
- [ ] User has validated every PRD section (step-03)
- [ ] Checkup confirms 100% coverage of direction.md (step-04)
- [ ] `prd.md` has been saved to `{output_folder}/`
- [ ] `hk-up-status.yaml` has been updated
- [ ] Explicit handoff to L'Architecte has been announced (Rule 10)
