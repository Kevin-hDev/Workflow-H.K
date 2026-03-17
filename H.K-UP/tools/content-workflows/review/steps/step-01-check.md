---
step: "01"
name: "Check"
workflow: review
agent: gardien
---

# Step 01 — Check

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** BOTH constructive AND adversarial reviews are mandatory on every mission.
> **CRITICAL:** Fix issues directly. Never list problems without resolving them.
> **CRITICAL — Rule 5:** Run the test suite after any correction. Green tests required for `done`.
> **CRITICAL — Rule 4:** `done` is only set when both review passes clear (original or after corrections).

---

## Goal

Two-pass review of every mission: constructive (does it work?) then adversarial (can it break?).
Fix any findings directly. Run the test suite to confirm corrections. Mark `done`.
After the last mission of a Quest: run the phase checkup.

---

## Setup — Read inputs

Before any review, read:
1. Mission brief + completion report: `{output_folder}/missions/mission-{N}.md`
   - Extract the task list (what should have been done)
   - Extract the files modified list
   - Note any deviations Le Chirurgien flagged
2. `git diff {first_commit}^..HEAD` — the actual code changes
3. `{output_folder}/architecture.md` — the ADRs this mission must respect
4. `{output_folder}/plan.md` — confirm mission scope was not exceeded

---

⛔ STOP CHECK
- Mission brief + completion report READ (not just listed)? [YES/NO]
- git diff READ (actual code changes reviewed)? [YES/NO]
- {output_folder}/architecture.md READ (ADRs for this mission identified)? [YES/NO]
- {output_folder}/plan.md READ (mission scope confirmed)? [YES/NO]
- Ready to start review? [YES/NO]

⛔ STOP CONDITION: If any check = NO → Go back and READ the file contents before continuing.

---

## PART 1 — Constructive Review

### Control Point 1: Plan followed?

For each task marked `[x]` in the brief:
- Find the corresponding code change in the diff
- Verify a test exists for this task (mandatory per Rule 5)
- Check that the brief's "Files to create/modify" table matches reality

```
Plan Check — Mission {quest_num}.{mission_num}

  Task 1: [x] {title}
    Code change: {found in diff — file(s) modified} ✓ | ✗ {missing or doesn't match}
    Test:        {test name} ✓ | ✗ {no test or test doesn't assert meaningful behavior}

  Task 2: [x] {title}
    Code change: {found} ✓ | ✗
    Test:        {found} ✓ | ✗

  Result: ✓ PASS | ✗ ISSUES — {list}
```

### Control Point 2: Logic correct?

Read each modified file. Trace the logic end to end.

Questions to ask for each changed function/module:
- Does it do what the brief says it should do? (Not "does it compile" — does it solve the problem?)
- Are return values handled by callers?
- Do error paths behave correctly (fail closed, not silently)?
- Are boundary conditions handled (empty, zero, null, max)?
- Does the test actually verify meaningful behavior (anti-fraud check)?

```
Logic Check — Mission {quest_num}.{mission_num}

  {file_1}:
    {function/module}: ✓ logic traces correctly | ⚠ {specific issue}

  {file_2}:
    {function/module}: ✓ | ⚠ {specific issue}

  Result: ✓ PASS | ✗ ISSUES — {list}
```

### Control Point 3: Integration OK?

```
Integration Check — Mission {quest_num}.{mission_num}

  Imports resolve:     ✓ | ✗ {what's broken}
  Interfaces match:    ✓ | ✗ {what contract is violated}
  No broken exports:   ✓ | ✗ {what downstream code depends on}
  DB schema:           ✓ | N/A (no schema change)
  API contracts:       ✓ | N/A (no API change)

  Result: ✓ PASS | ✗ ISSUES — {list}
```

### Constructive summary

```
CONSTRUCTIVE REVIEW — Mission {quest_num}.{mission_num}

  Plan followed:   ✓ PASS | ✗ {issues}
  Logic correct:   ✓ PASS | ✗ {issues}
  Integration OK:  ✓ PASS | ✗ {issues}

  Overall: ✓ PASS | ✗ {count} issues found
```

---

## PART 2 — Adversarial Review

Five checks on every mission. No skipping — even if the mission seems low-risk.

### Check 1: Unvalidated inputs

Scan every function that accepts parameters originating from outside this module
(user input, API payload, database value, file content, environment variable).

For each such function:
- Is the type verified?
- Is the length/range bounded?
- Is the format/pattern validated?
- SQL queries: are they parameterized (prepared statements)?
- HTML output: is it escaped or sanitized?
- File paths: is `..` traversal prevented?

```
  Unvalidated inputs:
    {file:line} — {function receives external input without validation} ⚠
    {file:line} — ✓ all inputs validated before use
```

### Check 2: Silent failures

Scan every error handling path in the diff.

Red flags:
- `catch {}` or `catch (e) {}` with no body
- `catch` that logs but returns a success value
- Ignored promise rejections (floating `.then()` with no `.catch()`)
- Optional chaining `?.` used where a missing value should be an error
- Default values that mask errors (`?? ""`, `?? 0` hiding null/undefined propagation)

```
  Silent failures:
    {file:line} — catch block swallows exception without re-throwing ⚠
    {file:line} — ✓ errors propagate correctly (fail closed)
```

### Check 3: Secret handling

```
  Secret handling:
    {file:line} — hardcoded credential or token ⚠ (CRITICAL)
    {file:line} — secret compared with == instead of constant-time comparison ⚠
    {file:line} — token generated with Math.random() or equivalent ⚠
    {file:line} — secret value passed to logger or console ⚠
    {file:line} — ✓ secrets sourced from env/keystore, compared correctly, not logged
```

### Check 4: Edge cases

Derive edge cases from the brief's business logic. Common candidates:
- Empty collection passed to iteration logic
- Zero or negative numeric input
- Concurrent access to shared state
- Very large inputs (what is the practical maximum?)
- Missing required fields in objects
- Unicode or special characters in string inputs
- Expired/invalid tokens or sessions not yet handled

For each edge case identified:
- Is there a test covering it?
- Does the code handle it correctly?

```
  Edge cases:
    {scenario}: ✓ covered by test {test_name}
    {scenario}: ✗ not handled — {what happens and why it matters}
```

### Check 5: Exposed internals

Scan every error response, log statement, and exception message.

Red flags:
- File system paths visible in error responses
- Stack traces returned to the client
- SQL query text or table names in error messages
- Library names and versions in responses
- Internal identifiers (user IDs, session tokens) logged at a level accessible to clients
- Debug endpoints left in production paths

```
  Exposed internals:
    {file:line} — stack trace returned in API error response ⚠
    {file:line} — ✓ error messages are generic, no internal info exposed
```

### Adversarial summary

```
ADVERSARIAL REVIEW — Mission {quest_num}.{mission_num}

  1. Unvalidated inputs:  ✓ PASS | ✗ {count} finding(s)
  2. Silent failures:     ✓ PASS | ✗ {count} finding(s)
  3. Secret handling:     ✓ PASS | ✗ {count} finding(s)
  4. Edge cases:          ✓ PASS | ✗ {count} finding(s)
  5. Exposed internals:   ✓ PASS | ✗ {count} finding(s)

  Overall: ✓ PASS | ✗ {total_count} findings
```

---

## PART 3 — Fix or Done

### If both parts pass with no issues

Run the test suite to confirm:

```bash
{test_command}
```

Mark done:

```
Review complete. Mission {quest_num}.{mission_num} → done.

  Constructive: ✓ PASS
  Adversarial:  ✓ PASS
  Tests:        {pass}/{total} — all passing ✓

hk-up-status.yaml updated: mission → done
```

Append to the mission brief:

```markdown
### Review — Le Gardien ({date})
Constructive: ✓ PASS
Adversarial:  ✓ PASS
Result: done — no corrections needed
```

### If issues were found

Fix every finding directly. Do not send a list back to Le Chirurgien.

For each finding:
1. Make the fix in the relevant file
2. Write or update the test that would catch this issue
3. Note what was changed

After all fixes:

```bash
{test_command}
```

Confirm all tests pass (including the new tests for the fixes).

Then mark done:

```
Review complete with corrections. Mission {quest_num}.{mission_num} → done.

  Constructive: ✓ PASS {(after corrections)}
  Adversarial:  ✓ PASS ({N} findings corrected)

  Corrections applied:
    - {file_1:line}: {what was fixed — e.g., "added input length validation before processing"}
    - {file_2:line}: {what was fixed — e.g., "replaced catch {} with proper error propagation"}
    - {file_3:line}: {what was fixed — e.g., "replaced Math.random() with crypto.randomBytes()"}

  Tests: {pass}/{total} — all passing ✓

hk-up-status.yaml updated: mission → done
```

Append to the mission brief:

```markdown
### Review — Le Gardien ({date})
Constructive: ✓ PASS {(after corrections if applicable)}
Adversarial:  {N} findings corrected:
  - {file:line}: {fix description}
  - {file:line}: {fix description}
Result: done
```

### Escalation to L'Architecte

If a finding reveals a design problem that cannot be fixed at the code level
(architectural inconsistency, ADR violation, scope that exceeds the mission):

```
⚠ Architectural issue detected — escalating to L'Architecte.

Finding: {description}
Why this can't be fixed in this mission: {reason}
What L'Architecte needs to decide: {specific question}

Mission {quest_num}.{mission_num} is held at `review` until L'Architecte responds.
```

Do NOT mark `done` when escalating. The mission stays at `review`.

---

## PART 4 — Phase checkup (after last mission of a Quest)

Run this check only after the final mission of a Quest/phase is marked `done`.

**Method:** same format as all H.K-UP checkups (data/checkup-system.md).

```
Phase Checkup — Quest {N}: {quest_name}

  Planned objectives                    Covered by missions?
  ─────────────────────────────────     ───────────────────
  {objective_1 from plan.md}            ✓ Mission {N.X}
  {objective_2 from plan.md}            ✓ Mission {N.Y}, {N.Z}
  {objective_3 from plan.md}            ✗ NOT COVERED

  Missions completed: {count}
  Coverage: {M}/{N} objectives covered

  Architectural consistency across missions:
  ✓ No inconsistency detected | ⚠ {specific issue found}

  → {If 100% and no inconsistency}: Quest {N} done.
  → {If gaps}: {action to take before marking Quest done}
```

If the Quest is complete, update `hk-up-status.yaml`:
- Quest/phase → `done`
- `current_phase` → next phase number

---

## Reflection modes menu

Offered only after the phase checkup (not after individual missions — the review is atomic).

```
Quest {N} complete. Any final analysis?

  REFLECTION MODES
  1. Table Ronde  — Discuss findings across this Quest's missions
  2. Prisme       — Technical: consistency, performance, maintainability
                  — Échec: what could still break?

  ─────────────────────────────────────────
  S. Continue to next mission or Quest
```

**Before executing any mode above, LOAD its data file:**
- Table Ronde → LOAD `data/modes/table-ronde.md`
- Prisme → LOAD `data/modes/prisme.md` + `data/prisme-facettes.csv`

---

## Transition

Per mission:

```
Mission {quest_num}.{mission_num}: done ✓
{Corrections: N applied | No corrections needed}

→ {Next mission in Quest | Quest complete → notify user, proceed to Quest {N+1}}
```

After Quest complete:

```
Quest {N} — {quest_name}: done ✓
Missions completed: {count}
Corrections applied across Quest: {total_count}

→ Notify user — ready for Quest {N+1} or finalization workflow
```

Update `hk-up-status.yaml` accordingly.
