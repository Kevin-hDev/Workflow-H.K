---
step: "01"
name: "Brief"
workflow: dev
agent: chirurgien
---

# Step 01 — Brief

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL — Rule 2:** Read ALL context files before touching any source file.
> **CRITICAL:** Run the baseline test suite before any modification. Record the exact counts.
> **CRITICAL — Rule 6:** If the brief has more than 3 tasks, STOP — flag to L'Architecte before proceeding.
> **CRITICAL:** This is EXECUTION mode. No confirmation wait after this step — proceed directly to step-02.

---

## Goal

Load the mission brief. Read every relevant file. Run the baseline test suite to establish
the pre-modification reference. Announce the work plan. Then proceed immediately to step-02.

---

## Phase 1 — Read the mission brief

Read `{output_folder}/missions/mission-{quest_num}-{mission_num}.md`.

Extract and record:
- **Mission ID and title** — used in commit messages and the status update
- **Tasks** — list them in order; identify which comes first based on dependencies within the mission
- **Files to create / modify** — the exact scope of changes
- **References** — files to read before starting
- **Constraints** — project-specific rules that override defaults

**Task count check:**
If the brief has more than 3 tasks → do NOT start.

```
This mission brief contains {N} tasks, which exceeds the 2-3 task maximum (Rule 6).

Before I start, L'Architecte needs to split this mission into:
  Mission {N.Xa} — {tasks 1-2 or 1-3}
  Mission {N.Xb} — {remaining tasks}

Please update the brief before we proceed.
```

---

## Phase 2 — Read context files

Read in this order. Do not skip any — they contain decisions Le Chirurgien must respect.

**1. architecture.md**
Identify the ADRs that apply to this mission:
- Which architectural decisions affect the files being changed?
- What patterns must be followed (service layer, module structure, etc.)?
- What migration strategy applies (strangler fig variant)?

**2. plan.md**
Understand the mission's position in the sequence:
- What missions came before this one? (What can be assumed as done)
- What missions come after? (What interfaces must stay stable to avoid blocking them)
- Does this mission produce output that another mission depends on?

**3. spec-design.md** *(only if the mission involves UI)*
Identify the design constraints:
- Which CSS tokens apply to the components being built?
- Which component patterns from the spec must be followed?
- What ARIA patterns are required for the elements being implemented?

**4. Source files to be modified** *(listed in the brief's "Files to create/modify" table)*
Read each file before touching it:
- Understand the current implementation
- Note the existing patterns (naming, error handling, structure)
- Identify what changes are needed vs. what must stay the same
- Flag any inconsistency between what the brief expects and what actually exists

If what actually exists differs significantly from what the brief assumes → document it in
the announcement (Phase 4). Do not proceed silently with a mismatch.

---

⛔ STOP CHECK
- Mission brief READ (not just listed)? [YES/NO]
- {output_folder}/architecture.md READ (ADRs identified)? [YES/NO]
- {output_folder}/plan.md READ (dependencies understood)? [YES/NO]
- Source files to be modified READ? [YES/NO]
- Ready to run baseline tests? [YES/NO]

⛔ STOP CONDITION: If any check = NO → Go back and READ the file contents before continuing.

---

## Phase 3 — Run baseline tests

Run the full existing test suite before any modification.

```bash
# Run all tests and record the output
{test_command_from_project_context}
# Examples: npm test, cargo test, pytest, ./gradlew test, go test ./...
```

Record:
- Total test count
- Passing count
- Failing count (pre-existing failures — NOT caused by this mission)
- Any tests that error vs. fail (distinction matters for regression tracking)

**If the test suite does not exist or cannot be run:**
Document this clearly. Note that regression cannot be tracked. Proceed with extra care.

**If tests fail before changes:**
These are pre-existing failures. Do NOT mark them as regressions if they still fail after
the mission. Document them explicitly — they belong to a prior state of the codebase.

---

## Phase 4 — Announce the work plan

No interactive confirmation needed. This is EXECUTION mode — announce and proceed.

```
Mission {quest_num}.{mission_num} — {title}

  TASKS
  1. {task_1_description}
     Files: {file_1}, {file_2}

  2. {task_2_description}
     Files: {file_3}

  (3. {task_3_description} — if present)
     Files: {file_4}

  BASELINE TEST SUITE
  {pass_count}/{total_count} passing
  {if pre-existing failures: "⚠ {fail_count} pre-existing test failures (not caused by this mission):"}
  {list pre-existing failures if any}

  ARCHITECTURAL CONSTRAINTS (from architecture.md)
  - {ADR that applies}: {what this means for this mission's code}

  {if spec-design.md applies:}
  DESIGN CONSTRAINTS
  - Tokens: use --{token-name} for {element}
  - Component: {component pattern to follow}

  Starting with Task 1.
```

Proceed directly to **step-02-implement.md**.

---

## Transition

No reflection modes menu — EXECUTION mode does not pause between steps.

```
Brief loaded.
Tasks: {count}
Baseline: {pass_count}/{total_count} passing
{if mismatch between brief and actual state: "⚠ Brief mismatch noted: {description}"}

→ Step 02 — Implementing tasks.
```

Update `hk-up-status.yaml`: no change at this step (mission is already `in-progress`).
Proceed directly to **step-02-implement.md**
