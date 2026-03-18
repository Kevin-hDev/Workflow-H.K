---
type: system-reference
loaded_by: all step files with checkups
rule: Rule 4 — Blocking checkup at each handoff
---

# Checkup System — Progressive Coverage Gates

> **CRITICAL — Rule 4:** A failed checkup is a HARD BLOCK. Nothing proceeds until coverage = 100% Must Have.
> **CRITICAL:** Never silently skip a gap. Every missing item must be addressed before the gate opens.
> **CRITICAL:** After fixing gaps, re-run the checkup. Never assume 100% — verify it.

---

## What it is

The checkup system is H.K-UP's safety net: a series of progressive, blocking gates that verify
coverage at every major transition. No workflow hands off to the next agent without confirmation
that nothing was missed.

3 levels of safety net:
1. **Transition checkup** — at every handoff between agents or workflows
2. **Phase checkup** — at the end of each execution Quest
3. **Final checkup** — at the end of the entire parcours

---

## Universal checkup format

Every checkup — regardless of level or context — uses this format:

<output-format>
CHECKUP — {source_document} vs {target_document}

  Source item                              Coverage in target   Status
  ──────────────────────────────────────   ──────────────────   ──────
  {item_1 from source}                     {section/feature}    ✓ Covered
  {item_2 from source}                     {section/feature}    ✓ Covered
  {item_3 from source}                     —                    ✗ MISSING
  {item_4 from source}                     {section/feature}    ⚠ Partial

  ──────────────────────────────────────────────────────────────────────
  Must Have coverage:   {n}/{total} — {percent}%
  Should Have coverage: {n}/{total} — {percent}%   (non-blocking)
  Could Have coverage:  {n}/{total} — {percent}%   (non-blocking)
</output-format>

**Status legend:**
- ✓ Covered — fully addressed in the target document
- ⚠ Partial — present but acceptance criteria or scope incomplete
- ✗ MISSING — not found in the target document

**Gate result:**
- `Must Have: 100%` → **PASS** — proceed to the next workflow
- `Must Have: < 100%` → **BLOCK** — resolve all ✗ items before proceeding
- `Should Have: < 100%` → **WARN** — document and let user decide (non-blocking)

---

## Level 1 — Transition Checkup

**When:** At every handoff between agents or workflows.
**Who runs it:** The agent completing the current phase (before handing off).
**Blocking:** Yes — 100% Must Have required.

**What it verifies:** Does the current deliverable cover everything the previous deliverable specified?

### Complete handoff table

| Transition | Source document | Target document | Who runs it |
|------------|-----------------|-----------------|-------------|
| Diagnostic → Brainstorming | `project-context.md` objectives | `brainstorm-session.md` coverage | L'Éclaireur (diagnostic step-05) |
| Brainstorming → PRD | `direction.md` in-scope items | `prd.md` features | Le Stratège (PRD step-04) |
| PRD → Architecture | `prd.md` Must Have features | `architecture.md` ADRs | L'Architecte (architecture step-02) |
| Architecture → Dev | `prd.md` Must Have features | `plan.md` missions | L'Architecte (architecture step-05) |
| Design → Dev | `prd.md` UI features | `spec-design.md` + mockups | Le Designer (design step-04) |
| Diagnostic → Architecture (Express) | `project-context.md` objectives | `plan.md` missions | L'Architecte |
| Diagnostic → Audit | `project-context.md` findings | `security-audit.md` + `debt-report.md` | L'Éclaireur / Nyx |

### Handling gaps at transition

**If Must Have items are MISSING → BLOCK:**

```
⛔ BLOCKING — "{item}" from {source_document} is not covered in {target_document}.

Here's a draft to cover it:
  {draft content based on the missing item}

  1. Add as-is to {target_document}
  2. Modify before adding
  3. Skip this item
```

After adding: re-run the checkup. Do not proceed until the table shows 100% Must Have.

**If Should Have items are MISSING → WARN:**

```
⚠ WARNING — "{item}" from {source_document} is not in {target_document}.
  This is a Should Have — it does not block the handoff.

  Would you like to:
  1. Add it now
  2. Defer to a future version
```

**If Partial coverage:**

```
⚠ "{item}" is partially covered but acceptance criteria are incomplete.

Current:   {what exists}
Missing:   {what is incomplete}

  1. Add all partial items
  2. Review each one individually
  3. Skip partial items
```

---

## Level 2 — Phase Checkup

**When:** After the last mission of each Quest (execution phase).
**Who runs it:** Le Gardien.
**Blocking:** Yes — all Quest objectives must be covered.

**What it verifies:** Do the completed missions collectively cover all of the Quest's objectives?

### Format

```
PHASE CHECKUP — Quest {N}: {quest_name}

  Quest Objective                          Mission(s)           Status
  ──────────────────────────────────────   ─────────────────    ──────
  {objective_1}                            Mission {N.M}        ✓ Done
  {objective_2}                            Mission {N.M}        ✓ Done
  {objective_3}                            —                    ✗ NOT COVERED

  Quest coverage: {n}/{total} objectives — {percent}%
```

**If an objective is NOT COVERED:**

```
⛔ BLOCKING — Quest {N} objective "{objective}" is not covered by any completed mission.

  Options:
  1. Create Mission {N.M+1} to cover it now
  2. Trace it to an existing mission (if I missed the coverage)

  This Quest cannot be marked "done" until all objectives are covered.
```

After resolving: re-run the phase checkup. Mark the Quest as `done` in `hk-up-status.yaml` only after it passes.

---

## Level 3 — Final Checkup

**When:** At the end of the entire parcours, before the finalization workflow.
**Who runs it:** Le Stratège.
**Blocking (Must Have):** Yes. **Non-blocking (Should Have, Could Have):** Warn only.

**What it verifies:** Is every feature in the PRD (or `project-context.md` for Express) implemented?

### Format

```
FINAL CHECKUP — {project_name}
Source: prd.md | Target: implemented codebase

  Feature                     Priority      Implementation evidence   Status
  ─────────────────────────   ───────────   ──────────────────────    ──────
  F1 — {feature_name}         Must Have     {file:line or commit}     ✓ Done
  F2 — {feature_name}         Must Have     {file:line or commit}     ✓ Done
  F3 — {feature_name}         Must Have     —                         ✗ MISSING
  F4 — {feature_name}         Should Have   {file:line or commit}     ✓ Done
  F5 — {feature_name}         Should Have   —                         ⚠ Not implemented

  ──────────────────────────────────────────────────────────────────────────────
  Must Have:   {n}/{total} — {percent}%   → {PASS | BLOCK}
  Should Have: {n}/{total} — {percent}%   → {reported, non-blocking}
  Could Have:  {n}/{total} — {percent}%   → {reported, non-blocking}
```

**If Must Have features are missing:**

```
⛔ BLOCKING — {count} Must Have feature(s) not implemented.

  For each missing feature, decide:
  1. Add a mission to implement it now
  2. Descope (move to Should Have or defer — requires explicit confirmation)

The finalization workflow cannot begin until all Must Have features are accounted for.
```

**After final checkup passes:**

```
Final checkup: PASS ✓
Must Have: {n}/{n} — 100%
Should Have: {n}/{total} — {percent}% (non-blocking)

→ Proceeding to finalization workflow.
```

---

## Rules

1. **Never bypass a blocking gate** — if the checkup fails, the gap must be fixed, not skipped
2. **Re-run after every fix** — never assume a fix resolves the issue without re-running the table
3. **Every checkup result is saved** — append the passed checkup table to the current step's deliverable
4. **Partial coverage counts as a gap** — ⚠ Partial items must be resolved or explicitly deferred
5. **Should Have gaps are user decisions** — never auto-decide for the user whether to add or defer

---

## Saving checkup results

After a checkup passes, append to the current step's deliverable:

<output-format>
## Checkup — {source} vs {target} (passed)

| Item | Coverage | Status |
|------|----------|--------|
| {item_1} | {where} | ✓ |
| {item_2} | {where} | ✓ |

Must Have: {n}/{n} — 100% ✓
Should Have: {n}/{total} — {percent}%
</output-format>
