# H.K Workflow — Global Instructions

## CRITICAL RULES — 10 Security Reflexes You Neglect by Default

> These 10 points are your blind spots when nothing is specified.
> Every line of code you write MUST respect them. No exceptions. NON-NEGOTIABLE.

1. **NEVER `==` to compare a secret** — tokens, hashes, API keys: constant-time comparison only (XOR byte by byte).
2. **NEVER unbounded collections** — every Map/List/Set fed by external input MUST have a maxSize + eviction.
3. **NEVER hardcoded secrets** — keys, tokens, passwords → OS keystore or secure env var, never in plaintext in source.
4. **NEVER process input without validation** — type, length, format, characters. SQL = prepared statements. HTML = escaping. Paths = forbid `..`.
5. **NEVER internal info in visible errors** — zero file paths, stack traces, table names, or lib versions on the user side.
6. **NEVER Math.random() for a token/ID/nonce** — CSPRNG only (crypto.randomBytes, OsRng, SecureRandom depending on language).
7. **NEVER concatenate in a system command** — arguments separated in a list, no intermediate shell, inputs validated by regex before execution.
8. **NEVER empty catch** — `catch {}` forbidden. Fail CLOSED: an error BLOCKS, never lets through.
9. **NEVER log sensitive data** — filter tokens, passwords, keys from ALL log/console/debug output before writing.
10. **NEVER leave a secret in RAM** — zeroize buffers after use, do not rely on the garbage collector.

### Check before every function:

- "If an attacker controls this input, what happens?"
- "If this operation fails, does it block or let through?"
- "Am I comparing secrets with ==?"
- "Can this collection grow indefinitely?"
- "Does this error message reveal internal info?"

---

## CRITICAL RULES — 8 Structure Reflexes You Neglect by Default

> Without these rules, you create giant files, duplicate code, and structure poorly. No exceptions. NON-NEGOTIABLE.

1. **NEVER a file > 200 lines** — beyond that, split into smaller single-responsibility files. Ideal = target 50-150 lines.
2. **NEVER duplicate code** — before writing a function, check if it already exists in the project. If yes, reuse.
3. **NEVER hardcode values** — colors, URLs, sizes, texts, delays → centralized in a config/theme/constants file.
4. **NEVER mix responsibilities** — UI, business logic, and data access in SEPARATE files.
5. **NEVER create without checking existing** — before creating a component/function, search the project for an equivalent.
6. **NEVER mix naming conventions** — one style per project (camelCase OR snake_case), consistent everywhere.
7. **NEVER leave dead code** — no commented code, no unused imports, no abandoned functions. Delete.
8. **NEVER put everything flat** — organize by domain/feature/component (auth/, payments/, profile/), not everything in one folder.

---
