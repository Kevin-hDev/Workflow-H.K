# Phase 5: Network and Crypto Hardening

**Type** : Defensive implementation
**Executor** : LLM + Code writing
**Knowledge** : data/defensive/generic/def-network-tls.md, data/defensive/generic/def-crypto-secrets.md + specific DATA platform/
**Input** : P4_framework_hardening.yaml
**Output** : Code in code/network_crypto_hardening/

---

## EXHAUSTIVENESS DIRECTIVE - MANDATORY

> Before any execution, load the defensive DATA files selected in P0
> (listed in `P0_detection.yaml.loaded_data.defensive_files`).
>
> Active defense categories are in `P0_detection.yaml.defense_categories_active`.
> Only the CRYPTO and NET categories guide this phase.
>
> Hardening patterns come from generic DATA (def-network-tls.md, def-crypto-secrets.md),
> platform/ DATA (platform-linux.md, platform-windows.md, etc.) and specific stack/ DATA.
> Adapt each pattern to the language and frameworks detected in P0.

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

> **CRITICAL** : Complete all four steps in sequence and display the result of each step.

---

### REFLECTION - Entry Gate P5

**Objective** : Write code that protects network communications and cryptographic operations. TLS hardening, certificate validation, redirect policy, secret storage via OS keychain, robust KDF, CSPRNG, network rate limiting, CORS, API security.

**Display REFLECTION results in this format:**

```
REFLECTION - P5 Entry Gate
================================================

CENTRAL PROBLEM
Protect the network layer (everything that leaves the process)
and the crypto layer (everything that is persisted or derived).
If an attacker cannot intercept communications
nor extract secrets from disk, the surface reduces
considerably.

UPSTREAM DATA
| Metric | Value | Source |
|--------|-------|--------|
| Detected stack | {P0.detected_stack} | P0_detection.yaml |
| Gaps assigned to P5 | {P2.gap_summary.by_phase.P5} | P2 |
| P3+P4 fixes written | {P3.addressed + P4.addressed} | P3+P4 YAML |
| P5 categories | CRYPTO, NET | P2 |
| Loaded defensive DATA | {count} files | P0 |

KNOWLEDGE TO LOAD
- @data/defensive/generic/def-network-tls.md
- @data/defensive/generic/def-crypto-secrets.md
- @data/defensive/platform/{detected platforms}.md

UNKNOWNS
- TLS libraries used by the project (native-tls, rustls, openssl, etc.)
- Current secret storage mode (env var, file, keychain, etc.)
- Current crypto algorithms (KDF, AEAD, signature)
- HTTP redirect configuration
- DNS exposure (local resolution vs proxy)

RISKS
- Introducing regressions if existing HTTP clients are modified
- Keychain incompatibility on some OS/headless environments
- Performance degradation if KDF is too slow for the use case

================================================
STOP CHECK
- P4_framework_hardening.yaml read and valid? [YES/NO]
- CRYPTO+NET defensive DATA loaded? [YES/NO]
- Network/TLS/crypto defensive DATA files READ? [YES/NO]
- Stack and frameworks identified? [YES/NO]
- Ready to continue to PLANNING? [YES/NO]
================================================
```

**STOP CONDITION** : If any check = NO -> Resolve before continuing

---

### PLANNING - Breakdown into Subtasks

**Display planning in this format:**

```
PLANNING - P5 Subtasks
================================================

| # | Subtask | Category | DATA source |
|---|---------|----------|------------|
| T1 | TLS version enforcement (minimum 1.3) | NET | def-network-tls.md §1 |
| T2 | Certificate validation fail-closed | NET | def-network-tls.md §2 |
| T3 | Strict redirect policy (auth APIs) | NET | def-network-tls.md §3 |
| T4 | Certificate pinning SPKI SHA-256 | NET | def-network-tls.md §4 |
| T5 | DNS protection (proxy resolution) | NET | def-network-tls.md §5 |
| T6 | Configured timeouts per service | NET | def-network-tls.md §6 |
| T7 | Restrictive CORS policy | NET | def-network-tls.md |
| T8 | Network rate limiting | NET | def-network-tls.md §7 |
| T9 | API security (auth headers, input) | NET | def-network-tls.md |
| T10 | OS keychain integration (secrets) | CRYPTO | def-crypto-secrets.md §1 |
| T11 | Encrypted file storage (vault) | CRYPTO | def-crypto-secrets.md §2 |
| T12 | Memory zeroization after use | CRYPTO | def-crypto-secrets.md §3 |
| T13 | Robust KDF (Argon2id/PBKDF2) | CRYPTO | def-crypto-secrets.md §4 |
| T14 | AEAD encryption (AES-256-GCM) | CRYPTO | def-crypto-secrets.md §5 |
| T15 | CSPRNG for all tokens/nonces | CRYPTO | def-crypto-secrets.md §6 |
| T16 | Secret redaction in logs | CRYPTO | def-crypto-secrets.md §7 |
| T17 | Signature and verification (Ed25519) | CRYPTO | def-crypto-secrets.md |

STACK ADAPTATION
- Adapt each subtask to the language and framework detected in P0
- Use idiomatic libraries for the language
- Consult DATA platform/ for OS specificities

================================================
```

---

### EXECUTION

#### P5 Defensive Coding Method

For each GAP-xxx assigned to P5, apply this method:

1. Read the GAP in P2_reinforcement_points.yaml
2. Consult the corresponding defensive DATA file (def-network-tls.md or def-crypto-secrets.md)
3. Consult the platform/ DATA file if the fix is OS-specific
4. Write complete code adapted to the project's language
5. Write associated tests
6. Document integration instructions

**IMPORTANT** : Code must be adapted to the stack detected in P0.
Do not hardcode a specific stack (Rust, Python, Go, etc.).
Use universal patterns from DATA and adapt them.

---

#### T1: TLS Version Enforcement

**DATA ref** : def-network-tls.md §1 — TLS Version Enforcement

**Universal principle**:
- Explicitly configure TLS 1.3 minimum in code
- NEVER inherit OS defaults
- Unconditionally disable TLS 1.0 and 1.1
- Prefer a pure-language TLS backend when available (rustls > openssl, native Go crypto/tls)

**Adapt to detected language**:
- Rust : `rustls` with `ClientConfig` configured TLS 1.3 minimum
- Python : `ssl.SSLContext` with `minimum_version = ssl.TLSVersion.TLSv1_3`
- Go : `tls.Config{ MinVersion: tls.VersionTLS13 }`
- Node.js : `https.Agent({ secureProtocol: 'TLSv1_3_method' })`
- Java : `SSLContext` with `setEnabledProtocols(new String[]{"TLSv1.3"})`

**Generic code** (adapt to language):
```
// Pseudo-code — adapt to project language
http_client = HttpClientBuilder()
    .tls_backend(PURE_LANG_TLS)     // No C/OpenSSL binding if possible
    .min_tls_version(TLS_1_3)       // TLS 1.3 minimum
    .disable_tls_versions([1.0, 1.1, 1.2])  // Optional if 1.3 strict
    .user_agent("Generic/1.0")      // Generic user agent
    .build()

// NEVER: accept_invalid_certs(true)
// NEVER: skip_hostname_verification()
```

**Integration checklist**:
```yaml
checklist_tls:
  - search: "Look for any HTTP client creation without explicit TLS"
  - replace: "Replace with secure client with TLS 1.3 minimum"
  - verify: "No fallback to TLS 1.0/1.1 in code"
  - audit: "TLS backend dependency audited (cargo audit / npm audit / pip-audit)"
```

---

#### T2: Certificate Validation — Fail Closed

**DATA ref** : def-network-tls.md §2 — Certificate Validation

**Universal principle**:
- TLS errors MUST terminate the connection
- ZERO fallback to HTTP
- ZERO bypass of certificate verification
- ZERO acceptance of self-signed in production

**Forbidden patterns** (search in code):
```yaml
forbidden_patterns:
  - pattern: "accept_invalid_certs"
    risk: "Disables certificate verification — trivial MitM"
  - pattern: "danger_accept_invalid"
    risk: "Explicit TLS validation bypass"
  - pattern: "verify_mode.*NONE"
    risk: "Disables SSL verification (Python ssl module)"
  - pattern: "InsecureSkipVerify.*true"
    risk: "Go TLS skip verify — trivial MitM"
  - pattern: "NODE_TLS_REJECT_UNAUTHORIZED.*0"
    risk: "Node.js disables verification globally"
  - pattern: "CURLOPT_SSL_VERIFYPEER.*0"
    risk: "curl/libcurl disables verification"
  - pattern: "rejectUnauthorized.*false"
    risk: "Node.js https agent skip verify"
```

**Validation test**:
- Test against invalid endpoints (expired certificates, self-signed, wrong hostname)
- Verify that EACH TLS error propagates an error and does not degrade silently

---

#### T3: Strict Redirect Policy

**DATA ref** : def-network-tls.md §3 — Strict Redirect Policy

**Universal principle**:
- For API calls with credentials: redirects DISABLED
- The `Authorization: Bearer` header is stripped cross-domain, but custom headers (x-api-key, etc.) ARE NOT
- Any unexpected redirect = security event to log

**Rules**:
```yaml
redirect_policy:
  api_with_auth:
    policy: "none"          # ZERO redirect
    on_redirect: "error"    # Return an error
    log: true               # Log as security event

  public_fetch_no_auth:
    policy: "limited"       # Max 3 redirects
    max_redirects: 3
    https_only: true        # Block redirects to HTTP
    domain_allowlist: true  # Verify destination is expected
```

---

#### T4: Certificate Pinning SPKI SHA-256

**DATA ref** : def-network-tls.md §4

**Universal principle**:
- Pin on SPKI (Subject Public Key Info), not on full certificate
- SPKI is stable when certificate is renewed
- ALWAYS include a backup pin (rotation)
- Document the pin update procedure

**Implementation**:
```yaml
cert_pinning:
  strategy: "SPKI_SHA256"
  pins_per_service:
    - service: "Main API"
      primary: "sha256/TO_BE_FILLED_AT_DEPLOY"
      backup: "sha256/TO_BE_FILLED_BACKUP"
    - service: "Update service"
      primary: "sha256/TO_BE_FILLED_AT_DEPLOY"
      backup: "sha256/TO_BE_FILLED_BACKUP"
  extraction_command: |
    echo | openssl s_client -connect HOST:443 -servername HOST 2>/dev/null \
      | openssl x509 -pubkey -noout \
      | openssl pkey -pubin -outform der \
      | openssl dgst -sha256 -binary \
      | base64
```

---

#### T5: DNS Protection

**DATA ref** : def-network-tls.md §5

**Universal principle**:
- If project uses SOCKS5 proxy: force `socks5h://` (DNS resolution by proxy)
- `socks5://` (without h) = local DNS resolution = DNS leak
- If DoH available: use DNS-over-HTTPS
- Validate that proxy URLs use the correct schema

---

#### T6: Configured Timeouts per Service

**DATA ref** : def-network-tls.md §6

**Universal principle**:
- Each service type has its own timeouts
- Connection timeout + total timeout separated
- NEVER use infinite or absent timeout

```yaml
timeout_policy:
  api_llm:
    connect: "15s"
    total: "120s"       # LLMs can take time
  api_fast:
    connect: "5s"
    total: "15s"
  web_scraping:
    connect: "10s"
    total: "30s"
  cert_verification:
    total: "5s"
  internal_health:
    connect: "2s"
    total: "5s"
```

---

#### T7: Restrictive CORS Policy

**Universal principle**:
- Define allowed origins explicitly (not `*`)
- Limit allowed HTTP methods
- Limit exposed headers
- Configure `credentials: true` only for trusted origins

```yaml
cors_policy:
  allowed_origins: ["explicit list, NEVER *"]
  allowed_methods: ["GET", "POST"]          # Minimum necessary
  allowed_headers: ["Content-Type", "Authorization"]
  expose_headers: []                         # Minimum
  max_age: 3600
  credentials: false                         # true only if necessary
```

---

#### T8: Network Rate Limiting

**DATA ref** : def-network-tls.md §7

**Universal principle**:
- Rate limiting per IP, per user, per endpoint
- 429 response with `Retry-After` header
- Do not reveal internal information in the 429 response
- Counters with temporal eviction (sliding window)

---

#### T9: API Security

**Universal principle**:
- Authentication headers transmitted only over HTTPS
- Input validation on ALL API parameters
- Generic error responses (no internal info)
- Rate limiting per endpoint

---

#### T10: OS Keychain Integration

**DATA ref** : def-crypto-secrets.md §1 — OS Keychain Integration

**Universal principle**:
- Use OS keychain as root of trust
- Keychain stores ONE master key (32 bytes, CSPRNG-generated)
- All other secrets in an encrypted vault, unlocked by master key

**Per platform**:
```yaml
keychain_by_platform:
  macos: "Keychain Services (SecItemAdd / SecItemCopyMatching) — Secure Enclave"
  windows: "Credential Manager via DPAPI — CryptProtectData"
  linux_desktop: "Secret Service API (GNOME Keyring / KDE Wallet) via D-Bus"
  linux_headless: "Kernel keyring (keyutils) — session-scoped"
  linux_systemd: "systemd-creds — AES-256-GCM, optional TPM2"
```

**Adapt to language**:
- Rust : `keyring-rs` (multi-OS abstraction)
- Python : `keyring` (PyPI)
- Go : `zalando/go-keyring`
- Node.js : `keytar` (deprecated) or native calls via `node-ffi`

---

#### T11: Encrypted File Storage (Vault)

**DATA ref** : def-crypto-secrets.md §2

**Universal principle**:
- AES-256-GCM encryption with unique nonce per operation (CSPRNG)
- Nonce (12 bytes) prepended to ciphertext
- File with restrictive permissions (0600 Unix)
- NEVER reuse a nonce with the same key (catastrophic under GCM)

---

#### T12: Memory Zeroization

**DATA ref** : def-crypto-secrets.md §3

**Universal principle**:
- GC does NOT guarantee memory erasure
- Use write primitives not eliminated by the compiler
- Zeroize the complete buffer (capacity, not just length)
- Apply memory barrier after writing

**Adapt to language**:
- Rust : `zeroize` crate with `ZeroizeOnDrop` derive
- Python : `ctypes.memset` on buffer (Python str is immutable — use bytearray)
- Go : `memguard` or loop with `runtime.KeepAlive`
- C/C++ : `explicit_bzero` or `SecureZeroMemory` (Windows)

---

#### T13: Robust KDF

**DATA ref** : def-crypto-secrets.md §4

**Universal principle**:
- Argon2id: GPU + side-channel resistant (recommended)
- PBKDF2-HMAC-SHA512: 600,000 iterations minimum (NIST 2023)
- bcrypt: 12 rounds minimum (acceptable alternative)
- NEVER: MD5, SHA-1, SHA-256 alone, or custom KDF

```yaml
kdf_parameters_2026:
  argon2id:
    memory: "64 MB"      # m = 65536
    iterations: 3         # t = 3
    parallelism: 4        # p = 4
    output: "32 bytes"
  pbkdf2_hmac_sha512:
    iterations: 600000    # NIST 2023 minimum
    output: "32 bytes"
  bcrypt:
    rounds: 12            # 2026 minimum
```

---

#### T14: AEAD Encryption

**DATA ref** : def-crypto-secrets.md §5

**Universal principle**:
- AES-256-GCM: authenticated encryption, single-pass, hardware-accelerated
- NEVER: CBC (padding oracle), ECB (deterministic), CTR without MAC
- Unique nonce per operation (12 bytes, CSPRNG)
- Authentication tag verified BEFORE any use of plaintext

---

#### T15: CSPRNG for Tokens and Nonces

**DATA ref** : def-crypto-secrets.md §6

**Universal principle**:
- NEVER `Math.random()`, `random.random()`, `rand::random()` non-crypto
- ALWAYS: system CSPRNG (OsRng, secrets, crypto/rand, SecureRandom)

**Adapt to language**:
- Rust : `rand::rngs::OsRng` or `getrandom`
- Python : `secrets.token_bytes()`, `secrets.token_hex()`
- Go : `crypto/rand.Read()`
- Node.js : `crypto.randomBytes()`
- Java : `java.security.SecureRandom`

---

#### T16: Secret Redaction in Logs

**DATA ref** : def-crypto-secrets.md §7

**Universal principle**:
- Intercept ALL logs before writing
- Redact: API keys, tokens, passwords, JWT, internal paths
- Use compiled regex patterns (performance)
- Visible error message MUST NEVER contain a secret

```yaml
redaction_patterns:
  - name: "Generic API keys"
    pattern: "sk-[A-Za-z0-9_-]{20,}"
    replacement: "[API_KEY_REDACTED]"
  - name: "Bearer tokens"
    pattern: "Bearer [A-Za-z0-9._\\-]{20,}"
    replacement: "Bearer [REDACTED]"
  - name: "JWT"
    pattern: "eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+"
    replacement: "[JWT_REDACTED]"
  - name: "URLs with credentials"
    pattern: "https?://[^:@\\s]+:[^@\\s]+@"
    replacement: "https://[CREDENTIALS]@"
  - name: "Home paths"
    pattern: "/home/[a-z_][a-z0-9_-]{0,30}/\\S+"
    replacement: "[PATH_REDACTED]"
```

---

#### T17: Signature and Verification (Ed25519)

**Universal principle**:
- Ed25519 for signatures: fast, deterministic, side-channel resistant
- Constant-time verification (no `==` comparison on signatures)
- Strict separation private key / public key
- Private key in protected memory (zeroize on drop)

---

### VALIDATION - Completeness Check

```
VALIDATION - P5 Check
================================================

| Element verified | Status |
|-----------------|--------|
| All P5 gaps addressed? | [OK/FAIL] |
| TLS 1.3 minimum explicitly configured? | [OK/FAIL] |
| Certificate validation fail-closed (no bypass)? | [OK/FAIL] |
| Redirect policy none for APIs with auth? | [OK/FAIL] |
| Certificate pinning SPKI with backup pin? | [OK/FAIL] |
| DNS protection (socks5h if proxy)? | [OK/FAIL] |
| Timeouts configured per service type? | [OK/FAIL] |
| Restrictive CORS policy (no *)? | [OK/FAIL] |
| Network rate limiting configured? | [OK/FAIL] |
| OS keychain integration (master key)? | [OK/FAIL] |
| Encrypted vault AES-256-GCM with unique nonce? | [OK/FAIL] |
| Memory zeroization on all secrets? | [OK/FAIL] |
| Robust KDF (Argon2id or PBKDF2 600k+)? | [OK/FAIL] |
| CSPRNG for all tokens/nonces (not Math.random)? | [OK/FAIL] |
| Secret redaction in logs? | [OK/FAIL] |
| Code adapted to project language/stack? | [OK/FAIL] |
| Tests written for each fix? | [OK/FAIL] |
| P5_network_crypto_hardening.yaml written? | [OK/FAIL] |

COMPLETION GATE
- Ready to enter P6? [YES/NO]
================================================
```

**STOP CONDITION** : If any element FAIL -> fix before moving to P6

---

### P5 YAML Output

Conforms to the common P3-P6 contract defined in WORKFLOW.md S3:

```yaml
# .defender_working/{SESSION_ID}/data/P5_network_crypto_hardening.yaml
schema_version: "1.1.0"
phase: 5
generated_at: "{ISO8601}"
input_ref: "P4_framework_hardening.yaml"

fixes:
  - id: FIX-001
    gap_ref: GAP-{NNN}
    category: NET|CRYPTO
    title: "{fix description}"
    priority: P0|P1|P2|P3
    target_file: "path/to/file.ext"
    insertion_point:
      file: "path/to/file.ext"
      after_line: "{N}"
      method: "replace|insert|wrap"
    code_file: "code/network_crypto_hardening/{filename}.ext"
    test_file: "code/network_crypto_hardening/test_{filename}.ext"
    before_code: "# Original vulnerable code"
    after_code: "# Protected code"
    dependencies_added:
      - name: "{dep_name}"
        version: "{x.y.z}"
        source: "{package_manager}"
    integration_steps:
      - "Integration step 1"
    effort: "15 minutes"

tests:
  - id: TEST-001
    fix_ref: FIX-001
    type: "unit|integration"
    test_file: "code/network_crypto_hardening/test_{filename}.ext"
    description: "Verifies that the protection works"

gap_coverage:
  total_gaps_assigned: "{P2.gap_summary.by_phase.P5}"
  addressed: "{count}"
  skipped: 0
  skipped_reasons: []
```

---

**End of P5-BLINDAGE-RESEAU-CRYPTO.md**
