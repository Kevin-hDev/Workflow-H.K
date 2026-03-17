# WORKFLOW.md - Orchestration Contracts

**Version** : 1.1.0
**Purpose** : Phase orchestration, structured data contracts, validation gates, FSM execution

> **Cross-references** :
> - Global constraints and data model: See SKILL.md
> - Per-phase instructions: See @phases/P{N}-*.md

---

## S1 - State Machine (FSM)

### 7-Phase FSM Definition (P0-P6)

```
+-----------------------------------------------------------------------+
|                    ADVERSARY SIMULATION FSM (UNIVERSAL)               |
+-----------------------------------------------------------------------+
|                                                                       |
|  States: {INIT, P0, P1, P2, P3, P4, P5, P6, DONE, ERROR}            |
|                                                                       |
|  Transitions:                                                         |
|    delta(INIT, start) -> P0                                           |
|    delta(P0, p0_complete) -> P1                                       |
|    delta(Pn, pn_complete) -> P(n+1)  for n in {1..5}                 |
|    delta(P6, p6_complete) -> DONE                                     |
|    delta(Pn, validation_fail) -> ERROR                                |
|    delta(ERROR, recovery_success) -> Pn  (rollback)                   |
|                                                                       |
|  Accepting state: {DONE}                                              |
|                                                                       |
+-----------------------------------------------------------------------+
```

### Transition Diagram

```
INIT --start--> P0 --p0_ok--> P1 --p1_ok--> P2 --p2_ok--> P3 --p3_ok--> P4 --p4_ok--> P5 --p5_ok--> P6 --p6_ok--> DONE
                 |              |              |              |              |              |              |
                 +--fail------->+--------------+--------------+--------------+--------------+--------------+
                                v
                              ERROR --recovery--> (rollback to last valid Pn)
```

### Internal 4-Gate Sub-FSM per Phase

Each Phase Pn follows internally:

```
ENTRY --[check]--> REFLECTION --> PLANNING --> EXECUTION <--loop--> VALIDATION --> EXIT
  |                                                                               |
  +--[check failed]---------------------------------------------------------------+
                                                                   (emit pn_complete)
```

---

## S1.1 - Data Flow Architecture

> **Principle** : YAML = data (machine), Markdown = report (human). Strict separation.

```
DATA CHAIN (strict, no gaps):
  P0 -> writes P0_detection.yaml          -> P1 reads it
  P1 -> writes P1_reconnaissance.yaml     -> P2 reads it
  P2 -> writes P2_data_flows.yaml         -> P3 reads it
  P3 -> writes P3_vulnerabilities.yaml    -> P4 reads it
  P4 -> writes P4_attack_scenarios.yaml   -> P5 reads it
  P5 -> writes P5_attack_chains.yaml      -> P6 reads it

  FORBIDDEN: P{N+1} reads the .md report from P{N} to extract data
  MANDATORY: P{N+1} reads the .yaml file from P{N} directly
```

---

## S1.2 - Session Initialization

### SESSION_ID Generation

```
SESSION_ID = {PROJECT_NAME}_{YYYYMMDD_HHMMSS}
Example: CHILL-DESK_20260314_143022
```

### Directory Creation

```bash
SESSION_ID="${PROJECT_NAME}_$(date +%Y%m%d_%H%M%S)"
mkdir -p "audit/Offensive_Report/.attacker_working/${SESSION_ID}/data"
mkdir -p "audit/Offensive_Report/.attacker_working/${SESSION_ID}/reports"
mkdir -p "audit/Offensive_Report/reports"
mkdir -p "audit/Offensive_Report/phases"
mkdir -p "audit/Offensive_Report/correction"
mkdir -p "audit/Offensive_Report/chain"
```

### Session Metadata Schema

```yaml
# audit/Offensive_Report/.attacker_working/{SESSION_ID}/_session_meta.yaml
schema_version: "1.1.0"
session_id: "{PROJECT}_{YYYYMMDD_HHMMSS}"
project_name: "PROJECT-NAME"
project_path: "/absolute/path"
started_at: "ISO8601"
language: "en"
skill_version: "1.1.0"
current_state: "P0"

detected_stack:
  os_targets: []
  languages: []
  frameworks: []
  package_managers: []
  config_files_found: []
  threat_model_found: false
  threat_model_path: null

loaded_data:
  attack_files: []
  exploit_files: []

phases:
  P{N}:
    status: "pending|in_progress|completed|failed"
    started_at: null
    completed_at: null
    data_file: "data/P{N}_*.yaml"
    report_file: "reports/P{N}-*.md"
    entity_counts:
      created: 0
      from_previous: 0
```

### Task Creation at Startup

Create 7 tasks at session startup:

```
Phase 0: Detection - Scan the project, detect stack/OS/frameworks, load relevant DATA
Phase 1: Reconnaissance - Identify attack surfaces and entry points
Phase 2: Flow mapping - Trace data flows and identify secrets in transit
Phase 3: Vulnerability hunting - Analyze code line by line to find vulnerabilities
Phase 4: Attack construction - Build an attack scenario for each vulnerability
Phase 5: Attack chains - Combine vulnerabilities into cross-component multi-step chains
Phase 6: Offensive report - Produce the final report with all evidence
```

---

## S2 - Phase Execution Protocol

### Execution Algorithm

```
FOR each phase N in [0..6]:
  1. PRECONDITION: current_state == P{N-1}.completed (except P0)
  2. Read @phases/P{N}-*.md (instructions)
  3. Load relevant DATA (per P0 detection and table S5)
  4. Execute the 4-gate sub-FSM:
     ENTRY -> REFLECTION -> PLANNING -> EXECUTION -> VALIDATION -> EXIT
  5. Write: data/P{N}_*.yaml (PRIMARY)
  6. Write: reports/P{N}-*.md (SECONDARY)
  7. Validate YAML consistency
  8. IF valid  : delta(P{N}, p{n}_complete) -> P{N+1}
  9. IF invalid: delta(P{N}, validation_fail) -> ERROR, fix and retry
```

### Checkpoint Phase (User Confirmation Required)

| Phase | Checkpoint | Purpose |
|-------|------------|---------|
| P5 | After chain construction | User confirms attack chains before final report |

---

## S3 - Per-Phase Data Contracts (YAML Files)

### Contract Summary

| Phase | File | Key fields | Validation |
|-------|------|------------|------------|
| P0 | `P0_detection.yaml` | detected_stack, config_files, threat_model, loaded_data | languages > 0, config_files > 0 |
| P1 | `P1_reconnaissance.yaml` | target_inventory, entry_points, tech_stack, attack_surface | targets > 0, entry_points > 0 |
| P2 | `P2_data_flows.yaml` | data_flows[], secrets_in_transit[], trust_boundaries[] | flows > 0, all secrets traced |
| P3 | `P3_vulnerabilities.yaml` | vulnerabilities[], summary (by_category, by_severity) | vulns > 0, all with evidence |
| P4 | `P4_attack_scenarios.yaml` | scenarios[], vuln_coverage | all VULN mapped to ATK or marked not_exploitable |
| P5 | `P5_attack_chains.yaml` | chains[], impact_matrix | chains > 0, all ATK referenced |
| P6 | `P6_report_manifest.yaml` | generated_reports[], statistics, executive_summary | all reports generated |

### Common Header (All Phases)

```yaml
schema_version: "1.1.0"
phase: {N}
generated_at: "ISO8601"
input_ref: "P{N-1}_*.yaml"  # Traceability (except P0)
```

### P0 - Detection Contract

```yaml
schema_version: "1.1.0"
phase: 0
generated_at: "ISO8601"

detected_stack:
  os_targets: ["linux", "windows", "macos"]
  languages: ["rust", "typescript"]
  frameworks: ["tauri_v2", "react"]
  package_managers: ["cargo", "npm"]
  config_files_found:
    - file: "Cargo.toml"
      path: "src-tauri/Cargo.toml"
      stack_signal: "rust"
    - file: "package.json"
      path: "package.json"
      stack_signal: "javascript/typescript"
    - file: "tauri.conf.json"
      path: "src-tauri/tauri.conf.json"
      stack_signal: "tauri_v2"
  key_dependencies:
    - name: "tauri"
      version: "^2.x"
      source: "Cargo.toml"
      attack_relevance: "CRITICAL"
    - name: "react"
      version: "^19.x"
      source: "package.json"
      attack_relevance: "HIGH"

threat_model:
  found: false
  path: null
  risk_priorities: []

loaded_data:
  from_index: "data/offensive/index-offensive.md"
  attack_files:
    - path: "attacks/generic/atk-injection-input.md"
      tags_matched: ["sql-injection", "xss", "input"]
      reason: "Stack includes frontend + backend"
    - path: "attacks/rust-tauri/atk-tauri-ipc-attacks.md"
      tags_matched: ["tauri", "ipc", "rce"]
      reason: "Tauri v2 detected in Cargo.toml"
  exploit_files:
    - path: "exploits/atk-exploit-desktop.md"
      tags_matched: ["desktop", "tauri"]
      reason: "Desktop application detected"

attack_categories_active:
  - code: IPC
    reason: "Tauri IPC detected"
    data_files: ["attacks/rust-tauri/atk-tauri-ipc-attacks.md"]
  - code: XSS
    reason: "React WebView detected"
    data_files: ["attacks/rust-tauri/atk-webview-xss-attacks.md"]
  - code: SUPPLY
    reason: "npm + Cargo detected"
    data_files: ["attacks/generic/atk-supply-chain.md"]
```

### P1 - Reconnaissance Contract

```yaml
schema_version: "1.1.0"
phase: 1
generated_at: "ISO8601"
input_ref: "P0_detection.yaml"

project_context:
  name: "PROJECT-NAME"
  type: "application_type"
  tech_stack:
    languages: []    # from P0
    frameworks: []   # from P0
    runtime: ""
    key_dependencies:
      - name: "dep_name"
        version: "^x.y.z"
        security_notes: "Known security notes"
        attack_relevance: "CRITICAL|HIGH|MEDIUM|LOW"

target_inventory:
  - id: TGT-001
    name: "Component name"
    type: "process|webview|subprocess|ipc_channel|storage|network_service|credential_store"
    files: ["path/to/files"]
    security_level: "critical|high|medium|low"
    attack_categories: ["IPC", "XSS"]  # dynamic from P0

entry_points:
  - id: EP-001
    type: "entry_type"
    location: "path/to/code"
    protocol: "protocol_used"
    authentication: "auth_mechanism"
    exposure: "exposure_level"
    attack_notes: "Offensive notes"

attack_surface:
  network:
    protocols: []
    external_apis: []
  storage:
    sensitive_stores: []
  crypto:
    libraries: []
  platform:
    targets: []     # from P0.detected_stack.os_targets
    ipc: []
    elevation: []
  ai_surface:       # if LLM detected in P0
    llm_apis: []
    attack_vectors: []
```

### P2 - Flow Mapping Contract

```yaml
schema_version: "1.1.0"
phase: 2
generated_at: "ISO8601"
input_ref: "P1_reconnaissance.yaml"

data_flows:
  - id: DF-001
    name: "Flow description"
    source: "source_component"
    destination: "destination_component"
    data_type: "type_of_data"
    classification: "SECRET|UNTRUSTED|INTERNAL|PUBLIC"
    encryption_in_transit: true|false
    encryption_at_rest: true|false
    path:
      - "Flow step 1"
      - "Flow step 2"
    potential_vulnerabilities:
      - "Risk description"

secrets_in_transit:
  - id: SEC-001
    type: "secret_type"
    flow_ref: "DF-xxx"
    exposure_points:
      - location: "where_in_system"
        duration: "exposure_duration"
        protection: "current_protection"

trust_boundaries:
  - id: TB-001
    name: "Trust boundary"
    crossing_flows: ["DF-xxx"]
    trust_level_change: "from -> to"
    control: "current_control"
    weakness: "identified_weakness"
```

### P3 - Vulnerability Hunting Contract

```yaml
schema_version: "1.1.0"
phase: 3
generated_at: "ISO8601"
input_ref: "P2_data_flows.yaml"

vulnerabilities:
  - id: VULN-001
    title: "Vulnerability description"
    category: "CATEGORY_CODE"  # dynamic from P0.attack_categories_active
    severity: "CRITICAL|HIGH|MEDIUM|LOW|INFO"
    cvss: 9.8
    cwe: "CWE-xxx"
    description: >
      Detailed description of the vulnerability.
    evidence:
      file: "path/to/file.ext"
      line: 47
      code: "# Vulnerable code"
      issue: "Explanation of the problem"
    flow_refs: ["DF-xxx"]
    secret_refs: ["SEC-xxx"]
    exploitability:
      access_required: "access_level"
      complexity: "low|medium|high"
      user_interaction: "none|required"
    knowledge_ref: "data-source-file.md#section"

summary:
  total: 28
  by_severity:
    CRITICAL: 4
    HIGH: 9
    MEDIUM: 10
    LOW: 4
    INFO: 1
  by_category: {}  # dynamic per active categories
```

### P4 - Attack Construction Contract

```yaml
schema_version: "1.1.0"
phase: 4
generated_at: "ISO8601"
input_ref: "P3_vulnerabilities.yaml"

scenarios:
  - id: ATK-001
    vuln_refs: ["VULN-xxx"]
    category: "CATEGORY_CODE"
    title: "Scenario title"
    attacker_profile: "Attacker profile description"
    preconditions:
      - "Prerequisite 1"
    attack_steps:
      - step: 1
        action: "Action description"
        command: "# Concrete command"
        result: "Expected result"
    impact: "Impact on the system"
    severity: "CRITICAL|HIGH|MEDIUM|LOW"
    cvss: 9.8
    evidence:
      file: "path/to/file.ext"
      line: 47

vuln_coverage:
  total_vulns: 28       # == P3.summary.total
  mapped_to_scenario: 23
  not_exploitable: 5
  not_exploitable_reasons:
    - vuln_ref: "VULN-xxx"
      reason: "Explanation"
```

### P5 - Attack Chain Contract

```yaml
schema_version: "1.1.0"
phase: 5
generated_at: "ISO8601"
input_ref: "P4_attack_scenarios.yaml"

chains:
  - id: CHAIN-001
    title: "Chain title"
    complexity: "HIGH|MEDIUM|LOW"
    attacker_profile: "Attacker profile description"
    steps:
      - order: 1
        attack_ref: "ATK-xxx"
        description: "Step description"
    total_impact: "Overall impact"
    total_severity: "CRITICAL|HIGH|MEDIUM"
    kill_chain:
      reconnaissance: "Recon phase"
      weaponization: "Weaponization phase"
      delivery: "Delivery phase"
      exploitation: "Exploitation phase"
      installation: "Installation phase"
      command_and_control: "C2 phase"
      actions_on_objectives: "Final phase"

impact_matrix:
  chains_by_severity:
    CRITICAL: 0
    HIGH: 0
    MEDIUM: 0
  chains_by_entry_point: {}
  scenarios_in_chains: 0
  scenarios_standalone: 0
```

### P6 - Offensive Report Contract

```yaml
schema_version: "1.1.0"
phase: 6
generated_at: "ISO8601"
input_ref: "P5_attack_chains.yaml"

executive_summary:
  project: "{PROJECT_NAME}"
  detected_stack: []       # from P0
  total_vulnerabilities: 0
  total_scenarios: 0
  total_chains: 0
  risk_level: "CRITICAL|HIGH|MEDIUM|LOW"
  top_3_risks:
    - "Risk 1 (CHAIN-xxx)"
    - "Risk 2 (VULN-xxx)"
    - "Risk 3 (VULN-xxx)"

generated_reports:
  - file: "reports/{PROJECT}-OFFENSIVE-REPORT.md"
    type: "main_report"
    content: "Executive summary + all analyses"
  - file: "reports/{PROJECT}-VULNERABILITY-INVENTORY.md"
    type: "catalog"
    content: "All vulnerabilities sorted by severity"
  - file: "reports/{PROJECT}-ATTACK-SCENARIOS.md"
    type: "scenarios"
    content: "All concrete attack scenarios with commands"
  - file: "reports/{PROJECT}-ATTACK-CHAINS.md"
    type: "chains"
    content: "All cross-component multi-step chains"
  - file: "correction/CORRECTION-PLAN.md"
    type: "correction_plan"
    content: "Actionable checklist of fixes prioritized by impact"
  - file: "chain/adversary_output.yaml"
    type: "chain_output"
    content: "Structured output for defensive-hardening skill"

statistics:
  phases_completed: 7
  total_entities:
    targets: 0
    entry_points: 0
    data_flows: 0
    secrets: 0
    vulnerabilities: 0
    scenarios: 0
    chains: 0
  coverage:
    vulns_with_evidence: "100%"
    vulns_with_scenario: "0%"
    scenarios_in_chains: "0%"
```

---

## S4 - Validation Gates

### Actions on Result

| Result | Meaning | Action |
|--------|---------|--------|
| VALID | Data consistent | Move to next phase |
| WRONG_COUNT | Missing or extra entities | Fix the YAML and revalidate |
| BROKEN_REFERENCES | Referenced IDs not found | Fix references and revalidate |

### Validation per Phase

| Phase | Required file | Validation criteria |
|-------|--------------|---------------------|
| 0 | P0_detection.yaml | languages > 0 + config_files_found > 0 + loaded_data.attack_files > 0 |
| 1 | P1_reconnaissance.yaml | target_inventory not empty + entry_points not empty + attack_surface present |
| 2 | P2_data_flows.yaml | data_flows not empty + all secrets traced + trust_boundaries not empty |
| 3 | P3_vulnerabilities.yaml | vulnerabilities not empty + all with evidence (file:line) + summary.total == len(vulnerabilities) |
| 4 | P4_attack_scenarios.yaml | vuln_coverage.total_vulns == P3.summary.total + all VULN mapped or marked not_exploitable |
| 5 | P5_attack_chains.yaml | chains not empty + all ATK references exist in P4 |
| 6 | P6_report_manifest.yaml | all reports generated + consistent statistics |

### Count Conservation (CRITICAL)

```
P3.summary.total == P4.vuln_coverage.mapped_to_scenario + P4.vuln_coverage.not_exploitable

All vulnerabilities from P3 must be accounted for in P4.
No vulnerability can disappear between phases.
```

---

## S5 - Dynamic Attack Categories and DATA Coverage

> **PRINCIPLE** : Categories are NOT hardcoded. They are detected in P0 and DATA is loaded from data/offensive/ via INDEX-THEN-SELECTIVE.

### DATA loading table per phase

| Phase | DATA to load |
|-------|-------------|
| P0 | `data/offensive/index-offensive.md` only |
| P1 | data/offensive/ files matching the detected stack (loaded in P0) |
| P2 | None (pure code analysis) |
| P3 | Reload specific DATA if new surfaces discovered in P1-P2 |
| P4 | Same as P3 + relevant `data/offensive/*/atk-cve-reference.md` |
| P5 | `data/offensive/generic/atk-chain-patterns.md` (multi-step chain patterns) |
| P6 | `data/shared/references/ref-cve-catalog.md` (for the final report) |

### Detected stack -> offensive DATA mapping

| Detected stack | Tags to match in index-offensive.md | Typical files |
|----------------|-------------------------------------|---------------|
| Rust + Tauri | rust-tauri, tauri, ipc, webview | data/offensive/rust-tauri/*.md |
| Flutter + Dart | flutter, dart, mobile, platform-channels | data/offensive/flutter-dart/*.md |
| React / Vue / Angular | xss, csp, frontend, spa | data/offensive/generic/atk-injection-input.md |
| Python backend | python, django, flask, pickle | data/offensive/generic/atk-command-injection.md |
| Node.js / TypeScript | javascript, nodejs, prototype-pollution | data/offensive/generic/atk-*.md |
| LLM / AI | llm, prompt-injection, agentic-ai | data/offensive/llm-ai/*.md, data/offensive/generic/atk-llm-*.md |

---

## S6 - Error Recovery

### Validation Failure

1. Read the validation error message
2. Identify missing/invalid fields in the YAML
3. Fix the YAML file
4. Re-run the validation
5. Only then update the report

### Session Interruption

1. Check `audit/Offensive_Report/.attacker_working/{SESSION_ID}/_session_meta.yaml`
2. Find the last phase with `status: "completed"`
3. Load the YAML file for that phase from `data/`
4. Resume at the next phase

---

## S7 - Final Report Output

### Report Summary

| Category | Files | Location | Source |
|----------|-------|----------|--------|
| Main (1) | OFFENSIVE-REPORT | `reports/` | P6 YAML (synthesis of everything) |
| Catalogs (3) | VULNERABILITY-INVENTORY, ATTACK-SCENARIOS, ATTACK-CHAINS | `reports/` | P3-P5 YAML |
| Phases (6) | P0-P5-*.md | `phases/` | Each phase execution |
| Correction (1) | CORRECTION-PLAN.md | `correction/` | P6 synthesis |
| Chain output (1) | adversary_output.yaml | `chain/` | P6 bridge to defensive-hardening |

### Final Report Structure

The main report `{PROJECT}-OFFENSIVE-REPORT.md` contains:

1. **Executive summary** : 1-page summary for decision makers
2. **Detected stack** : Languages, frameworks, OS, critical dependencies (P0)
3. **Attack surface** : Complete map of entry points (P1)
4. **Critical data flows** : Where secrets transit (P2)
5. **Vulnerability inventory** : Ranked by severity with evidence (P3)
6. **Attack scenarios** : How to exploit each vulnerability with concrete commands (P4)
7. **Attack chains** : Cross-component multi-step combinations (P5)
8. **Risk matrix** : Impact/probability overview by category
9. **Recommendations** : Prioritized fixes

---

**End of WORKFLOW.md** (~470 lines, ~7K tokens)
