---
step: "03"
name: "Security Audit Report"
workflow: security
agent: nyx
---

# Step 03 — Security Audit Report

> **CRITICAL — Rule 10:** This step produces the final deliverable. Explicit handoff required at the end.
> **CRITICAL — Rule 1:** User confirms final verdicts and the remediation plan before handoff.
> **CRITICAL:** `security-audit.md` must be a standalone document — readable without H.K-UP context.
> **CRITICAL — Rule 4:** Checkup before handoff. All BLOCK findings must appear in the remediation plan.
> **CRITICAL:** Handoff path differs: Full path → Le Chirurgien. Audit path → finalization workflow.

---

## Goal

Consolidate all step-01 (STRIDE/DREAD/control points) and step-02 (duel verdicts) findings into a single actionable document. Present the remediation plan to the user for final confirmation. Hand off.

---

## Phase 1 — Compile findings

Before writing, gather all findings from memory:

**From step-01:**
- CVE search results (applicable CVEs only)
- STRIDE findings per component (all unmitigated and partially mitigated)
- DREAD scores (ranked by score, highest first)
- 6 critical control points (status: BLOCK or ✓)
- DATA files loaded via INDEX_THEN_SELECTIVE

**From step-02:**
- Rounds completed
- Per round: attack description, defense assessment (Holds / Partially / Does not hold), user verdict (FIX / ACCEPT RISK / DEFER)
- Zero interventions (if any)

**Verify completeness before writing:**

<output-format>
Pre-report checkup

  From step-01:
    CVE findings recorded:              {count}
    STRIDE components analyzed:         {count}
    DREAD findings scored:              {count}
    BLOCK control points:               {count}

  From step-02:
    Duel rounds completed:              {count}
    FIX verdicts:                       {count}
    ACCEPT RISK verdicts:               {count}
    DEFER verdicts:                     {count}

  All BLOCK findings appear in remediation plan: {Yes | No — {missing item}}

  → {If complete}: Proceed to write security-audit.md
  → {If gaps}: Resolve before writing
</output-format>

---

## Phase 2 — Write security-audit.md

Write to `{output_folder}/security-audit.md`.

**Document structure:**

```markdown
# Security Audit Report — {project_name}

**Date:** {YYYY-MM-DD}
**Auditor:** Nyx (H.K-UP security workflow)
**Path:** {Full | Audit | Standard}
**Stack:** {stack summary from project-context.md}
**Security data loaded:** {list of files loaded in step-01 Phase 2}

---

## Executive Summary

{2–3 sentences:}
- Overall security posture: {Strong / Acceptable / Concerning / Critical}
- Critical findings: {count} blocking issues found
- Recommendation: {one sentence on what must happen before the next release}

---

## CVE Search Results

| CVE / Advisory | Severity | Affected Component | Status |
|----------------|----------|--------------------|--------|
| {CVE-YYYY-NNNNN} | {Critical/High/Medium/Low} | {component} | {Applicable / Not applicable — {reason}} |

{If no applicable CVEs:} No applicable CVEs found for this stack and version combination.

---

## STRIDE Analysis Summary

{For each component analyzed:}

### {component_name}

| STRIDE | Finding | Status |
|--------|---------|--------|
| S — Spoofing | {finding or "—"} | {Finding / ✓ Mitigated} |
| T — Tampering | {finding or "—"} | {Finding / ✓ Mitigated} |
| R — Repudiation | {finding or "—"} | {Finding / ✓ Mitigated} |
| I — Information Disclosure | {finding or "—"} | {Finding / ✓ Mitigated} |
| D — Denial of Service | {finding or "—"} | {Finding / ✓ Mitigated} |
| E — Elevation of Privilege | {finding or "—"} | {Finding / ✓ Mitigated} |

---

## DREAD Scoring — All Findings

| Finding | Component | STRIDE | Score | Severity |
|---------|-----------|--------|-------|----------|
| {finding_title} | {component} | {category} | {score}/50 | {Critical/High/Medium/Low} |

{Sorted by score descending.}

**Distribution:**
- Critical (40+): {count}
- High (30–39): {count}
- Medium (20–29): {count}
- Low (<20): {count}

---

## Critical Control Points

| Control Point | Status | Location |
|---------------|--------|----------|
| 1. Secret comparisons with == | {BLOCK — {file:line} / ✓ Constant-time everywhere} | |
| 2. Unlimited collections from external input | {BLOCK — {file:line} / ✓ All bounded} | |
| 3. Hardcoded secrets in code | {BLOCK — {file:line} / ✓ Env/keystore} | |
| 4. Empty catch {} blocks | {BLOCK — {file:line} / ✓ Proper handling} | |
| 5. Math.random() for tokens/IDs | {BLOCK — {file:line} / ✓ CSPRNG} | |
| 6. Concatenation in system commands | {BLOCK — {file:line} / ✓ Parameterized} | |

**Blocking findings:** {count}

---

## Table Ronde Duel Results

| Round | Attack Vector | Defense | Verdict |
|-------|--------------|---------|---------|
| {N} | {brief description} | {Holds / Partially holds / Does not hold} | {FIX / ACCEPT RISK / DEFER} |

---

## Remediation Plan

### Priority 1 — BLOCK Findings (fix before any deployment)

{For each BLOCK control point:}
- **{finding title}** at `{file:line}`
  Fix: {specific remediation — exact library, pattern, or code change}
  Effort: {Low / Medium / High}

### Priority 2 — FIX Verdicts from Duel

{For each FIX verdict from step-02 duel:}
- **{finding title}** — DREAD: {score}/50
  Fix: {specific remediation from Nyx's recommended fix in step-02}
  Effort: {Low / Medium / High}

### Priority 3 — High DREAD Findings Not Yet Addressed

{Findings scored 30+ not covered by Priority 1 or 2:}
- **{finding title}** — DREAD: {score}/50
  Recommendation: {specific action}
  Rationale: {why this matters}

---

## Accepted Risks

| Risk | DREAD | Reason | Accepted by |
|------|-------|--------|-------------|
| {finding} | {score}/50 | {user's stated reason} | User ({date}) |

{If none: No risks accepted. All findings have FIX or DEFER verdicts.}

---

## Deferred Risks

| Risk | DREAD | Target Milestone | Reason |
|------|-------|-----------------|--------|
| {finding} | {score}/50 | {milestone or version} | {why deferred} |

{If none: No risks deferred.}

---

## Appendix — Methodology

- STRIDE: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
- DREAD: Damage + Reproducibility + Exploitability + Affected users + Discoverability (scored 1–10 each, /50 total)
- Critical: 40+/50 | High: 30–39/50 | Medium: 20–29/50 | Low: <20/50
- Table Ronde Duel: Nyx (blue team) vs The Mask (red team), user arbitrates
```

---

## Phase 3 — Present and confirm

Present the written report to the user.

<output-format>
Security audit report written: {output_folder}/security-audit.md

Summary:
  BLOCK findings:    {count} — must fix before deployment
  FIX verdicts:      {count} — from Table Ronde Duel
  Accepted risks:    {count}
  Deferred:          {count}

Remediation plan has {count} items:
  Priority 1 (BLOCK):      {count}
  Priority 2 (Duel FIX):   {count}
  Priority 3 (High DREAD): {count}

What would you like to do?
  1. Review the full report before confirming
  2. Adjust any verdict (change FIX / ACCEPT / DEFER)
  3. Confirm and proceed to handoff
</output-format>

Wait for user confirmation before handoff.

---

## Reflection modes

After user confirmation:

<output-format>
Audit complete. Final reflection before handoff?

  REFLECTION MODES
  1. Conformité  — Legal exposure from accepted/deferred risks (GDPR, breach notification liability)
  2. Prisme      — Business: cost of a breach vs cost of the remediation plan
  3. Simulation  — Incident Response: if the highest gap is exploited tomorrow, what happens?

  ─────────────────────────────────────────────────────────
  S. Save and proceed to handoff
</output-format>

**Before executing any mode above, LOAD its data file:**
- Conformité → LOAD `data/modes/conformite.md`
- Table Ronde → LOAD `data/modes/table-ronde.md`

---

## Checkup before handoff

<output-format>
Pre-handoff checkup

  security-audit.md written:              {Yes | No}
  All BLOCK findings in remediation plan: {Yes | No — {missing item}}
  All duel FIX verdicts in plan:          {Yes | No — {missing item}}
  Accepted risks documented with reason:  {Yes | N/A}
  Deferred risks documented with target:  {Yes | N/A}
  User confirmed the report:              {Yes | No — waiting}

  → {If all Yes}: Handoff confirmed. Proceed.
  → {If any No}: Resolve before handoff.
</output-format>

---

## Transition

**Full path:**

<output-format>
Security Workflow done. ✓

  security-audit.md written: {output_folder}/security-audit.md
  Remediation items: {count} ({BLOCK_count} blocking)

→ Le Chirurgien — remediation missions
  The following items are added to plan.md as new missions:
    {Priority 1 items — BLOCK findings}
    {Priority 2 items — FIX verdicts}
  Priority 3 items are added to the backlog for user triage.

  Transmitting: security-audit.md + updated plan.md
</output-format>

**Audit path:**

<output-format>
Security Workflow done. ✓

  security-audit.md written: {output_folder}/security-audit.md
  Remediation items: {count}

→ Finalization Workflow
  The audit report is the primary deliverable for this path.
  Transmitting: security-audit.md for final documentation and handoff.
</output-format>

Update `hk-up-status.yaml`:
- `step-03-report → done`
- `9-2-donnees-securite → done` (or the appropriate mission key)
- If Audit path: `phase-9-securite → done`
