---
name: hk-help
description: Display full H.K workflow help — all commands, flags, levels, and available skills
argument-hint: "[specific command]"
---

<objective>
Display the complete H.K workflow documentation:
all available commands, flags, L1-L4 levels, and usage examples.
</objective>

<workflow>
Read H.K/hk/SKILL.md and produce a structured help summary.
If an argument is provided → targeted help on that command or flag.
</workflow>

<output>
Display:

## H.K Workflow

| Command | Description |
|---------|-------------|
| `/hk <description>` | Full workflow (default) |
| `/hk-dev <description>` | Alias /hk in autonomous + save mode |
| `/hk-help [command]` | This help |

## Creative & Planning

| Command | Description |
|---------|-------------|
| `/hk-brainstorm <topic>` | Creative brainstorming with Iris (15 techniques, 3 depth levels) |
| `/hk-design <description>` | UI/UX design workflow with Léo (adapt/create/redesign, HTML mockup) |
| `/hk-prd <description>` | Product requirements with Aria (discovery → users → scope → FRs) |

## Code Quality

| Command | Description |
|---------|-------------|
| `/hk-audit-rules [--full\|--security] [path]` | Code audit (18 rules + custom CLAUDE.md) |
| `/hk-debug <bug>` | Systematic debugging (3 hypotheses, differential diagnosis) |
| `/hk-refactor [file paths]` | Refactoring (3 modes: full codebase / targeted / single file) |
| `/hk-changelog` | Generate changelog from git commits |
| `/onetap <feature>` | Ultra-fast implementation (explore → code → test) |

## Project Context

| Command | Description |
|---------|-------------|
| `/hk-context [update]` | Generate/update project context |
| `/hk-monitoring <description>` | Add entry to project journal |

## Git

| Command | Description |
|---------|-------------|
| `/commit` | Quick commit + push with conventional message |
| `/create-pr` | Create PR with auto-generated title and description |
| `/merge <branch>` | Intelligent merge with context-aware conflict resolution |
| `/fix-errors` | Fix all lint/typecheck errors in parallel |
| `/fix-pr-comments` | Fetch PR review comments and implement fixes |

## Security Audit (dedicated skills)

| Command | Description |
|---------|-------------|
| `/threat-modeling` | STRIDE threat analysis (9 phases, auto-detect stack) |
| `/adversary-simulation` | Red team attack simulation (7 phases, chain patterns) |
| `/defensive-hardening` | Blue team hardening with concrete code (9 phases, triple output) |

## Reference & Tools

| Command | Description |
|---------|-------------|
| `/agent-prompt` | Structured prompting for subagents/teams |
| `/prompt-creator` | Prompt engineering guide (13 techniques, 2026 best practices) |
| `/skill-creator` | Guide for creating Claude Code skills |
| `/claude-memory` | Create/optimize CLAUDE.md files |

## Flags

| Flag | Effect |
|------|--------|
| `-a` / `--autonomous` | No interruptions except critical blockers |
| `-s` / `--save` | Save state to .hk/hk-state.json |
| `--level L1\|L2\|L3\|L4` | Rigor level |
| `--analyze-only` | Analysis without implementation |
| `--design` | Force design phase |
| `--plan-only` | Plan without execution |
| `--force-harden` | Mandatory security hardening |
| `--redesign` | Force redesign mode in /hk-design |
| `--deep` / `--exhaustive` | Brainstorming depth levels |
| `--full` / `--security` | Audit depth levels in /hk-audit-rules |

## Levels L1-L4

| Level | Description |
|-------|-------------|
| `L1` | Quick fix, minimal, risk_level=LOW |
| `L2` | Standard feature, risk_level=MEDIUM (default) |
| `L3` | Critical feature, risk_level=HIGH, reinforced security |
| `L4` | Major refactoring, risk_level=CRITICAL, mandatory plan |
</output>

<rules>
- Read H.K/hk/SKILL.md to get up-to-date information
- If the user asks for help on a specific command → focus on it
</rules>

User: $ARGUMENTS
