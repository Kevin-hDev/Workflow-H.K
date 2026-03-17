# Step 3 — Plan

> Reload: target files (from audit priority list, user-provided paths, or $ARGUMENTS).
> Read each target file BEFORE planning — never plan without reading.

---

## 3.1 Analyze Each Target File

For each file, identify:

```
**File:** {path} ({line_count} lines)

**Current responsibilities:**
1. {responsibility 1 — e.g., "handles user authentication"}
2. {responsibility 2 — e.g., "validates input forms"}
3. {responsibility 3 — e.g., "manages database queries"}

**Applicable patterns:**
- [ ] Extract Function — {which blocks}
- [ ] Extract File/Module — {which responsibilities to split out}
- [ ] Extract Type/Interface — {shared types to move}
- [ ] Move Function — {functions used elsewhere}
- [ ] Inline — {useless abstractions to remove}
- [ ] Rename — {unclear names}
- [ ] Remove Dead Code — {unused imports, commented code}
```

## 3.2 Split Plan

For files that need splitting, define the target structure:

```
**Current:** src/auth/handler.ts (380 lines, 3 responsibilities)

**After refactoring:**
  src/auth/handler.ts          (~80 lines) — HTTP handler only
  src/auth/validation.ts       (~60 lines) — input validation
  src/auth/queries.ts          (~90 lines) — database queries
  src/auth/types.ts            (~30 lines) — shared types/interfaces
```

**Split rules:**
- Target: **50-150 lines** per file
- 1 file = 1 responsibility (Single Responsibility Principle)
- Shared types → dedicated types file
- Constants/config → dedicated constants file
- Never split a function across files — a function stays whole

## 3.3 Dependency Check

Before splitting, verify:
- Which other files import from the target?
- Will splitting break any imports?
- Plan re-export strategy if needed (re-export from original path for backward compat)

## 3.4 Test Safety Net

```
IF tests exist for the target files:
  → Run them BEFORE refactoring to confirm they pass
  → These tests MUST still pass after refactoring
  → If a test fails after → the refactoring is wrong

IF no tests exist:
  → Warn the user: "No tests found for {file}. Refactoring without tests is risky."
  → Ask: "Want me to write basic tests first, or proceed without?"
```

## 3.5 Present Plan

> "Here's the refactoring plan for {count} files. Each file will be refactored one at a time with validation between each.
>
> {plan details}
>
> Approve?"

---

## Next Step

Load `steps/step-04-refactor.md`
