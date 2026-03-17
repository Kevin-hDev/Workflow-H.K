---
name: hk-monitoring
description: Add an entry to the project journal ({project}-output/project-monitoring.md)
argument-hint: "<description of what was done>"
---

<objective>
Maintain a lightweight journal of completed tasks on the project.
Economy rule: never read the entire file by default.
</objective>

---

## What /hk-monitoring does

### 1. Read (or create) `{project}-output/project-monitoring.md`

**TOKEN ECONOMY RULE — CRITICAL:**
- By default → read ONLY the `## Roadmap` section + the **last 10 lines** of `## Journal`
- NEVER read the entire file unless the user explicitly requests a full recap
- Use `Read(file, offset=N-10)` to target only the end of the journal

### 2. Add a line to the journal

Line format to add:

```
| {date YYYY-MM-DD} | {short description} | {level L1-L4} | {files modified count} | done |
```

Example:
```
| 2026-03-13 | Auth JWT — add refresh token | L3 | 12 | done |
```

### 3. File structure (if creating)

```markdown
# Project Monitoring

## Roadmap
- [ ] Phase 1: ...
- [ ] Phase 2: ...

## Journal
| Date | Task | Level | Files | Status |
|------|------|-------|-------|--------|
```

---

## File reading — Strict rules

| Situation | Action |
|-----------|--------|
| Adding a line | Read only the last 10 lines of Journal |
| Updating Roadmap | Read only the Roadmap section |
| Full recap requested | Read entire file (only if explicitly requested) |
| File doesn't exist | Create with the base structure above |

**Why this rule**: the Journal can reach hundreds of lines after months of use.
Reading the entire file on every run wastes tokens unnecessarily.

---

## Integration in step-06-ship

Monitoring update (executed automatically on each Ship):

```
If {project}-output/project-monitoring.md exists:
  → Add a line: | {date} | {task_description} | {complexity_level} | {file count} | done |
If doesn't exist:
  → Create with the base structure + this first line
```

---

User: $ARGUMENTS
