---
name: hk
description: Workflow structuré H.K — Analyze-Plan-Execute-Validate-Harden-Ship avec state machine JSON, niveaux adaptatifs L1-L4, et quality gates quantitatifs.
argument-hint: "[-a] [-s] [-e] [-b] [-i] [-H] [-r <task-id>] [-l L1|L2|L3|L4] <description de la tâche>"
---

<objective>
Exécuter des workflows d'implémentation structurés avec la méthodologie H.K. Chaque step charge ses règles depuis les fichiers partagés (Hierarchical Rule Loading) pour rester opérationnel après context compaction.
</objective>

<quick_start>

```bash
/hk ajouter un système de logging
/hk -a -s implémenter l'auth
/hk -l L1 corriger le typo
/hk -r T-042
```

</quick_start>

<hierarchical_loading>

## Séquence de chargement (Hierarchical Rule Loading)

À CHAQUE transition de step, charger dans cet ordre :
1. `shared/meta/` — règles universelles (sécurité, structure, modes)
2. `H.K/meta/` — spécialisations H.K (workflow, checkpoint, délégation)
3. `steps/step-XX.md` — instructions uniques du step courant

Séquence complète détaillée : `H.K/meta/hk-rules-loader.md`

**ERREUR FATALE : NE JAMAIS charger les règles une seule fois au début.**
Après context compaction, les règles sont PERDUES.
Chaque step DOIT recharger ses règles au début de son exécution.

</hierarchical_loading>

<state_machine>

L'état du workflow est persisté dans `.hk/hk-state.json` (dans le dossier du projet).

Structure : voir `shared/schemas/checkpoint.schema.json`

Champs clés :
- `current_step` — step en cours d'exécution
- `current_mode` — mode actif (IDLE/ANALYZE/PLAN/EXECUTE/VALIDATE/HARDEN/SHIP)
- `complexity_level` — niveau L1-L4 (détermine la cérémonie)
- `security.risk_level` — LOW/MEDIUM/HIGH (détermine les gates)

</state_machine>

<workflow>

Pipeline H.K (détails dans `H.K/meta/hk-workflow.md`) :

```
00-init → 01-analyze → 02-plan → [02b-design] → 03-execute → 04-validate → [05-harden] → 06-ship
```

Règles de skip par niveau :
- **L1** : Execute + Validate inline (fix rapide)
- **L2** : Analyze + Plan + Execute + Validate
- **L3** : Pipeline complet sauf creative
- **L4** : Pipeline complet (creative obligatoire)

Règle absolue : si `risk_level = MEDIUM` ou `HIGH`, step-05-harden est obligatoire même en L1.

</workflow>

<flags>

**Activer (minuscules) :**

| Flag | Long | Description |
|------|------|-------------|
| `-a` | `--auto` | Mode autonome : sauter les confirmations |
| `-s` | `--save` | Sauvegarder les outputs dans `.claude/output/hk/` |
| `-e` | `--economy` | Mode économie : outils directs, pas de sous-agents |
| `-r` | `--resume` | Reprendre une tâche précédente |
| `-b` | `--branch` | Vérifier la branche, créer si sur main |
| `-i` | `--interactive` | Configurer les flags via AskUserQuestion |
| `-l` | `--level` | Forcer le niveau L1/L2/L3/L4 |

| `-d` | `--design` | Forcer la phase Design (step-02b) |

**Désactiver (majuscules) :**

| Flag | Long | Description |
|------|------|-------------|
| `-A` | `--no-auto` | Désactiver le mode auto |
| `-S` | `--no-save` | Désactiver la sauvegarde |
| `-E` | `--no-economy` | Désactiver le mode économie |
| `-B` | `--no-branch` | Désactiver le mode branche |
| `-H` | `--no-harden` | Désactiver la revue sécurité |

</flags>

<slash_commands>

## Commandes dérivées

| Commande | Description |
|----------|-------------|
| `/hk` | Workflow complet |
| `/hk-dev` | Alias autonome (`/hk -a -s`) |
| `/hk-brainstorm` | Analyse sans exécution |
| `/hk-design` | Force la phase Design |
| `/hk-security` | Review sécurité forcée |
| `/hk-review` | Validation + sécurité sans implémentation |
| `/hk-prd` | Plan détaillé sans exécuter |
| `/hk-debug` | Debugging scientifique — 3 hypothèses, diagnostic différentiel |
| `/hk-context` | Génère/met à jour `.hk/project-context.md` |
| `/hk-monitoring` | Ajoute une entrée au journal `.hk/project-monitoring.md` |
| `/hk-help` | Aide complète |

</slash_commands>

<fatal_errors>

## 6 erreurs fatales à éviter

1. **Règles non rechargées** : les règles DOIVENT être rechargées à CHAQUE nouveau step (pas juste au début)
2. **Step non auto-suffisant** : chaque step doit fonctionner seul après context compaction
3. **Double source d'état** : un seul fichier JSON d'état (`.hk/hk-state.json`), pas de markdown
4. **Transitions implicites** : les transitions de modes doivent être explicites et loggées dans .hk/hk-state.json
5. **Tracking perdu** : le suivi des features est intégré dans le checkpoint, pas dans la mémoire de contexte
6. **Recherche web vague** : rechercher avec des sujets précis et ciblés, pas des questions génériques

</fatal_errors>

<entry_point>

**PREMIÈRE ACTION : Charger `steps/step-00-init.md`**

Step-00 gère :
- Parsing des flags et de la description de tâche
- Détection du système de build
- Création/chargement de .hk/hk-state.json
- Détermination du niveau de complexité L1-L4
- Initialisation de la state machine

</entry_point>
