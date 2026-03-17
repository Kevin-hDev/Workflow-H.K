# Phase 8: Final Defensive Report

**Type** : Synthesis and report generation
**Executor** : LLM
**Knowledge** : data/shared/references/ref-cve-catalog.md (if available)
**Input** : P7_cross_validation.yaml + all P0-P7 YAMLs

---

## EXHAUSTIVENESS DIRECTIVE - MANDATORY

> P8 consolidates ALL the work from phases P0-P7 into actionable reports.
> No code is written — only synthesis reports.
>
> **IMPORTANT** : This skill (defensive-hardening) is the LAST in the security chain.
> The complete order is:
>
> 1. **threat-modeling** — Risk modeling (STRIDE, CWE, CAPEC)
> 2. **adversary-simulation** — Offensive simulation (attacks, exploits, chains)
> 3. **defensive-hardening** — Defensive hardening (THIS SKILL) ← you are here
>
> The final P8 report must mention the position in this chain
> and reference the results of previous skills (if available).

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

> **CRITICAL** : Complete all four steps in sequence and display the result of each step.

---

### REFLECTION - Entry Gate P8

**Objective** : Produce the final defensive report with all protections to integrate, ranked by priority, with a concrete integration guide.

**Display REFLECTION results in this format:**

```
REFLECTION - P8 Entry Gate
================================================

CENTRAL PROBLEM
Generate an actionable defensive report that allows
the dev team to integrate ALL P3-P6 protections
in the right order, with the right code.

Reports are aimed at two audiences:
1. Management / security: executive report
2. Developers: technical integration guide

REPORTS TO GENERATE
1. {PROJECT}-DEFENSIVE-REPORT.md        (main report)
2. {PROJECT}-PROTECTION-INVENTORY.md    (complete catalog)
3. {PROJECT}-CODE-INTEGRATION.md        (technical guide)
4. {PROJECT}-CROSS-VALIDATION.md        (P7 results)

STATISTICS TO CONSOLIDATE
- Detected stack (P0)
- Existing protections (P1)
- Identified gaps (P2)
- Written fixes (P3-P6)
- Written tests (P3-P6)
- Generated code files
- Adversary coverage (P7, if available)

POSITION IN SECURITY CHAIN
This skill is the LAST in the chain:
  threat-modeling → adversary-simulation → **defensive-hardening**
The final report must reference results of previous skills if available.

================================================
STOP CHECK
- All P0-P7 YAMLs accessible? [YES/NO]
- PROJECT name defined? [YES/NO]
- Ready to generate reports? [YES/NO]
================================================
```

**STOP CONDITION** : If any check = NO -> Resolve before continuing

---

### PLANNING - Breakdown into Subtasks

**Display planning in this format:**

```
PLANNING - P8 Subtasks
================================================

| # | Subtask | Source | Output |
|---|---------|--------|--------|
| T1 | Consolidate P0-P7 statistics | All YAMLs | Key figures |
| T2 | Generate main report | Stats + P7 | DEFENSIVE-REPORT.md |
| T3 | Generate protection inventory | P1 PROT + P3-P6 FIX | INVENTORY.md |
| T4 | Generate integration guide | P3-P6 FIX with code | CODE-INTEGRATION.md |
| T4b | Generate CORRECTION-PLAN | P3-P6 FIX by priority | CORRECTION-PLAN.md |
| T5 | Copy cross-validation report | P7 | CROSS-VALIDATION.md |
| T6 | Copy phase reports P0-P7 | reports/ | audit/Defensive_Report/phases/ |
| T7 | Organize final code | code/ by phase | audit/Defensive_Report/code/ |
| T8 | Write final YAML manifest | All | P8_report_manifest.yaml |
| T9 | Verification YAML output | All | defensive_output.yaml |

================================================
```

---

### EXECUTION

---

#### T1: Consolidate Statistics

Read all P0-P7 YAMLs and calculate:

```yaml
statistics:
  phases_completed: 9  # P0-P8
  stack:
    languages: ["{from P0}"]
    frameworks: ["{from P0}"]
    os_targets: ["{from P0}"]
  existing_protections: "{count PROT-xxx from P1}"
  gaps_identified: "{count GAP-xxx from P2}"
  gaps_by_category:
    "{CATEGORY_1}": "{count}"
    "{CATEGORY_2}": "{count}"
    # ... dynamic based on P0 categories
  gaps_by_priority:
    P0_critical: "{count}"
    P1_high: "{count}"
    P2_medium: "{count}"
    P3_low: "{count}"
  fixes_written_p3: "{count}"
  fixes_written_p4: "{count}"
  fixes_written_p5: "{count}"
  fixes_written_p6: "{count}"
  fixes_total: "{sum}"
  tests_written: "{total count}"
  code_files_generated: "{count}"
  coverage_internal: "{%}"
  coverage_adversary: "{% or N/A}"
  estimated_effort_total: "{hours}"
```

---

#### T2: Generate Main Report

**Main report template**:

```markdown
# Defensive Report — {PROJECT}
**Generated on** : {DATE}
**Skill** : defensive-hardening v1.0.0
**Stack** : {from P0 — languages, frameworks, OS}
**Position in chain** : threat-modeling → adversary-simulation → **defensive-hardening** (last)

---

## 1. Executive Summary

| Metric | Before (P1) | After (P3-P6) |
|--------|------------|---------------|
| Global posture | {P1.overall_rating} | {estimate} |
{For each active category: row in table with before/after score}

### Key Figures
- **{n}** existing protections inventoried
- **{n}** hardening points identified including **{P0}** critical P0
- **{n}** code fixes written
- **{n}** associated unit/integration tests
- **{n}** code files generated in audit/Defensive_Report/code/
- **Adversary coverage** : {% or "Not available — adversary report not executed"}
- **Estimated integration effort** : {n} hours

---

## 2. Integration Priority

> Recommended integration order. P0 items must be integrated IMMEDIATELY.

### P0 Integrations — Critical (do this sprint)

| Fix | File | CWE | Effort | Impact if omitted |
|-----|------|-----|--------|------------------|
{For each P0 priority FIX}

### P1 Integrations — High (7 days)

| Fix | File | Effort |
|-----|------|--------|
{For each P1 priority FIX}

### P2 Integrations — Medium (30 days)

| Fix | File | Effort |
|-----|------|--------|
{For each P2 priority FIX}

### P3 Integrations — Backlog

| Fix | File | Effort |
|-----|------|--------|
{For each P3 priority FIX}

---

## 3. Quick Integration Guide

### Step 1: Dependencies to add
[List dependencies by package manager — adapt to language]

### Step 2: Security configuration
[Config files to modify — adapt to framework]

### Step 3: P0 integrations in code
[For each P0 FIX: target file, code BEFORE/AFTER, import to add]

---

## 4. Cross-Validation (P7 Summary)

- Internal coverage: {count} gaps out of {total} addressed ({%})
- Accepted gaps: {count} ({list of refs with reason})
- Adversary coverage: {% or N/A}

---

## 5. Run Tests

[Test commands adapted to project language and framework]

---

## 6. Security Chain

This report is the final deliverable of the security chain:
1. **threat-modeling** : Risk modeling (STRIDE, CWE, CAPEC)
2. **adversary-simulation** : Offensive simulation (attacks, exploits, chains)
3. **defensive-hardening** : Defensive hardening ← **THIS REPORT**

{If threat-modeling results available: reference the report}
{If adversary-simulation results available: reference report + coverage}

---

## 7. Appendices
- Correction plan: `audit/Defensive_Report/correction/CORRECTION-PLAN.md`
- Complete catalog: `audit/Defensive_Report/reports/{PROJECT}-PROTECTION-INVENTORY.md`
- Technical guide: `audit/Defensive_Report/reports/{PROJECT}-CODE-INTEGRATION.md`
- Cross-validation: `audit/Defensive_Report/reports/{PROJECT}-CROSS-VALIDATION.md`
- Code to integrate: `audit/Defensive_Report/code/`
```

---

#### T3: Generate Protection Inventory

**Template**:

```markdown
# Protection Inventory — {PROJECT}

## Existing Protections (P1 — Initial Audit)
| ID | Category | Title | Location | Effectiveness |
|----|----------|-------|----------|--------------|
{For each PROT-xxx from P1}

## Added Protections — P3: Code Hardening
| ID | CWE | Title | Code File | Test |
|----|-----|-------|-----------|------|
{For each FIX-P3-xxx}

## Added Protections — P4: Framework Hardening
| ID | Title | Code File | Test |
|----|-------|-----------|------|
{For each FIX-P4-xxx}

## Added Protections — P5: Network/Crypto Hardening
| ID | Title | Code File | Test |
|----|-------|-----------|------|
{For each FIX-P5-xxx}

## Added Protections — P6: Traps/Deception
| ID | Title | Code File | Test |
|----|-------|-----------|------|
{For each FIX-P6-xxx}
```

---

#### T4: Generate Technical Integration Guide

**Template**:

```markdown
# Code Integration Guide — {PROJECT}

## Pre-requisites
[Language versions, tools, required dependencies — from P0]

## Generated Code Tree
```
audit/Defensive_Report/code/
    code_hardening/           <- P3
    framework_hardening/      <- P4
    network_crypto_hardening/ <- P5
    deception_traps/          <- P6
```

## Integration Instructions per Fix

[For each FIX-xxx:
  - Description of exact target file in the project
  - Insertion method (new file, modification, replacement)
  - Required dependencies
  - Before/after code for modifications
  - Tests to run after integration]
```

---

#### T4b: Generate CORRECTION-PLAN

Write `audit/Defensive_Report/correction/CORRECTION-PLAN.md` — an actionable checklist of all fixes to integrate, ordered by priority.

**Template**:

```markdown
# Correction Plan — {PROJECT}

> Actionable checklist of all defensive fixes to integrate.
> Generated by defensive-hardening on {DATE}.

## Priority P0 — Critical (immediate)

- [ ] **FIX-{NNN}**: {title} — `{target_file}` — Effort: {effort}
  Code: `audit/Defensive_Report/code/{subdir}/fix_{NNN}.ext`
- [ ] ...

## Priority P1 — High (7 days)

- [ ] **FIX-{NNN}**: {title} — `{target_file}` — Effort: {effort}
  Code: `audit/Defensive_Report/code/{subdir}/fix_{NNN}.ext`
- [ ] ...

## Priority P2 — Medium (30 days)

- [ ] **FIX-{NNN}**: {title} — `{target_file}` — Effort: {effort}
- [ ] ...

## Priority P3 — Backlog

- [ ] **FIX-{NNN}**: {title} — `{target_file}` — Effort: {effort}
- [ ] ...

## Summary

| Priority | Count | Estimated Effort |
|----------|-------|-----------------|
| P0 Critical | {n} | {h} hours |
| P1 High | {n} | {h} hours |
| P2 Medium | {n} | {h} hours |
| P3 Backlog | {n} | {h} hours |
| **Total** | **{n}** | **{h} hours** |
```

---

#### T5: Copy Cross-Validation Report

Copy the content of the P7-CROSS-VALIDATION.md report as `{PROJECT}-CROSS-VALIDATION.md`.

---

#### T6 and T7: Organize Final Tree

```
audit/Defensive_Report/
    correction/
        CORRECTION-PLAN.md                     <- Actionable checklist (T4b)
    reports/
        {PROJECT}-DEFENSIVE-REPORT.md          <- Main report (T2)
        {PROJECT}-PROTECTION-INVENTORY.md      <- Catalog (T3)
        {PROJECT}-CODE-INTEGRATION.md          <- Technical guide (T4)
        {PROJECT}-CROSS-VALIDATION.md          <- Validation (P7)
    phases/
        P0-DETECTION.md                        <- Phase report (copy)
        P1-EXISTING-AUDIT.md
        P2-HARDENING-POINTS.md
        P3-CODE-HARDENING.md
        P4-FRAMEWORK-HARDENING.md
        P5-NETWORK-CRYPTO-HARDENING.md
        P6-DECEPTION-TRAPS.md
        P7-CROSS-VALIDATION.md
    code/                                      <- Code to integrate
        code_hardening/
        framework_hardening/
        network_crypto_hardening/
        deception_traps/
```

---

#### T8: Write Final Manifest

Conforms to the P8 contract defined in WORKFLOW.md S3:

```yaml
# P8_report_manifest.yaml
# audit/Defensive_Report/.defender_working/{SESSION_ID}/data/P8_report_manifest.yaml

schema_version: "1.1.0"
phase: 8
generated_at: "{ISO8601}"
input_ref: "P7_cross_validation.yaml"
skill: "defensive-hardening"
skill_version: "1.1.0"
skill_position: "last in chain (threat-modeling → adversary-simulation → defensive-hardening)"

executive_summary:
  project: "{PROJECT}"
  detected_stack: ["{from P0}"]
  total_gaps_identified: "{count}"
  total_fixes_written: "{count}"
  total_tests_written: "{count}"
  adversary_vulns_covered: "{% or N/A}"
  effort_estimate: "{n} development hours"

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
  total_files: "{count}"
  by_phase:
    P3: {fixes: "{count}", tests: "{count}", files: "{count}"}
    P4: {fixes: "{count}", tests: "{count}", files: "{count}"}
    P5: {fixes: "{count}", tests: "{count}", files: "{count}"}
    P6: {fixes: "{count}", tests: "{count}", files: "{count}"}
  dependencies_added:
    - name: "{dep_name}"
      version: "{x.y.z}"
      source: "{package_manager}"

code_delivery:
  directory: "audit/Defensive_Report/code/"
  subdirs:
    - path: "code_hardening/"
      phase: "P3"
      fixes: ["{list of FIX-P3-xxx}"]
    - path: "framework_hardening/"
      phase: "P4"
      fixes: ["{list of FIX-P4-xxx}"]
    - path: "network_crypto_hardening/"
      phase: "P5"
      fixes: ["{list of FIX-P5-xxx}"]
    - path: "deception_traps/"
      phase: "P6"
      fixes: ["{list of FIX-P6-xxx}"]

statistics:
  phases_completed: 9
  coverage:
    gaps_addressed: "{%}"
    adversary_vulns_covered: "{% or N/A}"
    fixes_with_tests: "{%}"
```

---

#### T9: Verification YAML Output

**IMPORTANT** : This output YAML allows an external pipeline (or the threat-modeling skill
in a next cycle) to consume the results of the defensive hardening.

```yaml
# defensive_output.yaml
# Output file for pipeline integration

schema_version: "1.1.0"
skill: "defensive-hardening"
generated_at: "{ISO8601}"
project: "{PROJECT}"
stack: "{complete stack}"

summary:
  total_gaps: "{count}"
  total_addressed: "{count}"
  total_unaddressed: "{count}"
  coverage_internal: "{%}"
  coverage_adversary: "{% or N/A}"
  posture_before: "{rating}"
  posture_after: "{rating}"

chain_position:
  previous_skill: "adversary-simulation"
  current_skill: "defensive-hardening"
  next_skill: null  # Last in chain

report_location: "audit/Defensive_Report/"
```

---

### VALIDATION - Final Check

```
VALIDATION - P8 Check
================================================

| Element verified | Status |
|-----------------|--------|
| All P0-P7 YAMLs read and statistics consolidated? | [OK/FAIL] |
| {PROJECT}-DEFENSIVE-REPORT.md generated (summary + priority table)? | [OK/FAIL] |
| {PROJECT}-PROTECTION-INVENTORY.md generated (complete PROT + FIX)? | [OK/FAIL] |
| {PROJECT}-CODE-INTEGRATION.md generated (tree + instructions)? | [OK/FAIL] |
| {PROJECT}-CROSS-VALIDATION.md generated (P7 copy)? | [OK/FAIL] |
| CORRECTION-PLAN.md generated in audit/Defensive_Report/correction/? | [OK/FAIL] |
| Phase reports P0-P7 copied to audit/Defensive_Report/phases/? | [OK/FAIL] |
| Code organized in audit/Defensive_Report/code/ (4 subdirectories)? | [OK/FAIL] |
| P8_report_manifest.yaml written and valid? | [OK/FAIL] |
| defensive_output.yaml written (pipeline output)? | [OK/FAIL] |
| Consistent statistics (total_gaps == addressed + unaddressed)? | [OK/FAIL] |
| Position in chain mentioned (last skill)? | [OK/FAIL] |
| PROJECT name in uppercase and < 30 chars? | [OK/FAIL] |

COMPLETION GATE
- All checks passed? [YES/NO]
================================================

==========================================================================
DEFENSIVE HARDENING COMPLETE
==========================================================================
This skill is the LAST in the security chain:
  threat-modeling → adversary-simulation → **defensive-hardening**

Reports and code in : audit/Defensive_Report/
Main report          : audit/Defensive_Report/reports/{PROJECT}-DEFENSIVE-REPORT.md
Correction plan      : audit/Defensive_Report/correction/CORRECTION-PLAN.md
Code to integrate    : audit/Defensive_Report/code/
Integration guide    : audit/Defensive_Report/reports/{PROJECT}-CODE-INTEGRATION.md
Cross-validation     : audit/Defensive_Report/reports/{PROJECT}-CROSS-VALIDATION.md
Pipeline output      : audit/Defensive_Report/defensive_output.yaml
==========================================================================
```

---

**End of P8-RAPPORT-DEFENSIF.md**
