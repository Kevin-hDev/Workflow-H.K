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

## Pre-scan: Complementary tools

Before scanning manually, check if complementary tools are available:

**Repomix** — check if installed: `which repomix || npx repomix --version`
- If available: run `npx repomix -o {output_folder}/repomix-output.xml --quiet`
- Read `{output_folder}/repomix-output.xml` — it contains the entire codebase in a single file
- Use this as the PRIMARY source for the scan below (structure, stack, patterns, LOC)
- If NOT available: scan manually using tools (default behavior below)

**Agent OS** — check if installed: `test -d ~/agent-os && echo "installed"`
- If available: run `~/agent-os/scripts/project-install.sh` (if not already done during installation)
- Then run `agent-os discover` to extract coding standards
- Store the output as `{agent_os_standards}` for use in step-02 and step-05
- If NOT available: skip — coding standards will be inferred from the code directly

---

## Scan sequence

Execute in order. Use available tools (Read, Glob, Grep, Bash) for each.
If Repomix output is available, read it first and extract the information below from it.

### 1. Structure
- Map the root directory tree (2-3 levels deep)
- Count: total files, total directories, total LOC (approximate)
- Identify top-level architecture pattern from folder names

### 2. Stack
- Detect languages by file extensions (`.ts`, `.py`, `.rs`, `.dart`, etc.)
- Find dependency files: `package.json`, `Cargo.toml`, `pubspec.yaml`, `requirements.txt`, `go.mod`, etc.
- Extract: frameworks, main libraries, dependency count
- Note version numbers for the main framework and runtime

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

### 8. If Agent OS is installed
- Run `agent-os discover` to extract project coding standards
- Store the output as `agent_os_standards` in memory

---

## End of step

All scan data is stored in memory. No output yet.

→ Proceed to **step-02-report.md**
Update `hk-up-status.yaml`: `3-1-scan-rapport → step-01: done`
