# Phase 1: Reconnaissance

**Type** : Exploratory
**Executor** : LLM + Code analysis
**Knowledge** : Offensive DATA loaded in P0 (attacks/ + exploits/)
**Input** : P0_detection.yaml

---

## EXHAUSTIVENESS DIRECTIVE - MANDATORY

> Before any execution, load the offensive DATA files selected in P0
> (listed in `P0_detection.yaml.loaded_data.attack_files` and `exploit_files`).
>
> Active attack categories are in `P0_detection.yaml.attack_categories_active`.
> Only these categories guide reconnaissance — no hardcoded categories.
>
> Each loaded DATA file must inform the discovery of entry points and targets.
> No loaded file may be ignored.

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

> **CRITICAL** : Complete the four steps in sequence and display the result of each step.

---

### REFLECTION - P1 Entry Gate

**Objective** : P1 depends on P0. Use the detected stack and loaded DATA to explore the project from an attacker's perspective targeting THIS specific stack.

**Display REFLECTION results in this format:**

```
REFLECTION - P1 Entry Gate
================================================

CENTRAL PROBLEM
Fully discover the project's architecture, components,
dependencies and attack surfaces using the offensive DATA
loaded in P0 to guide the search.

KNOWN CONTEXT (from P0)
| Metric | Value | Source |
|--------|-------|--------|
| Project path | {P0.project_path} | P0_detection.yaml |
| Languages | {P0.detected_stack.languages} | P0 |
| Frameworks | {P0.detected_stack.frameworks} | P0 |
| Target OS | {P0.detected_stack.os_targets} | P0 |
| Active categories | {P0.attack_categories_active[].code} | P0 |
| DATA loaded | {P0.loaded_data.attack_files.count} files | P0 |

UNKNOWNS (to discover in P1)
- Internal project architecture (modules, layers, components)
- Exposed entry points (APIs, IPC, CLI, files, network)
- Dependencies with known vulnerabilities
- Secret storage mechanisms
- Exposure of each security-sensitive component
- Code organization around components detected in P0

RISKS
- Incomplete entry point scan if categories are poorly defined
- Dependencies not identified in lockfiles
- Underestimated attack surface on secondary components

================================================
STOP CHECK
- P0_detection.yaml read and valid? [YES/NO]
- Offensive DATA loaded? [YES/NO]
- Offensive DATA files from P0.loaded_data.attack_files READ (not just listed)? [YES/NO]
- Ready to proceed to PLANNING? [YES/NO]
================================================
```

**STOP CONDITION** : If any check = NO -> Resolve before continuing

---

### PLANNING - Sub-task Breakdown

**Step 1: Validate P0 input** (BLOCKING)
```bash
# Verify that the project exists and P0 has been completed
ls {project_path}
cat .attacker_working/{SESSION_ID}/data/P0_detection.yaml
```

**Step 2: Display the sub-task table** (MANDATORY)

```
PLANNING - P1 Sub-tasks
================================================

| # | Sub-task | Expected output |
|---|----------|-----------------|
| T1 | Scan project structure | Directory and file tree |
| T2 | Identify technical stack in detail | Versions, features, security notes |
| T3 | Analyze critical dependencies | Deps with CVEs and attack relevance |
| T4 | Map entry points | List of EP-xxx by active category |
| T5 | Evaluate attack surface | Matrix by active category |
| T6 | Identify priority targets | List of TGT-xxx with criticality |
| T7 | Write final output | P1_reconnaissance.yaml + report |

PLANNING CHECK
- Sub-tasks broken down? [YES/NO]
- Ready to execute? [YES/NO]
================================================
```

**Step 3: Create tasks via TaskCreate** (MANDATORY)

---

### EXECUTION

For each sub-task:
1. `TaskUpdate(status: "in_progress")`
2. Implement the sub-task
3. Verify: does the output match expectations?
4. If verification ok: `TaskUpdate(status: "completed")` -> Next sub-task
5. If failure: Diagnose -> Fix -> Retry (max 3x)

#### T1: Scan Project Structure

Scan the tree filtering based on languages detected in P0:

```bash
# Extensions to scan: build dynamically based on P0.detected_stack.languages
# Example for Rust+TypeScript: "*.rs", "*.ts", "*.tsx", "*.toml", "*.json"
# Example for Python+Go: "*.py", "*.go", "*.toml", "*.yaml"

find {project_path} -type f \( \
  # Insert extensions corresponding to languages detected in P0
  -name "*.{ext1}" -o -name "*.{ext2}" -o -name "*.{ext3}" \
\) \
  ! -path "*/node_modules/*" \
  ! -path "*/target/*" \
  ! -path "*/.git/*" \
  ! -path "*/__pycache__/*" \
  ! -path "*/venv/*" \
  ! -path "*/.venv/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  | head -500

# Count files by type
find {project_path} -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/target/*" \
  ! -path "*/.git/*" \
  | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -20
```

#### T2: Identify Technical Stack in Detail

Analyze config files found in P0 (`P0.detected_stack.config_files_found`):

For each config file:
- Read the full content
- Extract exact dependency versions
- Identify enabled features/plugins
- Note security-relevant configurations

For each dependency, note:
- Exact version or range
- Whether a public security audit exists
- Known CVEs (cross-reference with `atk-cve-reference.md` DATA loaded in P0)
- Attack relevance (CRITICAL / HIGH / MEDIUM / LOW)

#### T3: Analyze Critical Dependencies

Cross-reference found dependencies with offensive DATA loaded in P0:
- `atk-cve-reference.md` (if loaded)
- `atk-supply-chain*.md` (if loaded)
- `ref-cve-catalog.md` (if loaded)

For each critical dependency:
```yaml
- name: "dependency_name"
  version: "x.y.z"
  type: "package_manager"  # cargo, npm, pip, go, maven, etc.
  security_audit: true|false
  known_cves: []
  attack_relevance: "CRITICAL|HIGH|MEDIUM|LOW"
  reason: "Justification for criticality"
```

Run available audits based on the detected package manager:
```bash
# Based on P0.detected_stack.package_managers:
# If cargo : cargo audit 2>/dev/null || echo "cargo-audit not installed"
# If npm   : npm audit --json 2>/dev/null || echo "npm not available"
# If pip   : pip-audit 2>/dev/null || echo "pip-audit not available"
# If go    : govulncheck ./... 2>/dev/null || echo "govulncheck not available"
```

#### T4: Map Entry Points

For each active attack category (from `P0.attack_categories_active`), scan the code with corresponding patterns extracted from loaded offensive DATA.

**Method** : For each active category, consult the corresponding DATA file (e.g.: `atk-tauri-ipc-attacks.md` for IPC) and extract code patterns to search for.

**Dynamic pattern table** (built from P0 + DATA):

| Active category | What to look for | DATA source |
|-----------------|-----------------|-------------|
| IPC | Exposed commands, handlers, channels | Loaded IPC DATA |
| XSS | Unsanitized HTML rendering, innerHTML, CSP | Loaded XSS DATA |
| SUBPROCESS | Process launching, exec, spawn, Command | Loaded subprocess DATA |
| LLM | AI API calls, prompts, completions | Loaded LLM DATA |
| INJECTION | SQL, NoSQL queries, templates, ORM | Loaded injection DATA |
| NET | HTTP requests, WebSocket, API calls | Loaded network DATA |
| CRYPTO | Encryption, hashing, keyring, secrets | Loaded crypto DATA |
| PRIVESC | Privilege elevation, sudo, pkexec, UAC | Loaded privesc DATA |
| AUTH_BYPASS | Auth, JWT, session, OAuth, IDOR | Loaded auth DATA |
| SUPPLY | Dependencies, lockfiles, build scripts | Loaded supply chain DATA |
| COMMS | External tokens, webhooks, bots | Loaded comms DATA |
| DESERIALIZATION | Pickle, JSON.parse, YAML.load, XXE | Loaded deserialization DATA |
| SSRF | Controllable URLs, server-side requests | Loaded SSRF DATA |
| DECEPTION | Anti-debug, obfuscation, binary | Loaded deception DATA |

For each entry point found:
```yaml
- id: EP-001
  type: "entry_type"           # Dynamic per category
  location: "path/file:line"
  protocol: "protocol_used"    # IPC, HTTP, stdin/stdout, SQL, etc.
  authentication: "mechanism"  # none, api_key, jwt, session, etc.
  exposure: "exposure_level"   # webview, localhost, internet, local_fs, etc.
  data_handled: ["type1", "type2"]
  attack_notes: "Offensive notes from loaded DATA"
```

#### T5: Evaluate Attack Surface

Build the attack surface matrix with ONLY the active categories detected in P0:

```yaml
attack_surface:
  # For each category active in P0.attack_categories_active:
  {category_code}:
    components: []          # Affected components
    entry_points_count: 0   # Number of EP-xxx in this category
    exposure_level: ""      # Overall exposure assessment
    data_files_ref: []      # Offensive DATA used for the analysis
    notes: ""               # Attacker observations

  # Sections always present (cross-category):
  network:
    protocols: []
    external_apis: []
  storage:
    sensitive_stores: []
  platform:
    targets: []             # from P0.detected_stack.os_targets
  supply_chain:
    lockfiles_present: []
    audit_results: {}
```

#### T6: Identify Priority Targets

Rank components by criticality from the attacker's perspective.
Attack categories associated come from P0's active categories.

For each target:
```yaml
- id: TGT-001
  name: "Component name"
  type: "process|webview|subprocess|ipc_channel|storage|network_service|credential_store|api_endpoint"
  files: ["path/to/files"]
  security_level: "critical|high|medium|low"
  attack_categories: []   # Applicable active categories (from P0)
  why_target: "Offensive justification — why an attacker would target this component"
```

#### T7: Write Final Output

**Writing order** (CRITICAL):
1. **YAML first** : `.attacker_working/{SESSION_ID}/data/P1_reconnaissance.yaml`
2. **MD second** : `.attacker_working/{SESSION_ID}/reports/P1-RECONNAISSANCE.md`

The YAML must follow the contract defined in WORKFLOW.md S3 (P1).

---

### VALIDATION - Completeness Check

**Display VALIDATION results in this format:**

```
VALIDATION - P1 Check
================================================

| Checked element | Status |
|-----------------|--------|
| Project structure scanned? | [OK/FAIL] |
| Technical stack identified in detail? | [OK/FAIL] |
| Critical dependencies analyzed? | [OK/FAIL] |
| All entry points mapped? | [OK/FAIL] |
| All active categories from P0 covered? | [OK/FAIL] |
| Attack surface evaluated? | [OK/FAIL] |
| Priority targets identified? | [OK/FAIL] |
| P1_reconnaissance.yaml written and valid? | [OK/FAIL] |
| P1-RECONNAISSANCE.md report written? | [OK/FAIL] |
| target_inventory not empty? | [OK/FAIL] |
| entry_points not empty? | [OK/FAIL] |
| attack_surface present? | [OK/FAIL] |

COMPLETION GATE
- All checks passed? [YES/NO]
- Ready to enter P2? [YES/NO]
================================================
```

---

## P1 Report Template

```markdown
# P1 - Reconnaissance Report

## Summary
[5-line summary: architecture, critical components, active categories, exposure]

## Technical Stack
[Table of technologies, versions, security notes]
| Component | Version | Config file | Security notes |
|-----------|---------|-------------|----------------|

## Identified Entry Points
[EP-xxx table with type, location, exposure]
| ID | Type | Location | Protocol | Exposure | Data |
|----|------|----------|----------|----------|------|

## Attack Surface
[Matrix by active category — ONLY categories from P0]
| Category | Components | Entry points | Assessment |
|----------|-----------|--------------|-----------|

## Priority Targets
[TGT-xxx list ordered by criticality]
| ID | Name | Type | Security | Categories | Justification |
|----|------|------|----------|------------|---------------|

## Attacker Observations
[Notes in "hacker" mode — what catches the eye?]
[Which components seem least protected?]
[Do the dependencies have known CVEs?]
[Where are the most exposed entry points?]
[Where would the attack start?]
```

---

**End of P1-RECONNAISSANCE.md**
