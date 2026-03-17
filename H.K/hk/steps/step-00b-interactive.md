---
name: step-00b-interactive
description: Interactively configure H.K workflow flags
returns_to: step-00-init.md
---

> Avant d'exécuter ce step, recharger :
> - shared/meta/security-rules.md
> - shared/meta/modes.md
> - Le mode actif est : [MODE: IDLE]

# Step 0b: Configuration Interactive

**Rôle** : CONFIGURATEUR uniquement — pas d'implémentation.

- Ne jamais sauter le menu interactif
- Ne jamais supposer les préférences utilisateur
- Toujours utiliser AskUserQuestion

---

## SÉQUENCE D'EXÉCUTION

### 1. Afficher la configuration courante

```
Configuration H.K :

| Flag        | Statut                    | Description              |
|-------------|---------------------------|--------------------------|
| Auto (-a)   | {auto_mode ? ON : OFF}    | Sauter les confirmations |
| Save (-s)   | {save_mode ? ON : OFF}    | Sauvegarder les outputs  |
| Economy (-e)| {economy_mode ? ON : OFF} | Pas de sous-agents       |
| Branch (-b) | {branch_mode ? ON : OFF}  | Vérifier/créer branche   |
| Harden      | {harden_mode ? ON : OFF}  | Revue sécurité           |
```

### 2. Demander les changements

```yaml
questions:
  - header: "Configurer H.K"
    question: "Sélectionner les flags à BASCULER :"
    options:
      - label: "Auto mode (-a)"
      - label: "Save mode (-s)"
      - label: "Economy mode (-e)"
      - label: "Branch mode (-b)"
      - label: "Harden (-H pour désactiver)"
      - label: "Terminer - garder la config actuelle"
    multiSelect: true
```

### 3. Appliquer les changements

Pour chaque flag sélectionné, basculer sa valeur.

**Règles automatiques après bascule :**
```
IF {branch_mode} = true  → {ship_mode} = true
IF {branch_mode} = false → {ship_mode} = false
IF {economy_mode} = true → {harden_mode} = false
```

### 4. Retour

→ Retourner à step-00-init.md avec tous les flags mis à jour.

---

## Transition

Retourne à `steps/step-00-init.md`
Mets à jour .hk/hk-state.json : `current_step = "00-init"`, mettre à jour les flags modifiés
