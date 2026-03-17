---
name: hkup-help
description: "Display all available H.K-UP commands and their descriptions. Use when the user asks for help, says 'what commands are available', or types /hkup-help."
---

# H.K-UP Help — Command Reference

Display the complete list of available H.K-UP commands. No workflow loading needed.

## Output

Present the following command reference table to the user:

---

# H.K-UP Commands

## Workflow Commands

| Command | Agent | Description |
|---------|-------|-------------|
| `/hkup-start` | L'Eclaireur | Project diagnostic — the first step in every journey. Scans the project, produces a diagnostic report, and proposes a development path. |
| `/hkup-brainstorm` | Le Stratege | Brainstorming session — structured ideation to explore solutions and generate creative approaches. |
| `/hkup-prd` | Le Stratege | PRD creation — produces a structured Product Requirements Document from gathered requirements. |
| `/hkup-architecture` | L'Architecte | Architecture design — designs the technical architecture based on the PRD and project constraints. |
| `/hkup-design` | Le Designer | UI/UX design — audits interfaces, explores design options, creates mockups, and validates. |
| `/hkup-dev` | Le Chirurgien | Development — implements code changes with surgical precision: brief, implement, verify. |
| `/hkup-review` | Le Gardien | Code review — thorough quality check for consistency and adherence to standards. |
| `/hkup-security` | Nyx | Security audit — scans for vulnerabilities, challenges assumptions, produces a security report. |
| `/hkup-finalize` | Le Stratege | Finalization — wraps up the project with final PRD checkup and handoff document. |

## Utility Commands

| Command | Description |
|---------|-------------|
| `/hkup-resume` | Resume a workflow from where it was interrupted. Shows 3 options: resume, review plan, restart. |
| `/hkup-status` | Display current workflow progression: phases, missions, statuses, completion percentage. |
| `/hkup-table-ronde` | Launch a multi-agent debate (Round Table). Variants: Ouverte, Ciblee, Duel. |
| `/hkup-prisme` | Launch a multi-faceted analysis through guided questions. 7 families of perspectives. |
| `/hkup-tribunal` | Launch the Technical Debt Trial. L'Eclaireur prosecutes, Zero defends. |

## Compliance

| Command | Description |
|---------|-------------|
| `/hkup-conformite` | Legal and regulatory compliance check with current web research. |

## Other

| Command | Description |
|---------|-------------|
| `/hkup-help` | Display this command reference. |
| `/hkup-install` | Install H.K-UP in the current project. |

---

## Typical Journey

1. `/hkup-start` — Always start here
2. `/hkup-brainstorm` — Explore ideas
3. `/hkup-prd` — Define requirements
4. `/hkup-architecture` — Design the system
5. `/hkup-design` — Design the interface
6. `/hkup-dev` — Build it
7. `/hkup-review` — Check quality
8. `/hkup-security` — Verify security
9. `/hkup-finalize` — Wrap up

Use `/hkup-status` at any time to check progress, and `/hkup-resume` to continue after interruption.
