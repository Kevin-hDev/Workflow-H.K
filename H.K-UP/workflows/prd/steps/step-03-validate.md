---
step: "03"
name: "PRD Validation"
workflow: prd
agent: stratege
---

# Step 03 — PRD Validation

> **CRITICAL — Rule 1:** Do NOT advance past a section until the user explicitly validates it.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** Track validation status with ✓ / ← / pending for every section and feature.
> **CRITICAL:** Apply changes immediately when requested. Re-present the section after any edit.
> **CRITICAL:** Once ALL sections are validated, update prd.md status from "draft" to "validated".

---

## Goal

Walk through every section of prd.md with the user.
Each section is confirmed or adjusted before moving to the next.
No section is left unreviewed. The result is a user-confirmed PRD.

---

## How to run the validation

- Present the current section content in full.
- Ask: "Does this accurately capture what you want? Any changes?"
- If changes → apply immediately, re-present the updated section, re-ask.
- If confirmed → mark ✓, move to the next section.
- Never present the next section until the current one is ✓.

---

## Validation tracker

Maintain and display this tracker at the start of each section review:

<output-format>
PRD Validation — {project_name}

  Section 1  — Overview                  {✓ / ← / pending}
  Section 2  — Users & Personas          {✓ / ← / pending}
  Section 3  — Must Have Features        {✓ / ← / pending}
    F1: {feature_name}                   {✓ / ← / pending}
    F2: {feature_name}                   {✓ / ← / pending}
    F3: {feature_name}                   {✓ / ← / pending}
    ...
  Section 4  — Should Have Features      {✓ / ← / pending}
  Section 5  — Could Have Features       {✓ / ← / pending}
  Section 6  — Out of Scope              {✓ / ← / pending}
  Section 7  — Technical Constraints     {✓ / ← / pending}
  Section 8  — Design Requirements       {✓ / ← / pending}
  Section 9  — Security Requirements     {✓ / ← / pending}
  Section 10 — Success Metrics           {✓ / ← / pending}
  Section 11 — Risks                     {✓ / ← / pending}

  ← = currently reviewing
</output-format>

---

## Section review sequence

### Sections 1, 2, 6, 7, 8, 9, 10, 11

Present the section content. Ask:

<output-format>
Section {N} — {Section Name}

{section content from prd.md}

──────────────────────────────────────────
  1. Confirm
  2. Change — describe what to modify
</output-format>

On confirmation → mark ✓. On change → edit, re-present, re-ask.

---

### Section 3 — Must Have Features (feature by feature)

Review each feature individually within Section 3.

For each feature:

<output-format>
Section 3 — Must Have Features  ← reviewing

  F{N}: {Feature Name}

  Description: {description}

  User story:
  > As a {user_type}, I want to {action}, so that {benefit}.

  Acceptance criteria:
  - [ ] {criterion_1}
  - [ ] {criterion_2}
  - [ ] {criterion_3}

  Priority: Must Have | Source: {source}

──────────────────────────────────────────
  1. Confirm
  2. Change — describe what to modify
</output-format>

Mark each feature ✓ individually. Move to the next feature only after confirmation.
Do not show all Must Have features at once.

---

### Sections 4 and 5 — Should Have / Could Have

Present as a group (not one by one):

```
Section {N} — {Priority} Features

{all features in this tier}

──────────────────────────────────────────
Do these look right? Any changes to individual features?
You can reference them by number (e.g., "F7 needs a new criterion").
```

Allow targeted edits by feature number. Confirm the full section before moving on.

---

## Handling common change requests

**"This description isn't quite right"**
→ Ask: "How would you describe it?" Then rewrite using the user's words.

**"Remove this feature"**
→ Move it to Section 6 (Out of Scope) with reason "removed at validation".
→ Re-present both Section 3/4/5 and Section 6.

**"Add a feature we missed"**
→ Ask for: name, description, user story, priority.
→ Write it using the standard F{N} format.
→ Add to the appropriate priority section.
→ Assign the next available feature number.

**"The acceptance criteria aren't specific enough"**
→ Propose 2-3 more specific alternatives. User picks or refines.

**"Split this feature into two"**
→ Create F{N}a and F{N}b. Renumber if needed for clarity.

---

## After all sections validated

Once every section shows ✓:

<output-format>
All sections validated.

  Section 1  — Overview                  ✓
  Section 2  — Users & Personas          ✓
  Section 3  — Must Have Features        ✓ ({n} features)
  Section 4  — Should Have Features      ✓ ({n} features)
  Section 5  — Could Have Features       ✓ ({n} features)
  Section 6  — Out of Scope              ✓ ({n} items)
  Section 7  — Technical Constraints     ✓
  Section 8  — Design Requirements       ✓
  Section 9  — Security Requirements     ✓
  Section 10 — Success Metrics           ✓
  Section 11 — Risks                     ✓

Total features: {count} (Must: {n}, Should: {n}, Could: {n})
</output-format>

Update prd.md frontmatter: `status: draft` → `status: validated`

---

## Reflection modes menu

<output-format>
PRD validated. One last chance to explore before the final checkup:

  REFLECTION MODES
  1. Table Ronde  — Final debate with agents on the complete PRD
  2. Conformité   — Legal and compliance review of the PRD

  ─────────────────────────────────────────
  S. Save and proceed to checkup (step-04)
</output-format>

**Before executing any mode above, LOAD its data file:**
- Table Ronde → `data/modes/table-ronde.md`
- Conformité → `data/modes/conformite.md`

---

## Transition

<output-format>
Step 03 complete.

prd.md status updated: draft → validated.
All {N} sections confirmed by user.

→ Step 04 — Final blocking checkup:
  I'll verify that every Must Have from your confirmed direction
  is present in the PRD before handing off to L'Architecte.
</output-format>

Update `hk-up-status.yaml`: `5-2-prd-validation → step-03: done`
Proceed to **step-04-checkup.md**
