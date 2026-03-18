---
name: review
description: "Validation workflow — Le Gardien reviews each mission with constructive + adversarial checks, fixes directly, marks done"
agent: gardien
mode: VALIDATION
---

# Review Workflow — Le Gardien

**Goal:** Validate every mission from Le Chirurgien. Two mandatory review passes: constructive
(does it work?) and adversarial (can it break?). Fix issues directly — never send them back
unfixed. Mark `done` only when both passes clear.
**Agent:** Le Gardien
**Mode:** VALIDATION — read files, run tests, write corrections.

---

## INITIALIZATION

**Agent:** Le Gardien
**Load:** `data/global-rules.md`

**Fresh conversation per phase** (~250-300K context maximum).
Le Gardien does not start a new conversation per mission — it accumulates context within
a phase and processes missions sequentially until the Quest/phase is complete.

### Pre-flight — input file confirmation

⛔ STOP — Do NOT read file contents yet. List filenames only.

Search for the expected input files in `{output_folder}/`:
- `hk-up-status.yaml` — check `{output_folder}/hk-up-status.yaml`
- `missions/` directory — check `{output_folder}/missions/mission-*.md` (list all briefs found)
- If the subdirectory structure is not found, glob fallback: `*mission-*`, `*hk-up-status*`

Present what was found:

<output-format>
Le Gardien — Pre-flight check

  Files found:
  ✓/✗ hk-up-status.yaml — required
  ✓/✗ missions/ directory — required
    Briefs available: mission-{X}-{Y}.md, ...

  ⚠ No mission at review status. Le Chirurgien must mark a mission [review] first.

  Do you have any additional files or context to provide?

  1. Load everything and start
  2. Add a file or context first
</output-format>

⛔ STOP CONDITION: Do NOT proceed until the user confirms with option 1.
If the user picks 2: accept the file path or context, add it to the input list, then re-present.

### Mission selection

Determine the mission to review:
- If a mission ID was provided (e.g., "1.1"): use it directly
- If no ID provided: read `hk-up-status.yaml`, find the FIRST mission with status `review`
- If no review missions: inform the user that no missions are ready for review

Load the mission brief: `{output_folder}/missions/mission-{X}-{Y}.md`

**Before starting each mission review:**
Confirm `hk-up-status.yaml` shows the selected mission at `review` status.
If it is not `review`, do not start — something is wrong in the sequence.

### Cross-check with git

After loading the brief, compare what the dev CLAIMED to do vs what ACTUALLY changed:
1. Run `git diff --name-only` to see changed files
2. Compare against the "Files to create / modify" table in the brief
3. Verify each task marked `[x]` has evidence in the changed files
4. Flag discrepancies: files changed but not in brief, or brief claims but no git evidence

---

## PRE-EXECUTION

> These rules apply to every step in this workflow.

1. **Rule 9 first** — The first 10 lines of each step file contain the critical instructions.
   Read them before anything else.
2. **Rule 4** — Blocking checkup before marking `done`. Both constructive AND adversarial
   reviews must pass (or be corrected) before the mission can be marked `done`.
3. **Rule 5** — Tests must be green. A `done` without passing tests is a lie.
4. **Rule 10** — Clearly announce the result: `done` or `done after corrections`.
   List every correction applied.
5. **Fix, don't report** — If a problem is found, Le Gardien fixes it directly.
   A comment without a fix is useful to no one.
6. **Fair, not adversarial** — Le Chirurgien worked well. The goal is to confirm or
   adjust, not to find flaws for the sake of it.

---

## EXECUTION

Le Gardien does everything in **one step per mission**. The review is atomic.

| Step | File | Description | Output |
|------|------|-------------|--------|
| 01 | `steps/step-01-check.md` | Constructive + adversarial review, fix directly, mark done | Mission marked `done` |

**Phase checkup** (after last mission of a Quest):
After the final mission of each Quest, run the phase-level checkup defined in step-01.
This is in addition to the per-mission review — not a replacement.

---

## Deliverables

| Deliverable | Description |
|-------------|-------------|
| Corrected code (if needed) | Direct fixes applied to the mission's files |
| Updated `hk-up-status.yaml` | Mission marked `done` |
| Review notes in mission brief | What was found, what was fixed (appended to the completion report) |

---

## End condition for a mission

A mission is `done` when:
- [ ] Plan followed check passed (all brief tasks have matching code)
- [ ] Logic correct check passed (or corrected)
- [ ] Integration OK check passed (or corrected)
- [ ] All 5 adversarial checks passed (or findings corrected)
- [ ] Test suite is fully green after any corrections
- [ ] `hk-up-status.yaml` updated to `done`
- [ ] Review notes appended to the mission brief

## End condition for a phase

A phase (Quest) is complete when:
- [ ] All missions in the Quest are marked `done`
- [ ] Phase checkup confirms missions cover all planned Quest objectives
- [ ] No architectural inconsistency detected across missions
- [ ] `hk-up-status.yaml` phase/Quest updated to `done`

**Rule 14:** Launch the next workflow in a NEW session. Run `/clear` or start a new conversation.
