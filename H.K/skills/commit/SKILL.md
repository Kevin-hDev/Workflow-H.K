---
name: commit
description: Quick commit and push with minimal, clean messages
model: haiku
allowed-tools: Bash(git :*), Bash(npm :*), Bash(pnpm :*), Bash(yarn :*), Bash(bun :*), Bash(cargo :*), Bash(go :*)
---

# Commit

Quick commit with conventional message format, then push.

## Context

- Git state: !`git status`
- Staged changes: !`git diff --cached --stat`
- Unstaged changes: !`git diff --stat`
- Recent commits: !`git log --oneline -5`
- Current branch: !`git branch --show-current`

## Workflow

1. **Detect Commands**:
   - If `.hk/hk-state.json` exists → read `variables.build_systems[]`
     - Collect `lint_cmd` (if `has_lint: true`) and `typecheck_cmd` (if `has_typecheck: true`)
   - If `.hk/hk-state.json` absent → fallback detection from `package.json` or config files

2. **Pre-commit Checks** (if commands available):
   - Run lint: command detected from `build_systems[].lint_cmd`
   - Run typecheck: command detected from `build_systems[].typecheck_cmd`
   - If errors → stop and report errors to the user

3. **Analyze**: Review git status
   - Nothing staged but unstaged changes exist: `git add .`
   - Nothing to commit: inform user and exit

4. **Generate commit message**:
   - Format: `type(scope): brief description`
   - Types: `feat`, `fix`, `update`, `docs`, `chore`, `refactor`, `test`, `perf`, `revert`
   - Under 72 chars, imperative mood, lowercase after colon
   - Example: `update(statusline): refresh spend data`

5. **Commit**: `git commit -m "message"`

6. **Push**: `git push`

## Rules

- ALWAYS read `.hk/hk-state.json` first for build commands
- ZERO hardcoded commands: detect dynamically from `build_systems[]`
- SPEED OVER PERFECTION: Generate one good message and commit
- NO INTERACTION: Never ask questions — analyze and commit
- AUTO-STAGE: If nothing staged, stage everything
- AUTO-PUSH: Always push after committing
- IMPERATIVE MOOD: "add", "update", "fix" not past tense
- PRE-COMMIT CHECKS: Lint + typecheck if available, otherwise skip to commit
