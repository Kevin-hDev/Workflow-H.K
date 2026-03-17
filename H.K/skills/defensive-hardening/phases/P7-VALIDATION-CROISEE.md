# Phase 7: Cross-Validation

**Type** : Analytical — coverage verification
**Executor** : LLM
**Knowledge** : data/shared/references/ref-cross-validation-matrix.md (if available)
**Input** : P6_deception_traps.yaml + adversary-simulation results (if available)
**Output** : P7_cross_validation.yaml + report P7-CROSS-VALIDATION.md

---

## EXHAUSTIVENESS DIRECTIVE - MANDATORY

> This phase does NOT produce code. It VERIFIES that each identified vulnerability
> (internally by P2, and externally by the adversary-simulation skill if executed)
> has a countermeasure in fixes P3-P6.
>
> If the adversary-simulation skill was executed BEFORE this skill, its results
> (adversary_output.yaml or YAML files in Offensive_Report/) must be
> loaded and cross-referenced with the defenses.
>
> If the adversary report does not exist: validation is done internally only.
> Document: `adversary_report_available: false`.

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

> **CRITICAL** : Complete all four steps in sequence and display the result of each step.

---

### REFLECTION - Entry Gate P7

**Objective** : Verify that EVERY identified vulnerability has a countermeasure. Build the coverage matrix. Identify and document remaining gaps.

**Display REFLECTION results in this format:**

```
REFLECTION - P7 Entry Gate
================================================

CENTRAL PROBLEM
Ensure that defensive coverage is complete.
No gap from P2 and no adversary vulnerability should
remain without protection or documented justification.

TWO VALIDATION AXES
1. Internal: All P2 GAPs covered by P3-P6 FIXes?
2. External: All adversary-simulation VULNs covered?
   (if adversary skill was executed)

CATEGORIES TO VERIFY
Categories come from P0_detection.yaml.defense_categories_active.
No hardcoded list — use dynamically detected categories.

Examples of common categories:
| Category | Expected fix phases |
|----------|---------------------|
| RUNTIME | P3 |
| FRAMEWORK | P4 |
| IPC | P4 |
| CRYPTO | P5 |
| NET | P5 |
| DECEPTION | P6 |
| LLM | P6 (if applicable) |

UPSTREAM DATA
| Source | Metric | Value |
|--------|--------|-------|
| P2 | Total gaps | {P2.gap_summary.total} |
| P3 | Fixes written | {P3.gap_coverage.addressed} |
| P4 | Fixes written | {P4.gap_coverage.addressed} |
| P5 | Fixes written | {P5.gap_coverage.addressed} |
| P6 | Fixes written | {P6.gap_coverage.addressed} |
| Adversary | VULNs (if available) | {vuln_count or N/A} |

================================================
STOP CHECK
- All P2-P6 YAMLs readable? [YES/NO]
- Adversary-simulation results available?
  Look in:
    audit/Offensive_Report/.attacker_working/*/data/P3_vulnerabilities.yaml
    audit/Offensive_Report/.attacker_working/*/data/P4_attack_scenarios.yaml
    adversary_output.yaml
  [YES/NO/NONEXISTENT]
- adversary_output.yaml READ? [YES/NO]
- Defensive DATA files READ for cross-validation? [YES/NO]
- Ready to validate? [YES/NO]
================================================
```

**STOP CONDITION** : If any check = NO -> Resolve before continuing

---

### PLANNING - Breakdown into Subtasks

**Display planning in this format:**

```
PLANNING - P7 Subtasks
================================================

| # | Subtask | Data source |
|---|---------|------------|
| T1 | Load adversary-simulation results (if available) | audit/Offensive_Report/ |
| T2 | Internal validation: gap count invariant | P2_reinforcement_points.yaml |
| T3 | Internal validation: each GAP has a FIX | P3-P6 YAML |
| T4 | External validation: each adversary VULN has coverage | Adversary YAML |
| T5 | Build coverage matrix by category | T2 + T3 + T4 |
| T6 | Document remaining gaps with justification | T3 + T4 |
| T7 | Evaluate coverage by category | T5 |
| T8 | User checkpoint before final report | T7 |
| T9 | Write YAML output + MD report | T1-T8 |

================================================
```

---

### EXECUTION

---

#### T1: Load Adversary-Simulation Results

If the adversary-simulation skill was executed before this skill:
```
Look for (generic paths — adapt based on skill used):
  audit/Offensive_Report/.attacker_working/*/data/P3_vulnerabilities.yaml
  audit/Offensive_Report/.attacker_working/*/data/P4_attack_scenarios.yaml
  audit/Offensive_Report/.attacker_working/*/data/P5_attack_chains.yaml
  adversary_output.yaml
```

If no report exists:
- Document in P7: `adversary_report_available: false`
- Validation is done internally only (T2 + T3)
- This is NOT an error — the adversary skill is optional

---

#### T2: Internal Validation — Count Invariant

**Verify gap conservation**:

```
P2.gap_summary.total ==
    P3.gap_coverage.addressed
  + P4.gap_coverage.addressed
  + P5.gap_coverage.addressed
  + P6.gap_coverage.addressed
  + unaddressed_count
```

If `unaddressed_count > 0`: each unaddressed gap must be documented with justification.

If invariant is VIOLATED (total != sum): BLOCKING ERROR — identify missing gaps.

---

#### T3: Internal Validation — Gap -> Fix Traceability

For each GAP-xxx from P2, verify that at least one FIX-xxx exists in P3-P6:

```yaml
# Mapping format
gap_to_fix_mapping:
  - gap_ref: "GAP-{NNN}"
    gap_title: "{gap title}"
    category: "{category}"
    fix_refs: ["P{X}/FIX-{NNN}"]
    coverage: "complete|partial|none"
    notes: "{explanation}"
```

**Coverage levels**:
| Level | Definition |
|-------|-----------|
| complete | Gap fully covered by one or more FIXes |
| partial | Gap reduced but not eliminated (note what remains) |
| none | No FIX covers this gap (justification mandatory) |

For each gap with "none" coverage:
```yaml
  - gap_ref: "GAP-{NNN}"
    fix_refs: []
    coverage: "none"
    reason: "{technical explanation of why not covered}"
    risk_acceptance: true|false
    accepted_by: "{to be filled by security team}"
    mitigation_recommendation: "{alternative recommendation}"
```

---

#### T4: External Validation — Adversary Coverage

**Conditional** : Execute only if `adversary_report_available: true`.

For each VULN identified by the adversary skill, map VULN -> FIX:

```yaml
adversary_coverage:
  - vuln_ref: "VULN-{NNN}"
    title: "{vulnerability title}"
    category: "{category}"
    severity: "CRITICAL|HIGH|MEDIUM|LOW"
    fix_refs: ["P{X}/FIX-{NNN}"]
    coverage: "complete|partial|none"
    notes: "{explanation of defensive coverage}"
```

**IMPORTANT** : Each VULN of severity CRITICAL or HIGH without complete coverage
must be escalated in the report with detailed justification.

---

#### T5: Build Coverage Matrix

```yaml
coverage_matrix:
  # Internal validation
  gap_accountability:
    total_gaps_p2: "{count}"
    addressed_p3: "{count}"
    addressed_p4: "{count}"
    addressed_p5: "{count}"
    addressed_p6: "{count}"
    total_addressed: "{sum}"
    total_unaddressed: "{count}"
    coverage_percentage_internal: "{%}"

  # External validation (if adversary available)
  adversary_coverage:
    adversary_report_available: true|false
    total_vulns: "{count or N/A}"
    addressed_complete: "{count}"
    addressed_partial: "{count}"
    unaddressed: "{count}"
    coverage_percentage_adversary: "{%}"

  # Coverage by category (dynamic categories from P0)
  category_coverage:
    "{CATEGORY_1}":
      gaps: "{count}"
      addressed: "{count}"
      partial: "{count}"
      unaddressed: "{count}"
      adversary_vulns: "{count if available}"
    "{CATEGORY_2}":
      gaps: "{count}"
      addressed: "{count}"
      partial: "{count}"
      unaddressed: "{count}"
    # ... for each active category
```

#### T5b: Cross-Validation Matrix (VULN -> FIX)

When adversary-simulation results are available, build the detailed cross-validation matrix:

```yaml
cross_validation:
  coverage:
    total_adversary_vulns: 23
    vulns_with_code_fix: 10
    vulns_documented_only: 3
    vulns_unaddressed: 0
    coverage_percentage: 100

  matrix:
    - vuln_id: VULN-001
      vuln_title: "Vulnerability title"
      fix_id: FIX-002
      status: code_fix_provided  # code_fix_provided | documented_only | unaddressed
      code_file: "code/code_hardening/fix_002.rs"
    - vuln_id: VULN-002
      vuln_title: "Another vulnerability"
      fix_id: FIX-005
      status: documented_only
      code_file: null
    # ... for each adversary VULN
```

**Status values**:
| Status | Meaning |
|--------|---------|
| `code_fix_provided` | A concrete code fix exists in `code/` |
| `documented_only` | Defense documented but no code fix (e.g., config change, process change) |
| `unaddressed` | No fix or documentation — justification mandatory |

---

#### T6: Document Remaining Gaps

For each uncovered vuln/gap:

```yaml
unaddressed_items:
  - ref: "GAP-{NNN} or VULN-{NNN}"
    type: "gap|adversary_vuln"
    title: "{title}"
    category: "{category}"
    severity: "CRITICAL|HIGH|MEDIUM|LOW"
    reason: "{technical explanation}"
    risk_acceptance: true|false
    accepted_by: "{to be filled}"
    recommendation: "{recommended alternative measure}"
```

---

#### T7: Evaluate Coverage by Category

**Quality criteria**:
| Coverage | Meaning | Required action |
|----------|---------|----------------|
| >= 90% | Excellent | Continuous maintenance |
| 70-89% | Good | Address gaps quickly |
| 50-69% | Acceptable | Action plan required within 30 days |
| < 50% | Insufficient | Immediate action required — high risk |

---

#### T8: User Checkpoint

**BLOCKING** : Present coverage matrix to user and ask for confirmation
before generating final P8 report.

```
CHECKPOINT P7 — CROSS-VALIDATION
================================================

Internal coverage: {X}/{Y} gaps ({Z%})
Adversary coverage: {X}/{Y} vulns ({Z%}) or N/A

Categories below {70%}:
- {CATEGORY_A}: {X%} — {reason}
- {CATEGORY_B}: {X%} — {reason}

Accepted gaps: {count}
Unaccepted gaps: {count}

→ Confirm to generate final P8 report? [YES/NO]
================================================
```

---

#### T9: Write Output

**Writing order**:
1. **YAML** : `.defender_working/{SESSION_ID}/data/P7_cross_validation.yaml`
2. **MD** : `.defender_working/{SESSION_ID}/reports/P7-CROSS-VALIDATION.md`

---

### VALIDATION - Completeness Check

```
VALIDATION - P7 Check
================================================

| Element verified | Status |
|-----------------|--------|
| Adversary-simulation results searched (found or absence documented)? | [OK/FAIL] |
| All P2 gaps accounted for (total == addressed + unaddressed)? | [OK/FAIL] |
| Count invariant respected (gap conservation)? | [OK/FAIL] |
| Each GAP-xxx has a referenced FIX-xxx (or absence justification)? | [OK/FAIL] |
| Each adversary VULN cross-referenced with FIXes (if report available)? | [OK/FAIL] |
| Coverage matrix by category built? | [OK/FAIL] |
| Each remaining gap justified and documented? | [OK/FAIL] |
| Global coverage percentage calculated (%)? | [OK/FAIL] |
| User checkpoint presented? | [OK/FAIL] |
| P7_cross_validation.yaml written and valid? | [OK/FAIL] |
| P7-CROSS-VALIDATION.md report generated? | [OK/FAIL] |

COMPLETION GATE
- All checks passed? [YES/NO]
- Ready to generate final P8 report? [YES/NO]
================================================
```

**STOP CONDITION** : If any element FAIL -> fix before moving to P8

---

### P7 Report Template

```markdown
# P7 — Cross-Validation

## Summary
[X gaps addressed out of Y, adversary coverage Z%]
[Adversary report available: YES/NO]

## Internal Validation (P2 Gaps -> P3-P6 Fixes)
| Category | Gaps | Covered | Partial | Uncovered |
|----------|------|---------|---------|-----------|
| {CAT_1} | ... | ... | ... | ... |
| {CAT_2} | ... | ... | ... | ... |
| ... | ... | ... | ... | ... |
| **TOTAL** | ... | ... | ... | ... |

## External Validation (Adversary-Simulation)
[If available: VULN-xxx -> FIX-xxx matrix with coverage level]
[If not available: "Adversary report not executed — internal validation only"]

## Justified Remaining Gaps
| Ref | Title | Non-coverage reason | Accepted by |
|-----|-------|---------------------|-------------|
| ... | ... | ... | ... |

## Global Coverage Score
- Internal coverage (P2 gaps): X/Y gaps (Z%)
- Adversary coverage (if available): X/Y vulns (Z%)
- Assessment: INSUFFICIENT / ACCEPTABLE / GOOD / EXCELLENT
```

---

### P7 YAML Output

Conforms to the P7 contract defined in WORKFLOW.md S3:

```yaml
# audit/Defensive_Report/.defender_working/{SESSION_ID}/data/P7_cross_validation.yaml
schema_version: "1.1.0"
phase: 7
generated_at: "{ISO8601}"
input_ref: "P6_deception_traps.yaml"
adversary_ref: "audit/Offensive_Report/.attacker_working/{SESSION}/data/"
adversary_skill: "adversary-simulation"

# Global coverage matrix
coverage_matrix:
  total_adversary_vulns: "{count or 0}"
  addressed_by_fix: "{count}"
  partially_addressed: "{count}"
  still_unaddressed: "{count}"

# Cross-validation matrix (VULN -> FIX detailed mapping)
cross_validation:
  coverage:
    total_adversary_vulns: "{count}"
    vulns_with_code_fix: "{count}"
    vulns_documented_only: "{count}"
    vulns_unaddressed: "{count}"
    coverage_percentage: "{%}"
  matrix:
    - vuln_id: VULN-{NNN}
      vuln_title: "{title}"
      fix_id: FIX-{NNN}
      status: "code_fix_provided"  # code_fix_provided | documented_only | unaddressed
      code_file: "code/{subdir}/fix_{NNN}.ext"

# VULN -> FIX mapping (complete coverage)
addressed:
  - vuln_ref: VULN-{NNN}
    fix_refs: ["FIX-{NNN}", "FIX-{NNN}"]
    coverage: "complete"
    notes: "{coverage description}"

# VULN -> FIX mapping (partial coverage)
partially_addressed:
  - vuln_ref: VULN-{NNN}
    fix_refs: ["FIX-{NNN}"]
    coverage: "partial"
    remaining_risk: "{residual risk description}"
    recommendation: "{recommended additional action}"

# Uncovered VULNs
unaddressed:
  - vuln_ref: VULN-{NNN}
    reason: "{technical justification}"
    recommendation: "{recommended external action}"

# Count invariant (CRITICAL — gap conservation)
gap_accountability:
  total_gaps_p2: "{P2.gap_summary.total}"
  addressed_p3: "{P3.gap_coverage.addressed}"
  addressed_p4: "{P4.gap_coverage.addressed}"
  addressed_p5: "{P5.gap_coverage.addressed}"
  addressed_p6: "{P6.gap_coverage.addressed}"
  total_addressed: "{sum}"
  total_unaddressed: "{count}"

# Cross-references (XREF-xxx)
cross_refs:
  - id: XREF-001
    adversary_vuln: VULN-{NNN}
    fix_refs: ["FIX-{NNN}", "FIX-{NNN}"]
    coverage: "complete|partial|none"
  # ... for each adversary VULN

# Coverage by category (dynamic from P0)
category_coverage:
  "{CATEGORY}":
    gaps: "{count}"
    addressed: "{count}"
    partial: "{count}"
    unaddressed: "{count}"
    coverage: "{%}"
  # ... for each active category
```

---

**End of P7-VALIDATION-CROISEE.md**
