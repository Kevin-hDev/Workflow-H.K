# Technical Debt Report — {project_name}

**Date**: {date}
**Produced by**: L'Éclaireur + Tribunal de la Dette
**Journey**: {parcours_type}

---

## Summary

| Metric | Value |
|--------|-------|
| Debts identified | {total_debts} |
| Critical | {critical_count} |
| Major | {major_count} |
| Minor | {minor_count} |
| **Total estimated cost** | **{total_cost}** |

{summary_paragraph}

---

## Debts by category

### {category_1} ({category_1_count} debts)

#### {debt_1_title}

| Field | Value |
|-------|-------|
| **Severity** | {debt_1_severity} |
| **Affected files** | {debt_1_files} |
| **Description** | {debt_1_description} |
| **Impact if not fixed** | {debt_1_impact} |
| **Cost to fix** | {debt_1_cost} |
| **Verdict** | {debt_1_verdict} |

> Verdicts: `FIX` | `ACCEPT` | `DEFER`

#### {debt_2_title}

| Field | Value |
|-------|-------|
| **Severity** | {debt_2_severity} |
| **Affected files** | {debt_2_files} |
| **Description** | {debt_2_description} |
| **Impact if not fixed** | {debt_2_impact} |
| **Cost to fix** | {debt_2_cost} |
| **Verdict** | {debt_2_verdict} |

---

## Statistics

### By severity

| Severity | Count | % of total |
|----------|-------|------------|
| Critical | {critical_count} | {critical_percent}% |
| Major | {major_count} | {major_percent}% |
| Minor | {minor_count} | {minor_percent}% |

### By category

| Category | Count | Estimated cost |
|----------|-------|----------------|
| {cat_1_name} | {cat_1_count} | {cat_1_cost} |
| {cat_2_name} | {cat_2_count} | {cat_2_cost} |

---

## Recommendations

1. **Fix first**: {priority_fixes}
2. **Accept (too costly)**: {accepted_debts}
3. **Defer (next phase)**: {deferred_debts}

---

## Tribunal decisions

> Fill in during the Tribunal de la Dette session.

| # | Debt | Decision | Justification |
|---|------|----------|---------------|
| 1 | {tribunal_debt_1} | {tribunal_verdict_1} | {tribunal_reason_1} |
| 2 | {tribunal_debt_2} | {tribunal_verdict_2} | {tribunal_reason_2} |

**Verdict file**: `{output_folder}/debt-verdict.md`
