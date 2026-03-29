---
name: hk-roadmap
description: "Generate a structured Quest > Mission > Task roadmap for autonomous AI execution. Use when starting a new project, converting a brainstorm/spec/PRD into an actionable plan, or when a project needs a roadmap.md and project-status.yaml. Triggers on: roadmap, plan, create plan, planifier, structurer le projet, quest mission, generate roadmap, create roadmap, plan d'action, /hk-roadmap."
argument-hint: "[project-name]"
---

# Roadmap Generator — Autonomous execution plan

This skill generates a structured Quest > Mission > Task plan designed
for autonomous execution by Claude Code, mission by mission, session
by session, without human intervention.

Each mission is self-sufficient: readable independently, like a complete
brief for an agent with no memory of previous sessions.

<critical_constraints>
This workflow has 5 phases. Execute IN ORDER.
Phase N+1 is impossible without completing Phase N.
Do not skip Phase 2 (validation) even if the plan "looks complete".
Phase 2 exists because forward planning ALWAYS misses things.
</critical_constraints>

## Materialize this checklist with TaskCreate — one task per item

Do NOT track mentally. Create a task for each item below.

- Phase 0: Load context (scan project, extract stack/constraints)
- Phase 1: Decomposition (WBS 100% + MECE + Quest 0 + file ownership)
- Phase 1: STOP CHECK (verify 100% rule + MECE + no file conflicts)
- Phase 2: Validation (backward planning + pre-mortem + gap analysis)
- Phase 2: STOP CHECK (verify INVEST per mission + dependencies)
- Phase 3: Write roadmap.md (follow exact template)
- Phase 4: Write {project}-status.yaml
- Phase 5: Display summary

---

## Phase 0 — Load context

```
1. Identify the project:
   IF $ARGUMENTS contains a name → project_name = argument
   ELSE → project_name = current directory name

2. Scan existing context:
   IF {project}-output/ exists:
     → Read ALL files (brainstorm, prd, specs, design, context)
     → Extract: objective, stack, constraints, decisions made
   IF source code exists:
     → Scan: README, package.json/Cargo.toml, src/ structure
   IF CLAUDE.md exists:
     → Extract: conventions, rules, stack

3. Define output path:
   → {project}-output/roadmap.md
   → {project}-output/{project}-status.yaml
   → Create {project}-output/ if it doesn't exist
```

---

## Phase 1 — Decomposition (WBS + MECE)

Break down the project into Quests, then each Quest into Missions.

### 1.1 Identify Quests

Apply the **100% rule**: the sum of all Quests must cover
EXACTLY 100% of the project scope. Nothing superfluous, nothing missing.

```
For each Quest, verify:
- [ ] Directly contributes to the final objective
- [ ] Does not overlap with any other Quest (MECE: Mutually Exclusive)
- [ ] Together, all Quests cover everything (MECE: Collectively Exhaustive)
```

<important if="decomposing into Quests">
Quest 0 is NOT optional. Every roadmap starts with a Quest 0 that
defines contracts. Without it, missions will break at integration.
</important>

### 1.2 Mandatory Quest 0 — Interface contracts

The first Quest is ALWAYS a horizontal Quest 0 that defines:
- Project scaffolding (init, dependencies, folder structure)
- Database schema (if applicable)
- Shared types/interfaces
- API contracts (routes, payloads)
- Centralized constants and configuration
- Naming conventions and file structure

Subsequent Quests implement AGAINST these contracts.
This is the most effective technique to prevent integration surprises.

### 1.3 Vertical slicing for subsequent Quests

Each Quest after Quest 0 should traverse all layers
(DB + API/logic + UI) to deliver a complete feature.

Why: each Quest produces testable and executable code,
integration issues surface immediately, and if one Quest
fails the others are not affected.

### 1.4 Break down into Missions

Each Quest breaks into Missions. Apply the 100% rule again:
Missions must cover 100% of the Quest.

```
Constraints per Mission:
- MAXIMUM 3 tasks per mission
- Executable in ONE Claude Code session
- MECE boundaries: no mission overlaps another
```

### 1.5 File ownership

Each mission declares its files:
- `files_created:` — files created by this mission
- `files_modified:` — existing files modified

**Critical rule**: if two missions modify the same file,
they MUST have an explicit dependency (sequential).
Otherwise, the decomposition is wrong — re-split.

### STOP CHECK — End of Phase 1

Before moving to Phase 2, verify:

1. **100% rule**: for each Quest, do its Missions cover everything?
   List any gap found: ____
2. **MECE**: do any two missions modify the same file?
   List conflicts found: ____
   - If conflicts: re-split the missions until no overlap
3. **Quest 0 exists** with contracts/scaffolding defined
4. **Max 3 tasks** per mission — count any that exceed: ____
   - If any exceed: split into two missions

**Phase 2 is BLOCKED until all checks pass (zero gaps, zero conflicts).**

---

## Phase 2 — Plan validation (before writing)

Before writing roadmap.md, validate the plan with these 5 passes:

### 2.1 Backward planning

Start from the final result and work backwards:
"For the final product to work, I need X.
For X, I need Y. For Y, I need Z."
Identify hidden prerequisites that forward planning missed.

### 2.2 Pre-mortem

For each Quest, assert: "this Quest has failed spectacularly".
List the 3 most probable causes of failure.
If a cause is actionable → add a task or a mission.

### 2.3 Gap analysis

Verify the plan covers these commonly forgotten categories:
- [ ] Error handling (not just the happy path)
- [ ] User input validation
- [ ] Security / hardening
- [ ] Tests (unit, integration)
- [ ] Configuration / environment variables
- [ ] i18n (if applicable)
- [ ] Data migration (if applicable)
- [ ] Identified edge cases

If something is missing → add a dedicated mission.
The "last 20%" (error handling, edge cases, polish) must be
EXPLICIT missions, not "cleanup at the end".

### 2.4 Dependency verification

Mentally build the DAG (dependency graph):
- Each mission declares `depends_on: [ids]`
- Verify there are no cycles
- Verify each `depends_on` references an existing mission
- Missions with no dependency between them = parallelizable

### 2.5 INVEST check per mission

Each mission must satisfy:

| Criterion | Verification question |
|-----------|----------------------|
| **I**ndependent | Executable without memory of previous sessions? |
| **N**egotiable | Implementation details left flexible? |
| **V**aluable | Produces a testable and functional increment? |
| **E**stimable | Clear scope, no ambiguity? |
| **S**mall | Fits in a single session (max 3 tasks)? |
| **T**estable | Machine-verifiable criteria? |

<important if="completing Phase 2 validation">
Display the validation results in the conversation before writing:
- Pre-mortem risks found and how they were addressed
- Gap analysis: categories added as missions
- Number of missions that failed INVEST and were re-split
This is the intermediate deliverable. Phase 3 consumes it.
</important>

### STOP CHECK — End of Phase 2

Before moving to Phase 3, verify:

1. **Backward planning** was executed: any hidden prerequisite found? ____
   - If yes: was it added as a mission?
2. **Pre-mortem** was executed: top risks per Quest listed? ____
3. **Gap analysis** passed: all categories from checklist covered? ____
4. **INVEST**: every mission passes all 6 criteria? ____
   - If any mission fails: re-split or add context until it passes
5. **Dependencies**: no cycles, every `depends_on` references an existing mission

**Phase 3 is BLOCKED until all checks pass.**

---

## Phase 3 — Write roadmap.md

Follow the exact template. Read [references/roadmap-template.md](references/roadmap-template.md)
for the full format with examples.

### File structure

```markdown
# {Project} — Roadmap Quest/Mission

> Short project description (1-2 lines)
> Stack: {technologies}
> Spec: {link to spec/prd if exists}

---

## Quest 0 — Foundations (Contracts + Scaffolding)

### Mission 0.1 — {Descriptive action title}

**Context:** {project state, stack, architecture, conventions}
**Objective:** {what this mission accomplishes}

**Tasks:**
1. {Concrete action with implementation details}
2. {Concrete action with implementation details}

**Files created:** `path/to/file.ts`, `path/to/other.rs`
**Files modified:** `path/to/existing.ts`
**Depends on:** —
**Validation:** `command that returns exit code 0`

---

[...subsequent missions...]
```

### Mission writing rules

**The Context field** is the most important. It must allow a stateless
agent to understand the project without any memory:
- Project tech stack
- Architecture and patterns used
- Current state (what already exists)
- Conventions (naming, file structure)

**The Tasks field**: maximum 3 tasks. Each task is a concrete action
with enough detail to execute without ambiguity, but enough flexibility
for the agent to choose the implementation.

**The Validation field**: executable commands, not prose.
Each command must return exit code 0 if the mission succeeds.
Examples: `npm test`, `cargo check`, `npx tsc --noEmit`,
`curl -sf localhost:3000/health`, `test -f src/models/user.ts`

**The Depends on field**: list of prerequisite mission IDs.
If empty: `—` (em dash). Not "none", not blank.

### Recommended order in file

Include a text dependency graph at the end of the file:

```markdown
## Execution order

Quest 0 (foundations) — sequential
  └─ 0.1 Scaffolding ──────────── no dependency
  └─ 0.2 Shared types ─────────── depends on 0.1

Quest 1 (feature A) — parallelizable after Quest 0
  └─ 1.1 Backend ───────────────── depends on 0.2
  └─ 1.2 Frontend ──────────────── depends on 0.2
  └─ 1.3 Wiring ────────────────── depends on 1.1 + 1.2
```

### Security checklist (if the project involves code)

Add a global security checklist at the end of the roadmap,
adapted to the project. See the 10 security reflexes from CLAUDE.md.

---

## Phase 4 — Write {project}-status.yaml

```yaml
project: {project-name}
last_updated: "{YYYY-MM-DD}"
current_quest: 0

quests:
  - name: "Quest 0 — Foundations"
    missions:
      - id: "0.1"
        title: "{mission title}"
        status: pending
      - id: "0.2"
        title: "{mission title}"
        status: pending

  - name: "Quest 1 — {Title}"
    missions:
      - id: "1.1"
        title: "{title}"
        status: pending
```

Possible statuses: `pending` | `in_progress` | `review` | `done`
All missions start at `pending`.

---

## Phase 5 — Final summary

After writing both files, display a summary:

```
Plan generated:
- {N} Quests, {M} Missions, {T} Tasks
- Critical path: Quest 0 → Quest X → Quest Y
- Parallelizable missions: [list]
- Files: {project}-output/roadmap.md
         {project}-output/{project}-status.yaml
```

---

## Guiding principles (do not forget)

1. **100% rule**: each level covers exactly 100% of its parent
2. **MECE**: no overlap, no gaps
3. **Self-sufficiency**: each mission reads independently
4. **Machine validation**: commands with exit codes, not prose
5. **Quest 0 = contracts**: interfaces before implementation
6. **Vertical slicing**: complete features, not horizontal layers
7. **The last 20%**: error handling and hardening = explicit missions
8. **Max 3 tasks**: per mission, always
9. **File ownership**: no conflicts between missions
10. **JEDUF**: specify where AI interpretation could diverge,
    leave the rest flexible
