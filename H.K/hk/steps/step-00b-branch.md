---
name: step-00b-branch
description: Verify and setup git branch for H.K workflow
returns_to: step-00-init.md
---

> Avant d'exécuter ce step, recharger :
> - shared/meta/security-rules.md
> - shared/meta/modes.md
> - Le mode actif est : [MODE: IDLE]

# Step 0b: Branch Setup

**Rôle** : BRANCH MANAGER uniquement — pas d'implémentation.

- Ne jamais committer sur main/master si branch_mode actif
- Toujours vérifier la branche courante en premier
- Stocker `{branch_name}` avant de retourner

---

## SÉQUENCE D'EXÉCUTION

### 1. Vérifier la branche courante

```bash
git branch --show-current
```

Stocker le résultat comme `{current_branch}`.

### 2. Évaluer le statut

**Si `{current_branch}` est `main` ou `master`** → aller à l'étape 3

**Si `{current_branch}` n'est PAS main/master :**
→ `{branch_name}` = `{current_branch}`
→ Afficher : "Branche courante : {branch_name}"
→ Retourner à step-00-init.md

### 3. Créer une branche feature

**Si `{auto_mode}` = true :** auto-créer `feat/{task_id}`

**Si `{auto_mode}` = false :** demander via AskUserQuestion :
```yaml
questions:
  - header: "Branch"
    question: "Vous êtes sur {current_branch}. Créer une nouvelle branche ?"
    options:
      - label: "Créer feat/{task_id} (Recommandé)"
        description: "Créer et basculer sur la nouvelle branche"
      - label: "Nom de branche personnalisé"
        description: "Je spécifie un nom personnalisé"
      - label: "Rester sur {current_branch}"
        description: "Continuer sans créer de branche"
    multiSelect: false
```

### 4. Exécuter la création

```bash
git checkout -b feat/{task_id}   # ou {custom_name}
```

**Si `{pr_mode}` = true et reste sur main :** afficher un avertissement.

### 5. Retour

→ Retourner à step-00-init.md avec `{branch_name}` défini.

---

## Transition

Retourne à `steps/step-00-init.md`
Mets à jour .hk/hk-state.json : `current_step = "00-init"`, `branch_name = "{branch_name}"`
