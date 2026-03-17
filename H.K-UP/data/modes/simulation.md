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

A Simulation runs a specific real-world scenario to stress-test a decision before it is made.
Unlike the Prisme (analytical lenses) or the Table Ronde (debate), a Simulation plays out a
concrete sequence of events and reports what breaks, what holds, and what is missing.

6 simulation types are available. Each has dedicated agents, a method, and a specific output.

---

## 6 Simulation Types

### Type 1 — Stress Test

**Scenario:** "What if the load is 10x or 100x the current users?"

**Agents:** L'Architecte + Zero

**When to use:**
- After architecture design
- When a scalability decision is being debated
- Before committing to a technology or infrastructure choice

**Method:**
1. Identify the system's current bottleneck components (database, API layer, file storage, etc.)
2. For each component, estimate at what scale it breaks (concurrent users, requests/sec, data volume)
3. Zero challenges L'Architecte's estimates with benchmarks or alternative approaches
4. Map the sequence of failures: which component breaks first, what cascades

**Running the simulation:**
```
STRESS TEST SIMULATION
Scenario: {specific load scenario — e.g., "10,000 concurrent users at checkout"}

  Component analysis:
  {component_1}: breaks at {estimated_threshold} — reason: {why}
  {component_2}: breaks at {estimated_threshold} — reason: {why}
  [...]

  First failure: {component} at {threshold}
  Cascade: {component_1} → {component_2} → {impact}

  Zero's challenge: {alternative approach or benchmark that changes the estimate}

  Verdict: {holds | breaks at X | requires architectural change}
```

**Output:** Components ranked by fragility, breaking point per component, recommended mitigations.

---

### Type 2 — Migration Dry Run

**Scenario:** "Simulate switching to a different stack, framework, or architectural pattern."

**Agents:** L'Architecte + Le Chirurgien

**When to use:**
- When a major technology migration is being evaluated
- Before committing to a refactoring that affects many files
- When comparing two architectural approaches

**Method:**
1. Identify all files and components that depend on the current approach
2. Trace breaking changes: what would need to be rewritten vs adapted vs left as-is
3. Estimate migration cost in hours/days per component
4. Identify the safest migration sequence (strangler fig vs big bang)
5. List the risks that cannot be mitigated

**Running the simulation:**
```
MIGRATION DRY RUN SIMULATION
Scenario: Migrate from {current} to {target}

  Dependency map:
  {component_1}: {rewrite | adapt | keep} — {estimated_effort}
  {component_2}: {rewrite | adapt | keep} — {estimated_effort}
  [...]

  Total estimate: {total_effort}
  Breaking changes: {count}
  Irreversible steps: {list}

  Recommended sequence:
  1. {step_1} — {why first}
  2. {step_2}
  [...]

  Highest risk: {what could go wrong and when}
```

**Output:** Migration cost estimate, risk assessment, recommended sequence.

---

### Type 3 — User Journey

**Scenario:** "Walk through the app as a real user and report every friction point."

**Agents:** Le Designer + L'Éclaireur

**When to use:**
- After a UI audit or design direction
- When UX quality is being evaluated
- Before finalizing mockups

**Method:**
1. Pick a key flow (onboarding, checkout, account setup, core feature)
2. Trace every screen, interaction, and state transition in sequence
3. For each step: note friction points (confusion, latency, errors, dead ends)
4. Rate severity of each friction point (Critical / Major / Minor)
5. L'Éclaireur provides historical context (e.g., "this was redesigned twice before")

**Running the simulation:**
```
USER JOURNEY SIMULATION
Flow: {flow_name} — {target_user_type}

  Step 1: {action}
    State: {what the user sees}
    Friction: {none | {description} — {Critical | Major | Minor}}

  Step 2: {action}
    State: {what the user sees}
    Friction: {none | {description} — {Critical | Major | Minor}}

  [...]

  Friction summary:
  Critical: {count} — {brief list}
  Major:    {count} — {brief list}
  Minor:    {count} — {brief list}

  Highest priority fix: {most critical friction and why}
```

**Output:** Friction map with severity ratings per step, prioritized fix list.

---

### Type 4 — Incident Response

**Scenario:** "A critical system failure has occurred. What happens?"

**Agents:** Nyx + The Mask

**When to use:**
- After a security audit
- When evaluating incident detection and recovery capabilities
- Before accepting a risk in the security duel

**Method:**
1. Define the incident (database corruption, API down, credentials leaked, DDoS)
2. Trace what alerting exists — is the incident detected, and how fast?
3. The Mask simulates the attacker's actions during the incident window
4. Nyx traces the detection → containment → recovery sequence
5. Identify the detection gap (time between incident and awareness)
6. Evaluate the recovery plan: is it documented? Tested? Realistic?

**Running the simulation:**
```
INCIDENT RESPONSE SIMULATION
Incident: {specific incident — e.g., "Attacker exfiltrated the user database"}

  Timeline:
  T+0:  Incident occurs — {what happened}
  T+{X}: First detection — {how, or "NOT DETECTED"}
  T+{Y}: Containment — {action taken, or "NO CONTAINMENT PROCEDURE"}
  T+{Z}: Recovery — {action taken, or "NO RECOVERY PLAN"}

  The Mask (attacker window):
  During the {X}-minute detection gap: {what the attacker can do}
  Impact: {data volume, systems affected, blast radius}

  Nyx (defense assessment):
  Detection gap: {duration} — {acceptable | too long | critical}
  Containment: {exists | partial | missing}
  Recovery: {documented | undocumented | untested}

  Critical gap: {most dangerous unaddressed gap}
```

**Output:** Incident timeline, detection gap, recovery plan assessment.

---

### Type 5 — Onboarding Dev

**Scenario:** "A new developer joins the project. Can they understand the codebase without help?"

**Agent:** L'Éclaireur (fresh perspective mode)

**When to use:**
- During code review
- When evaluating documentation quality
- When the team is growing

**Method:**
1. L'Éclaireur simulates approaching the codebase with no prior context
2. Try to answer 5 standard questions a new dev would have (from scratch)
3. For each: rate how easy it is to find the answer (Easy / Hard / Impossible)
4. Identify missing documentation, confusing naming, and implicit knowledge

**The 5 standard questions:**
1. "How do I run this project locally?" → README, setup instructions
2. "Where is the entry point?" → main file, routing, bootstrap
3. "How is the code organized?" → folder structure, module boundaries
4. "How do I add a feature?" → conventions, patterns, where to start
5. "How do I run the tests?" → test command, test structure

**Running the simulation:**
```
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
  Confusing areas: {list}
  Recommendation: {what to write first to unblock a new dev}
```

**Output:** Readability score, missing documentation list, confusing areas, recommended first doc.

---

### Type 6 — Rollback

**Scenario:** "We deployed and it broke. How do we revert?"

**Agents:** Le Chirurgien + L'Architecte

**When to use:**
- After an architecture plan
- When evaluating deployment safety
- Before accepting an irreversible architectural decision

**Method:**
1. For each recent mission or planned change, evaluate: can it be reverted cleanly?
2. Identify irreversible changes (database migrations, API contract breaks, data loss)
3. Define the rollback procedure for each reversible change
4. Estimate rollback time and risk per change

**Running the simulation:**
```
ROLLBACK SIMULATION
Scope: {recent missions or planned changes being evaluated}

  {change_1}: {reversible | partially reversible | irreversible}
    Rollback procedure: {steps, or "NONE — irreversible"}
    Rollback time: {estimate}
    Risk: {what could go wrong during rollback}

  {change_2}: [same format]
  [...]

  Irreversible changes: {count}
    {list with why each is irreversible}

  Safest rollback sequence: {ordered list}
  Critical decision point: {the change after which rollback becomes impossible}
```

**Output:** Rollback plan per change, list of irreversible decisions, critical decision point.

---

## How to run a Simulation

1. Present the 6 types with a one-line description each:
```
Which simulation would you like to run?

  1. Stress Test        — Test load limits of each component
  2. Migration Dry Run  — Simulate a stack or pattern change
  3. User Journey       — Walk through a flow as a real user
  4. Incident Response  — Simulate a critical system failure
  5. Onboarding Dev     — Can a new dev understand the codebase?
  6. Rollback           — Can we safely revert if something breaks?
```

2. Once the user selects: confirm the specific scenario
   - "Which flow?" (for User Journey)
   - "Which incident?" (for Incident Response)
   - "Which migration?" (for Migration Dry Run)

3. Run the simulation using the format for that type

4. After the simulation ends: present findings, then re-show the reflection modes menu with ✓

---

## Saving output

```markdown
### Simulation — {type_name} (validated)

- Type: {Stress Test | Migration Dry Run | User Journey | Incident Response | Onboarding Dev | Rollback}
- Scenario: {description}
- Agents: {list}

**Key findings:**
- {finding_1}
- {finding_2}

**Critical gap / highest risk:** {one-sentence summary}

**Recommended action:** {most important next step}
```
