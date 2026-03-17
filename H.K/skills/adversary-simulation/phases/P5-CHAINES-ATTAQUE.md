# Phase 5: Attack Chains

**Type** : Strategic offensive
**Executor** : LLM + Strategic reasoning
**Input** : P4_attack_scenarios.yaml
**DATA** : data/offensive/generic/atk-chain-patterns.md + data/offensive/{stack}/atk-chain-attack-patterns.md + data/offensive/exploits/atk-exploit-chains.md
**Checkpoint** : User confirmation required before P6

---

## EXHAUSTIVENESS DIRECTIVE - MANDATORY

> Load the attack chain DATA relevant to the stack detected in P0:
> - `data/offensive/generic/atk-chain-patterns.md` (universal patterns)
> - `data/offensive/{stack}/atk-chain-attack-patterns.md` (stack-specific patterns)
> - `data/offensive/exploits/atk-exploit-chains.md` (advanced exploitation chains)
>
> MANDATORY construction of the 4 chain types:
> 1. **Cross-boundary**: chains that cross P2's TB boundaries
> 2. **Privilege escalation**: chains that increase access level
> 3. **Persistence**: chains that establish durable access
> 4. **Stealth**: chains that minimize detection
>
> Reference kill chains are dynamically adapted to the stack:
> Patterns come from loaded DATA, not hardcoded schemas.

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

---

### REFLECTION - P5 Entry Gate

**Objective** : Combine individual attack scenarios (ATK-xxx) into multi-step attack chains (CHAIN-xxx) adapted to the detected stack. This is where we think like a strategic hacker: "If I do A, then B, then C, I achieve total control."

```
REFLECTION - P5 Entry Gate
================================================

CENTRAL PROBLEM
Identify how to combine individual attacks into devastating
sequences that maximize impact in the project's architecture
and minimize detection. Think in terms of cross-component pivots.

UPSTREAM DATA (P4)
| Metric | Value |
|--------|-------|
| Attack scenarios | {P4.scenarios.count} |
| Exploited vulnerabilities | {P4.vuln_coverage.mapped_to_scenario} |
| Non-exploitable | {P4.vuln_coverage.not_exploitable} |
| Active categories | {P0.attack_categories_active[].code} |

CHAINING STRATEGY
1. Identify scenarios where the output is reusable as input
   (e.g.: XSS produces an IPC call -> IPC produces subprocess args)
2. Find cross-component paths based on the detected architecture
3. Find privilege escalation paths (user -> admin/root)
4. Find persistence paths (backdoor, modified config)
5. Identify chains that pass through unexpected relays (LLM, CI/CD)

BOUNDARIES TO CROSS (from P2)
{P2.trust_boundaries[].id}: {P2.trust_boundaries[].name}
(dynamic list built from P2_data_flows.yaml)

AVAILABLE CHAIN DATA
- atk-chain-patterns.md: generic chaining patterns
- atk-chain-attack-patterns.md: stack-specific patterns
- atk-exploit-chains.md: advanced exploitation chains

================================================
STOP CHECK
- P4_attack_scenarios.yaml read and valid? [YES/NO]
- Chain DATA loaded? [YES/NO]
- data/offensive/generic/atk-chain-patterns.md READ? [YES/NO]
- P2 trust boundaries identified? [YES/NO]
- Ready to continue? [YES/NO]
================================================
```

---

### PLANNING - Breakdown

```
PLANNING - P5 Sub-tasks
================================================

| # | Sub-task | Expected output |
|---|----------|-----------------|
| T1 | Build ATK connection matrix | Output->input matrix |
| T2 | Identify cross-boundary chains | CHAIN-xxx crossing boundaries |
| T3 | Identify privilege escalation chains | CHAIN-xxx privilege escalation |
| T4 | Identify persistence chains | CHAIN-xxx persistent access |
| T5 | Identify stealth chains | CHAIN-xxx hard to detect |
| T6 | Map to Kill Chain | Cyber Kill Chain mapping |
| T7 | Build impact matrix | Overview by severity |
| T8 | CHECKPOINT: Confirm with user | Approval before P6 |
| T9 | Write final output | P5_attack_chains.yaml + report |

================================================
```

---

### EXECUTION

#### T1: Attack Connection Matrix

For each ATK-xxx scenario, identify:
- **Output** : What does this attack produce? (code executed, token stolen, access gained, etc.)
- **Usable as input by** : Which other ATK can use this output?

> Build the matrix by analyzing `attack_steps[].result` of each ATK
> and the `preconditions` of each other ATK. If ATK-A's result satisfies
> a precondition of ATK-B, they are chainable.

```
Connection matrix (adapted to the project's stack):

ATK-{A} ({category})  --> output: {result}  --> input for: ATK-{B} ({category})
ATK-{B} ({category})  --> output: {result}  --> input for: ATK-{C} ({category})
...
```

#### T2: Cross-Boundary Chains

Find chains that cross trust boundaries (TB-xxx from P2).

> **PRINCIPLE**: The most dangerous chains cross MULTIPLE boundaries.
> Use patterns from `atk-chain-patterns.md` and adapt them to the project's
> specific boundaries.

**CHAIN-xxx format**:

```yaml
- id: CHAIN-001
  title: "Complete chain description"
  type: "cross_boundary"
  complexity: HIGH|MEDIUM|LOW
  attacker_profile: "Description of the required attacker"
  boundaries_crossed: ["TB-xxx", "TB-yyy"]

  steps:
    - order: 1
      attack_ref: ATK-xxx
      description: "What this step does in the chain"
      boundary_crossed: "TB-xxx (source -> destination)"
      output: "What this step produces"

    - order: 2
      attack_ref: ATK-yyy
      description: "How the previous output is used"
      boundary_crossed: "TB-yyy"
      output: "Step result"

  total_impact: "Cumulative impact of the entire chain"
  total_severity: CRITICAL|HIGH|MEDIUM
  estimated_time: "Total chain duration"
  detection_difficulty: "Difficulty of detecting the complete chain"
  prerequisites:
    - "Global chain prerequisite"

  kill_chain:
    reconnaissance: "Reconnaissance phase"
    weaponization: "Tool preparation phase"
    delivery: "Exploit delivery phase"
    exploitation: "Exploitation phase"
    installation: "Access installation phase"
    command_and_control: "Command and control phase"
    actions_on_objectives: "Actions on objectives phase"
```

#### Cross-Boundary Chain Example (Illustration)

> **NOTE**: This example illustrates the FORMAT. Real components, boundaries
> and attacks depend on the detected stack and architecture.

```yaml
# Illustrative example — adapt to the project's components
- id: CHAIN-001
  title: "External content -> Frontend XSS -> Backend IPC -> OS command -> Privilege escalation"
  type: "cross_boundary"
  complexity: HIGH
  attacker_profile: "Attacker controlling content consumed by the application"
  boundaries_crossed: ["TB-001", "TB-002", "TB-003"]

  steps:
    - order: 1
      attack_ref: ATK-001
      description: "Injection into external content consumed by the frontend"
      boundary_crossed: "TB-001 (Network -> Frontend)"
      output: "Malicious code executing in the frontend"

    - order: 2
      attack_ref: ATK-002
      description: "The malicious code calls the backend via the IPC channel"
      boundary_crossed: "TB-002 (Frontend -> Backend)"
      output: "Malicious arguments transmitted to the backend"

    - order: 3
      attack_ref: ATK-005
      description: "The backend executes an OS command with unvalidated arguments"
      boundary_crossed: "TB-003 (Backend -> OS)"
      output: "Code execution with elevated privileges"

  total_impact: "Complete system compromise from a simple external content"
  total_severity: CRITICAL
  estimated_time: "1 to 4 hours of preparation, then passive attack"
  detection_difficulty: "very difficult"
  prerequisites:
    - "The application consumes unsanitized external content"
    - "The IPC channel exposes privileged commands"
    - "Arguments are not validated on the backend side"

  kill_chain:
    reconnaissance: "Identify external content sources and IPC endpoints"
    weaponization: "Build the chained payload to cross all boundaries"
    delivery: "User passively loads malicious content"
    exploitation: "XSS -> IPC -> OS command injection"
    installation: "Persistence via OS mechanism (service, cron, scheduled task)"
    command_and_control: "Interactive shell or reverse tunnel"
    actions_on_objectives: "Full access, data exfiltration, secret theft"
```

#### T3: Privilege Escalation Chains

Identify chains where the attacker progressively increases their access level.

> Patterns to look for:
> - Frontend without privileges -> Backend with privileges -> OS admin/root
> - Anonymous user -> Authenticated user -> Admin -> System
> - Sandbox/container -> Host -> Internal network

```yaml
# Same format as CHAIN-xxx with type: "privilege_escalation"
- id: CHAIN-xxx
  type: "privilege_escalation"
  # ... same structure as T2
```

#### T4: Persistence Chains

Identify chains where the attacker establishes durable access surviving reboots.

> Patterns to look for based on OS detected in P0:
> - Linux: systemd services, cron jobs, authorized_keys, bashrc
> - Windows: services, scheduled tasks, Run keys, WMI
> - macOS: LaunchAgents, Login Items, cron
> - Multi-OS: application config modification, code backdoor

```yaml
# Same format as CHAIN-xxx with type: "persistence"
- id: CHAIN-xxx
  type: "persistence"
  # ... same structure as T2
```

#### T5: Stealth Chains

Identify chains where the attacker minimizes detection.

> Patterns to look for:
> - Slow and incremental exfiltration (below alert thresholds)
> - Use of legitimate channels (HTTPS, DNS, normal APIs)
> - Passive attacks that generate no logs
> - Exploitation via intermediaries (LLM, CI/CD)

```yaml
# Same format as CHAIN-xxx with type: "stealth"
- id: CHAIN-xxx
  type: "stealth"
  # ... same structure as T2
```

#### T6: Cyber Kill Chain Mapping

For each CHAIN-xxx, map the steps onto the Lockheed Martin Cyber Kill Chain model:

| Kill Chain Phase | Description | CHAIN-001 steps | CHAIN-002 steps |
|-----------------|-------------|-----------------|-----------------|
| Reconnaissance | Target information gathering | ... | ... |
| Weaponization | Attack tool preparation | ... | ... |
| Delivery | Exploit delivery | ... | ... |
| Exploitation | Exploit execution | ... | ... |
| Installation | Persistent access installation | ... | ... |
| Command & Control | Command and control | ... | ... |
| Actions on Objectives | Objective achievement | ... | ... |

#### T7: Impact Matrix

```yaml
impact_matrix:
  chains_by_severity:
    CRITICAL: {n}   # Total compromise or full exfiltration
    HIGH: {n}       # Specific secret theft, significant unauthorized access
    MEDIUM: {n}     # Partial information leakage or limited access

  chains_by_type:
    cross_boundary: {n}
    privilege_escalation: {n}
    persistence: {n}
    stealth: {n}

  chains_by_entry_point: {}  # dynamic based on EP detected in P1

  chains_by_complexity:
    low: {n}        # Exploitable with public tools
    medium: {n}     # Requires understanding the architecture
    high: {n}       # Requires stack-specific expertise

  scenarios_in_chains: {n}    # ATK referenced in chains
  scenarios_standalone: {n}   # ATK not chained (exploitable alone)
```

#### T8: USER CHECKPOINT

**BLOCKING**: Present the attack chains to the user for confirmation before generating the final report.

```
=====================================================
P5 CHECKPOINT - USER CONFIRMATION
=====================================================

Summary of built attack chains:
- {n} chains identified
- {n} critical, {n} high, {n} medium

Identified chains:
  CHAIN-001: {title} [{severity}]
  CHAIN-002: {title} [{severity}]
  ...

Most dangerous chain: CHAIN-xxx ({justification})

Questions for the user:
1. Do the chains seem realistic relative to the analyzed project?
2. Are there any missing components/scenarios?
3. Should certain chains be explored further?
4. Proceed to final report P6?

=====================================================
```

#### T9: Write Output

**Writing order** (CRITICAL):
1. **YAML** : `.attacker_working/{SESSION_ID}/data/P5_attack_chains.yaml`
2. **MD** : `.attacker_working/{SESSION_ID}/reports/P5-CHAINES-ATTAQUE.md`

**Full YAML contract** (see WORKFLOW.md S3 - P5):

```yaml
schema_version: "1.1.0"
phase: 5
generated_at: "ISO8601"
input_ref: "P4_attack_scenarios.yaml"

chains:
  - id: CHAIN-001
    title: "Chain title"
    type: "cross_boundary|privilege_escalation|persistence|stealth"
    complexity: "HIGH|MEDIUM|LOW"
    attacker_profile: "Attacker description"
    boundaries_crossed: ["TB-xxx"]
    steps:
      - order: 1
        attack_ref: "ATK-xxx"
        description: "Step description"
        boundary_crossed: "TB-xxx"
        output: "Step result"
    total_impact: "Overall impact"
    total_severity: "CRITICAL|HIGH|MEDIUM"
    estimated_time: "Total duration"
    detection_difficulty: "level"
    prerequisites:
      - "Global prerequisite"
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
  chains_by_type:
    cross_boundary: 0
    privilege_escalation: 0
    persistence: 0
    stealth: 0
  chains_by_entry_point: {}
  chains_by_complexity:
    low: 0
    medium: 0
    high: 0
  scenarios_in_chains: 0
  scenarios_standalone: 0
```

---

### VALIDATION - Completeness Check

```
VALIDATION - P5 Check
================================================

| Checked element | Status |
|-----------------|--------|
| ATK connection matrix built? | [OK/FAIL] |
| Cross-boundary chains identified (at least 1)? | [OK/FAIL] |
| Privilege escalation chains identified? | [OK/FAIL] |
| Persistence chains identified? | [OK/FAIL] |
| Stealth chains identified? | [OK/FAIL] |
| All 4 chain types covered? | [OK/FAIL] |
| Each CHAIN has a complete Kill Chain mapping? | [OK/FAIL] |
| Each CHAIN references existing ATK in P4? | [OK/FAIL] |
| Impact matrix built? | [OK/FAIL] |
| User checkpoint passed? | [OK/FAIL] |
| P5_attack_chains.yaml written and conforming to contract? | [OK/FAIL] |
| P5-CHAINES-ATTAQUE.md report written? | [OK/FAIL] |

COMPLETION GATE
- All checks passed? [YES/NO]
- User confirmation obtained? [YES/NO]
- Ready to enter P6? [YES/NO]
================================================
```

---

## P5 Report Template

```markdown
# P5 - Attack Chains

## Summary
[X chains identified, Y critical, Z high]
[Most dangerous chain: CHAIN-xxx - {summary}]

## Critical Chains

### CHAIN-001: {title}
**Type**: {cross_boundary|privilege_escalation|persistence|stealth}
**Complexity**: {level}
**Attacker profile**: {who}
**Boundaries crossed**: {TB-xxx, TB-yyy}

```
[ASCII diagram of the chain adapted to the project's architecture]
Component A          Component B          Component C
+-----------+        +-----------+        +-----------+
| Step 1    |--[TB]->| Step 2    |--[TB]->| Step 3    |
+-----------+        +-----------+        +-----------+
```

**Detailed steps**:
1. [Step + referenced ATK + result]
2. [Step + referenced ATK + result]
3. [Step + referenced ATK + result]

**Total impact**: {description}
**Estimated time**: {complete duration}
**Detection difficulty**: {level}

[Repeat for each critical chain]

## High Chains
[Same format, more concise]

## Medium Chains
[Summary format]

## Impact Matrix
[Summary table by type, complexity, entry point]

## Kill Chain Mapping
[For each critical chain, mapping onto the Lockheed Martin model]

## Strategic Attacker Observations
[Which chain would be used first against this project?]
[How to optimize the effort/impact ratio for a real attacker?]
[What is the "royal road" to total compromise?]
[Which chains are entirely passive/automatable?]
[Which components are "pivots" appearing in multiple chains?]
```

---

**End of P5-CHAINES-ATTAQUE.md**
