# H.K Context-Limit — Tutorial

> **Original creator: [Kevin Huynh](https://github.com/Kevin-hDev)**

## Prerequisites

- [Claude Code](https://claude.ai/claude-code) installed and configured
- A project you want to implement (with or without an existing plan)

## Step 1 — Install

```bash
npx hk-context-limit install
```

This installs the skills and agents to your global `~/.claude/` directory. You only need to do this once.

## Step 2 — Start a conversation

Open Claude Code in your project directory and type:

```
/hk-dev-and-review
```

Jackson will introduce himself and start looking for your project files.

## Step 3 — Jackson detects your project

Jackson looks for a `*-output/` folder containing `roadmap.md` and `*-status.yaml`.

**If found:** Jackson shows your progress and offers to resume.

**If not found:** Jackson searches your codebase for a plan file (`*plan*`, `*roadmap*`, `*spec*`, etc.).

**If a plan exists:** Jackson reads it and offers to adapt it to the Quest/Mission format:
- He scans your codebase first to understand what already exists
- He creates `{project}-output/roadmap.md` with your plan restructured
- He creates `{project}-output/{project}-status.yaml` to track progress

**If no plan exists:** Jackson suggests brainstorming with `/hk-brainstorm` in a new conversation.

## Step 4 — Choose the mode

### Deployment mode

Jackson can deploy Iris and Mike in two ways:

- **Subagents (default)** — Jackson deploys Iris then Mike sequentially. Simple and stable.
- **Agent teams (`--teams`)** — Jackson creates a team. Iris notifies Mike directly when done. Peer-to-peer communication.

### Execution mode

- **Normal mode (1):** Mission by mission. You validate between each one and can test the UI.
- **Auto mode (2):** 5 missions in a row without stopping. Faster, but you don't validate between missions. If an error occurs, Jackson automatically falls back to normal mode.

All 4 combinations:
```
/hk-dev-and-review                # Normal + subagents
/hk-dev-and-review --auto         # Auto + subagents
/hk-dev-and-review --teams        # Normal + agent teams
/hk-dev-and-review --teams --auto # Auto + agent teams
```

## Step 5 — The dev/review cycle

### In subagent mode (default)

For each mission, Jackson:

1. Marks the mission `[in-progress]`
2. **Deploys Iris** (Sonnet) — she reads the brief, codes, writes tests, marks `[review]`
3. Verifies Iris's report (tasks completed, tests created)
4. **Deploys Mike** (Opus) — he checks 3 points (plan followed, logic correct, integration OK), fixes any issues, runs adversarial review, marks `[done]`
5. Verifies Mike's report (checkpoints OK, tests passing)
6. Shows you a summary and offers next steps

### In agent teams mode (`--teams`)

The cycle is similar but with direct communication:

1. Jackson creates a team and deploys iris-1 + mike-1 as teammates
2. **Iris codes** — when done, she sends her report to Mike AND Jackson via SendMessage
3. **Mike receives the report** and starts his review automatically (no need for Jackson to relay)
4. Mike sends his report to Jackson
5. Jackson shuts down both teammates and creates new ones for the next mission

## Step 6 — After 5 missions

Jackson recommends refreshing the context:
- `/clear` and relaunch `/hk-dev-and-review`
- Or open a new conversation

This keeps the context fresh and maintains quality.

## Debug Escalation

If Iris or Mike encounters a bug they can't fix after 3 attempts:
1. They return to Jackson with a detailed failure report
2. Jackson investigates with `/hk-debug` (root cause analysis, 3 hypotheses)
3. Jackson deploys a correction agent with precise fix instructions
4. The loop resumes normally

## Brainstorming

In a **new conversation**, type:

```
/hk-brainstorm
```

Iris (in facilitator mode) guides you through a structured brainstorming session:
- Choose a depth: Rapid (15 min), Deep (30 min), or Exhaustive (60+ min)
- 15 techniques available (SCAMPER, First Principles, Shark Tank, Pre-mortem, etc.)
- Web research integrated
- Ends with a prioritized Top 3 and action plan

## Tips

- **Always use a new conversation** for brainstorming — fresh context produces better ideas
- **The creator always decides** — Jackson, Iris, and Mike propose but never impose
- **Numbered choices everywhere** — just type a number to choose, you never have to write sentences
- **Plans with existing code** — Jackson scans your codebase before creating a plan, so tasks reference existing files and respect your conventions
- **Check the status file** — `{project}-output/{project}-status.yaml` always reflects the current state of your project
