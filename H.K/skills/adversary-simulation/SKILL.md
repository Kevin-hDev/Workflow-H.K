<!-- Adversary Simulation (Universal) | Version 1.1.0 (20260314) | https://github.com/Kevin-hDev/claude-redteam-vs-blueteam | License: BSD-3-Clause | Inspired by adversary-simulation-rust-react (Kevin-hDev, BSD-3-Clause) -->

---
name: adversary-simulation
description: Use when pentesting, red teaming, vulnerability hunting, or offensive security audit — auto-detects stack and builds exploit chains
---

> **Note** : All relative paths in this skill are relative to `SKILL_PATH` (the folder containing this SKILL.md).

# Adversary Simulation Skill v1.1.0

Automated universal offensive simulation. Claude steps into the role of a hacker to analyze the source code of ANY project, find all exploitable vulnerabilities, build concrete attack scenarios, and chain vulnerabilities into devastating attack chains.

```
+======================================================================================+
|  ADVERSARY SIMULATION v1.1.0 — Universal (any stack, any OS, any framework)         |
|  Think like a hacker, act like an auditor                                            |
|  Auto-detection: stack, OS, frameworks, dependencies → targeted DATA                 |
+======================================================================================+
```

**Skill chain** : This skill is the 2nd in the security chain:
```
Threat Modeling (risk analysis) → **Adversary Simulation** (attack) → Defensive Hardening (defense)
```
If a threat-modeling report already exists in the project, load it in P0 to focus the analysis.

---

## CRITICAL - Data / Reports Separation

> **PRINCIPLE** : Markdown = reports (human), YAML = data (machine). Separation is MANDATORY.

```
+-----------------------------------------------------------------------+
|  DUAL OUTPUT MODEL - Each phase produces TWO files                    |
+-----------------------------------------------------------------------+
|                                                                       |
|  1. DATA FILE (.yaml) - PRIMARY                                       |
|     - Written FIRST                                                   |
|     - Structured, machine-readable                                    |
|     - Used by the NEXT phase as input                                 |
|     - Path: .attacker_working/{SESSION_ID}/data/P{N}_*.yaml          |
|                                                                       |
|  2. REPORT FILE (.md) - SECONDARY                                     |
|     - Written AFTER the data file                                     |
|     - Human-readable, formatted                                       |
|     - For review and documentation                                    |
|     - Path: .attacker_working/{SESSION_ID}/reports/P{N}-*.md         |
|                                                                       |
|  FORBIDDEN: Reading .md files to extract data                         |
|  FORBIDDEN: Embedding YAML data in .md files as SOURCE               |
|  ALLOWED: YAML blocks in .md files for documentation/examples         |
|  MANDATORY: Data circulates via .yaml files only                      |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## S1 - Execution Model

**Mode** : Complete offensive analysis - 7 phases executed sequentially (P0 to P6).

```
Phase 0 ----> Phase 1 ----> Phase 2 ----> Phase 3 ----> Phase 4 ----> Phase 5 ----> Phase 6
   |             |             |             |             |             |             |
   v             v             v             v             v             v             v
P0.yaml ----> P1.yaml ----> P2.yaml ----> P3.yaml ----> P4.yaml ----> P5.yaml ----> P6.yaml
(detect)     (recon)       (flows)       (vulns)       (attacks)     (chains)      (report)
```

**Rules** :
1. Phases execute strictly in order (0 to 6)
2. Each phase reads the YAML from the previous phase, writes its own YAML
3. Each phase also writes a human-readable .md report
4. Validation applies to YAML files, not to .md files
5. Phase 5 = User checkpoint (confirmation before final report)

**Phase transition protocol** :
```
FOR each phase N in [0..6] :
    1. Read  : @phases/P{N}-*.md (phase instructions)
    2. Read  : .attacker_working/{SESSION_ID}/data/P{N-1}_*.yaml (input, except P0)
    3. Load  : relevant offensive DATA (based on P0 detection)
    4. Execute the analysis per phase instructions
    5. Write : .attacker_working/{SESSION_ID}/data/P{N}_*.yaml (PRIMARY output)
    6. Write : .attacker_working/{SESSION_ID}/reports/P{N}-*.md (SECONDARY output)
    7. Validate YAML consistency (counts, IDs, references)
    8. IF valid  : Update session meta, continue to N+1
    9. IF invalid: Fix the YAML and rewrite
```

---

## S2 - Output Convention

### Directory Structure

```
{PROJECT_ROOT}/
  audit/                                           <-- Unified audit folder (auto-created)
    Offensive_Report/                              <-- adversary-simulation output
      correction/
        CORRECTION-PLAN.md                         <-- Actionable checklist
      reports/
        {PROJECT}-OFFENSIVE-REPORT.md              <-- Final report (P6)
        {PROJECT}-VULNERABILITY-INVENTORY.md       <-- Vulnerability catalog
        {PROJECT}-ATTACK-SCENARIOS.md              <-- Attack scenarios
        {PROJECT}-ATTACK-CHAINS.md                 <-- Attack chains
      phases/
        P0-DETECTION.md
        P1-RECONNAISSANCE.md
        P2-CARTOGRAPHIE-FLUX.md
        P3-CHASSE-FAILLES.md
        P4-CONSTRUCTION-ATTAQUES.md
        P5-CHAINES-ATTAQUE.md
      chain/
        adversary_output.yaml                      <-- Chain output for defensive-hardening
      .attacker_working/                           <-- Internal data (unchanged)
        {SESSION_ID}/
          _session_meta.yaml                       <-- Session state
          data/                                    <-- STRUCTURED DATA
            P0_detection.yaml
            P1_reconnaissance.yaml
            P2_data_flows.yaml
            P3_vulnerabilities.yaml
            P4_attack_scenarios.yaml
            P5_attack_chains.yaml
            P6_report_manifest.yaml
          reports/                                 <-- WORKING REPORTS
            (phase reports during execution)
```

### Unified Audit Folder

All three security skills (threat-modeling, adversary-simulation, defensive-hardening) write to the same `audit/` folder at the project root. Each skill creates its own subfolder.

- If `audit/` does not exist, the skill creates it automatically.
- If `audit/` already exists (from a previous skill run), the skill adds its subfolder alongside existing ones.
- Folder names are in **English by default**. Use `--lang=xx` to localize folder names if the user explicitly requests it.

### Deliverables

| Category | Files | Location |
|----------|-------|----------|
| Reports (4) | OFFENSIVE-REPORT, VULNERABILITY-INVENTORY, ATTACK-SCENARIOS, ATTACK-CHAINS | `reports/` |
| Phase reports (6) | P0 to P5 | `phases/` |
| Correction (1) | CORRECTION-PLAN.md | `correction/` |
| Chain output (1) | adversary_output.yaml | `chain/` |

### Naming Convention

- **PROJECT** : Uppercase, max 30 characters, format: `^[A-Z][A-Z0-9-]{0,29}$`
- **Example** : `SKYMIND`, `CHILL-DESK`, `MY-PROJECT`

### SESSION_ID Format

- **SESSION_ID** : `{PROJECT_NAME}_{YYYYMMDD_HHMMSS}`
- **Example** : `CHILL-DESK_20260314_091522`

### Session Metadata

```yaml
# audit/Offensive_Report/.attacker_working/{SESSION_ID}/_session_meta.yaml
schema_version: "1.1.0"
session_id: "CHILL-DESK_20260314_091522"
project_name: "CHILL-DESK"
project_path: "/path/to/project"
started_at: "2026-03-14T09:15:22Z"
language: "en"
skill_version: "1.1.0"
current_state: "P0"
output_root: "audit/Offensive_Report"

# P0 detection (filled after P0)
detected_stack:
  os_targets: []
  languages: []
  frameworks: []
  package_managers: []
  config_files_found: []
  threat_model_found: false
  threat_model_path: null

# Loaded offensive DATA (filled after P0)
loaded_data:
  attack_files: []
  exploit_files: []

phases:
  P0:
    status: "pending"
    started_at: null
    completed_at: null
    data_file: "data/P0_detection.yaml"
    report_file: "reports/P0-DETECTION.md"
  P1:
    status: "pending"
    data_file: "data/P1_reconnaissance.yaml"
    report_file: "reports/P1-RECONNAISSANCE.md"
  P2:
    status: "pending"
    data_file: "data/P2_data_flows.yaml"
    report_file: "reports/P2-CARTOGRAPHIE-FLUX.md"
  P3:
    status: "pending"
    data_file: "data/P3_vulnerabilities.yaml"
    report_file: "reports/P3-CHASSE-FAILLES.md"
  P4:
    status: "pending"
    data_file: "data/P4_attack_scenarios.yaml"
    report_file: "reports/P4-CONSTRUCTION-ATTAQUES.md"
  P5:
    status: "pending"
    data_file: "data/P5_attack_chains.yaml"
    report_file: "reports/P5-CHAINES-ATTAQUE.md"
  P6:
    status: "pending"
    data_file: "data/P6_report_manifest.yaml"
    report_file: "reports/P6-RAPPORT-OFFENSIF.md"
```

---

## S3 - Data Model

### Entity Types

| Entity | ID Format | Phase | Description |
|--------|-----------|-------|-------------|
| Target | TGT-{Seq:03d} | P1 | Identified targets (modules, components, processes) |
| EntryPoint | EP-{Seq:03d} | P1 | Discovered entry points |
| DataFlow | DF-{Seq:03d} | P2 | Traced data flows |
| Secret | SEC-{Seq:03d} | P2 | Identified secrets in transit |
| Vulnerability | VULN-{Seq:03d} | P3 | Discovered vulnerabilities |
| AttackScenario | ATK-{Seq:03d} | P4 | Concrete attack scenarios |
| AttackChain | CHAIN-{Seq:03d} | P5 | Multi-step attack chains |
| Finding | FIND-{Seq:03d} | P6 | Final report conclusions |

### Vulnerability Severity

| Level | CVSS | Description |
|-------|------|-------------|
| CRITICAL | 9.0-10.0 | Total compromise, remote code execution, isolation escape |
| HIGH | 7.0-8.9 | Unauthorized access, sensitive data theft, privilege escalation |
| MEDIUM | 4.0-6.9 | Information leakage, partial bypass, conditional injection |
| LOW | 0.1-3.9 | Theoretical vulnerability, limited impact, high prerequisites |
| INFO | 0.0 | Observation without direct impact, residual misconfiguration |

### Attack Categories (Dynamic — detected in P0)

| Code | Category | Covered vectors |
|------|----------|-----------------|
| IPC | Framework IPC attacks | Tauri IPC, Electron IPC, Flutter platform channels, D-Bus, XPC, COM, named pipes |
| XSS | WebView/XSS attacks | Stored/reflected/DOM XSS, mXSS parsing, post-XSS IPC escalation, CSP bypass, prototype pollution |
| SUBPROCESS | External process injection | Sidecar injection, child_process, subprocess, exec, spawn, command injection via args |
| LLM | Offensive LLM/AI attacks | Direct/indirect prompt injection (XPIA), Policy Puppetry, multi-agent hijacking, jailbreaks, EDR AI bypass |
| SUPPLY | Supply chain attacks | npm/Cargo/PyPI/Go/Maven typosquatting, dependency confusion, build pipeline poisoning, slopsquatting |
| NET | Network/TLS attacks | TLS downgrade, API key leak via redirect, fingerprinting, proxy MITM, CORS misconfiguration |
| CRYPTO | Crypto/storage attacks | Key extraction, memory scraping, nonce reuse, weak KDF, keyring dump |
| PRIVESC | OS privilege escalation | pkexec/polkit chains, UAC bypass, TCC bypass macOS, BYOVD, container escape |
| DECEPTION | Anti-RE and deception | Anti-debugging bypass, code signing bypass, canary detection, obfuscation bypass, sandbox detection |
| COMMS | Communications attacks | Token theft, webhook hijacking, OAuth2 abuse, API key rotation bypass |
| INJECTION | Data injection | SQL injection, NoSQL injection, template injection (SSTI), ORM injection, LDAP injection |
| DESERIALIZATION | Unsafe deserialization | Pickle, JSON.parse gadgets, Java serialization, YAML load, XML XXE |
| SSRF | Server-Side Request Forgery | Classic SSRF, blind SSRF, DNS rebinding, cloud metadata |
| AUTH_BYPASS | Authentication bypass | JWT manipulation, session fixation, OAuth2 flow hijack, IDOR, broken access control |

### Count Conservation (P3 -> P4 -> P5)

```
P3.vulnerability_count = P4.scenarios_mapped + P4.not_exploitable
P4.exploitable_count = sum(P5.chains[].steps containing ATK-xxx)
```

All vulnerabilities from P3 must be accounted for in P4 (no loss).

---

## S4 - Offensive Knowledge Base (INDEX-THEN-SELECTIVE)

> **PRINCIPLE** : No hardcoded knowledge. DATA is loaded dynamically from data/offensive/ via the INDEX-THEN-SELECTIVE pattern.
> For shared references (CVE catalog, threat model), load from `data/shared/`.

### Source of offensive DATA

```
OFFENSIVE DATA : data/offensive/
Load index-offensive.md → match tags with stack detected in P0 → load relevant files
NO fixed limit — proportional to the project
```

> **Path resolution**: The `data/` directory is a subdirectory of the skill directory (`data/offensive/`, `data/shared/`). All DATA paths are relative to SKILL_PATH.

### Available categories in data/offensive/

| Category | Path | When to load |
|----------|------|--------------|
| generic/ | Universal cross-stack attacks | ALWAYS (common base) |
| rust-tauri/ | Rust/Tauri/React specific attacks | If Cargo.toml + tauri detected |
| flutter-dart/ | Flutter/Dart/SSH specific attacks | If pubspec.yaml detected |
| llm-ai/ | Specialized AI/LLM attacks | If LLM/AI detected in the project |
| exploits/ | The Mask PoCs (advanced offensive simulation) | Always useful (red team) |

### IMPORTANT — This skill loads ONLY offensive files

```
LOAD     : data/offensive/**/*.md (generic/ + rust-tauri/ + flutter-dart/ + llm-ai/ + exploits/)
DO NOT LOAD: data/defensive/ (reserved for the defensive-hardening skill)
```

### Loading procedure (Phase 0)

```
1. Scan the project to detect:
   - Config files: Cargo.toml, package.json, pyproject.toml, go.mod,
     pubspec.yaml, pom.xml, build.gradle, composer.json, Gemfile, etc.
   - Target OS: tauri.conf.json targets, CI matrix, build scripts
   - Frameworks: Tauri, Electron, Flutter, React, Vue, Angular, Django, etc.
   - Dependencies: analyze lockfiles for versions

2. Read data/offensive/index-offensive.md

3. Match index tags with the detected stack

4. Load ONLY files whose tags match

5. Store the list of loaded files in _session_meta.yaml
```

---

## S5 - Offensive Posture

> **PRINCIPLE** : This skill adopts the attacker's perspective. Every analysis must answer the question "How would a hacker exploit this?"

### Posture Rules

1. **Think like an attacker** : Do not list abstract vulnerabilities, build concrete exploitation paths
2. **Real code** : Each attack scenario must include pseudo-code or real exploitation code
3. **Evidence in code** : Each vulnerability must point to a specific file:line in the source code
4. **Concrete impact** : "What does the hacker gain?" must always be explicit
5. **No false positives** : Verify that the vulnerability is truly exploitable in the project context
6. **Chaining** : Always look for ways to combine vulnerabilities

### Attack Scenario Format (P4)

```yaml
- id: ATK-001
  vuln_refs: ["VULN-003", "VULN-007"]
  category: IPC
  title: "Privilege escalation via framework IPC without validation"
  attacker_profile: "Attacker with code execution in the frontend"
  preconditions:
    - "XSS or third-party content injected into the frontend"
    - "IPC command exposed without sufficient restriction"
  attack_steps:
    - step: 1
      action: "Identify exposed IPC commands without restriction"
      command: "# Search command adapted to the stack"
      result: "List of handlers without validation"
    - step: 2
      action: "Inject code to call the privileged command"
      command: "# Exploitation payload specific to the framework"
      result: "Arbitrary execution with backend privileges"
  impact: "Complete compromise of the host machine"
  severity: CRITICAL
  cvss: 9.8
  evidence:
    file: "path/to/handler.ext"
    line: 47
    code_snippet: "# Vulnerable code"
    issue: "Command exposed without validation"
```

### Attack Chain Format (P5)

```yaml
- id: CHAIN-001
  title: "From XSS to root execution via IPC and privilege escalation"
  complexity: HIGH
  attacker_profile: "Attacker capable of injecting content into the frontend"
  steps:
    - order: 1
      attack_ref: ATK-008
      description: "XSS injection into the frontend via unescaped payload"
    - order: 2
      attack_ref: ATK-001
      description: "IPC call from XSS context to access the backend"
    - order: 3
      attack_ref: ATK-015
      description: "Exploitation of the polkit/UAC chain for privilege elevation"
  total_impact: "Root access, data theft, persistence"
  total_severity: CRITICAL
  kill_chain_mapping:
    reconnaissance: "Frontend analysis, identifying unprotected surfaces"
    weaponization: "Building the XSS payload + IPC script"
    delivery: "Injection via third-party content loaded in the interface"
    exploitation: "Unauthorized IPC call, backend execution"
    installation: "Persistence via OS mechanism"
    command_and_control: "Exfiltration via compromised channel"
    actions_on_objectives: "Secrets, data, and token theft"
```

---

## S6 - Progressive Context Loading (INDEX-THEN-SELECTIVE)

This skill uses progressive loading adapted to the INDEX-THEN-SELECTIVE pattern:

### Per phase

| Phase | DATA to load |
|-------|-------------|
| P0 | `data/offensive/index-offensive.md` (stack detection + file selection) |
| P1 | Relevant DATA loaded based on P0 detection (matched attacks) |
| P2 | No additional knowledge (pure code analysis) |
| P3 | Reload specific DATA if new surfaces discovered in P1-P2 |
| P4 | Reload specific DATA if new surfaces discovered |
| P5 | `data/offensive/generic/atk-chain-patterns.md` (multi-step chain patterns) |
| P6 | `data/offensive/*/atk-cve-reference.md` + `data/shared/references/ref-cve-catalog.md` |

### Loading pattern

```
Session start:
  1. Load SKILL.md (global rules)
  2. Load WORKFLOW.md (orchestration)
  3. Create 7 tasks in TaskCreate (P0-P6)

Phase 0 (Detection):
  1. Scan project config files
  2. Read data/offensive/index-offensive.md
  3. Match tags with detected stack
  4. Load relevant attacks/ + exploits/ files
  5. Write P0_detection.yaml + P0-DETECTION.md

Per phase (P1-P6):
  1. Read @phases/P{N}-*.md
  2. Load relevant DATA (if not already loaded)
  3. Execute phase instructions
  4. Write YAML then MD in .attacker_working/{SESSION_ID}/
```

### Files loaded per component

```
1. Always loaded: This file (SKILL.md) — ~8K tokens
2. At startup: @WORKFLOW.md — ~5K tokens
3. Per phase: @phases/P{N}-*.md — ~2-3K tokens each
4. On demand: data/offensive/ — based on detection
```

---

## S7 - Reference Files

| Path | Purpose |
|------|---------|
| @WORKFLOW.md | Orchestration, phase contracts, FSM state machine |
| @phases/P0-DETECTION.md | Phase 0 instructions (Stack detection) |
| @phases/P1-RECONNAISSANCE.md | Phase 1 instructions |
| @phases/P2-CARTOGRAPHIE-FLUX.md | Phase 2 instructions |
| @phases/P3-CHASSE-FAILLES.md | Phase 3 instructions |
| @phases/P4-CONSTRUCTION-ATTAQUES.md | Phase 4 instructions |
| @phases/P5-CHAINES-ATTAQUE.md | Phase 5 instructions |
| @phases/P6-RAPPORT-OFFENSIF.md | Phase 6 instructions |
| data/offensive/index-offensive.md | Offensive DATA index (selective loading) |

---

## S8 - Quick Start

```bash
# 1. Launch an offensive simulation on any project
/adversary-simulation @my-project

# 2. Session execution:
#    - Claude loads SKILL.md + WORKFLOW.md automatically
#    - P0 detects the stack and loads relevant DATA
#    - For each phase N (0-6): Read -> Execute -> Write -> Validate
#    - Generate final reports in audit/Offensive_Report/
```

---

## S9 - Execution Constraints (Invariants)

> **PRINCIPLE** : The quality of the offensive simulation depends on execution rigor. The following constraints are INVIOLABLE.

### Three Absolute Prohibitions

| Constraint | Description | Consequence of violation |
|------------|-------------|--------------------------|
| NO FICTITIOUS DATA | All analysis based on real evidence in the code | Invalid analysis results |
| NO SIMPLIFIED IMPLEMENTATIONS | Each phase executed in full | Incomplete coverage |
| NO PROBLEM WORKAROUNDS | Diagnose the root cause when blocked | Broken data chain |

### Phase Execution Invariant

```
For any Phase N in [0..6]:
  - Input : P{N-1}_*.yaml (except P0)
  - Output: P{N}_*.yaml (PRIMARY) + P{N}-*.md (SECONDARY)
  - Validation: Count and reference consistency
  - Transition: Move to N+1 only after validation
```

---

## S10 - Phase Isolation

> **INVARIANT** : Each phase is an independent execution unit. FSM transitions follow strictly sequential order.

### Forbidden Transitions

| Illegal Transition | Reason |
|--------------------|--------|
| Pn -> Pn+2 (skip) | Violates FSM order |
| Pn -> Pn+1 (invalid) | Violates data contract completeness |
| Parallel phase execution | Data dependencies cannot be satisfied |

### FSM State Machine

```
States : {INIT, P0, P1, P2, P3, P4, P5, P6, DONE, ERROR}
Transitions : delta(INIT, start) -> P0
              delta(P0, p0_complete) -> P1
              delta(Pn, pn_complete) -> P(n+1) for n in {1..5}
              delta(P6, p6_complete) -> DONE
Accepting state: {DONE}
```

> **Complete FSM specification** : See WORKFLOW.md S1

---

## S11 - Chain Output

### adversary_output.yaml

After P6 completes, produce `adversary_output.yaml` in `audit/Offensive_Report/chain/`. This file is consumed by defensive-hardening's P0 and P7 phases.

```yaml
# adversary_output.yaml — Chain output for defensive-hardening
schema_version: "1.1.0"
source_skill: "adversary-simulation"
generated_at: "ISO8601"

project_name: "PROJECT-NAME"
project_path: "/path/to/project"
detected_stack:
  os_targets: []
  languages: []
  frameworks: []

vulnerabilities:
  - id: "VULN-001"
    title: "Vulnerability title"
    category: "IPC|XSS|PRIVESC|..."
    severity: "CRITICAL|HIGH|MEDIUM|LOW"
    cvss: 9.2
    file: "path/to/file.ext"
    line: 42
    code_snippet: "vulnerable code"
    exploit_technique: "How to exploit"
    new_finding: true

attack_scenarios:
  - id: "ATK-001"
    title: "Attack scenario title"
    vuln_refs: ["VULN-001", "VULN-003"]
    severity: "CRITICAL|HIGH|MEDIUM"
    steps_count: 4

attack_chains:
  - id: "CHAIN-001"
    title: "Chain title"
    attack_refs: ["ATK-001", "ATK-003"]
    total_severity: "CRITICAL"
    complexity: "LOW|MEDIUM|HIGH"
    kill_chain_phases: ["reconnaissance", "weaponization", "delivery", "exploitation"]

recommended_defenses:
  - vulnerability: "VULN-001"
    priority: "P0|P1|P2|P3"
    suggested_fix: "Description of fix"
    category: "RUNTIME|FW|IPC|CRYPTO|NET|..."

risk_ratings:
  total_vulnerabilities: 0
  by_severity:
    critical: 0
    high: 0
    medium: 0
    low: 0
  total_chains: 0
  most_critical_chain: "CHAIN-001"
```

---

**End of SKILL.md** (~500 lines, ~10K tokens)
