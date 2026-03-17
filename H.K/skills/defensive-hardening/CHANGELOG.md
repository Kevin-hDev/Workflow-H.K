# Changelog — Defensive Hardening

All notable changes to the Defensive Hardening skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-15

### Changed
- Output directory restructured to unified `audit/Defensive_Report/` with subfolders (correction/, reports/, code/, phases/)
- CORRECTION-PLAN.md added as required deliverable
- DATA files now bundled within the skill (`data/`) instead of shared root directory
- Schema version aligned to "1.1.0" across all phase files
- Folder names in English by default

### Added
- Unified Audit Folder documentation
- Chain Input documentation — `adversary_output.yaml` schema from adversary-simulation
- P7 Cross-validation matrix format (VULN→FIX with status: code_fix_provided|documented_only|unaddressed)
- P8: CORRECTION-PLAN generation

### Fixed
- BUG-001-DEF: data/ path resolution (now bundled)
- BUG-002-DEF: adversary_output.yaml schema documented for P0/P7
- BUG-003-DEF: CORRECTION-PLAN added as deliverable
- BUG-004-DEF: Subfolder structure prevents file mixing
- BUG-005-DEF: Cross-validation matrix format specified

## v1.1.0 (2026-03-14)

### Changed
- Translated all files from French to English for public GitHub release
- Shortened SKILL.md description to < 200 characters
- Updated version references across all files

### Fixed
- INDEX-THEN-SELECTIVE paths now point to `data/defensive/` (was `SECURITY-DATA-UNIVERSAL/`)

## v1.0.0 (2026-03-14)

### Added
- Universal defensive hardening skill (stack-agnostic)
- P0-DETECTION phase: auto-detects stack, OS, frameworks, and loads relevant DATA
- INDEX-THEN-SELECTIVE pattern for intelligent DATA loading from `data/defensive/`
- 9-phase workflow (P0-P8): Detection → Existing Audit → Hardening Points → Code Hardening → Framework Hardening → Network/Crypto Hardening → Deception/Traps → Cross-Validation → Defensive Report
- 13 dynamic defense categories (RUNTIME, FW, IPC, SUBPROCESS, CRYPTO, NET, OS, ANTI_RE, DECEPTION, LLM, AUTH, INJECTION, SUPPLY)
- Triple output model for P3-P6: YAML (data) + Source Code (concrete protection) + Markdown (report)
- Adversary-simulation report detection in P0 (`adversary_output.yaml`) for targeted hardening
- Cross-validation in P7 against adversary-simulation findings
- Count conservation rule P2 → P3-P6 → P7 (zero forgotten gaps)
- Fix priority system (P0 Immediate → P1 7 days → P2 30 days → P3 Backlog)
- 4-gate protocol per phase (Thinking → Planning → Executing → Validating)
- Concrete, integrable protection code (not abstract recommendations)

### Based on
- Inspired by `defensive-hardening-rust-react` v1.0.0 (Kevin-hDev, BSD-3-Clause)
- Universalized to support any stack, OS, and framework
