# Step 2 — Prioritize (Full Codebase Mode)

> This step only runs in Mode 1 (full codebase). Modes 2-3 skip it.
> Reload: debt audit report from step-01.

---

## 2.1 Impact × Effort Matrix

For each flagged file, score:

| File | Impact (H/M/L) | Effort (H/M/L) | Priority |
|------|--------|--------|----------|
| {path} | {how much it affects the project} | {how hard to refactor} | {computed} |

**Priority rules:**
- High Impact + Low Effort → **Do first** (quick wins)
- High Impact + High Effort → **Plan carefully**
- Low Impact + Low Effort → **Do if time allows**
- Low Impact + High Effort → **Skip**

## 2.2 Order of Operations

> "Based on the analysis, here's the recommended refactoring order:
>
> 1. {file} — {why first}
> 2. {file} — {why second}
> 3. {file} — {why third}
> ...
>
> Want to follow this order or adjust?"

## 2.3 Scope Decision

> "How much do you want to refactor today?
>
> **[A]** Everything in the priority list
> **[B]** Top 3 only
> **[C]** Just the #1 priority"

---

## Next Step

Load `steps/step-03-plan.md` with the selected files.
