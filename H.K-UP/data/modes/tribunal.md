---
mode: tribunal
type: reflection-mode
loaded_by: agents, step files
agents: [eclaireur, zero]
arbitrator: user
output_file: debt-verdict.md
template: templates/debt-report.md
---

# Tribunal de la Dette — Technical Debt Court

> **CRITICAL — Rule 1:** The USER is the judge. Every verdict requires explicit user confirmation.
> **CRITICAL:** L'Éclaireur prosecutes. Zero defends. No verdict without both sides heard.
> **CRITICAL:** Each debt gets its own trial. Never batch-verdict multiple debts at once.

---

## What it is

A structured process where each piece of technical debt is put on trial.
The goal is not to eliminate all debt — it is to make an **informed, explicit decision**
about every significant debt: Fix it, Accept it, or Defer it.

**Roles:**
- **L'Éclaireur** = Prosecution — presents the debt, explains the problem, quantifies the impact
- **Zero** = Defense — explains why the debt exists, argues the cost/benefit of fixing
- **User** = Judge — delivers the final verdict for each debt

---

## Sources of debt

Debt items come from prior workflow steps. The Tribunal does not discover new debt — it judges debt already identified:
- L'Éclaireur's diagnostic scan findings
- Architecture analysis flagged items
- Code review findings from Le Gardien
- Security audit items marked "DEFER" in step-02

If no debt has been identified yet, run the diagnostic workflow first before activating the Tribunal.

---

## Trial format

Each debt follows this exact structure. The user does NOT skip the verdict.

```
TRIBUNAL — Trial {N}

  ──────────────────────────────────────────────────────────
  ⚖️  DEBT: {debt_title}
  Category: {code quality | architecture | test coverage | security | documentation | performance}
  Severity: {Critical | Major | Minor}
  ──────────────────────────────────────────────────────────

  🔴 L'ÉCLAIREUR — Prosecution
  ──────────────────────────────────────────────────────────

  Description:
  {What the debt is — concrete, specific, with file references if possible}

  Affected areas: {file:line or component names}

  Impact if not fixed:
  {What breaks, slows down, or becomes impossible if this is left as-is}

  Cost to fix: {Low (< 1 day) | Medium (1–3 days) | High (> 3 days)}

  ──────────────────────────────────────────────────────────
  🔵 ZERO — Defense
  ──────────────────────────────────────────────────────────

  Why it exists:
  {Historical context — why was this written this way? What constraint created it?}

  Argument for keeping it:
  {Why fixing it might not be worth it — complexity, risk, cost vs benefit}

  Evidence: {reference, benchmark, or past incident if applicable — or "No strong argument for keeping it"}

  If fixed, recommended approach:
  {The right way to fix it, if Zero agrees it should be fixed}

  ──────────────────────────────────────────────────────────
  ⚖️  USER — Verdict
  ──────────────────────────────────────────────────────────

  {FIX | ACCEPT | DEFER}
```

**Verdict meanings:**
- **FIX** — Add to remediation plan. Assign to Le Chirurgien in the next dev mission.
- **ACCEPT** — Consciously accepted. Documented in `debt-verdict.md` as accepted risk with reason.
- **DEFER** — Not now. Documented with a target milestone or trigger condition.

---

## Trial selection strategy

Not all debt is tried. Prioritize:

1. **Critical severity first** — debt that blocks features, causes bugs, or creates security exposure
2. **High-effort debt second** — debt that costs the most to fix (surfaces the real cost)
3. **Quickest wins third** — debt that can be fixed in under 1 day (easy momentum)
4. **Skip Minor/cosmetic** — debt that has no functional impact is not tried unless the user specifically requests it

**Minimum:** 1 trial (even if only one debt exists).
**Maximum:** Stop when all Critical items are judged, or when the user calls a halt.

---

## How to run a Tribunal session

### Step 1 — Present the docket

List all debt items before starting trials:

```
TRIBUNAL DE LA DETTE — Docket

  {N} debts identified for trial:

  # | Debt | Severity | Category
  ──────────────────────────────────────────────────────────
  1 | {debt_1_title} | {Critical | Major | Minor} | {category}
  2 | {debt_2_title} | [...]
  [...]

  Proposed trial order: Critical first, then Major, then Minor.
  Would you like to adjust the order or skip any items?
```

Wait for user confirmation before starting the first trial.

### Step 2 — Run each trial

Use the trial format above. After each verdict:
- Record the verdict
- Re-show the remaining docket with the tried item marked
- Ask: "Continue to the next trial, or end the session?"

### Step 3 — Tribunal summary

After all selected trials are complete:

```
TRIBUNAL SUMMARY

  Trials completed: {count}
  FIX:    {count} — entering remediation plan
  ACCEPT: {count} — documented as accepted risk
  DEFER:  {count} — documented with target milestone

  Total estimated fix effort: {sum of FIX costs}

  Remediation plan (FIX verdicts):
  Priority | Debt | Cost | Suggested milestone
  ────────────────────────────────────────────
  1 | {debt} | {cost} | {milestone}
  [...]
```

---

## Output files

### 1 — Step deliverable (appended section)

```markdown
### Tribunal de la Dette (validated)

- Trials completed: {count}
- Verdicts: {count} FIX | {count} ACCEPT | {count} DEFER

| # | Debt | Verdict | Reason |
|---|------|---------|--------|
| 1 | {debt_1} | FIX | {reason} |
| 2 | {debt_2} | ACCEPT | {reason} |

**Total fix effort:** {estimate}
**Verdict file:** `{output_folder}/debt-verdict.md`
```

### 2 — debt-verdict.md (using templates/debt-report.md)

After the Tribunal, generate `{output_folder}/debt-verdict.md` using `templates/debt-report.md`:
- Fill in all FIX, ACCEPT, and DEFER verdicts
- Include the prosecution/defense arguments for each debt
- Include the remediation plan for FIX verdicts
- Mark ACCEPT items with the user's stated reason
- Mark DEFER items with the target milestone or trigger condition
