---
step: "02"
name: "Documentation Update and Formal Closure"
workflow: finalisation
agent: stratege
---

# Step 02 — Documentation Update and Formal Closure

> **CRITICAL — Rule 10:** Formal closure must explicitly announce what was completed, what was deferred, and what comes next.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL — Rule 7:** Update hk-up-status.yaml to `completed` only at the very end of this step.
> **CRITICAL — Rule 1:** The user confirms documentation updates before they are written.
> **CRITICAL:** Documentation is not optional. README and CHANGELOG are part of the deliverable.

---

## Goal

Update the project's own documentation to reflect the work done.
Produce the closing summary. Formally end the H.K-UP parcours.

---

## Phase 1 — Update project documentation

### README.md

Read the project's existing `README.md` (at the project root, not the output folder).

If it exists: propose specific updates based on what changed during the parcours.

```
README.md updates I propose:

  1. {section_to_update} — reason: {why this changed}
     Draft update: {new content}

  2. {section_to_add} — reason: {what's missing}
     Draft: {new content}

  Shall I apply these updates?
```

Wait for user confirmation before writing. Apply only what the user approves.

If README.md does not exist, ask:
```
No README.md found. Would you like me to create one?
  It will document: project purpose, stack, setup instructions, and what was built.
```

### CHANGELOG.md

Read the project's existing `CHANGELOG.md` (at the project root).

If it exists: prepend a new entry at the top:

```markdown
## [{version or date}] — {brief_title}

### Added
- {feature_1 from Must Have list — one line each}
- {feature_2}

### Changed
- {significant_changes}

### Fixed
- {bugs_fixed_during_the_parcours_if_any}
```

If no CHANGELOG.md exists, create one with the first entry.

### Project summary (in output folder)

Save a `{output_folder}/project-summary.md` with the session recap:

```markdown
# H.K-UP Session Summary — {project_name}

**Date:** {date}
**Path:** {parcours_type}
**Output folder:** {output_folder}/

## Core documents produced
- project-context.md — project diagnosis and conventions
- prd.md — full PRD (Must Have implemented: {n}/{n})
- architecture.md — ADRs and technical decisions
- plan.md — Quests and mission history

## Key decisions
- {decision_1 — the most important architectural or product choice}
- {decision_2}
- {decision_3}

## Deferred items
- {list of Should Have or Could Have not implemented}
```

**Do NOT modify the user's CLAUDE.md.** The CLAUDE.md file has strict size limits (~200 lines)
and should only contain instructions the user writes themselves. H.K-UP session data belongs
in the output folder, not in CLAUDE.md.

---

## Phase 2 — Closing summary

Present the complete parcours summary:

```
H.K-UP PARCOURS COMPLETE — {project_name}

  ──────────────────────────────────────────────────────────────────
  PATH COMPLETED
  ──────────────────────────────────────────────────────────────────
  Path:       {parcours_name} {← escalated from {previous_path} if applicable}
  Started:    {start_date from hk-up-status.yaml or first output file date}
  Completed:  {today's date}

  ──────────────────────────────────────────────────────────────────
  EXECUTION SUMMARY
  ──────────────────────────────────────────────────────────────────
  Quests completed:          {count}
  Missions completed:        {count}
  Total tasks executed:      {count}
  Corrections by Le Gardien: {count}
  Reflection modes used:     {list: Table Ronde ×N, Prisme ×N, etc. — or "None"}

  ──────────────────────────────────────────────────────────────────
  DELIVERABLES PRODUCED
  ──────────────────────────────────────────────────────────────────
  Output folder: {output_folder}/

  {list only the files that actually exist:}
  ├── project-context.md       ← Diagnostic
  ├── prd.md                   ← PRD (if Standard/Full/Design)
  ├── architecture.md          ← Architecture (if Standard/Full)
  ├── spec-design.md           ← Design (if Design/Full)
  ├── security-audit.md        ← Security (if Full/Audit)
  ├── debt-verdict.md          ← Tribunal (if run)
  ├── plan.md                  ← Execution plan
  ├── hk-up-status.yaml        ← Complete progression registry
  └── missions/                ← {count} mission briefs

  ──────────────────────────────────────────────────────────────────
  PRD COVERAGE (from step-01 checkup)
  ──────────────────────────────────────────────────────────────────
  Must Have:   {n}/{n} — 100% ✓
  Should Have: {n}/{total} — {percent}%
  Could Have:  {n}/{total} — {percent}%

  {If any Should Have items were deferred:}
  Deferred items:
  - {feature_1} — reason: {why deferred}
  - {feature_2} — reason: {why deferred}

  ──────────────────────────────────────────────────────────────────
  RECOMMENDATIONS FOR THE FUTURE
  ──────────────────────────────────────────────────────────────────
  {3 specific, actionable recommendations based on actual parcours findings.
   Not generic — grounded in what was discovered, deferred, or flagged.}

  1. {recommendation_1}
     Why: {based on what was discovered during this parcours}

  2. {recommendation_2}
     Why: {based on what was discovered during this parcours}

  3. {recommendation_3}
     Why: {based on what was discovered during this parcours}
```

---

## Phase 3 — Next steps offer

```
  ──────────────────────────────────────────────────────────────────
  WHAT WOULD YOU LIKE TO DO?
  ──────────────────────────────────────────────────────────────────

  1. Launch another parcours
     → New objective on the same project (L'Éclaireur will detect the completed
       parcours and offer a new one from the current state)

  2. Export the deliverables
     → I'll list all output files with their paths for easy access

  3. We're done — close
     → Formal farewell
```

Wait for the user's choice.

**If Option 1 (new parcours):**
```
Starting a new session.

  I'll launch L'Éclaireur. It will detect the completed parcours in hk-up-status.yaml
  and offer a new objective menu based on the current project state.

→ Load: workflows/diagnostic/workflow.md
  L'Éclaireur will skip the scan (project is known) and jump to the objective menu.
```

**If Option 2 (export):**
```
Deliverables in {output_folder}/:

  {list each file with full path, one-line description, and approximate size}
```

**If Option 3 (close):**
Proceed to Phase 4.

---

## Phase 4 — Final hk-up-status.yaml update

Update `hk-up-status.yaml`:

```yaml
project: {project_name}
last_updated: {today_ISO_datetime}
parcours: {parcours_name}
completed: {today_date}          # ← new field
current_phase: complete          # ← updated

phases:
  # All phases marked done
  {each_phase}:
    status: done
    missions:
      {each_mission}: done
```

---

## Phase 5 — Formal closure

```
Thank you for working with H.K-UP.

  {project_name} is in a better place than when we started.

  Everything we built together is in {output_folder}/.
  The project documentation has been updated.

  {If any deferred items exist:}
  A note on what we left for later:
    {brief summary of deferred items and why — one sentence each}

  If you need us again: relaunch L'Éclaireur on this project.
  It will see the completed work and pick up from there.

  — Le Stratège, on behalf of the H.K-UP team
    L'Éclaireur · Le Stratège · L'Architecte · Le Designer
    Le Chirurgien · Le Gardien · Nyx · The Mask · Zero
```

---

## Transition

There is no next step. The parcours is closed.

Update `hk-up-status.yaml`: all phases `done`, all missions `done`, `completed: {date}`.

If the user chose Option 1 (new parcours): proceed to `workflows/diagnostic/workflow.md`.
Otherwise: the workflow ends here.
