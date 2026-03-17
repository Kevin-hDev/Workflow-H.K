# WORKFLOW.md - Orchestration Contracts

**Version** : 1.1.0
**Purpose** : Orchestration of the 9 phases (P0-P8), structured data contracts, validation gates, FSM execution

> **Cross-references** :
> - Global constraints and data model: See SKILL.md
> - Phase instructions: See @phases/P{N}-*.md

---

## S1 - State Machine (FSM)

### 9-Phase FSM Definition (P0-P8)

```
+-----------------------------------------------------------------------+
|              DEFENSIVE HARDENING FSM (UNIVERSAL)                      |
+-----------------------------------------------------------------------+
|                                                                       |
|  States: {INIT, P0, P1, P2, P3, P4, P5, P6, P7, P8, DONE, ERROR}   |
|                                                                       |
|  Transitions:                                                         |
|    delta(INIT, start) -> P0                                           |
|    delta(P0, p0_complete) -> P1                                       |
|    delta(Pn, pn_complete) -> P(n+1)  where n in {1..7}               |
|    delta(P8, p8_complete) -> DONE                                     |
|    delta(Pn, validation_fail) -> ERROR                                |
|    delta(ERROR, recovery_success) -> Pn  (rollback)                   |
|                                                                       |
|  Accepting state: {DONE}                                              |
|                                                                       |
+-----------------------------------------------------------------------+
```

### Transition Diagram

```
INIT --start--> P0 --p0_ok--> P1 --p1_ok--> P2 --p2_ok--> P3 --p3_ok--> P4 --p4_ok--> P5 --p5_ok--> P6 --p6_ok--> P7 --p7_ok--> P8 --p8_ok--> DONE
                 |              |              |              |              |              |              |              |              |
                 +--fail------->+--------------+--------------+--------------+--------------+--------------+--------------+--------------+
                                v
                              ERROR --recovery--> (rollback to last valid Pn)
```

### Internal 4-Gate Sub-FSM per Phase

Each Phase Pn follows internally:

```
ENTRY --[verification]--> REFLECTION --> PLANNING --> EXECUTION <--loop--> VALIDATION --> EXIT
  |                                                                                         |
  +--[verification fail]--------------------------------------------------------------------+
                                                                           (emit pn_complete)
```

---

## S1.1 - Data Flow Architecture

> **Principle** : YAML = data (machine), Markdown = report (human). Strict separation.

```
DATA CHAIN (strict, no gaps):
  P0 -> writes P0_detection.yaml              -> P1 reads it
  P1 -> writes P1_audit.yaml                  -> P2 reads it
  P2 -> writes P2_reinforcement_points.yaml   -> P3 reads it
  P3 -> writes P3_code_hardening.yaml         -> P4 reads it
  P4 -> writes P4_framework_hardening.yaml    -> P5 reads it
  P5 -> writes P5_network_crypto_hardening.yaml -> P6 reads it
  P6 -> writes P6_deception_traps.yaml        -> P7 reads it
  P7 -> writes P7_cross_validation.yaml       -> P8 reads it

  FORBIDDEN: Reading .md files to extract data
  MANDATORY: Data flows only via .yaml files
```

### Code Flow (P3-P6)

```
CODE CHAIN:
  P3 -> writes code/code_hardening/*            (main detected language)
  P4 -> writes code/framework_hardening/*       (detected framework + IPC)
  P5 -> writes code/network_crypto_hardening/*  (detected network/crypto)
  P6 -> writes code/deception_traps/*           (detected deception/LLM)

  Code is SELF-CONTAINED: each file is complete and integrable
  Code files are NOT inputs for subsequent phases
```

---

## S1.2 - Session Initialization

### SESSION_ID Generation

```
SESSION_ID = {PROJECT_NAME}_{YYYYMMDD_HHMMSS}
Example: CHILL-DESK_20260314_160000
```

### Directory Creation

```bash
SESSION_ID="${PROJECT_NAME}_$(date +%Y%m%d_%H%M%S)"
mkdir -p "audit/Defensive_Report/.defender_working/${SESSION_ID}/data"
mkdir -p "audit/Defensive_Report/.defender_working/${SESSION_ID}/code/code_hardening"
mkdir -p "audit/Defensive_Report/.defender_working/${SESSION_ID}/code/framework_hardening"
mkdir -p "audit/Defensive_Report/.defender_working/${SESSION_ID}/code/network_crypto_hardening"
mkdir -p "audit/Defensive_Report/.defender_working/${SESSION_ID}/code/deception_traps"
mkdir -p "audit/Defensive_Report/.defender_working/${SESSION_ID}/reports"
mkdir -p "audit/Defensive_Report/correction"
mkdir -p "audit/Defensive_Report/reports"
mkdir -p "audit/Defensive_Report/code"
mkdir -p "audit/Defensive_Report/phases"
```

### Session Metadata Schema

```yaml
# audit/Defensive_Report/.defender_working/{SESSION_ID}/_session_meta.yaml
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

adversary_session_ref: null
threat_model_ref: null

loaded_data:
  defensive_files: []

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

Create 9 tasks at session startup:

```
Phase 0: Detection - Scan project, detect stack/OS/frameworks, load relevant defensive DATA
Phase 1: Existing audit - Inventory protections already in place
Phase 2: Hardening points - Identify every place where a protection should be added
Phase 3: Runtime code hardening - Write runtime protection code (detected language)
Phase 4: Framework hardening - Write framework/IPC/OS/anti-RE code (adapted to stack)
Phase 5: Network and crypto hardening - Write TLS/pinning/crypto/storage code (adapted)
Phase 6: Traps, deception and LLM - Write deception/logging/kill switch/AI defense code
Phase 7: Cross-validation - Verify coverage against adversary-simulation
Phase 8: Defensive report - Produce final report with integration guide
```

---

## S2 - Phase Execution Protocol

### Execution Algorithm

```
FOR each phase N in [0..8]:
  1. PRECONDITION: current_state == P{N-1}.completed (except P0)
  2. Read @phases/P{N}-*.md (instructions)
  3. Load relevant DATA (per P0 detection and S5 table)
  4. Execute 4-gate sub-FSM:
     ENTRY -> REFLECTION -> PLANNING -> EXECUTION -> VALIDATION -> EXIT
  5. Write: data/P{N}_*.yaml (PRIMARY)
  6. IF P3-P6: Write code to code/{subdirectory}/
  7. Write: reports/P{N}-*.md (REPORT)
  8. Validate YAML consistency
  9. IF valid: delta(P{N}, p{n}_complete) -> P{N+1}
 10. IF invalid: delta(P{N}, validation_fail) -> ERROR, correct and retry
```

---

## S3 - Data Contracts per Phase (YAML Files)

### Contract Summary

| Phase | File | Key fields | Validation |
|-------|------|------------|------------|
| P0 | `P0_detection.yaml` | detected_stack, config_files, adversary_ref, loaded_data | languages > 0, config_files > 0 |
| P1 | `P1_audit.yaml` | existing_protections[], tech_stack, security_posture | protections inventoried |
| P2 | `P2_reinforcement_points.yaml` | gaps[], gap_by_category, priority_matrix | gaps > 0, all with location |
| P3 | `P3_code_hardening.yaml` | fixes[], tests[], gap_coverage | fixes > 0, all with code_file |
| P4 | `P4_framework_hardening.yaml` | fixes[], tests[], gap_coverage | fixes > 0, all with code_file |
| P5 | `P5_network_crypto_hardening.yaml` | fixes[], tests[], gap_coverage | fixes > 0, all with code_file |
| P6 | `P6_deception_traps.yaml` | fixes[], tests[], gap_coverage | fixes > 0, all with code_file |
| P7 | `P7_cross_validation.yaml` | coverage_matrix, addressed[], unaddressed[] | all gaps accounted |
| P8 | `P8_report_manifest.yaml` | generated_reports[], statistics | all reports generated |

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
  key_dependencies:
    - name: "tauri"
      version: "^2.x"
      source: "Cargo.toml"
      defense_relevance: "CRITICAL"

adversary_report:
  found: false
  path: null
  session_id: null
  vuln_count: 0

threat_model:
  found: false
  path: null
  risk_priorities: []

loaded_data:
  from_index: "data/defensive/index-defensive.md"
  defensive_files:
    - path: "generic/def-runtime-memory.md"
      tags_matched: ["runtime", "memory"]
      reason: "Stack includes runtime code"
    - path: "rust-tauri/def-rust-rust-runtime-hardening.md"
      tags_matched: ["runtime", "rust"]
      reason: "Rust detected in Cargo.toml"

defense_categories_active:
  - code: RUNTIME
    reason: "Runtime code detected"
    data_files: ["generic/def-runtime-memory.md"]
  - code: FW
    reason: "Application framework detected"
    data_files: ["generic/def-framework-hardening.md"]
```

### P1 - Audit Contract

```yaml
schema_version: "1.1.0"
phase: 1
generated_at: "ISO8601"
input_ref: "P0_detection.yaml"

project_context:
  name: "ProjectName"
  type: "application_type"
  tech_stack:
    languages: []    # from P0
    frameworks: []   # from P0
    key_dependencies:
      - name: "dep_name"
        version: "^x.y.z"
        security_audit: false

existing_protections:
  - id: PROT-001
    category: CRYPTO
    title: "Description of existing protection"
    location: "path/to/file.ext:23"
    effectiveness: "partial|strong|weak"
    notes: "Details about current implementation"

security_posture:
  overall_rating: "WEAK|MEDIUM|GOOD|EXCELLENT"
  strengths: ["Strength 1"]
  weaknesses: ["Weakness 1"]
  missing_categories: ["IPC", "ANTI_RE"]
```

### P2 - Hardening Points Contract

```yaml
schema_version: "1.1.0"
phase: 2
generated_at: "ISO8601"
input_ref: "P1_audit.yaml"

gaps:
  - id: GAP-001
    category: RUNTIME
    title: "Gap description"
    priority: P0
    location: "path/to/file.ext:15"
    current_code: "# Current vulnerable code"
    issue: "Problem description"
    defense_needed: "Description of required protection"
    knowledge_ref: "data-source-file.md#section"
    assigned_phase: P3

gap_summary:
  total: 40
  by_category: {}   # dynamic based on active categories
  by_priority:
    P0: 6
    P1: 12
    P2: 14
    P3: 8
  by_phase:
    P3: 12   # Runtime code hardening
    P4: 14   # Framework/IPC/OS/Anti-RE hardening
    P5: 8    # Network and crypto hardening
    P6: 6    # Traps, deception, LLM
```

### P3-P6 - Code Contract (common)

```yaml
schema_version: "1.1.0"
phase: {N}
generated_at: "ISO8601"
input_ref: "P{N-1}_*.yaml"

fixes:
  - id: FIX-001
    gap_ref: GAP-002
    category: RUNTIME
    title: "Fix description"
    priority: P0
    target_file: "path/to/file.ext"
    insertion_point:
      file: "path/to/file.ext"
      after_line: 42
      method: "replace"  # insert|replace|wrap
    code_file: "code/code_hardening/fix_001_desc.ext"
    test_file: "code/code_hardening/test_fix_001.ext"
    before_code: "# Original vulnerable code"
    after_code: "# Protected code"
    dependencies_added:
      - name: "dep_name"
        version: "x.y.z"
        source: "package_manager"
    integration_steps:
      - "Integration step 1"
    effort: "15 minutes"

tests:
  - id: TEST-001
    fix_ref: FIX-001
    type: "unit"
    test_file: "code/code_hardening/test_fix_001.ext"
    description: "Verifies that the protection works"

gap_coverage:
  total_gaps_assigned: 12
  addressed: 12
  skipped: 0
  skipped_reasons: []
```

### P7 - Cross-Validation Contract

```yaml
schema_version: "1.1.0"
phase: 7
generated_at: "ISO8601"
input_ref: "P6_deception_traps.yaml"
adversary_ref: "audit/Offensive_Report/.attacker_working/{SESSION}/data/"
adversary_skill: "adversary-simulation"

coverage_matrix:
  total_adversary_vulns: 28
  addressed_by_fix: 24
  partially_addressed: 2
  still_unaddressed: 2

addressed:
  - vuln_ref: VULN-001
    fix_refs: ["FIX-001", "FIX-009"]
    coverage: "complete"
    notes: "Coverage description"

partially_addressed:
  - vuln_ref: VULN-015
    fix_refs: ["FIX-022"]
    coverage: "partial"
    remaining_risk: "Description of residual risk"
    recommendation: "Recommended additional action"

unaddressed:
  - vuln_ref: VULN-027
    reason: "Justification"
    recommendation: "Recommended external action"

gap_accountability:
  total_gaps_p2: 40
  addressed_p3: 12
  addressed_p4: 14
  addressed_p5: 8
  addressed_p6: 6
  total_addressed: 40
  total_unaddressed: 0

cross_refs:
  - id: XREF-001
    adversary_vuln: VULN-001
    fix_refs: ["FIX-001", "FIX-009"]
    coverage: "complete"
```

### P8 - Report Contract

```yaml
schema_version: "1.1.0"
phase: 8
generated_at: "ISO8601"
input_ref: "P7_cross_validation.yaml"

executive_summary:
  project: "PROJECT-NAME"
  detected_stack: []       # from P0
  total_gaps_identified: 40
  total_fixes_written: 40
  total_tests_written: 40
  adversary_vulns_covered: "85.7%"
  effort_estimate: "45 development hours"

generated_reports:
  - file: "{PROJECT}-DEFENSIVE-REPORT.md"
    type: "main_report"
    path: "audit/Defensive_Report/reports/"
  - file: "{PROJECT}-PROTECTION-INVENTORY.md"
    type: "protection_catalog"
    path: "audit/Defensive_Report/reports/"
  - file: "{PROJECT}-CODE-INTEGRATION.md"
    type: "integration_guide"
    path: "audit/Defensive_Report/reports/"
  - file: "{PROJECT}-CROSS-VALIDATION.md"
    type: "cross_validation"
    path: "audit/Defensive_Report/reports/"
  - file: "CORRECTION-PLAN.md"
    type: "correction_plan"
    path: "audit/Defensive_Report/correction/"

code_summary:
  total_files: 0
  by_phase:
    P3: {fixes: 0, tests: 0, files: 0}
    P4: {fixes: 0, tests: 0, files: 0}
    P5: {fixes: 0, tests: 0, files: 0}
    P6: {fixes: 0, tests: 0, files: 0}
  dependencies_added: []

statistics:
  phases_completed: 9
  coverage:
    gaps_addressed: "100%"
    adversary_vulns_covered: "0%"
    fixes_with_tests: "100%"
```

---

## S4 - Validation Gates

### Actions on Result

| Result | Meaning | Action |
|--------|---------|--------|
| VALID | Consistent data | Move to next phase |
| WRONG_COUNT | Missing or extra entities | Fix YAML and revalidate |
| BROKEN_REFS | Referenced IDs not found | Fix references and revalidate |

### Validation per Phase

| Phase | Required file | Validation criteria |
|-------|--------------|---------------------|
| 0 | P0_detection.yaml | languages > 0 + config_files_found > 0 + loaded_data.defensive_files > 0 |
| 1 | P1_audit.yaml | existing_protections inventoried + security_posture evaluated |
| 2 | P2_reinforcement_points.yaml | gaps > 0 + all with location + all assigned to a phase P3-P6 |
| 3 | P3_code_hardening.yaml | all gaps assigned to P3 addressed + code written + tests written |
| 4 | P4_framework_hardening.yaml | all gaps assigned to P4 addressed + code written + tests written |
| 5 | P5_network_crypto_hardening.yaml | all gaps assigned to P5 addressed + code written + tests written |
| 6 | P6_deception_traps.yaml | all gaps assigned to P6 addressed + code written + tests written |
| 7 | P7_cross_validation.yaml | complete coverage matrix + all gaps accounted for |
| 8 | P8_report_manifest.yaml | all reports generated + consistent statistics |

### Count Conservation (CRITICAL)

```
P2.gap_summary.by_phase.P3 == P3.gap_coverage.total_gaps_assigned
P2.gap_summary.by_phase.P4 == P4.gap_coverage.total_gaps_assigned
P2.gap_summary.by_phase.P5 == P5.gap_coverage.total_gaps_assigned
P2.gap_summary.by_phase.P6 == P6.gap_coverage.total_gaps_assigned

P2.gap_summary.total == P7.gap_accountability.total_addressed + P7.gap_accountability.total_unaddressed
```

---

## S5 - Dynamic Defense Categories and DATA Coverage

> **PRINCIPLE** : Categories are NOT hardcoded. They are detected in P0 and DATA is loaded from data/defensive/ via INDEX-THEN-SELECTIVE.

### DATA loading table per phase

| Phase | DATA to load |
|-------|-------------|
| P0 | `data/defensive/index-defensive.md` only |
| P1 | data/defensive/ files matching detected stack (loaded in P0) |
| P2 | Same as P1 (to identify all gaps) |
| P3 | Runtime/memory DATA specific to the stack |
| P4 | Framework/IPC/OS/anti-RE specific DATA |
| P5 | Network/TLS/crypto/storage specific DATA |
| P6 | Deception/monitoring/LLM specific DATA |
| P7 | Cross-validation DATA + `data/shared/references/ref-cve-catalog.md` |
| P8 | None (YAML synthesis) |

### Detected stack -> Defensive DATA mapping

| Detected stack | Tags to match in index-defensive.md | Typical files |
|----------------|--------------------------------------|---------------|
| Rust + Tauri | rust, tauri, ipc, framework | data/defensive/rust-tauri/*.md |
| Flutter + Dart | flutter, dart, mobile, framework | data/defensive/flutter-dart/*.md |
| React / Vue / Angular | frontend, spa, framework | data/defensive/stack/stack-frontend*.md |
| Python backend | python, backend | data/defensive/stack/stack-python*.md |
| Node.js / TypeScript | js, node, typescript | data/defensive/stack/stack-js-node.md |
| LLM / AI | llm, pipeline, deception | data/defensive/generic/def-llm-*.md |
| Linux | linux, desktop | data/defensive/platform/platform-linux.md |
| Windows | windows, desktop | data/defensive/platform/platform-windows.md |
| macOS | macos, desktop | data/defensive/platform/platform-macos.md |

---

## S6 - Error Recovery

### Validation Failure

1. Read the validation error message
2. Identify missing/invalid fields in the YAML
3. Fix the YAML file and/or the code
4. Re-run the validation
5. Only then update the report

### Session Interruption

1. Check `audit/Defensive_Report/.defender_working/{SESSION_ID}/_session_meta.yaml`
2. Find the last phase with `status: "completed"`
3. Load the YAML file for that phase from `data/`
4. Resume at the next phase

---

## S7 - Final Report Output

### Report Summary

| Category | Files | Location | Source |
|----------|-------|----------|--------|
| Main (1) | DEFENSIVE-REPORT | `audit/Defensive_Report/reports/` | P8 YAML (synthesis of everything) |
| Catalogs (3) | PROTECTION-INVENTORY, CODE-INTEGRATION, CROSS-VALIDATION | `audit/Defensive_Report/reports/` | P1-P7 YAML |
| Correction (1) | CORRECTION-PLAN | `audit/Defensive_Report/correction/` | P8 (actionable checklist) |
| Phases (8) | P0-P7-*.md | `audit/Defensive_Report/phases/` | Execution of each phase |

### Final Report Structure

The main report `{PROJECT}-DEFENSIVE-REPORT.md` contains:

1. **Executive summary** : Summary for decision-makers
2. **Detected stack** : Languages, frameworks, OS, critical dependencies (P0)
3. **Security posture before/after** : Comparison across active categories
4. **Protection inventory** : All existing PROT-xxx and added FIX-xxx
5. **Integration guide** : Integration order, dependencies to add, effort
6. **Cross-validation** : Coverage vs adversary-simulation
7. **Code to integrate** : References to all code/ files
8. **Tests** : How to run tests (adapted to language/framework)
9. **Prioritization** : Integration order P0 -> P1 -> P2 -> P3

---

**End of WORKFLOW.md** (~470 lines, ~7K tokens)
