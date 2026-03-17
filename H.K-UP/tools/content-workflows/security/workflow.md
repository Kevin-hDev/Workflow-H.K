---
name: security
description: "Security workflow — Nyx audits existing code with STRIDE/DREAD, The Mask attacks in a structured red team duel, user arbitrates"
agent: nyx
reactive_agent: the-mask
mode: SECURITY
---

# Security Workflow — Nyx + The Mask

**Goal:** Audit the existing codebase for vulnerabilities. Nyx runs a systematic STRIDE/DREAD analysis. The Mask attacks with demonstrable exploit chains. The user decides what gets fixed.
**Agent:** Nyx (primary) — The Mask (reactive, Table Ronde Duel only)
**Mode:** SECURITY — read + analyze + recommend. No code modification in this workflow.

---

## INITIALIZATION

**Agent:** Nyx
**Load:** `data/global-rules.md`

**INDEX_THEN_SELECTIVE — mandatory data loading strategy:**
1. Read `data/security/index.md` first — always
2. Identify which files are relevant to the project's stack (from `project-context.md`)
3. Load ONLY the 3-5 most relevant files — never all of them
4. Note which files were loaded and why before starting the audit

**Context received:**
- `{output_folder}/project-context.md` — stack, architecture, entry points, previous findings
- `{output_folder}/prd.md` — if available (scope, features that touch auth/crypto/PII)
- `{output_folder}/architecture.md` — if available (ADRs, trust boundaries, data flows)

**Pre-flight check — verify before starting:**

1. **Resume check** — Read `{output_folder}/hk-up-status.yaml`
   - If found with security steps `in-progress` → propose:
     1. Resume where we left off
     2. Review the plan before continuing
     3. Restart this workflow from scratch
   - If not found → verify that the previous workflow has been completed.

2. **Required files — verify these exist before proceeding:**
   - `{output_folder}/project-context.md` — required. Created by L'Éclaireur in diagnostic workflow. If missing: run `/hkup-start` first.
   - `{output_folder}/prd.md` — optional. Created by Le Stratège in PRD workflow. If missing: run `/hkup-prd` first (or skip if not applicable to this path).
   - `{output_folder}/architecture.md` — optional. Created by L'Architecte in architecture workflow. If missing: run `/hkup-architecture` first (or skip if not applicable to this path).

3. **If any required file is missing:**
   ```
   ⚠ Cannot start Security Audit.
   Missing: project-context.md
   This file should have been created by L'Éclaireur during the diagnostic workflow.
   Run /hkup-start first, or check {output_folder}/ for the file.
   ```

**Path behavior:**

| Path | Status |
|------|--------|
| Full | **MANDATORY** — runs after architecture, before or during execution |
| Audit | **MANDATORY** — this workflow IS the core of the Audit path |
| Standard | **OPTIONAL** — activated if `project-context.md` flags auth, crypto, or PII |
| Express / Design | **OPTIONAL** — activated on explicit user request only |

---

## PRE-EXECUTION

> These rules apply to every step in this workflow.

1. **Rule 9 first** — The first 10 lines of each step file contain the critical instructions. Read them before anything else.
2. **Rule 2** — Read the existing code before auditing. Brownfield = context. Never audit without reading.
3. **Rule 8** — Web search with PRECISE subjects: stack + version + component. Never generic "search for vulnerabilities".
4. **Rule 1** — The user decides what gets fixed, accepted, or deferred. Nyx and The Mask present — the user arbitrates.
5. **INDEX_THEN_SELECTIVE** — Never load all `data/security/` files. Read the index, select, load selectively.
6. **SECURITY mode** — No code modifications. Analysis, findings, and recommendations only.
7. **Blue team + red team** — Both perspectives are required. Nyx defends (blue team). The Mask attacks (red team). Neither perspective alone is sufficient.
8. **6 critical control points** — Non-negotiable blockers. Any BLOCK finding halts with highest priority.

---

## EXECUTION

Execute steps in order. Never skip. Never reorder.

| Step | File | Agent | Description | Output |
|------|------|-------|-------------|--------|
| 01 | `steps/step-01-scan.md` | Nyx | CVE search + STRIDE/DREAD audit + 6 critical control points | Findings in memory |
| 02 | `steps/step-02-challenge.md` | Nyx + The Mask | Table Ronde Duel — red team attacks, blue team defends | Duel summary |
| 03 | `steps/step-03-report.md` | Nyx | Security audit report + remediation plan + user decisions | `security-audit.md` |

---

## Deliverables

| File | Path | Created in step |
|------|------|-----------------|
| `security-audit.md` | `{output_folder}/security-audit.md` | step-03 |

---

## End condition

This workflow is complete when:
- [ ] Web search completed with precise queries (Rule 8)
- [ ] Security data files loaded via INDEX_THEN_SELECTIVE (3-5 files, not all)
- [ ] STRIDE analysis applied to all critical components
- [ ] DREAD scoring completed for every finding
- [ ] 6 critical control points checked — all BLOCK findings documented
- [ ] Table Ronde Duel completed (minimum 3 rounds)
- [ ] User verdicts collected for each duel round (FIX / ACCEPT RISK / DEFER)
- [ ] `security-audit.md` written with full findings + remediation plan
- [ ] `hk-up-status.yaml` updated
- [ ] Explicit handoff to the next workflow announced (Rule 10)
