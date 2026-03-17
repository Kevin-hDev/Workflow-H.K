# Changelog — Adversary Simulation

All notable changes to the Adversary Simulation skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-15

### Changed
- Output directory restructured to unified `audit/Offensive_Report/` with subfolders (correction/, reports/, phases/, chain/)
- CORRECTION-PLAN.md added as required deliverable
- DATA files now bundled within the skill (`data/`) instead of shared root directory
- Schema version aligned to "1.1.0" across all phase files
- Folder names in English by default

### Added
- S11 Chain Output section — `adversary_output.yaml` schema for defensive-hardening consumption
- Unified Audit Folder documentation
- P0 T7b: Specific parser for `threat_model_output.yaml` (reads threat_surfaces, recommended_attack_vectors, critical_components)
- P6: CORRECTION-PLAN generation with priority-grouped checklist

### Fixed
- BUG-001-ADV: data/ path resolution (now bundled)
- BUG-002-ADV: threat_model_output.yaml parser added (was generic search only)
- BUG-003-ADV: CORRECTION-PLAN added as deliverable
- BUG-004-ADV: Subfolder structure prevents file mixing
- BUG-005-ADV: adversary_output.yaml chain output created

## v1.1.0 (2026-03-14)

### Changed
- Translated all files from French to English for public GitHub release
- Shortened SKILL.md description to < 200 characters
- Updated version references across all files

### Fixed
- INDEX-THEN-SELECTIVE paths now point to `data/offensive/` (was `SECURITY-DATA-UNIVERSAL/`)

## v1.0.0 (2026-03-14)

### Added
- Universal adversary simulation skill (stack-agnostic)
- P0-DETECTION phase: auto-detects stack, OS, frameworks, and loads relevant DATA
- INDEX-THEN-SELECTIVE pattern for intelligent DATA loading from `data/offensive/`
- 7-phase workflow (P0-P6): Detection → Reconnaissance → Flow Mapping → Vulnerability Hunting → Attack Construction → Attack Chains → Offensive Report
- 14 dynamic attack categories (IPC, XSS, SUBPROCESS, LLM, SUPPLY, NET, CRYPTO, PRIVESC, DECEPTION, COMMS, INJECTION, DESERIALIZATION, SSRF, AUTH_BYPASS)
- Chain output (`adversary_output.yaml`) for defensive-hardening skill
- Threat-modeling report detection in P0 for targeted analysis
- User checkpoint in P5 before final report
- Kill chain mapping (CHAIN-xxx) in P5
- Count conservation rule P3 → P4 → P5 (zero loss)
- 4-gate protocol per phase (Thinking → Planning → Executing → Validating)
- Dual output model: YAML (machine) + Markdown (human)

### Based on
- Inspired by `adversary-simulation-rust-react` v1.0.0 (Kevin-hDev, BSD-3-Clause)
- Universalized to support any stack, OS, and framework
