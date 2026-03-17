# Step 5 — Verify

> Reload: list of refactored files, pre-refactoring metrics.

---

## 5.1 Final Validation

Run full validation suite:

```
1. Lint (detected command) → MUST PASS
2. Typecheck (detected command) → MUST PASS
3. Full test suite (if available) → MUST PASS
4. Formatter → apply
```

If anything fails → identify which refactoring broke it → fix or revert.

## 5.2 Before/After Metrics

Present comparison:

```
## Refactoring Report

### Files Changed
| File | Before (lines) | After (lines) | Change |
|------|----------------|---------------|--------|
| {original path} | {before} | {after} | {-N lines} |
| {new file 1} | — | {lines} | new |
| {new file 2} | — | {lines} | new |

### Summary
- **Files before:** {count}
- **Files after:** {count} ({+N new files from splits})
- **Total lines before:** {count}
- **Total lines after:** {count} ({difference})
- **Largest file before:** {path} ({lines} lines)
- **Largest file after:** {path} ({lines} lines)
- **Dead code removed:** {count} lines
- **Functions extracted:** {count}
```

## 5.3 Reflection

Before presenting the report, self-verify:
- Did every refactored file end up under 250 lines (target 50-150)?
- Did I change ONLY structure, NEVER behavior?
- Do all tests still pass?
- Are all imports updated across the project (zero broken references)?
- Did I remove ALL dead code found (no commented code left)?
- Is naming consistent throughout the refactored files?

If any answer is no → fix before presenting.

## 5.4 Closing

> "Refactoring complete!
>
> **{count} files refactored**, {count} new files created from splits.
> **{lines} lines of dead code removed.**
> **Largest file went from {before} to {after} lines.**
>
> All tests pass. Zero broken imports."
