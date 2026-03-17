---
type: system-reference
loaded_by: agents (L'Éclaireur, L'Architecte, Le Chirurgien, Le Gardien)
rule: Rule 1 — The user decides. Rule 7 — Save state after structural changes.
---

# Escalade — Path Escalation System

> **CRITICAL — Rule 1:** The user decides whether to escalate. Never auto-escalate.
> **CRITICAL:** Escalation is a proposal with evidence — not a judgment about the project.
> **CRITICAL — Rule 7:** If the user escalates, update hk-up-status.yaml before continuing.

---

## What it is

Escalation happens when the project reveals more complexity than was initially detected.
The initial path was set during the diagnostic based on size and objective — but the actual
complexity surfaces during execution.

Escalation is not a failure. It is the system working correctly: recognizing reality and
giving the user a choice.

---

## Detection signals

Any agent can trigger an escalation proposal when they observe these signals:

### During diagnostic (L'Éclaireur)

- Project scanned as SMALL but the user's stated ambition is LARGE in scope
- Dependencies detected that were not visible at surface level (monorepo, shared libraries)
- Significant technical debt that would invalidate a lightweight path
- Security vulnerabilities that require a full audit before proceeding

### During brainstorming / PRD (Le Stratège)

- Feature count or complexity significantly exceeds what the initial path was designed for
- The user's requirements reveal integrations or compliance needs the path doesn't cover
- Mission count estimate during rough planning exceeds the path's target range by more than 50%

### During architecture (L'Architecte)

- The codebase has more cross-cutting dependencies than the diagnostic revealed
- The required architecture changes are too invasive for the current path
- Migration complexity (data, API contracts, external integrations) was underestimated

### During execution (Le Chirurgien)

- A mission hits a blocker that requires architectural decisions not in the plan
- Implementation reveals hidden coupling that invalidates the existing architecture
- The 2-3 task maximum per mission is being repeatedly broken by complexity

### During validation (Le Gardien)

- Review reveals patterns indicating structural problems beyond the mission scope
- Multiple missions are failing validation for the same architectural reason

---

## Escalation menu format

Present the escalation proposal with specific evidence:

```
⚠ ESCALATION SIGNAL — {what was detected}

The project appears more complex than initially assessed.

  Current path: {current_path} (~{estimated_missions} missions)
  Evidence:
    - {signal_1 — specific, factual}
    - {signal_2 — specific, factual}

  Recommendation: escalate to {higher_path}
  What this adds:
    - {added_scope_1}
    - {added_scope_2}
  Additional effort estimate: ~{N} more missions

  ────────────────────────────────────────────────────────────
  1. Escalate to {higher_path}
     → I'll update plan.md and hk-up-status.yaml with the new scope
  2. Stay on {current_path}
     → Understood: {what won't be covered} won't be addressed this session
  3. Let's discuss first (Table Ronde)
     → Open a brief Table Ronde with L'Architecte + Le Stratège + Zero
```

Wait for the user's explicit choice. Never proceed without confirmation.

---

## Escalation matrix

Valid escalation paths:

| Current path | Can escalate to | What is added |
|--------------|-----------------|---------------|
| **Express** | Standard | Brainstorming + PRD + formal Architecture + more missions |
| **Express** | Full | Everything: Brainstorm, PRD, Architecture, Design (if UI), Security, more missions |
| **Express** | Audit (add-on) | Security audit + Tribunal de la Dette, no code change |
| **Standard** | Full | Design workflow + Security workflow + deeper architecture |
| **Standard** | Audit (add-on) | Security audit added on top of current path |
| **Design** | Design+ | More screens, deeper accessibility, more mockup fidelity |
| **Design** | Full Design | Adds comprehensive UX research, component library |
| **Any path** | + Audit (overlay) | Security audit can be added at any point, to any path |

**Direction of escalation:** Always upward. Downscaling (de-escalation) is not escalation — it is a scope reduction and is handled separately.

---

## What happens when the user escalates

### Step 1 — Confirm the new path

```
Escalating from {current_path} to {new_path}.

  New scope includes:
  - {added_workflow_1}
  - {added_workflow_2}
  - {additional_missions} additional missions estimated

  Already completed work is preserved — we don't restart.
  We continue from the current point with the expanded plan.

Confirm escalation?
```

### Step 2 — Update the plan

**L'Architecte** (or the current agent) updates:

1. **plan.md** — add new Quests or missions for the expanded scope
2. **hk-up-status.yaml** — add new missions as `backlog` under the appropriate phases
3. If a new workflow is added (e.g., Security): add the workflow's phase to `hk-up-status.yaml`

**hk-up-status.yaml update format after escalation:**
```yaml
# Before escalation:
parcours: express

# After escalation to Standard:
parcours: standard
escalated_from: express
escalated_at: {date}

phases:
  # Existing phases remain unchanged with their current statuses
  # New phases are added with status: backlog
  phase-brainstorming:
    status: backlog
    missions:
      ...
```

### Step 3 — Inform the user of the new state

```
Escalation complete.

  Path: {old_path} → {new_path}
  Completed work: preserved ({done_count} missions done)
  New missions added: {new_count} (all backlog)

  Updated hk-up-status.yaml — new phases and missions registered.

  Continuing from: {current_position}
  Next: {immediate_next_step}
```

### Step 4 — Continue current work

Escalation does not restart completed work. Continue from the current step.
The new phases will be executed when the current path reaches them.

---

## What happens when the user stays on the current path

```
Understood. Staying on {current_path}.

  Acknowledged limitations:
  - {what_won't_be_covered_1}
  - {what_won't_be_covered_2}

  These are documented as known limitations.
  Continuing with the current plan.
```

Add a `known_limitations` section to `hk-up-status.yaml`:
```yaml
known_limitations:
  - "{limitation_1} — user confirmed, date: {date}"
  - "{limitation_2} — user confirmed, date: {date}"
```

---

## Escalation check cadence

Agents check for escalation signals at these points:

| Point | Who checks | What triggers escalation |
|-------|------------|--------------------------|
| Diagnostic step-03 (objective selection) | L'Éclaireur | User's ambition exceeds path capacity |
| Diagnostic step-04 (path recommendation) | L'Éclaireur | Size × objective matrix suggests higher path |
| Architecture step-01 (analysis) | L'Architecte | Dependency complexity exceeds path scope |
| Architecture step-02 (design) | L'Architecte | Migration complexity underestimated |
| After each Quest (phase checkup) | Le Gardien | Systematic failures suggesting structural problem |
| Mid-mission (any) | Le Chirurgien | Blocker requiring architectural decision |

---

## Escalation is not a crisis

The framing matters. Always present escalation as:
- A natural discovery process ("the complexity surface as we dig deeper")
- A user choice with clear tradeoffs (not a judgment about the project's quality)
- A non-disruptive change (work already done is preserved)

Never say: "The project is too complex for this path."
Always say: "I'm seeing complexity that this path wasn't designed for — here's what we can do."
