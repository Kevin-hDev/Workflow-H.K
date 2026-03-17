# Changelog — H.K Workflow

## [0.2.0] — 2026-03-15

### Skills — Major Rework

**New skills:**
- `hk-brainstorm` — Full creative brainstorming workflow with Iris (15 techniques, 3 depth levels, web research, challenge & elevation). Multi-step: 5 phases with dedicated step files
- `hk-design` — UI/UX design workflow with Léo (3 routes: adapt/create/redesign, design directions, HTML mockup, anti-AI-slop). Multi-step: 8 step files
- `hk-prd` — Product Requirements Document workflow with Aria (discovery, users, scope, requirements, risks, feature checkup). Multi-step: 6 step files
- `hk-refactor` — Systematic code refactoring (3 modes: full codebase/targeted/single file, 7 refactoring patterns, before/after metrics, test safety net). Multi-step: 5 step files
- `agent-prompt` — Agent prompting framework. Structures prompts for subagents and teammates (context, task, constraints, output format, reflection)
- `hk-changelog` — Generate changelogs from git commits
- `hk-audit-rules` — Code audit with 3 depth levels (quick/full/security), 18 built-in rules + custom CLAUDE.md rules, SelfCheck, STRIDE, Five-Persona

**Enriched skills:**
- `hk-debug` — Merged with Superpowers `systematic-debugging`. Added: 3 mandatory hypotheses, differential diagnosis, defense-in-depth, learnings log, red flags, rationalizations table
- `hk-audit-rules` — Absorbed `hk-review` (step-04 + step-05). Added: `--full` (tests + SelfCheck) and `--security` (STRIDE + Five-Persona) depth levels
- `prompt-creator` — Updated to 2026 best practices. Added 6 techniques: context engineering, meta-prompting, tree-of-thought, reflection prompting, prompt scaffolding, uncertainty permission
- `onetap` — Added dynamic command detection (.hk/hk-state.json), multi-language support (Node/Rust/Go/Python), optional PRD context loading, context budget (max 5 files)

**Deleted skills:**
- `ultrathink` — Obsolete (native extended thinking in Claude 4.x)
- `ralph-loop` — Not original, risky autonomous loop
- `fix-grammar` — Not original, niche use case
- `hk-review` — Absorbed into `hk-audit-rules`
- `hk-security` — Redundant with `hk-audit-rules --security` + 3 dedicated security skills
- `subagent-creator` — Replaced by `agent-prompt`

### Skills — Translations

All skills translated to English (were mixed French/English):
- `commit`, `fix-errors`, `create-pr` — Mixed → 100% English
- `hk-context`, `hk-security`, `hk-dev`, `hk-help`, `hk-prd`, `hk-monitoring` — French → 100% English

### Skills — Output Paths

All skills that generate project files now use `{project}-output/` instead of `.hk/`:
- `hk-context` → `{project}-output/project-context.md`
- `hk-monitoring` → `{project}-output/project-monitoring.md`
- `hk-prd` → `{project}-output/prd.md`
- `hk-debug` → `{project}-output/learnings.md`
- `hk-brainstorm` → `{project}-output/brainstorming/session-{date}.md`
- `hk-design` → `{project}-output/design-specs.md` + `{project}-output/mockup-{name}.html`

### Skills — Reflection

Added self-verification before final output in:
- `hk-brainstorm` (step-05) — Ideas coverage, Top 3 quality, theme distinctness
- `hk-design` (step-08) — States complete, anti-slop respected, responsive complete
- `hk-prd` (step-06) — Persona→journey→FR traceability, no vague language, feature checkup
- `hk-refactor` (step-05) — Files under 250 lines, zero behavior change, all tests pass, no broken imports

### Skills — Context Detection

Skills now cross-reference `{project}-output/` for existing context:
- `hk-design` — Reads brainstorming + PRD (not just brainstorming)
- `hk-prd` — Reads ALL files in `{project}-output/` + asks for additional docs
- `onetap` — Targeted grep in PRD for matching FRs only

### Rules

- `rules/agent-prompting.md` — Global rules for agent/subagent prompting. Auto-triggers `/agent-prompt` skill on deployment

### Inventory

**25 → 20 skills** (6 deleted, 1 new net)

Current skills:
- Workflow: `hk-dev`, `hk-help`
- Creative: `hk-brainstorm`, `hk-design`, `hk-prd`
- Quality: `hk-audit-rules`, `hk-debug`, `hk-refactor`, `hk-changelog`
- Context: `hk-context`, `hk-monitoring`
- Git: `commit`, `create-pr`, `merge`, `fix-errors`, `fix-pr-comments`
- Speed: `onetap`
- Reference: `claude-memory`, `prompt-creator`, `skill-creator`, `agent-prompt`

## [0.1.0] — 2026-03-13

### Initial Release

- 25 skills ported from various sources (Superpowers, APEX, custom)
- H.K workflow with 6 steps (init, analyze, plan, design, execute, validate, harden, ship)
- Complexity levels L1-L4 with adaptive behavior
- Security rules (10 reflexes) and structure rules (8 reflexes)
