# Changelog

All notable changes to H.K-UP will be documented in this file.

## [1.0.0] — 2026-03-17

### Added

**Core Framework**
- 9 agents with distinct personalities (L'Eclaireur, Le Stratege, L'Architecte, Le Designer, Le Chirurgien, Le Gardien, Nyx, The Mask, Zero)
- 10 global rules governing all agent interactions
- 5 adaptive paths: Express, Standard, Full, Design, Audit
- Size x objective matrix for automatic path recommendation

**Workflows (9)**
- Diagnostic — project scan, objective selection, path recommendation
- Brainstorming — 8 directive methods + 20 techniques
- PRD — structured Product Requirements Document creation
- Architecture — ADRs, Quest/Mission breakdown, git strategy
- Design — Nielsen audit, 3+ visual directions, HTML mockups, design tokens
- Dev — mission-based execution with baseline tests and atomic commits
- Review — constructive + adversarial code review with direct fixes
- Security — STRIDE/DREAD audit + Table Ronde Duel (Nyx vs The Mask)
- Finalisation — final PRD checkup, documentation update, formal closure

**Reflection Modes (7)**
- Table Ronde (3 variants: Ouverte, Ciblee, Duel)
- Prisme (31 facettes across 7 families)
- Simulation (6 types: Stress Test, Migration Dry Run, User Journey, Incident Response, Onboarding Dev, Rollback)
- Archeologie (git history analysis)
- Benchmark Vivant (state-of-the-art comparison)
- Tribunal de la Dette (prosecution vs defense)
- Conformite (10 legal domains, creator + user risks)

**Security Data**
- 10 DATA files (5 attack patterns, 4 defense patterns, 1 OWASP reference)
- INDEX_THEN_SELECTIVE loading (never load all files)
- 6 non-negotiable critical control points

**Design System**
- Anti-AI-slop patterns (NEVER list + ALWAYS list + Signature Test)
- Loaded natively at every design step

**Quality Gates**
- STOP-CHECKs in all 11 step files that load DATA (forces READ, not just list)
- Progressive checkup system (3 levels: transition, phase, final)
- Pre-flight checks in 4 workflows (file existence verification)
- Blocking gates at every agent handoff (100% Must Have coverage)

**Transversal Mechanisms**
- Path escalation (detection signals + escalation matrix)
- Resume after interruption (hk-up-status.yaml as single source of truth)
- Interactive menu system between every step (mode relevance table)

**Slash Commands (17)**
- 9 workflow launchers (/hkup-start through /hkup-finalize)
- 5 utility commands (/hkup-resume, /hkup-status, /hkup-table-ronde, /hkup-prisme, /hkup-tribunal)
- /hkup-conformite, /hkup-help, /hkup-install

**CLI Installer**
- Interactive 6-step installation via npx
- 11 IDE support (Claude Code, Cursor, Gemini CLI, Copilot, Codex CLI, Windsurf, Zed, Crush, Mistral Vibe, Kimi Code, Droids)
- --yes flag for non-interactive mode

**Documentation**
- README.md with quick start, agent table, path table
- TUTORIAL.md (12 sections with concrete examples)
- 3 templates (mission-brief, gap-report, debt-report)
