# H.K Context-Limit

> **Original creator: [Kevin Huynh](https://github.com/Kevin-hDev)**
> If you fork and publish this workflow, you must credit the original creator at the top of your README.

A token-efficient dev & review workflow for [Claude Code](https://claude.ai/claude-code). Orchestrates sub-agents to implement projects mission by mission while keeping the main conversation context clean.

## How It Works

```
You (creator) → Jackson (Opus orchestrator)
                    ├── Iris (Sonnet) → codes + tests each mission
                    └── Mike (Opus)   → reviews + fixes each mission
```

**Jackson** never codes. He detects your project state, adapts your plan to a Quest/Mission format, then deploys **Iris** and **Mike** as fresh sub-agents for each mission. After 5 missions, he recommends refreshing the conversation.

### Key Features

- **Quest/Mission structure** — Plans broken into Quests > Missions > Tasks (2-3 max per mission)
- **Fresh context every time** — New sub-agents for each mission, no context accumulation
- **Auto mode** — `--auto` flag runs 5 missions in a row without stopping
- **Debug escalation** — If Iris or Mike fails 3 times, Jackson investigates with `/hk-debug` and deploys a correction agent
- **Codebase scan** — Jackson scans existing code before creating a plan to avoid duplication
- **Interactive mode** — Numbered choices everywhere, the creator never has to think alone
- **Brainstorming** — `/hk-brainstorm` for structured ideation with 15 techniques and 3 depth levels

## Installation

```bash
npx hk-context-limit install
```

This copies the skills and agents to your global Claude Code configuration:
- Skills → `~/.claude/skills/`
- Agents → `~/.claude/agents/`

### Manual Installation

If you prefer manual setup, copy the files yourself:

```bash
# Skills
cp -r skills/hk-dev-and-review ~/.claude/skills/
cp -r skills/hk-agent-dev ~/.claude/skills/
cp -r skills/hk-agent-review ~/.claude/skills/
cp -r skills/hk-brainstorm ~/.claude/skills/
cp -r skills/hk-debug ~/.claude/skills/

# Agents
cp agents/iris.md ~/.claude/agents/
cp agents/mike.md ~/.claude/agents/
```

## Usage

### Dev & Review (main workflow)

```
/hk-dev-and-review          # Normal mode — mission by mission
/hk-dev-and-review --auto   # Auto mode — 5 missions in a row
```

Jackson will:
1. Look for a `*-output/` folder with `roadmap.md` and `*-status.yaml`
2. If found: offer to resume where you left off
3. If not found: search for a plan in your codebase, or suggest brainstorming
4. For each mission: deploy Iris (dev) → verify → deploy Mike (review) → verify → next

### Brainstorming

```
/hk-brainstorm                    # Standard depth
/hk-brainstorm --deep             # 3 techniques, 30-50 ideas
/hk-brainstorm --exhaustive       # 5 techniques, 100+ ideas
```

### Debugging

```
/hk-debug <bug description>
```

## The Team

| Agent | Model | Role |
|-------|-------|------|
| **Jackson** | Opus | Orchestrator — coordinates, never codes |
| **Iris** | Sonnet | Developer — codes with tests, surgical precision |
| **Mike** | Opus | Reviewer — 3 checkpoints, adversarial review, fixes directly |

## Status Cycle

```
pending → in-progress → review → done
```

| Status | Meaning | Set by |
|--------|---------|--------|
| pending | Mission not started | Jackson |
| in-progress | Iris is coding | Jackson (before deploying Iris) |
| review | Code complete, awaiting review | Iris (after dev + tests) |
| done | Review validated, all tests pass | Mike (after review + fixes) |

## Project Structure

```
H.K-CONTEXT-LIMIT/
├── skills/
│   ├── hk-dev-and-review/SKILL.md   # Jackson orchestrator
│   ├── hk-agent-dev/SKILL.md        # Iris dev workflow
│   ├── hk-agent-review/SKILL.md     # Mike review workflow
│   ├── hk-brainstorm/               # Brainstorming (Iris, 15 techniques)
│   │   ├── SKILL.md
│   │   └── steps/                   # 5-step brainstorm workflow
│   └── hk-debug/SKILL.md            # Systematic debugging (6 phases)
├── agents/
│   ├── iris.md                      # Dev agent (Sonnet)
│   └── mike.md                      # Review agent (Opus)
├── data/                            # Personalities, rules, templates
│   ├── global-rules.md              # 10 rules for all agents
│   ├── jackson-personality.md
│   ├── iris-personality.md
│   ├── mike-personality.md
│   ├── template-roadmap.md          # Quest/Mission plan template
│   └── template-status.yaml         # Status tracking template
└── CLAUDE.md                        # Project-level Claude Code config
```

## Rules

The workflow enforces 10 non-negotiable rules (see `data/global-rules.md`):

1. The creator always decides
2. Understand before modifying
3. Interactive mode with numbered choices
4. 2-3 tasks maximum per mission
5. Mandatory tests with code
6. Save state after every action
7. Each agent stays in their role
8. 5 missions maximum per conversation
9. Explicit transition between steps
10. Sub-agents always fresh

## License

MIT — see [LICENSE](LICENSE)

**Original creator: [Kevin Huynh](https://github.com/Kevin-hDev)**
