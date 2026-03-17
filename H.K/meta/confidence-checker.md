# ConfidenceChecker — Vérification pré-exécution

> Exécuter AVANT step-03 Execute (ou avant toute action majeure irréversible).
> ROI démontré : 100-200 tokens ici évitent 5 000-50 000 tokens dans la
> mauvaise direction.

---

## Quand appliquer

| Niveau | Application |
|--------|-------------|
| **L1** | Skip — la tâche est triviale, le score serait toujours ≥ 0.95 |
| **L2** | Allégé — 3 critères seulement (understanding, plan_completeness, risk_awareness) |
| **L3** | Complet — 5 critères |
| **L4** | Complet — 5 critères + justification écrite obligatoire |

---

## Les 5 critères (L3-L4)

### 1. `understanding` — Compréhension de la tâche
**Question :** Ai-je compris ce qui est demandé, y compris les cas limites ?

| Score | Signification |
|-------|---------------|
| 1.0 | Exigences claires, cas limites identifiés, pas d'ambiguïté |
| 0.8 | Exigences claires mais 1-2 cas limites incertains |
| 0.6 | Compréhension partielle, hypothèses nécessaires |
| 0.4 | Ambiguïtés majeures non résolues |
| 0.0 | Tâche incompréhensible |

### 2. `plan_completeness` — Complétude du plan
**Question :** Le plan couvre-t-il tous les fichiers et cas à traiter ?

| Score | Signification |
|-------|---------------|
| 1.0 | Tous les fichiers listés, séquence claire, dépendances identifiées |
| 0.8 | Plan complet avec 1-2 incertitudes mineures |
| 0.6 | Plan partiel, certains fichiers/cas non encore identifiés |
| 0.4 | Plan fragmentaire, beaucoup d'inconnues |
| 0.0 | Pas de plan |

### 3. `codebase_knowledge` — Connaissance du code existant
**Question :** Ai-je lu et compris les fichiers que je vais modifier ?

| Score | Signification |
|-------|---------------|
| 1.0 | Tous les fichiers cibles lus, patterns compris, dépendances connues |
| 0.8 | Fichiers principaux lus, quelques dépendances indirectes non explorées |
| 0.6 | Lecture partielle, some fichiers pas encore vus |
| 0.4 | Connaissance superficielle |
| 0.0 | Aucune lecture du code existant |

### 4. `risk_awareness` — Conscience des risques
**Question :** Ai-je identifié ce qui pourrait mal tourner ?

| Score | Signification |
|-------|---------------|
| 1.0 | Risques identifiés (breaking changes, régressions, sécurité), mitigations prévues |
| 0.8 | Risques principaux identifiés, mitigations partielles |
| 0.6 | Quelques risques identifiés, d'autres probablement ignorés |
| 0.4 | Conscience des risques faible |
| 0.0 | Aucune analyse de risque |

### 5. `test_strategy` — Stratégie de vérification
**Question :** Sais-je comment vérifier que c'est correct après ?

| Score | Signification |
|-------|---------------|
| 1.0 | Commandes de test connues, critères de succès définis, AC mappés |
| 0.8 | Tests principaux identifiés, quelques AC non encore mappés |
| 0.6 | Stratégie vague, "ça devrait passer les tests" |
| 0.4 | Pas de plan de vérification clair |
| 0.0 | Aucune stratégie de test |

---

## Calcul du score global

### L3-L4 (5 critères, pondération égale)
```
overall = (understanding + plan_completeness + codebase_knowledge
           + risk_awareness + test_strategy) / 5
```

### L2 (3 critères)
```
overall = (understanding + plan_completeness + risk_awareness) / 3
```

---

## Seuils de décision

| Score | Décision | Action |
|-------|----------|--------|
| ≥ 0.90 | **PROCEED** | Passer à Execute |
| 0.70 — 0.89 | **RETRY** | Améliorer les critères faibles, max 1 retry |
| < 0.70 | **STOP** | Demander clarification à l'utilisateur |

**Règle du retry :** Identifier les critères avec score < 0.80, prendre
les actions correctives (lire des fichiers, relire les exigences, analyser
les dépendances), puis recalculer UNE seule fois. Si le score reste < 0.90
après le retry → STOP.

---

## Template de scoring (à remplir par l'agent)

```
## ConfidenceCheck — [Nom de la tâche]

Niveau : L[1-4]

| Critère              | Score | Justification                          |
|----------------------|-------|----------------------------------------|
| understanding        | 0.X   | [1 phrase de justification]            |
| plan_completeness    | 0.X   | [1 phrase de justification]            |
| codebase_knowledge   | 0.X   | [1 phrase de justification]            |
| risk_awareness       | 0.X   | [1 phrase de justification]            |
| test_strategy        | 0.X   | [1 phrase de justification]            |
| **overall**          | **0.X** |                                      |

Décision : PROCEED / RETRY / STOP

[Si RETRY] Critères faibles : [liste]
[Si RETRY] Actions correctives : [liste]
[Si STOP] Clarification demandée : [question précise]
```

---

## Exemples concrets

### Exemple PROCEED (overall = 0.92)
```
| understanding        | 0.95 | Tâche claire : ajouter validation email dans le form signup |
| plan_completeness    | 0.90 | 3 fichiers identifiés, séquence claire                     |
| codebase_knowledge   | 0.95 | form.rs et validator.rs lus                                |
| risk_awareness       | 0.85 | 1 risque : breaking change sur l'API validate()            |
| test_strategy        | 0.95 | cargo test auth::signup — 12 tests existants               |
| overall              | 0.92 |                                                             |
Décision : PROCEED
```

### Exemple STOP (overall = 0.58)
```
| understanding        | 0.60 | "Refactorer le module auth" — scope imprécis               |
| plan_completeness    | 0.40 | Nombre de fichiers inconnu, pas de liste                   |
| codebase_knowledge   | 0.70 | auth/mod.rs lu, mais pas les 6 sous-modules                |
| risk_awareness       | 0.50 | Risques de régression non évalués                          |
| test_strategy        | 0.70 | Tests existants connus, mais pas les AC du refactor        |
| overall              | 0.58 |                                                             |
Décision : STOP
Clarification demandée : "Quels fichiers spécifiques du module auth sont
concernés par le refactor, et quel est le résultat attendu ?"
```

---

## Enregistrement dans le checkpoint

Le résultat du ConfidenceCheck doit être écrit dans `.hk/hk-state.json`.
Champs conformes au schema `shared/schemas/checkpoint.schema.json` :

```json
{
  "confidence": {
    "pre_execute": 0.92,
    "post_validate": null,
    "self_check_score": null,
    "_detail": {
      "scores": {
        "understanding": 0.95,
        "plan_completeness": 0.90,
        "codebase_knowledge": 0.95,
        "risk_awareness": 0.85,
        "test_strategy": 0.95
      },
      "decision": "PROCEED",
      "retry_count": 0
    }
  }
}
```

- `pre_execute` : score overall 0.0-1.0, rempli avant Execute
- `post_validate` : score overall 0.0-1.0, rempli après Validate (null jusqu'à cette étape)
- `self_check_score` : entier 0-4, rempli par le SelfCheckProtocol
