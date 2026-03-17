# H.K — Complete Guide

## What is H.K?

H.K is a structured development workflow for Claude Code. It organizes every task into clear steps (analyze, plan, code, test, ship) and adapts automatically to complexity. The result: less back-and-forth, stronger code, traceable progress.

---

## How to Use

The basic command: type `/hk` followed by what you want to do.

```
/hk add a logging system
```

H.K handles the rest: it evaluates complexity, picks the right level, and runs the necessary steps.

---

## Commands

### /hk — Main Workflow

**When to use:** for any development task — feature, bug, refactoring.

```
/hk add a logging system
/hk fix the bug on the homepage
/hk refactor the auth module
```

### /hk-dev — Autonomous Mode

**When to use:** same as `/hk`, but without intermediate questions. Ideal when you want to let it run without watching.

```
/hk-dev implement JWT authentication
```

### /hk-brainstorm — Explore Ideas

**When to use:** when you want to explore a topic, generate ideas, or compare approaches. No code. Guided by **Iris**, a creative innovation facilitator with 15 brainstorming techniques.

3 depth levels:
- Default → quick (1 technique, ~15 min)
- `--deep` → thorough (3 techniques, ~30 min)
- `--exhaustive` → comprehensive (5 techniques, ~60 min)

```
/hk-brainstorm how to structure the payments module
/hk-brainstorm --deep new feature ideas for the dashboard
/hk-brainstorm --exhaustive entire project concept
```

### /hk-design — UI/UX Design

**When to use:** when you need to design an interface before coding. Guided by **Léo**, a product designer with anti-AI-slop rules for premium, intentional design.

3 routes (auto-detected):
- **Adapt** — existing design, stay cohesive
- **Create** — design from scratch
- **Redesign** — rework existing design (`--redesign` flag)

```
/hk-design user dashboard page
/hk-design --redesign login screen
```

### /hk-prd — Product Requirements

**When to use:** when you need a structured PRD before development. Guided by **Aria**, a product manager who challenges vague requirements and thinks in user value.

```
/hk-prd task management application
/hk-prd migration to PostgreSQL
```

### /hk-audit-rules — Code Audit

**When to use:** for checking code quality against 18 built-in rules (10 security + 8 structure) plus any custom rules from your CLAUDE.md.

3 depth levels:
- Default → quick (18 rules check, ~2 min)
- `--full` → with tests + SelfCheck 4 questions (~5 min)
- `--security` → full + STRIDE + Five-Persona review (~10 min)

```
/hk-audit-rules                          # Last commit
/hk-audit-rules src/auth/                # Specific directory
/hk-audit-rules --full                   # Before merge/PR
/hk-audit-rules --security src/crypto/   # Sensitive code
```

### /hk-debug — Solve a Bug

**When to use:** when a bug resists and you want a methodical approach. 3 mandatory hypotheses, tests each one, only fixes after confirming the root cause.

```
/hk-debug login returns 500 in production
/hk-debug images don't display on mobile
```

### /hk-refactor — Refactor Code

**When to use:** when code needs restructuring — files too large, mixed responsibilities, dead code.

3 modes:
- **Full codebase** — audit everything, prioritize, refactor
- **Targeted** — you provide the file paths
- **Single file** — focus on splitting one file

```
/hk-refactor                            # Full codebase audit
/hk-refactor src/auth/handler.ts        # Single file
/hk-refactor src/api/ src/middleware/    # Targeted files
```

### /hk-changelog — Generate Changelog

**When to use:** when you need a user-facing changelog from git commits.

```
/hk-changelog
```

### /onetap — Ultra-Fast Implementation

**When to use:** when you want maximum speed on a focused task. Explore → Code → Test, no planning.

```
/onetap add dark mode toggle
/onetap fix the email validation regex
```

### /hk-context — Project Context

**When to use:** at the start of a new project, or when Claude seems lost about the tech stack. Generates a context file that all steps read automatically.

```
/hk-context                   # Generate
/hk-context update             # Update existing
```

### /hk-monitoring — Project Journal

**When to use:** to log a task done outside the H.K workflow (manual fix, external change).

```
/hk-monitoring added /users endpoint manually
/hk-monitoring updated npm dependencies
```

### Git Commands

```
/commit                    # Quick commit + push
/create-pr                 # Create PR with auto description
/merge feature-branch      # Smart merge with conflict resolution
/fix-errors                # Fix all lint/typecheck errors
/fix-pr-comments           # Apply PR review feedback
```

### Security Audit (separate installation)

Three dedicated security skills forming an audit chain:

```
/threat-modeling            # STRIDE analysis → threat_model_output.yaml
/adversary-simulation       # Red team simulation → adversary_output.yaml
/defensive-hardening        # Blue team hardening → concrete code
```

Install from: [claude-redteam-vs-blueteam](https://github.com/Kevin-hDev/claude-redteam-vs-blueteam)

### Reference Skills

```
/agent-prompt              # Structured prompting for subagents/teams
/prompt-creator            # Prompt engineering guide (13 techniques)
/skill-creator             # Guide for creating Claude Code skills
/claude-memory             # Create/optimize CLAUDE.md files
/hk-help                   # Display all commands and flags
```

---

## Complexity Levels

H.K auto-detects the right level. You can force it with `-l L1`.

| Level | When | What Happens |
|-------|------|-------------|
| L1 | Quick fix (1-3 files) | Direct fix + validation, no formal analysis |
| L2 | Simple feature (4-7 files) | Analyze → Plan → Execute → Validate |
| L3 | Full feature (8-15 files) | Full pipeline with parallel waves |
| L4 | Major work (16+ files) | Full pipeline + mandatory Design phase |

---

## Flags

| Flag | Name | Effect |
|------|------|--------|
| `-a` | `--autonomous` | No questions, no interruptions |
| `-s` | `--save` | Save state to .hk/hk-state.json |
| `-e` | `--economy` | Direct tools only, no subagents |
| `-b` | `--branch` | Create a dedicated git branch |
| `-l` | `--level` | Force level (L1/L2/L3/L4) |
| `-d` | `--design` | Force Design phase |
| `-r` | `--resume` | Resume interrupted task (new conversation) |
| `--force-harden` | | Mandatory security hardening |
| `--redesign` | | Force redesign mode in /hk-design |
| `--deep` | | Deep brainstorming (3 techniques) |
| `--exhaustive` | | Exhaustive brainstorming (5 techniques) |
| `--full` | | Full audit (tests + SelfCheck) |
| `--security` | | Security audit (STRIDE + Five-Persona) |

---

## Project Output

All generated files go to `{project-name}-output/`:

| File | Skill | Purpose |
|------|-------|---------|
| `brainstorming/session-{date}.md` | `/hk-brainstorm` | Brainstorming session record |
| `prd.md` | `/hk-prd` | Product requirements document |
| `design-specs.md` | `/hk-design` | Design specifications |
| `mockup-{name}.html` | `/hk-design` | Interactive HTML mockup |
| `project-context.md` | `/hk-context` | Tech stack, architecture, conventions |
| `project-monitoring.md` | `/hk-monitoring` | Task journal |
| `learnings.md` | `/hk-debug` | Bug patterns and lessons learned |

---

## Quick Reference

| I want to... | Command |
|--------------|---------|
| Build a feature | `/hk` or `/hk-dev` |
| Build without interruptions | `/hk-dev` |
| Explore ideas | `/hk-brainstorm` |
| Design an interface | `/hk-design` |
| Plan before coding | `/hk-prd` |
| Fix a bug | `/hk-debug` |
| Refactor code | `/hk-refactor` |
| Audit code quality | `/hk-audit-rules` |
| Quick one-task fix | `/onetap` |
| Generate project context | `/hk-context` |
| Log a manual task | `/hk-monitoring` |
| See all commands | `/hk-help` |
