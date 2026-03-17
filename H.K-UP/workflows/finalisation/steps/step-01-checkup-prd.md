---
step: "01"
name: "Final PRD Coverage Checkup"
workflow: finalisation
agent: stratege
---

# Step 01 — Final PRD Coverage Checkup

> **CRITICAL — Rule 4:** This is the LAST blocking gate. The parcours cannot close until Must Have = 100%.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL — Rule 2:** Read the actual code — do not rely on mission status alone to confirm coverage.
> **CRITICAL — Rule 1:** The user decides what to do with every gap. Never auto-resolve.
> **CRITICAL:** After fixing any Must Have gap, re-run the full checkup. Never assume 100% — verify it.

---

## Goal

Verify that every Must Have feature in the reference document has been fully implemented.
This is not a trust-based check ("Le Gardien validated it, so it's done") — it is a direct
read-and-verify against the actual code or output files.

---

## Phase 1 — Determine the reference document

Based on `hk-up-status.yaml` parcours field:

| Parcours | Primary reference | Secondary reference |
|----------|-------------------|---------------------|
| Express | `{output_folder}/project-context.md` — confirmed objectives | — |
| Standard | `{output_folder}/prd.md` — all features | — |
| Full | `{output_folder}/prd.md` — all features | `{output_folder}/security-audit.md` — remediation plan |
| Design | `{output_folder}/prd.md` — UI features | `{output_folder}/spec-design.md` — design tokens and mockups |
| Audit | `{output_folder}/project-context.md` findings | `{output_folder}/security-audit.md` |

Read the reference document in full. Extract every item:
- Must Have items → will be checked individually (blocking)
- Should Have items → will be checked (non-blocking, user decision)
- Could Have items → noted but not individually verified unless the user requests it

---

⛔ STOP CHECK
- Reference document (prd.md or project-context.md) READ IN FULL? [YES/NO]
- All Must Have items extracted and listed? [YES/NO]
- {output_folder}/plan.md READ (mission mapping available)? [YES/NO]
- {output_folder}/hk-up-status.yaml READ? [YES/NO]
- Ready to verify each feature against implementation? [YES/NO]

⛔ STOP CONDITION: If any check = NO → Go back and READ the file contents before continuing. The final checkup requires complete data — partial reads produce false coverage reports.

---

## Phase 2 — Verify each Must Have item

For each Must Have feature or objective:

1. Read `{output_folder}/plan.md` — find the mission(s) assigned to cover it
2. Check `hk-up-status.yaml` — is that mission `done`?
3. **Read the actual implementation** — locate the files or outputs that implement the feature
4. Verify against acceptance criteria (from prd.md, or objectives from project-context.md)
5. Check if a test exists (if applicable — not for Audit or Design parcours)

---

## Phase 3 — Present the coverage report

Use the format from `data/checkup-system.md` (Level 3 — Final Checkup):

```
FINAL PRD CHECKUP — {project_name}
Reference: {reference_document} | Path: {parcours}

  Feature                                   Mission(s)   Code   Tests   AC met?   Status
  ─────────────────────────────────────────────────────────────────────────────────────────
  F1 — {Must Have feature name}             M-{n.m}      ✓      ✓       ✓         ✓ DONE
  F2 — {Must Have feature name}             M-{n.m}      ✓      ✓       ⚠ partial ⚠ PARTIAL
  F3 — {Must Have feature name}             —            ✗      ✗       ✗         ✗ MISSING
  F4 — {Should Have feature name}           M-{n.m}      ✓      ✓       ✓         ✓ DONE
  F5 — {Should Have feature name}           —            ✗      ✗       ✗         ⚠ NOT DONE
  F6 — {Could Have feature name}            —            ✗      ✗       ✗         — DEFERRED

  ──────────────────────────────────────────────────────────────────────────────────────────
  Must Have:   {n}/{total} — {percent}%   → {✓ PASS if 100% | ⛔ BLOCK if <100%}
  Should Have: {n}/{total} — {percent}%   → reported, non-blocking
  Could Have:  {n}/{total} — {percent}%   → reported, non-blocking
```

**Column guide:**
- **Mission(s):** the mission brief(s) that should cover this feature
- **Code:** does the implementation exist in the codebase?
- **Tests:** do tests exist for this feature? (N/A for Audit/Design)
- **AC met?** do the acceptance criteria from the PRD pass?
- **Status:** the combined result

---

## Phase 4 — Handle gaps

### If Must Have features are MISSING → BLOCK

```
⛔ BLOCKING — {count} Must Have feature(s) not implemented.

  {feature_name}:
  - Expected: {acceptance criteria from PRD}
  - Found: {what actually exists, or "nothing found"}

  Options:
  1. Create Mission {next_id} — implement this feature now
     Estimated effort: {brief estimate}
  2. De-scope — move to Should Have and document as a known gap
     ⚠ This requires your explicit confirmation and will be documented

  The parcours cannot close until all Must Have features are resolved.
```

Wait for user decision for each missing Must Have. If the user creates new missions:
- Add them to `plan.md`
- Add them to `hk-up-status.yaml` as `backlog`
- Execute them (return to dev workflow) before re-running this checkup

### If Must Have features are PARTIAL → FIX or ACCEPT

```
⚠ "{feature_name}" passes partially.

  Criteria met:     {list of passing criteria}
  Criteria missing: {list of failing criteria}

  Options:
  1. Fix — create a targeted mission to complete the criteria
  2. Accept as-is — document as partially implemented
```

### If Should Have features are NOT DONE → USER DECISION

```
⚠ {count} Should Have feature(s) not implemented:
  - {feature_1}
  - {feature_2}

  These are not blocking. For each:
  1. Create missions now — implement before closing
  2. Defer to a future version — document in the closing summary
```

---

## Phase 5 — Re-run until clear

After fixing any Must Have gaps, re-run the full coverage table.
Present the updated report. Continue until:

```
Must Have: {n}/{n} — 100% ✓
```

Only then proceed to step-02.

---

## Reflection modes menu

Before proceeding to step-02:

```
Final checkup passed. Before we close, anything you want to explore?

  REFLECTION MODES
  1. Table Ronde  — Debate with agents: are we leaving anything important out?
  2. Conformité   — Last legal check before the project ships

  ─────────────────────────────────────────
  S. Proceed to closing summary
```

**Before executing any mode above, LOAD its data file:**
- Table Ronde → LOAD `data/modes/table-ronde.md`
- Conformité → LOAD `data/modes/conformite.md`

---

## Transition

```
Step 01 complete. Final checkup passed.

  Must Have: {n}/{n} — 100% ✓
  Should Have: {n}/{total} — {percent}%
  Deferred items: {list if any}

→ Step 02 — Closing summary and formal handoff
```

Update `hk-up-status.yaml`: `11-2-finalisation-handoff → step-01: done`
