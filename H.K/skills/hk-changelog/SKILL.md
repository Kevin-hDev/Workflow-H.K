---
name: hk-changelog
description: Generate user-facing changelogs from git commits — categorizes, filters noise, translates technical commits into clear release notes
---

# Changelog Generator

Transform git commits into polished, user-friendly changelogs.

## Process

### 1. Determine Scope

Ask the user OR infer from context:
- **Since last tag**: `git describe --tags --abbrev=0` → use as start point
- **Date range**: "last week", "since March 1", etc.
- **Between versions**: "v1.0.0..v1.1.0"
- **Default**: all commits since last tag, or last 50 if no tags

### 2. Scan Git History

```bash
git log --oneline --no-merges {range}
```

Read each commit. Ignore merge commits.

### 3. Categorize Each Commit

| Category | Patterns | Emoji |
|----------|----------|-------|
| Breaking Changes | `BREAKING`, `!:` in conventional commits | :warning: |
| New Features | `feat:`, `add`, `new`, `implement`, `introduce` | :sparkles: |
| Improvements | `improve`, `enhance`, `update`, `optimize`, `refactor` | :wrench: |
| Bug Fixes | `fix:`, `bugfix`, `resolve`, `correct`, `patch` | :bug: |
| Security | `security`, `vuln`, `CVE`, `auth`, `encrypt` | :lock: |
| Performance | `perf:`, `speed`, `fast`, `cache`, `optimize` | :zap: |
| Documentation | `docs:`, `readme`, `comment`, `jsdoc` | :book: |

### 4. Filter Noise

EXCLUDE from the changelog (internal-only commits):
- `chore:`, `ci:`, `test:`, `style:` (unless they have user-facing impact)
- Commits with only config/tooling changes
- Commits with "wip", "tmp", "fixup", "squash"
- Dependency bumps (unless security-related)

### 5. Translate Technical → User-Friendly

For each kept commit:
- Remove technical jargon (no "refactor the middleware pipeline")
- Focus on WHAT changed for the user (not HOW it was implemented)
- Start with a verb: "Added", "Fixed", "Improved"
- Keep it to 1-2 sentences max
- If a commit touches a specific feature, name the feature

### 6. Format Output

```markdown
# Changelog — {project name}

## {version or date range}

### :warning: Breaking Changes
- {description}

### :sparkles: New Features
- **{Feature Name}**: {user-friendly description}

### :wrench: Improvements
- {description}

### :bug: Bug Fixes
- {description}

### :lock: Security
- {description}
```

Omit empty categories. Order: Breaking → Features → Improvements → Fixes → Security → Performance → Docs.

### 7. Output

- Display the changelog to the user
- If `CHANGELOG.md` exists, ask if they want to prepend the new entry
- If no `CHANGELOG.md`, ask if they want to create one

## Tips

- Run from git repository root
- For monorepos, specify the subdirectory: `/hk-changelog src/api`
- Use `$ARGUMENTS` as the scope if provided (e.g., `/hk-changelog v2.0.0..HEAD`)
