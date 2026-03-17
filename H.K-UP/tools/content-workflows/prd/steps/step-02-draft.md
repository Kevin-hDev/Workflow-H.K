---
step: "02"
name: "PRD Draft"
workflow: prd
agent: stratege
---

# Step 02 — PRD Draft

> **CRITICAL — Rule 1:** Present EACH section to the user for validation before writing the next.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** Every Must Have from direction.md must appear as a requirement. No exceptions.
> **CRITICAL:** Requirements define WHAT, never HOW. No implementation details.
> **CRITICAL:** Every feature must have at least one measurable acceptance criterion.

---

## Goal

Write the complete PRD section by section, interactively.
The user validates each section before the next one is written.
The PRD is the contract — nothing is left implicit.

---

## How to write the PRD

- One section at a time. Write it. Present it. Wait for feedback. Adjust. Move on.
- Requirements define capabilities, not implementations.
  ✓ "Users can filter results by date range"
  ✗ "Add a date picker component with startDate and endDate props"
- Every feature traces back to direction.md.
- Acceptance criteria must be testable — avoid vague terms like "fast", "easy", "good".
- Use the brief from step-01 as the single source of truth.

---

## PRD Structure

Write sections in this exact order. Present each before continuing.

---

### Section 1 — Overview

```markdown
## 1. Overview

**Project:** {project_name}
**Date:** {date}
**Author:** Le Stratège
**Path:** {confirmed_path}
**Version:** 1.0

### 1.1 Description
{one paragraph: what this project is, who it's for, what problem it solves}

### 1.2 Objective
{confirmed objective(s) from L'Éclaireur — exact wording}

### 1.3 Direction
{confirmed direction statement from brainstorming — exact wording}
```

Present to user. Wait for "ok" or adjustments. Then continue.

---

### Section 2 — Users & Personas

```markdown
## 2. Users & Personas

{For each user type identified in project-context.md and brainstorming:}

### {User Type Name}
- **Role:** {what they do}
- **Primary need:** {what they're trying to accomplish}
- **Pain points:** {what frustrates them today}
- **Success looks like:** {what a good outcome means for them}
```

If JTBD or Focus Group techniques were used in brainstorming,
pull the personas and statements from brainstorm-session.md directly.

Present to user. Adjust if needed.

---

### Section 3 — Must Have Features

This is the core contract. Write every Must Have from direction.md.

```markdown
## 3. Features — Must Have

{For each Must Have item:}

### F{N}: {Feature Name}

**Description:** {What it does, from the user's perspective. No technical terms.}

**User story:**
> As a {user_type}, I want to {action}, so that {benefit}.

**Acceptance criteria:**
- [ ] {measurable condition 1}
- [ ] {measurable condition 2}
- [ ] {measurable condition 3}

**Priority:** Must Have
**Source:** {brainstorming step or technique that generated this}
```

Rules for acceptance criteria:
- Each criterion can be answered with yes/no
- No "the system should" — use "the user can" or "{actor} can"
- No percentages unless grounded in data ("loads in under 2 seconds" not "loads fast")
- Cover happy path + key edge cases

Number features sequentially across all priority tiers (F1, F2, F3...).

Present each feature individually. User validates before moving to next feature.

---

### Section 4 — Should Have Features

```markdown
## 4. Features — Should Have

{Same format as Section 3}

### F{N}: {Feature Name}

**Description:** ...
**User story:** ...
**Acceptance criteria:**
- [ ] ...

**Priority:** Should Have
**Source:** ...
```

Present as a group (all Should Have features together).
User validates the set, then adjusts if needed.

---

### Section 5 — Could Have Features

```markdown
## 5. Features — Could Have

{Same format — lighter acceptance criteria acceptable for lower-priority items}

### F{N}: {Feature Name}

**Description:** ...
**User story:** ...
**Acceptance criteria:**
- [ ] ...

**Priority:** Could Have
**Note:** Out of scope for initial version unless effort is very low.
**Source:** ...
```

---

### Section 6 — Out of Scope

```markdown
## 6. Out of Scope

The following items were discussed and explicitly deferred.
They will not be implemented in this version.

| Feature | Reason |
|---------|--------|
| {item from direction.md "Won't Have"} | {reason from direction.md} |
| {item} | {reason} |
```

This section exists to prevent scope creep.
If something is not listed here but also not in sections 3-5, it doesn't exist.

---

### Section 7 — Technical Constraints

```markdown
## 7. Technical Constraints

### 7.1 Stack
{From project-context.md: languages, frameworks, runtime}

### 7.2 Architecture Constraints
{From project-context.md: deployment model, existing integrations, must-keep systems}

### 7.3 Performance Requirements
{If discussed in brainstorming: response times, concurrent users, data volumes}
If none were specified: "No specific performance requirements defined at this stage."

### 7.4 Compatibility Requirements
{Platforms, browsers, OS versions, API versions that must be supported}
```

---

### Section 8 — Design Requirements

```markdown
## 8. Design Requirements

{Write this section only if design topics were covered in brainstorming.
 If not discussed, write: "Design requirements to be defined in the Design workflow."}

### 8.1 Visual Direction
{Any direction established in brainstorming (Dream Mockup, Focus Group reactions, etc.)}

### 8.2 Accessibility
{WCAG level required, e.g., "Minimum WCAG 2.1 AA compliance"}

### 8.3 Platform Requirements
{Responsive? Mobile-first? Native apps? Desktop only?}
```

---

### Section 9 — Security Requirements

```markdown
## 9. Security Requirements

{Write this section only if security was discussed in brainstorming
 or if project-context.md flagged security concerns.
 If not: "Security requirements to be defined in the Security workflow."}

### 9.1 Data Handling
{What user data is collected? How is it stored? Who can access it?}

### 9.2 Authentication & Authorization
{Who can log in? What roles exist? What actions require what permissions?}

### 9.3 Compliance
{GDPR, HIPAA, PCI-DSS, or other regulations — from Conformité mode if used}
```

---

### Section 10 — Success Metrics

```markdown
## 10. Success Metrics

How will we know the project succeeded?

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| {metric from brainstorm, e.g. Lean Canvas Key Metrics} | {target value} | {how to measure} |
| {metric} | {target} | {method} |
```

If no specific metrics were defined: propose 3 generic candidates based on the project type
and ask the user to select or add their own.

---

### Section 11 — Risks

```markdown
## 11. Risks

{If Pre-mortem or Chaos Monkey were used in brainstorming, pull directly from the session.
 Otherwise, identify top 3 risks based on the feature set.}

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| {risk_1} | High/Med/Low | High/Med/Low | {action to mitigate} |
| {risk_2} | ... | ... | ... |
| {risk_3} | ... | ... | ... |
```

---

## Save the PRD

Once all sections are written and validated:

Save as `{output_folder}/prd.md` with the complete content.

```markdown
---
version: "1.0-draft"
date: {date}
agent: Le Stratège
status: draft
---

# Product Requirements Document — {project_name}

{all sections above}
```

---

## Reflection modes menu

```
PRD draft complete. Would you like to review further before validation?

  REFLECTION MODES
  1. Table Ronde  — Debate the PRD with multiple agents
  2. Prisme       — Review from Business + Technical perspectives
  3. Conformité   — Legal check on privacy and compliance requirements

  ─────────────────────────────────────────
  S. Save and proceed to validation (step-03)
```

---

## Transition

```
Step 02 complete.

prd.md saved (draft).
Sections written: 11
Features defined: {count} (Must: {n}, Should: {n}, Could: {n})
Out of scope: {count} items documented

→ Step 03 — We'll now review the PRD together and confirm
  every section before the final checkup.
```

Update `hk-up-status.yaml`: `5-1-prd-draft → step-02: done`
Proceed to **step-03-validate.md**
