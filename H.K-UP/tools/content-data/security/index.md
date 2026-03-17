# Security Data Index — H.K-UP

> Nyx reads this file FIRST. Then select 3-5 relevant files based on the project stack.
> NEVER load all files at once — INDEX_THEN_SELECTIVE is mandatory.

---

## How to select files

1. Read `project-context.md` — identify what the project touches (auth, web, LLM, desktop, etc.)
2. Match the project's stack against the **Tags** column below
3. Files tagged `all` are always candidates — include 1-2 of them
4. Load only 3-5 files total. Document your selection and reason before loading.

---

## Attack Patterns (atk-*)

| File | Tags | Description |
|------|------|-------------|
| `atk-web-common.md` | web, http, api, xss, csrf, injection, ssrf | Common web attack patterns: SQL injection, XSS (stored/DOM/mXSS), CSRF, SSRF, path traversal, template injection |
| `atk-auth-patterns.md` | auth, session, jwt, oauth, password, api | Authentication attack vectors: broken auth, session hijacking, JWT pitfalls, credential stuffing, OAuth misuse |
| `atk-supply-chain.md` | supply-chain, npm, pip, cargo, dependencies | Dependency attacks: typosquatting, slopsquatting, lockfile attacks, dependency confusion |
| `atk-llm-security.md` | llm, ai, prompt-injection, mcp, ai-agent | LLM/AI-specific attacks: prompt injection (direct/indirect), data exfiltration via tool use, MCP abuse |
| `atk-desktop-patterns.md` | desktop, electron, tauri, native, ipc | Desktop app attack vectors: IPC abuse, WebView bridge RCE, file system access, native bridge exploitation |

## Defense Patterns (def-*)

| File | Tags | Description |
|------|------|-------------|
| `def-input-validation.md` | validation, sanitization, all | Input validation by type and language: strings, paths, SQL (prepared statements), HTML sanitization |
| `def-crypto-basics.md` | crypto, encryption, hashing, secrets, all | Cryptographic best practices: CSPRNG, constant-time comparison, password hashing, AES-GCM, key management |
| `def-auth-hardening.md` | auth, session, jwt, oauth, api | Authentication/session hardening: JWT security, OAuth2 PKCE, API key management, session rotation |
| `def-runtime-safety.md` | runtime, collections, errors, all | Runtime safety: bounded collections, error handling (fail-closed), integer overflow, zeroization |

## Reference Files (ref-*)

| File | Tags | Description |
|------|------|-------------|
| `ref-owasp-top10.md` | web, api, all | OWASP Top 10 2021 — quick reference with brownfield remediation priority per finding |

---

## Selection rules

**Always include:**
- At least 1 file tagged `all` (typically `def-input-validation.md` or `def-crypto-basics.md`)

**By stack:**
| If the project has... | Prioritize |
|-----------------------|------------|
| Web API / REST endpoints | `atk-web-common.md`, `ref-owasp-top10.md` |
| User authentication | `atk-auth-patterns.md`, `def-auth-hardening.md` |
| Database access (SQL/ORM) | `atk-web-common.md`, `def-input-validation.md` |
| Secrets / API keys / crypto | `def-crypto-basics.md` |
| LLM / AI features | `atk-llm-security.md` |
| Desktop app (Electron/Tauri) | `atk-desktop-patterns.md` |
| External dependencies (npm/pip/cargo) | `atk-supply-chain.md` |
| User input of any kind | `def-input-validation.md` |

**Maximum:** 5 files loaded per audit session. Document which files were loaded and why in step-01.

---

## Document which files you loaded

After selecting, write this in step-01 Phase 2:

```
Security Data Loading

  Files loaded (3-5):
    - data/security/{file}.md — {why this file matches this project's stack}
    - data/security/{file}.md — {why}
    - data/security/{file}.md — {why}

  Files not loaded: {rest} — not relevant to this project's stack
```
