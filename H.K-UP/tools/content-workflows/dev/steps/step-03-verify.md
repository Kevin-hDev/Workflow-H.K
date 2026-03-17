---
step: "03"
name: "Verify"
workflow: dev
agent: chirurgien
---

# Step 03 — Verify

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** Zero regressions required before marking [review]. No exceptions.
> **CRITICAL:** If regressions > 0 → return to step-02 and fix. Never hand off broken code.
> **CRITICAL — Rule 7:** Update hk-up-status.yaml to `review` ONLY after all tests pass.
> **CRITICAL — Rule 10:** Announce handoff explicitly — agent, files, what Le Gardien will check.

---

## Goal

Run the final test suite. Compare against the baseline from step-01. Write the completion
report in the mission brief. Mark the mission as `review`. Hand off to Le Gardien.

---

## Phase 1 — Final test suite

Run the complete test suite one last time:

```bash
{test_command_from_project_context}
```

Compare against the baseline recorded in step-01:

```
FINAL VERIFICATION — Mission {quest_num}.{mission_num}

  Baseline (before changes): {baseline_pass}/{baseline_total} passing
  Final (after all tasks):   {final_pass}/{final_total} passing
  New tests added:           +{new_count}
  Regressions:               {count}
```

**If regressions > 0:**

```
⚠ REGRESSION DETECTED — Cannot mark [review].

Tests that broke:
  - {test_name_1}: {expected} → {actual}
  - {test_name_2}: {expected} → {actual}

Returning to step-02 to fix before proceeding.
```

Return to **step-02-implement.md**. Do NOT update the status until all tests pass.

**If regressions = 0:**
Continue to Phase 2.

---

## Phase 2 — Write completion report

Append the completion report to the mission brief file
(`{output_folder}/missions/mission-{quest_num}-{mission_num}.md`):

```markdown
---

## Completion Report

**Agent:** Le Chirurgien
**Date:** {date}
**Status:** Ready for review

### Tasks completed

- [x] Task 1: {description}
      Commit: {short_hash} — {message}
- [x] Task 2: {description}
      Commit: {short_hash} — {message}
- [x] Task 3: {description} *(if applicable)*
      Commit: {short_hash} — {message}

### Files modified

| File | Change |
|------|--------|
| `{file_1}` | {what changed} |
| `{file_2}` | {what changed — created / modified / deleted} |

### Tests added

| Test | Verifies |
|------|----------|
| `{test_name_1}` | {the behavior it asserts} |
| `{test_name_2}` | {the behavior it asserts} |

### Baseline comparison

| | Before | After |
|--|--------|-------|
| Tests passing | {baseline_pass}/{baseline_total} | {final_pass}/{final_total} |
| New tests | — | +{new_count} |
| Regressions | — | 0 |

### Notes

{Any deviations from the brief, pre-existing issues encountered, or context
 Le Gardien should be aware of. Leave blank if none.}
```

---

## Phase 3 — Mark [review] and hand off

**Update `hk-up-status.yaml`:** mission → `review`

Announce the handoff:

```
Mission {quest_num}.{mission_num} — {title} ready for review.

  Tasks: {count}/{count} complete ✓
  Test suite: {final_pass}/{final_total} passing ✓
  Regressions: 0 ✓
  Commits: {count} (one per task)

  → Review Workflow — Le Gardien
    Load: workflows/review/workflow.md

    Le Gardien will receive:
    - Mission brief with completion report:
      {output_folder}/missions/mission-{quest_num}-{mission_num}.md
    - Architecture context: {output_folder}/architecture.md
    - git diff of all changes since mission start:
      git diff {first_commit_hash}^..HEAD
    - Test results: {final_pass}/{final_total} passing
```

---

## Transition

```
Step 03 complete. Dev workflow instance done.

Mission {quest_num}.{mission_num}: review
Commits: {list of hashes and messages}
Tests: {final_pass}/{final_total} ✓

→ Le Gardien — Review Workflow
```

No `hk-up-status.yaml` update at this step beyond the `review` mark already set in Phase 3.
