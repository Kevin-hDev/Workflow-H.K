---
name: step-02-plan
description: Strategic planning - create detailed file-by-file implementation strategy
prev_step: steps/step-01-analyze.md
next_step: steps/step-03-execute.md
---

> Avant d'exécuter ce step, recharger :
> - shared/meta/security-rules.md
> - shared/meta/modes.md
> - Le mode actif est : [MODE: PLAN]

**Permissions du mode PLAN** :
- AUTORISÉ : lire fichiers, rédiger le plan dans .hk/hk-state.json, créer/modifier fichiers de plan (*.plan.md)
- INTERDIT : modifier des fichiers source du projet, commandes système, git

# Step 2: Plan (Conception stratégique)

**Rôle** : PLANIFICATEUR uniquement — pas d'implémentation.

- Ne jamais commencer à implémenter
- Ne jamais écrire ou modifier du code
- Toujours structurer le plan par FICHIER, pas par feature
- INTERDIT d'utiliser les outils Edit, Write, ou Bash

---

## Adaptation par niveau

| Niveau | Comportement |
|--------|-------------|
| L1 | SKIP ENTIER — pas de plan formel, pas d'AC formels |
| L2 | ALLÉGÉ — liste de fichiers sans détails, max 5 AC, max 1 mission |
| L3 | COMPLET — plan détaillé, max 8 AC, max 3 missions, marquage P#/S pour waves |
| L4 | MAXIMUM — plan détaillé + phase CREATIVE obligatoire, max 12 AC, Five-Persona pré-review |

Lire `complexity_level` dans .hk/hk-state.json. Limites détaillées : `shared/meta/complexity-levels.md`.

**Bornes de taille** (si dépassées → découper en quests indépendantes, proposer l'ordre) :

| Niveau | Max fichiers | Max AC | Max missions |
|--------|-------------|--------|-------------|
| L1 | 3 | 0 | 0 |
| L2 | 7 | 5 | 1 |
| L3 | 15 | 8 | 3 |
| L4 | 30 | 12 | 5 |
---

## SÉQUENCE D'EXÉCUTION

### 1. ULTRA THINK : Concevoir la stratégie complète

**Simulation mentale avant d'écrire quoi que ce soit :**
- Parcourir l'implémentation étape par étape
- Identifier tous les fichiers à modifier
- Déterminer l'ordre logique (dépendances en premier)
- Considérer les cas limites et la gestion d'erreurs
- Planifier la couverture de tests

### 2. Clarifier les ambiguïtés

**Si `{auto_mode}` = true :** utiliser l'option recommandée automatiquement

**Si `{auto_mode}` = false et plusieurs approches valides :**

```yaml
questions:
  - header: "Approche"
    question: "Plusieurs approches possibles. Laquelle utiliser ?"
    options:
      - label: "Approche A (Recommandée)"
        description: "Description et compromis de A"
      - label: "Approche B"
        description: "Description et compromis de B"
    multiSelect: false
```

### 3. Créer le plan détaillé

**Structure par FICHIER :**

```markdown
## Plan d'implémentation : {task_description}

### Vue d'ensemble
[1-2 phrases : stratégie et approche]

---

### Modifications de fichiers

#### `src/path/fichier1.ts` [P1]
- Ajouter `nomFonction` qui gère X
- Gérer le cas d'erreur : [scénario spécifique]

#### `src/path/fichier2.ts` (NOUVEAU FICHIER) [P2]
- Créer l'utilitaire pour Z
- Exporter : `utilFonction`, `TypeHelper`

---

### Stratégie de tests
- `src/path/fichier1.test.ts` — cas nominal + cas d'erreur

---

### Mapping critères d'acceptation
- [ ] AC1 : Satisfait par les changements dans `fichier1.ts`
- [ ] AC2 : Satisfait par les changements dans `fichier2.ts`
```

**Marquage des fichiers (L3/L4 uniquement) :**
- `[P1]` = Wave 1 (indépendant)
- `[P2]` = Wave 2 (dépend de P1)
- `[S]` = Séquentiel (intégration finale)

---

## Marquage Wave (P#/S)

Pour chaque fichier dans le plan, ajouter un tag de wave :

```
- [P1] fichier.rs    — indépendant, première wave parallèle
- [P1] fichier2.rs   — indépendant, première wave parallèle
- [P2] fichier3.rs   — dépend de P1, deuxième wave parallèle
- [S]  fichier4.rs   — séquentiel obligatoire (intégration, main, etc.)
```

Règles de marquage :
- P1 = fichiers sans dépendance entre eux
- P2 = fichiers qui dépendent de résultats P1
- P3+ si nécessaire
- S = séquentiel, ne peut PAS être parallélisé (imports croisés, fichier central)
- Max 5 fichiers par wave (sinon découper la wave)

Application par niveau :
- L1 : pas de marquage (max 3 fichiers, séquentiel)
- L2 : marquage simplifié (P1 et S seulement)
- L3-L4 : marquage complet (P1, P2, P3+, S)

### 4. Présenter le plan pour approbation

**Si `{auto_mode}` = true :** passer directement à l'exécution

**Si `{auto_mode}` = false :**

```yaml
questions:
  - header: "Plan"
    question: "Revoir le plan. Prêt à procéder ?"
    options:
      - label: "Approuver et exécuter (Recommandé)"
      - label: "Ajuster le plan"
      - label: "Poser des questions"
    multiSelect: false
```

Verrouiller le hash du plan dans .hk/hk-state.json après approbation.

---

## ConfidenceCheck pré-exécution

> Exécuter APRÈS la rédaction du plan, AVANT la transition vers EXECUTE.
> Spec complète (critères détaillés, exemples, template) : `shared/meta/confidence-checker.md`.

### Quand l'exécuter

| Niveau | Application |
|--------|-------------|
| **L1** | SKIP — tâche triviale, score implicitement >= 0.95 |
| **L2** | ALLÉGÉ — 3 critères : `understanding`, `plan_completeness`, `risk_awareness` |
| **L3** | COMPLET — 5 critères |
| **L4** | COMPLET — 5 critères + justification écrite obligatoire |

Seuils numériques : voir `shared/meta/complexity-levels.md` (CONFIDENCE_THRESHOLD_EXECUTE).

### Les 5 critères (L3-L4) / 3 critères (L2)

```
1. understanding      — Ai-je compris la tâche (y compris les cas limites) ?
2. plan_completeness  — Le plan couvre-t-il tous les fichiers et cas à traiter ?
3. codebase_knowledge — Ai-je lu et compris les fichiers que je vais modifier ?  [L3-L4 seulement]
4. risk_awareness     — Ai-je identifié ce qui pourrait mal tourner ?
5. test_strategy      — Sais-je comment vérifier que c'est correct après ?       [L3-L4 seulement]
```

### Scoring et décision

```
L3-L4 : overall = (understanding + plan_completeness + codebase_knowledge
                   + risk_awareness + test_strategy) / 5
L2    : overall = (understanding + plan_completeness + risk_awareness) / 3

>= 0.90 → PROCEED  — passer à Execute
0.70-0.89 → RETRY  — améliorer les critères faibles, max 1 retry
< 0.70  → STOP     — demander clarification à l'utilisateur
```

Après retry unique : si overall < 0.90 → STOP obligatoire. Fail CLOSED.

### Enregistrement dans .hk/hk-state.json

```json
{
  "confidence": {
    "pre_execute": 0.92,
    "_detail": {
      "scores": {
        "understanding": 0.0,
        "plan_completeness": 0.0,
        "codebase_knowledge": 0.0,
        "risk_awareness": 0.0,
        "test_strategy": 0.0
      },
      "decision": "PROCEED",
      "retry_count": 0
    }
  }
}
```

---

## Transition

**Conditions de sortie** :
1. ☐ Déclaration explicite : [TRANSITIONING: PLAN → ...]
2. ☐ Outputs requis présents : plan rédigé, AC listés, hash verrouillé dans .hk/hk-state.json
3. ☐ .hk/hk-state.json mis à jour (current_step, current_mode)
4. ☐ ConfidenceCheck >= 0.90 — exécuter la section `## ConfidenceCheck pré-exécution` ci-dessus,
   écrire `confidence.pre_execute` dans .hk/hk-state.json, décision = PROCEED obligatoire pour continuer.

**Routing conditionnel** :

```
SI variables.design_mode = true
   OU (fichiers frontend détectés ET complexity_level >= L3)
   OU complexity_level = L4 :
  → [TRANSITIONING: PLAN → CREATIVE]
  → Charge steps/step-02b-design.md
  → current_mode = "CREATIVE"
SINON :
  → [TRANSITIONING: PLAN → EXECUTE]
  → Charge steps/step-03-execute.md
  → current_mode = "EXECUTE"
```

Mets à jour .hk/hk-state.json : `current_step = "02b-design" ou "03-execute"`, `current_mode = "CREATIVE" ou "EXECUTE"`, `plan.hash = "{hash}"`, `plan.files_remaining = [{liste}]`
