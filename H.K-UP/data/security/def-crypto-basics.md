# def-crypto-basics.md
> Cryptographic best practices for brownfield code. Focus on finding and fixing the most common mistakes.
> Tags: crypto, encryption, hashing, secrets, all

---

## 1. Algorithm Reference — What to use and what to avoid

| Purpose | Use this | Never use |
|---------|----------|-----------|
| Password hashing | Argon2id (m=64MB, t=3, p=4) | MD5, SHA-1, SHA-256 (unsalted), bcrypt < cost 10 |
| Symmetric encryption | AES-256-GCM or ChaCha20-Poly1305 | DES, 3DES, AES-ECB, AES-CBC without MAC |
| Data integrity (non-secret) | SHA-256 or BLAKE3 | MD5, SHA-1, CRC32 |
| HMAC / MAC | HMAC-SHA256 | Hash without key |
| Digital signatures | Ed25519 | RSA < 2048 bits |
| Key derivation (high entropy) | HKDF-SHA256 | Simple hash truncation |
| Key derivation (password) | Argon2id | PBKDF2 < 600k iterations |
| Random token/key generation | OS CSPRNG (see section 2) | `Math.random()`, `rand()` |

---

## 2. CSPRNG — Never use Math.random() for security values

**Use a Cryptographically Secure Pseudo-Random Number Generator for:**
- Session tokens, API keys, CSRF tokens
- Nonces and IVs
- Password reset tokens
- Any ID that must be unguessable
- OTP secrets and salts

**Language-specific CSPRNG:**

| Language | Correct | Forbidden |
|----------|---------|-----------|
| JavaScript / Node.js | `crypto.randomBytes(n)`, `crypto.getRandomValues(buf)` | `Math.random()` |
| Python | `secrets.token_bytes(n)`, `os.urandom(n)` | `random.random()`, `random.randint()` |
| Java / Kotlin | `SecureRandom.getInstanceStrong()` | `java.util.Random`, `Math.random()` |
| Go | `crypto/rand.Read(buf)` | `math/rand` |
| Rust | `OsRng.fill_bytes()` | `rand::thread_rng()` |
| Dart | `Random.secure()` | `Random()` (without `.secure()`) |
| C# | `RandomNumberGenerator.GetBytes(buf)` | `System.Random` |

**Finding it in existing code:**
```bash
# JavaScript — search for weak RNG
grep -r "Math.random()" src/

# Python
grep -r "random\.random\|random\.randint\|random\.choice" src/

# Java
grep -r "new Random()\|java\.util\.Random" src/
```

---

## 3. Constant-Time Comparison — Never use == for secrets

**Why it matters:** Standard equality operators (`==`, `===`, `strcmp`, `equals()`) return early on the first differing byte. An attacker who measures response latency can deduce a secret one byte at a time (timing attack).

**CVE on record:** CVE-2022-29185 — `totp-rs` < v1.1.0 used `==` for TOTP comparison. ~200 measurements per byte position = automatable attack.

**What needs constant-time comparison:**
- Session token validation
- API key verification
- HMAC/MAC tag verification
- CSRF token comparison
- Password reset token validation
- Any comparison against a stored secret

**Language implementations:**

| Language | Use this | Forbidden |
|----------|---------|-----------|
| JavaScript / Node.js | `crypto.timingSafeEqual(a, b)` | `===`, `==` |
| Python | `hmac.compare_digest(a, b)` | `==`, `!=` |
| Java | `MessageDigest.isEqual(a, b)` | `Arrays.equals()` |
| Go | `subtle.ConstantTimeCompare(a, b)` | `bytes.Equal`, `==` |
| Rust | `subtle::ConstantTimeEq` | `==` on byte slices |
| C# | `CryptographicOperations.FixedTimeEquals(a, b)` | `SequenceEqual`, `==` |

**Important — length check:** Returning immediately on length mismatch leaks the expected length. Always compare using fixed-length canonical form, or perform a dummy constant-time operation before returning false.

**Finding it in existing code:**
```bash
# Look for secret comparisons using ==
grep -rn "token.*==\|secret.*==\|api_key.*==\|hash.*==" src/
grep -rn "== .*token\|== .*secret\|== .*hash" src/
```

---

## 4. Password Hashing — Fixing Weak Algorithms

**Identifying weak hashing in brownfield code:**
```bash
# Python — look for fast hashes used for passwords
grep -rn "md5\|sha1\|sha256\|sha512" src/ | grep -i "password\|passwd\|hash"

# JavaScript
grep -rn "createHash.*md5\|createHash.*sha1\|createHash.*sha256" src/ | grep -i "password"
```

**Brownfield migration pattern (incremental rehashing):**

Do NOT migrate everything at once — use login-time rehashing:

```python
# On login:
def authenticate(username, password):
    user = get_user(username)

    # 1. Check with current algorithm
    if argon2.verify(password, user.password_hash):
        return user  # already using new algorithm

    # 2. Check with old algorithm (migration path)
    if legacy_sha256_verify(password, user.password_hash):
        # Rehash with new algorithm
        user.password_hash = argon2.hash(password)
        user.save()
        return user

    return None  # invalid password
```

**Argon2id minimum parameters:**
- Memory: 64 MB (m=65536)
- Iterations: 3 (t=3)
- Parallelism: 4 (p=4)
- OWASP minimum: m=19MB — use 64MB when feasible

---

## 5. AES-GCM Encryption — Common Mistakes

**The most critical rule for AES-GCM:** Never reuse a nonce with the same key. Nonce reuse breaks both confidentiality and authentication — it's catastrophic.

**Correct AES-256-GCM pattern:**

```python
# Python (cryptography library)
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

def encrypt(key: bytes, plaintext: bytes, associated_data: bytes = b'') -> bytes:
    # Generate a fresh 12-byte nonce for EVERY encryption
    nonce = os.urandom(12)  # CSPRNG — never reuse
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data)
    return nonce + ciphertext  # prepend nonce to ciphertext

def decrypt(key: bytes, data: bytes, associated_data: bytes = b'') -> bytes:
    nonce, ciphertext = data[:12], data[12:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, associated_data)
```

**Why not CBC:** Vulnerable to padding oracle attacks. Why not ECB: identical plaintext blocks produce identical ciphertext. Why not CTR without auth: malleable, no integrity.

---

## 6. Secret Storage — Never Hardcode

**Finding hardcoded secrets in existing code:**
```bash
# Common patterns
grep -rn "api_key\s*=\s*['\"]" src/
grep -rn "secret\s*=\s*['\"]" src/
grep -rn "password\s*=\s*['\"]" src/
grep -rn "token\s*=\s*['\"]" src/

# Also check: connection strings, AWS keys, JWT secrets
grep -rn "AKID\|sk-\|eyJhbGci\|mongodb+srv" src/
```

**Brownfield remediation:**
1. Move secrets to environment variables or a secrets manager
2. Use a `.env` file for local dev (never commit it — add to `.gitignore`)
3. Invalidate any secret that was ever committed to git (rotate it — git history is permanent)
4. Add a pre-commit hook to scan for secrets

**Minimum: environment variables**

```javascript
// Instead of: const API_KEY = "sk-abc123"
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error('API_KEY environment variable required');
```

---

## 7. Memory Safety — Secrets in RAM

**In existing brownfield code, the realistic goal:**
1. Don't log secrets (highest priority — logs are often stored and forwarded)
2. Don't put secrets in error messages (second priority)
3. Zeroize after use where the language supports it easily (lower priority — GC makes this hard)

**Finding secrets in logs:**
```bash
# Look for secrets passed to logging functions
grep -rn "log.*token\|log.*secret\|console.log.*key\|print.*password" src/
grep -rn "logger.*password\|logging.*api_key\|debug.*token" src/
```

**Quick win for any language:** Add a log filter that redacts known patterns:
- AWS key patterns (`AKID.*`)
- JWT patterns (`eyJ.*`)
- Bearer tokens
- Password fields in serialized objects

---

## Brownfield remediation priority

| Finding | Priority | Action |
|---------|----------|--------|
| Hardcoded secret in committed code | CRITICAL | Rotate secret + remove from all branches + add secret scan |
| `Math.random()` for session tokens | CRITICAL | Replace with CSPRNG — affects all active sessions |
| `==` for token/secret comparison | HIGH | Replace with constant-time comparison |
| MD5/SHA-1 for password hashing | HIGH | Incremental rehashing on next login |
| AES-CBC without integrity check | HIGH | Migrate to AES-GCM |
| Secrets logged | HIGH | Add log filter |
| No Argon2id (using bcrypt cost < 10) | MEDIUM | Rehash on login with higher cost |
