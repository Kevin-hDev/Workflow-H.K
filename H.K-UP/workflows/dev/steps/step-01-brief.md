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

<output-format>
This mission brief contains {N} tasks, which exceeds the 2-3 task maximum (Rule 6).

Before I start, L'Architecte needs to split this mission into:
  Mission {N.Xa} — {tasks 1-2 or 1-3}
  Mission {N.Xb} — {remaining tasks}

Please update the brief before we proceed.
</output-format>

---

## Phase 2 — Read the mission brief

Read ONLY the mission brief file. The brief is AUTO-SUFFICIENT — it contains
all the context you need in the Dev Notes section:
- Architecture patterns and constraints
- Coding conventions
- Library guidance
- Security constraints
- Testing expectations
- References to specific source files

If the brief's References section lists specific source files to read before coding,
read those. Do NOT load architecture.md, prd.md, or project-context.md directly.

---

⛔ STOP CHECK
- Mission brief READ (not just listed)? [YES/NO]
- Brief's References section checked and listed source files READ? [YES/NO]
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

<output-format>
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
</output-format>

Proceed directly to **step-02-implement.md**.

---

## Transition

No reflection modes menu — EXECUTION mode does not pause between steps.

<output-format>
Brief loaded.
Tasks: {count}
Baseline: {pass_count}/{total_count} passing
{if mismatch between brief and actual state: "⚠ Brief mismatch noted: {description}"}

→ Step 02 — Implementing tasks.
</output-format>

Update `hk-up-status.yaml`: no change at this step (mission is already `in-progress`).
Proceed directly to **step-02-implement.md**
