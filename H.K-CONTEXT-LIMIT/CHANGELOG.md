# Changelog

All notable changes to H.K Context-Limit will be documented in this file.

## [1.0.0] - 2026-03-19

### Added
- **Jackson** (Opus) — Orchestrator skill `/hk-dev-and-review` with auto mode (`--auto`)
- **Iris** (Sonnet) — Dev agent with surgical precision, tests-with-code, 3-attempt debug rule
- **Mike** (Opus) — Review agent with 3 checkpoints, adversarial review, scoped corrections
- **Debug escalation** — 3-attempt limit then Jackson investigates with `/hk-debug` and deploys a correction agent
- **Codebase scan** — Jackson scans existing code before creating a plan to avoid duplication
- **Auto mode** — Run 5 missions in a row without stopping, with fallback to normal mode on errors
- **Interactive mode** — Numbered choices everywhere, the creator never thinks alone
- **Quest/Mission format** — Plans structured as Quests > Missions > Tasks (2-3 max per mission)
- **Status tracking** — `(project)-status.yaml` with cycle: pending > in-progress > review > done
- **/hk-brainstorm** — Creative brainstorming with Iris (15 techniques, 3 depth levels)
- **/hk-debug** — Systematic debugging (6 phases, 3 hypotheses, root cause tracing)
- **Global installation** — `npx hk-context-limit install` copies skills and agents to `~/.claude/`
