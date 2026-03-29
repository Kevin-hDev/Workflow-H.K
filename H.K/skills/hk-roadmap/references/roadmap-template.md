# Roadmap template — Complete reference

This file shows the exact expected format for the generated roadmap.md.
Each section is documented with concrete examples.

---

## File header

```markdown
# {Project} — Roadmap Quest/Mission

> Short project description (1-2 lines max)
> Stack: {technologies used}
> Spec: `{path to spec/prd if it exists}`
> Detailed plan: `{path to implementation plan if existing}`

---
```

The header gives the minimal context to understand the project.
The link to the spec is important: it's the source of truth.

---

## Mission format

```markdown
### Mission {Q.M} — {Descriptive action title}

**Context:** {Project X is a Tauri 2 desktop app (Rust + TypeScript).
Repository pattern architecture. User and Task models already exist.
JWT authentication functional. Conventions: see CLAUDE.md.}

**Objective:** {What this mission accomplishes in 1-2 sentences}

**Tasks:**
1. {Concrete action — enough detail to execute without ambiguity,
   enough flexibility to choose the implementation.
   Mention files, structs/components to create,
   patterns to follow.}
2. {Second concrete action}
3. {Third action if needed — MAX 3}

**Files created:** `src/models/comment.ts`, `src/routes/comments.ts`, `tests/comment.test.ts`
**Files modified:** `src/routes/index.ts`
**Depends on:** 0.2, 1.1
**Validation:**
- `npm test -- --grep comments`
- `npx tsc --noEmit`
- `test -f src/models/comment.ts`
```

---

## The Context field — The most critical

Context is what makes a mission self-sufficient.
An agent reading this mission for the first time must understand:

1. **What project**: type, stack, one-sentence description
2. **What architecture**: patterns used, file structure
3. **Current state**: what already exists, what works
4. **What conventions**: naming, organization, rules (point to CLAUDE.md)

### Good context vs bad context

Bad (too vague):
```
**Context:** Continuation of the previous mission.
```

Bad (assumes memory):
```
**Context:** As discussed, we use the Repository pattern.
```

Good:
```
**Context:** SafetyAI project, Tauri 2 desktop app (Rust + React 19 +
Tailwind v4). SQLite DB encrypted via SQLCipher. Architecture: commands/
for Tauri IPC, hooks/ for React logic, services/ for bridge.
API connectors (Groq, Mistral) exist in runtime_secrets.rs.
Conventions: camelCase TS, snake_case Rust, see CLAUDE.md.
```

---

## The Validation field — Executable commands

No prose. Commands that return exit code 0 on success.

### Examples by validation type

**Compilation / types:**
```
- `npx tsc --noEmit`
- `cargo check`
- `cargo clippy`
```

**Tests:**
```
- `npm test -- --grep "auth"`
- `cargo test -- --test-threads=1`
- `pytest tests/test_auth.py -v`
```

**Files exist:**
```
- `test -f src/models/user.ts`
- `test -d src/components/chat/`
```

**Server responds:**
```
- `curl -sf http://localhost:3000/health`
- `curl -sf http://localhost:3000/api/users | jq '.users'`
```

**File content:**
```
- `grep -q 'jwt.verify' src/middleware/auth.ts`
- `grep -q 'CREATE TABLE comments' src/db/migrations/001.sql`
```

**Full build:**
```
- `npm run build`
- `cargo build --release`
```

---

## Dependency graph at end of file

```markdown
## Execution order

Quest 0 (foundations) — sequential
  └─ 0.1 Init project + dependencies ──────── no dependency
  └─ 0.2 Shared types + DB schema ─────────── depends on 0.1
  └─ 0.3 Configuration + constants ────────── depends on 0.1

Quest 1 (backend auth) — sequential, after Quest 0
  └─ 1.1 User model + migration ───────────── depends on 0.2
  └─ 1.2 Auth routes (register/login) ─────── depends on 1.1
  └─ 1.3 JWT middleware ────────────────────── depends on 1.2

Quest 2 (frontend) — parallelizable with Quest 1 after 0.2
  └─ 2.1 Layout + navigation ──────────────── depends on 0.2
  └─ 2.2 Auth pages (login/register) ─────── depends on 2.1
  └─ 2.3 Backend wiring ───────────────────── depends on 1.3 + 2.2
```

Arrows `depends on X + Y` indicate the mission waits for
ALL dependencies to complete before starting.

---

## Security checklist (example)

```markdown
## Security checklist (verify on EVERY mission)

- [ ] Max size on all inputs
- [ ] Bounded collections (max_entries + eviction)
- [ ] Secrets in secure memory, never logged
- [ ] Prepared SQL statements only
- [ ] Generic error messages on user side
- [ ] Timeout on all network calls
- [ ] Input validation before processing
- [ ] No `dangerouslySetInnerHTML` or `eval()`
```

Adapt this checklist to the project and its stack.

---

## File summary (example)

```markdown
## File summary

### New files (12)
- `src/models/user.ts`
- `src/models/comment.ts`
- `src/routes/auth.ts`
- [...]

### Modified files (5)
- `src/routes/index.ts` (add routes)
- `src/app.ts` (middleware)
- [...]
```

This section shows the total impact of the plan at a glance.
