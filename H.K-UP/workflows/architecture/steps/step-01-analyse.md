---
step: "01"
name: "Analyse"
workflow: architecture
agent: architecte
---

# Step 01 — Analyse

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL — Rule 2:** Read ALL input documents before touching the codebase. Never skip one.
> **CRITICAL:** This is a DEEP read — not a surface scan. Read actual code, not just filenames.
> **CRITICAL — Rule 1:** Present findings to the user and wait for confirmation before step-02.
> **CRITICAL:** If Express path, skip prd.md references — work from project-context.md objectives only.

---

## Goal

Read all inputs. Then dig deep into the existing codebase — far deeper than L'Éclaireur's surface
scan. Understand how the system actually works today. Identify what supports the PRD requirements
and what is missing or needs to change. Present findings. Get confirmation.

---

## Phase 1 — Read all inputs

Read in this exact order. Do not skip any document.

**1. project-context.md**
Extract:
- Project name, stack, versions
- Architecture patterns detected (MVC, monolith, microservices, etc.)
- Technical debt inventory
- Key constraints flagged by L'Éclaireur
- Confirmed path (Express / Standard / Full)

**2. prd.md** *(Standard/Full path only — skip if Express)*
Extract every Must Have feature. These are the requirements L'Architecte must cover 100%.
Build a mental checklist: `[F1] [F2] [F3] ...`

**3. brainstorm-session.md** *(Standard/Full path only — skip if Express)*
Extract:
- Key decisions made during brainstorming that affect the architecture
- Technical risks flagged (Pre-mortem, Chaos Monkey results if used)
- Any state-of-the-art findings that constrain or guide the architecture

---

⛔ STOP CHECK
- data/global-rules.md READ (not just listed)? [YES/NO]
- {output_folder}/project-context.md READ (not just listed)? [YES/NO]
- {output_folder}/prd.md READ (not just listed)? [YES/NO] (skip if Express path)
- {output_folder}/brainstorm-session.md READ (not just listed)? [YES/NO] (skip if Express path)
- Ready to proceed with codebase analysis? [YES/NO]

⛔ STOP CONDITION: If any check = NO → Go back and READ the file contents before continuing.

---

## Phase 2 — Deep codebase analysis

Unlike L'Éclaireur's scan (surface level, structure only), L'Architecte reads the actual code.
This is where the real analysis happens.

**Entry points — read actual code:**
- Main files, index files, application bootstrap
- Route definitions (all routes, not just their names)
- API entry points and their handlers
- CLI entry points if applicable

**Module boundaries:**
- How are components separated today?
- What are the module/package boundaries?
- Is separation by feature, by type, or mixed?
- Are there circular dependencies?

**Data flow:**
- How does data move through the system?
- Where is state managed (client / server / database)?
- What are the transformation points (validation, mapping, serialization)?
- Where are the external integrations (APIs, services, queues)?

**Dependencies between modules:**
- Which modules import which?
- What are the most depended-on modules (high coupling risk)?
- What modules are isolated (safe to change without cascading effects)?

**Database schema / models** *(if applicable)*:
- Read the schema files or model definitions
- Note the entities, their relationships, and key constraints
- Flag any schema design that conflicts with the PRD features

**API contracts** *(if applicable)*:
- Read existing API definitions (routes, payloads, response shapes)
- Note what is currently exposed vs. what the PRD will require

**Existing patterns:**
- Naming conventions (files, functions, variables, CSS classes)
- Error handling patterns (are errors typed? bubbled up? swallowed?)
- State management approach
- Testing patterns (if tests exist)
- Authentication / authorization pattern

---

## Phase 3 — Gap analysis

For each Must Have feature from the PRD *(or from project-context.md objectives if Express)*:

1. What exists today that supports this feature?
2. What is missing at the architecture level?
3. What needs to change in the current structure?

Categorize each gap as:
- **EXTEND** — existing module needs new capabilities, structure stays the same
- **ADD** — new module/component/layer needed, no existing code to build on
- **REFACTOR** — existing code works but structure must change to accommodate the feature
- **MIGRATE** — existing code must be replaced (highest risk, justify carefully)

---

## Phase 4 — Present findings

Present in this exact format:

```
ARCHITECTURE ANALYSIS — {project_name}

STRUCTURE
  {module_map: list of key modules/components with their responsibility}

  Example:
  - auth/          → User authentication and session management
  - api/routes/    → Express route handlers (currently 12 routes)
  - models/        → Sequelize models (User, Post, Comment)
  - services/      → Business logic layer (thin — most logic is in routes today)
  - components/    → React UI components (flat, no feature grouping)

DATA FLOW
  {describe how data moves through the system, step by step}

  Example:
  Request → route handler → direct DB query (no service layer) → raw response
  No validation middleware. No serialization layer. Auth check duplicated in each route.

GAPS (what needs to change for the PRD Must Have features)
  - {F1 - Feature name}: {what exists today} → {what's needed at architecture level}
  - {F2 - Feature name}: {what exists today} → {what's needed at architecture level}
  - {F3 - Feature name}: Nothing exists → ADD {new module or layer}

  Gap types: EXTEND | ADD | REFACTOR | MIGRATE

STRENGTHS TO KEEP
  - {pattern or structure worth preserving and building on}
  - {well-isolated module that can be extended safely}
  - {convention or pattern that is consistent and should not change}

TECHNICAL DEBT (architecture level only — flagged by L'Éclaireur)
  - {debt item}: {impact on the PRD implementation plan}

Do you confirm these findings? Anything I missed or misread?
```

Wait for user confirmation. Adjust if they correct anything.

---

## Reflection modes menu

```
Step 01 complete. Want to go deeper before designing?

  REFLECTION MODES
  1. Prisme        — Review the analysis through Technical facets
                     (Performance, Scalability, Maintainability, Testability)
  2. Simulation    — Migration Dry Run: simulate what changes if we touch {module}
  3. Archéologie   — Dig into git history to understand WHY the current structure exists

  ─────────────────────────────────────────
  S. Save and move to architecture design (step-02)
```

**Before executing any mode above, LOAD its data file:**
- Prisme → `data/modes/prisme.md` + `data/prisme-facettes.csv`
- Simulation → `data/modes/simulation.md`
- Archéologie → `data/modes/archeologie.md`

---

## Transition

```
Step 01 complete.

Analysis confirmed.
Modules mapped: {count}
PRD Must Have features to cover: {count}
Gaps identified: {count} ({n} EXTEND, {n} ADD, {n} REFACTOR, {n} MIGRATE)
Strengths preserved: {count}

→ Step 02 — I'll now propose architectural approaches.
  You'll choose one direction before I write the Architecture Decision Records.
```

Update `hk-up-status.yaml`: `6-1-conception → step-01: done`
Proceed to **step-02-design.md**
