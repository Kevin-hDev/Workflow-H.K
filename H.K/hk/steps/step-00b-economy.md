---
name: step-00b-economy
description: Economy mode overrides - no subagents, direct tool usage to save tokens
load_condition: economy_mode = true
---

> Avant d'exécuter ce step, recharger :
> - shared/meta/security-rules.md
> - shared/meta/modes.md
> - Le mode actif est : [MODE: IDLE]

# Economy Mode Overrides

**Ce fichier est chargé UNIQUEMENT quand le flag `-e` / `--economy` est actif.**

Ces instructions REMPLACENT le comportement par défaut pour économiser les tokens.

---

## OVERRIDES CRITIQUES (applicables à tous les steps)

### Override 1 : Pas de sous-agents

Au lieu de lancer des agents parallèles, utiliser les outils directs :
- Glob pour trouver les fichiers
- Grep pour chercher du contenu
- Read pour examiner les fichiers
- WebSearch uniquement si absolument nécessaire (max 2 recherches)

### Override 2 : Pattern d'exploration directe

```
1. Glob: "**/*{keyword}*" pour les fichiers liés à la tâche
2. Grep: chercher les patterns spécifiques dans src/
3. Read: lire les 3-5 fichiers les plus pertinents
4. WebSearch: uniquement si documentation externe nécessaire
```

### Override 3 : Portée réduite

- Commencer par les chemins évidents (src/auth/, src/api/, etc.)
- Chercher les mots-clés exacts de la tâche
- Arrêter d'explorer dès qu'on a assez de contexte

### Override 4 : Validation allégée

Au lieu d'un agent code-reviewer :
1. Lancer typecheck + lint
2. Lancer les tests affectés
3. Auto-revue rapide (pas d'agent)

### Override 5 : Step-05 (Harden) automatiquement désactivé

`{harden_mode}` est forcé à false en economy mode.

---

## PAR STEP (résumé)

| Step | Override |
|------|----------|
| 01 Analyze | Glob + Grep + Read au lieu de sous-agents parallèles |
| 02 Plan | Identique au défaut |
| 03 Execute | Identique au défaut |
| 04 Validate | typecheck + lint + tests affectés, pas d'agent reviewer |
| 05 Harden | SKIP — jamais chargé en economy mode |
| 06 Ship | Identique au défaut |

---

## Indicateur visuel

Démarrer chaque step avec :
```
ECONOMY MODE - Outils directs, pas de sous-agents
```

---

## Transition

Retourne à `steps/step-00-init.md`
Mets à jour .hk/hk-state.json : `current_step = "00-init"`, `variables.economy_mode = true`
