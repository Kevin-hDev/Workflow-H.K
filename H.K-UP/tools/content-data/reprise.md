---
type: system-reference
loaded_by: L'Éclaireur, all workflow INITIALIZATION sections
rule: Rule 7 — Save state after each major action
---

# Reprise — Resume After Interruption

> **CRITICAL:** `hk-up-status.yaml` IS the resume mechanism. It is the single source of truth.
> **CRITICAL — Rule 1:** The user chooses how to resume. Never auto-continue without confirmation.
> **CRITICAL:** After context compaction, reload the output folder files — not from memory.

---

## What it is

H.K-UP workflows can be interrupted at any point — mid-step, mid-mission, mid-phase.
The resume system allows the user to return hours, days, or weeks later and continue
without losing progress.

**The mechanism is `hk-up-status.yaml`.**
No separate resume file. No special mode. Just read the status file, understand where things
stand, and propose the 3 options.

---

## Resume detection

Every workflow's INITIALIZATION section checks for `hk-up-status.yaml` before starting.

**L'Éclaireur always runs the resume check** — it is the entry point for every journey.

### Check logic

1. Look for `{output_folder}/hk-up-status.yaml` (the user specifies the output folder, or it defaults to `{project_name}-hkup-output/`)
2. If **not found** → fresh start, proceed to step-01 of the diagnostic
3. If **found and all missions are `done`** → the parcours is complete, offer finalization or a new session
4. If **found with missions in `in-progress`, `review`, or `backlog`** → resume scenario, show the resume menu

---

## Resume menu

When `hk-up-status.yaml` is found with active work:

```
I found an existing H.K-UP workflow in progress.

  Project:         {project_name}
  Path:            {parcours} {← escalated_from if applicable}
  Started:         {first mission's date or hk-up-status.yaml creation date}
  Last activity:   {last_updated from hk-up-status.yaml}

  Progress:
    Phases completed:  {done_phase_count}/{total_phases}
    Missions done:     {done_mission_count}/{total_mission_count}
    Current position:  {current_mission_id} — {mission_title} (status: {status})

  Output folder: {output_folder}/

  ─────────────────────────────────────────────────────────────
  1. Resume where we left off
     → Continue with {next_action} (see below)

  2. Review the plan before continuing
     → Re-read plan.md and let you adjust before proceeding

  3. Restart from scratch
     → Delete hk-up-status.yaml and run a new diagnostic
     ⚠ Output files already created will NOT be deleted automatically
```

Wait for the user's choice. Never auto-continue.

### Determining "next action" for Option 1

| Current status found in hk-up-status.yaml | Next action |
|--------------------------------------------|-------------|
| A mission is `in-progress` | Continue that mission (load the mission brief) |
| A mission is `review` | Le Gardien validates it before proceeding |
| All missions in current phase are `done`, next phase `backlog` | Start first mission of next phase |
| Current workflow step in-progress (non-dev workflow) | Resume that step |
| A checkup was pending | Re-run the checkup before continuing |

---

## Per-agent context recovery

Each agent knows what to reload when resuming. This is their standard protocol.

### L'Éclaireur
1. Read `hk-up-status.yaml` → understand where the journey stands
2. If resuming during diagnostic: reload `steps/step-0{N}-{name}.md` for the current step
3. Present the resume menu to the user

### Le Stratège
1. Read `hk-up-status.yaml` → identify current phase
2. Read `{output_folder}/project-context.md` → project context
3. If brainstorming: read `{output_folder}/brainstorm-session.md`
4. If PRD: read `{output_folder}/prd.md` for current state
5. If direction confirmed: read `{output_folder}/direction.md`
6. Resume from the step matching `in-progress` status

### L'Architecte
1. Read `hk-up-status.yaml` → identify current position
2. Read `{output_folder}/prd.md` → the contract
3. Read `{output_folder}/architecture.md` → decisions already made
4. Read `{output_folder}/plan.md` → missions and their status
5. Resume from the current step or mission

### Le Chirurgien
1. Read `hk-up-status.yaml` → find the mission marked `in-progress`
2. Read `{output_folder}/missions/{mission_id}.md` → the brief
3. Read relevant existing code files listed in the brief
4. Do NOT read the full architecture — focus on the mission brief scope
5. If the mission was mid-execution: read the completed tasks in the brief and continue

### Le Gardien
1. Read `hk-up-status.yaml` → find the mission marked `review`
2. Read `{output_folder}/missions/{mission_id}.md` → the brief
3. Read `{output_folder}/prd.md` or `project-context.md` → the reference
4. Read `{output_folder}/plan.md` → the Quest objectives for phase checkup context
5. Run validation from scratch — never assume the last partial review was complete

### Nyx
1. Read `hk-up-status.yaml` → identify where the security workflow stands
2. Read `{output_folder}/project-context.md` → project context
3. Read `{output_folder}/security-audit.md` → findings already documented
4. Resume from the current security step

---

## Context recovery after conversation compaction

When a conversation is compacted, in-context memory is lost but the output files remain.
This is different from a user returning after days — it can happen mid-session.

**Detection:** If an agent realizes it has lost context (cannot recall decisions made earlier in the conversation), it must:

1. **Do not guess or reconstruct from memory** — the files are authoritative
2. Reload in this order:
   - `{output_folder}/hk-up-status.yaml` → current state
   - `{output_folder}/project-context.md` → project facts
   - Current step's output document (prd.md, architecture.md, etc.)
   - Current mission brief (if in dev phase)
3. Acknowledge the reload to the user:
   ```
   Context was compacted. I've reloaded:
   - hk-up-status.yaml (current state: {position})
   - {document_1}
   - {document_2}

   Continuing from: {current_step_or_mission}
   ```

### What each output document contains (quick reference)

| File | Contains |
|------|----------|
| `hk-up-status.yaml` | All mission statuses, current phase, confirmed path, escalation history |
| `project-context.md` | Project diagnosis, stack, health, confirmed objective, conventions |
| `prd.md` | All features with acceptance criteria, priority, status |
| `direction.md` | Confirmed scope (Must Have / Should Have / out of scope) |
| `architecture.md` | All Architecture Decision Records + migration strategy |
| `plan.md` | All Quests, Missions, task lists, git strategy |
| `spec-design.md` | Design tokens, mockup specs, accessibility decisions |
| `security-audit.md` | DREAD findings, duel verdicts, remediation plan |
| `debt-verdict.md` | All debt items with FIX/ACCEPT/DEFER verdicts |
| `missions/{id}.md` | Mission brief: context, tasks, constraints, references |

---

## hk-up-status.yaml — The resume file

This file is updated by Rule 7 after every major action. Its structure makes it possible to
resume any workflow at any granularity.

**Key fields for resume:**

```yaml
project: {project_name}
last_updated: {ISO datetime}
parcours: {express | standard | full | design | audit}
escalated_from: {previous_path}     # only if escalated
known_limitations:                   # only if user chose to stay on lower path
  - "{limitation} — confirmed {date}"

phases:
  {phase_id}:
    status: {backlog | in-progress | done}
    missions:
      {mission_id}: {backlog | in-progress | review | done}
```

**Resume reads:**
1. Find the phase with `status: in-progress`
2. Within that phase, find the mission that is `in-progress` or `review`
3. That is the resume point

**If nothing is `in-progress`:** Find the first `backlog` mission in the first `backlog` or `in-progress` phase.

---

## Restart from scratch (Option 3)

If the user chooses to restart:

```
Restarting the diagnostic from scratch.

  What will be reset:
  ✗ hk-up-status.yaml — will be deleted
  ✓ Output files (project-context.md, prd.md, etc.) — NOT deleted automatically
    You can keep them as reference or delete them manually.

  Proceeding to step-01 of the diagnostic.
```

Delete `hk-up-status.yaml`. Do not delete any other files without explicit confirmation.
Proceed to `workflows/diagnostic/steps/step-01-scan.md`.
