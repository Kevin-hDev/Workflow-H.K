---
name: diagnostic
description: "First workflow of every H.K-UP journey — scans the project, presents findings, and guides the user to the right path"
agent: eclaireur
mode: DISCOVERY
---

# Diagnostic Workflow — L'Éclaireur

**Goal:** Scan the project, establish the diagnosis, recommend the right H.K-UP path.
**Agent:** L'Éclaireur
**Mode:** DISCOVERY — read-only. No modifications to the project.

---

## INITIALIZATION

**Agent:** L'Éclaireur
**Load:** `data/global-rules.md`

**Resume check — read `hk-up-status.yaml`:**
- If no `hk-up-status.yaml` found → fresh start, proceed to step-01
- If `hk-up-status.yaml` found with diagnostic steps in progress → propose:
  1. Resume where we left off
  2. Review the plan before continuing
  3. Restart the diagnostic from scratch

**If resuming:** jump to the step where status is `in-progress`.
**If fresh start:** proceed to step-01.

---

## PRE-EXECUTION

> These rules apply to every step in this workflow.

1. **Rule 9 first** — The first 10 lines of each step file contain the critical instructions.
   Read them before anything else.
2. **Rule 2** — Read and understand before concluding. No diagnosis without evidence.
3. **Rule 1** — The user confirms at each step. Never auto-advance.
4. **No modifications** — DISCOVERY mode means read-only. Zero writes to the project.
5. **If Agent OS is installed** (`~/agent-os/` exists): read
   `~/agent-os/commands/agent-os/discover-standards.md` and follow its process
   to extract coding standards from the project. Store results for step-02.

---

## EXECUTION

Execute steps in order. Never skip. Never reorder.

| Step | File | Description | Output |
|------|------|-------------|--------|
| 01 | `steps/step-01-scan.md` | Silent scan of the project | Scan data in memory |
| 02 | `steps/step-02-report.md` | Present findings to user + confirm | User confirmation |
| 03 | `steps/step-03-objective.md` | Interactive menu: what does the user want? | Confirmed objective |
| 04 | `steps/step-04-path.md` | Recommend path + effort estimation | Confirmed path |
| 05 | `steps/step-05-confirm.md` | Final validation + create project-context.md | Handoff to next agent |

---

## Deliverables

| File | Created in step |
|------|-----------------|
| `{output_folder}/project-context.md` | step-05 |
| `{output_folder}/gap-report.md` | step-05 (Full path only) |
| `{output_folder}/debt-report.md` | step-05 (Full and Audit paths only) |

---

## End condition

This workflow is complete when:
- [ ] User has confirmed the project findings (step-02)
- [ ] User has chosen their objective (step-03)
- [ ] User has confirmed the recommended path (step-04)
- [ ] `project-context.md` has been written (step-05)
- [ ] `hk-up-status.yaml` has been updated with the confirmed path and missions
- [ ] Explicit handoff to the next agent has been announced (Rule 10)
