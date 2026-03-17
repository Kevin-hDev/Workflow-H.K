# atk-auth-patterns.md
> Authentication and authorization attack vectors. Brownfield focus — finding these in existing code.
> Tags: auth, session, jwt, oauth, password, api

---

## 1. Broken Authentication — Password Handling

**What it is:** Passwords stored as plain text, with weak hashing (MD5, SHA-1, unsalted SHA-256), or with hashing algorithms not designed for passwords (fast hashes are trivially brute-forced).

**Where to look:** Password storage functions, user registration, password reset flows. `hashlib.sha256`, `md5()`, `crypt()` used for password storage.

**Impact:** Full credential compromise if the database is breached. Fast hashes + GPU = millions of passwords cracked per second.

**Brownfield remediation:**
1. Migrate to Argon2id (preferred) or bcrypt (cost ≥ 12)
2. Rehash on next login: check old hash, if valid → rehash with new algorithm + invalidate old hash
3. Never require a full-database migration — incremental rehashing on login is safer

**Algorithm reference:**
| Use | Recommended | Avoid |
|-----|-------------|-------|
| Password hashing | Argon2id (m=64MB, t=3, p=4) | MD5, SHA-1, SHA-256 (unsalted), bcrypt < cost 10 |
| Token/key comparison | Constant-time (see `def-crypto-basics.md`) | `==`, `strcmp`, `equals()` |

---

## 2. Session Hijacking — Token Weaknesses

**What it is:** Session tokens generated with weak randomness (predictable), stored insecurely (accessible to JavaScript), or transmitted without TLS.

**Where to look:**
- Session token generation: `Math.random()`, `random.random()`, sequential IDs (`session_1`, `session_2`)
- Token storage: `localStorage.setItem('token', ...)` — accessible to any JavaScript on the page
- Cookie flags: missing `HttpOnly`, `Secure`, `SameSite`

**Impact:** Session theft via XSS, token guessing, man-in-the-middle interception.

**Brownfield remediation:**
1. Replace weak RNG with CSPRNG: `crypto.randomBytes(32)`, `secrets.token_bytes(32)`, `OsRng`
2. Add `HttpOnly; Secure; SameSite=Strict` to session cookies
3. Move tokens from localStorage to HttpOnly cookies where possible

---

## 3. JWT Pitfalls

**What it is:** JWT implementation vulnerabilities in existing code.

**Critical vulnerability — `alg: none`:** Many JWT libraries historically accepted `"alg": "none"` — a token with no signature, validated as authentic. **CVE-2015-9235** affected numerous libraries.

**Where to look:**
- JWT validation code: is the algorithm hardcoded server-side, or derived from the token header?
- Expiration: is `exp` checked? What happens if `exp` is missing?
- Audience: is `aud` validated to prevent token replay across services?
- Payload: does the JWT payload contain sensitive data (passwords, full PII)?

**Common brownfield findings:**

| Finding | Risk |
|---------|------|
| `alg` derived from token header, not hardcoded | Algorithm confusion attack |
| No `exp` check | Tokens valid forever after compromise |
| No `aud` validation | Token for service A accepted by service B |
| Sensitive data in payload | Payload is base64, not encrypted — visible to token holder |
| Tokens stored in localStorage | XSS theft |

**Brownfield remediation:**
1. Hardcode the expected algorithm — reject any token with a different `alg`
2. Explicitly reject `"alg": "none"`
3. Add `exp` validation — reject tokens without `exp` or with past `exp`
4. Add `aud` validation — each service only accepts its own tokens

---

## 4. Broken Access Control

**What it is:** Authorization checks missing, incomplete, or bypassable. A user accesses data or actions belonging to another user or requiring higher privileges.

**Patterns to search in existing code:**
- **IDOR (Insecure Direct Object Reference):** `GET /users/{id}/profile` — is `id` verified against the session's user ID?
- **Missing function-level authorization:** Admin-only endpoints that only check authentication, not role
- **Path-based bypass:** Authorization on `/admin/dashboard` but not on `/admin/dashboard/` (trailing slash) or `/Admin/Dashboard` (case)
- **Mass assignment:** API accepts `is_admin: true` in a user update payload

**Brownfield remediation:**
1. Add authorization checks at the data layer, not just the route layer — every database query for user data should filter by the authenticated user's ID
2. Enumerate admin/privileged endpoints and verify each has a role check
3. Use an allowlist of accepted fields for update operations — never pass raw request body to ORM

---

## 5. Credential Stuffing and Brute Force

**What it is:** Attacker submits lists of username/password pairs from other breaches (stuffing) or tries many passwords against a single account (brute force). No rate limiting = unlimited attempts.

**Where to look in existing code:**
- Login endpoint: any rate limiting? Account lockout? CAPTCHA?
- Password reset: can it be triggered infinitely? Are tokens single-use?
- API keys: per-key rate limits? Failed auth attempts logged?

**Brownfield remediation (quick wins):**
1. Rate limit login endpoint by IP + account: 5 attempts / 15 min / account
2. Exponential backoff on failed attempts
3. Password reset tokens: single-use, expire in 1 hour, invalidate on use
4. Monitor: alert on 10+ failed attempts per account per hour

---

## 6. OAuth2 Misuse

**What it is:** OAuth2 implementation errors in the authorization code flow.

**Where to look:**
- `state` parameter: is it present? Is it CSPRNG-generated? Is it validated on callback?
- PKCE: used for public clients (SPA, mobile, CLI)?
- Refresh token storage: in a database column without encryption?
- Scopes: wildcard (`scope: *`) or minimum necessary?

**Critical finding — missing `state`:** Without `state` validation, an attacker can craft a malicious OAuth callback URL and trick the victim into linking their account to the attacker's token.

**Brownfield remediation:**
1. Add `state` if missing — CSPRNG value, stored in session, validated on callback
2. Add PKCE for all public clients
3. Rotate refresh tokens on each use — detect replay attacks
4. Audit scope requests — remove wildcard scopes

---

## 7. API Key Weaknesses

**What it is:** API keys with weak entropy, stored as plaintext in the database, with overly broad permissions, or without revocation support.

**Where to look:**
- Key generation: `uuid()`, `Math.random()`, sequential IDs instead of CSPRNG
- Storage: plaintext in `api_keys` table column vs. hashed (like a password)
- Scopes: single global key with all permissions
- Revocation: is there an endpoint? How quickly does it propagate?

**Brownfield remediation:**
1. Store API keys hashed (bcrypt or SHA-256 + secret pepper) — never plaintext
2. Regenerate weak keys — notify affected users
3. Add per-key scopes to the data model
4. Add per-key rate limiting

---

## Brownfield audit checklist

| Finding | Where to look |
|---------|---------------|
| Weak password hashing (MD5/SHA-1/unsalted) | User registration, login, password storage |
| `Math.random()` for session tokens | Session creation, token generation |
| Missing HttpOnly/Secure cookie flags | Cookie configuration, session middleware |
| JWT `alg` not hardcoded | JWT validation code |
| No `exp` or `aud` in JWT | Token issuance + validation |
| IDOR on resource endpoints | Any endpoint with a user/resource ID in URL |
| No login rate limiting | Authentication endpoint |
| Wildcard OAuth scopes | OAuth configuration |
| Plaintext API keys in database | API key table schema |
