---
name: fix-errors
description: Fix all ESLint and TypeScript errors with parallel processing using snipper agents
allowed-tools: Bash(pnpm :*), Bash(tsc :*), Bash(npm :*), Bash(yarn :*), Bash(bun :*), Bash(cargo :*), Bash(go :*), Read, Task, Grep
---

# Fix Errors

Fix all lint and TypeScript/typecheck errors by breaking them into areas and processing in parallel.

## Workflow

1. **DETECT COMMANDS**:
   - If `.hk/hk-state.json` exists → read `variables.build_systems[]`
     - For each build system: use `lint_cmd`, `typecheck_cmd`, `test_cmd` if available (`has_lint`, `has_typecheck`, `has_tests`)
   - If `.hk/hk-state.json` absent (skill called outside workflow) → fallback:
     - Look for `package.json` → detect scripts `lint`, `typecheck`, `type-check`, `tsc`, `eslint`
     - Look for `Cargo.toml` → `cargo clippy`, `cargo check`
     - Look for `go.mod` → `go vet ./...`

2. **RUN DIAGNOSTICS**:
   - Run detected lint command (e.g., `{lint_cmd}`)
   - Run detected typecheck command (e.g., `{typecheck_cmd}`)
   - Capture all error output

3. **ANALYZE ERRORS**:
   - Extract file paths from error messages
   - Group errors by file
   - Count total errors and affected files

4. **CREATE ERROR AREAS**:
   - **MAX 5 FILES PER AREA**
   - Group related files (same directory/feature)
   - Example: `Area 1: [file1, file2, file3, file4, file5]`

5. **PARALLEL PROCESSING**: Launch snipper agents for each area
   - Use Task tool with multiple simultaneous agents
   - Each agent handles one area (max 5 files)
   - Provide specific error details for each file

6. **VERIFICATION**: Re-run diagnostics after fixes
   - Wait for all agents to finish
   - Re-run detected lint and typecheck commands
   - Report remaining errors

7. **FORMAT CODE**: Apply formatter if available
   - Use `format_cmd` from `.hk/hk-state.json` if present
   - Otherwise detect from `package.json`: scripts `format`, `prettier`

## Snipper Agent Instructions

```
Fix all ESLint and TypeScript errors in these files:
[list of files with their specific errors]

Focus only on these files. Make minimal changes to fix errors while preserving functionality.
```

## Rules

- ALWAYS read `.hk/hk-state.json` first if available
- If absent, detect commands from project config files
- ZERO hardcoded commands: never hardcode `pnpm lint` or `npm run lint`
- ONLY fix linting and TypeScript errors
- NO feature additions — minimal fixes only
- PARALLEL ONLY — use Task tool for concurrent processing
- Every error must be assigned to an area

User: $ARGUMENTS
