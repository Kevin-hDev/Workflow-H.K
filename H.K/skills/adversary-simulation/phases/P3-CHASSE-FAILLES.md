# Phase 3: Vulnerability Hunting

**Type** : Deep analytical
**Executor** : LLM + Line-by-line code analysis
**Knowledge** : Offensive DATA loaded in P0 (reload if new surfaces discovered in P1-P2)
**Input** : P2_data_flows.yaml

---

## EXHAUSTIVENESS DIRECTIVE - MANDATORY

> **CRITICAL** : Reload relevant offensive DATA from `P0_detection.yaml.loaded_data`.
> If phases P1-P2 revealed new surfaces not covered by the initial DATA,
> return to `data/offensive/index-offensive.md` to load additional DATA.
>
> Every active category (from `P0.attack_categories_active`) MUST be scanned.
> Every flow DF-xxx and boundary TB-xxx from P2 MUST be examined.
> No VULN can be dismissed without explicit justification.
>
> For each active category, consult the corresponding DATA file
> and extract the vulnerable code patterns to search for.
> Patterns are NOT hardcoded in this phase — they come from the DATA.

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

---

### REFLECTION - P3 Entry Gate

**Objective** : Analyze code line by line using loaded offensive DATA to find ALL exploitable vulnerabilities. This is the most intensive phase — each entry point, each flow, each boundary must be examined.

```
REFLECTION - P3 Entry Gate
================================================

CENTRAL PROBLEM
Systematically scan every file identified in P2 flows
to find all exploitable vulnerabilities, cross-referencing
with offensive DATA loaded in P0.

UPSTREAM DATA (P2)
| Metric | Value |
|--------|-------|
| Data flows | {P2.data_flows.count} |
| Identified secrets | {P2.secrets_in_transit.count} |
| Trust boundaries | {P2.trust_boundaries.count} |

P0 DATA (categories and DATA)
| Metric | Value |
|--------|-------|
| Active categories | {P0.attack_categories_active[].code} |
| Loaded offensive DATA | {P0.loaded_data.attack_files.count} |

HUNTING STRATEGY
For each active category from P0, examine:
1. Corresponding DATA files to extract vulnerable patterns
2. Source code at exposure points identified in P2
3. Applicable CWEs for each pattern
4. Real exploitability in the project context

================================================
STOP CHECK
- P2_data_flows.yaml read and valid? [YES/NO]
- Offensive DATA loaded/reloaded? [YES/NO]
- Offensive DATA files from P0.loaded_data.attack_files READ? [YES/NO]
- Ready to continue? [YES/NO]
================================================
```

---

### PLANNING - Breakdown

Sub-tasks are DYNAMIC — one per active category plus verification and writing tasks.

```
PLANNING - P3 Sub-tasks
================================================

| # | Sub-task | DATA source |
|---|----------|-------------|
| T1..Tn | Hunt vulnerabilities by active category | Corresponding DATA |
| T(n+1) | Verify coverage | All P2 flows covered? |
| T(n+2) | Write final output | P3_vulnerabilities.yaml + report |

NOTE: Create ONE sub-task per P0 active category.
Example with 6 active categories: T1-T6 + T7 (coverage) + T8 (writing)

================================================
```

---

### EXECUTION

#### Systematic Hunting Method

For each active attack category, apply this method:

1. **Load the DATA file** corresponding to `P0.attack_categories_active[].data_files`
2. **Extract the patterns** of vulnerable code documented in the DATA file
3. **For each pattern**:
   a. Search for occurrences in the project source code
   b. If a pattern is found -> Verify it is exploitable in context
   c. If exploitable -> Create a VULN-xxx entry with evidence
4. **Cross-reference with P2 flows** to ensure exposure points are covered

#### T1..Tn: Hunt Vulnerabilities by Active Category

For EACH category in `P0.attack_categories_active`:

1. Read the referenced DATA file (e.g.: `attacks/generic/atk-injection-input.md`)
2. Extract the table of vulnerable patterns with CWEs
3. Scan code for each pattern
4. Document each vulnerability found

**Pattern table** (extracted dynamically from DATA, not hardcoded):

For each category, the DATA file contains tables similar to:
```
| Vulnerable pattern | What to search | CWE |
|-------------------|----------------|-----|
| [extracted from DATA] | [grep pattern] | CWE-xxx |
```

The agent must:
1. Read the DATA file corresponding to the category
2. Extract ALL documented patterns
3. For each pattern, build the grep/search adapted to the project language
4. Scan code and document results

**Language adaptation**: Search patterns must be adapted to the language detected in P0.

Examples of adaptation (ILLUSTRATION, not INSTRUCTION):

| Category | Rust pattern | Python pattern | JavaScript pattern |
|----------|-------------|----------------|-------------------|
| INJECTION | `format!("SELECT...{}")` | `f"SELECT...{}"`, `cursor.execute(query % ...)` | `` `SELECT...${}`  ``, `.query(str + ...)` |
| SUBPROCESS | `Command::new(var)` | `subprocess.run(shell=True)` | `child_process.exec(str)` |
| CRYPTO | `== secret` (non-constant comparison) | `== token` | `=== secret` |
| AUTH_BYPASS | Pattern per framework | `@login_required` missing | middleware absent |

For each vulnerability found:
```yaml
- id: VULN-{seq}
  title: "Short vulnerability description"
  category: "{CATEGORY_CODE}"  # From P0.attack_categories_active
  severity: "CRITICAL|HIGH|MEDIUM|LOW|INFO"
  cvss: 0.0-10.0
  cwe: "CWE-xxx"
  description: >
    Detailed description of the vulnerability and
    its impact in the project context.
  evidence:
    file: "path/to/file.ext"
    line: 42
    code: "the exact vulnerable code"
    issue: "why it is vulnerable"
  flow_refs: ["DF-xxx"]           # Affected P2 flows
  secret_refs: ["SEC-xxx"]        # Affected P2 secrets (if applicable)
  exploitability:
    access_required: "network|local|physical"
    complexity: "low|medium|high"
    user_interaction: "none|required"
    privileges_required: "none|low|high"
  knowledge_ref: "data-source-file.md#section"  # DATA source
```

#### Severity and CVSS Guide

| Severity | CVSS | Criteria |
|----------|------|----------|
| CRITICAL | 9.0-10.0 | Remote code execution, isolation escape, total compromise |
| HIGH | 7.0-8.9 | Unauthorized access, secret theft, privilege escalation |
| MEDIUM | 4.0-6.9 | Partial information leakage, conditional injection |
| LOW | 0.1-3.9 | Limited impact, high prerequisites, theoretical vulnerability |
| INFO | 0.0 | Observation, misconfiguration without direct impact |

#### T(n+1): Coverage Verification

Ensure that:
- Each DF-xxx flow from P2 has been examined for at least one category
- Each SEC-xxx secret from P2 has been examined
- Each TB-xxx boundary from P2 has been examined
- All active categories from P0 have been scanned
- Each loaded DATA file has been used

Coverage matrix:
```
| P2 Flow | Categories scanned | VULN found |
|---------|--------------------|----------:|
| DF-001  | [categories]       | {n}        |
| DF-002  | [categories]       | {n}        |
| ...     | ...                | ...        |
```

DATA matrix:
```
| Loaded DATA file | Patterns extracted | Patterns found | VULN generated |
|------------------|-------------------|----------------|----------------|
| attacks/generic/atk-injection-input.md | {n} | {n} | {n} |
| ...              | ...               | ...            | ...            |
```

#### T(n+2): Write Output

Build the summary:
```yaml
summary:
  total: {total_number_of_VULN}
  by_severity:
    CRITICAL: {n}
    HIGH: {n}
    MEDIUM: {n}
    LOW: {n}
    INFO: {n}
  by_category: {}  # Dynamic per P0 active categories
  # Example:
  # IPC: 3
  # XSS: 5
  # INJECTION: 2
```

**Summary validation**:
- `summary.total` MUST equal `len(vulnerabilities)`
- Sum of `by_severity` MUST equal `summary.total`
- Sum of `by_category` MUST equal `summary.total`

**Writing order** (CRITICAL):
1. **YAML** : `.attacker_working/{SESSION_ID}/data/P3_vulnerabilities.yaml`
2. **MD** : `.attacker_working/{SESSION_ID}/reports/P3-CHASSE-FAILLES.md`

The YAML must follow the contract defined in WORKFLOW.md S3 (P3).

---

### VALIDATION - Completeness Check

```
VALIDATION - P3 Check
================================================

| Checked element | Status |
|-----------------|--------|
| All active categories from P0 scanned? | [OK/FAIL] |
| All loaded DATA files used? | [OK/FAIL] |
| Each VULN has evidence (file:line:code)? | [OK/FAIL] |
| Each VULN has a CWE? | [OK/FAIL] |
| Each VULN has a severity and CVSS? | [OK/FAIL] |
| Each VULN references a knowledge_ref (DATA source)? | [OK/FAIL] |
| summary.total == len(vulnerabilities)? | [OK/FAIL] |
| sum(by_severity) == summary.total? | [OK/FAIL] |
| sum(by_category) == summary.total? | [OK/FAIL] |
| All DF-xxx flows from P2 examined? | [OK/FAIL] |
| All SEC-xxx secrets from P2 examined? | [OK/FAIL] |
| All TB-xxx boundaries from P2 examined? | [OK/FAIL] |
| P3_vulnerabilities.yaml written and valid? | [OK/FAIL] |
| P3-CHASSE-FAILLES.md report written? | [OK/FAIL] |

COMPLETION GATE
- All checks passed? [YES/NO]
- Ready to enter P4? [YES/NO]
================================================
```

---

## P3 Report Template

```markdown
# P3 - Vulnerability Hunting

## Summary
[X vulnerabilities found: Y critical, Z high, ...]
[Distribution by active category]

## Critical Vulnerabilities
[Detail of each CRITICAL vulnerability with code, explanation, impact]

### VULN-001: [Title]
- **Category** : [category_code]
- **CWE** : CWE-xxx
- **CVSS** : x.x
- **File** : path/to/file.ext:line
- **Vulnerable code** :
```{language}
// exact code
```
- **Impact** : [What the attacker gains]
- **Exploitability** : [Required access, complexity, interaction]
- **DATA source** : [DATA file that guided the discovery]

## High Vulnerabilities
[Detail of each HIGH vulnerability]

## Medium Vulnerabilities
[Detail of each MEDIUM vulnerability]

## Low and Informational Vulnerabilities
[Summary of lower-severity vulnerabilities]

## Coverage Matrix
[Table showing which flows/secrets/boundaries were examined]

| P2 Flow | Categories scanned | VULN found |
|---------|--------------------|----------:|

## DATA Coverage
[Which DATA files were used, how many patterns tested]

| DATA file | Patterns | Found | VULN |
|-----------|---------|-------|------|

## Attacker Observations
[Which category has the most critical vulnerabilities?]
[Are the components detected in P0 well protected?]
[Do the sensitive P2 flows have vulnerabilities?]
[What would be the first exploit attempt?]
[Which vulnerabilities could be chained together?]
```

---

**End of P3-CHASSE-FAILLES.md**
