# Step 1 — Audit (Full Codebase Mode)

> This step only runs in Mode 1 (full codebase). Modes 2-3 skip it.

---

## 1.1 Measure Current State

Scan all source files (exclude node_modules, .git, build/, dist/, vendor/):

```
For each file, collect:
- File path
- Line count
- Number of functions/methods
- Number of imports
- Number of exports
```

## 1.2 Detect Debt Signals

Flag files matching these criteria:

| Signal | Threshold | Severity |
|--------|-----------|----------|
| **File too large** | > 250 lines | High |
| **Too many functions** | > 10 functions in one file | Medium |
| **Mixed responsibilities** | UI + logic + data access in same file | High |
| **Dead code** | Unused imports, commented code, unreferenced functions | Medium |
| **God file** | > 500 lines, touched by many features | Critical |
| **Duplicate blocks** | Similar code in 2+ files | Medium |
| **Deep nesting** | > 4 levels of indentation | Medium |

## 1.3 Generate Debt Report

Present findings:

```
## Debt Audit Report

**Files scanned:** {count}
**Issues found:** {count}

### Critical
| File | Lines | Issue |
|------|-------|-------|
| {path} | {count} | {description} |

### High
| File | Lines | Issue |
|------|-------|-------|

### Medium
| File | Lines | Issue |
|------|-------|-------|
```

> "Here's the debt audit. Which issues do you want to address?"

---

## Next Step

Load `steps/step-02-prioritize.md`
