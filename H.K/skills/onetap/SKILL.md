---
name: onetap
description: Ultra-fast feature implementation using Explore → Code → Test workflow. Use when implementing focused features, single tasks, or when speed over completeness is priority.
argument-hint: <feature-description>
---

# OneShot

Implement `$ARGUMENTS` at maximum speed. Ship fast, iterate later.

## Quick Context (optional, minimal)

```
IF {project}-output/prd.md exists:
  → Grep for keywords matching the feature description
  → Load ONLY the matching FR(s), not the entire PRD
  → Skip if no match found — don't waste tokens reading the full doc

IF {project}-output/design-specs.md exists AND feature touches UI:
  → Load ONLY the relevant component/section
  → Skip if feature is backend-only
```

Do NOT read brainstorming files, project-context, or monitoring. Noise kills speed.

## Detect Commands

```
IF .hk/hk-state.json exists:
  → Read variables.build_systems[]
  → Use lint_cmd, typecheck_cmd, format_cmd, test_cmd as detected
ELSE:
  → Detect from project config files:
    - package.json → npm/pnpm/yarn/bun scripts (lint, typecheck, format)
    - Cargo.toml → cargo clippy, cargo check, cargo fmt
    - go.mod → go vet ./..., go build ./...
    - pyproject.toml → ruff check, mypy, ruff format
```

ZERO hardcoded commands. Detect dynamically.

## Workflow

### 1. EXPLORE (minimal)

Gather minimum viable context:
- Use `Glob` to find 2-3 key files by pattern
- Use `Grep` to search for specific patterns
- NO exploration tours — find targets and move on
- NO subagents — direct tools only

### 2. CODE (main phase)

Execute changes immediately:
- Follow existing codebase patterns exactly
- Clear variable/method names over comments
- Stay STRICTLY in scope — change only what's needed
- NO comments unless genuinely complex
- NO refactoring beyond requirements
- Run formatter if detected

### 3. TEST (validate)

Check quality using detected commands:
- Run: lint + typecheck (detected in step above)
- If fails: fix only what you broke, re-run
- NO full test suite unless explicitly requested

## Output

When complete, return:

```
## Done

**Task:** {what was implemented}
**Files changed:** {list}
**Validation:** lint + typecheck status
```

## Constraints

- ONE task only — no tangential improvements
- NO documentation files unless requested
- NO refactoring outside immediate scope
- NO "while I'm here" additions
- If stuck >2 attempts: report blocker and stop
- Context budget: read max 5 files total (including explore phase)

User: $ARGUMENTS
