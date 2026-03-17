<!-- Defensive Hardening (Universal) | Version 1.1.0 (20260314) | https://github.com/Kevin-hDev/claude-redteam-vs-blueteam | License: BSD-3-Clause | Inspired by defensive-hardening-rust-react (Kevin-hDev, BSD-3-Clause) -->

---
name: defensive-hardening
description: Use when defensive hardening, security hardening, or secure coding — auto-detects stack and writes concrete protection code
---

> **Note** : All relative paths in this skill are relative to `SKILL_PATH` (the folder containing this SKILL.md).

# Defensive Hardening Skill v1.1.0

Automated universal defensive hardening. Claude analyzes the source code of ANY project, identifies weaknesses, and **writes concrete protection code** in the project's language for each weakness. No abstract recommendations — real, integrable, tested code.

```
+======================================================================================+
|  DEFENSIVE HARDENING v1.1.0 — Universal (any stack, any OS, any framework)         |
|  Harden, slow down, trap                                                            |
|  Auto-detection: stack, OS, frameworks, dependencies → targeted DATA                |
+======================================================================================+
```

**Skill chain** : This skill is the 3rd in the security chain:
```
Threat Modeling (risk analysis) → Adversary Simulation (attack) → **Defensive Hardening** (defense)
```
If an adversary-simulation report exists (`adversary_output.yaml`), load it in P0 to target the hardening.
If a threat-modeling report exists, load it too to prioritize protections.

---

## CRITICAL - This Skill Writes Code

> **PRINCIPLE** : This skill does NOT make recommendations. It **writes concrete code** that blocks attackers. Each code phase (P3-P6) produces integrable source code in the language detected in P0.

```
+-----------------------------------------------------------------------+
|  TRIPLE OUTPUT MODEL - Each phase P3-P6 produces THREE files         |
+-----------------------------------------------------------------------+
|                                                                       |
|  1. DATA FILE (.yaml) - PRIMARY                                       |
|     - Structured, machine-readable                                    |
|     - Inventory of added protections                                  |
|     - Path: audit/Defensive_Report/.defender_working/{SESSION_ID}/data/P{N}_*.yaml          |
|                                                                       |
|  2. CODE FILE (detected language) - CONCRETE CODE                    |
|     - Real, complete, integrable code                                 |
|     - Language adapted to the stack detected in P0                   |
|     - Path: audit/Defensive_Report/.defender_working/{SESSION_ID}/code/P{N}_*               |
|                                                                       |
|  3. REPORT FILE (.md) - SECONDARY                                     |
|     - Human documentation of the written code                        |
|     - Path: audit/Defensive_Report/.defender_working/{SESSION_ID}/reports/P{N}-*.md         |
|                                                                       |
|  MANDATORY: Data flows only via .yaml files                           |
|  MANDATORY: Code is written IN the code/ files                        |
|  MANDATORY: Report documents the code and its integration             |
|                                                                       |
+-----------------------------------------------------------------------+
```

**Note** : Phases P0, P1, P2, P7, P8 produce two files (YAML + MD). Only phases P3-P6 produce three files (YAML + Code + MD).

---

## S1 - Execution Model

**Mode** : Complete defensive hardening - 9 phases executed sequentially (P0 to P8).

```
P0 ----> P1 ----> P2 ----> P3 ----> P4 ----> P5 ----> P6 ----> P7 ----> P8
 |        |        |        |        |        |        |        |        |
 v        v        v        v        v        v        v        v        v
detect   audit    gaps    code     frame    net      traps    xval    report
```

**Rules** :
1. Phases execute strictly in order (0 to 8)
2. Each phase reads the YAML from the previous phase, writes its own YAML
3. Phases P3-P6 write concrete source code (language adapted to the detected stack)
4. Phase 7 loads adversary-simulation results for cross-validation
5. Phase 8 produces the final report with all code to integrate

**Phase transition protocol** :
```
FOR each phase N in [0..8]:
    1. Read: @phases/P{N}-*.md (phase instructions)
    2. Read: audit/Defensive_Report/.defender_working/{SESSION_ID}/data/P{N-1}_*.yaml (input, except P0)
    3. Load relevant defensive DATA (based on P0 detection)
    4. Execute analysis/coding per phase instructions
    5. Write: audit/Defensive_Report/.defender_working/{SESSION_ID}/data/P{N}_*.yaml (PRIMARY output)
    6. IF P3-P6: Write code to audit/Defensive_Report/.defender_working/{SESSION_ID}/code/
    7. Write: audit/Defensive_Report/.defender_working/{SESSION_ID}/reports/P{N}-*.md (report)
    8. Validate YAML consistency
    9. IF valid: Continue to N+1
   10. IF invalid: Correct and rewrite
```

---

## S2 - Output Convention

### Directory Structure

```
{PROJECT_ROOT}/
  audit/                                           <-- Unified audit folder (auto-created)
    Defensive_Report/                              <-- defensive-hardening output
      correction/
        CORRECTION-PLAN.md                         <-- Actionable checklist
      reports/
        {PROJECT}-DEFENSIVE-REPORT.md              <-- Final report (P8)
        {PROJECT}-PROTECTION-INVENTORY.md          <-- Protection catalog
        {PROJECT}-CODE-INTEGRATION.md              <-- Integration guide
        {PROJECT}-CROSS-VALIDATION.md              <-- Cross-validation results
      code/                                        <-- All code to integrate
        code_hardening/                            <-- P3 code
        framework_hardening/                       <-- P4 code
        network_crypto_hardening/                  <-- P5 code
        deception_traps/                           <-- P6 code
      phases/
        P0-DETECTION.md .. P8-DEFENSIVE-REPORT.md
      .defender_working/                           <-- Internal data
        {SESSION_ID}/
          _session_meta.yaml
          data/
            P0_detection.yaml
            P1_audit.yaml
            P2_reinforcement_points.yaml
            P3_code_hardening.yaml
            P4_framework_hardening.yaml
            P5_network_crypto_hardening.yaml
            P6_deception_traps.yaml
            P7_cross_validation.yaml
            P8_report_manifest.yaml
          code/
            (source code files per phase)
          reports/
            (phase reports)
```

### Unified Audit Folder

All three security skills (threat-modeling, adversary-simulation, defensive-hardening) write to the same `audit/` folder at the project root. Each skill creates its own subfolder.

- If `audit/` does not exist, the skill creates it automatically.
- If `audit/` already exists (from a previous skill run), the skill adds its subfolder alongside existing ones.
- Folder names are in **English by default**. Use `--lang=xx` to localize folder names if the user explicitly requests it.

### Naming Convention

- **PROJECT** : Uppercase, max 30 chars, format: `^[A-Z][A-Z0-9-]{0,29}$`
- **SESSION_ID** : `{PROJECT_NAME}_{YYYYMMDD_HHMMSS}`

### Session Metadata

```yaml
# audit/Defensive_Report/.defender_working/{SESSION_ID}/_session_meta.yaml
schema_version: "1.1.0"
session_id: "MYAPP_20260314_160000"
project_name: "MYAPP"
project_path: "/path/to/project"
started_at: "2026-03-14T16:00:00Z"
language: "en"
skill_version: "1.1.0"
current_state: "P0"

# P0 detection (filled after P0)
detected_stack:
  os_targets: []
  languages: []
  frameworks: []
  package_managers: []
  config_files_found: []

# Previous references
adversary_session_ref: null   # Filled in P0 if adversary_output.yaml found
threat_model_ref: null        # Filled in P0 if threat model found

# Loaded defensive DATA (filled after P0)
loaded_data:
  defensive_files: []

phases:
  P0:
    status: "pending"
    started_at: null
    completed_at: null
    data_file: "data/P0_detection.yaml"
    report_file: "reports/P0-DETECTION.md"
  P1:
    status: "pending"
    data_file: "data/P1_audit.yaml"
    report_file: "reports/P1-EXISTING-AUDIT.md"
  P2:
    status: "pending"
    data_file: "data/P2_reinforcement_points.yaml"
    report_file: "reports/P2-HARDENING-POINTS.md"
  P3:
    status: "pending"
    data_file: "data/P3_code_hardening.yaml"
    code_dir: "code/code_hardening/"
    report_file: "reports/P3-CODE-HARDENING.md"
  P4:
    status: "pending"
    data_file: "data/P4_framework_hardening.yaml"
    code_dir: "code/framework_hardening/"
    report_file: "reports/P4-FRAMEWORK-HARDENING.md"
  P5:
    status: "pending"
    data_file: "data/P5_network_crypto_hardening.yaml"
    code_dir: "code/network_crypto_hardening/"
    report_file: "reports/P5-NETWORK-CRYPTO-HARDENING.md"
  P6:
    status: "pending"
    data_file: "data/P6_deception_traps.yaml"
    code_dir: "code/deception_traps/"
    report_file: "reports/P6-DECEPTION-TRAPS.md"
  P7:
    status: "pending"
    data_file: "data/P7_cross_validation.yaml"
    report_file: "reports/P7-CROSS-VALIDATION.md"
  P8:
    status: "pending"
    data_file: "data/P8_report_manifest.yaml"
    report_file: "reports/P8-DEFENSIVE-REPORT.md"
```

---

## S3 - Data Model

### Entity Types

| Entity | ID Format | Phase | Description |
|--------|-----------|-------|-------------|
| ExistingProtection | PROT-{Seq:03d} | P1 | Already existing protections |
| Gap | GAP-{Seq:03d} | P2 | Identified hardening points |
| CodeFix | FIX-{Seq:03d} | P3-P6 | Written protection code |
| TestCase | TEST-{Seq:03d} | P3-P6 | Tests associated with the code |
| CrossRef | XREF-{Seq:03d} | P7 | Cross-references with adversary-simulation |
| Recommendation | REC-{Seq:03d} | P8 | Final report recommendation |

### Protection Categories (Dynamic — detected in P0)

| Code | Category | Vectors covered |
|------|----------|-----------------|
| RUNTIME | Runtime/memory security | Constant comparison, zeroize, error handling, memory safety, panic safety |
| FW | Application framework | Capabilities, CSP, WebView/widget isolation, Content Security Policy |
| IPC | Inter-process communication | HMAC bridge authentication, Isolation Pattern, command validation, platform channels |
| SUBPROCESS | Subprocess/sidecar | Subprocess hardening, argument validation, process isolation |
| CRYPTO | Storage/Crypto | Base encryption, keyring/keychain, AES-256-GCM, key rotation |
| NET | Network/TLS | TLS 1.3, certificate pinning, API key protection, CORS |
| OS | System/Privilege | pkexec, UAC, TCC, polkit, sandbox, least privilege |
| ANTI_RE | Anti-reverse engineering | Code signing, binary hardening, packaging protection, RASP |
| DECEPTION | Deception/Monitoring | Canary files, honeypots, secure logging, kill switch |
| LLM | LLM/AI Defense | CaMeL, Spotlighting, input/output validation, multi-agent defense |
| AUTH | Authentication/Authorization | Auth patterns, session management, RBAC, OIDC |
| INJECTION | Injection protection | Prepared statements, escaping, input validation, CSP |
| SUPPLY | Supply chain | Lockfile integrity, dependency audit, SRI |

### Fix Priority

| Level | Description | Delay |
|-------|-------------|-------|
| P0 | Blocking - open critical vulnerability | Immediate |
| P1 | Urgent - exploitable high vulnerability | 7 days |
| P2 | Important - hardening needed | 30 days |
| P3 | Backlog - recommended improvement | Planned |

### Count Conservation (P2 -> P3-P6 -> P7)

```
P2.total_gaps = sum(P3.fixes + P4.fixes + P5.fixes + P6.fixes) + P7.still_unaddressed

All P2 GAPs must be accounted for in P7 (none forgotten).
```

---

## S4 - Defensive Knowledge Base (INDEX-THEN-SELECTIVE)

> **PRINCIPLE** : No hardcoded knowledge. DATA is dynamically loaded from data/defensive/ via the INDEX-THEN-SELECTIVE pattern.
> For shared references (CVE catalog, threat model), load from `data/shared/`.

### Source of Defensive DATA

```
DEFENSIVE DATA: data/defensive/
Load index-defensive.md → match tags with stack detected in P0 → load relevant files
NO fixed limit — proportional to project
```

> **Note** : `data/` is a subdirectory of this skill folder (the folder containing this SKILL.md). All defensive and shared DATA files are located within it.

### Available categories in data/defensive/

| Category | Path | When to load |
|----------|------|--------------|
| generic/ | Universal cross-stack defenses | ALWAYS (common base) |
| rust-tauri/ | Rust/Tauri/React specific defenses | If Cargo.toml + tauri detected |
| flutter-dart/ | Flutter/Dart specific defenses | If pubspec.yaml detected |
| platform/ | Patterns by OS | Based on detected OS targets |
| stack/ | Patterns by framework | Based on detected stack |
| infra/ | Cloud, CI/CD, containers | If infra detected |

### IMPORTANT — This skill loads ONLY defensive files

```
LOAD  : data/defensive/**/*.md (generic/ + rust-tauri/ + flutter-dart/ + platform/ + stack/ + infra/)
DO NOT LOAD: data/offensive/ (reserved for adversary-simulation skill)
```

### Loading procedure (Phase 0)

```
1. Scan project to detect:
   - Config files: Cargo.toml, package.json, pyproject.toml, go.mod,
     pubspec.yaml, pom.xml, build.gradle, composer.json, Gemfile, etc.
   - OS targets: config file targets, CI matrix, build scripts
   - Frameworks: Tauri, Electron, Flutter, React, Vue, Angular, Django, etc.
   - Dependencies: analyze lockfiles for versions
   - Previous reports: adversary_output.yaml, threat model

2. Read data/defensive/index-defensive.md

3. Match index tags with detected stack

4. Load ONLY files whose tags match

5. Store list of loaded files in _session_meta.yaml
```

### Chain Input: adversary_output.yaml

If adversary-simulation was run before this skill, it produces `adversary_output.yaml` in `audit/Offensive_Report/chain/`. This file contains:

- `vulnerabilities[]` — All discovered vulnerabilities with file:line locations and severity
- `attack_scenarios[]` — Concrete exploitation scenarios
- `attack_chains[]` — Multi-step attack chains with kill chain mapping
- `recommended_defenses[]` — Prioritized defense suggestions

P0 reads this file to prioritize hardening points. P7 uses it for cross-validation (every VULN should have a corresponding FIX).

---

## S5 - Defensive Posture

> **PRINCIPLE** : This skill adopts the defender's perspective. Every analysis must answer: "How do we prevent a hacker from exploiting this?"

### Posture Rules

1. **Real code** : No pseudo-code, no abstract recommendations. Complete, integrable code in the project's language
2. **Tests included** : Each defensive code block must have at least one unit test
3. **Integration documented** : For each piece of code written, document exactly WHERE and HOW to integrate it in the existing project
4. **Defense in depth** : Multiple protection layers for each attack vector
5. **Fail closed** : Any security error must CLOSE access, never open it
6. **Zero trust** : Never trust incoming data, even internal

### Code Fix Format (P3-P6)

```yaml
- id: FIX-001
  gap_ref: GAP-003
  category: RUNTIME
  title: "Constant-time comparison for authentication tokens"
  priority: P0
  target_file: "path/to/file.ext"
  insertion_point:
    file: "path/to/file.ext"
    after_line: 42
    method: "replace"  # insert|replace|wrap
  code_file: "code/code_hardening/fix_001_constant_time.ext"
  test_file: "code/code_hardening/test_fix_001.ext"
  integration_steps:
    - "Add the dependency in the config file"
    - "Import the module in the target file"
    - "Replace the vulnerable code with the protected code"
  before_code: |
    if computed_hmac == received_hmac {
  after_code: |
    if constant_time_compare(computed_hmac, received_hmac) {
  impact: "Blocks timing attacks on token verification"
  effort: "15 minutes"
```

---

## S6 - Progressive Context Loading (INDEX-THEN-SELECTIVE)

This skill uses progressive loading adapted to the INDEX-THEN-SELECTIVE pattern:

### Per phase

| Phase | DATA to load |
|-------|-------------|
| P0 | `data/defensive/index-defensive.md` (stack detection + file selection) |
| P1 | Relevant data/defensive/ files loaded per P0 detection (overview for auditing) |
| P2 | Same as P1 (to identify all gaps) |
| P3 | Runtime/memory DATA matched in P0 |
| P4 | Framework/IPC/OS/anti-RE DATA matched in P0 |
| P5 | Network/TLS/crypto/storage DATA matched in P0 |
| P6 | Deception/monitoring/LLM DATA matched in P0 |
| P7 | Cross-validation DATA + adversary-simulation results |
| P8 | None (YAML synthesis) |

### Loading pattern

```
Session start:
  1. Load SKILL.md (global rules)
  2. Load WORKFLOW.md (orchestration)
  3. Create 9 tasks in TaskCreate (P0-P8)

Phase 0 (Detection):
  1. Scan project config files
  2. Read data/defensive/index-defensive.md
  3. Match tags with detected stack
  4. Load relevant defensive files
  5. Look for adversary_output.yaml / threat model
  6. Write P0_detection.yaml + P0-DETECTION.md

Per phase (P1-P8):
  1. Read @phases/P{N}-*.md
  2. Load relevant DATA (if not already loaded)
  3. Execute phase instructions
  4. Write YAML + Code (if P3-P6) + MD
```

### Files loaded per component

```
1. Always loaded: This file (SKILL.md) — ~8K tokens
2. At startup: @WORKFLOW.md — ~7K tokens
3. Per phase: @phases/P{N}-*.md — ~2-3K tokens each
4. On demand: data/defensive/ — based on detection
```

---

## S7 - Reference Files

| Path | Purpose |
|------|---------|
| @WORKFLOW.md | Orchestration, phase contracts, state machine |
| @phases/P0-DETECTION.md | Phase 0 instructions (Stack detection) |
| @phases/P1-EXISTING-AUDIT.md | Phase 1 instructions |
| @phases/P2-HARDENING-POINTS.md | Phase 2 instructions |
| @phases/P3-CODE-HARDENING.md | Phase 3 instructions |
| @phases/P4-FRAMEWORK-HARDENING.md | Phase 4 instructions |
| @phases/P5-NETWORK-CRYPTO-HARDENING.md | Phase 5 instructions |
| @phases/P6-DECEPTION-TRAPS.md | Phase 6 instructions |
| @phases/P7-CROSS-VALIDATION.md | Phase 7 instructions |
| @phases/P8-DEFENSIVE-REPORT.md | Phase 8 instructions |
| data/defensive/index-defensive.md | Index of defensive DATA (selective loading) |

---

## S8 - Quick Start

```bash
# 1. Run defensive hardening on any project
/defensive-hardening @my-project

# 2. With adversary-simulation results (recommended)
/defensive-hardening @my-project --adversary-report ./audit/Offensive_Report/

# 3. Session execution:
#    - Claude loads SKILL.md + WORKFLOW.md automatically
#    - P0 detects the stack and loads relevant DATA
#    - P1-P2: Analysis and gap identification
#    - P3-P6: Writing protection code (detected language)
#    - P7: Cross-validation against adversary-simulation vulnerabilities
#    - P8: Final report with integration guide
```

---

## S9 - Execution Constraints (Invariants)

### Required Deliverables

| Deliverable | Path | Description |
|-------------|------|-------------|
| CORRECTION-PLAN | `audit/Defensive_Report/correction/CORRECTION-PLAN.md` | Actionable checklist of all fixes to integrate, ordered by priority |
| DEFENSIVE-REPORT | `audit/Defensive_Report/reports/{PROJECT}-DEFENSIVE-REPORT.md` | Main report with executive summary |
| PROTECTION-INVENTORY | `audit/Defensive_Report/reports/{PROJECT}-PROTECTION-INVENTORY.md` | Complete catalog of protections |
| CODE-INTEGRATION | `audit/Defensive_Report/reports/{PROJECT}-CODE-INTEGRATION.md` | Technical integration guide |
| CROSS-VALIDATION | `audit/Defensive_Report/reports/{PROJECT}-CROSS-VALIDATION.md` | Cross-validation results |

### Three Absolute Prohibitions

| Constraint | Description | Consequence of violation |
|------------|-------------|--------------------------|
| NO ABSTRACT RECOMMENDATIONS | Everything must be concrete, integrable code | Defensive code will never be integrated |
| NO INCOMPLETE CODE | Each fix must compile/run and have a test | Unusable code |
| NO FORGOTTEN VULNERABILITIES | Every P2 gap must be addressed or justified | Incomplete coverage |

### Phase Execution Invariant

```
For any Phase N in [0..8]:
  - Input: P{N-1}_*.yaml (except P0)
  - Output: P{N}_*.yaml (PRIMARY) + code/ (if P3-P6) + P{N}-*.md
  - Validation: Count and reference consistency
  - Transition: Move to N+1 only after validation
```

---

## S10 - Phase Isolation

> **INVARIANT** : Each phase is an independent execution unit. FSM transitions follow a strictly sequential order.

### Forbidden Transitions

| Illegal Transition | Reason |
|--------------------|--------|
| Pn -> Pn+2 (skip) | Violates FSM order |
| Pn -> Pn+1 (not validated) | Violates data contract completeness |
| Parallel phase execution | Data dependencies cannot be satisfied |

### FSM State Machine

```
States: {INIT, P0, P1, P2, P3, P4, P5, P6, P7, P8, DONE, ERROR}
Transitions: delta(INIT, start) -> P0
              delta(P0, p0_complete) -> P1
              delta(Pn, pn_complete) -> P(n+1) where n in {1..7}
              delta(P8, p8_complete) -> DONE
Accepting state: {DONE}
```

> **Complete FSM specification** : See WORKFLOW.md S1

---

**End of SKILL.md** (~400 lines, ~8K tokens)
