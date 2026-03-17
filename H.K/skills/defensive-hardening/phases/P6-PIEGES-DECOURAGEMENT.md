# Phase 6: Deception Traps

**Type** : Active defensive implementation
**Executor** : LLM + Code writing
**Knowledge** : data/defensive/generic/def-deception-monitoring.md, data/defensive/generic/def-audit-logging.md, data/defensive/generic/def-llm-deception-blindage.md, data/defensive/generic/def-llm-pipeline.md
**Input** : P5_network_crypto_hardening.yaml
**Output** : Code in code/deception_traps/

---

## EXHAUSTIVENESS DIRECTIVE - MANDATORY

> Before any execution, load the relevant defensive DATA files:
> - def-deception-monitoring.md (canary files, honeypots, tripwires)
> - def-audit-logging.md (tamper-evident logs, hash chains)
> - def-llm-deception-blindage.md (if project uses an AI/LLM pipeline)
> - def-llm-pipeline.md (if project uses an AI/LLM pipeline)
>
> Active defense categories are in `P0_detection.yaml.defense_categories_active`.
> Only the DECEPTION and LLM (if applicable) categories guide this phase.
>
> **IMPORTANT** : If the project does NOT contain an LLM/AI pipeline, the LLM subtasks
> (T8-T14) are SKIPPED and documented as "not applicable — no AI component detected".

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

> **CRITICAL** : Complete all four steps in sequence and display the result of each step.

---

### REFLECTION - Entry Gate P6

**Objective** : Write active defense code that traps, discourages and detects attackers. This phase covers two axes based on the stack:

1. **DECEPTION** (universal): Canary files, honeypots, anti-tamper secure logging, behavioral analysis, kill switch
2. **LLM DEFENSE** (conditional — if AI/agent in project): CaMeL pattern, spotlighting, schema validation, output filtering, prompt injection detection

**Display REFLECTION results in this format:**

```
REFLECTION - P6 Entry Gate
================================================

CENTRAL PROBLEM
Two axes:
1. DECEPTION: Make life impossible for the human/automated attacker
   who has passed P3-P5 protections. Realistic canary files,
   anti-tamper secure logging, behavioral analysis, kill switch.

2. LLM DEFENSE (IF APPLICABLE): Prevent prompt injection attacks
   (XPIA, indirect injection) and unauthorized LLM actions.
   CaMeL pattern, spotlighting, schema validation, output filtering.

DECEPTION PRINCIPLES
1. The attacker does not know what is real and what is fake
2. Every suspicious action is logged with cryptographic integrity
3. Traps are INVISIBLE to the legitimate user
4. Canary file names must be realistic
   (NEVER "canary", "trap", "honey", "fake", "decoy", "bait",
    "lure", "test", "dummy", "sample")

LLM DEFENSE PRINCIPLES (if applicable)
1. Separation privileged LLM (planning) / quarantine LLM (data)
2. All external content is marked BEFORE entering an LLM
3. LLM outputs are validated by schema BEFORE deserialization
4. No LLM action can exceed the scope of the defined enum

UPSTREAM DATA
| Metric | Value | Source |
|--------|-------|--------|
| Detected stack | {P0.detected_stack} | P0 |
| LLM/AI component detected | {YES/NO} | P0 |
| Gaps assigned to P6 | {P2.gap_summary.by_phase.P6} | P2 |
| P3+P4+P5 fixes written | {previous total} | P3-P5 YAML |
| P6 categories | DECEPTION, LLM (if applicable) | P2 |

KNOWLEDGE TO LOAD
- @data/defensive/generic/def-deception-monitoring.md
- @data/defensive/generic/def-audit-logging.md
- @data/defensive/generic/def-llm-deception-blindage.md (if LLM)
- @data/defensive/generic/def-llm-pipeline.md (if LLM)

================================================
STOP CHECK
- P5_network_crypto_hardening.yaml read and valid? [YES/NO]
- DECEPTION defensive DATA loaded? [YES/NO]
- Deception/monitoring defensive DATA files READ? [YES/NO]
- LLM/AI component present in project? [YES/NO → determines subtasks]
- Ready to continue to PLANNING? [YES/NO]
================================================
```

**STOP CONDITION** : If any check = NO -> Resolve before continuing

---

### PLANNING - Breakdown into Subtasks

**Display planning in this format:**

```
PLANNING - P6 Subtasks
================================================

AXIS 1 — DECEPTION (UNIVERSAL — always executed)
| # | Subtask | DATA source |
|---|---------|------------|
| T1 | Realistic canary files (non-obvious names) | def-deception-monitoring.md §Canary |
| T2 | Canary file access detection (by OS) | def-deception-monitoring.md §Detection |
| T3 | Canary tokens (fake credentials) | def-deception-monitoring.md §Tokens |
| T4 | Anti-tamper secure logging (SHA-256 chain) | def-audit-logging.md §Tamper |
| T5 | Behavioral analysis (time, volume, patterns) | def-deception-monitoring.md §Behavioral |
| T6 | Kill switch / emergency wipe | def-deception-monitoring.md §KillSwitch |
| T7 | Anti-reverse engineering (if desktop/mobile) | DATA platform/ + stack/ |

AXIS 2 — LLM DEFENSE (CONDITIONAL — if AI component detected)
| # | Subtask | DATA source |
|---|---------|------------|
| T8 | CaMeL pattern (dual privileged/quarantine LLM) | def-llm-pipeline.md §CaMeL |
| T9 | Spotlighting (untrusted content marking) | def-llm-pipeline.md §Spotlighting |
| T10 | LLM input validation (length + injection patterns) | def-llm-pipeline.md §Input |
| T11 | Output filtering (PII, secrets, exfiltration) | def-llm-pipeline.md §Output |
| T12 | Rule of Two (cross-check for irreversible actions) | def-llm-deception-blindage.md |
| T13 | LLM API call rate limiting | def-llm-pipeline.md §RateLimit |
| T14 | Anti-deception LLM (scheming detection) | def-llm-deception-blindage.md |

NOTE: If LLM/AI component NOT detected in P0 → T8-T14 = "N/A"
       Document in P6 YAML: llm_defense_applicable: false

================================================
```

---

### EXECUTION

---

#### AXIS 1: DECEPTION (UNIVERSAL)

---

#### T1: Realistic Canary Files

**DATA ref** : def-deception-monitoring.md §Canary Files

**Universal principle**:
- Deploy trap files that look like real sensitive files
- Access to these files = high-confidence intrusion signal (near-zero false positives)
- Names MUST be realistic and indistinguishable from real files

**ABSOLUTE naming rule**:
```yaml
canary_naming:
  FORBIDDEN:
    - "canary", "trap", "honey", "fake", "decoy"
    - "bait", "lure", "test", "dummy", "sample"
  VALID_EXAMPLES:
    - ".env.production"
    - "credentials.json"
    - "private_key.pem"
    - "service_account.json"
    - "master.key"
    - "backup.db"
    - "recovery_codes.txt"
    - ".pgpass"
    - "token.json"
    - "wallet.dat"
    - "api_keys.json"
    - "config.bak"
    - ".npmrc"
    - "admin_creds.xlsx"
```

**Location** : Directories systematically enumerated by attackers:
`~/.config/`, `~/.ssh/`, `~/Documents/`, `~/Desktop/`, project directory

**Content** : Structurally valid but non-functional credentials
(use documented example formats: AWS example keys, Stripe test keys, etc.)

**For open-source projects** : Generate canary file paths at deployment
from a per-installation random seed — NEVER store names in source code.

---

#### T2: Canary File Access Detection

**DATA ref** : def-deception-monitoring.md §Detection

**Adapt to detected OS**:
```yaml
canary_detection_by_os:
  linux:
    mechanism: "inotify IN_OPEN | IN_ACCESS"
    notes: "No privilege required. Note: standard notify libs only watch writes — use raw inotify API"
  linux_elevated:
    mechanism: "fanotify"
    notes: "Provides accessor PID. Can block openings. Requires CAP_SYS_ADMIN"
  windows:
    mechanism: "Poll File.accessed() every 5s"
    notes: "Enable: fsutil behavior set disablelastaccess 0. 5s TOCTOU window"
  macos:
    mechanism: "Canary tokens (HTTP beacon)"
    notes: "Endpoint Security Framework requires Apple entitlement. Not available for standard apps"
```

---

#### T3: Canary Tokens (Fake Credentials)

**DATA ref** : def-deception-monitoring.md §Tokens

**Universal principle**:
- Non-functional credentials inserted in configs, databases, or API responses
- If a canary token is USED (even remotely) = confirmed exfiltration
- Sentinel records in real DB tables
- Alert on: read, login attempt, deletion (= confirmed tampering)

---

#### T4: Anti-Tamper Secure Logging (SHA-256 Chain)

**DATA ref** : def-audit-logging.md §Tamper-Evident

**Universal principle**:
- Each log entry includes the hash of the previous entry (blockchain-like chain)
- Any modification or deletion of an entry breaks the chain
- Integrity verification: traverse the chain, recalculate each hash
- Security logs are separate from application logs

**Entry structure**:
```yaml
secure_log_entry:
  index: "{N}"
  timestamp_utc: "{ISO8601}"
  level: "INFO|WARNING|SECURITY|CRITICAL"
  event_type: "{CANARY_ACCESSED|DEBUGGER_DETECTED|AUTH_FAILED|...}"
  message: "{sanitized — secrets redacted}"
  metadata: "{optional}"
  previous_hash: "{SHA-256 of entry N-1}"
  hash: "{SHA-256 of this entry}"
```

**Standardized security events**:
```yaml
security_events:
  - CANARY_ACCESSED          # Trap file read/modified
  - DEBUGGER_DETECTED        # Debugger attached to process
  - AUTH_FAILED              # Authentication failure
  - RATE_LIMIT_HIT           # Rate limit reached
  - INTEGRITY_CHECK_FAILED   # Integrity check failed
  - KILL_SWITCH_TRIGGERED    # Kill switch activated
  - INJECTION_DETECTED       # Injection detected (SQL, prompt, etc.)
  - SUSPICIOUS_BEHAVIOR      # Abnormal behavior detected
  - TAMPER_DETECTED          # Unauthorized modification detected
```

---

#### T5: Behavioral Analysis

**DATA ref** : def-deception-monitoring.md §Behavioral

**Universal principle**:
- Learn normal behavior over the last N events (sliding window)
- Detect anomalies: unusual time, abnormal volume, never-before-seen actions, bursts
- Anomaly score: 0.0 (normal) to 1.0 (very suspicious)
- Actions: Allow (< 0.4), Warn (0.4-0.7), Block (>= 0.7)

**Detection criteria**:
```yaml
anomaly_criteria:
  unusual_hour:
    description: "Action at a time when user is never active"
    weight: 0.3
  unknown_action:
    description: "Action type never seen in history"
    weight: 0.4
  request_burst:
    description: "More than 20 requests in 1 minute"
    weight: 0.5
  dangerous_action:
    description: "Action in the list of sensitive operations"
    weight: 0.6
  geographic_anomaly:
    description: "Connection from unusual location"
    weight: 0.5
```

**Bounded collection** : History MUST have a maxSize (e.g., 1000 events) with FIFO eviction.

---

#### T6: Kill Switch / Emergency Wipe

**DATA ref** : def-deception-monitoring.md §KillSwitch

**Universal principle**:
- Emergency erasure of all secrets in memory and on disk
- Multi-step confirmation to avoid accidental activation
- Procedure:
  1. Arm the kill switch
  2. Confirm (minimum 3 confirmations)
  3. Execute the wipe
- Wipe actions: clear keychain, close sessions, clear vault, log the event

---

#### T7: Anti-Reverse Engineering (if desktop/mobile)

**Conditional** : Only if the project is a desktop or mobile application.

**Techniques**:
```yaml
anti_re_techniques:
  debugger_detection:
    description: "Detect if a debugger is attached to the process"
    linux: "ptrace(PTRACE_TRACEME) / /proc/self/status TracerPid"
    macos: "sysctl CTL_KERN/KERN_PROC P_TRACED flag"
    windows: "IsDebuggerPresent() / NtQueryInformationProcess"
  library_injection:
    description: "Detect LD_PRELOAD / DYLD_INSERT_LIBRARIES"
    check: "Check environment variables at startup"
  code_signing:
    description: "Verify binary integrity at runtime"
    method: "Binary hash compared to a signed hash embedded at build"
```

---

#### AXIS 2: LLM DEFENSE (CONDITIONAL)

> **IMPORTANT** : Execute these subtasks ONLY if an LLM/AI component
> was detected in the project in P0. Otherwise, document:
> `llm_defense_applicable: false` in the output YAML.

---

#### T8: CaMeL Pattern (Dual LLM)

**DATA ref** : def-llm-pipeline.md §CaMeL (Google DeepMind arXiv:2503.18813)

**Universal principle**:
- **Privileged LLM** : receives ONLY system context and user intent.
  NEVER exposed to untrusted external data. Can call tools.
- **Quarantine LLM** : processes external content (articles, web, untrusted files).
  NEVER has access to tools or actions. Its outputs = untrusted DATA.

**Strict separation**:
```yaml
camel_pattern:
  privileged_llm:
    receives: ["system prompt", "user intent", "structured validated data"]
    never_receives: ["raw external content", "untrusted HTML", "scraped data"]
    can_call: ["tools", "actions"]
    model: "most powerful (planning)"
  quarantined_llm:
    receives: ["marked external content (spotlighted)"]
    never_receives: ["system secrets", "tool definitions", "action capabilities"]
    can_call: []  # ZERO tools
    model: "cheaper (data extraction)"
    output_type: "valid schema only"
```

---

#### T9: Spotlighting (Untrusted Content Marking)

**DATA ref** : def-llm-pipeline.md §Spotlighting (Microsoft arXiv:2403.14720)

**Universal principle**:
- Each word of external content is prefixed by `^` to signal it is DATA
- Reduces indirect injections from >50% to <2% (Microsoft measurement)
- Sanitization BEFORE marking:
  1. Unicode NFKC normalization
  2. Zero-width character removal
  3. Unicode Tags removal (U+E0000-U+E007F)
  4. Residual HTML tag removal

**Session token** : Generated by CSPRNG, delimits the trust context.

---

#### T10: LLM Input Validation

**DATA ref** : def-llm-pipeline.md §Input

**Universal principle**:
- Length validation (max chars per request)
- Detection of known injection patterns
- Schema validation (Pydantic, Zod, JSON Schema, etc.)
- BLOCK and LOG injections — do not reveal detected patterns to the user

**Injection patterns to detect**:
```yaml
injection_patterns:
  - "ignore\\s+(all\\s+)?(previous|above|prior)\\s+(instructions?|prompts?)"
  - "you\\s+are\\s+now\\s+(a|an)\\s+\\w+"
  - "disregard\\s+(all\\s+)?(previous|your|the)\\s+"
  - "act\\s+as\\s+(if\\s+)?(you\\s+are\\s+)?"
  - "(system\\s+)?prompt\\s*(override|injection|bypass)"
  - "<\\s*(system|instructions?|prompt)\\s*>"
  - "\\[\\s*(system|instructions?|admin)\\s*\\]"
  - "(jailbreak|dan|evil|unrestricted|unfiltered)\\s+mode"
```

---

#### T11: Output Filtering

**DATA ref** : def-llm-pipeline.md §Output

**Universal principle**:
- Filter LLM outputs BEFORE showing them to the user
- Detect and redact: API keys, JWT, PII (emails, card numbers, IPs), internal paths
- Block markdown images to external domains (exfiltration via pixel tracking)
- Return filtered output AND list of found issues (for secure log)

---

#### T12: Rule of Two (Cross-Check)

**DATA ref** : def-llm-deception-blindage.md

**Universal principle**:
- Any irreversible action executed by an AI agent must be validated by a second independent agent
- The second agent does NOT see the reasoning of the first (avoid anchoring bias)
- Approve only if confidence >= 0.8
- Adapt to the agent paradigm (LangChain, CrewAI, LlamaIndex, custom, etc.)

---

#### T13: LLM API Call Rate Limiting

**DATA ref** : def-llm-pipeline.md §RateLimit

**Universal principle**:
- Limit calls per minute and per hour
- Limit tokens consumed per hour
- Protect against: accidental DoS (infinite loops), excessive cost, side-channel exfiltration
- Bounded collection: counter with sliding window and temporal eviction

---

#### T14: Anti-Deception LLM

**DATA ref** : def-llm-deception-blindage.md

**Universal principle**:
- Monitoring of scheming attempts (instruction bypassing)
- Sandbagging detection (intentional underperformance)
- Unfaithful chain of thought (verbalized reasoning does not match actions)
- Strict action allowlist (default deny) — NEVER a denylist

---

### VALIDATION - Completeness Check

```
VALIDATION - P6 Check
================================================

| Element verified | Status |
|-----------------|--------|
| All P6 gaps addressed? | [OK/FAIL] |
| T1 Realistic canary files (non-obvious names, ZERO forbidden word)? | [OK/FAIL] |
| T2 Canary access detection adapted to OS? | [OK/FAIL] |
| T3 Canary tokens (fake credentials) deployed? | [OK/FAIL] |
| T4 SHA-256 chain secure logging + verify_integrity()? | [OK/FAIL] |
| T5 Behavioral analysis (bounded history, anomaly scores)? | [OK/FAIL] |
| T6 Kill switch (multi-confirmation, complete wipe)? | [OK/FAIL] |
| T7 Anti-RE (if desktop/mobile) or N/A documented? | [OK/FAIL] |
| --- LLM AXIS (if applicable) --- | --- |
| T8 CaMeL dual LLM pattern (or N/A)? | [OK/FAIL or N/A] |
| T9 Spotlighting ^ marking (or N/A)? | [OK/FAIL or N/A] |
| T10 LLM input validation + injection detection (or N/A)? | [OK/FAIL or N/A] |
| T11 Output filtering PII/secrets/exfiltration (or N/A)? | [OK/FAIL or N/A] |
| T12 Rule of Two irreversible actions (or N/A)? | [OK/FAIL or N/A] |
| T13 LLM call rate limiting (or N/A)? | [OK/FAIL or N/A] |
| T14 Anti-deception LLM (or N/A)? | [OK/FAIL or N/A] |
| Code adapted to project language/stack? | [OK/FAIL] |
| Bounded collections (maxSize + eviction)? | [OK/FAIL] |
| P6_deception_traps.yaml written? | [OK/FAIL] |

COMPLETION GATE
- Ready to enter P7? [YES/NO]
================================================
```

**STOP CONDITION** : If any element FAIL -> fix before moving to P7

---

### P6 YAML Output

Conforms to the common P3-P6 contract defined in WORKFLOW.md S3:

```yaml
# .defender_working/{SESSION_ID}/data/P6_deception_traps.yaml
schema_version: "1.1.0"
phase: 6
generated_at: "{ISO8601}"
input_ref: "P5_network_crypto_hardening.yaml"

# Conditional LLM context
llm_defense_applicable: true|false  # Determines if LLM fixes are included

fixes:
  # DECEPTION fixes (always present)
  - id: FIX-001
    gap_ref: GAP-{NNN}
    category: DECEPTION
    title: "{fix description}"
    priority: P0|P1|P2|P3
    target_file: "path/to/file.ext"
    insertion_point:
      file: "path/to/file.ext"
      after_line: "{N}"
      method: "replace|insert|wrap"
    code_file: "code/deception_traps/{filename}.ext"
    test_file: "code/deception_traps/test_{filename}.ext"
    before_code: "# Original code"
    after_code: "# Code with deception protection"
    dependencies_added:
      - name: "{dep_name}"
        version: "{x.y.z}"
        source: "{package_manager}"
    integration_steps:
      - "Integration step 1"
    effort: "15 minutes"

  # LLM fixes (present only if llm_defense_applicable = true)
  - id: FIX-{NNN}
    gap_ref: GAP-{NNN}
    category: LLM
    title: "{LLM fix description}"
    # ... same structure as above

tests:
  - id: TEST-001
    fix_ref: FIX-001
    type: "unit|integration"
    test_file: "code/deception_traps/test_{filename}.ext"
    description: "Verifies that the protection works"

gap_coverage:
  total_gaps_assigned: "{P2.gap_summary.by_phase.P6}"
  addressed: "{count}"
  skipped: 0
  skipped_reasons: []

canary_files:
  deployed: "{count}"
  naming_rule: "No forbidden word (canary/trap/honey/fake/decoy/bait/lure/test/dummy/sample)"
  detection_mechanism: "{inotify|fanotify|poll|beacon — based on OS}"
```

---

**End of P6-PIEGES-DECOURAGEMENT.md**
