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

**Receives per mission:**
- `{output_folder}/missions/mission-{N}.md` — brief + completion report from Le Chirurgien
- `git diff {first_commit}^..HEAD` — all code changes for this mission
- Test suite results (from step-03-verify.md)
- `{output_folder}/architecture.md` — to verify ADR compliance
- `{output_folder}/plan.md` — to check mission scope was respected

**Before starting each mission review:**
Check `hk-up-status.yaml` — the mission must be at `review` status.
If it is not `review`, do not start the review — something is wrong in the sequence.

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
