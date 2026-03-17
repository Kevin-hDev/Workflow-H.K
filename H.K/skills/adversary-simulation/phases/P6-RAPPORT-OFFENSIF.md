# Phase 6: Offensive Report

**Type** : Synthesis and report generation
**Executor** : LLM
**Input** : P5_attack_chains.yaml (+ all previous YAML files for synthesis)
**DATA** : data/shared/references/ref-cve-catalog.md (to enrich the report with CVEs)

---

## EXHAUSTIVENESS DIRECTIVE - MANDATORY

> Load relevant CVE reference DATA for the stack:
> - `data/shared/references/ref-cve-catalog.md`
> - `data/offensive/*/atk-cve-reference.md` (if available for the stack)
>
> Read the 7 YAML files in order before writing anything:
> P0_detection.yaml -> P1_reconnaissance.yaml -> P2_data_flows.yaml
> -> P3_vulnerabilities.yaml -> P4_attack_scenarios.yaml -> P5_attack_chains.yaml
>
> The 4 reports to generate must be consistent with each other:
> - Same VULN counts
> - Same ATK IDs referenced
> - Same CHAIN IDs referenced
> - Identical statistics across all documents
>
> The project name `{PROJECT}` comes from P0_detection.yaml / _session_meta.yaml.

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

---

### REFLECTION - P6 Entry Gate

**Objective** : Produce the complete final offensive report. Synthesize all previous phases into a set of professional reports, prioritized, with all evidence and fix prioritization recommendations.

```
REFLECTION - P6 Entry Gate
================================================

CENTRAL PROBLEM
Generate a complete offensive report that synthesizes all
findings into a set of actionable documents for the
development team of project {PROJECT}.

UPSTREAM DATA (all phases)
| Phase | Metric | Value |
|-------|--------|-------|
| P0 | Detected stack | {P0.detected_stack} |
| P0 | Active categories | {P0.attack_categories_active.count} |
| P1 | Identified targets | {P1.target_inventory.count} |
| P1 | Entry points | {P1.entry_points.count} |
| P2 | Data flows | {P2.data_flows.count} |
| P2 | Identified secrets | {P2.secrets_in_transit.count} |
| P2 | Trust boundaries | {P2.trust_boundaries.count} |
| P3 | Total vulnerabilities | {P3.summary.total} |
| P3 | Critical | {P3.summary.by_severity.CRITICAL} |
| P4 | Attack scenarios | {P4.scenarios.count} |
| P5 | Attack chains | {P5.chains.count} |

REPORTS TO GENERATE
1. {PROJECT}-OFFENSIVE-REPORT.md (main report)
2. {PROJECT}-VULNERABILITY-INVENTORY.md (complete catalog)
3. {PROJECT}-ATTACK-SCENARIOS.md (detailed scenarios)
4. {PROJECT}-ATTACK-CHAINS.md (multi-step chains)

================================================
STOP CHECK
- All P0-P5 YAML files accessible? [YES/NO]
- CVE DATA loaded? [YES/NO]
- data/shared/references/ref-cve-catalog.md READ? [YES/NO]
- Ready to generate reports? [YES/NO]
================================================
```

---

### PLANNING - Breakdown

```
PLANNING - P6 Sub-tasks
================================================

| # | Sub-task | Expected output |
|---|----------|-----------------|
| T1 | Read all P0-P5 YAML files | Consolidated data |
| T2 | Build executive summary | Summary for decision makers |
| T3 | Generate vulnerability inventory | {PROJECT}-VULNERABILITY-INVENTORY.md |
| T4 | Generate attack scenarios | {PROJECT}-ATTACK-SCENARIOS.md |
| T5 | Generate attack chains | {PROJECT}-ATTACK-CHAINS.md |
| T6 | Generate main report | {PROJECT}-OFFENSIVE-REPORT.md |
| T7 | Copy phase reports | P0-P5 from reports/ |
| T8 | Generate correction plan + chain output | CORRECTION-PLAN.md + adversary_output.yaml |
| T9 | Write manifest | P6_report_manifest.yaml |
| T10 | Final verification | All reports consistent |

================================================
```

---

### EXECUTION

#### T1: Data Consolidation

Read all YAML files in order:
1. `.attacker_working/{SESSION_ID}/data/P0_detection.yaml`
2. `.attacker_working/{SESSION_ID}/data/P1_reconnaissance.yaml`
3. `.attacker_working/{SESSION_ID}/data/P2_data_flows.yaml`
4. `.attacker_working/{SESSION_ID}/data/P3_vulnerabilities.yaml`
5. `.attacker_working/{SESSION_ID}/data/P4_attack_scenarios.yaml`
6. `.attacker_working/{SESSION_ID}/data/P5_attack_chains.yaml`

Build global statistics:
```yaml
statistics:
  phases_completed: 7
  detected_stack: []           # from P0
  total_entities:
    targets: {count from P1}
    entry_points: {count from P1}
    data_flows: {count from P2}
    secrets: {count from P2}
    trust_boundaries: {count from P2}
    vulnerabilities: {count from P3}
    scenarios: {count from P4}
    chains: {count from P5}
  severity_distribution:
    CRITICAL: {n}
    HIGH: {n}
    MEDIUM: {n}
    LOW: {n}
    INFO: {n}
  category_distribution: {}    # dynamic per active categories
  coverage:
    vulns_with_evidence: "{percentage}%"
    vulns_with_scenario: "{percentage}%"
    scenarios_in_chains: "{percentage}%"
```

#### T2: Executive Summary

Write a 1-page summary for decision makers:

```markdown
## Executive Summary

**Project**: {project name}
**Detected stack**: {languages, frameworks, OS — from P0}
**Date**: {analysis date}
**Overall risk level**: CRITICAL|HIGH|MEDIUM|LOW

### Key Figures
- {n} vulnerabilities discovered ({n} critical, {n} high, {n} medium)
- {n} concrete attack scenarios built
- {n} multi-step attack chains identified
- {n} components analyzed

### Top 3 Risks
1. **[Risk 1]**: {description of the most critical chain or vulnerability}
   Impact: {concrete consequence}
2. **[Risk 2]**: {description}
   Impact: {consequence}
3. **[Risk 3]**: {description}
   Impact: {consequence}

### Most Dangerous Attack Chain
{CHAIN-xxx}: {title}
- **Initial vector**: {entry point}
- **Required access**: {initial access level}
- **Final impact**: {ultimate consequence}
- **Detection difficulty**: {level}

### Main Recommendation
{most urgent action — framed in business impact terms}
```

#### T3: Vulnerability Inventory

Generate `{PROJECT}-VULNERABILITY-INVENTORY.md`:

```markdown
# Vulnerability Inventory - {PROJECT}

**Stack**: {from P0}
**Analysis date**: {date}
**Analyzer**: adversary-simulation v1.0.0

## Severity Matrix
| Severity | Count | Percentage |
|----------|-------|------------|
| CRITICAL | {n} | {%} |
| HIGH | {n} | {%} |
| MEDIUM | {n} | {%} |
| LOW | {n} | {%} |
| INFO | {n} | {%} |

## Vulnerabilities by Category
| Category | Description | Count |
|----------|-------------|-------|
[Dynamic per P0 active categories]

## Vulnerability Details

### VULN-001: {title}
- **Severity**: {level}
- **Category**: {category code}
- **CVSS**: {score}
- **CWE**: CWE-{xxx}
- **CVE**: {if applicable, from DATA ref-cve-catalog.md}
- **File**: {path:line}
- **Description**: {text}
- **Vulnerable code**:
```{language}
{code}
```
- **Impact**: {description}
- **Exploitability**: Access={...} Complexity={...} Interaction={...}
- **Affected P2 flows**: DF-xxx
- **Affected P2 secrets**: SEC-xxx

[Repeat for each VULN, ordered by severity then category]
```

#### T4: Attack Scenarios

Generate `{PROJECT}-ATTACK-SCENARIOS.md` with all ATK-xxx detailed from P4.

```markdown
# Attack Scenarios - {PROJECT}

## Critical Scenarios

### ATK-001: {title}
**Category**: {code}
**Profile**: {who}
**Exploited VULN**: VULN-xxx, VULN-yyy
**Preconditions**:
- {condition 1}

**Steps**:
1. {action} -> `{command}` -> {result}
2. ...

**Impact**: {what the attacker gains}
**Estimated time**: {duration}
**Tools**: {list}
**Detection**: {easy|moderate|difficult|invisible}

[Repeat for each ATK, sorted by severity]

## Coverage Matrix
| ID | Severity | Category | Source VULN | Tools | Time |
|----|---------|----------|-------------|-------|------|
```

#### T5: Attack Chains

Generate `{PROJECT}-ATTACK-CHAINS.md` with all CHAIN-xxx and their ASCII diagrams.

```markdown
# Attack Chains - {PROJECT}

## Critical Chains

### CHAIN-001: {title}
**Type**: {cross_boundary|privilege_escalation|persistence|stealth}
**Complexity**: {level}
**Entry point**: {initial entry point}
**Boundaries crossed**: TB-xxx, TB-yyy

```
[ASCII diagram of the chain adapted to the project]
```

**Kill Chain**:
| Phase | Description | Steps |
|-------|-------------|-------|

**Referenced ATK**: ATK-xxx, ATK-yyy
**Total impact**: {description}
**Estimated time**: {complete duration}
**Detection**: {level}

[Repeat for each chain, sorted by severity]
```

#### T6: Main Report

Generate `{PROJECT}-OFFENSIVE-REPORT.md`:

```markdown
# Offensive Report - {PROJECT}

## 1. Executive Summary
[T2 - 1-page summary]

## 2. Methodology
The offensive simulation was conducted in 7 phases:
0. **Detection**: Automatic project scan, stack detection, offensive DATA loading
1. **Reconnaissance**: Attack surface and entry point identification
2. **Flow mapping**: Data flow tracing and secrets in transit
3. **Vulnerability hunting**: Source code analysis with loaded offensive DATA
4. **Attack construction**: Concrete exploitation scenarios per vulnerability
5. **Attack chains**: Combining vulnerabilities into multi-step sequences
6. **Report**: Synthesis, prioritization, and recommendations

## 3. Detected Stack
[P0 data: languages, frameworks, OS, critical dependencies]

## 4. Attack Surface
[P1 data: targets, entry points, attack matrix]

## 5. Critical Data Flows
[P2 data: secrets in transit, trust boundaries]

## 6. Discovered Vulnerabilities
[P3 summary: top vulnerabilities by severity with evidence]

## 7. Attack Scenarios
[P4 summary: top scenarios with steps]

## 8. Attack Chains
[P5 summary: top chains with diagrams]

## 9. Risk Matrix

| | Low Impact | Medium Impact | High Impact | Critical Impact |
|---|-----------|--------------|------------|----------------|
| High Probability | ... | ... | ... | ... |
| Medium Probability | ... | ... | ... | ... |
| Low Probability | ... | ... | ... | ... |

## 10. Fix Prioritization
| Priority | Vulnerability/Vector | Action | Effort | Blocks which chain |
|----------|---------------------|--------|--------|-------------------|
| P0 - Immediate | ... | ... | ... | CHAIN-xxx |
| P1 - 7 days | ... | ... | ... | ATK-xxx |
| P2 - 30 days | ... | ... | ... | ... |
| P3 - Backlog | ... | ... | ... | ... |

## 11. Appendices
- Complete vulnerability inventory: see {PROJECT}-VULNERABILITY-INVENTORY.md
- Detailed scenarios: see {PROJECT}-ATTACK-SCENARIOS.md
- Complete attack chains: see {PROJECT}-ATTACK-CHAINS.md
```

#### T7: Copy Phase Reports

Copy phase reports from `.attacker_working/{SESSION_ID}/reports/` to `audit/Offensive_Report/phases/`:
- P0-DETECTION.md
- P1-RECONNAISSANCE.md
- P2-CARTOGRAPHIE-FLUX.md
- P3-CHASSE-FAILLES.md
- P4-CONSTRUCTION-ATTAQUES.md
- P5-CHAINES-ATTAQUE.md

#### T8: Chain Output + Correction Plan

> **CRITICAL**: This step produces the BRIDGE between the offensive simulation and the
> defensive-hardening skill, plus an actionable correction plan for the development team.

##### T8a: Generate CORRECTION-PLAN.md

Generate `audit/Offensive_Report/correction/CORRECTION-PLAN.md`:

```markdown
# Correction Plan - {PROJECT}

## Priority P0 — Immediate (blocks critical chains)
- [ ] **VULN-xxx**: {title} — {file:line}
  - Fix: {recommended fix}
  - Breaks chains: CHAIN-xxx, CHAIN-yyy

## Priority P1 — 7 days
- [ ] **VULN-xxx**: {title} — {file:line}
  - Fix: {recommended fix}

## Priority P2 — 30 days
- [ ] **VULN-xxx**: {title} — {file:line}
  - Fix: {recommended fix}

## Priority P3 — Backlog
- [ ] **VULN-xxx**: {title} — {file:line}
  - Fix: {recommended fix}
```

##### T8b: Generate adversary_output.yaml

Generate `audit/Offensive_Report/chain/adversary_output.yaml`:

```yaml
# adversary_output.yaml
# Structured output of the offensive simulation
# Usable as INPUT by the defensive-hardening skill
schema_version: "1.1.0"
generated_by: "adversary-simulation"
generated_at: "ISO8601"
project: "{PROJECT}"
detected_stack:
  languages: []       # from P0
  frameworks: []      # from P0
  os_targets: []      # from P0

# Risk summary for defensive hardening
risk_summary:
  risk_level: "CRITICAL|HIGH|MEDIUM|LOW"
  total_vulnerabilities: {n}
  total_scenarios: {n}
  total_chains: {n}
  severity_distribution:
    CRITICAL: {n}
    HIGH: {n}
    MEDIUM: {n}
    LOW: {n}

# Vulnerabilities to fix (sorted by priority)
# Defensive hardening uses this list to generate countermeasures
vulnerabilities_to_fix:
  - id: "VULN-xxx"
    title: "Vulnerability title"
    category: "CATEGORY_CODE"
    severity: "CRITICAL"
    cvss: 9.8
    cwe: "CWE-xxx"
    file: "path/file.ext"
    line: 47
    fix_priority: "P0|P1|P2|P3"
    exploited_in_scenarios: ["ATK-xxx"]
    exploited_in_chains: ["CHAIN-xxx"]
    recommended_fix: "Description of the recommended fix"

# Attack chains to break (sorted by severity)
# Defensive hardening identifies weak links to strengthen
chains_to_break:
  - id: "CHAIN-xxx"
    title: "Chain title"
    total_severity: "CRITICAL"
    boundaries_crossed: ["TB-xxx"]
    weakest_link: "ATK-xxx"
    weakest_link_description: "The easiest link to break in this chain"
    recommended_break_point: "Description of where to break the chain"

# Active attack categories and offensive DATA used
# Defensive hardening loads the corresponding defensive DATA
attack_categories_active:
  - code: "CATEGORY_CODE"
    vulnerability_count: {n}
    scenario_count: {n}
    chain_count: {n}
    data_files_used: ["attacks/xxx/file.md"]

# Top 5 most impactful fixes
# Each fix breaks N chains and fixes M vulnerabilities
top_fixes:
  - action: "Fix description"
    effort: "estimated duration"
    fixes_vulns: ["VULN-xxx", "VULN-yyy"]
    breaks_chains: ["CHAIN-xxx", "CHAIN-yyy"]
    impact: "Number of vulnerabilities fixed and chains broken"

# Paths to detailed reports
report_paths:
  main_report: "{PROJECT}-OFFENSIVE-REPORT.md"
  vulnerability_inventory: "{PROJECT}-VULNERABILITY-INVENTORY.md"
  attack_scenarios: "{PROJECT}-ATTACK-SCENARIOS.md"
  attack_chains: "{PROJECT}-ATTACK-CHAINS.md"
```

> **USAGE BY DEFENSIVE HARDENING**:
> 1. Read `adversary_output.yaml`
> 2. Load defensive DATA corresponding to `attack_categories_active`
> 3. Generate countermeasures for each `vulnerabilities_to_fix`
> 4. Identify weak links in `chains_to_break`
> 5. Prioritize `top_fixes` to maximize defensive impact

#### T9: Write Manifest

**Full YAML contract** (see WORKFLOW.md S3 - P6):

```yaml
schema_version: "1.1.0"
phase: 6
generated_at: "ISO8601"
input_ref: "P5_attack_chains.yaml"

executive_summary:
  project: "{PROJECT}"
  detected_stack: []       # from P0
  total_vulnerabilities: {n}
  total_scenarios: {n}
  total_chains: {n}
  risk_level: "CRITICAL|HIGH|MEDIUM|LOW"
  top_3_risks:
    - "Risk 1 (CHAIN-xxx)"
    - "Risk 2 (VULN-xxx)"
    - "Risk 3 (VULN-xxx)"

generated_reports:
  - file: "{PROJECT}-OFFENSIVE-REPORT.md"
    type: "main_report"
  - file: "{PROJECT}-VULNERABILITY-INVENTORY.md"
    type: "vulnerability_catalog"
  - file: "{PROJECT}-ATTACK-SCENARIOS.md"
    type: "attack_scenarios"
  - file: "{PROJECT}-ATTACK-CHAINS.md"
    type: "attack_chains"
  - file: "correction/CORRECTION-PLAN.md"
    type: "correction_plan"
  - file: "chain/adversary_output.yaml"
    type: "chain_output"
  - file: "P0-DETECTION.md"
    type: "phase_report"
  - file: "P1-RECONNAISSANCE.md"
    type: "phase_report"
  - file: "P2-CARTOGRAPHIE-FLUX.md"
    type: "phase_report"
  - file: "P3-CHASSE-FAILLES.md"
    type: "phase_report"
  - file: "P4-CONSTRUCTION-ATTAQUES.md"
    type: "phase_report"
  - file: "P5-CHAINES-ATTAQUE.md"
    type: "phase_report"

statistics:
  phases_completed: 7
  total_entities:
    targets: {n}
    entry_points: {n}
    data_flows: {n}
    secrets: {n}
    trust_boundaries: {n}
    vulnerabilities: {n}
    scenarios: {n}
    chains: {n}
  coverage:
    vulns_with_evidence: "{%}"
    vulns_with_scenario: "{%}"
    scenarios_in_chains: "{%}"

correction_plan:
  file: "correction/CORRECTION-PLAN.md"
  description: "Actionable checklist of fixes prioritized by impact"
chain_output:
  file: "chain/adversary_output.yaml"
  description: "Structured summary for the defensive-hardening skill"
```

**Writing order** (CRITICAL):
1. **YAML** : `.attacker_working/{SESSION_ID}/data/P6_report_manifest.yaml`
2. **Reports** : All files in `audit/Offensive_Report/reports/`
3. **Phase reports** : All files in `audit/Offensive_Report/phases/`
4. **Correction plan** : `audit/Offensive_Report/correction/CORRECTION-PLAN.md`
5. **Chain output** : `audit/Offensive_Report/chain/adversary_output.yaml`

---

### VALIDATION - Final Check

```
VALIDATION - P6 Check
================================================

| Checked element | Status |
|-----------------|--------|
| All P0-P5 YAML files read? | [OK/FAIL] |
| Executive summary written? | [OK/FAIL] |
| {PROJECT}-OFFENSIVE-REPORT.md generated? | [OK/FAIL] |
| {PROJECT}-VULNERABILITY-INVENTORY.md generated? | [OK/FAIL] |
| {PROJECT}-ATTACK-SCENARIOS.md generated? | [OK/FAIL] |
| {PROJECT}-ATTACK-CHAINS.md generated? | [OK/FAIL] |
| Phase reports copied (P0-P5)? | [OK/FAIL] |
| CORRECTION-PLAN.md generated? | [OK/FAIL] |
| adversary_output.yaml generated in chain/? | [OK/FAIL] |
| P6_report_manifest.yaml written? | [OK/FAIL] |
| Statistics consistent with YAML files? | [OK/FAIL] |
| All reports listed in the manifest? | [OK/FAIL] |
| Counts consistent across all reports? | [OK/FAIL] |
| Fix prioritization present? | [OK/FAIL] |
| Defensive hardening output complete and usable? | [OK/FAIL] |

COMPLETION GATE
- All checks passed? [YES/NO]
- Offensive simulation COMPLETE? [YES/NO]
================================================

==========================================================
OFFENSIVE SIMULATION COMPLETE
==========================================================
Stack analyzed: {from P0}
Reports available in: audit/Offensive_Report/
Main report: {PROJECT}-OFFENSIVE-REPORT.md
Correction plan: audit/Offensive_Report/correction/CORRECTION-PLAN.md
Chain output: audit/Offensive_Report/chain/adversary_output.yaml
Next in chain: defensive-hardening (read chain/adversary_output.yaml)
==========================================================
```

---

**End of P6-RAPPORT-OFFENSIF.md**
