---
mode: simulation
type: reflection-mode
loaded_by: agents, step files
---

# Simulation — Test a Decision Before Committing

> **CRITICAL — Rule 1:** The user selects the simulation type and scenario. Never auto-select.
> **CRITICAL:** The user can redirect or stop the simulation at any point. Never force completion.
> **CRITICAL:** Simulations are exploratory — findings are observations, not prescriptions.

---

## What it is

A Simulation runs a concrete real-world scenario to stress-test a decision before it is made.
Unlike the Prisme (analytical lenses) or the Table Ronde (debate), a Simulation plays out
a sequence of events and reports what breaks, what holds, and what is missing.

---

## 6 Simulation Types

### Type 1 — Stress Test

**Agents:** L'Architecte + Zero | **When:** After architecture design, before committing to infra choices.

**Method:** Identify bottleneck components → estimate breaking thresholds → Zero challenges with benchmarks → map cascade failures.

<output-format>
STRESS TEST SIMULATION
Scenario: {specific load scenario}

  Component analysis:
  {component_1}: breaks at {threshold} — reason: {why}
  {component_2}: breaks at {threshold} — reason: {why}

  First failure: {component} at {threshold}
  Cascade: {component_1} → {component_2} → {impact}

  Zero's challenge: {alternative approach or benchmark}

  Verdict: {holds | breaks at X | requires architectural change}
</output-format>

---

### Type 2 — Migration Dry Run

**Agents:** L'Architecte + Le Chirurgien | **When:** Before a major tech migration or multi-file refactor.

**Method:** Map dependencies → trace breaking changes → estimate cost per component → define safest migration sequence → list unmitigable risks.

<output-format>
MIGRATION DRY RUN SIMULATION
Scenario: Migrate from {current} to {target}

  Dependency map:
  {component_1}: {rewrite | adapt | keep} — {estimated_effort}
  {component_2}: {rewrite | adapt | keep} — {estimated_effort}

  Total estimate: {total_effort}
  Breaking changes: {count}
  Irreversible steps: {list}

  Recommended sequence:
  1. {step_1} — {why first}
  2. {step_2}

  Highest risk: {what could go wrong and when}
</output-format>

---

### Type 3 — User Journey

**Agents:** Le Designer + L'Éclaireur | **When:** After UI audit, before finalizing mockups.

**Method:** Pick a key flow → trace every screen/interaction → note friction points → rate severity → L'Éclaireur provides historical context.

<output-format>
USER JOURNEY SIMULATION
Flow: {flow_name} — {target_user_type}

  Step 1: {action}
    State: {what the user sees}
    Friction: {none | {description} — {Critical | Major | Minor}}

  Step 2: {action}
    State: {what the user sees}
    Friction: {none | {description} — {Critical | Major | Minor}}

  Friction summary:
  Critical: {count} — {brief list}
  Major:    {count} — {brief list}
  Minor:    {count} — {brief list}

  Highest priority fix: {most critical friction and why}
</output-format>

---

### Type 4 — Incident Response

**Agents:** Nyx + The Mask | **When:** After security audit, when evaluating detection/recovery capabilities.

**Method:** Define incident → trace alerting → The Mask simulates attacker actions during detection gap → Nyx traces containment/recovery → evaluate the plan.

<output-format>
INCIDENT RESPONSE SIMULATION
Incident: {specific incident}

  Timeline:
  T+0:  Incident occurs — {what happened}
  T+{X}: First detection — {how, or "NOT DETECTED"}
  T+{Y}: Containment — {action, or "NO CONTAINMENT PROCEDURE"}
  T+{Z}: Recovery — {action, or "NO RECOVERY PLAN"}

  The Mask (attacker window):
  During the {X}-minute detection gap: {what the attacker can do}
  Impact: {data volume, systems affected, blast radius}

  Nyx (defense assessment):
  Detection gap: {duration} — {acceptable | too long | critical}
  Containment: {exists | partial | missing}
  Recovery: {documented | undocumented | untested}

  Critical gap: {most dangerous unaddressed gap}
</output-format>

---

### Type 5 — Onboarding Dev

**Agent:** L'Éclaireur (fresh perspective) | **When:** During code review, when evaluating documentation quality.

**Method:** Approach the codebase with no context → answer 5 standard questions → rate findability → identify missing docs.

**The 5 questions:** 1. How do I run this locally? 2. Where is the entry point? 3. How is the code organized? 4. How do I add a feature? 5. How do I run the tests?

<output-format>
ONBOARDING DEV SIMULATION

  Q1 — How do I run this locally?
    Answer: {found | not found | partially documented}
    Where: {file:line or "missing"}
    Rating: {Easy | Hard | Impossible}

  Q2 — Where is the entry point?
    [same format]

  Q3 — How is the code organized?
    [same format]

  Q4 — How do I add a feature?
    [same format]

  Q5 — How do I run the tests?
    [same format]

  Readability score: {count}/5 Easy
  Missing documentation: {list}
  Recommendation: {what to write first to unblock a new dev}
</output-format>

---

### Type 6 — Rollback

**Agents:** Le Chirurgien + L'Architecte | **When:** After architecture plan, before accepting irreversible decisions.

**Method:** For each change, evaluate reversibility → identify irreversible changes → define rollback procedures → estimate time and risk.

<output-format>
ROLLBACK SIMULATION
Scope: {recent missions or planned changes}

  {change_1}: {reversible | partially reversible | irreversible}
    Rollback procedure: {steps, or "NONE — irreversible"}
    Rollback time: {estimate}
    Risk: {what could go wrong during rollback}

  {change_2}: [same format]

  Irreversible changes: {count}
    {list with why each is irreversible}

  Safest rollback sequence: {ordered list}
  Critical decision point: {the change after which rollback becomes impossible}
</output-format>

---

## How to run a Simulation

### Step 1 — Type selection

<output-format>
Which simulation would you like to run?

  1. Stress Test        — Test load limits of each component
  2. Migration Dry Run  — Simulate a stack or pattern change
  3. User Journey       — Walk through a flow as a real user
  4. Incident Response  — Simulate a critical system failure
  5. Onboarding Dev     — Can a new dev understand the codebase?
  6. Rollback           — Can we safely revert if something breaks?
</output-format>

### Step 2 — Scenario selection

After user picks a type, present numbered scenarios relevant to that type:

<output-format>
{Simulation type} — Choose a scenario:

  Stress Test:       1. 10x users  2. 100x data volume  3. Other
  Migration Dry Run: 1. Upgrade framework  2. Switch library  3. Other
  User Journey:      1. New user  2. Returning user  3. Admin  4. Other
  Incident Response: 1. Data loss  2. Credentials leaked  3. DDoS  4. Other
  Onboarding Dev:    (runs 5 standard questions — no sub-choice)
  Rollback:          1. Last mission  2. Entire phase  3. Other
</output-format>

### Step 3 — Run and close

Run the simulation using the format for the selected type. After completion, present findings.
Close keywords: "done" / "terminé", "close" / "on ferme". Re-show reflection modes menu with check.

---

## Saving output

<output-format>
### Simulation — {type_name} (validated)

- Type: {Stress Test | Migration Dry Run | User Journey | Incident Response | Onboarding Dev | Rollback}
- Scenario: {description}
- Agents: {list}

**Key findings:**
- {finding_1}
- {finding_2}

**Critical gap / highest risk:** {one-sentence summary}
**Recommended action:** {most important next step}
</output-format>
