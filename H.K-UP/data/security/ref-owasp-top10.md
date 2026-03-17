# ref-owasp-top10.md
> OWASP Top 10 2021 — quick reference with brownfield remediation priority.
> Tags: web, api, all

---

## OWASP Top 10 — 2021 Edition

Each entry: what it is, where to look in existing code, and brownfield remediation priority.

---

### A01 — Broken Access Control

**What it is:** Users can access data or actions they shouldn't. IDOR, missing authorization checks, privilege escalation.

**Where to look:**
- Endpoints that use a resource ID from the URL without checking ownership (`GET /orders/{id}`)
- Admin-only endpoints with only authentication checks, not role checks
- Mass assignment: API accepts admin flags in user update payloads

**Brownfield priority:** CRITICAL — most common serious finding in existing APIs.
**Quick win:** Add `.where(user_id: current_user.id)` to all database queries that return user-scoped data.

---

### A02 — Cryptographic Failures

**What it is:** Weak or missing cryptography. Sensitive data transmitted or stored in clear text, weak algorithms, improper key management.

**Where to look:**
- Password storage: MD5, SHA-1, unsalted SHA-256
- Sensitive data in HTTP (not HTTPS)
- Connection strings with passwords in plaintext
- Hardcoded secrets in source code

**Brownfield priority:** CRITICAL for password hashing, HIGH for others.
**Quick win:** Check `password_hash` column — is it bcrypt/argon2 or plain hash?

---

### A03 — Injection

**What it is:** SQL injection, XSS, command injection, SSTI. Untrusted data sent to an interpreter as code.

**Where to look:**
- SQL queries built with string concatenation
- HTML rendered with `innerHTML` / `v-html` from external data
- System commands using string interpolation with user input

**Brownfield priority:** CRITICAL.
**Quick win:** Grep for string formatting with SQL keywords. See `atk-web-common.md` for patterns.

---

### A04 — Insecure Design

**What it is:** Architectural flaws — missing threat modeling, no security controls by design. Not a code bug but a design gap.

**Where to look:**
- No rate limiting on authentication endpoints
- Password reset that doesn't invalidate old tokens
- Multi-tenant systems with no hard isolation between tenants

**Brownfield priority:** HIGH — these require design changes, not just code fixes.
**Quick win:** Add rate limiting to login and password reset endpoints.

---

### A05 — Security Misconfiguration

**What it is:** Default credentials, unnecessary features enabled, verbose error messages, missing security headers.

**Where to look:**
- Error responses containing stack traces, file paths, DB query text
- Default admin credentials unchanged
- Debug mode enabled in production (`DEBUG=True`, `NODE_ENV=development`)
- Missing HTTP security headers (CSP, HSTS, X-Frame-Options)

**Brownfield priority:** HIGH — easy to find and often easy to fix.
**Quick win:** Add security headers middleware. Disable debug mode in production config.

---

### A06 — Vulnerable and Outdated Components

**What it is:** Using libraries with known CVEs. Not patching dependencies.

**Where to look:**
- `package.json`, `requirements.txt`, `Cargo.toml`, `pom.xml` — check versions vs CVE databases
- `npm audit`, `pip-audit`, `cargo audit`, `mvn dependency-check:check`

**Brownfield priority:** HIGH — run a dependency audit before anything else.
**Quick win:** Run `npm audit --production` or equivalent. Fix Critical and High first.

---

### A07 — Identification and Authentication Failures

**What it is:** Broken authentication. Weak passwords, no MFA, insecure session tokens, credential stuffing.

**Where to look:**
- Session token generation: is it CSPRNG-based?
- No account lockout or rate limiting on login
- Passwords stored weakly (see A02)
- Session tokens not invalidated on logout

**Brownfield priority:** HIGH.
**Quick win:** Add rate limiting to login endpoint. Add `HttpOnly; Secure; SameSite` to session cookies.

---

### A08 — Software and Data Integrity Failures

**What it is:** Code and infrastructure that doesn't verify integrity. Deserialization of untrusted data, CI/CD pipeline compromise, unsigned updates.

**Where to look:**
- Deserialization: `pickle.loads()`, `ObjectInputStream`, `eval()` on external data
- Auto-update mechanisms without signature verification
- CI/CD using unversioned/mutable external actions

**Brownfield priority:** MEDIUM to HIGH depending on stack.
**Quick win:** Replace unsafe deserialization with type-safe parsers (JSON with schema validation).

---

### A09 — Security Logging and Monitoring Failures

**What it is:** Insufficient logging of security events. No alerting on failed logins, privilege escalation, or suspicious activity.

**Where to look:**
- Failed authentication attempts: are they logged?
- Access control failures: are they logged with user ID + resource + timestamp?
- No centralized logging or SIEM

**Brownfield priority:** MEDIUM — important for incident response, not immediate risk.
**Quick win:** Add structured logging for authentication failures and authorization denials.

---

### A10 — Server-Side Request Forgery (SSRF)

**What it is:** The server fetches a URL supplied by the user, enabling access to internal services or cloud metadata endpoints.

**Where to look:**
- URL-fetching features: webhooks, URL preview, import by URL, PDF generation from HTML
- OAuth callback URL validation
- Image proxy endpoints

**Brownfield priority:** HIGH if the app fetches user-supplied URLs.
**Quick win:** Add IP allowlist check before making outbound HTTP requests. Block `169.254.169.254` (IMDS).

---

## Brownfield triage table

| # | Finding | Priority | Effort |
|---|---------|----------|--------|
| A01 | IDOR on any endpoint | CRITICAL | Medium |
| A02 | Password in MD5/SHA-1 | CRITICAL | Medium (incremental) |
| A03 | SQL injection | CRITICAL | Low per query |
| A03 | XSS via innerHTML | HIGH | Low per component |
| A05 | Stack traces in errors | HIGH | Low |
| A05 | Debug mode in prod | HIGH | Trivial |
| A06 | Critical dependency CVEs | HIGH | Low (upgrade) |
| A07 | No login rate limit | HIGH | Low |
| A07 | Weak session tokens | HIGH | Low |
| A10 | SSRF on URL-fetch feature | HIGH | Medium |
| A04 | No rate limit on reset | MEDIUM | Low |
| A08 | Unsafe deserialization | MEDIUM | Medium |
| A09 | No auth failure logging | MEDIUM | Low |

---

## References

- OWASP Top 10 2021: https://owasp.org/Top10/
- OWASP Testing Guide v4.2: https://owasp.org/www-project-web-security-testing-guide/
- OWASP ASVS (Application Security Verification Standard): https://owasp.org/www-project-application-security-verification-standard/
