---
name: create-mission
description: "Creates one enriched mission brief at a time — the context engine for dev sessions"
agent: architecte
mode: PLANNING
---

# Create Mission Workflow — L'Architecte

**Goal:** Create one auto-sufficient mission brief that gives the dev agent every piece of context
it needs — no file hunting, no guessing. One brief = one focused dev session.
**Agent:** L'Architecte
**Mode:** PLANNING — read documents and write briefs. No code modifications.

---

## INITIALIZATION

**Agent:** L'Architecte
**Load:** `data/global-rules.md`

**Requires:**
- A completed architecture workflow (`plan.md`, `architecture.md`, `hk-up-status.yaml`)
- At least one mission with status `pending` in `hk-up-status.yaml`

**Resume check — read `hk-up-status.yaml`:**
- Find all missions with status `pending` — these are eligible for brief creation
- Find the FIRST pending mission in plan order
- Present to user: "Next mission to prepare: Mission {X.Y} — {title}. Create this brief?"

### Pre-flight — input file confirmation

⛔ STOP — Do NOT read file contents yet. List filenames only.

Search for the expected input files in `{output_folder}/`:
- `architecture/plan.md` — check `{output_folder}/architecture/plan.md` (required)
- `hk-up-status.yaml` — check `{output_folder}/hk-up-status.yaml` (required)
- `diagnostic/project-context.md` — check `{output_folder}/diagnostic/project-context.md` or `{output_folder}/project-context.md` (required)
- `prd/prd.md` — check `{output_folder}/prd/prd.md` or `{output_folder}/prd.md` (required for Standard/Full, optional for Express)
- `architecture/architecture.md` — check `{output_folder}/architecture/architecture.md` or `{output_folder}/architecture.md` (required)
- If subdirectory structure is not found, glob fallback: `*plan*`, `*hk-up-status*`, `*project-context*`, `*prd*`, `*architecture*`

Present what was found:

<output-format>
🏗️ L'Architecte — Pre-flight check

  Files found:
  ✓/✗ plan.md — required (from architecture workflow)
  ✓/✗ hk-up-status.yaml — required
  ✓/✗ project-context.md — required (from diagnostic)
  ✓/✗ prd.md — required for Standard/Full, optional for Express
  ✓/✗ architecture.md — required (from architecture workflow)

  Next mission eligible: Mission {X.Y} — {title} (status: pending)

  Do you have any additional files or context to provide?

  1. Load everything and create the brief
  2. Add a file or context first
  3. Choose a different mission
</output-format>

⛔ STOP CONDITION: Do NOT proceed to step-01 until the user confirms with option 1.
If the user picks 2: accept the file path or context, add it to the input list, then re-present.
If the user picks 3: list all pending missions and let user select one.

---

## PRE-EXECUTION

> These rules apply to every step in this workflow.

1. **Rule 9 first** — The first 10 lines of each step file contain the critical instructions.
   Read them before anything else.
2. **Rule 2** — Read ALL context files before writing the brief. Never write from memory.
3. **Rule 1** — The user confirms each brief before it is finalized. Never auto-advance.
4. **Rule 8** — Web search for any specific library or framework mentioned in the mission.
   Be specific: stack + version + exact domain. Never generic "best practices".
5. **Session limit** — Track missions created in this session. After 4, stop and recommend `/clear`.
6. **Auto-sufficient briefs** — Every brief must stand alone. The dev agent reads ONLY that file.
7. **Rule 14** — This workflow runs in its own session. At the end, recommend
   `/clear` before launching a different workflow (e.g., `/hkup-dev-and-review`).

---

## EXECUTION

Execute steps in order. Never skip. Never reorder.

| Step | File | Description |
|------|------|-------------|
| 01 | `steps/step-01-create.md` | Create one enriched mission brief |

---

## End condition

This workflow is complete when:
- [ ] Mission brief created at `{output_folder}/missions/mission-{X}-{Y}.md`
- [ ] `hk-up-status.yaml` updated: mission status → `ready`
- [ ] User asked: create next mission or stop?
