---
name: step-00-init
description: Initialise le workflow H.K — parse les flags, détecte la complexité L1-L4, crée hk-state.json
next_step: steps/step-01-analyze.md
---

> Avant d'exécuter ce step, recharger :
> - shared/meta/security-rules.md
> - shared/meta/modes.md
> - shared/meta/complexity-levels.md
> - Le mode actif est : [MODE: IDLE]

# Step 00 : Initialisation

**Rôle** : INITIALIZER — setup uniquement, zéro analyse, zéro exécution.
**Mode** : IDLE → seule l'écriture de hk-state.json est autorisée.

---

## SÉQUENCE D'EXÉCUTION

### 1. Parser les flags

Défauts :

```
auto_mode      = false   # -a  : sauter les confirmations
economy_mode   = false   # -e  : 0 sous-agent, économie tokens
branch_mode    = false   # -b  : vérifier/créer une branche git
harden_mode    = true    # -H  : désactiver (ignoré si risk MEDIUM/HIGH)
ship_mode      = true    # -S  : désactiver le ship (commit/PR) en fin de workflow
save_mode      = false   # -s  : sauvegarder les artefacts (plan, analysis) dans .hk/
forced_level   = null    # -l  : forcer un niveau de complexité
```

Flags utilisateur :

```
-a / --auto          → auto_mode = true
-e / --economy       → economy_mode = true
-b / --branch        → branch_mode = true
-H / --no-harden     → harden_mode = false
-S / --no-ship       → ship_mode = false
-s / --save          → save_mode = true
-l / --level {L1|L2|L3|L4} → forced_level = {value}
-i / --interactive   → charger step-00b-interactive.md
-r / --resume {id}   → resume_task = {id}
Reste de l'input     → task_description
```

Règles automatiques :
- economy_mode = true → harden_mode = false
- branch_mode = true  → charger step-00b-branch.md

Générer `task_id` : format `NN-kebab-case-description` (NN = prochain numéro disponible).

### 2. Mode resume (-r flag)

**Uniquement si `-r {task_id}` présent.**

```
1. Lire .hk/hk-state.json à la racine du projet cible
2. Vérifier intégrité (hk-checkpoint-guide.md — section Vérification)
3. Si OK → re-hydrater variables, reprendre au current_step/current_substep
4. Si KO → STOP, informer l'utilisateur, ne pas continuer
```

Si `-r` absent → passer directement à l'étape 4.

### 3. Lecture du contexte projet

```
Si .hk/project-context.md existe → le lire pour informer l'analyse (technos, architecture, conventions).
Sinon → suggérer de lancer /hk-context pour le générer avant la première mission.
```

### 4. Lecture des learnings (si .hk/learnings.md existe)

```
1. Lire .hk/learnings.md à la racine du projet cible
2. Filtrer les 5 derniers learnings pertinents (par domaine/catégorie)
3. Les garder en mémoire pour informer l'analyse (step-01)
Si le fichier n'existe pas → skip, c'est le premier run.
```

### 5. Sub-steps optionnels

```
IF interactive_mode  → charger step-00b-interactive.md
IF branch_mode       → charger step-00b-branch.md (définit branch_name)
IF economy_mode      → charger step-00b-economy.md
TOUJOURS             → charger step-00b-build.md (détecte build systems)
```

### 6. Détection du niveau de complexité

Référence : `shared/meta/complexity-levels.md` pour les seuils exacts.
**Ignorer cette section si** `-r` (resume) est présent — niveau déjà dans hk-state.json.

#### 6a. Analyser la description de la tâche

```
mots-clés scope large  : "refactoring", "architecture", "migration"  → +2 niveaux
domaine sensible       : "auth", "payment", "crypto", "pii"          → minimum L3
mots-clés simples      : "fix", "typo", "rename", "update"           → suggère L1
```

#### 6b. Scanner le codebase (si pas economy_mode)

Lancer 1 sous-agent Haiku pour :
- Estimer le nombre de fichiers potentiellement impactés
- Détecter les domaines touchés (auth/, payments/, etc.)

Si economy_mode = true → estimer depuis la description seule, sans sous-agent.

#### 6c. Appliquer les seuils (depuis complexity-levels.md)

```
L1 : ≤ L1_MAX_FILES (3),  fix clair, pas de nouveau module, domaine non sensible
L2 : 4-L2_MAX_FILES (7),  feature simple, 1 domaine
L3 : 8-L3_MAX_FILES (15), feature complète, 2+ domaines OU domaine sensible
L4 : ≥ L4_MIN_FILES (16), cross-cutting, changement architectural
```

Règle absolue : domaine sensible (auth/payment/crypto/pii) → niveau minimum L3.

#### 6d. Proposer le niveau avec justification

```
Niveau détecté : L2 (5 fichiers estimés, 1 domaine, feature simple)
Pour forcer un autre niveau : --level L3
```

- Si `forced_level` présent → utiliser la valeur forcée, noter dans `meta.level_override`
- Si `auto_mode = true` → appliquer sans confirmation
- Sinon → attendre confirmation utilisateur avant de continuer

#### 6e. Note sur l'escalade

L'escalade dynamique est gérée dans les steps 01-03 (pas ici).
Si l'analyse (step-01) révèle plus de complexité que estimée → step-01 propose l'escalade.

### 7. Créer .hk/hk-state.json (écriture atomique)

```
0. Créer le dossier .hk/ s'il n'existe pas (mkdir -p .hk/)
1. Construire le JSON complet en mémoire
2. Écrire dans  .hk/.hk-state.tmp
3. Renommer en  .hk/hk-state.json
4. Supprimer    .hk/.hk-state.tmp si rename échoue
5. Ajouter dans .gitignore (si .gitignore existe) : .hk/hk-state.json
   → NE PAS ignorer : .hk/learnings.md, .hk/project-context.md, .hk/project-monitoring.md
```

Structure initiale :

```json
{
  "schema_version": "1.0",
  "checkpoint_version": 1,
  "workflow": "H.K",
  "task_id": "{task_id}",
  "current_step": "00-init",
  "current_substep": 0,
  "total_substeps": 0,
  "current_mode": "IDLE",
  "complexity_level": "{niveau_détecté}",
  "started_at": "{ISO 8601}",
  "last_checkpoint": "{ISO 8601}",
  "variables": {
    "auto_mode": false,
    "economy_mode": false,
    "harden_mode": true,
    "ship_mode": true,
    "save_mode": false,
    "branch_mode": false,
    "design_mode": false,
    "build_systems": []
  },
  "plan": {
    "hash": null,
    "total_files": 0,
    "files_completed": [],
    "files_remaining": [],
    "missions": []
  },
  "confidence": {
    "pre_execute": null,
    "post_validate": null,
    "self_check_score": null
  },
  "security": {
    "risk_level": "LOW",
    "harden_required": false,
    "threat_model_done": false
  },
  "traceability": {},
  "meta": {
    "rules_hash": null,
    "created_by": "H.K v2.0",
    "level_override": null
  }
}
```

`complexity_level` = niveau détecté à l'étape 4 (L1/L2/L3/L4).
`meta.level_override` = valeur de `--level` si flag utilisé, sinon null.

### 8. Afficher résumé et continuer

```
H.K: {task_description}

| Variable         | Valeur            |
|------------------|-------------------|
| task_id          | {task_id}         |
| complexity_level | L{N}              |
| auto_mode        | true/false        |
| economy_mode     | true/false        |
| branch_mode      | true/false        |
| harden_mode      | true/false        |
| ship_mode        | true/false        |
| save_mode        | true/false        |
| build_systems    | [cargo, npm, ...] |

→ Analyse en cours...
```

Zéro log de parsing. Passer immédiatement à la transition ci-dessous.

---

## Transition

### Routing par niveau de complexité

```
SI complexity_level = L1 :
  → sauter step-01-analyze ET step-02-plan
  → charger directement steps/step-03-execute.md
  → Mettre à jour .hk/hk-state.json : current_step = "03-execute", current_mode = "EXECUTE"

SI complexity_level = L2, L3 ou L4 :
  → charger steps/step-01-analyze.md
  → Mettre à jour .hk/hk-state.json : current_step = "01-analyze", current_mode = "ANALYZE"
```

**Rappel L1** : même en mode EXECUTE direct, si `risk_level` devient MEDIUM/HIGH pendant
l'exécution → STOP, proposer escalade vers L2 minimum, réactiver `harden_mode`.
