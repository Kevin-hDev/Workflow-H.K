# Phase 2 — Agent Teams Deployment

<instructions>
<critical_constraints>
This file replaces Phase 2 of the main SKILL.md when `--teams` is active.
Phase 1 (detection, validation, plan adaptation) has ALREADY been completed.
You have: {output_path}, the roadmap, and the status.yaml.

Execute the steps below IN ORDER. Do not skip or reorder.
Each step must complete before starting the next.
</critical_constraints>
</instructions>

## Step T1 — Create the team

Create the agent team for this session:

```
TeamCreate({ team_name: "hk-mission", description: "H.K dev + review cycle" })
```

## Step T2 — Detect mode (normal or auto)

<important if="--auto is in the arguments">
Skip this step. Go directly to Step T4 (auto mode).
</important>

If `--auto` is NOT in the arguments, offer the choice:

<message>
Before we start, an important choice:

  NORMAL MODE (teams)
  Iris and Mike are deployed as teammates for each mission.
  Iris codes, notifies Mike, Mike reviews, notifies me.
  Between each mission, you validate and can test.

  AUTO MODE (teams)
  Same flow, but I chain 5 missions without stopping.

  1. Normal mode (mission by mission)
  2. Auto mode (5 missions in a row)

Pick a number:
</message>

---

## Step T3 — Normal mode loop (teams)

Initialize a mission counter at 0.
For each mission (up to 5 maximum):

### A. Mark [in-progress]

1. Update the mission status in `*-status.yaml`: `pending` → `in-progress`
2. Update `last_updated`
3. Increment the mission counter

### B. Spawn teammates

Announce to the creator:

<message>
Mission {X.Y} — {title}

Deploying Iris and Mike as teammates...
</message>

Spawn TWO teammates using the Agent tool with the team:

**Iris (dev):**

```
Agent({
  team_name: "hk-mission",
  name: "iris-{counter}",
  model: "sonnet",
  run_in_background: true,
  prompt: (see Iris spawn prompt below)
})
```

**Mike (review):**

```
Agent({
  team_name: "hk-mission",
  name: "mike-{counter}",
  model: "opus",
  run_in_background: true,
  prompt: (see Mike spawn prompt below)
})
```

### C. Iris spawn prompt

<important if="you are composing the Iris spawn prompt">
Include ALL of the following in the prompt. Do not omit any section.
</important>

```
You are Iris, developer of the H.K Context-Limit team.

STEP 1 — Load your workflow:
Use the Skill tool to load /hk-agent-dev. Follow it step by step.

STEP 2 — Your mission:
Execute mission {X.Y} from the plan.
Output folder: {output_path}

IMPORTANT — The project CLAUDE.md contains security and structure rules
that apply to EVERY line of code you write. Verify you have read it
before coding. Every function must pass the security checklist:
  - "If an attacker controls this input, what happens?"
  - "If this operation fails, does it block or let through?"
  - "Am I comparing secrets with ==?"
  - "Can this collection grow indefinitely?"

STEP 3 — When you are done:
Send your report to BOTH recipients using SendMessage:
  1. SendMessage({ type: "message", to: "mike-{counter}", content: "[your full report]" })
  2. SendMessage({ type: "message", to: "team-lead", content: "[your full report]" })

Send to mike-{counter} FIRST (so Mike can start reviewing immediately),
then to team-lead (so Jackson tracks progress).

If your status is debug-failure, still send to both.
Mike will not act on a debug-failure — he will forward it to Jackson.
```

### D. Mike spawn prompt

<important if="you are composing the Mike spawn prompt">
Include ALL of the following in the prompt. Do not omit any section.
</important>

```
You are Mike, reviewer of the H.K Context-Limit team.

STEP 0 — Wait for Iris:
Do NOTHING until you receive a message from iris-{counter}.
When you receive it, read Iris's report carefully.

STEP 0.1 — Handle debug-failure:
If Iris's report contains "Status: debug-failure":
  Do NOT review. Send a message to team-lead:
  SendMessage({ type: "message", to: "team-lead",
    content: "Iris reported debug-failure on mission {X.Y}. Awaiting instructions." })
  Then STOP.

STEP 1 — Load your workflow:
Use the Skill tool to load /hk-agent-review. Follow it step by step.

STEP 2 — Your mission:
Review mission {X.Y} from the plan.
Output folder: {output_path}

IMPORTANT — During your review, actively verify that Iris respected ALL
security and structure rules from the project CLAUDE.md. Flag any violation
in your report.

STEP 3 — When you are done:
Send your report to Jackson:
  SendMessage({ type: "message", to: "team-lead", content: "[your full report]" })
```

### E. Wait for reports

Jackson waits for messages from the teammates:

1. **Iris's report arrives** (to team-lead):
   - Read the report. Verify status.yaml changed to `review`.
   - Check that all tasks are completed and tests were created.
   - If `debug-failure` → go to Step T5 (debug escalation).
   - Announce to creator: "Iris finished dev. Mike is reviewing..."

2. **Mike's report arrives** (to team-lead):
   - Read the report. Verify status.yaml changed to `done`.
   - Check all 3 checkpoints are OK and tests pass.
   - If `debug-failure` → go to Step T5 (debug escalation).

3. **If no report arrives after an extended wait** (teammate freeze/crash):
   - Check status.yaml — if it was not updated, the teammate likely crashed.
   - Inform the creator:

<message>
{Iris/Mike} has not responded. The teammate may have crashed.

  1. Shutdown both teammates and redeploy for this mission
  2. Shutdown both teammates and investigate with /hk-debug
  3. Stop and discuss

Pick a number:
</message>

### F. Shutdown teammates

After Mike's report is validated:

```
SendMessage({ type: "shutdown_request", to: "iris-{counter}" })
SendMessage({ type: "shutdown_request", to: "mike-{counter}" })
```

### G. Commit the mission

```
git add -A && git commit -m "feat(mission-{X.Y}): {brief mission title}"
```

### H. Offer next steps (normal mode only)

<message>
Mission {X.Y} — DONE (committed)

Iris report:
  Tasks: {N}/{N} | Tests: {N} | Files: {N}

Mike report:
  Plan followed: {yes/no} | Logic: {yes/no} | Integration: {yes/no}
  Issues: {N} found, {N} fixed
  {If out-of-scope alerts: "Alerts: {description}"}

Remaining missions: {N}

  1. Move to the next mission ({X.Y+1} — {title})
  2. Test on the UI side / verify manually
  3. View report details
  4. Push to remote
  5. Stop for today

Pick a number:
</message>

If the creator picks 1 → go back to step A with NEW teammates (iris-{counter+1}, mike-{counter+1}).
If the creator picks 2 → wait for "ok" or "continue".
If the creator picks 3 → display full reports, then offer choices again.
If the creator picks 4 → `git push` and confirm.
If the creator picks 5 → save state, shutdown team (`TeamDelete({ team_name: "hk-mission" })`), end.

---

## Step T4 — Auto mode loop (teams)

In auto mode, execute steps A → B → C → D → E → F for each mission.
No step G or H between missions (no creator validation, no individual commits).

After each mission, display a mini-report:

<message>
[AUTO-TEAMS] Mission {X.Y} — DONE ({counter}/5)
  Iris: {N} tasks, {N} tests | Mike: {N} issues fixed
</message>

<important if="Iris or Mike reports an issue or debug-failure">
STOP auto mode immediately. Display the error report to the creator
and switch back to normal mode (Step T3.H) with the usual choices.
</important>

After 5 missions (or no more pending missions):

Commit all auto mode work:
```
git add -A && git commit -m "feat(auto-teams): missions {first_X.Y} to {last_X.Y} — {N} missions completed"
```

→ Go to Step T6.

---

## Step T5 — Debug escalation (teams)

Triggered when Iris or Mike returns a report with `Status: debug-failure`.

**A. Shutdown both teammates immediately:**
```
SendMessage({ type: "shutdown_request", to: "iris-{counter}" })
SendMessage({ type: "shutdown_request", to: "mike-{counter}" })
```

**B. Inform the creator:**

<message>
{Iris/Mike} was unable to resolve a bug after 3 attempts on mission {X.Y}.

Bug: {description from the report}
Attempts: {summary of the 3 tries}

I will investigate the issue with /hk-debug to find the root cause.
</message>

**C. Investigate with /hk-debug:**
Jackson loads the /hk-debug skill and executes the 6 phases of systematic debugging.
Jackson investigates and finds the root cause + the fix to apply.
Jackson does NOT fix it himself — he delegates the correction.

**D. Deploy a correction agent (NOT a teammate):**
Deploy a native Opus subagent via the Agent tool (NOT a teammate):
```
Agent({
  description: "Fix bug on mission {X.Y}",
  prompt: "Fix the following bug. Output folder: {output_path}. Mission: {X.Y}.
    Bug: {root cause}. Fix: {correction instructions}. Affected files: {list}.
    After the fix, run tests to verify everything passes.
    Return a report with: what was fixed, tests passing yes/no.",
  model: "opus",
  mode: "bypassPermissions"
})
```

**E. After correction:**
- If the bug came from Iris: spawn NEW teammates, Mike reviews the corrected mission.
- If the bug came from Mike: mark the mission [done], spawn NEW teammates for next mission.

---

## Step T6 — 5-mission limit (teams)

**If 5 missions reached and more remain:**

<message>
5 missions completed in this conversation!

I recommend refreshing the context to maintain optimal quality:

  1. Run an audit on the last 5 missions (/hk-audit-rules)
  2. Push to remote, then /clear and relaunch (recommended)
  3. Push to remote, then open a new conversation (recommended)
  4. /clear without pushing
  5. Continue in this conversation (not recommended)

Remaining missions: {N}

Pick a number:
</message>

**If all missions are [done]:**

<message>
All missions in the plan are completed!

Summary:
  Quests completed: {N}/{N}
  Missions completed: {N}/{N}
  Total tasks executed: {N}

  1. Run an audit on the completed work (/hk-audit-rules)
  2. Push to remote
  3. Look for another plan in the codebase
  4. Launch a brainstorming session for new features
  5. Done — we're finished!

Pick a number:
</message>

Before ending, always clean up:
```
TeamDelete({ team_name: "hk-mission" })
```

---

<constraints>
1. Jackson NEVER codes and NEVER reviews — even in teams mode.
2. Jackson spawns NEW teammates for EACH mission (fresh context, Rule 10).
3. Jackson shuts down teammates AFTER each mission before spawning new ones.
4. Iris sends her report to BOTH mike-{N} AND team-lead.
5. Mike waits for Iris's message before starting his review.
6. Mike sends his report to team-lead only.
7. If Iris reports debug-failure, Mike does NOT review — he forwards to Jackson.
8. Jackson verifies status.yaml AFTER receiving each report.
9. Jackson always passes {output_path} in teammate spawn prompts.
10. The --auto flag skips ONLY step T2 — Phase 1 ALWAYS runs fully.
11. TeamDelete({ team_name: "hk-mission" }) is called when the session ends (stop, /clear, all done).
</constraints>

<success_criteria>
- The team is created successfully at the start.
- Each mission spawns fresh teammates (iris-{N}, mike-{N}).
- Iris loads /hk-agent-dev and follows the workflow.
- Mike waits for Iris, loads /hk-agent-review and follows the workflow.
- Jackson receives BOTH reports (Iris + Mike) for full visibility.
- Status.yaml is verified after each report.
- Teammates are shut down after each mission.
- The team is deleted when the session ends.
</success_criteria>

<reminder>
- NEVER code or review — deploy teammates
- ALWAYS fresh teammates per mission (shutdown + re-spawn)
- ALWAYS numbered choices for the creator
- Iris sends to mike-{N} AND team-lead
- Mike waits for Iris before starting
- Verify status.yaml after each report
- 5 missions max, then recommend /clear
- TeamDelete({ team_name: "hk-mission" }) on session end
- --auto skips ONLY step T2
</reminder>
