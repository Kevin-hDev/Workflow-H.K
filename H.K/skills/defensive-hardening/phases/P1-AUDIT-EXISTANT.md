# Phase 1: Existing Audit

**Type** : Exploratory
**Executor** : LLM + Code analysis
**Knowledge** : All defensive DATA files loaded in P0
**Input** : P0_detection.yaml

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

---

### REFLECTION - Entry Gate P1

**Objective** : Completely inventory the security protections already in place in the project. Establish the current security posture before starting the hardening. Don't reinvent what works. Use the defensive DATA loaded in P0 to know what to look for.

```
REFLECTION - P1 Entry Gate
================================================

CENTRAL PROBLEM
Build a complete inventory of what already exists in terms
of security in the project. Don't reinvent what works.
Identify the strengths and specific weaknesses of the stack
detected in P0.

UPSTREAM DATA (P0)
| Metric | Value | Source |
|--------|-------|--------|
| Languages | {P0.detected_stack.languages} | P0_detection.yaml |
| Frameworks | {P0.detected_stack.frameworks} | P0_detection.yaml |
| Target OS | {P0.detected_stack.os_targets} | P0_detection.yaml |
| Mode | {P0.adversary_input.mode} | P0_detection.yaml |
| Loaded DATA | {P0.loaded_data} | P0_detection.yaml |
| Active categories | {P0.defense_categories_active} | P0_detection.yaml |

KEY QUESTIONS (derived from DATA)
For each loaded defensive DATA file, check if the project
already implements the protections described in that file.

================================================
STOP CHECK
- P0_detection.yaml read and valid? [YES/NO]
- Project path accessible? [YES/NO]
- Configuration files readable? [YES/NO]
- Defensive DATA loaded? [YES/NO]
- Defensive DATA files from P0.loaded_data.defensive_files READ (not just listed)? [YES/NO]
- Ready to continue? [YES/NO]
================================================
```

---

### PLANNING - Breakdown

The subtask breakdown is DYNAMIC: it depends on the defense categories active detected in P0. For each active category, an audit subtask is created.

```
PLANNING - P1 Subtasks
================================================

| # | Subtask | DATA source | Expected output |
|---|---------|------------|----------------|
| T1 | Scan dependency manifests | Config files from P0 | List of security libs |
| T2 | Audit runtime (per detected language) | data/defensive/generic/def-runtime-memory.md + {stack}/ | Memory, crypto, error protections |
| T3 | Audit framework (per detected framework) | data/defensive/generic/def-framework-hardening.md + {stack}/ | CSP, isolation, sanitization |
| T4 | Audit IPC communications (if detected) | data/defensive/generic/def-ipc-hardening.md + {stack}/ | IPC auth, anti-replay |
| T5 | Audit storage and crypto | data/defensive/generic/def-crypto-secrets.md + {stack}/ | Keyring, encryption, KDF |
| T6 | Audit network and TLS | data/defensive/generic/def-network-tls.md + {stack}/ | TLS config, pinning, redirects |
| T7 | Audit OS isolation and privileges | data/defensive/generic/def-os-isolation.md + {stack}/ | pkexec, sandbox, elevation |
| T8 | Audit anti-RE and deception | data/defensive/generic/def-deception-monitoring.md + {stack}/ | Anti-debug, canary, monitoring |
| T9 | Audit LLM defenses (if LLM detected) | data/defensive/generic/def-llm-pipeline.md + {stack}/ | Spotlighting, IO validation |
| T10 | Audit authentication (if auth detected) | data/defensive/generic/def-auth-patterns.md + {stack}/ | Auth patterns, session mgmt |
| T11 | Evaluate global posture | All results above | Global score + strengths/weaknesses |
| T12 | Write output | P1_audit.yaml + report | Generated files |

NOTE: Skip subtasks whose category is INACTIVE (not detected in P0).

================================================
```

---

### EXECUTION

#### Universal Audit Method

For each active defense category:

1. **Load the corresponding defensive DATA** (generic/ + {stack}/ if available)
2. **Extract expected protections** from the DATA file
3. **Search the code** to see if each protection is implemented
4. **Evaluate effectiveness** : strong / partial / weak / absent
5. **Document the result** with precise location

Format for each protection found:
```yaml
- id: PROT-{seq}
  category: "RUNTIME|FRAMEWORK|IPC|CRYPTO|NET|OS|ANTI-RE|DECEPTION|LLM|AUTH|STORAGE|SANDBOX"
  title: "Protection description"
  location: "file:line"
  effectiveness: "strong|partial|weak|absent"
  notes: "What works and what is missing"
```

---

#### T1: Scan Dependency Manifests

Based on config files detected in P0, look for security dependencies:

**For Cargo.toml (Rust):**
```bash
grep -n "subtle\|zeroize\|secrecy\|ring\|rustls\|reqwest\|keyring\|argon2\|sha2\|hmac\|rand\|chacha\|aes\|ammonia\|rusqlite\|tokio-rustls\|webpki" Cargo.toml
```

**For package.json (JavaScript/TypeScript):**
```bash
grep -n "dompurify\|rehype-sanitize\|crypto-js\|helmet\|csp\|zod\|yup\|validator\|bcrypt\|jose\|jsonwebtoken" package.json
```

**For pyproject.toml / requirements.txt (Python):**
```bash
grep -n "nh3\|bleach\|pydantic\|cryptography\|requests\|certifi\|presidio\|llm-guard\|bcrypt\|argon2" pyproject.toml requirements.txt 2>/dev/null
```

**For pubspec.yaml (Dart/Flutter):**
```bash
grep -n "flutter_secure_storage\|encrypt\|crypto\|pointycastle\|http_certificate_pinning\|local_auth" pubspec.yaml
```

**For go.mod (Go):**
```bash
grep -n "crypto\|bcrypt\|argon2\|tls\|jwt\|validator\|sanitize" go.mod
```

**For composer.json (PHP):**
```bash
grep -n "laravel/sanctum\|league/oauth\|defuse/php-encryption\|paragonie\|htmlpurifier" composer.json
```

**Automated vulnerability audit (if tools available):**
```bash
# Based on detected package manager
# cargo audit
# npm audit --audit-level=high
# pip-audit
# composer audit
```

#### T2: Audit Runtime

Load `data/defensive/generic/def-runtime-memory.md` + the stack-specific DATA (e.g., `def-rust-rust-runtime-hardening.md` or `def-flutter-dart-runtime-hardening.md`).

For each protection technique listed in the DATA:
- Check if it's implemented in the code
- If yes: document as PROT-xxx with location
- If no: note the absence (will be addressed in P2)

Typical protections to audit (non-exhaustive, derived from DATA):

| Protection | Generic grep patterns | Severity if absent |
|-----------|----------------------|--------------------|
| Constant-time comparison | `constant_time\|ct_eq\|hmac_verify\|secure_compare` | CRITICAL (CWE-208) |
| Secret memory cleanup | `zeroize\|Zeroize\|SecureString\|clear_memory\|memset_s` | CRITICAL (CWE-316) |
| CSPRNG | `OsRng\|SecureRandom\|crypto.randomBytes\|os.urandom\|csprng` | CRITICAL (CWE-330) |
| Secure error handling | `thiserror\|anyhow\|Result<\|try.*catch\|rescue` | HIGH (CWE-209) |
| Input validation | `regex\|validate\|sanitize\|zod\|yup\|pydantic` | HIGH (CWE-20) |
| Bounded collections | `max_size\|with_capacity\|maxlen\|limit` | HIGH (CWE-400) |
| Unsafe/eval blocks | `unsafe\|eval(\|exec(\|shell=True` | HIGH |

#### T3: Audit Framework

Load `data/defensive/generic/def-framework-hardening.md` + the stack-specific DATA.

Typical protections to audit:

| Protection | What to look for | Severity if absent |
|-----------|-----------------|-------------------|
| CSP (Content Security Policy) | CSP headers, meta tags, framework config | CRITICAL (XSS) |
| Output sanitization | DOMPurify, nh3, html_escape, sanitize | CRITICAL (XSS) |
| CSRF protection | CSRF tokens, SameSite cookies | HIGH |
| Security headers | X-Frame-Options, HSTS, X-Content-Type | HIGH |
| Prototype pollution (JS) | freezePrototype, Object.freeze | HIGH |
| Isolation/sandboxing | Isolation Pattern (Tauri), iframe sandbox | HIGH |
| eval()/innerHTML without sanitization | eval, dangerouslySetInnerHTML, v-html | CRITICAL |

#### T4: Audit IPC Communications

If IPC detected in P0, load `data/defensive/generic/def-ipc-hardening.md` + stack-specific DATA.

| Protection | What to look for | Severity if absent |
|-----------|-----------------|-------------------|
| IPC authentication | HMAC, signature, token verification | CRITICAL |
| Anti-replay | Nonces, timestamps, message TTL | HIGH |
| Argument validation | Regex validators, type checking | HIGH |
| Subprocess integrity check | SHA-256 binary verification | HIGH |
| shell=False (Python subprocess) | subprocess.run without shell=True | CRITICAL |
| Authorization guards | Permission checks before execution | HIGH |

#### T5: Audit Storage and Crypto

Load `data/defensive/generic/def-crypto-secrets.md` + stack-specific DATA.

| Protection | What to look for | Severity if absent |
|-----------|-----------------|-------------------|
| Secrets in OS keyring | keyring, Keychain, CredentialStore, SecureStorage | CRITICAL |
| AES-256-GCM or ChaCha20 encryption | Not CBC/ECB | CRITICAL |
| Argon2id or PBKDF2 KDF | Not SHA-256 directly for passwords | CRITICAL |
| Non-reused CSPRNG nonces | Nonce generated before each encryption | CRITICAL |
| No hardcoded secrets | No `const API_KEY = "..."` in code | CRITICAL |
| No secrets in logs | Token/password filtering from logs | CRITICAL |

#### T6: Audit Network and TLS

Load `data/defensive/generic/def-network-tls.md` + stack-specific DATA.

| Protection | What to look for | Severity if absent |
|-----------|-----------------|-------------------|
| Minimum TLS version | TLS 1.2+ or TLS 1.3 minimum | HIGH |
| Certificate pinning | SPKI SHA-256 verification | HIGH |
| No danger_accept_invalid_certs | Never true in production | CRITICAL (MITM) |
| Redirects disabled (sensitive APIs) | redirect::Policy::none() | HIGH |
| Configured timeouts | connect_timeout, read_timeout | HIGH |
| HTTPS only | No http:// URLs | CRITICAL |
| Restrictive CORS | No Access-Control-Allow-Origin: * | HIGH |

#### T7: Audit OS Isolation and Privileges

Load `data/defensive/generic/def-os-isolation.md` + stack-specific DATA.

| Protection | What to look for | Severity if absent |
|-----------|-----------------|-------------------|
| No sudo, use pkexec | No Command::new("sudo") | HIGH |
| Hardcoded args for elevation | No format! in pkexec args | CRITICAL |
| Validation before elevation | User confirmation required | HIGH |
| Subprocess sandboxing | seccomp, AppArmor, macOS sandbox | HIGH |
| .policy file (polkit) | Explicitly authorized actions | HIGH |

#### T8: Audit Anti-RE and Deception

Load `data/defensive/generic/def-deception-monitoring.md` + stack-specific DATA.

| Protection | What to look for | Severity if absent |
|-----------|-----------------|-------------------|
| Debugger detection | TracerPid, IsDebuggerPresent, sysctl P_TRACED | HIGH |
| LD_PRELOAD check | env::var("LD_PRELOAD") detection | HIGH |
| Canary files | Deployed trap files | HIGH |
| Secure logging | SHA-256 chain, anti-tamper | HIGH |
| Code signing | Binary signature in release | HIGH |
| Symbols stripped in release | strip = true in build config | MEDIUM |

#### T9: Audit LLM Defenses

If LLM detected in P0, load `data/defensive/generic/def-llm-pipeline.md` + stack-specific DATA.

| Protection | What to look for | Severity if absent |
|-----------|-----------------|-------------------|
| Spotlighting / external content marking | Delimiters on untrusted content | CRITICAL (XPIA) |
| LLM isolation (CaMeL / dual LLM) | Planning LLM != data LLM | HIGH |
| Input validation (length, patterns) | Max tokens, injection detection | HIGH |
| Output schema (JSON Schema) | Structured output validation | HIGH |
| PII filter on output | Presidio, secret regex patterns | HIGH |
| LLM call rate limiting | Bucket per session/user | HIGH |

#### T10: Audit Authentication

If auth detected in P0, load `data/defensive/generic/def-auth-patterns.md` + stack-specific DATA.

| Protection | What to look for | Severity if absent |
|-----------|-----------------|-------------------|
| Password hashing (bcrypt/argon2) | No direct SHA-256 | CRITICAL |
| Secure session tokens | CSPRNG, 32+ bytes, expiration | CRITICAL |
| Session expiration | Configured TTL | HIGH |
| Brute-force protection | Rate limiting + lockout | HIGH |
| Mutual authentication | mTLS, Ed25519 signatures | HIGH |

#### T11: Evaluate Global Posture

```yaml
security_posture:
  overall_rating: "WEAK|MEDIUM|GOOD|EXCELLENT"
  strengths:
    - "Description of each strength"
  weaknesses:
    - "Description of each weakness"
  missing_categories:
    - "Category with no protection at all"
  score_by_category:
    # Dynamic based on active categories (P0)
    RUNTIME:    0/10
    FRAMEWORK:  0/10
    IPC:        0/10
    CRYPTO:     0/10
    NET:        0/10
    OS:         0/10
    ANTI-RE:    0/10
    DECEPTION:  0/10
    LLM:        0/10
    AUTH:       0/10
```

#### T12: Write Output

**Writing order** (CRITICAL):
1. **YAML** : `.defender_working/{SESSION_ID}/data/P1_audit.yaml`
2. **MD** : `.defender_working/{SESSION_ID}/reports/P1-EXISTING-AUDIT.md`

---

### VALIDATION - Completeness Check

```
VALIDATION - P1 Check
================================================

| Element verified | Status |
|-----------------|--------|
| Manifests scanned (config files detected in P0)? | [OK/FAIL] |
| Each ACTIVE category audited? | [OK/FAIL] |
| Runtime audited (per detected language)? | [OK/FAIL] |
| Framework audited (per detected framework)? | [OK/FAIL] |
| IPC audited (if component detected in P0)? | [OK/FAIL/N/A] |
| Storage and crypto audited? | [OK/FAIL] |
| Network TLS audited? | [OK/FAIL] |
| OS isolation audited? | [OK/FAIL] |
| Anti-RE and deception audited? | [OK/FAIL] |
| LLM defenses audited (if LLM detected in P0)? | [OK/FAIL/N/A] |
| Authentication audited (if auth detected in P0)? | [OK/FAIL/N/A] |
| Global posture evaluated with scores per category? | [OK/FAIL] |
| P1_audit.yaml written and valid (syntactically correct YAML)? | [OK/FAIL] |
| P1-EXISTING-AUDIT.md report generated? | [OK/FAIL] |

COMPLETION GATE
- Ready to enter P2? [YES/NO]
================================================
```

---

## P1 Report Template

```markdown
# P1 - Existing Audit

## Summary
[Summary: X protections found, global posture WEAK/MEDIUM/GOOD]
[Stack: {languages}, {frameworks}, OS {os_targets}]
[Mode: {TARGETED|FULL} from P0]

## Existing Protections
| ID | Category | Title | Location | Effectiveness |
|----|----------|-------|----------|--------------|
| PROT-001 | RUNTIME | ... | src/...:42 | strong |

## Posture by Category
| Category | Score | State |
|----------|-------|-------|
| RUNTIME   | X/10  | ... |
| FRAMEWORK | X/10  | ... |
| (dynamic based on active categories) |

## Strengths
[What is well done with evidence in the code]

## Weaknesses
[What is missing or insufficient with location]

## Uncovered Categories
[Domains with no protection at all]
```

---

**End of P1-AUDIT-EXISTANT.md**
