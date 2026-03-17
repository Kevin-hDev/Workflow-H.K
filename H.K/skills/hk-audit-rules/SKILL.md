---
name: hk-audit-rules
description: Code audit with 3 depth levels (quick/full/security) — 18 built-in rules, tests, SelfCheck, STRIDE, Five-Persona
argument-hint: "[--full | --security] [path(s)]"
---

# Code Rules Audit

Audit code against 18 built-in rules (10 security + 8 structure) plus custom rules from the project's CLAUDE.md.

Three depth levels:

| Flag | Level | What it does | When to use |
|------|-------|-------------|-------------|
| _(none)_ | **quick** | 18 rules + custom CLAUDE.md rules | Daily check, 2 min |
| `--full` | **full** | quick + typecheck/lint/tests + SelfCheck 4 questions | Before merge/PR, 5-10 min |
| `--security` | **security** | full + mini-STRIDE + Five-Persona Review | Sensitive code (auth, crypto, network) |

## Process

### 1. Parse Flags

```
depth = "quick"  (default)
if $ARGUMENTS contains "--full"     → depth = "full"
if $ARGUMENTS contains "--security" → depth = "security"
remaining args = file/directory paths (if any)
```

### 2. Identify Scope

Determine which files to audit:
- **Default**: files modified in the last commit (`git diff HEAD~1 --name-only`)
- **With path argument**: audit specific files or directories (`/hk-audit-rules src/auth/`)
- **Full project**: if user says "audit everything" → all source files (exclude node_modules, .git, build/, dist/, vendor/)

### 3. Load Custom Rules

Read the project's CLAUDE.md (if it exists) at:
- `.claude/CLAUDE.md` (project-level)
- `CLAUDE.md` (root-level)

Extract any additional rules the user has defined. These are checked IN ADDITION to the 18 built-in rules below.

### 4. Audit Against Built-in Rules

For each file in scope, check ALL 18 rules:

#### Security Rules (10)

| # | Rule | What to grep/check | FAIL if found |
|---|------|--------------------|---------------|
| S1 | Never `==` for secrets | `==` or `===` comparing tokens, hashes, API keys, passwords | Timing-unsafe comparison found |
| S2 | Never unbounded collections | `Map()`, `Set()`, `[]`, `{}` fed by external input without maxSize/eviction | Collection grows without limit |
| S3 | Never hardcoded secrets | API keys, tokens, passwords, connection strings as string literals in source | Secret in source code |
| S4 | Always validate input | User input used without validation (type, length, format, chars). SQL without prepared statements. HTML without escaping. Paths without `..` check | Unvalidated input |
| S5 | Never internal info in errors | Stack traces, file paths, table names, library versions in user-facing errors | Internal info leaked |
| S6 | Never Math.random() for security | `Math.random()`, `random.random()`, `rand()` for tokens/IDs/nonces instead of CSPRNG | Weak randomness for security |
| S7 | Never concatenate shell commands | `exec()`, `system()`, `eval()`, template strings in shell commands instead of argument arrays | Command injection risk |
| S8 | Never empty catch | `catch {}`, `catch (e) {}`, `except: pass`, bare `rescue` without error handling | Fail-open on error |
| S9 | Never log sensitive data | Tokens, passwords, keys, PII in log/console/debug output | Secret in logs |
| S10 | Never leave secrets in memory | Secrets stored in String (GC'd, not zeroed) instead of zeroizable buffers | Secret persists in RAM |

#### Structure Rules (8)

| # | Rule | What to check | FAIL if found |
|---|------|---------------|---------------|
| T1 | No **code** file > 250 lines | `wc -l` on source code files only. EXCLUDE: docs (*.md, *.txt, *.rst), config (*.json, *.yaml, *.toml), lockfiles, generated files | Code file exceeds 250 lines (target 50-150) |
| T2 | No code duplication | Similar blocks across files (same logic, same pattern) | Duplicated code |
| T3 | No hardcoded values | Colors, URLs, sizes, texts, delays as literals instead of config/constants | Value should be in config |
| T4 | Separation of concerns | UI, business logic, data access mixed in same file | Mixed responsibilities |
| T5 | Check existing before creating | New component/function that duplicates existing functionality | Reinventing the wheel |
| T6 | Consistent naming | Mixed camelCase/snake_case/PascalCase within same file/module | Naming inconsistency |
| T7 | No dead code | Commented-out code, unused imports, abandoned functions | Dead code found |
| T8 | Organize by domain | All files flat in one folder instead of domain/feature structure | Flat organization |

### 5. Generate Report

```markdown
## Audit Report — {date}

**Scope**: {files audited} ({count} files)
**Depth**: {quick | full | security}
**Custom rules**: {count from CLAUDE.md, or "none"}

### Summary

| Status | Count |
|--------|-------|
| PASS   | {n}   |
| FAIL   | {n}   |
| WARN   | {n}   |
| N/A    | {n}   |

### Security Rules

| # | Rule | Status | Details |
|---|------|--------|---------|
| S1 | No == for secrets | PASS/FAIL | {file:line if FAIL} |
| ... | ... | ... | ... |

### Structure Rules

| # | Rule | Status | Details |
|---|------|--------|---------|
| T1 | File size < 250 lines | PASS/FAIL | {files exceeding} |
| ... | ... | ... | ... |

### Custom Rules (from CLAUDE.md)

| # | Rule | Status | Details |
|---|------|--------|---------|
| C1 | {user rule} | PASS/FAIL | {details} |
| ... | ... | ... | ... |
```

### 6. Correction Plan

For each FAIL, provide:

```markdown
### Correction Plan

#### S1 — Timing-unsafe comparison (file:line)
**Problem**: `if (token == storedToken)` uses `==` which is vulnerable to timing attacks
**Fix**: Use constant-time comparison
**Code**:
// Before
if (token == storedToken) { ... }
// After
if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken))) { ... }
**Effort**: 5 minutes
```

### 7. Auto-fix Option

After showing the report, ask:
> "Want me to fix the {n} FAIL items automatically?"

If yes: apply the corrections from the plan. Only fix items with clear, unambiguous solutions. Skip any fix that could change behavior.

---

## Full Mode (`--full`)

Everything from quick, PLUS:

### F1. Run Validation Suite

Detect build system and run available checks:

| Check | Commands to try |
|-------|----------------|
| **Typecheck** | `npm run typecheck`, `cargo check`, `go build ./...`, `mypy .`, `pyright` |
| **Lint** | `npm run lint`, `cargo clippy`, `go vet ./...`, `ruff check .` |
| **Tests** | `npm test`, `cargo test`, `go test ./...`, `pytest` |
| **Format** | `npm run format -- --check`, `cargo fmt -- --check`, `ruff format --check .` |

Report each as PASS/FAIL in the audit report. If a check is not available (no config found), mark as N/A.

### F2. SelfCheck — 4 Questions With Proof

After the 18 rules and validation suite, answer these 4 questions. Each answer MUST include concrete proof (command output, file:line reference, or git diff).

```
Q1 — Do all checks pass?
     Proof: full output of typecheck + lint + tests

Q2 — Are there unverified assumptions in the code?
     Proof: list each assumption + status (verified / unverified)

Q3 — Is there any speculative code (code written "just in case")?
     Proof: list files:lines or confirm none found

Q4 — Do I have concrete evidence for every claim in this report?
     Proof: reference the command output or grep result for each FAIL/PASS
```

**Scoring:**
- 4/4 = CLEAN — audit complete
- 3/4 = WARNING — flag the failed question
- < 3 = CONCERN — highlight in report, recommend deeper review

---

## Security Mode (`--security`)

Everything from full, PLUS:

### X1. Mini-STRIDE Per Component

For each component/module in scope, evaluate:

```
S — Spoofing          : Is identity verifiable?
T — Tampering         : Is data integrity protected?
R — Repudiation       : Are actions traceable?
I — Info Disclosure   : Are sensitive data protected?
D — Denial of Service : Does it resist overload?
E — Elev. of Privilege: Are permissions minimal?
```

Document findings in the audit report under a **STRIDE Analysis** section.

### X2. Five-Persona Review

Review the code from 5 perspectives:

1. **Attacker** — How to exploit this code? (injection, bypass, replay, race conditions)
2. **Auditor** — OWASP compliance, CWE patterns, industry standards
3. **Ops** — Observability, debuggability in production, no secrets in logs
4. **Cost** — Risk of cost explosion (infinite loops, unbounded queries, missing rate limits)
5. **User** — Impact on user experience if attack succeeds

Document findings in the audit report under a **Five-Persona Review** section.

---

## Important Notes

- The 18 built-in rules are ALWAYS checked at every depth level
- Custom rules from CLAUDE.md are checked IN ADDITION to the built-in rules
- Rules are adapted to the detected language (Python `except: pass` vs JS `catch {}`)
- S10 (secrets in memory) only applies to languages with manual memory management (Rust, C, C++) or where zeroization matters
- T1 (250 lines) uses the project's own limit if defined in CLAUDE.md, otherwise defaults to 250
- `--full` and `--security` include everything from the previous level (security = full + STRIDE + Five-Persona)

User: $ARGUMENTS
