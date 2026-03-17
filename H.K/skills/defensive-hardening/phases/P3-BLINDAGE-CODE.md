# Phase 3: Application Code Hardening

**Type** : Defensive implementation
**Executor** : LLM + Code writing
**Knowledge** : Defensive DATA categories RUNTIME, AUTH, INJECTION
**Input** : P2_reinforcement_points.yaml (gaps with assigned_phase: P3)
**Output** : Concrete code in code/code_hardening/

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

---

### REFLECTION - Entry Gate P3

**Objective** : For each gap assigned to P3 (categories RUNTIME, AUTH, INJECTION), write concrete, complete and integrable protection code. No abstract recommendations -- real compilable/executable code in the project's language.

```
REFLECTION - P3 Entry Gate
================================================

CENTRAL PROBLEM
Write code that protects the application runtime: constant-time
comparison, CSPRNG, memory cleanup, secure type wrappers,
secure error handling, input validation, rate limiting,
auth hardening.

Code MUST be in the project's language (detected in P0).
NOTE: Crypto and network are handled in P5, not here.

UPSTREAM DATA (P2)
| Metric | Value |
|--------|-------|
| Gaps assigned to P3 | {P2.gap_summary.by_phase.P3} |
| P0 gaps (critical) | {count P0 among P3 gaps} |
| Input file | P2_reinforcement_points.yaml |

UPSTREAM DATA (P0)
| Metric | Value |
|--------|-------|
| Languages | {P0.detected_stack.languages} |
| Frameworks | {P0.detected_stack.frameworks} |

PRINCIPLE: Each gap -> one code file + one test file
KNOWLEDGE: Load relevant defensive DATA based on language

================================================
STOP CHECK
- P2_reinforcement_points.yaml read? [YES/NO]
- Defensive DATA loaded? [YES/NO]
- Runtime/memory defensive DATA files READ? [YES/NO]
- Project language identified? [YES/NO]
- Ready to code? [YES/NO]
================================================
```

---

### PLANNING - P3 Breakdown

Fixes are DYNAMIC: they depend on gaps detected in P2 and the project language.

```
PLANNING - P3 Subtasks
================================================

| # | Fix | CWE | Applicable if | Code file | Test file |
|---|-----|-----|--------------|-----------|-----------|
| F1 | Constant-time comparison | CWE-208 | Any language | fix_constant_time.{ext} | test_constant_time.{ext} |
| F2 | Secret memory cleanup | CWE-316 | Native languages (Rust, C, Go) | fix_zeroize_secrets.{ext} | test_zeroize_secrets.{ext} |
| F3 | CSPRNG | CWE-330 | Any language | fix_csprng.{ext} | test_csprng.{ext} |
| F4 | Secure error handling | CWE-209 | Any language | fix_secure_errors.{ext} | test_secure_errors.{ext} |
| F5 | Input validation | CWE-20 | Any language | fix_input_validation.{ext} | test_input_validation.{ext} |
| F6 | Type-safe secret wrappers | CWE-312 | Typed languages (Rust, TS, Dart, Go, Java) | fix_secret_types.{ext} | test_secret_types.{ext} |
| F7 | Rate limiting / bounded collections | CWE-400 | Any language | fix_bounded_collections.{ext} | test_bounded_collections.{ext} |
| F8 | Auth hardening (hashing, sessions) | CWE-916 | If auth detected | fix_auth.{ext} | test_auth.{ext} |

NOTE: Crypto (former F8) and TLS (former F9) are handled in P5, not here.

Apply only the fixes whose corresponding GAP is in P2.
{ext} = extension of the language detected in P0 (rs, ts, py, dart, go, java, php, etc.)

================================================
```

---

### EXECUTION

#### Defensive Coding Method

For each GAP-xxx assigned to P3:

1. **Read the gap** : Understand the problem and exact location
2. **Consult relevant defensive DATA** : Find the appropriate technique
3. **Write the fix code** : Complete code, compilable/executable, with imports
4. **Write the test** : Unit tests covering normal and adversarial cases
5. **Document integration** : Where and how to integrate into the project (file:line)

---

#### F1: Constant-Time Comparison (CWE-208)

**Universal principle** : NEVER use `==` to compare secrets. Use an XOR byte-by-byte comparison that takes the same time regardless of content.

**Implementations per language:**

| Language | Library/Method | Pattern |
|----------|---------------|---------|
| Rust | `subtle::ConstantTimeEq`, `hmac::Mac::verify_slice` | `a.ct_eq(b).into()` |
| TypeScript | `crypto.timingSafeEqual(a, b)` | `Buffer.from(a)` before |
| Python | `hmac.compare_digest(a, b)` | Built-in, no dep needed |
| Dart | `package:crypto` | `SecureCompare.equals(a, b)` |
| Go | `crypto/subtle.ConstantTimeCompare(a, b)` | Returns int (1 = equal) |
| Java | `MessageDigest.isEqual(a, b)` | Java 6.0.17+ (fixed) |
| PHP | `hash_equals($known, $user)` | PHP 5.6+ |

**Test to write** : Verify that equal returns true, different returns false, different lengths returns false.

**Integration** : Search `==.*token\|==.*hmac\|==.*hash\|==.*key\|==.*secret\|==.*password` and replace.

---

#### F2: Secret Memory Cleanup (CWE-316)

**Universal principle** : Secrets must be erased from RAM as soon as they are no longer needed. Do not rely on the garbage collector.

**Implementations per language:**

| Language | Technique | Pattern |
|----------|----------|---------|
| Rust | `zeroize::ZeroizeOnDrop`, `secrecy::SecretString` | `#[derive(ZeroizeOnDrop)]` |
| Go | `memclr` pattern, `defer wipe(secret)` | XOR loop + barrier |
| C/C++ | `memset_s`, `explicit_bzero` | Not `memset` (optimized away) |
| TypeScript | `buffer.fill(0)` | V8 GC limitations |
| Python | `ctypes.memset` | CPython limitations |
| Dart | Not natively available | Limit lifetime |
| Java | `Arrays.fill(secret, 0)` after use | JVM GC limitations |

**Test to write** : Verify that after zeroize/drop the buffer is cleared.

---

#### F3: CSPRNG (CWE-330)

**Universal principle** : NEVER `Math.random()`, `random.random()`, `Random()` for tokens/nonces/keys. Use the OS CSPRNG.

**Implementations per language:**

| Language | Correct CSPRNG | TO AVOID |
|----------|---------------|----------|
| Rust | `rand::rngs::OsRng` | `thread_rng()`, `SmallRng` |
| TypeScript | `crypto.randomBytes(n)`, `crypto.getRandomValues` | `Math.random()` |
| Python | `os.urandom(n)`, `secrets.token_bytes(n)` | `random.random()` |
| Dart | `Random.secure()` | `Random()` |
| Go | `crypto/rand.Read(b)` | `math/rand` |
| Java | `SecureRandom()` | `Random()` |
| PHP | `random_bytes(n)` | `rand()`, `mt_rand()` |

**Test to write** : Verify uniqueness (100 nonces all different), correct length.

---

#### F4: Secure Error Handling (CWE-209)

**Universal principle** : Errors returned to the user must be GENERIC. Detailed errors are logged server-side. Fail CLOSED: on error, block and reject.

**Universal pattern**:
1. Define detailed internal errors (for logs)
2. Define generic public errors (for the user)
3. Map internal -> public before returning
4. Log internal error, return generic one
5. NEVER `.unwrap()`, `except: pass`, empty `catch {}`

**Error message sanitization**:
- Remove absolute file paths -> `[PATH]`
- Remove IP addresses -> `[IP]`
- Remove long tokens/keys -> `[REDACTED]`
- Remove stack traces -> generic message

---

#### F5: Input Validation (CWE-20)

**Universal principle** : Validate ALL external inputs: type, length, format, characters. SQL = prepared statements. HTML = escaping. Paths = forbid `..`.

**Validations to implement**:
- **URLs** : HTTPS only, no credentials, no private IPs, max length
- **File names** : Regex `^[a-zA-Z0-9_-]{1,64}$`, no path traversal
- **Paths** : `canonicalize` + verify `starts_with(base_dir)`
- **Keywords** : No shell metacharacters (`;|&\`$<>`)
- **Null bytes** : Reject any input containing `\x00`
- **Length** : Configurable max for each field

**Command injection prevention pattern**:
```
NEVER: format!("{} {}", cmd, user_input) -> shell
ALWAYS: ["cmd", "--arg", validated_input] -> subprocess
```

---

#### F6: Type-Safe Wrappers for Sensitive Data (CWE-312)

**Universal principle** : Sensitive types (API keys, passwords, tokens) must NOT be plain `String`/`str`. Use newtype wrappers that:
- Implement Debug/Display with `[REDACTED]`
- Prevent `==` comparison (force constant-time)
- Clean themselves from memory on destruction (if possible in the language)

**Pattern**:
```
NewType(raw_bytes) with:
  - Debug -> "[REDACTED]"
  - Display -> "[REDACTED]"
  - expose() -> &[u8] (controlled access)
  - Drop -> zeroize (if possible)
```

---

#### F7: Rate Limiting and Bounded Collections (CWE-400)

**Universal principle** : Any collection fed from outside MUST have a maxSize + eviction. Any repeated API/action MUST have a rate limiter.

**Patterns**:
- **Nonce cache** : Bounded HashMap + age-based eviction (TTL)
- **Rate limiter** : Sliding window per identifier (IP, session, user)
- **Collections** : `with_capacity(max)` + evict oldest when full

---

#### F8: Auth Hardening (CWE-916)

If auth detected, implement:
- **Password hashing** : bcrypt (cost 12+) or Argon2id
- **Session tokens** : CSPRNG, 32+ bytes, expiration
- **Brute-force protection** : Rate limiting + progressive lockout
- **Mutual authentication** : mTLS or Ed25519 for machine-to-machine

---

### VALIDATION - Completeness Check

```
VALIDATION - P3 Check
================================================

| Element verified | Status |
|-----------------|--------|
| All P3 gaps addressed (one fix per gap)? | [OK/FAIL] |
| F1 constant-time comparison (if GAP present) - code + test? | [OK/FAIL/N/A] |
| F2 memory zeroize (if GAP present) - code + test? | [OK/FAIL/N/A] |
| F3 CSPRNG (if GAP present) - code + test? | [OK/FAIL/N/A] |
| F4 secure error handling (if GAP present) - code + test? | [OK/FAIL/N/A] |
| F5 input validation (if GAP present) - code + test? | [OK/FAIL/N/A] |
| F6 type-safe wrappers (if GAP present) - code + test? | [OK/FAIL/N/A] |
| F7 rate limiting (if GAP present) - code + test? | [OK/FAIL/N/A] |
| F8 auth hardening (if GAP present) - code + test? | [OK/FAIL/N/A] |
| Code in project language (detected in P0)? | [OK/FAIL] |
| Integration instructions documented for each fix? | [OK/FAIL] |
| gap_coverage.addressed == gap_coverage.total_gaps_p3? | [OK/FAIL] |
| P3_code_hardening.yaml written? | [OK/FAIL] |

COMPLETION GATE
- Ready to enter P4? [YES/NO]
================================================
```

---

## P3 YAML Template

```yaml
schema_version: "1.1.0"
phase: 3
generated_at: "ISO8601"
input_ref: "P2_reinforcement_points.yaml"

target_language: "{main language detected in P0}"

fixes:
  - id: FIX-001
    gap_ref: "GAP-xxx"
    cwe: "CWE-xxx"
    title: "Fix description"
    code_file: "code/code_hardening/fix_xxx.{ext}"
    test_file: "code/code_hardening/test_xxx.{ext}"
    integration:
      target_file: "path/to/file.ext"
      target_line: 42
      instructions: "How to integrate the fix"
    dependencies_added:
      - name: "lib_name"
        version: "^x.y.z"
        manifest: "Cargo.toml|package.json|etc"

gap_coverage:
  total_gaps_p3: 0
  addressed: 0
  skipped: 0
  skipped_reasons: []
```

---

**End of P3-BLINDAGE-CODE.md**
