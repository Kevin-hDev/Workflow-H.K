---
name: finalisation
description: "Closing workflow of every H.K-UP parcours — verifies full PRD coverage, updates documentation, and formally closes the engagement"
agent: stratege
mode: VALIDATION
---

# Finalisation Workflow — Le Stratège

**Goal:** Verify that every Must Have feature in the PRD (or equivalent reference document)
is fully implemented. Update project documentation. Formally close the H.K-UP parcours.
**Agent:** Le Stratège
**Mode:** VALIDATION — read and verify. Write only to documentation files and hk-up-status.yaml.

---

## INITIALIZATION

**Agent:** Le Stratège
**Load:** `data/global-rules.md` then `data/checkup-system.md`

**Receives at entry:**

| Document | From | Required for |
|----------|------|-------------|
| `{output_folder}/hk-up-status.yaml` | All workflows | Mission status, parcours type |
| `{output_folder}/project-context.md` | Diagnostic | Project facts and conventions |
| `{output_folder}/prd.md` | PRD workflow | Feature reference (Standard/Full) |
| `{output_folder}/architecture.md` | Architecture | ADRs, technical decisions |
| `{output_folder}/plan.md` | Architecture | Quest/Mission mapping |
| `{output_folder}/spec-design.md` | Design (if applicable) | UI coverage |
| `{output_folder}/security-audit.md` | Security (if applicable) | Security coverage |

**Pre-flight check — verify before starting:**

1. **Resume check** — Read `{output_folder}/hk-up-status.yaml`
   - If found with finalisation steps `in-progress` → propose:
     1. Resume where we left off
     2. Review the plan before continuing
     3. Restart this workflow from scratch
   - If not found → verify that the previous workflow has been completed.

2. **Required files — verify these exist before proceeding:**
   - `{output_folder}/hk-up-status.yaml` — required. Present since diagnostic workflow. If missing: run `/hkup-start` first.
   - `{output_folder}/project-context.md` — required. Created by L'Éclaireur in diagnostic workflow. If missing: run `/hkup-start` first.
   - `{output_folder}/prd.md` — required for Standard/Full. Created by Le Stratège in PRD workflow. If missing: run `/hkup-prd` first.
   - `{output_folder}/plan.md` — required. Created by L'Architecte in architecture workflow. If missing: run `/hkup-architecture` first.
   - `{output_folder}/architecture.md` — required for Standard/Full. Created by L'Architecte in architecture workflow. If missing: run `/hkup-architecture` first.
   - `{output_folder}/spec-design.md` — optional, Design/Full only. Created by Le Designer in design workflow. If missing: run `/hkup-design` first (or skip if not applicable to this path).
   - `{output_folder}/security-audit.md` — optional, Full/Audit only. Created by Nyx in security workflow. If missing: run `/hkup-security` first (or skip if not applicable to this path).

3. **If any required file is missing:**
   ```
   ⚠ Cannot start Finalisation.
   Missing: {file_name}
   This file should have been created by {agent_name} during the {workflow_name} workflow.
   Run /hkup-{command} first, or check {output_folder}/ for the file.
   ```

### Pre-flight — input file confirmation

⛔ STOP — Do NOT read file contents yet. List filenames only.

Search for the expected input files in `{output_folder}/`:
- `project-context.md` — check `{output_folder}/diagnostic/project-context.md` or `{output_folder}/project-context.md`
- `prd.md` — check `{output_folder}/prd/prd.md` or `{output_folder}/prd.md` (required for Standard/Full)
- `plan.md` — check `{output_folder}/architecture/plan.md` or `{output_folder}/plan.md`
- `hk-up-status.yaml` — check `{output_folder}/hk-up-status.yaml`
- If the subdirectory structure is not found, glob fallback: `*project-context*`, `*prd*`, `*plan*`, `*hk-up-status*`

Present what was found:

<output-format>
♟️ Le Stratège — Pre-flight check

  Files found:
  ✓/✗ project-context.md — required (from diagnostic)
  ✓/✗ prd.md — required for Standard/Full
  ✓/✗ plan.md — required (from architecture)
  ✓/✗ hk-up-status.yaml — required

  Do you have any additional files or context to provide?

  1. Load everything and start
  2. Add a file or context first
</output-format>

⛔ STOP CONDITION: Do NOT proceed to step-01 until the user confirms with option 1.
If the user picks 2: accept the file path or context, add it to the input list, then re-present.

**Reference document by parcours:**

| Parcours | Checkup reference | What is verified |
|----------|-------------------|-----------------|
| Express | `project-context.md` objectives | Objectives from step-03 |
| Standard | `prd.md` all features | Must Have + Should Have |
| Full | `prd.md` all features + `security-audit.md` | Features + security remediation |
| Design | `prd.md` UI features + `spec-design.md` | UI features + design tokens |
| Audit | `project-context.md` + `security-audit.md` | Findings coverage (no code) |

---

## PRE-EXECUTION

> These rules apply to every step in this workflow.

1. **Rule 9 first** — The first 10 lines of each step file contain the critical instructions. Read them before anything else.
2. **Rule 4** — The final checkup is a BLOCKING gate. The parcours does not close until Must Have = 100%.
3. **Rule 1** — If Must Have gaps are found, the user decides: add missions or accept the gap (with documentation). Never auto-close.
4. **Rule 10** — The formal closure must explicitly announce: what was completed, what was deferred, what to do next.
5. **This is the last safety net** — If something was missed across the entire parcours, it is caught here. Take the time.

---

## EXECUTION

Execute steps in order. Never skip.

| Step | File | Description | Output |
|------|------|-------------|--------|
| 01 | `steps/step-01-checkup-prd.md` | Final coverage checkup: reference doc vs implementation | Coverage report |
| 02 | `steps/step-02-handoff.md` | Documentation update, closing summary, formal farewell | Updated docs + closure |

---

## Deliverables

| File | Created / updated in step |
|------|--------------------------|
| Coverage report (in step deliverable) | step-01 |
| `{project_root}/README.md` | step-02 (updated or created) |
| `{project_root}/CHANGELOG.md` | step-02 (updated or created) |
| `{output_folder}/hk-up-status.yaml` | step-02 (final status: complete) |

---

## End condition

This workflow (and the entire H.K-UP parcours) is complete when:
- [ ] Final coverage checkup passed: Must Have = 100% (step-01)
- [ ] All Should Have gaps documented and user decision recorded (step-01)
- [ ] README.md updated with what changed (step-02)
- [ ] CHANGELOG.md updated (step-02)
- [ ] `hk-up-status.yaml` marked `completed` (step-02)
- [ ] Closing summary presented to the user (step-02)
- [ ] Explicit next steps offered (step-02)

**Rule 14:** Launch the next workflow in a NEW session. Run `/clear` or start a new conversation.
