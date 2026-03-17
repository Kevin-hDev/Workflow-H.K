# H.K-UP Tutorial

> A complete walkthrough of H.K-UP, from installation to project completion.

---

## Table of Contents

1. [Installation](#1-installation)
2. [Slash Commands Reference](#2-slash-commands-reference)
3. [Your First Scan (L'Eclaireur)](#3-your-first-scan-leclaireur)
4. [Choosing Your Path](#4-choosing-your-path)
5. [Brainstorming (Le Stratege)](#5-brainstorming-le-stratege)
6. [Writing the PRD](#6-writing-the-prd)
7. [Architecture Planning (L'Architecte)](#7-architecture-planning-larchitecte)
8. [Design (Le Designer)](#8-design-le-designer)
9. [Implementation (Le Chirurgien + Le Gardien)](#9-implementation-le-chirurgien--le-gardien)
10. [Security Audit (Nyx + The Mask)](#10-security-audit-nyx--the-mask)
11. [Closing (Finalization)](#11-closing-finalization)
12. [Reflection Modes — Deep Dive](#12-reflection-modes--deep-dive)
13. [Tips and Best Practices](#13-tips-and-best-practices)

---

## 1. Installation

Run the installer from your terminal:

```bash
npx hkup-workflow install
```

The CLI opens an interactive setup panel:

### Step 1 — Directory

```
╭─────────────────────────────────╮
│  H.K-UP — Installation          │
│  Workflow de reprise de projet   │
╰─────────────────────────────────╯

  Installation directory: /home/user/my-project  [Enter]
  H.K-UP folder name: _hkup  [editable]
```

Enter the path to your existing project. The `_hkup` folder will be created inside it.

### Step 2 — Workflows

```
  Which workflows to install?
  [SPACE to select, ENTER to confirm]

  ✓ Diagnostic (Eclaireur)        — always installed
  □ Brainstorming (Stratege)
  □ PRD (Stratege)
  □ Architecture (Architecte)
  □ Design UI/UX (Designer)
  □ Development (Chirurgien)
  □ Review (Gardien)
  □ Security Audit (Nyx)
  □ Finalisation (Stratege)
  ────────────────────
  ✓ — Select everything —
```

For your first project, select all. The Diagnostic workflow is mandatory.

### Step 3 — Optional Tools

```
  Optional tools:

  Install Agent OS? (auto-extract coding standards from your codebase)
  ● Yes / ○ No
```

Agent OS is optional but recommended — it extracts coding conventions from your
existing codebase so agents follow your patterns from the start.

### Step 4 — Configuration

```
  What should agents call you?       [default: git username]
  Agent conversation language?       [default: English]
  Output document language?          [default: English]
  Output folder?                     [default: _hkup-output]
```

Agents will address you by your chosen name throughout every conversation.
The output folder is where all deliverables (PRD, architecture.md, etc.) are saved.

### Step 5 — IDE Integration

```
  Integrate with:
  [SPACE to select]

  ✓ Claude Code          — CLAUDE.md + .claude/skills/
  □ Cursor               — .cursor/rules/
  □ Gemini CLI           — GEMINI.md
  □ GitHub Copilot       — .github/copilot-instructions.md
  □ Codex CLI (OpenAI)   — AGENTS.md
  □ Windsurf             — AGENTS.md
  □ Zed                  — AGENTS.md
  □ Crush (ex-OpenCode)  — .crush.json
  □ Mistral Vibe         — .vibe/config.toml
  □ Kimi Code            — custom config
  □ Droids (Factory AI)  — CLI factory.ai
```

Select the IDE you use. H.K-UP installs its configuration files in the correct
location for each IDE automatically.

### Step 6 — Advanced Setup

```
  > Express Setup (accept defaults — recommended)
    Customize (configure each workflow individually)
```

Accept defaults unless you have a specific reason to customize. Express Setup
works well for the vast majority of projects.

### What Gets Created

After installation, your project will contain:

```
_hkup/
  agents/                        ← 9 agent definition files (loaded on demand)
  workflows/                     ← 9 workflow directories with step files
  data/                          ← rules, methods, security data, mode files
  templates/                     ← mission-brief.md, gap-report.md, debt-report.md

_hkup-output/                    ← empty at start, filled as you progress

.hkup-config.json                ← installation options snapshot
```

---

## 2. Slash Commands Reference

All H.K-UP commands are slash commands you type directly in your IDE.

### Workflow Commands

| Command | Agent | What It Does |
|---------|-------|-------------|
| `/hkup-start` | L'Eclaireur | Project diagnostic. Always start here. |
| `/hkup-brainstorm` | Le Stratege | Structured ideation — 8 directive methods + 20 techniques. |
| `/hkup-prd` | Le Stratege | Produce a structured Product Requirements Document. |
| `/hkup-architecture` | L'Architecte | Design technical architecture, quests, and missions. |
| `/hkup-design` | Le Designer | UI/UX audit, visual directions, mockups, design tokens. |
| `/hkup-dev` | Le Chirurgien | Surgical code implementation with tests. |
| `/hkup-review` | Le Gardien | Thorough quality check and correction. |
| `/hkup-security` | Nyx | STRIDE/DREAD threat modeling + security audit. |
| `/hkup-finalize` | Le Stratege | Final PRD checkup and handoff document. |

### Utility Commands

| Command | What It Does |
|---------|-------------|
| `/hkup-resume` | Resume a workflow from where it was interrupted. |
| `/hkup-status` | Show workflow progression and completion percentage. |
| `/hkup-table-ronde` | Multi-agent debate (Open, Targeted, or Duel). |
| `/hkup-prisme` | Multi-faceted analysis through 7 perspective families. |
| `/hkup-tribunal` | Technical Debt Trial — L'Eclaireur prosecutes, Zero defends. |
| `/hkup-conformite` | Legal and regulatory compliance check with web research. |
| `/hkup-help` | Display all available commands. |
| `/hkup-install` | Install H.K-UP in the current project. |

> Each workflow command triggers a **STOP-CHECK** — a blocking verification gate that forces
> the agent to read and confirm all required data files before proceeding. There are 11 STOP-CHECKs
> across all step files, preventing agents from skipping context.

---

## 3. Your First Scan (L'Eclaireur)

After installation, open your IDE and run:

```
/hkup-start
```

L'Eclaireur takes over. The first 30 seconds are silent analysis:

```
Scanning project...
  Structure: 847 files, 12,000 lines of code
  Stack: React 18, Express 4, PostgreSQL, Tailwind CSS
  Health: No tests, minimal README, no CI/CD
  Git: 8 months old, 1 contributor, irregular commits
  Architecture: Classic monolith, flat structure in src/
  Dependencies: 3 outdated packages, 1 known vulnerability
  Size classification: MEDIUM
```

If Agent OS is installed, L'Eclaireur uses it to extract the coding standards
embedded in your existing code (naming conventions, formatting patterns, etc.).

If Agent OS is installed, L'Eclaireur also extracts your coding standards
automatically using the `discover-standards` command.

### The Report

L'Eclaireur then presents a clear, non-judgmental report:

```
"Here is what I found:

  Project: MonApp
  Type: React web application + Node.js API
  Size: ~12,000 lines (MEDIUM)
  Stack: React 18, Express, PostgreSQL, Tailwind CSS
  Health: No tests, minimal README, no CI
  Architecture: Classic monolith, files flat in src/
  Age: 8 months, 1 contributor, irregular commits

  Shall I proceed with this summary? Any corrections or additions?"
```

L'Eclaireur never judges the code. Every project reflects the constraints
under which it was built. The role here is to understand, not to evaluate.

### Archeologie Mode (Optional)

After the initial scan, you can activate Archeologie mode to go deeper into
the project's history:

```
  REFLECTION MODES
  4. Archeologie      — Understand the code history
```

In this mode, L'Eclaireur uses `git log` and `git blame` to map the project's
geological layers — v1 code, patches, rewrites — and explains why the code is
the way it is today. The output goes into the "Archeologie" section of
`project-context.md`.

---

## 4. Choosing Your Path

After the report, L'Eclaireur presents the objective menu:

```
"What do you want to do with this project?

  1. EVOLVE       — Push the project further, major new capabilities
  2. MODERNIZE    — Bring up to current standards (stack, patterns, security)
  3. ADD          — A few specific new features
  4. REDESIGN     — Complete or partial visual overhaul
  5. AUDIT        — Assess health, technical debt, security
  6. RESTRUCTURE  — Reorganize architecture without changing features
  7. OTHER        — Describe your idea

  Choose a number (or multiple):"
```

### The Size x Objective Matrix

Based on your project size and objective, L'Eclaireur recommends a path:

| | Small (<5K LOC) | Medium (5K-50K LOC) | Large (>50K LOC) |
|---|---|---|---|
| Evolve | Express | Standard | Full |
| Modernize | Express | Standard | Full + Audit |
| Add | Express | Express+ | Standard |
| Redesign | Design | Design+ | Design Full |
| Audit | Light Audit | Audit | Full Audit |
| Restructure | Express | Standard | Full + Migration |

### The Recommendation

```
"For your MEDIUM project with objective EVOLVE,
  I recommend the Standard Path (~10 missions).

  Planned phases:
  - Phase 1: Understand (Eclaireur)
  - Phase 2: Define (Stratege + Architecte)
  - Phase 3: Execute (~8 missions Chirurgien/Gardien)
  - Phase 4: Validate (finalization + PRD checkup)

  Estimate: ~4-6 work sessions

  Shall we proceed? Or would you like to adjust?"
```

You can accept, negotiate down (Express if you have limited time), or escalate
(Full if you realize the project is more complex than it appears).

---

## 5. Brainstorming (Le Stratege)

In Standard and Full paths, Le Stratege takes over after the diagnostic.
His first move is to choose a directive method — the brainstorming framework
that will guide the entire session.

### Choosing a Directive Method

```
"Before we brainstorm, let's choose our approach:

  USER-CENTERED
  1. Design Thinking   — Start from human needs, prototype fast
  2. Story Mapping     — Map user journeys

  BUSINESS-CENTERED
  3. Lean Canvas       — Validate the business model
  4. Blue Ocean        — Differentiate from competition

  STRATEGY-CENTERED
  5. Impact Mapping    — Goal → Actors → Behaviors → Features
  6. SWOT              — Strengths / Weaknesses / Opportunities / Threats

  EXPLORATION-CENTERED
  7. Double Diamond    — Explore then converge (twice)
  8. Opportunity Tree  — Sort ideas, prioritize

  Choose or type 'recommend':"
```

If you type `recommend`, Le Stratege picks the best fit. For the EVOLVE
objective on a medium project, it would recommend **Impact Mapping**.

### Running Impact Mapping

With Impact Mapping selected, Le Stratege structures the session:

```
IMPACT MAPPING SESSION
Goal: What is the single most important goal for this project?
  → "Double the number of active users in 6 months"

Actors: Who can help or hinder this goal?
  → New visitors, Existing users, Admin team, Search engines

Behaviors: What should each actor do differently?
  → New visitors: complete onboarding without dropping off
  → Existing users: invite at least one friend
  → Admin: publish content faster (reduce bottleneck)

Features: What could we build to cause these behaviors?
  → Guided onboarding flow (3 steps max)
  → Referral system with incentives
  → Admin dashboard with content templates
```

### Using Brainstorming Techniques

During the session, Le Stratege can introduce techniques to go deeper.
For example, running **Pre-mortem** on the referral system:

```
PRE-MORTEM: "The referral system failed. It's 6 months later. Why?"

  - Users found the incentive not worth the social cost of asking friends
  - The referral link broke on mobile
  - Referred users arrived at a generic landing page (not personalized)
  - The reward was delivered 2 weeks late (trust broken)

Implication: build mobile-first, personalize landing pages, instant reward delivery
```

Type `techniques` at any point to see all 20 available techniques and pick one.

---

## 6. Writing the PRD

After brainstorming, Le Stratege drafts the PRD. The document structure:

```markdown
# PRD — MonApp Evolution

## Objective
Double active users in 6 months.

## Features

### F-01 — Guided Onboarding
**Description:** 3-step onboarding flow for new users
**Acceptance Criteria:**
  - New user sees onboarding on first login
  - Completion rate tracked in analytics
  - Skip option available at step 2
  - Mobile-responsive (tested on iOS Safari + Android Chrome)
**Priority:** P1 — Critical
**Estimate:** 2 missions

### F-02 — Referral System
...
```

### PRD Checkup

Before handing off to L'Architecte, Le Stratege runs a blocking checkup:

```
PRD CHECKUP
  ✓ All brainstorming outputs reflected in features?
  ✓ Every feature has acceptance criteria?
  ✓ Priority assigned to every feature?
  ✓ No contradictions between features?
  ✓ Scope confirmed with user?

Result: PASS — handing off to L'Architecte
```

If anything fails, Le Stratege fixes it before proceeding.

---

## 7. Architecture Planning (L'Architecte)

L'Architecte receives the PRD and the project context, then designs the
technical approach and breaks the work into executable units.

### Architecture Decisions (ADR Format)

For significant decisions, L'Architecte writes Architecture Decision Records:

```markdown
## ADR-01 — Onboarding State Management

**Decision:** Use URL query parameters for onboarding state, not localStorage.

**Context:** Users may switch devices mid-onboarding. LocalStorage is device-bound.

**Consequences:**
  + Works across devices
  + Shareable onboarding links
  - Slightly longer URLs
  - Need to sanitize query params (security)

**Alternatives rejected:** Redux (overkill), cookie (GDPR complexity)
```

### Quest and Mission Breakdown

L'Architecte decomposes work into:
- **Quest** — a major work block (e.g., "Onboarding System")
- **Mission** — 2-3 tasks maximum (granular, executable, reviewable)

```
Quest 1 — Onboarding System
  Mission 1.1 — Create onboarding route + step 1 UI
    Task 1: Add /onboarding route to React Router
    Task 2: Build Step1Welcome component with progress bar
    Task 3: Write unit tests for Step1Welcome

  Mission 1.2 — Steps 2-3 + completion tracking
    Task 1: Build Step2Profile and Step3Preferences
    Task 2: Track completion event to analytics
    Task 3: Write integration test for full onboarding flow

Quest 2 — Referral System
  Mission 2.1 — ...
```

Each mission becomes a separate conversation with Le Chirurgien. This is
deliberate — it prevents context compaction and keeps each coding session focused.

### Git Strategy

L'Architecte defines the branching strategy:

```
Strategy: Feature branches
  main → protected, CI required
  develop → integration branch
  feature/onboarding → Mission 1.x work
  feature/referral → Mission 2.x work

Merge policy: PR + Le Gardien review before merging to develop
```

---

## 8. Design (Le Designer)

The Design path, or any path where the PRD includes UI features, activates
Le Designer. He is the most opinionated agent — he applies anti-AI-slop design
patterns from `data/design/anti-slop-patterns.md` and will not produce generic interfaces.

### UI Audit

Le Designer starts by auditing what exists:

```
CURRENT UI AUDIT

  Layout: Inconsistent spacing (8px, 12px, 16px mixed)
  Colors: 3 different shades of blue used as "primary"
  Typography: 2 font families loaded, only 1 used
  Accessibility: No ARIA labels, low contrast on buttons (#999 on #fff)
  Mobile: Overflow on screens < 380px

  Overall: Functional but not polished. Strong foundation, needs a design system.
```

### 3 Visual Directions

Le Designer always proposes at least 3 directions before committing:

```
Direction A — Minimal Professional
  Clean lines, white space dominant, single accent color (#2563EB),
  Inter font, no decorative elements. Business-first feel.

Direction B — Warm and Friendly
  Rounded corners, warm palette (#F59E0B + #10B981), Nunito font,
  subtle background textures. Approachable, consumer-facing feel.

Direction C — Bold Modern
  Dark mode first, glassmorphism cards, gradient accents,
  micro-animations on hover. Premium SaaS feel.

Which direction resonates? Or shall I blend elements?
```

### Design Tokens

After direction is confirmed:

```css
/* tokens.css */
--color-primary: #2563EB;
--color-primary-hover: #1D4ED8;
--color-background: #FFFFFF;
--color-surface: #F8FAFC;
--color-text: #0F172A;
--color-text-muted: #64748B;

--spacing-1: 4px;
--spacing-2: 8px;
--spacing-4: 16px;
--spacing-8: 32px;

--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;

--font-body: 'Inter', sans-serif;
--font-weight-normal: 400;
--font-weight-semibold: 600;
```

Le Chirurgien receives these tokens and must use them — no hardcoded values.

---

## 9. Implementation (Le Chirurgien + Le Gardien)

This is the core execution loop. Each mission is a fresh conversation.

### The Mission Brief

L'Architecte prepares a brief for each mission:

```markdown
# Mission Brief — 1.1 — Onboarding Route + Step 1

## Context
Project: MonApp | Quest: Onboarding System | Mission: 1.1

## Tasks
1. Add /onboarding route to React Router (src/App.tsx)
2. Build Step1Welcome component (src/components/onboarding/Step1Welcome.tsx)
   - Progress bar (1 of 3)
   - Welcome message with user's name
   - "Get Started" button → navigates to /onboarding?step=2
3. Write unit tests for Step1Welcome (src/components/onboarding/__tests__/)

## Constraints
- Use design tokens from src/styles/tokens.css — no hardcoded values
- WCAG 2.1 AA: aria-label on progress bar, sufficient contrast
- Mobile-first: test at 375px viewport

## Definition of Done
- Route renders without console errors
- Step1Welcome renders with name from auth context
- Tests pass (coverage > 80% for this component)
- No TypeScript errors
```

### The Chirurgien Approach

Le Chirurgien works with surgical precision:

1. Reads the brief and the existing codebase (only files relevant to the mission)
2. Announces what it will do before touching anything
3. Writes tests FIRST (or alongside), never after
4. Makes the minimum change necessary — no refactoring outside the brief's scope
5. Marks the mission `[review]` in `hk-up-status.yaml` when done

The strangler fig principle applies throughout: if the onboarding replaces an
existing first-run flow, the old flow continues working until the new one is
proven. Never delete before the replacement is validated.

### Le Gardien Review

Le Gardien opens a fresh conversation, reads the changed files, and verifies:

```
REVIEW — Mission 1.1

  Plan followed?     ✓ Route added, Step1Welcome created, tests written
  Logic correct?     ✓ Name from auth context, URL state management works
  Integration OK?    ✓ Route visible in App.tsx, no import errors
  Tests pass?        ✓ 3 tests, 85% coverage on Step1Welcome
  Design tokens?     ✓ All values from tokens.css, no hardcoded colors
  Accessibility?     ! aria-label on progress bar uses "Step 1 of 3" — should be
                       "Onboarding progress: step 1 of 3" for screen readers

  Action: Corrected aria-label directly. Mission marked [done].
```

Le Gardien corrects issues directly — it does not just report them. If the fix
requires architecture changes outside the mission scope, it escalates to
L'Architecte instead.

### Commit Convention

Le Chirurgien uses a consistent commit format:

```
feat(onboarding): add step 1 welcome component with progress bar

- /onboarding route added to React Router
- Step1Welcome renders name from auth context
- Progress bar with WCAG 2.1 AA aria-label
- 3 unit tests, 85% coverage

Mission 1.1 — Quest 1 (Onboarding System)
```

---

## 10. Security Audit (Nyx + The Mask)

Activated in Full path, or whenever the project handles authentication, cryptography,
payment data, or personally identifiable information.

### Nyx — STRIDE/DREAD Threat Modeling

Nyx loads the security data files and performs a systematic analysis:

```
THREAT MODELING — MonApp

Scope: Onboarding flow + Referral system + Existing auth

STRIDE Analysis:

  [S] Spoofing — Can an attacker impersonate a user?
    → Auth tokens validated? ✓ JWT with expiry
    → Referral links forgeable? RISK — no HMAC on referral codes

  [T] Tampering — Can data be modified in transit or at rest?
    → URL state for onboarding: RISK — step param not validated server-side

  [R] Repudiation — Can users deny actions?
    → No audit log for referral redemption: LOW RISK for this project

  [I] Information Disclosure — Can sensitive data leak?
    → Error messages return stack traces in production: HIGH RISK

  [D] Denial of Service — Can the system be overwhelmed?
    → Referral endpoint: no rate limiting: MEDIUM RISK

  [E] Elevation of Privilege — Can a user gain unauthorized access?
    → Admin routes: verified via middleware ✓
```

DREAD scores are assigned to each finding (Damage, Reproducibility, Exploitability,
Affected users, Discoverability). Findings are ranked and remediation priorities
are set.

### Table Ronde Duel — Nyx vs The Mask

After Nyx completes the audit, a Duel mode activates:

```
TABLE RONDE DUEL — Round 1

Nyx: "I've hardened the referral codes with HMAC-SHA256. The signing key
      is rotated daily and stored in the OS keystore."

The Mask: "HMAC rotation is good. But the key rotation is logged — and the
            log format includes the timestamp of the last rotation. I can infer
            the current key window by watching log timestamps. Give me the log
            access and I'll tell you the rotation schedule within a week."

Nyx: "Valid point. Removing key rotation timestamps from logs. Rotation will
      now log 'key rotated' without timestamp."

The Mask: "Better. What about the referral code itself? If I enumerate the code
            space — how many codes are in circulation at once?"
```

This duel continues for 2-3 rounds until The Mask cannot find a credible attack
vector. The findings go into `security-audit.md`.

---

## 11. Closing (Finalization)

The final workflow is run by Le Stratege once all missions are complete.

### Final PRD Checkup

```
FINAL PRD CHECKUP

  F-01 Guided Onboarding     ✓ Implemented + tested + reviewed
  F-02 Referral System       ✓ Implemented + tested + reviewed + security audited
  F-03 Admin Dashboard       ✓ Implemented + tested + reviewed

  Acceptance criteria met?   ✓ All 14 criteria verified
  No regressions?            ✓ Full test suite passes
  Documentation updated?     ✓ README, CHANGELOG, API docs

Result: COMPLETE
```

### The Handoff

Le Stratege delivers a formal handoff:

```
HANDOFF — MonApp Evolution v2.0

  What was done:
  - Guided 3-step onboarding (25% faster first-session completion in testing)
  - Referral system with HMAC-signed codes and instant reward delivery
  - Admin dashboard with content templates (4 types)
  - Security: 6 vulnerabilities found and remediated, 2 accepted with mitigations

  What to watch:
  - Referral system: monitor redemption rate — if < 2% in 30 days, revisit incentive
  - PostgreSQL: query on referral_codes table will need index at >10K users

  Recommended next session:
  - Add email notifications (onboarding completion, referral success)
  - Consider moving to Full path for analytics integration (complexity increased)

  Status file: _hkup-output/ (project summary + all missions marked [done])
```

---

## 12. Reflection Modes — Deep Dive

These modes are available as a menu between every workflow step. You can run
multiple modes before proceeding. Each completed mode is marked as validated.

### Table Ronde

Three variants:
- **Open** — all relevant agents discuss freely
- **Targeted** — 2-3 agents on a specific point
- **Duel** — 2 agents in opposition (most useful: The Mask vs Nyx, Zero vs L'Architecte)

**When to use:** Before making an irreversible architectural decision. When you feel
a decision is being made too quickly. When you want a second opinion challenged.

**Example interaction:**

```
TABLE RONDE — "Should we migrate from Express to Fastify?"

L'Architecte: "Express is battle-tested but lacks native TypeScript support
               and is 3x slower on route matching at scale."

Zero: "Fastify has full TypeScript, 2x-3x throughput, and built-in schema
       validation. Migration path is well-documented."

Le Chirurgien: "Migration will take ~2 missions. Risk: any Express middleware
                we use needs a Fastify equivalent — I'll need to audit 8 plugins."

Le Gardien: "Recommend a strangler fig approach: run both side by side,
             migrate route by route. We can validate each migration independently."

Decision: migrate to Fastify using strangler fig. Add to Mission backlog.
```

### Prisme

One agent analyzes a topic through multiple perspective lenses.

7 families of perspectives:
- **User:** End User, Admin, New User, Power User, Frustrated User
- **Technical:** Performance, Scalability, Maintainability, Testability
- **Business:** Cost, Time-to-market, ROI, Risk, Competition
- **Security:** Attacker, Insider, Compliance, Privacy, Supply Chain
- **Time:** Short-term (1 month), Medium (6 months), Long (2 years), Legacy
- **Failure:** Pre-mortem, Worst case, Cascade, Point of No Return
- **Inversion:** Anti-brainstorm, Removed Constraint, Competitor

**When to use:** After the diagnostic (Prisme: Technical + Failure). Before finalizing
the PRD (Prisme: User + Business). Before delivery (Prisme: Business + Time).

**Example interaction:**

```
PRISME — Referral System through Time lens

  Short-term (1 month):
    Feature ships, first 100 referrals tracked, reward delivery tested.

  Medium (6 months):
    Viral coefficient measurable. If k-factor > 1, growth is self-sustaining.
    If < 0.5, need to revisit incentive or reduce friction.

  Long-term (2 years):
    Referral codes become brand assets (influencer codes). Need analytics
    for attributing long-term LTV to referred users.

  Legacy:
    What happens when we deprecate the referral v1 codes? Migration plan
    needed for existing issued codes.
```

### Simulation

Test a decision in a simulated scenario before committing.

Types available:
- **Stress Test** — "What if 100x the users?"
- **Migration Dry Run** — "Let's simulate moving to another stack"
- **User Journey** — "Walk through the app as a user"
- **Incident Response** — "The database is corrupted, what do we do?"
- **Onboarding Dev** — "Can a new developer understand this code?"
- **Rollback** — "Something is broken, how do we revert?"

**When to use:** Before any architectural decision. Before choosing a migration
strategy. After implementation, to verify the system holds under pressure.

**Example:**

```
SIMULATION — User Journey through Onboarding

  User: Sarah, first-time visitor, coming from a referral link on mobile.

  Step 0: Referral link opens → /onboarding?ref=ABC123&step=0
    → Is ref code validated before step 0? YES — 404 on invalid ref
    → Is the page mobile-responsive at 375px? YES — tested in Step 1 build

  Step 1: Welcome screen
    → Name "Sarah" pulled from email claim in JWT ✓
    → Progress bar reads "Onboarding progress: step 1 of 3" ✓
    → "Get Started" tap → navigates to step=2

  Step 2: Profile setup
    → Form autofocuses on first field (mobile keyboard opens) ✓
    → Validation errors inline, not modal ✓

  ...

  Gap found: If Sarah closes the app at step 2 and reopens 2 days later,
  the URL state is lost. Need to persist onboarding progress server-side.
  → Adding to Mission backlog.
```

### Archeologie

L'Eclaireur maps the history of the code to understand why it exists in
its current form.

**When to use:** At the start of any brownfield project. When you encounter
code that seems inexplicable. Before deciding to rewrite vs. refactor.

**Example output:**

```
ARCHEOLOGIE — src/auth/

  2023-04 (v1): Simple JWT auth — 180 lines, clean
  2023-07 (patch): Added refresh tokens — grafted on, not integrated
  2023-09 (patch): Emergency fix for token expiry bug — 3 functions added inline
  2024-01 (v2): New user roles — written by different contributor, different style
  2024-06 (patch): "Temporary" API key auth — still there

  Finding: The auth module has 4 geological layers. The refresh token logic
  is split across 3 files because of patch-on-patch accumulation. The "temporary"
  API key auth from June 2024 is now load-bearing (admin dashboard depends on it).

  Recommendation: Isolate the API key auth FIRST before any refactor. Don't touch
  the refresh token logic without a full test suite — it's fragile.
```

### Benchmark Vivant

Le Stratege researches the current state of the art on the web and compares
your project against it.

**When to use:** Before the PRD (discover what's possible). When considering
modernization. When evaluating a technology choice.

**Example:**

```
BENCHMARK VIVANT — React onboarding flows (March 2026)

  Current best practices:
  - Progress indicator: segmented bar preferred over numbered steps (Stripe, Linear)
  - Step count: 3 steps max for B2C (above 3: 40% drop-off)
  - Deferred data collection: email first, rest on Day 3 (Intercom pattern)
  - Skip option mandatory at step 2+ (GDPR soft requirement in EU)

  Notable: Figma, Notion, and Linear all use "progressive disclosure" —
  they show a simplified onboarding, then offer deeper configuration later.

  Recommendation: Add a "Quick start" option at step 2 (skip to dashboard).
  Users who opt out of full setup are more likely to convert if they see value first.
```

### Tribunal de la Dette

Each piece of technical debt is put on trial. L'Eclaireur (prosecution) presents
the problem. Zero (defense) explains why it exists. You (the judge) decide.

Verdicts: **FIX** / **ACCEPT** / **DEFER**

**When to use:** After the initial diagnostic on any project with significant debt.
Before committing to a path — you need to know what debt you're working around.

**Example:**

```
TRIBUNAL DE LA DETTE

  CASE: Flat file structure (300+ files in src/)

  Prosecution (L'Eclaireur):
    "Every new feature takes 3 minutes to find the right file. Onboarding a new
     developer takes 2 days instead of 2 hours. The pattern prevents code splitting."

  Defense (Zero):
    "This was a reasonable choice when the project had 20 files. The original
     developer didn't anticipate growth. No malice, just organic expansion."

  Your decision: FIX — reorganize by domain in Phase 2
  Verdict recorded in debt-verdict.md
```

### Conformite

Legal and regulatory risk assessment for you (the creator) and your users.

Domains covered: GDPR, Terms of Service, liability, intellectual property,
accessibility, commerce, EU AI Act, hosting, minors, data breaches.

Levels: **MANDATORY** (legal) / **RECOMMENDED** (best practice) / **OPTIONAL** (trust-building)

**When to use:** Before launching any feature that touches user data. Before
shipping to EU users. Before integrating any AI feature.

**Example:**

```
CONFORMITE — Referral System (EU, B2C)

  MANDATORY:
  ✗ Cookie banner required if referral codes use cookies for attribution
  ✗ Email address collected at referral redemption — GDPR: explicit consent required,
    right to erasure applies
  ✗ Incentive terms must be disclosed at point of sharing (consumer protection law)

  RECOMMENDED:
  □ Privacy policy update to include referral data retention period
  □ One-click opt-out from referral communications

  OPTIONAL:
  □ "Refer a friend" badge for trust (social proof)

  Action: Adding cookie consent to Mission 2.2 brief.
          Legal review recommended before EU launch.
```

---

## 13. Tips and Best Practices

**Start with Express for your first project.**
The workflow has many moving parts. Express gives you the full experience
(scan, plan, execute, review) with the smallest commitment. Once you understand
the rhythm, upgrade to Standard or Full.

**Use `recommend` when you don't know which method to pick.**
Le Stratege knows which brainstorming method fits your objective. Don't spend
time choosing — let the system guide you.

**Don't skip the reflection modes.**
They surface problems that neither you nor the agents see in the normal flow.
A 10-minute Table Ronde Duel before shipping can catch what 5 review passes missed.

**The interactive menu is your main control surface.**
At the end of every step, you get a menu. Take time to read it. The modes
available at each step are the ones most relevant to what just happened.

**Keep missions small: 2-3 tasks, never more.**
The temptation is to bundle work. Resist it. Larger missions mean larger
conversation contexts, which means lower quality outputs and harder reviews.
More missions = better quality, not more work.

**Trust the checkup system — if it blocks, there's a reason.**
Every handoff has a blocking checkup. If it fails, it means something is
incomplete. Fix the gap before moving forward. Skipping a checkup is how
technical debt is created.

**Use `/hkup-resume` or `/hkup-status` after an interruption.**
Life happens. You can stop at any point and resume later. The project summary
and status are saved in your output folder (e.g., `_hkup-output/`). Run
`/hkup-status` to see exactly where you left off, or `/hkup-resume` to pick
up from there.

**Let escalation happen naturally.**
If midway through Express, you discover the project is more complex than it
appeared, L'Eclaireur will propose escalating to Standard. Accept it. The
alternative is under-specified work with gaps.

**One path at a time, not one project at a time.**
H.K-UP is designed for focus. Run one path to completion before starting another.
The status file and deliverables accumulate and inform each subsequent session.
