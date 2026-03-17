---
mode: archeologie
type: reflection-mode
loaded_by: agents, step files
agent: eclaireur
---

# Archéologie — Understand the Code's History

> **CRITICAL — Rule 2:** Understand before modifying. Archéologie exists to enforce this.
> **CRITICAL:** L'Éclaireur presents findings as observations, never judgments.
> **CRITICAL — Rule 8:** All git commands must target specific files or date ranges. No generic dumps.

---

## What it is

Archéologie uses git history to understand *why* the code exists as it does today.
Before diagnosing a problem, before proposing a refactor, before replacing a pattern —
understand its origin. The code that looks wrong today was written for a reason.

This mode is led by **L'Éclaireur**, the agent who reads without judging.

---

## What to identify

### 1 — Major project phases

Identify distinct phases in the project's life:
- Initial build (v0 → v1)
- Major rewrites or pivots
- Emergency patches and hotfixes
- Framework upgrades or migrations
- Periods of heavy activity vs abandonment

**How:** `git log --oneline --since="2 years ago"` + `git log --format="%ai %s"` to see commit density over time

### 2 — Geological layers

Projects accumulate "layers" of code written at different eras with different assumptions.
Identify where different generations of code coexist (v1 approach next to v2 approach in the same codebase).

**How:** `git log --follow -- {file}` on key files to trace their full evolution

### 3 — Contributors who left

Knowledge gaps appear where the main author of a component is no longer on the project.
These areas carry the highest "bus factor" risk.

**How:** `git shortlog -sn -- {directory}` to see who wrote what, then check if they are still active

### 4 — Recurring hotspot files

Files modified most often = highest complexity, highest bug probability, highest coupling.
These are the files that should be refactored first and tested most thoroughly.

**How:** `git log --format="%H" | xargs -I{} git diff-tree --no-commit-id -r --name-only {} | sort | uniq -c | sort -rn | head -20`

**MANDATORY — Hotspot output format:**

For each hotspot file, you MUST run `wc -l {file}` to get the ACTUAL current line count.
Then present the results using THIS EXACT TABLE — no variations, no renaming columns:

<output-format>
HOTSPOT FILES — most modified in git history

| File | Current size | Commits touching it | Observation |
|------|-------------|--------------------:|-------------|
| {file_path} | {wc -l result} lines | {commit_count} commits | {why it changes often} |
| {file_path} | {wc -l result} lines | {commit_count} commits | {observation} |

"Current size" = actual file size NOW (run wc -l).
"Commits touching it" = number of commits that modified this file.
</output-format>

Do NOT omit the "Current size" column. Do NOT rename columns. Do NOT use "Modifications" or "Changements" instead — use the exact column names above.

### 5 — Abandoned attempts

Half-finished refactors, commented-out code blocks, files that were renamed then abandoned,
branches that were never merged. These create cognitive overhead for anyone reading the code.

**How:** `git log --diff-filter=D --summary --format="%ai %s"` for deleted files + `grep -r "TODO\|FIXME\|HACK\|XXX"` for in-code markers

---

## How to run an Archéologie session

### Step 1 — Scope selection

Ask which areas to excavate:
```
Archéologie — What would you like to explore?

  1. Full timeline    — Project phases from day one to today
  2. Hotspot files    — Most-modified files (highest risk areas)
  3. A specific file  — Full history of one file or component
  4. Contributors     — Who wrote what, knowledge gaps
  5. All of the above

Choose an area (or type a specific file/folder path):
```

### Step 2 — Excavation

Run the git analysis for the selected scope.
Present findings as a narrative, not raw log output.

**Full timeline format:**
```
ARCHÉOLOGIE — Project Timeline

  Phase 1 ({date_range}): {name}
    {2-3 sentences describing what was built and the approach taken}
    Key commits: {count} · Main contributors: {names}

  Phase 2 ({date_range}): {name}
    {description}

  [...]

  Current state: {where the project is now, relative to its history}
  Observation: {one insight about the project's evolution}
```

**Hotspot files format:**
```
ARCHÉOLOGIE — Hotspot Files (Top 10 most modified)

  Rank | File | Modifications | Main authors | Last touched
  ─────────────────────────────────────────────────────────
  1    | {file_path} | {count} | {authors} | {date}
  2    | [...]
  [...]

  Interpretation:
  - {file_1}: {why it's modified so often — coupling, unclear ownership, or active area}
  - {file_2}: [...]

  Highest-risk file for refactoring: {file} — reason: {why}
```

**Specific file format:**
```
ARCHÉOLOGIE — {file_path}

  Created: {date} by {author}
  Last modified: {date} by {author}
  Total modifications: {count}

  Key moments in this file's history:
  {date}: {what changed and why — 1 sentence}
  {date}: {what changed and why — 1 sentence}
  [...]

  Geological layers: {describe if the file contains code from different eras}
  Observation: {one insight about this file}
```

**Contributors format:**
```
ARCHÉOLOGIE — Contributors

  Author          | Commits | Main areas         | Still active?
  ──────────────────────────────────────────────────────────────
  {author_1}     | {count} | {directories}      | {yes | no | unknown}
  [...]

  Knowledge gaps:
  - {area_1}: main author {name} left {date} — {count} files with no other contributor
  - [...]

  Bus factor: {count} contributors own > 50% of the codebase
```

### Step 3 — Discussion

Present findings, then invite the user to explore further:
```
Any of these areas you'd like to dig deeper into?
(Or type 'done' to close the Archéologie)
```

### Step 4 — Summary

```
ARCHÉOLOGIE SUMMARY

  Phases identified: {count}
  Hotspot files: {count}
  Knowledge gaps: {count}
  Abandoned attempts found: {yes | no}

  Key insight: {one sentence — the most important historical finding}
  Implication for this session: {how this history should inform the current work}
```

---

## Saving output

```markdown
### Archéologie (validated)

- Scope: {what was excavated}
- Agent: L'Éclaireur

**Key findings:**
- Phases: {count} distinct phases identified
- Hotspots: {top 3 files}
- Knowledge gaps: {areas at risk}
- Abandoned attempts: {if any}

**Key insight:** {one-sentence historical finding}
**Implication:** {how it should inform current decisions}
```

The full Archéologie narrative is also saved as a section in `project-context.md`
if that file exists in the output folder.
