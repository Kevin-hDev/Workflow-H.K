---
name: hk-rules-loader
description: Séquence de chargement des règles pour le workflow H.K — à charger à chaque transition de step
when_to_load: Chaque transition de step (ERREUR FATALE si oublié)
---

# Séquence de chargement des règles H.K

## Chargement obligatoire (chaque transition de step)

```
1. shared/meta/security-rules.md   — 10 réflexes sécurité (toujours)
2. shared/meta/structure-rules.md  — 8 réflexes structure (toujours)
3. shared/meta/modes.md            — permissions du mode courant
4. H.K/meta/hk-workflow.md         — pipeline H.K spécifique
5. step-XX.md courant              — instructions uniques du step
```

**ERREUR FATALE** : sauter une de ces 5 étapes invalide la session.
Vérifier `.hk/hk-state.json.current_mode` avant chaque action.

---

## Chargement conditionnel

| Condition | Fichier à charger |
|-----------|-------------------|
| mode = `CREATIVE` | `shared/meta/design-rules.md` |
| complexity_level = `L3` ou `L4` | `shared/meta/confidence-checker.md` + `shared/meta/self-check.md` |
| risk_level = `MEDIUM` ou `HIGH` | `shared/meta/security-rules.md` section avancée (Trust-Adaptive) |
| Délégation sous-agent | `H.K/meta/hk-delegation.md` |

---

## Vérification de cohérence

Avant toute transition de mode, vérifier dans `.hk/hk-state.json` :

```
current_mode          → mode actif (doit matcher le step courant)
complexity_level      → niveau L1-L4 (détermine la cérémonie)
security.risk_level   → LOW/MEDIUM/HIGH (détermine les gates)
```

Référence des modes et permissions : `shared/meta/modes.md`
Référence des niveaux et seuils : `shared/meta/complexity-levels.md`
