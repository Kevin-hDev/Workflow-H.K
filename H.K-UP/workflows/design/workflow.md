---
name: design
description: "Design workflow — Le Designer audits the existing UI, explores 3+ visual directions, produces HTML mockups and defines design tokens"
agent: designer
mode: PLANNING
---

# Design Workflow — Le Designer

**Goal:** Audit the existing UI. Explore contrasting visual directions. Produce standalone HTML
mockups and a complete design token system. Every UI feature from the PRD gets a mockup before
Le Chirurgien touches a single line of CSS.
**Agent:** Le Designer
**Mode:** PLANNING — read, write design docs and mockups. No functional code modifications.

---

## INITIALIZATION

**Agent:** Le Designer
**Load:** `data/global-rules.md` + `data/design-methods.csv` + `data/design/anti-slop-patterns.md`

**Receives:**
- `{output_folder}/project-context.md` — full project diagnosis (from L'Éclaireur)
- `{output_folder}/prd.md` — UI feature sections (from Le Stratège)
- Screenshots of existing UI (via Playwright MCP if available)

**Path behavior:**
- **Design path:** This is the PRIMARY workflow. Full pipeline, all 4 steps.
- **Standard/Full path:** Activated only when the PRD contains UI features.
  If the PRD has no UI features → this workflow is SKIPPED.
- **Express path:** This workflow is SKIPPED. Le Chirurgien implements UI
  directly from project-context.md constraints.

**Resume check — read `hk-up-status.yaml`:**
- If design steps are `in-progress` → propose:
  1. Resume where we left off
  2. Review the direction before continuing
  3. Restart the design workflow from scratch
- If fresh start → proceed to step-01.

### Pre-flight — input file confirmation

⛔ STOP — Do NOT read file contents yet. List filenames only.

Search for the expected input files in `{output_folder}/`:
- `project-context.md` — check `{output_folder}/diagnostic/project-context.md` or `{output_folder}/project-context.md`
- `prd.md` — check `{output_folder}/prd/prd.md` or `{output_folder}/prd.md`
- `hk-up-status.yaml` — check `{output_folder}/hk-up-status.yaml`
- If the subdirectory structure is not found, glob fallback: `*project-context*`, `*prd*`, `*hk-up-status*`

Present what was found:

<output-format>
🎨 Le Designer — Pre-flight check

  Files found:
  ✓/✗ project-context.md — required (from diagnostic)
  ✓/✗ prd.md — required (UI features sections)
  ✓/✗ hk-up-status.yaml — required

  Do you have any additional files or context to provide?

  1. Load everything and start
  2. Add a file or context first
</output-format>

⛔ STOP CONDITION: Do NOT proceed to step-01 until the user confirms with option 1.
If the user picks 2: accept the file path or context, add it to the input list, then re-present.

---

## PRE-EXECUTION

> These rules apply to every step in this workflow.

1. **Rule 9 first** — The first 10 lines of each step file contain the critical instructions.
   Read them before anything else.
2. **Rule 2** — Audit the existing UI before proposing anything. The existing contains
   invisible constraints. Never redesign from a blank slate without evidence.
3. **Rule 1** — The user chooses the visual direction. Never impose. Always 3 options minimum.
4. **Rule 4** — Blocking design vs PRD checkup before handoff to Le Chirurgien.
   Every UI feature from the PRD must have a corresponding mockup.
5. **Anti-AI-slop** — No generic interfaces. Every screen must have a signature.
   "Correct but bland" is not acceptable. Aim for "subtle wow".
6. **Tokens before code** — CSS variables first. No hardcoded color, spacing or
   typography value anywhere in mockups or spec-design.md.
7. **Accessibility from the start** — WCAG 2.1 AA minimum. Not an add-on —
   a design constraint integrated from step-01.

---

## EXECUTION

Execute steps in order. Never skip. Never reorder.

| Step | File | Description | Output |
|------|------|-------------|--------|
| 01 | `steps/step-01-audit.md` | Audit existing UI + heuristic evaluation + competitive | Audit findings confirmed |
| 02 | `steps/step-02-explore.md` | Explore 3+ visual directions + wireframes | Confirmed direction + wireframes |
| 03 | `steps/step-03-mockup.md` | HTML mockups + design tokens | `mockups/` + `spec-design.md` (draft) |
| 04 | `steps/step-04-validate.md` | Design vs PRD checkup + finalize spec-design.md | `spec-design.md` (final) + handoff |

---

## Deliverables

| File | Created in step |
|------|-----------------|
| `{output_folder}/spec-design.md` | step-03, finalized in step-04 |
| `{output_folder}/mockups/{screen}.html` | step-03 (one file per key screen) |

---

## End condition

This workflow is complete when:
- [ ] Existing UI has been audited with heuristic evaluation (step-01)
- [ ] Competitive landscape has been reviewed (step-01)
- [ ] 3+ visual directions have been presented and one confirmed (step-02)
- [ ] Low-fidelity wireframes have been validated (step-02)
- [ ] HTML mockups cover all UI features from the PRD (step-03)
- [ ] Design tokens are defined as CSS variables in spec-design.md (step-03)
- [ ] Checkup confirms 100% of PRD UI features have a mockup (step-04)
- [ ] `spec-design.md` has been saved to `{output_folder}/` (step-04)
- [ ] Explicit handoff to Le Chirurgien has been announced (Rule 10)

**Rule 14:** Launch the next workflow in a NEW session. Run `/clear` or start a new conversation.
