<!-- Threat Modeling Skill | Version 1.1.0-universal | https://github.com/Kevin-hDev/claude-redteam-vs-blueteam | Original: https://github.com/fr33d3m0n/threat-modeling | License: BSD-3-Clause -->

# Changelog

All notable changes to the Threat Modeling Skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-15

### Changed
- Output directory restructured to unified `audit/Risk_Assessment_Report/` with subfolders (correction/, reports/, phases/, chain/)
- CORRECTION-PLAN.md added as required deliverable in dedicated `correction/` subfolder
- DATA files now bundled within the skill (`data/`) instead of shared root directory
- Python script references removed — LLM-driven discovery is the primary method
- Schema version aligned to "1.1.0" across all phase files
- Selective DATA loading replaces "ALWAYS load" rules for generic/ and exploits/
- Chain output `threat_model_output.yaml` moved to `chain/` subfolder
- Folder names in English by default (--lang=xx for localization)

### Added
- Unified Audit Folder documentation — all 3 skills write to same `audit/` root
- S12 Chain Output section with full schema for adversary-simulation consumption

### Fixed
- BUG-001: data/ path resolution (now bundled within skill)
- BUG-002/003: Selective loading for generic/ and exploits/ files
- BUG-004: Python script references removed (LLM does discovery directly)
- BUG-005: Entry types count harmonized to 14
- BUG-006: Schema version aligned to 1.1.0
- BUG-007: CORRECTION-PLAN added as required deliverable
- BUG-008: Subfolder structure prevents file mixing

## v1.1.0-universal (2026-03-14)

- Universalized: auto-detects any stack via P0-DETECTION
- Added INDEX-THEN-SELECTIVE data loading from shared data/
- Added chain output (threat_model_output.yaml) for adversary-simulation
- Integrated into claude-redteam-vs-blueteam security audit chain
- Based on threat-modeling v3.0.3 by fr33d3m0n (BSD-3-Clause)

---

> Upstream changelog from [threat-modeling](https://github.com/fr33d3m0n/threat-modeling) by fr33d3m0n:

## [3.0.3] - 2026-02-09

### Report System Enhancement (3-Layer)
- **Layer 1 - Main Report Optimization**: Expanded from 9 to 10 sections
  - New §0 Risk Posture Overview: Top-10 risk cards, STRIDE×Severity heatmap, key metrics dashboard
  - Enhanced §1 Executive Summary: 10 key findings (was 5), immediate action items
  - Enhanced §2 System Architecture: Dependency graph, tech stack security context, entry point quantification
  - Enhanced §3 Security Design Assessment: Security scorecard (X/100 per domain), gap categorization (G-ARCH/G-IMPL/G-PROC)
  - Enhanced §5 Risk Validation: Verification status badges, POC execution environment
  - Enhanced §6 Attack Path: ASCII + Mermaid side-by-side for DFD
  - Enhanced §8 Mitigation: Difficulty rating, effort breakdown, before/after code
- **Layer 2 - P8R Detailed Risk Reports**: Optional post-P8 phase with 12 analysis elements per VR
  - New `phases/P8R-DETAILED-REPORT.md` phase file
  - New `--detailed` flag for auto-triggering P8R
  - Per-VR reports: Risk overview, entry points, data flow, root cause, exploit scenario, POC, impact, attack chains, related vulns, mitigation, verification, traceability
- **Layer 3 - HTML Output Support**: Batch MD→HTML converter
  - New `scripts/report_generator.py` with Mermaid CDN rendering
  - Severity color coding (CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=blue)
  - Navigation sidebar, index page, print-friendly media queries

### New Files
- `phases/P8R-DETAILED-REPORT.md` - Optional detailed risk analysis phase
- `scripts/report_generator.py` - MD→HTML batch converter
- `docs/REPORT-DESIGN.md` - v3.0.3 report enhancement design document

### Schema Changes
- Added `DetailedRiskReport` entity and `P8RManifest` schema to `data-model.yaml`
- FSM extended with P8R state: δ(P8, p8_complete ∧ detailed) → P8R → DONE

## [3.0.2] - 2026-02-04

### Localization & Usability
- **English Localization**: All phase instructions (P1-P8) translated to English for better LLM compatibility
- **Extended Trigger Words**: Added security analysis, security audit, security check (EN/CN)
- **Removed**: compliance/合规检查 (out of core scope)

### Bug Fixes
- Fixed residual Chinese in P4 (L116-117, L145) and P5 (L126-128)

## [3.0.1] - 2026-02-03

### Architecture Optimization
- **File Responsibility Separation**: SKILL.md (WHAT & WHY) vs WORKFLOW.md (HOW & WHEN)
- **FSM Formalization**: 8-phase state machine with formal verification properties (Safety S1-S4, Liveness L1-L2)
- **4-Gate Sub-FSM**: Per-phase execution protocol (ENTRY → THINKING → PLANNING → EXECUTING → REFLECTING → EXIT)
- **Token Optimization**: 26.4% reduction (12,000 → 8,832 tokens) through de-duplication and cross-references
- **Cross-Reference Convention**: "See SKILL.md §X" pattern to maintain single source of truth

### Technical Changes
- Added `docs/SKILL-ARCHITECTURE-DESIGN.md` with FSM specification (§0, §0.1, §0.2)
- Simplified SKILL.md §10, §11 to constraint declarations
- Added WORKFLOW.md §1 Workflow State Machine definition
- Simplified WORKFLOW.md §3 data contracts (summary table instead of full schemas)
- Added `MEMORY.md` for project memory across sessions

## [3.0.0] - 2026-01-31

### Core Improvements
- **Context Efficiency**: Restructured for improved context completeness and execution efficiency
- **Systematic Analysis**: Enhanced attack path analysis with better coverage
- **Session History**: Multi-session version tracking for incremental analysis
- **CI/CD Integration**: Structured YAML phase output for external tool integration

### Technical Changes
- Separate phase instruction files (8 files, on-demand loading)
- Dual output model: YAML data (machine) + Markdown reports (human)
- PostToolUse hooks for automatic validation
- Extended security domains: AI/LLM, Mobile, Cloud, Agentic
- Chinese documentation (README-cn.md)

## [2.2.2] - 2026-01-29

### Added
- Session management with unique session IDs
- Data protocols for phase handoff
- Complete discovery validation

### Changed
- Improved validation integration
- Enhanced YAML block extraction

## [2.2.0] - 2026-01-28

### Added
- Phase output YAML blocks
- Validation integration framework

## [2.1.3] - 2026-01-20

### Added
- Phase 2 knowledge enhancement
- DFD methodology research

## [2.0.0] - 2025-12-30

### Added
- 8-phase workflow structure
- Knowledge base with CWE/CAPEC/ATT&CK
- Security control domains (10 core)

## [1.0.6] - 2025-12-30

### Added
- Initial release
- Basic STRIDE analysis capability
- Core knowledge base
