---
step: "04"
name: "PRD Checkup"
workflow: prd
agent: stratege
---

# Step 04 — PRD Checkup

> **CRITICAL — Rule 4:** This checkup is a BLOCKING gate. Do NOT hand off until coverage = 100% Must Have.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** Read direction.md NOW. Cross-reference every Must Have item against prd.md.
> **CRITICAL — Rule 10:** Explicit handoff to L'Architecte — announce what is transmitted.
> **CRITICAL:** Update prd.md frontmatter to "final" only after the checkup passes.

---

## Goal

Verify that the PRD is complete before it becomes the contract for all downstream work.
Every Must Have from direction.md must have a matching feature in the PRD.
Missing items block the handoff. Nothing moves forward until coverage is 100%.

---

## Phase 1 — Run the checkup

Read direction.md. Extract every in-scope item (Must Have, Should Have, Could Have).
Read prd.md. Map each direction item to a feature in the PRD.

Present the checkup table:

<output-format>
PRD CHECKUP — direction.md vs prd.md

  Direction Item                          PRD Feature   Status
  ─────────────────────────────────────── ───────────── ─────────
  {must_have_1 from direction.md}         F{N}          ✓ Covered
  {must_have_2 from direction.md}         F{N}          ✓ Covered
  {must_have_3 from direction.md}         —             ✗ MISSING
  {should_have_1 from direction.md}       F{N}          ✓ Covered
  {should_have_2 from direction.md}       F{N}          ⚠ Partial
  {could_have_1 from direction.md}        F{N}          ✓ Covered

  ─────────────────────────────────────────────────────────────────
  Must Have coverage:   {n}/{total} — {percent}%
  Should Have coverage: {n}/{total} — {percent}%
  Could Have coverage:  {n}/{total} — {percent}%
</output-format>

Status legend:
- ✓ Covered — fully addressed by a PRD feature
- ⚠ Partial — addressed but acceptance criteria incomplete
- ✗ MISSING — not found in the PRD

---

## Phase 2 — Handle gaps

### If Must Have items are MISSING → BLOCK

For each missing Must Have item:

```
⛔ BLOCKING — {item} from direction.md is not covered in the PRD.

Here's a draft feature to cover it:

  F{next_N}: {Proposed Feature Name}

  Description: {description based on direction.md context}

  User story:
  > As a {user_type}, I want to {action}, so that {benefit}.

  Acceptance criteria:
  - [ ] {criterion_1}
  - [ ] {criterion_2}

  Priority: Must Have
  Source: direction.md

──────────────────────────────────────────
  1. Add as-is to the PRD
  2. Modify before adding
  3. Skip this item
```

Add the confirmed feature to prd.md Section 3.
Repeat for every missing Must Have.
Re-run the checkup after all gaps are addressed.

### If Should Have items are MISSING → WARN (non-blocking)

```
⚠ WARNING — {item} from direction.md is not in the PRD.
  This is a Should Have — it doesn't block the handoff.

  Would you like to:
  1. Add it to the PRD now (Section 4)
  2. Leave it out — defer to a future version
```

User decides. If added, write the feature using the standard format.

### If partial coverage → fix

```
⚠ {item} is partially covered by F{N} but acceptance criteria are incomplete.

Current criteria:
  - [ ] {existing_criterion}

Suggested additions:
  - [ ] {missing_criterion_1}
  - [ ] {missing_criterion_2}

  1. Add all partial items
  2. Review each one individually
  3. Skip partial items
```

---

## Phase 3 — Re-run until clear

After fixing all Must Have gaps, re-run the checkup.
Present the updated table. Continue until:

```
Must Have coverage: {N}/{N} — 100% ✓
```

Only then proceed to Phase 4.

---

## Phase 4 — Finalize prd.md

Update prd.md frontmatter:
- `status: validated` → `status: final`
- `version: "1.0-draft"` → `version: "1.0"`
- Add: `checkup: passed`

Save the final prd.md.

---

## Handoff — Architecture Workflow

<output-format>
PRD complete and validated.

prd.md saved — status: final.

Summary:
  Features defined: {total} (Must: {n}, Should: {n}, Could: {n})
  Must Have coverage: {n}/{n} — 100% ✓
  Sections validated by user: 11/11

What 🏗️ L'Architecte will receive:
  - project-context.md — full project diagnosis
  - prd.md — complete, validated PRD

→ Architecture Workflow — 🏗️ L'Architecte

  L'Architecte will design the technical architecture to support
  every feature in the PRD, then create the mission plan for
  Le Chirurgien's implementation.
</output-format>

---

## Update status

Update `hk-up-status.yaml`:
- `5-2-prd-validation → step-04: done`
- `phase-5-prd → status: done`
- `5-2-prd-validation → done`
- `phase-6-architecture → status: in-progress`
- `6-1-conception → in-progress`

Proceed to **workflows/architecture/workflow.md**
