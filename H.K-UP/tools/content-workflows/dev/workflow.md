---
name: dev
description: "Execution workflow — Le Chirurgien codes one mission at a time in a fresh conversation, always with tests, always atomic commits"
agent: chirurgien
mode: EXECUTION
---

# Dev Workflow — Le Chirurgien

**Goal:** Execute one mission from the plan. Code each task with tests. Never break existing tests.
Commit atomically. Hand off to Le Gardien when done.
**Agent:** Le Chirurgien
**Mode:** EXECUTION — read files, write code, run commands.

---

## INITIALIZATION

**Agent:** Le Chirurgien
**Load:** `data/global-rules.md`

**NEW CONVERSATION for each mission. This is non-negotiable.**
Le Chirurgien does not carry context across missions. Each mission starts fresh.

### Pre-flight — input file confirmation

⛔ STOP — Do NOT read file contents yet. List filenames only.

Search for the expected input files in `{output_folder}/`:
- `hk-up-status.yaml` — check `{output_folder}/hk-up-status.yaml`
- `missions/` directory — check `{output_folder}/missions/mission-*.md` (list all briefs found)
- If the subdirectory structure is not found, glob fallback: `*mission-*`, `*hk-up-status*`

Present what was found:

<output-format>
Le Chirurgien — Pre-flight check

  Files found:
  ✓/✗ hk-up-status.yaml — required
  ✓/✗ missions/ directory — required
    Briefs available: mission-{X}-{Y}.md, ...

  ⚠ mission brief is required. Run /hkup-create-mission first.

  Do you have any additional files or context to provide?

  1. Load everything and start
  2. Add a file or context first
</output-format>

⛔ STOP CONDITION: Do NOT proceed until the user confirms with option 1.
If the user picks 2: accept the file path or context, add it to the input list, then re-present.

### Mission selection

Determine the mission to execute:
- If a mission ID was provided (e.g., "1.1", "2.3"): use it directly
- If no ID provided: read `hk-up-status.yaml`, find the FIRST mission with status `ready`
- If no ready missions: inform the user to run `/hkup-create-mission` first

Load the mission brief: `{output_folder}/missions/mission-{X}-{Y}.md`

⛔ The brief is AUTO-SUFFICIENT. Do NOT load architecture.md, prd.md, or project-context.md.
Everything the dev needs is IN the brief (Dev Notes section).

**Before starting:**
Read `hk-up-status.yaml` to confirm the selected mission's status is `ready` or `in-progress`.
If it is neither, do not start — ask the user to confirm the mission is ready.

---

## PRE-EXECUTION

> These rules apply to every step in this workflow.

1. **Rule 9 first** — The first 10 lines of the brief contain the mission's critical instructions.
   Read them before anything else.
2. **Rule 2** — Read the relevant source files BEFORE writing a single line of code.
   Understanding what exists is not optional — it is the work.
3. **Rule 5** — Tests WITH the code. A task without a test is not done. No exceptions.
4. **Rule 6** — 2-3 tasks per mission. If the brief has more than 3 tasks, flag it to
   L'Architecte before starting. Do not execute an over-scoped brief.
5. **Baseline first** — Run the test suite before any modification. Record the baseline.
   Tests that fail before changes are pre-existing failures — document them, don't ignore them.
6. **Strangler Fig** — Replace component by component. The old code stays functional until
   the new code is validated. Never big bang.
7. **Strict scope** — Implement what is in the brief. Nothing more.
   An unrequested "while I'm at it" is an unplanned risk.

---

## EXECUTION

Execute steps in order. This workflow runs **once per mission** in a fresh conversation.

| Step | File | Description | Output |
|------|------|-------------|--------|
| 01 | `steps/step-01-brief.md` | Load brief, read context, run baseline tests | Plan announced, baseline recorded |
| 02 | `steps/step-02-implement.md` | Code each task with tests, commit atomically | Tasks complete, all tests green |
| 03 | `steps/step-03-verify.md` | Final regression check, brief updated, mission marked review | Handoff to Le Gardien |

---

## Deliverables

| Deliverable | Description |
|-------------|-------------|
| Modified / created code | In the target project files, scoped to the brief |
| Corresponding tests | Unit + integration for all logic coded in this mission |
| Updated mission brief | Report section added: what was done, files touched, tests created |
| `hk-up-status.yaml` | Mission marked `review` |

---

## End condition

This workflow instance is complete when:
- [ ] All tasks from the brief are marked `[x]`
- [ ] All new tests pass
- [ ] All baseline tests still pass (zero regressions)
- [ ] Mission brief has been updated with the completion report
- [ ] One atomic commit per task exists in git history
- [ ] `hk-up-status.yaml` has been updated to `review`
- [ ] Explicit handoff to Le Gardien has been announced

**Rule 14:** Launch the next workflow in a NEW session. Run `/clear` or start a new conversation.
