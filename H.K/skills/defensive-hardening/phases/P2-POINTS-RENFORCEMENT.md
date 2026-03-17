# Phase 2: Hardening Points

**Type** : Analytical
**Executor** : LLM + Code analysis
**Knowledge** : All defensive DATA files loaded in P0
**Input** : P1_audit.yaml

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

---

### REFLECTION - Entry Gate P2

**Objective** : For each weakness identified in P1 and for each known protection technique in the defensive DATA, identify the EXACT point in the code where to add the protection. Produce the complete list of gaps to fill. All active categories must be explored.

```
REFLECTION - P2 Entry Gate
================================================

CENTRAL PROBLEM
Identify ALL places in the code that need a protection,
by crossing the P1 audit with the defensive DATA
loaded in P0. Each gap must have a precise location
in the code or a creation instruction.

UPSTREAM DATA (P1)
| Metric | Value |
|--------|-------|
| Existing protections | {P1.existing_protections.count} |
| Global posture | {P1.security_posture.overall_rating} |
| Missing categories | {P1.security_posture.missing_categories} |
| Scores by category | {P1.score_by_category} |

UPSTREAM DATA (P0)
| Metric | Value |
|--------|-------|
| Mode | {P0.adversary_input.mode} |
| Targeted vulnerabilities | {P0.adversary_input.vulnerabilities_found} |
| Active categories | {P0.defense_categories_active} |

================================================
STOP CHECK
- P1_audit.yaml read and valid? [YES/NO]
- All defensive DATA files loaded? [YES/NO]
- Defensive DATA files from P0.loaded_data.defensive_files READ? [YES/NO]
- Ready to continue? [YES/NO]
================================================
```

---

### PLANNING - Breakdown

```
PLANNING - P2 Subtasks
================================================

| # | Subtask | DATA source | Target phase |
|---|---------|------------|--------------|
| T1 | Runtime gaps (memory, types, errors) | def-runtime-memory.md + {stack}/ | P3 |
| T2 | Authentication gaps (if active) | def-auth-patterns.md + {stack}/ | P3 |
| T3 | Injection/input validation gaps | Generic DATA + {stack}/ | P3 |
| T4 | Framework gaps (CSP, sanitization, isolation) | def-framework-hardening.md + {stack}/ | P4 |
| T5 | IPC gaps (auth, anti-replay, validation) | def-ipc-hardening.md + {stack}/ | P4 |
| T6 | Subprocess/sidecar gaps | def-ipc-hardening.md + {stack}/ | P4 |
| T7 | OS and privilege elevation gaps | def-os-isolation.md + {stack}/ | P4 |
| T8 | Anti-reverse engineering gaps | DATA {stack}/ if available | P4 |
| T9 | Network and TLS gaps | def-network-tls.md + {stack}/ | P5 |
| T10 | Storage and crypto gaps | def-crypto-secrets.md + {stack}/ | P5 |
| T11 | Deception and monitoring gaps | def-deception-monitoring.md + {stack}/ | P6 |
| T12 | LLM defense gaps (if active) | def-llm-pipeline.md + {stack}/ | P6 |
| T13 | Prioritize all gaps | Impact/effort matrix | All |
| T14 | Assign each gap to a phase | P3-P6 | All |
| T15 | Write output | P2_reinforcement_points.yaml | - |

NOTE: Skip subtasks whose category is INACTIVE (not detected in P0).
If MODE = TARGETED, treat adversary vulnerabilities as P0 priority.

================================================
```

---

### EXECUTION

#### Gap Identification Method

For each protection technique in the defensive DATA:

1. **Check** if the protection exists in the project (cross-reference with P1)
2. **If absent** : Create a GAP-xxx with precise location
3. **If partial** : Create a GAP-xxx with what is missing
4. **If present and effective** : Skip (already in PROT-xxx)

Format for each gap:
```yaml
- id: GAP-001
  category: "RUNTIME|FRAMEWORK|IPC|CRYPTO|NET|OS|ANTI-RE|DECEPTION|LLM|AUTH|STORAGE|SANDBOX"
  title: "Gap description"
  priority: P0|P1|P2|P3
  location: "path/to/file.ext:87 or NEW_FILE"
  current_code: "# Current vulnerable code (if applicable)"
  issue: "Problem explanation (CWE-xxx)"
  defense_needed: "Required protection technique"
  knowledge_ref: "data-source-file.md#section"
  assigned_phase: P3|P4|P5|P6
  estimated_effort: "XX minutes"
  existing_prot_ref: null
  adversary_ref: null  # VULN-xxx if TARGETED mode
```

#### Prioritization (T11)

**If MODE = TARGETED (adversary_output.yaml exists):**
- Vulnerabilities identified by adversary-simulation are automatically P0
- Other gaps follow the standard matrix

**If MODE = FULL:**
- Use the standard impact/effort matrix

**Prioritization matrix:**

| | Low effort (<30min) | Medium effort (1-4h) | High effort (>4h) |
|---|---------------------|---------------------|-------------------|
| Critical impact (CVSS 9+) | P0 | P0 | P1 |
| High impact (CVSS 7-8.9) | P0 | P1 | P2 |
| Medium impact (CVSS 4-6.9) | P1 | P2 | P3 |
| Low impact (CVSS <4) | P2 | P3 | P3 |

**P0 priority criteria (absolute blockers, universal):**
- Secret comparison with `==`
- Accepting invalid certificates (TLS)
- `shell=True` in subprocess
- Secrets in source code (not in keyring/vault)
- `eval()` or equivalent with external input
- Absent or too permissive CSP on scripts
- CSPRNG not used for tokens/nonces

#### Phase Assignment (T14)

| Phase | Gap categories | Logic |
|-------|---------------|-------|
| P3 - Runtime code hardening | RUNTIME, AUTH, INJECTION | Application code security primitives |
| P4 - Framework hardening | FW, IPC, SUBPROCESS, OS, ANTI_RE | Framework, IPC, OS layer |
| P5 - Network and crypto hardening | NET, CRYPTO, STORAGE | Data in transit and at rest |
| P6 - Traps and deception | DECEPTION, LLM, MONITORING | Active defense and AI |

#### Write Output (T15)

**COUNT INVARIANT** : The sum of gaps assigned by phase must equal the total:
```
gap_summary.total == gap_summary.by_phase.P3
                   + gap_summary.by_phase.P4
                   + gap_summary.by_phase.P5
                   + gap_summary.by_phase.P6
```

If the invariant fails: identify unassigned gaps and attach them to a phase.

**Writing order**:
1. **YAML** : `.defender_working/{SESSION_ID}/data/P2_reinforcement_points.yaml`
2. **MD** : `.defender_working/{SESSION_ID}/reports/P2-HARDENING-POINTS.md`

---

### VALIDATION - Completeness Check

```
VALIDATION - P2 Check
================================================

| Element verified | Status |
|-----------------|--------|
| Each ACTIVE category scanned for gaps? | [OK/FAIL] |
| RUNTIME gaps identified (if active)? | [OK/FAIL/N/A] |
| FRAMEWORK gaps identified (if active)? | [OK/FAIL/N/A] |
| IPC gaps identified (if active)? | [OK/FAIL/N/A] |
| CRYPTO gaps identified (if active)? | [OK/FAIL/N/A] |
| NET gaps identified (if active)? | [OK/FAIL/N/A] |
| OS gaps identified (if active)? | [OK/FAIL/N/A] |
| ANTI-RE gaps identified (if active)? | [OK/FAIL/N/A] |
| DECEPTION gaps identified (if active)? | [OK/FAIL/N/A] |
| LLM gaps identified (if LLM active)? | [OK/FAIL/N/A] |
| AUTH gaps identified (if auth active)? | [OK/FAIL/N/A] |
| If MODE = TARGETED: all adversary vulnerabilities have a GAP? | [OK/FAIL/N/A] |
| All gaps prioritized (P0/P1/P2/P3)? | [OK/FAIL] |
| All gaps assigned to P3, P4, P5 or P6? | [OK/FAIL] |
| Count invariant respected? | [OK/FAIL] |
| P2_reinforcement_points.yaml written and valid? | [OK/FAIL] |

COMPLETION GATE
- Ready to enter P3? [YES/NO]
================================================
```

---

## P2 Report Template

```markdown
# P2 - Hardening Points

## Summary
[X gaps identified, Y P0-critical, Z P1-high]
[Mode: {TARGETED|FULL}]
[Distribution by category]

## Gaps by Category
| Category | Total | P0 | P1 | P2 | P3 |
|----------|-------|----|----|----|----|
| RUNTIME   | ... | ... | ... | ... | ... |
| FRAMEWORK | ... | ... | ... | ... | ... |
| (dynamic based on active categories) |

## Gaps by Target Phase
| Phase | Assigned gaps | Estimated effort |
|-------|--------------|-----------------|
| P3 - Runtime code hardening | ... | ... hours |
| P4 - Framework hardening | ... | ... hours |
| P5 - Network/crypto hardening | ... | ... hours |
| P6 - Traps/deception/LLM | ... | ... hours |
| TOTAL | ... | ... hours |

## Top 10 Critical Gaps
[Detail of the 10 P0 gaps with precise location and current code]

## Targeted Adversary Vulnerabilities (if TARGETED mode)
[List of VULN-xxx from adversary-simulation and corresponding GAP]

## Hardening Plan
[Recommended execution order: P3 -> P4 -> P5 -> P6]
[Dependencies between phases]
```

---

**End of P2-POINTS-RENFORCEMENT.md**
