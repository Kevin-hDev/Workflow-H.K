---
step: "04"
name: "Status"
workflow: architecture
agent: architecte
---

# Step 04 — Status

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL — Rule 7:** hk-up-status.yaml is the single source of truth. All missions must appear in it.
> **CRITICAL:** All missions start at `backlog` status. Only L'Architecte sets the first Mission to `in-progress`.
> **CRITICAL:** Git strategy must match the confirmed path (Express/Standard/Full) from `project-context.md`.
> **CRITICAL — Rule 1:** Present both the status file and the git strategy to the user before saving.

---

## Goal

Generate the execution registry (`hk-up-status.yaml`) with every Mission from step-03 initialized
at `backlog`. Define the git strategy adapted to the confirmed path. Present both to the user
for confirmation. Save.

---

## Phase 1 — Generate hk-up-status.yaml

Create the complete status file with all Missions from `plan.md`.

Every Mission appears exactly once. Status starts at `backlog` — no exceptions.
The structure reflects the Quest/Mission hierarchy from step-03.

```yaml
project: {project_name}
last_updated: {date}
parcours: {express | standard | full}
current_phase: 1

phases:
  phase-1-{quest_1_slug}:
    name: "{Quest 1 name}"
    status: backlog
    missions:
      1-1-{mission_1_1_slug}: backlog
      1-2-{mission_1_2_slug}: backlog

  phase-2-{quest_2_slug}:
    name: "{Quest 2 name}"
    status: backlog
    missions:
      2-1-{mission_2_1_slug}: backlog
      2-2-{mission_2_2_slug}: backlog

  {... one entry per Quest, one line per Mission}
```

**Naming rules:**
- Quest slugs: kebab-case, max 4 words (e.g., `restructure-api-layer`)
- Mission slugs: kebab-case, descriptive (e.g., `extract-auth-middleware`)
- Consistent with the Mission brief filenames in `missions/`

**Note:** This file will be read and updated by Le Chirurgien (marks `review`) and
Le Gardien (marks `done`) throughout the execution phase. Keep it clean and minimal.

---

## Phase 2 — Define git strategy

Based on the confirmed path from `project-context.md`:

| Path | Git strategy |
|------|-------------|
| **Express** | 1 feature branch for the entire execution. Merge to main at the end. |
| **Standard** | 1 branch per Quest (= per phase). Merge between phases. |
| **Full** | 1 branch per Quest. PR + review before each merge. |

**Document the strategy:**

```markdown
## Git Strategy — {project_name}

### Confirmed path: {Express | Standard | Full}

### Branch naming convention
{Express}:   feature/{project-slug}-hkup
{Standard}:  phase/{quest-slug}       (e.g., phase/restructure-api-layer)
{Full}:      quest/{quest-slug}        (e.g., quest/restructure-api-layer)

### Merge points
{Express}:  Single merge to main after all Missions are done and Le Gardien validates.
{Standard}: Merge after each Quest (phase) is done and Le Gardien approves the phase checkup.
{Full}:     PR per Quest. Code review required. L'Architecte reviews the PR before merge.

### Commit convention (Le Chirurgien)
  Format: {type}({scope}): {what changed}
  Examples:
    feat(auth): extract middleware from routes to auth/middleware.js
    refactor(api): move validation logic to service layer
    test(dashboard): add unit tests for KPI calculation

### First branch to create
  Name: {branch_name}
  From: {main | develop | current base branch}
  When: Before Mission {first_mission_id} starts
```

---

## Phase 3 — Present and confirm

Show the user both outputs:

```
Here is what I've prepared for the execution phase:

STATUS REGISTRY (hk-up-status.yaml)
  Missions registered: {count}
  Starting status: all backlog

  {condensed view of the status file — Quest by Quest, mission list}

GIT STRATEGY
  Path: {Express | Standard | Full}
  Strategy: {one-line summary}
  Branch naming: {pattern}
  First branch: {branch_name} (to create before Mission {first_mission_id})
  Merge points: {list}

Any adjustments before I save?
```

Wait for confirmation. Adjust branch naming or merge points if the user has preferences.

---

## Phase 4 — Save hk-up-status.yaml

Save the confirmed status file to `{output_folder}/hk-up-status.yaml`.

This file lives in the **output folder** alongside `architecture.md` and `plan.md`.
It is the execution registry — Le Chirurgien and Le Gardien will update it directly.

---

## Reflection modes menu

```
Status registry ready. Any last checks?

  REFLECTION MODES
  1. Simulation   — Rollback: "Branch 2.1 is broken, how do we recover?"

  ─────────────────────────────────────────
  S. Save and proceed to final validation (step-05)
```

---

## Transition

```
Step 04 complete.

hk-up-status.yaml saved.
Missions registered: {count} (all: backlog)
Git strategy: {strategy name}
First branch: {branch_name}

→ Step 05 — Final validation.
  You'll review the complete plan before we hand off to Le Chirurgien.
```

Update `hk-up-status.yaml` (the H.K-UP build status, not the project one):
`6-2-plan-missions → step-04: done`
Proceed to **step-05-validation.md**
