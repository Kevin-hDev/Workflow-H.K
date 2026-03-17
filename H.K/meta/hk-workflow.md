---
name: hk-workflow
description: Pipeline H.K — steps, transitions, mapping mode, règles de skip par niveau
when_to_load: Chargé à chaque transition de step (voir hk-rules-loader.md)
---

# Pipeline H.K

## Les 7 steps du pipeline

```
00-init → 01-analyze → 02-plan → [02b-design] → 03-execute → 04-validate → [05-harden] → 06-ship
```

| Step | Mode | Description |
|------|------|-------------|
| `00-init` | `IDLE` | Parsing flags, détection build system, création .hk/hk-state.json |
| `01-analyze` | `ANALYZE` | Exploration codebase, détection risques, scope estimation |
| `02-plan` | `PLAN` | Rédaction plan, AC, missions, hash verrouillé |
| `02b-design` | `CREATIVE` | Design brief — 3 options obligatoires avant choix |
| `03-execute` | `EXECUTE` | Implémentation fichier par fichier, checkpoint après chaque fichier |
| `04-validate` | `VALIDATE` | Tests, lint, typecheck, screenshots si Playwright |
| `05-harden` | `HARDEN` | Review sécurité — obligatoire si risk_level MEDIUM ou HIGH |
| `06-ship` | `SHIP` | Git add/commit/push/PR |

---

## Transitions autorisées

```
IDLE       → ANALYZE   : après parsing flags (step-00 complet)
ANALYZE    → PLAN      : après update .hk/hk-state.json avec findings
PLAN       → CREATIVE  : si variables.design_mode = true
PLAN       → EXECUTE   : plan approuvé + confidence.pre_execute >= 0.90
CREATIVE   → EXECUTE   : design brief écrit + confidence.pre_execute >= 0.90
EXECUTE    → VALIDATE  : tous fichiers plan.files_remaining = []
VALIDATE   → HARDEN    : confidence.post_validate >= 0.85 (ou SelfCheck 4/4)
VALIDATE   → SHIP      : si risk_level = LOW et harden_mode = false
HARDEN     → SHIP      : threat_model_done = true (HIGH) ou review complète
SHIP       → IDLE      : run terminé
```

**Transitions interdites** :
- `ANALYZE → EXECUTE` : le plan doit exister
- `EXECUTE → ANALYZE` : retour arrière interdit sans validation explicite
- `HARDEN → EXECUTE` : zéro modification après review sécurité

---

## Règles de skip par niveau

Voir seuils dans `shared/meta/complexity-levels.md`.

| Niveau | Steps actifs | Steps skippés/allégés |
|--------|-------------|----------------------|
| `L1` | EXECUTE + VALIDATE inline | 01-analyze, 02-plan, 05-harden (sauf risk HIGH) |
| `L2` | 01-analyze (rapide) + 02-plan + 03-execute + 04-validate | 02b-design, 05-harden (si risk LOW) |
| `L3` | Pipeline complet sauf 02b-design | 02b-design (sauf si design_mode) |
| `L4` | Pipeline complet | Aucun skip — 02b-design obligatoire |

**Règle absolue** : même en L1, si `risk_level = MEDIUM` ou `HIGH`, le step 05-harden est obligatoire.
Le flag `--skip-harden` (`-H`) est ignoré silencieusement pour MEDIUM/HIGH.

---

## Mapping step → fichier de step

```
H.K/hk/steps/step-00-init.md
H.K/hk/steps/step-01-analyze.md
H.K/hk/steps/step-02-plan.md
H.K/hk/steps/step-02b-design.md
H.K/hk/steps/step-03-execute.md
H.K/hk/steps/step-04-validate.md
H.K/hk/steps/step-05-harden.md
H.K/hk/steps/step-06-ship.md
```

Sub-steps init : `step-00b-branch.md`, `step-00b-build.md`, `step-00b-economy.md`, `step-00b-interactive.md`
