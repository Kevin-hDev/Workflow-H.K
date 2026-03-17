---
name: step-06-ship
description: Commit changes and create PR using /commit and /create-pr skills
prev_step: steps/step-05-harden.md
next_step: null
load_condition: ship_mode = true
---

> Avant d'exécuter ce step, recharger :
> - shared/meta/security-rules.md
> - shared/meta/modes.md
> - Le mode actif est : [MODE: SHIP]

**Permissions du mode SHIP** :
- AUTORISÉ : opérations git (add, commit, push, PR), écrire .hk/learnings.md
- INTERDIT : modifier des fichiers source ou le plan

# Step 6: Ship (Commit + PR)

**Rôle** : SHIPPER uniquement.

- Ne jamais committer sans changements
- Ne jamais pousser directement sur main/master
- Toujours utiliser les skills /commit et /create-pr

---

## Adaptation par niveau

| Niveau | Comportement |
|--------|-------------|
| L1 | IDENTIQUE — commit/PR standard |
| L2 | IDENTIQUE — commit/PR standard |
| L3 | IDENTIQUE — commit/PR standard |
| L4 | IDENTIQUE + review summary obligatoire dans la description de la PR |

---

## SÉQUENCE D'EXÉCUTION

### 1. Vérifier que des changements existent

```bash
git status
```

**Si aucun changement :** afficher "Rien à shipper" et terminer.

**Si des changements existent :** continuer.

### 2. Committer les changements

```
/commit
```

### 3. Créer la Pull Request (si branch_mode)

**Si `{branch_mode}` = true :**

```
/create-pr
```

**L4 uniquement** : inclure une review summary dans la description de la PR (résumé des AC, sécurité, waves complétées).

**Si `{branch_mode}` = false mais `{ship_mode}` = true :**
→ Seulement committer, pas de PR.

### 4. Enregistrement des learnings

Écrire un entry dans `.hk/learnings.md` à la racine du projet cible (créer si n'existe pas) :

```markdown
---
date: {ISO 8601}
task: {task_id}
level: {complexity_level}
category: pattern | erreur | convention
---
{1-3 lignes : ce qui a été appris pendant ce run}
```

Catégories :
- `pattern` : pattern découvert dans le codebase
- `erreur` : erreur rencontrée et solution
- `convention` : convention de code identifiée

**Limite** : max 100 lignes dans `.hk/learnings.md` (FIFO : supprimer les plus anciens si dépassé).

**Consolidation** : après 10 runs, proposer : _"10 runs complétés. Consolider les learnings en conventions projet ?"_

### 5. Feedback (optionnel)

```
SI auto_mode = false :
  Afficher : "Run H.K terminé. Satisfaction ? (1-5, Entrée pour passer)"
  → Si répondu : enregistrer le score dans .hk/learnings.md avec le contexte du run
  → Si passé   : continuer sans enregistrer

SI auto_mode = true : skip le feedback.
```

### 6. Mise à jour monitoring

```
Si .hk/project-monitoring.md existe :
  → Lire uniquement les 10 dernières lignes du Journal (économie tokens)
  → Ajouter une ligne : | {date} | {task_description} | {complexity_level} | {nb fichiers} | fait |
Si .hk/project-monitoring.md n'existe pas :
  → Créer avec la structure de base (Roadmap + en-tête Journal) + cette première ligne
```

### 7. Nettoyage de l'état

```
Supprimer .hk/hk-state.json (run terminé, plus besoin de l'état temporaire)
→ NE PAS supprimer le dossier .hk/ ni .hk/learnings.md, .hk/project-context.md, .hk/project-monitoring.md
```

### 8. Résumé final H.K

```
Workflow H.K terminé

Tâche : {task_description}
Steps complétés :
  01 Analyze  - Contexte collecté
  02 Plan     - Implémentation conçue
  03 Execute  - Code écrit
  04 Validate - Tests passants
  05 Harden   - Sécurité vérifiée (si activé)
  06 Ship     - Committé + PR créée (si activé)

PR : {pr_url}
```

---

## Transition

**Conditions de sortie** :
1. ☐ Déclaration explicite : [TRANSITIONING: SHIP → IDLE]
2. ☐ Outputs requis présents : commit créé, PR créée (si branch_mode)
3. ☐ .hk/hk-state.json supprimé (run terminé)

Workflow terminé.
