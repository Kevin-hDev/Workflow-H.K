---
step: "02"
name: "Implement"
workflow: dev
agent: chirurgien
---

# Step 02 — Implement

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL — Rule 5:** Tests WITH the code. A task without a passing test is NOT done.
> **CRITICAL:** If a baseline test breaks → STOP. Fix the regression before the next task.
> **CRITICAL:** Strict scope — implement what the brief says. Nothing more.
> **CRITICAL:** One commit per task. Broken test suite must never be committed.

---

## Goal

Execute each task from the brief in order. For each task: implement the minimum change, write
tests that genuinely verify the behavior, run the full suite, commit atomically. Never leave
a broken test suite between tasks.

---

## The task loop

Repeat this cycle for every task in the mission brief, in order.

---

### Phase A — Implement the code change

Make the minimum change needed to complete this task.

**What "minimum change" means:**
- Implement only what the task description requires
- Do not clean up adjacent code that is not part of the task
- Do not improve the style or naming of things you are not changing
- Do not extract abstractions that are not needed for this task

**What "minimum change" does NOT mean:**
- Hacking together something that barely works
- Leaving the codebase in a worse state than you found it
- Ignoring error handling for the changed code paths

**Follow the decisions from architecture.md:**
- If an ADR specifies a service layer pattern, use it — don't bypass it
- If the migration strategy is strangler fig: keep the old code functional
  until this task's new code is verified and committed
- Module boundaries defined by L'Architecte are not optional

**Follow the design from spec-design.md (UI tasks only):**
- Use CSS tokens exclusively — no hardcoded hex, px, or font names
- Follow the component pattern documented for this element
- Apply the ARIA pattern specified for this component type
- Anti-AI-slop: the confirmed direction's signature element must be visible

**Follow existing conventions:**
- Naming conventions detected by L'Éclaireur (camelCase, snake_case, etc.)
- Error handling patterns used elsewhere in the codebase
- Import organization (alphabetical? by type? grouped by domain?)
- File structure and comment style

---

### Phase B — Write tests WITH the code

Tests are not optional. Tests are not written after. Tests are written in the same task,
as part of it.

**What must be tested:**
- The happy path: the new behavior works as expected
- Key edge cases: empty input, boundary values, null/undefined where applicable
- Error paths: what happens when it fails (if the code handles errors)

**Test quality rules:**
- Each test asserts a specific, meaningful behavior — not just "it runs without crashing"
- Test names describe the scenario: `should reject negative values`, not `test_1`
- Do not mock what you can test with real inputs
- Do not test implementation details — test behavior from the caller's perspective

**If a test cannot be written for a task:**
This is a signal that the task is either too vague (needs clarification) or that the
code design is untestable (needs a small refactor to make it injectable/isolated).
Do NOT proceed with untestable code — fix the design first.

**Anti-fraud rule (Principle #6):**
A test that passes but does not verify meaningful behavior is fraud.
A test that always passes regardless of the implementation is fraud.
If you write a test, it must be capable of failing when the behavior is wrong.

---

### Phase C — Verify

After writing the code and tests for this task, run the full test suite.

```bash
{test_command_from_project_context}
```

**Expected result:**
```
Baseline:  {baseline_pass_count}/{baseline_total} passing (from step-01)
After:     {new_pass_count}/{new_total} passing
New tests: +{count}
Result:    ✓ All passing
```

**If any baseline test breaks:**

```
⚠ REGRESSION DETECTED — Task {N} is blocked.

Test that broke: {test_name}
Expected before: {passing}
Result now: {failing}
Likely cause: {what this task changed that could affect it}

Fixing regression before proceeding.
```

Do NOT proceed to commit. Do NOT proceed to the next task.
Fix the regression first. Re-run the suite. Confirm everything is green before continuing.

**If the new tests fail:**
Fix the code or the test (whichever is wrong) before committing.
A commit with failing tests is never acceptable.

---

### Phase D — Commit

One commit per task. The commit message tells the story of WHAT changed and WHY.

```bash
git add {specific files — never git add .}
git commit -m "{type}({scope}): {what changed}

{optional body: why this change was needed, referencing the ADR or mission if helpful}"
```

**Commit types:**
- `feat` — new feature or capability
- `refactor` — restructuring without behavior change
- `fix` — correcting a bug
- `test` — adding tests without changing source
- `style` — formatting (not behavior) — use sparingly
- `docs` — documentation only

**Scope examples:** `auth`, `api`, `dashboard`, `user-service`, `db-schema`

**Good commit messages:**
```
feat(auth): extract session middleware from routes to auth/middleware.js
refactor(api): move validation logic from controllers to service layer
test(dashboard): add unit tests for KPI calculation edge cases
```

**Bad commit messages:**
```
fix: stuff
update files
WIP
```

After committing, mark the task as `[x]` in the mission brief file.

---

### Phase E — Log the task completion

```
Task {N} complete.
  Files modified: {list}
  Tests added: {count} ({test names or descriptions})
  Test suite: {pass_count}/{total_count} — all passing ✓
  Commit: {short_hash} — {message}
```

---

## After all tasks are complete

When every task in the brief is marked `[x]` and the test suite is fully green:

```
All {N} tasks complete.

  Task 1: [x] {title} — {commit_hash}
  Task 2: [x] {title} — {commit_hash}
  {Task 3: [x] {title} — {commit_hash}}

  Final test suite: {pass_count}/{total_count} passing ✓
  New tests added: {total_new_tests}
  Regressions: 0

→ Step 03 — Final verification and handoff to Le Gardien.
```

Proceed to **step-03-verify.md**

---

## Edge cases

**If a task is blocked by something outside the brief:**

```
⚠ Task {N} is blocked.

Blocker: {what is preventing execution — missing dependency, unexpected state, etc.}
This blocker is outside the scope of this mission brief.

Options:
  1. Unblock by adding a minimal prerequisite (describe what — get user confirmation)
  2. Escalate to L'Architecte (this requires a plan change)
  3. Skip this task and mark it as blocked in the brief
```

Do not silently work around a blocker. Surface it.

**If the brief and the actual code diverge significantly:**

```
⚠ Brief mismatch for Task {N}.

The brief expects: {what the brief says}
The actual state:  {what the code actually is}

Proceeding with the actual state as the starting point.
Adjusting the implementation accordingly: {what changes from the original plan}
```

Document the deviation. Do not pretend the brief was correct.

**If implementing a task would break a downstream mission:**

```
⚠ Potential downstream impact detected.

This task changes: {interface / module / schema}
Mission {N.X} depends on: {what it expects}
Conflict: {how the change might break the downstream mission}

Adjusting approach to preserve the interface: {what will be done differently}
```

Surface the conflict rather than ignoring it.
