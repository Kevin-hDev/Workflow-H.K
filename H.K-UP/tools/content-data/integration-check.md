---
type: verification-report
generated_by: Mission 13.1 — Integration E2E Verification
---

# H.K-UP Integration Check

**Date:** 2026-03-17
**Files checked:** 91 (agents, workflows, step files, data files, templates, CLI)

---

## Workflow Chain Verification

| Workflow | Steps | Step files exist? | Chain valid? | Handoff target | Handoff exists? |
|----------|-------|-------------------|-------------|----------------|-----------------|
| diagnostic | 5 steps | ✓ | ✓ | Le Stratège (Standard/Full), L'Architecte (Express), Le Designer (Design), Nyx (Audit) | ✓ all agents exist |
| brainstorming | 5 steps | ✓ | ✓ | PRD workflow (Le Stratège) | ✓ |
| prd | 4 steps | ✓ | ✓ | Architecture workflow (L'Architecte) | ✓ |
| architecture | 5 steps | ✓ | ✓ | Dev workflow (Le Chirurgien) | ✓ |
| design | 4 steps | ✓ | ✓ | Le Chirurgien (Standard/Full) or L'Architecte (Design path) | ✓ |
| dev | 3 steps | ✓ | ✓ | Review workflow (Le Gardien) | ✓ |
| review | 1 step | ✓ | ✓ | Next Quest or Finalization workflow | ✓ |
| security | 3 steps | ✓ | ✓ | Le Chirurgien (Full path) or Finalization (Audit path) | ✓ |
| finalisation | 2 steps | ✓ | ✓ | None (terminal workflow) or new Diagnostic | ✓ |

**All 9 workflow chains verified. All step files exist. All handoffs point to real agents or workflows.**

---

## Data File References in Workflows

| Referenced file | Exists? |
|-----------------|---------|
| `data/global-rules.md` | ✓ |
| `data/brain-methods.csv` | ✓ |
| `data/brainstorm-techniques.csv` | ✓ |
| `data/design-methods.csv` | ✓ |
| `data/prisme-facettes.csv` | ✓ |
| `data/checkup-system.md` | ✓ |
| `data/escalade.md` | ✓ |
| `data/reprise.md` | ✓ |
| `data/security/index.md` | ✓ |
| `data/security/atk-web-common.md` | ✓ |
| `data/security/atk-auth-patterns.md` | ✓ |
| `data/security/atk-supply-chain.md` | ✓ (created in this verification) |
| `data/security/atk-llm-security.md` | ✓ (created in this verification) |
| `data/security/atk-desktop-patterns.md` | ✓ (created in this verification) |
| `data/security/def-input-validation.md` | ✓ |
| `data/security/def-crypto-basics.md` | ✓ |
| `data/security/def-auth-hardening.md` | ✓ (created in this verification) |
| `data/security/def-runtime-safety.md` | ✓ (created in this verification) |
| `data/security/ref-owasp-top10.md` | ✓ |
| `data/modes/table-ronde.md` | ✓ |
| `data/modes/prisme.md` | ✓ |
| `data/modes/simulation.md` | ✓ |
| `data/modes/archeologie.md` | ✓ |
| `data/modes/tribunal.md` | ✓ |
| `data/modes/conformite.md` | ✓ |
| `data/modes/benchmark-vivant.md` | ✓ |
| `data/modes/menu-interactif.md` | ✓ |
| `templates/gap-report.md` | ✓ |
| `templates/debt-report.md` | ✓ |
| `templates/mission-brief.md` | ✓ |

---

## Agent Coherence

| Agent | Workflows listed | Workflows exist? | Interactions reference | Interactions valid? | Rules correct? |
|-------|-----------------|-----------------|----------------------|--------------------|-|
| eclaireur | `workflows/diagnostic/` | ✓ | Le Stratège, L'Architecte, Nyx | ✓ all exist | ✓ Rules 1,2,3,4,7,10 |
| stratege | `workflows/brainstorming/`, `workflows/prd/`, `workflows/finalisation/` | ✓ | L'Éclaireur, L'Architecte, Zero, Le Gardien | ✓ all exist | ✓ Rules 1,3,4,8,10 |
| architecte | `workflows/architecture/` | ✓ | Le Stratège, L'Éclaireur, Le Chirurgien, Le Gardien | ✓ all exist | ✓ Rules 2,4,6,7,10 |
| designer | `workflows/design/` | ✓ | Le Stratège, L'Éclaireur, Le Chirurgien, Le Gardien | ✓ all exist | ✓ Rules 1,2,3,4,10 |
| chirurgien | `workflows/dev/` | ✓ | L'Architecte, Le Gardien, Le Designer | ✓ all exist | ✓ Rules 2,5,6,7,9 |
| gardien | `workflows/review/` | ✓ | Le Chirurgien, L'Architecte, the user | ✓ all exist | ✓ Rules 4,5,7,10 |
| nyx | `workflows/security/` | ✓ | L'Éclaireur, The Mask, Le Chirurgien, Le Gardien | ✓ all exist | ✓ Rules 2,8,10 |
| the-mask | None (reactive only) | N/A | Nyx, Le Stratège, L'Architecte, the user | ✓ all exist | ✓ No dedicated rules |
| zero | None (reactive only) | N/A | Le Stratège, L'Architecte, L'Éclaireur, Nyx+The Mask | ✓ all exist | ✓ No dedicated rules |

**All 9 agents verified. All workflow references and agent interactions are valid.**

---

## Issues Found and Fixed

### Issue 1 — Security index referenced 5 missing files (FIXED)

`data/security/index.md` listed 5 files in its catalog that did not exist on disk:
- `atk-supply-chain.md`
- `atk-llm-security.md`
- `atk-desktop-patterns.md`
- `def-auth-hardening.md`
- `def-runtime-safety.md`

**Fix:** Created all 5 files with complete content (attack patterns, DREAD scores, remediation guides, implementation checklists).

---

### Issue 2 — `PARCOURS.md` reference in eclaireur.agent.md (FIXED)

`eclaireur.agent.md` line 28 referenced `PARCOURS.md` which does not exist in the project.

**Fix:** Updated the reference to `data/escalade.md` which contains the escalation matrix and path guidance.

---

### Issue 3 — `PARCOURS.md` reference in data/escalade.md (FIXED)

`data/escalade.md` line 97 referenced `PARCOURS.md` in the escalation matrix section header.

**Fix:** Removed the reference — the escalation matrix is self-contained in `escalade.md`.

---

### Issue 4 — `MECANISMES.md` reference in architecture/steps/step-04-status.md (FIXED)

`workflows/architecture/steps/step-04-status.md` line 13 instructed the agent to consult `MECANISMES.md` for git strategy — a file that does not exist.

**Fix:** Updated the reference to `project-context.md` which is the actual runtime document containing the confirmed path information.

---

### Issue 5 — `MECANISMES.md` reference in review/steps/step-01-check.md (FIXED)

`workflows/review/steps/step-01-check.md` line 319 referenced `MECANISMES.md` for checkup format.

**Fix:** Updated to reference `data/checkup-system.md` which is the actual file containing all checkup formats.

---

### Issue 6 — `L'Orchestrateur` reference in review/steps/step-01-check.md (FIXED)

`workflows/review/steps/step-01-check.md` lines 372 and 382 referenced "L'Orchestrateur" as an agent to hand off to. No such agent file exists (`orchestrateur.agent.md`).

**Fix:** Replaced with a clear action description: "notify user, proceed to Quest {N+1}" and "Notify user — ready for Quest {N+1} or finalization workflow". The transition is user-driven, not agent-to-agent.

---

## No Remaining Issues

All cross-references are now valid. All referenced files exist. All agent interactions point to real agents. All workflow handoffs are coherent.

---

## File Count Summary

| Category | Count |
|----------|-------|
| Agents | 9 |
| Workflows | 9 |
| Step files | 32 |
| Data files (root + modes + security) | 27 |
| Templates | 3 |
| CLI files | 9 |
| Config files (module.yaml, config-schema.json) | 2 |
| **Total** | **91** |
