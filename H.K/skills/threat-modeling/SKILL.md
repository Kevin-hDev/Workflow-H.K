<!-- Threat Modeling Skill (Universal) | Version 1.1.0 (20260314) | https://github.com/Kevin-hDev/claude-redteam-vs-blueteam | License: BSD-3-Clause | Based on threat-modeling v3.0.3 (fr33d3m0n, BSD-3-Clause) -->

---
name: threat-modeling
description: Use when threat modeling, STRIDE analysis, risk assessment, or security audit — auto-detects stack, 9-phase workflow

  Flags:
    --debug    Enable debug mode, publish internal YAML data files and evaluation reports
    --lang=xx  Set output language (en, zh, ja, ko, es, fr, de, pt, ru)
    --detailed Auto-trigger P8R detailed per-VR analysis reports after P8 completes
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "./hooks/phase_end_hook.sh"  # Path relative to SKILL_PATH
          timeout: 30
---

> **Note**: All relative paths in this skill are relative to `SKILL_PATH` (the directory containing this SKILL.md file).

# Threat Modeling Skill v1.1.0

AI-native automated software risk analysis skill. LLM-driven, Code-First approach for comprehensive security risk assessment, threat modeling, security testing, penetration testing, and compliance checking.

```
+======================================================================================+
|  THREAT MODELING v1.1.0 — Universal (any stack, any OS, any framework)               |
|  Comprehensive STRIDE risk analysis with auto-detection                              |
|  Auto-detection : stack, OS, frameworks, dependencies → targeted DATA loading        |
+======================================================================================+
```

**Security skill chain**: This skill is the **1st** in the security chain:
```
**Threat Modeling** (risk analysis) → Adversary Simulation (attack) → Defensive Hardening (defense)
```
Its output (`threat_model_output.yaml`) is consumed by adversary-simulation in its P0 phase to target the offensive analysis.

---

## CRITICAL - Data vs Report Separation

> **PRINCIPLE**: Markdown is for reports (human-readable), YAML is for data (machine-readable). They MUST be separated!

```
+-----------------------------------------------------------------------+
|  DUAL OUTPUT MODEL - Each phase produces TWO files:                    |
+-----------------------------------------------------------------------+
|                                                                       |
|  1. DATA FILE (.yaml) - PRIMARY                                       |
|     - Written FIRST                                                   |
|     - Structured, machine-readable                                    |
|     - Used by NEXT phase as input                                     |
|     - Path: .phase_working/{SESSION_ID}/data/P{N}_*.yaml              |
|                                                                       |
|  2. REPORT FILE (.md) - SECONDARY                                     |
|     - Written AFTER data file                                         |
|     - Human-readable, formatted                                       |
|     - For review and documentation                                    |
|     - Path: .phase_working/{SESSION_ID}/reports/P{N}-*.md             |
|                                                                       |
|  FORBIDDEN: Reading .md files for data extraction                     |
|  FORBIDDEN: Embedding data as yaml blocks inside .md AS SOURCE        |
|  ALLOWED: YAML blocks in .md for schema documentation/examples        |
|  REQUIRED: Data flows via .yaml files only                            |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## S1 Execution Model

**Mode**: Full Assessment Only - All 9 phases executed sequentially (P0-P8).

```
Phase 0 --> Phase 1 --> Phase 2 --> Phase 3 --> Phase 4 --> Phase 5 --> Phase 6 --> Phase 7 --> Phase 8
   |            |            |            |            |            |            |            |
   v            v            v            v            v            v            v            v
P0.yaml --> P1.yaml --> P2.yaml --> P3.yaml --> P4.yaml --> P5.yaml --> P6.yaml --> P7.yaml --> P8.yaml
(detect)    (context)   (dfd)       (trust)     (design)   (stride)   (risks)    (mitig)     (report)
```

**Rules**:
1. Phases execute strictly in order (0→8)
2. Each phase reads previous phase's YAML, writes its own YAML
3. Each phase also writes a human-readable .md report
4. Validation runs on YAML files, not .md files
5. Phase 6 = Risk Validation (NOT mitigation)
6. Phase 7 = Mitigation Planning (AFTER validation)

**Phase Gate Protocol**:
```
FOR each phase N in [0..8]:
    1. Read: @phases/P{N}-*.md (instructions)
    2. Read: .phase_working/{SESSION_ID}/data/P{N-1}_*.yaml (input, except P0)
    3. Load relevant DATA from data/ (per P0 detection and phase-specific table)
    4. Execute analysis per phase instructions
    5. Write: .phase_working/{SESSION_ID}/data/P{N}_*.yaml (PRIMARY output)
    6. Write: .phase_working/{SESSION_ID}/reports/P{N}-*.md (SECONDARY output)
    7. Hook validates YAML file
    8. IF exit != 0: Fix YAML and rewrite
    9. IF exit == 0: Update session meta, continue to N+1
```

---

## S2 Output Convention

### Output Modes

```
+-----------------------------------------------------------------------+
|  OUTPUT MODES - Control what files are generated                       |
+-----------------------------------------------------------------------+
|                                                                       |
|  DEFAULT MODE (Production)                                            |
|  ---------------------------------------------------------------     |
|  Only user-deliverable files are published:                           |
|  4 Required Reports (RISK-ASSESSMENT, INVENTORY, MITIGATION,         |
|                      PENETRATION-TEST-PLAN)                           |
|  1 Correction Plan (CORRECTION-PLAN.md)                              |
|  8 Phase Reports (P0-P7-*.md) for audit trail                        |
|  .phase_working/ - NOT published (kept internally)                   |
|  YAML data files - NOT published                                     |
|  EVALUATION-REPORT.md - NOT published                                |
|                                                                       |
|  DEBUG MODE (--debug flag)                                            |
|  ---------------------------------------------------------------     |
|  All files are published including internal data:                     |
|  All default mode outputs                                            |
|  .phase_working/{SESSION_ID}/data/*.yaml - Published                 |
|  P5_knowledge_base_queries.yaml - Published                          |
|  P8_coverage_validation.yaml - Published                             |
|  EVALUATION-REPORT.md - Published                                    |
|                                                                       |
|  Usage: /threat-model @project --debug                               |
|                                                                       |
+-----------------------------------------------------------------------+
```

### Directory Structure

**Default Mode** (14 files published):
```
{PROJECT_ROOT}/
  audit/                                           <-- Unified audit folder (auto-created)
    Risk_Assessment_Report/                        <-- threat-modeling output
      correction/
        CORRECTION-PLAN.md                         <-- Actionable checklist (always first)
      reports/
        {PROJECT}-RISK-ASSESSMENT-REPORT.md        <-- Required (P8)
        {PROJECT}-RISK-INVENTORY.md                <-- Required (P6)
        {PROJECT}-MITIGATION-MEASURES.md           <-- Required (P7)
        {PROJECT}-PENETRATION-TEST-PLAN.md         <-- Required (P6)
      phases/
        P0-DETECTION.md                            <-- Phase reports
        P1-PROJECT-UNDERSTANDING.md
        P2-DFD-ANALYSIS.md
        P3-TRUST-BOUNDARY.md
        P4-SECURITY-DESIGN-REVIEW.md
        P5-STRIDE-THREATS.md
        P6-RISK-VALIDATION.md
        P7-MITIGATION-PLANNING.md
      chain/
        threat_model_output.yaml                   <-- Chain output for adversary-simulation
      detailed/                                    <-- P8R only (--detailed flag)
        VR-001-{title-slug}.md
        ...
```

### Unified Audit Folder

All three security skills (threat-modeling, adversary-simulation, defensive-hardening) write to the same `audit/` folder at the project root. Each skill creates its own subfolder.

- If `audit/` does not exist, the skill creates it automatically.
- If `audit/` already exists (from a previous skill run), the skill adds its subfolder alongside existing ones.
- Folder names are in **English by default**. Use `--lang=xx` to localize folder names if the user explicitly requests it.

### Naming Convention

- **PROJECT**: Uppercase, max 30 chars, format: `^[A-Z][A-Z0-9-]{0,29}$`
- **Example**: `OPEN-WEBUI`, `MY-PROJECT`, `CHILL-DESK`

### Session ID Format

- **SESSION_ID**: `{PROJECT_NAME}_{YYYYMMDD_HHMMSS}`
- **Example**: `OPEN-WEBUI_20260130_143022`

---

## S3 Core Data Model

> See @assets/contracts/data-model.yaml for complete schema definitions.

### Entity Types

| Entity | ID Format | Phase | Description |
|--------|-----------|-------|-------------|
| Module | M-{Seq:03d} | P1 | Code modules/components |
| Finding | F-P{N}-{Seq:03d} | P1-P3 | Security observations (factual) |
| Gap | GAP-{Seq:03d} | P4 | Security control deficiencies |
| Threat | T-{STRIDE}-{Element}-{Seq} | P5 | STRIDE threats |
| ValidatedRisk | VR-{Seq:03d} | P6 | Verified risks |
| Mitigation | MIT-{Seq:03d} | P7 | Remediation measures |
| POC | POC-{Seq:03d} | P6 | Proof of concept |
| AttackPath | AP-{Seq:03d} | P6 | Attack vectors (single path) |
| AttackChain | AC-{Seq:03d} | P6 | Multi-step attack sequences |
| TestCase | TC-{Seq:03d} | P8 | Penetration test cases |
| DetailedRiskRpt | (uses VR-{Seq:03d}) | P8R | Per-VR analysis report |

### Finding vs Gap Semantic Boundary

- **Finding (F-P{N}-xxx)**: A factual **observation** from phases 1-3 that MAY have security implications. Findings are objective facts about architecture, data flows, or boundaries. Example: "API endpoint uses HTTP instead of HTTPS"

- **Gap (GAP-xxx)**: A **security control deficiency** identified in P4 after analyzing findings against security domains. Gaps represent missing or inadequate controls. Example: "Missing TLS enforcement (NETWORK domain)"

**Transition Rule**: Findings from P1-P3 feed into P4 analysis. P4 evaluates findings against 18 security domains and produces Gaps where controls are deficient.

### DFD Element IDs

| Element Type | Prefix | Format | Example |
|--------------|--------|--------|---------|
| External Interactor | EI | EI-{NNN} | EI-001 |
| Process | P | P-{NNN} | P-001 |
| Data Store | DS | DS-{NNN} | DS-001 |
| Data Flow | DF | DF-{NNN} | DF-001 |
| Trust Boundary | TB | TB-{NNN} | TB-001 |

### Count Conservation (P5->P6 Threat Accounting)

```
P5.threat_count = P6.verified + P6.theoretical + P6.pending + P6.excluded
```

All threats from P5 must be accounted for in P6 (no threat loss).

### STRIDE Categories

| STRIDE | Name | CWEs | CAPEC |
|--------|------|------|-------|
| S | Spoofing | CWE-287, 290, 307 | CAPEC-151, 194, 600 |
| T | Tampering | CWE-20, 77, 78, 89 | CAPEC-66, 88, 248 |
| R | Repudiation | CWE-117, 223, 778 | CAPEC-93 |
| I | Information Disclosure | CWE-200, 209, 311 | CAPEC-116, 157 |
| D | Denial of Service | CWE-400, 770, 918 | CAPEC-125, 227 |
| E | Elevation of Privilege | CWE-269, 284, 862 | CAPEC-122, 233 |

---

## S4 Security Knowledge Architecture (INDEX-THEN-SELECTIVE)

> **PRINCIPLE**: No hardcoded knowledge. DATA is loaded dynamically from data/ directories via the INDEX-THEN-SELECTIVE pattern.
> Threat modeling loads BOTH offensive and defensive DATA because it analyzes risks AND evaluates existing controls.

### Four Knowledge Sources

1. **Local Knowledge** (STRIDE-specific, in SKILL_PATH/knowledge/)
   - 18 Security Domains (AUTHN, AUTHZ, INPUT, etc.)
   - OWASP References (74+ items)
   - CWE/CAPEC/ATT&CK mappings
   - Compliance Frameworks
   - Verification Sets (WSTG, MASTG, ASVS)
   - Loaded selectively as needed per phase (same as original)

2. **External DATA Offensive** (from data/offensive/)
   - Current attack patterns, exploit techniques
   - Loaded via INDEX-THEN-SELECTIVE from `data/offensive/index-offensive.md`
   - Used to identify threats and attack vectors in STRIDE analysis

> **Path resolution**: `data/` is a subdirectory of the skill folder
> (i.e., `SKILL_PATH/data/`). All DATA files are bundled within the skill.

3. **External DATA Defensive** (from data/defensive/)
   - Current defense patterns, hardening techniques
   - Loaded via INDEX-THEN-SELECTIVE from `data/defensive/index-defensive.md`
   - Used to evaluate existing controls and identify gaps

4. **Shared References** (from data/shared/)
   - CVE catalog, cross-references
   - Loaded via INDEX-THEN-SELECTIVE from `data/shared/index-shared.md`

### DATA Loading by Phase

| Phase | DATA to Load |
|-------|-------------|
| P0 | `index-offensive.md` + `index-defensive.md` + `index-shared.md` (detection + file selection) |
| P1 | DATA loaded per P0 detection (both offensive + defensive matched files) |
| P2 | No additional DATA (pure code analysis) |
| P3 | No additional DATA (pure code analysis) |
| P4 | Defensive DATA for security domain evaluation |
| P5 | Offensive DATA for STRIDE threat patterns + local knowledge/ for CWE/CAPEC |
| P6 | Offensive DATA for attack path validation + `data/shared/references/ref-cve-catalog.md` |
| P7 | Defensive DATA for mitigation recommendations |
| P8 | Compliance mappings from local knowledge/ |

### DATA Loading Procedure (Phase 0)

```
1. Scan the project to detect:
   - Config files: Cargo.toml, package.json, pyproject.toml, go.mod,
     pubspec.yaml, pom.xml, build.gradle, composer.json, Gemfile, etc.
   - Target OS: tauri.conf.json targets, CI matrix, build scripts
   - Frameworks: Tauri, Electron, Flutter, React, Vue, Angular, Django, etc.
   - Dependencies: analyze lockfiles for versions

2. Read data/offensive/index-offensive.md
3. Read data/defensive/index-defensive.md
4. Read data/shared/index-shared.md

5. Match index tags with detected stack

6. Load ONLY files whose tags match

7. Store loaded file list in _session_meta.yaml
```

### IMPORTANT — This skill loads BOTH offensive AND defensive DATA

```
LOAD  : data/offensive/**/*.md (for threat identification)
LOAD  : data/defensive/**/*.md (for control evaluation)
LOAD  : data/shared/**/*.md (for cross-references)
ALSO  : knowledge/ local files (STRIDE-specific, loaded selectively per phase)
```

---

## S5 Knowledge Base Queries

### kb Wrapper Usage

```bash
# Get skill path
SKILL_PATH=$(bash skill_path.sh)

# STRIDE queries
$SKILL_PATH/kb --stride spoofing
$SKILL_PATH/kb --stride-controls S

# CWE queries
$SKILL_PATH/kb --cwe CWE-89
$SKILL_PATH/kb --full-chain CWE-89

# Attack patterns
$SKILL_PATH/kb --capec CAPEC-89
$SKILL_PATH/kb --attack-technique T1078

# Verification tests
$SKILL_PATH/kb --stride-tests S
$SKILL_PATH/kb --wstg-category ATHN

# LLM/AI extensions
$SKILL_PATH/kb --all-llm
$SKILL_PATH/kb --ai-component
```

---

## S6 Language Adaptation

Output language follows context language unless `--lang=xx` specified.

| Context | File Names | Content |
|---------|------------|---------|
| Chinese | P1-PROJECT-UNDERSTANDING.md | Chinese |
| English | P1-PROJECT-UNDERSTANDING.md | English |

Supported: en, zh, ja, ko, es, fr, de, pt, ru

---

## S7 Progressive Context Loading (INDEX-THEN-SELECTIVE)

This skill uses progressive disclosure with INDEX-THEN-SELECTIVE for external DATA:

### Loading Pattern

```
Session Start:
  1. Load SKILL.md (global rules)
  2. Load WORKFLOW.md (orchestration)
  3. Create 9 phase todos (P0-P8)

Phase 0 (Detection):
  1. Scan project config files
  2. Read data/offensive/index-offensive.md
  3. Read data/defensive/index-defensive.md
  4. Read data/shared/index-shared.md
  5. Match tags with detected stack
  6. Load matched offensive + defensive + shared files
  7. Write P0_detection.yaml + P0-DETECTION.md

Per Phase (P1-P8):
  1. Read @phases/P{N}-*.md
  2. Load relevant DATA (per P0 detection and S4 table)
  3. Load relevant local knowledge/ files (selectively, as needed)
  4. Execute phase instructions
  5. Write YAML then MD in .phase_working/{SESSION_ID}/

Post-P8 (Optional):
  1. If --detailed flag OR user confirms: Load @phases/P8R-DETAILED-REPORT.md
  2. Generate per-VR detailed analysis reports
  3. Write to audit/Risk_Assessment_Report/detailed/VR-{NNN}-{slug}.md
```

### Token Budget

```
1. Always loaded: This file (SKILL.md) — ~8K tokens
2. At session start: @WORKFLOW.md — ~5K tokens
3. Per phase: @phases/P{N}-*.md — ~2-4K tokens each
4. On demand: data/ files — per detection
5. On demand: knowledge/ files — selectively per phase
```

---

## S8 Reference Files

| Path | Purpose |
|------|---------|
| @WORKFLOW.md | Orchestration contracts, phase gates |
| @phases/P0-DETECTION.md | Phase 0 instructions (stack detection + DATA loading) |
| @phases/P{1-8}-*.md | Phase-specific instructions |
| @phases/P8R-DETAILED-REPORT.md | Optional per-VR detailed reports |
| @knowledge/ | Local STRIDE-specific knowledge (95 files, loaded selectively) |
| data/offensive/index-offensive.md | Index of offensive DATA (selective loading) |
| data/defensive/index-defensive.md | Index of defensive DATA (selective loading) |
| data/shared/index-shared.md | Index of shared references (selective loading) |
| @hooks/phase_end_hook.sh | PostToolUse automation |

---

## S9 Quick Start

```bash
# 1. Start new session (default mode - 14 deliverable files)
/threat-model @my-project

# 2. With debug mode (all internal files published)
/threat-model @my-project --debug

# 3. Session execution:
#    - Claude loads SKILL.md + WORKFLOW.md automatically
#    - P0 detects stack and loads relevant DATA (offensive + defensive)
#    - For each phase N (0-8): Read → Execute → Write → Validate
#    - Generate final reports in audit/Risk_Assessment_Report/
#    - Produce threat_model_output.yaml for adversary-simulation chain
```

> **Output directory**: The skill creates `{PROJECT_ROOT}/audit/Risk_Assessment_Report/` automatically.
> If `/audit/` already exists (from a previous adversary-simulation or defensive-hardening run),
> the skill adds its folder alongside the others.
> All folder names are in English by default. Use `--lang=xx` to localize folder names.

### Output Summary

| Mode | Files Published | Use Case |
|------|-----------------|----------|
| Default | 14 (4 required reports + 1 correction plan + 8 phase reports + 1 chain output) | Production delivery |
| `--detailed` | 14 + per-VR detailed reports | Comprehensive assessment |
| `--debug` | 14 + YAML data + evaluation | Development, audit |

---

## S10 Core Execution Constraints (Invariants)

> **PRINCIPLE**: The quality of threat modeling depends on execution rigor. The following constraints are INVIOLABLE.

### Three Absolute Prohibitions

| Constraint | Description | Violation Consequence |
|------------|-------------|----------------------|
| NO MOCK DATA | All analysis must be based on real code evidence | Analysis results invalid |
| NO SIMPLIFIED IMPLEMENTATIONS | Each phase must be fully executed | Coverage requirements not met |
| NO BYPASSING PROBLEMS | Must diagnose root cause when blocked | Data chain broken |

### Phase Execution Invariant

```
FOR all Phase N in [0..8]:
  - Input: P{N-1}_*.yaml (except P0)
  - Output: P{N}_*.yaml (PRIMARY) + P{N}-*.md (SECONDARY)
  - Gate: Hook validation must return exit 0
  - Transition: Only proceed to N+1 after gate passes
```

> **Execution Protocol Details**: See WORKFLOW.md S2 Phase Execution Protocol

---

## S11 Phase Isolation Constraints

> **INVARIANT**: Each Phase is an independent execution unit. FSM state transitions MUST follow strict sequential order.

### Forbidden State Transitions

| Illegal Transition | Reason |
|-------------------|--------|
| Pn → Pn+2 (skip) | Violates FSM order invariant |
| Pn → Pn+1 (unvalidated) | Violates data contract completeness |
| Parallel Phase execution | Data dependencies cannot be satisfied |

### FSM State Machine Reference

```
States: {INIT, P0, P1, P2, P3, P4, P5, P6, P7, P8, P8R, DONE, ERROR}
Transitions: delta(INIT, start) -> P0
             delta(P0, p0_complete) -> P1
             delta(Pn, pn_complete) -> P(n+1) where n in {1..7}
             delta(P8, p8_complete AND detailed) -> P8R
             delta(P8, p8_complete AND NOT detailed) -> DONE
             delta(P8R, p8r_complete) -> DONE
Accepting: {DONE}
```

> **Complete FSM Specification**: See WORKFLOW.md S1

---

## S12 Chain Output

### threat_model_output.yaml

After P8 completes, produce `threat_model_output.yaml` in the `audit/Risk_Assessment_Report/chain/` directory. This file is consumed by adversary-simulation's P0 phase to target the offensive analysis.

```yaml
# threat_model_output.yaml — Chain output for adversary-simulation
schema_version: "1.1.0"                              # Skill's own version
source_skill: "threat-modeling"
generated_at: "ISO8601"

project_name: "PROJECT-NAME"
project_path: "/path/to/project"
detected_stack:
  os_targets: []
  languages: []
  frameworks: []

threat_surfaces:
  - surface: "Surface name"
    components: ["M-001", "M-003"]
    entry_points: ["EP-001"]
    trust_boundary: "TB-001"
    stride_categories: ["S", "T", "E"]

critical_components:
  - id: "M-001"
    name: "Component name"
    type: "process|data_store|external"
    security_level: "critical|high|medium|low"
    gaps: ["GAP-001", "GAP-003"]

stride_findings:
  - id: "T-S-P001-001"
    stride_category: "S"
    element_id: "P-001"
    severity: "CRITICAL|HIGH|MEDIUM|LOW"
    cwe_refs: ["CWE-287"]
    capec_refs: ["CAPEC-151"]
    description: "Threat description"
    validated_risk: "VR-001"

recommended_attack_vectors:
  - vector: "Attack vector description"
    target_components: ["M-001"]
    stride_ref: "T-S-P001-001"
    priority: "P0|P1|P2|P3"
    suggested_techniques: ["CAPEC-151"]

risk_ratings:
  total_risks: 0
  by_priority:
    P0: 0
    P1: 0
    P2: 0
    P3: 0
  by_stride:
    S: 0
    T: 0
    R: 0
    I: 0
    D: 0
    E: 0
  average_cvss: 0.0
```

> **Schema version note**: All `schema_version` fields in this skill use `"1.1.0"`, aligned with the skill version in VERSION.md.

---

**End of SKILL.md** (~510 lines, ~8K tokens)
