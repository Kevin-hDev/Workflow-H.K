---
step: "01"
name: "Create Mission Brief"
workflow: create-mission
agent: architecte
---

# Step 01 — Create Mission Brief

> **CRITICAL — Rule 2:** Read ALL context before writing the brief. Understand first.
> **CRITICAL:** The brief must be AUTO-SUFFICIENT. The dev agent reads ONLY this file.
> **CRITICAL:** Include everything: context, tasks, files, patterns, constraints, tests.
> **CRITICAL:** Load the PREVIOUS mission's brief if it exists — learnings carry forward.
> **CRITICAL — Rule 8:** Web search for specific libs/frameworks mentioned in the mission.

---

## Goal

Produce one enriched mission brief that gives Le Chirurgien everything needed to work —
no external lookups, no guessing, no missing context.

---

⛔ STOP CHECK
- global-rules.md READ (not just listed)? [YES/NO]
- All context files confirmed by user? [YES/NO]

⛔ STOP CONDITION: If any check = NO → Go back before continuing.

---

## Phase 1 — Load context

Load these files in order. READ each one in full — do not skim.

1. `{output_folder}/architecture/plan.md` — find mission {X.Y}: title, tasks, dependencies, Quest it belongs to
2. `{output_folder}/architecture/architecture.md` — architectural decisions (ADRs) relevant to this mission
3. `{output_folder}/diagnostic/project-context.md` — stack, conventions, known issues, existing features
4. `{output_folder}/prd/prd.md` — requirements and acceptance criteria for features this mission touches
   (skip if Express path — not required)
5. Previous mission brief: `{output_folder}/missions/mission-{X}-{Y-1}.md` — if it exists, extract learnings:
   what worked, what to watch out for, any open issues left behind
6. **Web search:** if the mission involves a specific library or framework, search:
   `"{library} {version} {exact domain} {current_year}"` — store results for Dev Notes

---

## Phase 2 — Analyze and enrich

From the loaded context, identify and note:

- **ADRs in play:** which architectural decisions from architecture.md does this mission implement?
- **Files touched:** which existing files will be modified? Which new files will be created?
  Use project-context.md conventions to infer correct paths.
- **Patterns to follow:** naming conventions, error handling patterns, import style, state management
  (from project-context.md coding conventions section)
- **Previous learnings:** if a prior brief exists, what should the dev agent carry forward?
- **Security surface:** does this mission touch auth, crypto, user input, network, file system, secrets?
  If yes — list the specific security rules that apply (from CLAUDE.md or global-rules.md)
- **Test expectations:** what tests are expected? Where do they live in this project?

---

## Phase 3 — Generate the brief

Write the brief to `{output_folder}/missions/mission-{X}-{Y}.md` using this exact template:

```markdown
# Mission {X}.{Y} — {title}

Status: ready

## Context

{4-8 sentences the dev agent needs BEFORE starting:
  - What this mission implements (from architecture.md ADRs)
  - Why it matters (from prd.md requirements or project objective)
  - What is already in place (from project-context.md existing features)
  - What the target state is after this mission completes
  - Learnings from the previous mission (if applicable — what to watch out for)}

Project root: `{project_root}`

## Tasks

- [ ] Task 1: {precise — name the specific file(s) and module(s)}
- [ ] Task 2: {precise}
- [ ] Task 3: {precise — only if needed, max 3 tasks}

## Files to create / modify

| File | Action | Description |
|------|--------|-------------|
| `{path/to/file}` | create / modify | {what changes and why} |

## Dev Notes

{THIS IS THE MOST IMPORTANT SECTION — crystallize ALL context so the dev needs nothing else:

  Architecture patterns:
  - {pattern name}: {how it applies here, with example if needed}

  Coding conventions (from project-context.md):
  - Naming: {conventions for this part of the codebase}
  - Error handling: {pattern used in this project}
  - Imports: {style and organization expected}

  Library guidance (from web search if applicable):
  - {library name} v{version}: {specific API or usage pattern relevant to this mission}

  Security constraints (if this mission touches auth/crypto/input/network):
  - {specific rule}: {how it applies here}

  Testing expectations:
  - {what to test, where test files live, what framework is used}

  Known issues to watch (from project-context.md):
  - {issue}: {mitigation or workaround}

  Previous mission learnings (if applicable):
  - {learning}: {why it matters here}}

## References

- **Read before starting:** {list of specific source files in the codebase to read first}
- **Follow patterns from:** {existing files that demonstrate the correct patterns for this mission}

## Constraints

- No file > 250 lines (project rule)
- Tests mandatory for all business logic
- Follow strangler fig: existing code stays functional until validation
- {any mission-specific constraint from architecture.md or prd.md}

## When done

Mark tasks `[x]` as completed.
Update `hk-up-status.yaml`: mission-{X}-{Y}: review
```

---

## Phase 4 — Present and confirm

Present a summary to the user before finalizing:

<output-format>
🏗️ Mission {X}.{Y} — {title}

  Brief created at: {output_folder}/missions/mission-{X}-{Y}.md

  Tasks: {count}
  Files touched: {count} ({list file names})
  Key context: {1-2 sentences summarizing the most important Dev Notes}
  Security surface: {none / low / medium / high — with one-line reason}

  Status in hk-up-status.yaml: pending → ready

  ─────────────────────────────────────────
  1. Create the next mission brief
  2. Review this brief before continuing
  3. Stop — launch /hkup-dev when ready to code
</output-format>

⛔ STOP — Wait for user choice before proceeding.

---

## Phase 5 — Update status

Update `{output_folder}/hk-up-status.yaml`:
- Set mission-{X}-{Y} status → `ready`

Track session count. After the 4th mission created in this session:

<output-format>
I've created 4 mission briefs in this session.

  To keep context fresh and avoid compaction, I recommend:
  1. /clear — clear this conversation and continue
  2. New conversation — launch /hkup-create-mission again

  The briefs are saved. Nothing is lost.
</output-format>

---

## End of step

→ Return to **workflow.md** end condition check.
Update `hk-up-status.yaml`: mission-{X}-{Y} → `ready`
