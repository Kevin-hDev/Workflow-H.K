# Phase 2: Flow Mapping

**Type** : Analytical
**Executor** : LLM + Code analysis
**Knowledge** : No additional knowledge (pure source code analysis)
**Input** : P1_reconnaissance.yaml

---

## EXHAUSTIVENESS DIRECTIVE - MANDATORY

> This phase does not load additional offensive DATA but MUST cover
> ALL flows identified from P1's entry points, without exception.
>
> Each EP-xxx from P1 must correspond to at least one DF-xxx.
> Each identified secret must have a SEC-xxx with its exposure points.
> Each trust boundary crossed by a flow MUST be traced.
>
> Trust boundaries are DYNAMIC — they depend on the architecture
> detected in P0/P1, not a hardcoded list. Examples of common boundaries:
>
> - **Frontend -> Backend** : WebView -> IPC, Browser -> API, CLI -> Backend
> - **Backend -> Subprocess** : Main process -> sidecar, child_process, exec
> - **Backend -> External service** : App -> LLM API, App -> DB, App -> OAuth provider
> - **Backend -> OS** : App -> Privilege elevation (pkexec, UAC, sudo)
> - **App -> Network** : App -> Third-party services (webhooks, APIs, feeds)
> - **Untrusted data -> Processing** : User input -> parsing, deserialization
> - **Storage -> Memory** : Keyring/file -> plaintext variable in memory

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

---

### REFLECTION - P2 Entry Gate

**Objective** : Trace ALL data flows in the project, identify where secrets transit, and map trust boundaries. Think like an attacker monitoring the pipes between components.

```
REFLECTION - P2 Entry Gate
================================================

CENTRAL PROBLEM
Trace every sensitive data flow in the project to identify
the points where an attacker can intercept, modify, or steal
information in the detected architecture.

UPSTREAM DATA (P1)
| Metric | Value |
|--------|-------|
| Identified targets | {P1.target_inventory.count} |
| Entry points | {P1.entry_points.count} |
| Active categories | {P0.attack_categories_active[].code} |
| Sensitive components | {P0.sensitive_components} |

KEY QUESTIONS (adapted to the detected stack)
For each security-sensitive component detected in P0:
- Where do secrets transit between storage and use?
- Is untrusted data sanitized before processing?
- Are subprocess arguments validated?
- Do secrets pass in plaintext through memory?
- Are tokens/credentials stored securely?
- Are external responses treated as trusted?

================================================
STOP CHECK
- P1_reconnaissance.yaml read and valid? [YES/NO]
- Ready to continue? [YES/NO]
================================================
```

---

### PLANNING - Breakdown

Sub-tasks are DYNAMIC — they depend on active categories and detected components.

```
PLANNING - P2 Sub-tasks
================================================

| # | Sub-task | Expected output |
|---|----------|-----------------|
| T1-Tn | Trace flows by active category | DF-xxx by category |
| T(n+1) | Identify secrets in transit | SEC-xxx with exposure |
| T(n+2) | Define trust boundaries | TB-xxx with crossing flows |
| T(n+3) | Write final output | P2_data_flows.yaml + report |

NOTE: The number of sub-tasks T1-Tn depends on active categories
and security-sensitive components detected in P0.
Create ONE sub-task per logical flow group.

Examples of flow groups by stack:
- If IPC active: Frontend <-> backend flows (IPC/channels)
- If SUBPROCESS active: Backend -> subprocess flows
- If LLM active: Backend -> LLM API flows
- If CRYPTO active: Secret flows (storage -> memory -> use)
- If NET active: Network flows (app -> external services)
- If INJECTION active: User data -> DB/templates flows
- If AUTH_BYPASS active: Authentication/authorization flows
- If PRIVESC active: Privilege elevation flows

================================================
```

---

### EXECUTION

#### Flow Tracing Method

For each data flow, follow the data from end to end:

1. **Origin** : Where does the data come from? (user input, frontend, keyring, network, file)
2. **Transformations** : How is it transformed? (serialization, parsing, validation, sanitization)
3. **Transit** : Which components does it pass through? (modules, processes, services)
4. **Destination** : Where does it end up? (DB, external API, subprocess, file, UI)
5. **Protection** : Is it protected at each step? (encryption, validation, sanitization)

#### T1-Tn: Trace Flows by Active Category

For EACH active category from P0, trace corresponding flows following the EP-xxx entry points from P1.

**How to trace a flow**:

1. Start from an EP-xxx from P1
2. Read the source code at the indicated `location`
3. Follow the data through function calls
4. Note each step with: location (file:line), protection (or lack thereof)
5. Document exposure windows (where an attacker could intercept)

For each flow found:
```yaml
- id: DF-001
  name: "Flow description"
  source: "Source component"
  destination: "Destination component"
  data_type: "Type of data transported"
  classification: "SECRET|UNTRUSTED|INTERNAL|PUBLIC"
  encryption_in_transit: true|false
  encryption_at_rest: true|false
  path:
    - step: "Step description"
      location: "path/file.ext:line"
      protection: "Existing protection or NONE"
  exposure_windows:
    - point: "where_in_system"
      duration: "exposure_duration"
      risk: "Risk description for an attacker"
```

**Flow examples by category** (ILLUSTRATION, not INSTRUCTION):

**If IPC active**:
- Frontend -> backend flows via IPC/channels
- Argument deserialization
- Backend return to frontend

**If SUBPROCESS active**:
- Backend -> subprocess flows (arguments, stdin)
- Subprocess -> backend return (stdout, exit code)

**If LLM active**:
- API key reading -> memory -> HTTP header flow
- External content -> prompt -> LLM API -> response -> rendering flow

**If CRYPTO active**:
- Secret flow (keyring -> memory -> use -> zeroization?)
- DB passphrase flow (storage -> connection opening)

**If NET active**:
- Outbound request flows (credentials in transit)
- Inbound response flows (untrusted data)

**If INJECTION active**:
- User input -> DB query flow (concatenation vs prepared?)
- Template rendering flow (SSTI)

**If AUTH_BYPASS active**:
- Authentication flow (credentials -> verification -> session)
- Authorization flow (token -> rights verification -> action)

#### T(n+1): Identify Secrets in Transit

For each secret identified in the flows:

```yaml
- id: SEC-001
  type: "secret_type"       # api_key, password, token, passphrase, certificate, etc.
  flow_ref: "DF-xxx"
  exposure_points:
    - location: "where_in_system"
      duration: "exposure_duration"
      protection: "current_protection"
      extractable: true|false
      method: "Extraction method available to an attacker"
```

Secret classification:

| Classification | Examples | Criticality |
|----------------|----------|-------------|
| SECRET | API keys, access tokens, passphrases, private keys | CRITICAL |
| CONFIDENTIAL | Temporary access tokens, session IDs, privileged arguments | HIGH |
| INTERNAL | Requests, prompts, internal results | MEDIUM |
| PUBLIC | Versions, technical stack, public names | LOW |

#### T(n+2): Define Trust Boundaries

Identify trust boundaries SPECIFIC to the analyzed project (no hardcoded list).

For each boundary:
```yaml
- id: TB-001
  name: "Descriptive boundary name"
  from_trust: "source_trust_level"
  to_trust: "destination_trust_level"
  crossing_flows: ["DF-xxx", "DF-yyy"]
  protection_at_boundary: "Current protection"
  attack_opportunities:
    - "Opportunity 1 for an attacker"
    - "Opportunity 2 for an attacker"
```

**How to identify boundaries**:
- Every time a flow crosses a privilege, process, or network change
- Every time data moves from an untrusted context to a trusted context
- Every time a secret leaves secure storage to be used

#### T(n+3): Write Output

**Writing order** (CRITICAL):
1. **YAML** : `.attacker_working/{SESSION_ID}/data/P2_data_flows.yaml`
2. **MD** : `.attacker_working/{SESSION_ID}/reports/P2-CARTOGRAPHIE-FLUX.md`

The YAML must follow the contract defined in WORKFLOW.md S3 (P2).

---

### VALIDATION - Completeness Check

```
VALIDATION - P2 Check
================================================

| Checked element | Status |
|-----------------|--------|
| All EP-xxx from P1 correspond to a DF-xxx? | [OK/FAIL] |
| All sensitive components from P0 have traced flows? | [OK/FAIL] |
| All secrets identified with SEC-xxx? | [OK/FAIL] |
| Trust boundaries defined with TB-xxx? | [OK/FAIL] |
| Each flow has a complete path (source -> destination)? | [OK/FAIL] |
| Each flow has steps with location (file:line)? | [OK/FAIL] |
| Each secret has documented exposure points? | [OK/FAIL] |
| Each boundary has referenced crossing flows? | [OK/FAIL] |
| P2_data_flows.yaml written and valid? | [OK/FAIL] |
| P2-CARTOGRAPHIE-FLUX.md report written? | [OK/FAIL] |

COMPLETION GATE
- All checks passed? [YES/NO]
- Ready to enter P3? [YES/NO]
================================================
```

---

## P2 Report Template

```markdown
# P2 - Data Flow Mapping

## Summary
[Summary — how many flows, how many secrets, how many boundaries traced]

## Flow Diagram

[ASCII diagram adapted to the project's architecture]
[Show main components and flows between them]
[Indicate crossed trust boundaries]

## Critical Data Flows
[DF-xxx table with source, destination, classification, protection]
| ID | Name | Source | Destination | Classification | Encrypted transit |
|----|------|--------|-------------|----------------|------------------|

## Secrets in Transit
[SEC-xxx table with type, exposure, extractability]
| ID | Type | Flow ref | Exposure point | Extraction method |
|----|------|----------|----------------|------------------|

## Trust Boundaries
[TB-xxx table with attack opportunities]
| ID | Boundary | Protection | Attack opportunities |
|----|----------|-----------|---------------------|

## Attacker Observations
[Which flows are most vulnerable?]
[Do secrets pass in plaintext through memory?]
[Is untrusted data sanitized at boundaries?]
[Are subprocess arguments validated?]
[Which flow would be attacked first?]
```

---

**End of P2-CARTOGRAPHIE-FLUX.md**
