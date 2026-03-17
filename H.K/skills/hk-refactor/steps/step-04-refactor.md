# Step 4 — Refactor (Execution)

> Reload: refactoring plan from step-03 (or target file if Mode 3).
> If Mode 3 (single file): read the file, identify patterns, apply directly.

---

## 4.1 Pre-Refactoring Snapshot

Before touching any file:

```
1. Run lint + typecheck (detected commands)
2. Run tests if available
3. Record: {file} = {line_count} lines, {function_count} functions
```

All must pass. If they don't → fix first, then refactor.

## 4.2 Refactoring Patterns (apply in this order)

### Pattern 1: Remove Dead Code
- Delete unused imports
- Delete commented-out code
- Delete functions never called (grep to confirm)
- Delete unused variables

### Pattern 2: Extract Types/Interfaces
- Find types/interfaces shared between functions
- Move to a dedicated `types.ts` / `types.rs` / `models.py` file
- Update imports in all consuming files

### Pattern 3: Extract Functions
- Find code blocks with a clear single purpose (>10 lines doing one thing)
- Extract to a named function with a descriptive name
- The function name should describe WHAT it does, not HOW
- Good: `validateEmailFormat()` — Bad: `processString()`

### Pattern 4: Extract File/Module
- If a file has 2+ distinct responsibilities → split
- Each new file = 1 responsibility
- Target: 50-150 lines per file
- Move related functions together
- Update all imports across the project

### Pattern 5: Move Function
- If a function is defined in file A but primarily used in file B → move to B
- Update imports

### Pattern 6: Inline Useless Abstractions
- Wrapper functions that just call another function → remove
- Single-use abstractions → inline the code
- Config objects with only 1 field → use the value directly

### Pattern 7: Rename for Clarity
- Rename variables/functions that don't describe their purpose
- Follow project naming conventions (camelCase/snake_case — be consistent)

## 4.3 Execution Rules

**ONE file at a time.** After each file:

```
1. Apply patterns to file
2. Run lint + typecheck
   → If FAIL → fix immediately
   → If PASS → continue
3. Run tests (if available)
   → If FAIL → revert, the refactoring changed behavior
   → If PASS → file done, move to next
4. Run formatter
```

**NEVER batch multiple files** without validation between each. A broken import in file 2 can cascade to file 3.

**NEVER change behavior.** If you're tempted to "also fix this bug while refactoring" → DON'T. Refactoring and bug fixing are separate tasks.

## 4.4 Import Cleanup

After splitting a file, check ALL files in the project that imported from the original:

```
1. Grep for imports from the refactored file
2. Update each import to point to the new location
3. If backward compatibility needed → add re-exports in the original file
4. Verify: zero broken imports (lint + typecheck must pass)
```

---

## Next Step

Load `steps/step-05-verify.md`
