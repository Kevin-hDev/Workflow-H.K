---
name: hk-refactor
description: Systematic code refactoring — audit debt, prioritize, split files, validate. 3 modes (full codebase, targeted files, single file).
argument-hint: "[file path(s)]"
---

# Refactor

Improve code structure without changing behavior. Split large files, extract functions, remove dead code, enforce single responsibility.

## Core Principle

**Refactoring = structure changes ONLY. Zero behavior changes.** If a test fails after refactoring, the refactoring is wrong — not the test.

---

## Mode Selection

> "What are we refactoring?
>
> **[1] Full codebase** — audit the entire project, discover debt, prioritize targets
> **[2] Targeted files** — you know which files need work (provide paths)
> **[3] Single file** — focus on splitting/cleaning one specific file"

If `$ARGUMENTS` contains file paths → auto-select mode 2 or 3.
If `$ARGUMENTS` is empty → ask the user.

## Detect Commands

```
IF .hk/hk-state.json exists:
  → Read variables.build_systems[]
  → Use lint_cmd, typecheck_cmd, test_cmd, format_cmd
ELSE:
  → Detect from project config files (package.json, Cargo.toml, go.mod, pyproject.toml)
```

## Routing

```
Mode 1 (full codebase) → Load steps/step-01-audit.md
Mode 2 (targeted)      → Load steps/step-03-plan.md (skip audit + prioritize)
Mode 3 (single file)   → Load steps/step-04-refactor.md (skip to execution)
```

User: $ARGUMENTS
