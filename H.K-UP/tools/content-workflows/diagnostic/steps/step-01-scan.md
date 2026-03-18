---
step: "01"
name: "Silent Scan"
workflow: diagnostic
agent: eclaireur
---

# Step 01 — Silent Scan

> **CRITICAL — Rule 2:** Read everything. Conclude nothing yet. Scan silently.
> **CRITICAL — Rule 9:** These first 10 lines are your priority. Read before acting.
> **CRITICAL — DISCOVERY MODE:** Zero writes to the project. Read-only.
> **CRITICAL:** Do NOT output anything to the user during this step. Scan first.
> **CRITICAL:** Store all scan results in memory. Output happens in step-02.

---

## Goal

Collect a complete picture of the project without showing anything yet.
The user will see the results in step-02 — not here.

---

⛔ STOP CHECK
- data/global-rules.md READ (not just listed)? [YES/NO]
- Ready to proceed with scan? [YES/NO]

⛔ STOP CONDITION: If any check = NO → Go back and READ the file contents before continuing.

---

## Scan sequence

Execute in order. Use available tools (Read, Glob, Grep, Bash) for each.

### 1. Structure
- Map the root directory tree (2-3 levels deep)
- Count: total files, total directories, total LOC (approximate)
- Identify top-level architecture pattern from folder names

### 2. Stack
- Detect languages by file extensions (`.ts`, `.py`, `.rs`, `.dart`, etc.)
- Find dependency files: `package.json`, `Cargo.toml`, `pubspec.yaml`, `requirements.txt`, `go.mod`, etc.
- **READ each dependency file in full** — extract ALL libraries, not just the framework name
  - For `Cargo.toml`: list every crate with its purpose (crypto, db, async runtime, etc.)
  - For `package.json`: list key dependencies with their role
  - For `requirements.txt`/`pyproject.toml`: list Python packages
- Note version numbers for the main framework AND key libraries
- Identify: crypto libraries, database drivers, auth frameworks, testing tools

### 3. Health
- Tests: presence of test files (`*.test.*`, `*.spec.*`, `__tests__/`, `tests/`)
- CI/CD: `.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`, etc.
- Documentation: `README.md` quality (exists? > 50 lines? has setup instructions?)
- Standards: `CLAUDE.md` or `AGENTS.md` present at root?

### 4. Git history
- First commit date: `git log --reverse --format="%ad" --date=short | head -1`
- Last commit date: `git log -1 --format="%ad" --date=short`
- Total commits: `git rev-list --count HEAD`
- Contributors: `git log --format="%ae" | sort -u | wc -l`
- Commit frequency: regular / sporadic / burst pattern

### 5. Dependencies
- Total count from dependency file(s)
- Obvious outdated or unused imports (if detectable without running package manager)
- Known security concerns in dependency names (log4j, leftpad-style, etc.)

### 6. Size classification
Based on total LOC:
- **SMALL**: < 5,000 LOC
- **MEDIUM**: 5,000 – 50,000 LOC
- **LARGE**: > 50,000 LOC

### 7. Architecture pattern
Infer from folder structure and file naming:
- Monolith / MVC / Feature-based / Domain-driven
- Microservices / Monorepo
- Flat structure (everything in one folder)
- Unknown (note it honestly)

### 8. Coding conventions
Read 3-5 representative source files and extract:
- **Naming**: camelCase / snake_case / PascalCase — for files, functions, variables, components
- **Error handling**: how errors are handled (Result types? try-catch? custom error classes?)
- **Imports**: organized by type? alphabetical? grouped by domain?
- **File structure**: consistent patterns (exports at bottom? types at top?)
- **State management**: what pattern is used (Redux, Zustand, signals, stores?)
- **Formatting**: indentation (2/4 spaces, tabs), semicolons, quotes style
- **CLAUDE.md/AGENTS.md conventions**: if present, extract the coding rules already defined

### 9. Functional inventory (existing features)

> This section maps WHAT the project does — not just how it's built.
> Without this inventory, no one can assess gaps or plan evolution.

**9a. Screens and pages:**
- Read the main routing/navigation component (App.tsx, router, sidebar)
- List every screen/page/tab the user can access
- For each: name, what it does (1 sentence), main components it uses

**9b. User actions:**
- List the key actions a user can perform (create, delete, configure, scan, export...)
- For each: where it happens, what backend command it calls

**9c. Integrations and external services:**
- List all external APIs, services, or tools the project connects to
- For each: what it's used for, how it's called (REST, CLI, sidecar, SDK)

**9d. Data model:**
- Read the database schema or models file
- List the main tables/collections and their purpose
- Note relationships between them

**9e. Store for step-02 and project-context.md:**
- `features_list`: table with columns [Feature | Screen | Status (active/partial/stub)]
- `integrations_list`: table with columns [Service | Purpose | Connection method]
- `data_tables`: table with columns [Table | Purpose | Key fields]

### 10. AI standards files (CLAUDE.md health)

> This section evaluates the project's AI instruction files.
> An oversized CLAUDE.md is a silent performance killer — it loads at EVERY request,
> creates noise, and causes Claude to ignore critical rules buried in the text.

**10a. CLAUDE.md analysis:**
- Check if `CLAUDE.md` (or `.claude/CLAUDE.md`) exists at project root
- Count lines: `wc -l CLAUDE.md`
- Classify health:
  - **OPTIMAL** (green): < 60 lines — lean, focused instructions
  - **ACCEPTABLE** (yellow): 60–200 lines — functional but could be trimmed
  - **OVERSIZED** (red): > 200 lines — active problem, causes instruction drift
- If the file exists, READ it and identify what it contains:
  - Project identity and type
  - Build/test commands
  - Coding conventions
  - Security rules
  - Architecture description
  - Dependency versions
  - Workflow instructions
  - Other content
- For each category, note: "should stay in CLAUDE.md" vs "should move elsewhere"

**10b. Modular rules check:**
- Check `.claude/rules/` — count files, list them
- Check `.claude/skills/` — count skills
- Check auto-memory (`~/.claude/projects/*/memory/`) — exists? MEMORY.md present?

**10c. Store classification for step-02:**
- `claudemd_exists`: yes/no
- `claudemd_lines`: number
- `claudemd_health`: optimal / acceptable / oversized
- `claudemd_content_categories`: list of what the file contains
- `rules_count`: number of .claude/rules/ files
- `skills_count`: number of .claude/skills/ directories
- `memory_exists`: yes/no

---

## End of step

All scan data is stored in memory. No output yet.

→ Proceed to **step-02-report.md**
Update `hk-up-status.yaml`: `3-1-scan-rapport → step-01: done`
