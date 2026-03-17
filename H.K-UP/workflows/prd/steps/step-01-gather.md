---
step: "01"
name: "Gather Inputs"
workflow: prd
agent: stratege
---

# Step 01 — Gather Inputs

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** Read ALL three input documents before proceeding. Never skip one.
> **CRITICAL — Rule 8:** Web searches must be PRECISE — stack + feature + year. Not generic.
> **CRITICAL — Rule 1:** Present the brief to the user and wait for confirmation before step-02.
> **CRITICAL:** If any input is missing, ask the user before continuing.

---

## Goal

Consolidate all inputs from previous workflows. Run targeted web research.
Build a structured brief that will drive the PRD draft in step-02.

---

## Phase 1 — Read all inputs

Read in this order:

**1. project-context.md**
Extract:
- Project name, stack, existing architecture
- User types identified by L'Éclaireur
- Technical constraints and debt inventory
- Confirmed path (Express / Standard / Full / Audit)

**2. direction.md**
Extract:
- Confirmed direction statement
- In-scope items with priorities (Must Have, Should Have, Could Have)
- Out-of-scope items (deferred)
- Key decisions made during brainstorming

**3. brainstorm-session.md**
Extract:
- Method used
- Techniques applied
- State of the art findings (Benchmark Vivant)
- Risk items (Pre-mortem, Chaos Monkey results if used)
- User insights (Focus Group, JTBD, User Wishlist if used)

---

⛔ STOP CHECK
- data/global-rules.md READ (not just listed)? [YES/NO]
- {output_folder}/project-context.md READ (not just listed)? [YES/NO]
- {output_folder}/direction.md READ (not just listed)? [YES/NO]
- {output_folder}/brainstorm-session.md READ (not just listed)? [YES/NO]
- Ready to proceed with web research? [YES/NO]

⛔ STOP CONDITION: If any check = NO → Go back and READ the file contents before continuing.

---

## Phase 2 — Targeted web research

Run one search per Must Have feature category, and one general state-of-the-art search.

**Search pattern for each feature category:**
`"{stack} {feature_category} implementation patterns {year}"`

**Search for user expectations:**
`"{domain} user expectations {year}"`

**Search for technical decisions surfaced in brainstorming:**
`"{stack} {specific_technology} integration best practices {year}"`

**Search for security and compliance if relevant:**
`"{domain} security requirements compliance {year}"`

Limit to 3-5 searches total. Be precise. Record each finding and what it informs.

---

## Phase 3 — Read existing code (if relevant)

If project-context.md references existing implementations of Must Have features:
- Read the relevant files to understand the current state
- Note what already exists vs. what needs to be built
- Flag any conflicts between current implementation and the new direction

This prevents writing requirements that contradict existing, working code.

---

## Phase 4 — Compile the brief

Organize all gathered inputs into a structured brief:

```
PRD INPUT BRIEF — {project_name}

FROM YOUR BRAINSTORM
  Direction: {direction_statement}

  Must Have:
  - {item_1}
  - {item_2}
  - {item_3}

  Should Have:
  - {item_4}
  - {item_5}

  Out of Scope:
  - {item_6} — {reason}

FROM WEB RESEARCH
  - {finding_1} — informs: {feature or decision}
  - {finding_2} — informs: {feature or decision}
  - {finding_3} — informs: {feature or decision}

FROM EXISTING CODE
  - {already_exists} — will be extended/kept as-is
  - {gap} — must be built from scratch

USER TYPES (from project-context.md)
  - {user_type_1}: {role and primary need}
  - {user_type_2}: {role and primary need}

TECHNICAL CONSTRAINTS
  - {constraint_1}
  - {constraint_2}
```

---

## Phase 5 — Present and confirm

Present the brief to the user:

```
Before I draft the PRD, here's everything I'll base it on:

{brief content above}

Anything to add or correct before I start writing?
```

Wait for the user's response. They may:
- Confirm as-is
- Add a missing context item
- Correct a misread from the session
- Remove something that changed

Make adjustments. Re-present if changes are significant.

---

## Reflection modes menu

```
Brief confirmed. Would you like to explore before writing?

  REFLECTION MODES
  1. Prisme        — Review the brief from Business + User perspectives
  2. Benchmark Vivant — Deeper research on a specific feature area

  ─────────────────────────────────────────
  S. Save and draft the PRD (step-02)
```

---

## Transition

```
Step 01 complete.

Brief confirmed. Ready to write the PRD.
Must Have items: {count}
Should Have items: {count}
User types identified: {count}

→ Step 02 — I'll now write the PRD section by section.
  You'll review and validate each section before we move to the next.
```

Update `hk-up-status.yaml`: `5-1-prd-draft → step-01: done`
Proceed to **step-02-draft.md**
