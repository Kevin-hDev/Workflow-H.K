---
name: hk-teams
description: Use when deploying a team of agents, creating agent teams, multi-agent collaboration, or when the user asks to work with teammates. Triggers on: /hk-teams, agent team, teammate, deploy team, create team, equipe agents, team deploy.
---

# Agent Teams — Deployment

Deploy agent teams via TeamCreate, Agent(team_name), and SendMessage.

## Step 0 — Load /agent-prompt

Before writing any spawn prompt:

```
Use the Skill tool to load /agent-prompt. Follow it for every prompt.
```

Every teammate prompt follows the 6-section structure from /agent-prompt:
context, task, constraints, output_format, success_criteria, reflection.

---

## Step 1 — Create the Team

```
TeamCreate({
  team_name: "<descriptive-name>",
  description: "<what this team accomplishes>"
})
```

The team name should reflect the mission: "auth-refactor", "api-migration", "test-suite".

TeamCreate MUST happen before spawning any teammate — without it, the team
directory does not exist and Agent(team_name) fails.

---

## Step 2 — Design the Composition

Analyze the task. Decide:
- How many teammates (prefer fewer, focused roles over many scattered ones)
- What each teammate does (1 teammate = 1 clear scope)
- Which model per role
- Parallel or sequential execution
- Communication flow (who talks to whom)

### Model Selection

| Role type | Model | Why |
|-----------|-------|-----|
| Dev, test, refactor, search | sonnet | Fast, follows instructions well, cost-effective |
| Review, architecture, complex reasoning | opus | Deep analysis, catches subtle issues |
| Simple formatting, lightweight lookup | haiku | Minimal cost for simple tasks |

---

## Step 3 — Spawn Teammates

For EACH teammate, call Agent with `team_name`:

```
Agent({
  team_name: "<team-name>",
  name: "<unique-name>",
  model: "sonnet",
  run_in_background: true,
  prompt: "<structured prompt>"
})
```

### Required Parameters

| Parameter | Why it matters |
|-----------|---------------|
| `team_name` | Links the agent to the team. Without it, you get a subagent — no messaging, no shared tasks, no CLAUDE.md |
| `name` | Unique ID for message routing. Other teammates use this name to send messages |
| `run_in_background` | Set to `true`. Otherwise the lead blocks until this teammate finishes |
| `prompt` | The full structured instructions (see template below) |

### Spawn Prompt Template

```xml
<context>
You are [role] on team "[team-name]".
Other teammates: [who else, what they work on — so you avoid overlap].
Project context: [only what THIS teammate needs — minimal].
</context>

<task>
[One sentence: what to deliver.]
</task>

<constraints>
- Scope: [which files/dirs to touch]
- Do NOT: [boundaries — files to avoid, operations forbidden]
- Quality: [standard expected]
</constraints>

<output_format>
[Exact format of deliverable — file path, report structure, etc.]
</output_format>

<success_criteria>
- [Measurable condition 1]
- [Measurable condition 2]
</success_criteria>

<reflection>
Before reporting, verify:
- Did you complete every item in the task?
- Does your output match the requested format?
- Did you respect all constraints?
If any answer is no, fix it before reporting.
</reflection>

WHEN DONE — Report via SendMessage:
  SendMessage({ type: "message", to: "team-lead", content: "[your report with results]", summary: "[one-line summary]" })

IF ANOTHER TEAMMATE NEEDS YOUR OUTPUT:
  SendMessage({ type: "message", to: "[teammate-name]", content: "[relevant output]" })
  Send to the teammate FIRST, then to team-lead — so the next teammate can start immediately.

IF YOU ARE BLOCKED by an error you cannot resolve:
  SendMessage({ type: "message", to: "team-lead", content: "Status: blocked\nReason: [description]\nAttempted: [what you tried]", summary: "Blocked: [short reason]" })
  Then STOP. Do not keep retrying.
```

### Skill Delegation

If a teammate needs a specific workflow (e.g., TDD, debugging, audit), tell it
to load the relevant skill instead of duplicating instructions in the prompt:

```
STEP 1 — Load the skill:
Use the Skill tool to load /[skill-name]. Follow it step by step.

STEP 2 — Your mission:
[task description]
```

The skill contains the full workflow. The spawn prompt stays light.
Teammates are full Claude Code instances — they can use the Skill tool.

---

## Step 4 — Coordinate

### Direct Message (preferred)

One teammate to another:
```
SendMessage({
  type: "message",
  to: "reviewer-1",
  content: "Dev complete. Changes in src/auth/. 3 files modified.",
  summary: "Dev done, ready for review"
})
```

### Teammate Reports to Lead

```
SendMessage({
  type: "message",
  to: "team-lead",
  content: "Task complete. [detailed results]",
  summary: "Done: [one-line]"
})
```

### Wait-for-Input Pattern

When a teammate must wait for another before starting:

```
STEP 0 — Wait:
Do NOTHING until you receive a message from [teammate-name].
When you receive it, read the content carefully, then proceed to STEP 1.
```

### Handling Failures

When the lead receives a "blocked" message from a teammate:
1. Read the reason and what was attempted
2. Decide: fix the blocker and send instructions, or shutdown and re-scope
3. Do NOT ignore blocked reports — they indicate the teammate cannot continue

---

## Step 5 — Shutdown and Cleanup

After all teammates have reported and work is complete:

**Shutdown each teammate:**
```
SendMessage({ type: "shutdown_request", to: "worker-1" })
SendMessage({ type: "shutdown_request", to: "worker-2" })
```

**Delete the team:**
```
TeamDelete({ team_name: "<team-name>" })
```

### Fresh Teammates Between Cycles

When starting a new iteration (review feedback incorporated, next pass needed):
1. Shutdown the old teammates
2. Spawn new ones with fresh context

Why: teammates accumulate context over time. After heavy work, their context
degrades — compaction strips important details, attention drifts. Fresh
teammates start with a clean window and follow instructions more reliably.
Research shows isolated sub-agents with fresh context outperform a single
agent with accumulated context by ~90% on complex tasks.

---

## Patterns

### Parallel Workers

Independent tasks on different files/modules:

```
Lead → TeamCreate
Lead → spawn worker-1, worker-2, worker-3 (all run_in_background: true)
Each worker executes independently
worker-N → SendMessage → team-lead (when done)
Lead collects all reports
Lead → shutdown all → TeamDelete
```

### Pipeline

Sequential steps where each output feeds the next:

```
Lead → TeamCreate
Lead → spawn step-1 + step-2 (step-2 has "wait for step-1")
step-1 → SendMessage → step-2 + team-lead
step-2 starts → SendMessage → team-lead
Lead → shutdown all → TeamDelete
```

### Dev + Review Cycle

Code changes that need verification:

```
Lead → TeamCreate
Lead → spawn dev-1 + reviewer-1
dev-1 → SendMessage → reviewer-1 + team-lead
reviewer-1 reviews → SendMessage → team-lead
If issues found:
  Lead → shutdown both
  Lead → spawn dev-2 + reviewer-2 (fresh context, with feedback)
  Repeat until clean
Lead → TeamDelete
```

---

## Things That Go Wrong

| Mistake | What happens | Prevention |
|---------|-------------|------------|
| Missing `team_name` in Agent call | Creates a subagent — no messaging, no CLAUDE.md auto-load | Always pass `team_name` |
| Skipping TeamCreate | Agent call fails — team directory does not exist | TeamCreate is always Step 1 |
| One mega-teammate | Context overload, poor instruction following | 1 teammate = 1 scope |
| Not shutting down | Zombie teammates consume resources | Shutdown after each cycle |
| Vague spawn prompt | Teammate improvises, produces wrong output | Use /agent-prompt structure |
| Broadcast for simple messages | Expensive, noisy — every teammate processes it | Direct message to specific recipient |
| Reusing teammates across cycles | Context degradation, instruction drift | Spawn fresh per cycle |
| Not specifying communication in prompt | Teammate finishes silently, lead never knows | Always include SendMessage instructions |

---

## Key Facts

- Teammates read CLAUDE.md automatically (subagents do not)
- Teammates can use the Skill tool to load any installed skill
- Agent custom files (.claude/agents/*.md) cannot be used as teammate templates — use spawn prompts
- One team per session maximum
- Teammates cannot create their own teams (no nesting)
- The name "team-lead" is reserved — use it to message the lead/orchestrator
- Teammates inherit all tools and permissions from the lead
