# H.K-UP

> The first complete, interactive, and adaptive workflow for taking over,
> auditing, and improving existing projects with AI.

---

## What is H.K-UP?

H.K-UP is a team of 9 specialized AI consultants built for one purpose: helping you
understand, improve, and take ownership of an existing project. Not a tool for
starting from scratch — H.K-UP is designed specifically for brownfield projects.
Projects that were coded by you, inherited from someone else, or side projects that
grew beyond their original scope.

When you run H.K-UP, a team of experts takes over WITH you. You remain the decision-
maker at every step. The agents advise, propose, and challenge — but they never
override your judgment. Every handoff requires your confirmation. Every major decision
goes through an interactive menu.

The workflow unfolds in 4 acts: the team arrives and studies the terrain (Scan),
together you decide what to do and in what order (Plan), execution happens mission
by mission with verification at every handoff (Execute), and finally a formal
delivery with recommendations for what comes next (Handoff).

---

## Quick Start

```bash
npx hkup-workflow install
```

The CLI walks you through 6 steps:

1. **Directory** — choose where to install (defaults to current folder)
2. **Workflows** — select which agent workflows to include (Diagnostic is always installed)
3. **Configuration** — set your name, conversation language, document language, output folder
4. **IDE integration** — select your IDE (Claude Code, Cursor, Gemini CLI, and 8 more)
5. **Advanced setup** — accept defaults (recommended) or customize each workflow

When installation completes:

```
cd your-project
/hkup-start
```

L'Eclaireur scans your project and guides you from there.

---

## The 9 Agents

| # | Agent | Role | Deliverable |
|---|-------|------|-------------|
| 1 | **L'Eclaireur** | Scanner, diagnostician, onboarding guide | `project-context.md` |
| 2 | **Le Stratege** | Brainstorming, PRD, product vision | `prd.md` |
| 3 | **L'Architecte** | Technical architecture, quest/mission planning | `architecture.md` + `plan.md` |
| 4 | **Le Designer** | UI/UX, mockups, visual direction | `spec-design.md` |
| 5 | **Le Chirurgien** | Surgical code implementation + tests | Code + tests |
| 6 | **Le Gardien** | Review, correction, validation | `[done]` or corrections |
| 7 | **Nyx** | Defensive security audit, blue team | `security-audit.md` |
| 8 | **The Mask** | Offensive red team, exploit simulation | Offensive findings |
| 9 | **Zero** | Tech innovation, challenge assumptions | Alternatives and breakthroughs |

1 agent = 1 expertise = 1 conversation = 1 deliverable.
The Mask and Zero operate in Round Table sessions to challenge the other agents.

---

## 5 Adaptive Paths

| Path | When to Use | Documents | Missions |
|------|-------------|-----------|----------|
| **Express** | Small project, simple objective | context + plan | ~3-5 |
| **Standard** | Medium project, clear objective | context + PRD + architecture + plan | ~8-15 |
| **Full** | Large project, ambitious objective | All documents | ~15-30 |
| **Design** | UI/UX focus | context + spec-design + plan | ~5-12 |
| **Audit** | Diagnosis without coding | context + security-audit | ~3-5 |

The path is determined by a size x objective matrix. L'Eclaireur detects project
size automatically; you choose the objective.

---

## 7 Reflection Modes

Available as an interactive menu between every workflow step. You can chain multiple
modes, and each completed mode is marked as validated.

| Mode | What It Does | When to Use |
|------|-------------|-------------|
| **Table Ronde** | Multi-agent debate (open, targeted, or duel) | Important decisions |
| **Prisme** | One agent analyzes through 7 perspective families | Going deeper, challenging assumptions |
| **Simulation** | Test a decision before committing | Architecture choices, migrations |
| **Archeologie** | Understand the history of the code | Initial diagnostic |
| **Benchmark Vivant** | Compare against current state of the art | Modernizing, innovating |
| **Tribunal de la Dette** | Trial for each piece of technical debt | After the diagnostic |
| **Conformite** | Legal risk assessment for creator and users | PRD, architecture, delivery |

---

## 8 Directive Methods + 20 Techniques

H.K-UP includes 8 directive brainstorming methods (Design Thinking, Story Mapping,
Lean Canvas, Blue Ocean, Impact Mapping, SWOT, Double Diamond, Opportunity Tree) to
guide the entire brainstorming session — and 20 brainstorming techniques
(SCAMPER, Pre-mortem, Six Thinking Hats, Jobs to Be Done, and 16 more) to use
within those sessions.

Type `recommend` when Le Stratege asks which method to use, and it will suggest the
best fit based on your objective.

See [TUTORIAL.md](./TUTORIAL.md) for a complete walkthrough with examples.

---

## How It Works

```
1. L'Eclaireur scans your project
   → Detects size, stack, health, architecture, dependencies
   → Recommends a path with effort estimate
   → You confirm

2. Le Stratege brainstorms with you
   → Chooses a directive method together
   → Runs brainstorming techniques
   → Writes the PRD

3. L'Architecte designs the plan
   → Creates architecture decisions (ADR format)
   → Breaks work into Quests (big scope) and Missions (2-3 tasks max)
   → Defines git strategy

4. Le Designer designs the UI (if needed)
   → Audits existing UI
   → Proposes 3 visual directions
   → Creates HTML mockups + design tokens

5. Le Chirurgien codes → Le Gardien reviews
   → Strangler fig approach: component by component, never big bang
   → Tests written with every change
   → Blocking checkup gate at every handoff

6. Nyx + The Mask audit security (Full path or when auth/crypto/PII are involved)
   → STRIDE/DREAD threat modeling
   → Table Ronde Duel: The Mask tries to break what Nyx just hardened

7. Le Stratege closes with a formal handoff
   → Final PRD checkup
   → Updated documentation
   → Recommendations for what comes next
```

---

## Supported IDEs

Claude Code, Cursor, Gemini CLI, GitHub Copilot, Codex CLI (OpenAI), Windsurf,
Zed, Crush (ex-OpenCode), Mistral Vibe, Kimi Code, Droids (Factory AI)

---

## Slash Commands

| Command | Agent | Description |
|---------|-------|-------------|
| `/hkup-start` | L'Eclaireur | Project diagnostic — the first step in every journey |
| `/hkup-brainstorm` | Le Stratege | Structured ideation with 8 directive methods + 20 techniques |
| `/hkup-prd` | Le Stratege | Produce a structured Product Requirements Document |
| `/hkup-architecture` | L'Architecte | Design technical architecture, quests, and missions |
| `/hkup-design` | Le Designer | UI/UX audit, 3 visual directions, mockups, design tokens |
| `/hkup-dev` | Le Chirurgien | Surgical code implementation with tests |
| `/hkup-review` | Le Gardien | Thorough quality check and correction |
| `/hkup-security` | Nyx | STRIDE/DREAD threat modeling + security audit |
| `/hkup-finalize` | Le Stratege | Final PRD checkup and handoff document |
| `/hkup-resume` | — | Resume a workflow from where it was interrupted |
| `/hkup-status` | — | Display workflow progression and completion percentage |
| `/hkup-table-ronde` | — | Multi-agent debate (Open, Targeted, or Duel) |
| `/hkup-prisme` | — | Multi-faceted analysis through 7 perspective families |
| `/hkup-tribunal` | — | Technical Debt Trial: L'Eclaireur prosecutes, Zero defends |
| `/hkup-conformite` | — | Legal and regulatory compliance check with web research |
| `/hkup-help` | — | Display all available commands |
| `/hkup-install` | — | Install H.K-UP in the current project |

---

## Key Features

- **11 STOP-CHECKs** — blocking verification gates in every step file that loads data
- **Pre-flight checks** — 4 workflows verify prerequisites before starting
- **Progressive checkups at every handoff** — blocking gates, not just end-of-project reviews
- **2-3 tasks per mission** — prevents context compaction, maintains precision
- **Strangler fig migration** — never big bang, always component-by-component
- **Interactive menus between every step** — explore before committing
- **Resume after interruption** — status tracked in the output folder
- **Path escalation** — when complexity is underestimated, H.K-UP proposes upgrading
- **Anti-AI-slop design** — premium rendering, no generic interfaces (Le Designer)
- **WCAG 2.1 AA accessibility** — built in from the start, not bolted on
- **Legal compliance assessment** — Conformite mode covers GDPR, EU AI Act, and more
- **All cross-references verified** — integration check ensures zero dangling references

---

## License

MIT

---

Created by [Kevin Huynh](https://github.com/Kevin-hDev)
