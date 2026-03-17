---
name: create-pr
description: Create and push PR with auto-generated title and description
model: haiku
allowed-tools: Bash(git :*), Bash(gh :*), Bash(npm :*), Bash(pnpm :*), Bash(yarn :*), Bash(bun :*), Bash(cargo :*), Bash(go :*)
---

# Create PR

Create pull request with concise, meaningful description.

## Context

- Current branch: !`git branch --show-current`
- Working tree status: !`git status --short`
- Recent commits: !`git log --oneline -5`
- Remote tracking: !`git rev-parse --abbrev-ref @{upstream} 2>/dev/null || echo "none"`

## Workflow

1. **Detect Commands**:
   - If `.hk/hk-state.json` exists → read `variables.build_systems[]`
     - Collect `lint_cmd` (if `has_lint: true`) and `typecheck_cmd` (if `has_typecheck: true`)
   - If `.hk/hk-state.json` absent → fallback detection from `package.json` or config files

2. **Pre-PR Checks** (if commands available):
   - Run lint: command detected from `build_systems[].lint_cmd`
   - Run typecheck: command detected from `build_systems[].typecheck_cmd`
   - If errors → stop and report errors to the user before creating the PR

3. **Verify**: Check `git status` and current branch

4. **Branch Safety**: **CRITICAL** — If on main/master, create descriptive branch from changes

5. **Push**: `git push -u origin HEAD`

6. **Analyze**: `git diff origin/main...HEAD --stat`

7. **Generate PR**:
   - Title: One-line summary (max 72 chars)
   - Body: Bullet points of key changes

8. **Submit**: `gh pr create --title "..." --body "..."`

9. **Return**: Display PR URL

## PR Format

```markdown
## Summary

• [Main change or feature]
• [Secondary changes]
• [Any fixes included]

## Type

[feat/fix/refactor/docs/chore]
```

## Rules

- ALWAYS read `.hk/hk-state.json` first for build commands
- ZERO hardcoded commands: detect dynamically from `build_systems[]`
- PRE-PR CHECKS: Lint + typecheck if available, block PR if errors
- NO verbose descriptions
- NO "Generated with" signatures
- Auto-detect base branch (main/master/develop)
- Use HEREDOC for multi-line body
- If PR exists, return existing URL

User: $ARGUMENTS
