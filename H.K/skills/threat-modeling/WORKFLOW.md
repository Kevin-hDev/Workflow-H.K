# WORKFLOW.md - Orchestration Contracts

**Version**: 1.1.0
**Purpose**: Phase orchestration, structured data contracts, validation gates, FSM-enforced execution

> **Cross-References**:
> - Global constraints and data model: See SKILL.md
> - Phase-specific instructions: See @phases/P{N}-*.md

---

## S1 Workflow State Machine (FSM)

### 9-Phase FSM Definition (P0-P8)

```
+-----------------------------------------------------------------------+
|                    STRIDE THREAT MODELING FSM (UNIVERSAL)               |
+-----------------------------------------------------------------------+
|                                                                       |
|  States: {INIT, P0, P1, P2, P3, P4, P5, P6, P7, P8, P8R, DONE, ERROR}|
|                                                                       |
|  Transitions:                                                         |
|    delta(INIT, start) -> P0                                           |
|    delta(P0, p0_complete) -> P1                                       |
|    delta(Pn, pn_complete) -> P(n+1)  where n in {1..7}               |
|    delta(P8, p8_complete AND detailed) -> P8R                         |
|    delta(P8, p8_complete AND NOT detailed) -> DONE                    |
|    delta(P8R, p8r_complete) -> DONE                                   |
|    delta(Pn, validation_fail) -> ERROR                                |
|    delta(ERROR, recovery_success) -> Pn  (rollback)                   |
|                                                                       |
|  Accepting States: {DONE}                                              |
|                                                                       |
+-----------------------------------------------------------------------+
```

### State Transition Diagram

```
INIT --start--> P0 --p0_ok--> P1 --p1_ok--> P2 --p2_ok--> P3 --p3_ok--> P4 --p4_ok--> P5 --p5_ok--> P6 --p6_ok--> P7 --p7_ok--> P8 --+--p8_ok--> DONE
                 |              |              |              |              |              |              |              |              |
                 +--fail------->+--------------+--------------+--------------+--------------+--------------+--------------+--------------+
                                v                                                                                                       |
                              ERROR --recovery--> (rollback to last valid Pn)                                                           |
                                                                                                                                         |
                                (if --detailed or user confirms)                                                                         |
                                P8 --p8_complete AND detailed--> P8R --p8r_complete--+
```

### Phase Internal 4-Gate Sub-FSM

Each Phase Pn internally follows:

```
ENTRY --[check_pass]--> THINKING --> PLANNING --> EXECUTING <--loop--> REFLECTING --> EXIT
  |                                                                                    |
  +--[check_fail]----------------------------------------------------------------------+
                                                                          (emit pn_complete)
```

---

## S1.1 Data Flow Architecture

> **Principle**: YAML is data (machine-readable), Markdown is report (human-readable). Separate concerns!
> **Directory structure definition**: See SKILL.md S2

```
DATA FLOW CHAIN (strict, no gaps):
  P0 -> writes P0_detection.yaml            -> P1 reads it
  P1 -> writes P1_project_context.yaml      -> P2 reads it
  P2 -> writes P2_dfd_elements.yaml         -> P3 reads it
  P3 -> writes P3_boundary_context.yaml     -> P4 reads it (NOTE: same as original P3)
  P4 -> writes P4_security_gaps.yaml        -> P5 reads it
  P5 -> writes P5_threat_inventory.yaml     -> P6 reads it
  P6 -> writes P6_validated_risks.yaml      -> P7 reads it
  P7 -> writes P7_mitigation_plan.yaml      -> P8 reads it
  P8R (optional) -> reads P6+P7+P8 YAML -> writes P8R_manifest.yaml + VR-xxx.md files

  FORBIDDEN: P{N+1} reading P{N}'s .md report for data extraction
  REQUIRED: P{N+1} reading P{N}'s .yaml data file directly
```

---

## S1.2 Session Initialization

### Session ID Generation

> **Format Definition**: See SKILL.md S2

```
SESSION_ID = {PROJECT_NAME}_{YYYYMMDD_HHMMSS}
Example: OPEN-WEBUI_20260130_143022
```

### Directory Creation

```bash
SESSION_ID="${PROJECT_NAME}_$(date +%Y%m%d_%H%M%S)"
mkdir -p ".phase_working/${SESSION_ID}/data"
mkdir -p ".phase_working/${SESSION_ID}/reports"
```

### Session Metadata Schema

```yaml
# .phase_working/{SESSION_ID}/_session_meta.yaml
schema_version: "1.1.0"
session_id: "{PROJECT}_{YYYYMMDD_HHMMSS}"
project_name: "PROJECT-NAME"
project_path: "/absolute/path"
started_at: "ISO8601"
language: "en"
skill_version: "1.1.0"
current_state: "P0"

# Detection P0 (filled after P0)
detected_stack:
  os_targets: []
  languages: []
  frameworks: []
  package_managers: []
  config_files_found:
    - file: ""
      path: ""
      stack_signal: ""
  previous_threat_model_found: false
  previous_threat_model_path: null

# DATA loaded (filled after P0)
loaded_data:
  offensive:
    from_index: "data/offensive/index-offensive.md"
    attack_files:
      - path: ""
        tags_matched: []
        reason: ""
    exploit_files: []
  defensive:
    from_index: "data/defensive/index-defensive.md"
    generic_files: []
    stack_files: []
    platform_files: []
    framework_files: []
  shared:
    from_index: "data/shared/index-shared.md"
    reference_files: []

phases:
  P0:
    status: "pending"
    started_at: null
    completed_at: null
    data_file: "data/P0_detection.yaml"
    report_file: "reports/P0-DETECTION.md"
  P1:
    status: "pending"
    data_file: "data/P1_project_context.yaml"
    report_file: "reports/P1-PROJECT-UNDERSTANDING.md"
  P2:
    status: "pending"
    data_file: "data/P2_dfd_elements.yaml"
    report_file: "reports/P2-DFD-ANALYSIS.md"
  P3:
    status: "pending"
    data_file: "data/P3_boundary_context.yaml"
    report_file: "reports/P3-TRUST-BOUNDARY.md"
  P4:
    status: "pending"
    data_file: "data/P4_security_gaps.yaml"
    report_file: "reports/P4-SECURITY-DESIGN-REVIEW.md"
  P5:
    status: "pending"
    data_file: "data/P5_threat_inventory.yaml"
    report_file: "reports/P5-STRIDE-THREATS.md"
  P6:
    status: "pending"
    data_file: "data/P6_validated_risks.yaml"
    report_file: "reports/P6-RISK-VALIDATION.md"
  P7:
    status: "pending"
    data_file: "data/P7_mitigation_plan.yaml"
    report_file: "reports/P7-MITIGATION-PLANNING.md"
  P8:
    status: "pending"
    data_file: "data/P8_report_manifest.yaml"
    report_file: "reports/P8-REPORT-GENERATION.md"
```

### Session Meta Update Protocol

After each phase N completes successfully, `_session_meta.yaml` MUST be updated:
- `current_state` -> `"P{N+1}"` (or `"DONE"` after P8)
- `phases.P{N}.status` -> `"completed"`
- `phases.P{N}.completed_at` -> ISO8601 timestamp of completion

### Todo Creation

Create 9 items at session start:

```
Phase 0: Detection - Scan project, detect stack/OS/frameworks, load relevant DATA
Phase 1: Project Understanding
Phase 2: Call Flow & DFD Analysis
Phase 3: Trust Boundary Evaluation
Phase 4: Security Design Review
Phase 5: STRIDE Threat Analysis
Phase 6: Risk Validation
Phase 7: Mitigation Planning
Phase 8: Report Generation

# If --detailed flag is set, also add:
# Phase 8R: Detailed Risk Analysis (optional)
```

---

## S2 Phase Execution Protocol

> **FSM Enforcement**: Phase transitions are governed by the FSM defined in S1.
> **Entry Gate Details**: See `@phases/P{N}-*.md` for per-phase 4-Gate protocol.
> **Global Constraints**: See SKILL.md S10-S11 for execution invariants.

### Phase Execution Algorithm

```
FOR each phase N in [0..8]:
  1. PRECONDITION: current_state == P{N-1}.completed (except P0)
  2. Read @phases/P{N}-*.md (instructions)
  3. Load relevant DATA (per P0 detection and SKILL.md S4 table)
  4. Execute 4-Gate: ENTRY -> THINKING -> PLANNING -> EXECUTING -> REFLECTING -> EXIT
  5. Write: data/P{N}_*.yaml (PRIMARY)
  6. Write: reports/P{N}-*.md (SECONDARY)
  7. Validate YAML coherence
  8. IF valid: delta(P{N}, p{n}_complete) -> P{N+1}
  9. IF invalid: delta(P{N}, validation_fail) -> ERROR, fix and retry

POST-P8:
  1. Generate threat_model_output.yaml (chain output for adversary-simulation)
  2. IF --detailed flag OR user confirms after P8:
     a. Read @phases/P8R-DETAILED-REPORT.md
     b. Read P6+P7+P8 YAML data
     c. Generate per-VR detailed analysis reports
     d. Write: Risk_Assessment_Report/detailed/VR-{NNN}-{slug}.md
     e. Write: data/P8R_manifest.yaml
```

### Checkpoint Phases (User Confirmation Required)

| Phase | Checkpoint | Purpose |
|-------|------------|---------|
| P5 | After threat enumeration | User confirms threat list completeness |
| P6 | After risk validation | User confirms attack paths before mitigation |
| P7 | After mitigation planning | User confirms remediation plan before report |

---

## S3 Phase Data Contracts (YAML Files)

> **Complete Schema Definitions**: See `@assets/contracts/data-model.yaml`

### Contract Summary Table

| Phase | File | Key Fields | Validation |
|-------|------|------------|------------|
| P0 | `P0_detection.yaml` | detected_stack, sensitive_components, loaded_data | languages > 0, config_files > 0 |
| P1 | `P1_project_context.yaml` | module_inventory, entry_point_inventory, discovery_checklist | checklist.coverage == 100% |
| P2 | `P2_dfd_elements.yaml` | interface_inventory, data_flow_traces, dfd_elements | l1_coverage == 100% |
| P3 | `P3_boundary_context.yaml` | boundaries[], interfaces[], cross_boundary_flows[] | boundaries non-empty |
| P4 | `P4_security_gaps.yaml` | gaps[], design_matrix (18 domains), findings[] | 18 domains assessed |
| P5 | `P5_threat_inventory.yaml` | threats[], summary (by_stride, by_element, by_risk) | total > 0 |
| P6 | `P6_validated_risks.yaml` | risk_details[], poc_details[], attack_paths[] | count conservation |
| P7 | `P7_mitigation_plan.yaml` | mitigations[], roadmap (P0-P3) | every VR has MIT |
| P8 | `P8_report_manifest.yaml` | generated_reports[], statistics | all reports generated |
| P8R | `P8R_manifest.yaml` | reports[], cross_reference_integrity | count conservation (optional) |

### Common Header (All Phases)

```yaml
schema_version: "1.1.0"
phase: {N}
generated_at: "ISO8601"
input_ref: "P{N-1}_*.yaml"  # Traceability (except P0)
```

### P0 Detection Contract

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
  key_dependencies:
    - name: "tauri"
      version: "^2.x"
      source: "Cargo.toml"
      security_relevance: "CRITICAL"

sensitive_components:
  auth: []
  crypto: []
  llm_ai: []
  ipc: []
  database: []
  subprocess: []
  privilege_elevation: []
  network: []

previous_threat_model:
  found: false
  path: null
  risk_priorities: []

loaded_data:
  offensive:
    from_index: "data/offensive/index-offensive.md"
    attack_files:
      - path: "generic/atk-injection-input.md"
        tags_matched: ["sql-injection", "xss", "input"]
        reason: "Stack includes frontend + backend"
    exploit_files: []
  defensive:
    from_index: "data/defensive/index-defensive.md"
    generic_files: []
    stack_files: []
    platform_files: []
    framework_files: []
  shared:
    from_index: "data/shared/index-shared.md"
    reference_files: []

stride_categories_relevant:
  - code: "S"
    name: "Spoofing"
    applicable_components: ["auth"]
    data_files_offensive: []
    data_files_defensive: []
```

### P5 Threat ID Format

```yaml
# Threat ID: T-{STRIDE}-{ElementID}-{Seq}
# Example: T-S-P001-001 (Spoofing threat for Process P-001)
threats:
  - id: T-S-P001-001
    stride_category: "S"
    element_id: "P-001"
    cwe_refs: ["CWE-287"]
    capec_refs: ["CAPEC-151"]
```

### P6 Count Conservation (CRITICAL)

```yaml
risk_summary:
  total_identified: 45      # From P5
  total_verified: 15        # Exploitable
  total_theoretical: 20     # Possible
  total_pending: 5          # Under investigation
  total_excluded: 5         # False positives
  # INVARIANT: 15 + 20 + 5 + 5 = 45

risk_details:
  - id: VR-001
    threat_refs: ["T-S-P001-001"]  # Links back to P5
    validation_status: "verified|theoretical|pending|excluded"
```

### P7 Mitigation Priority

```yaml
mitigation_plan:
  mitigations:
    - id: MIT-001
      risk_refs: ["VR-001"]  # Links back to P6
      priority: "P0|P1|P2|P3"
  roadmap:
    immediate: ["MIT-001"]   # P0: Fix now
    short_term: ["MIT-003"]  # P1: 7 days
    medium_term: ["MIT-004"] # P2: 30 days
    long_term: ["MIT-006"]   # P3: Backlog
```

---

## S4 Validation Gates

### Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Pass | Proceed to next phase |
| 1 | Missing data | Fix YAML and revalidate |
| 2 | Schema validation failed | Fix structure and revalidate |

### Phase-Specific Validation

| Phase | Data File Required | Validation Criteria |
|-------|-------------------|---------------------|
| 0 | P0_detection.yaml | languages > 0 + config_files > 0 + loaded_data present |
| 1 | P1_project_context.yaml | module_inventory + entry_point_inventory + discovery_checklist |
| 2 | P2_dfd_elements.yaml | l1_coverage.coverage_percentage == 100 |
| 3 | P3_boundary_context.yaml | boundaries[] non-empty |
| 4 | P4_security_gaps.yaml | design_matrix with 18 domains |
| 5 | P5_threat_inventory.yaml | threat_inventory.summary.total > 0 |
| 6 | P6_validated_risks.yaml | Count conservation balanced |
| 7 | P7_mitigation_plan.yaml | Every VR-xxx has MIT-xxx |
| 8 | P8_report_manifest.yaml | All reports generated + threat_model_output.yaml produced |

### Count Conservation

```
P5.threat_inventory.summary.total ==
  P6.risk_summary.total_verified +
  P6.risk_summary.total_theoretical +
  P6.risk_summary.total_pending +
  P6.risk_summary.total_excluded
```

---

## S5 STRIDE per Element Matrix

| Element Type | S | T | R | I | D | E |
|--------------|---|---|---|---|---|---|
| Process      | Y | Y | Y | Y | Y | Y |
| Data Store   |   | Y | Y | Y | Y |   |
| Data Flow    |   | Y |   | Y | Y |   |
| External (source) | Y |   | Y |   |   |   |

---

## S6 Error Recovery

### Validation Failure

1. Read error message from validation output
2. Identify missing/invalid fields in YAML
3. Fix YAML data file
4. Re-run validation
5. Only then update report

### Session Interruption

1. Check `.phase_working/{SESSION_ID}/_session_meta.yaml`
2. Find last phase with `status: "completed"`
3. Load that phase's YAML data file from `data/` subdirectory
4. Resume from next phase

---

## S7 Final Report Output

> **Directory Structure**: See SKILL.md S2 for complete structure
> **Naming Convention**: See SKILL.md S2

### Directory Structure

```
audit/
  Risk_Assessment_Report/
    correction/
      CORRECTION-PLAN.md
    reports/
      {PROJECT}-RISK-ASSESSMENT-REPORT.md
      {PROJECT}-RISK-INVENTORY.md
      {PROJECT}-MITIGATION-MEASURES.md
      {PROJECT}-PENETRATION-TEST-PLAN.md
    phases/
      P0..P7-*.md
    chain/
      threat_model_output.yaml
    detailed/       (P8R optional)
      VR-xxx-*.md
```

### Report Summary

| Category | Files | Source |
|----------|-------|--------|
| Required (5) | RISK-ASSESSMENT-REPORT, RISK-INVENTORY, MITIGATION-MEASURES, PENETRATION-TEST-PLAN, CORRECTION-PLAN | P6-P8 YAML |
| Phase (8) | P0-P7-*.md | Phase execution |
| Chain Output (1) | threat_model_output.yaml | P5-P6-P7 synthesis |
| Detailed (P8R) | detailed/VR-{NNN}-{slug}.md per validated risk | P6+P7 YAML (optional) |

### Chain Output (CRITICAL)

After P8 completes, generate `threat_model_output.yaml` in `audit/Risk_Assessment_Report/chain/`.
This file is the bridge to the next skill in the chain (adversary-simulation).
See SKILL.md S12 for the complete schema.

### Multi-Session Support

```
.phase_working/
  _sessions_index.yaml                   <-- Optional session index
  {PROJECT}_{YYYYMMDD_HHMMSS}/          <-- Historical sessions
  {PROJECT}_{YYYYMMDD_HHMMSS}/          <-- Current session (active)
```

> **Session isolation enables**: Incremental analysis, historical comparison, rollback capability

---

**End of WORKFLOW.md** (~420 lines, ~6K tokens)
