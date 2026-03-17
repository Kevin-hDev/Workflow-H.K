# SelfCheckProtocol — Vérification post-implémentation

> Exécuter APRÈS step-03 Execute, AVANT de passer à Validate/Harden.
> Taux d'anti-hallucination démontré : 94% (vs auto-évaluation sans preuves).
> La clé : chaque réponse exige une PREUVE concrète, pas une opinion.

---

## Différence avec l'Ascent loop

| | SelfCheckProtocol | Ascent loop |
|---|---|---|
| **Quand** | Post-implémentation globale | Pendant l'implémentation, par wave |
| **Portée** | Vérification GLOBALE de tout le travail | Vérification LOCALE après chaque wave |
| **Objectif** | Valider que tout est correct avant de passer | Attraper les erreurs tôt, corriger vite |
| **Exécuteur** | Agent séparé en L3-L4 | Même agent en L1-L4 |

Les deux sont complémentaires : Ascent attrape les erreurs au fil de
l'eau, SelfCheck valide l'ensemble une fois terminé.

---

## Quand appliquer

| Niveau | Application |
|--------|-------------|
| **L1** | Skip — validation inline suffisante |
| **L2** | Même agent, 4 questions simplifiées (sans agent séparé) |
| **L3** | **Agent validateur séparé** (pas le même qui a codé) |
| **L4** | **Agent validateur séparé** + justification écrite obligatoire |

**Pourquoi un agent séparé en L3-L4 ?** Éliminer le biais de confirmation.
L'agent qui a codé a tendance à déclarer que son code passe tous les checks.
Un agent différent, sans contexte émotionnel sur le code, est plus rigoureux.

---

## Les 4 questions avec preuves obligatoires

### Question 1 — Les tests passent-ils ?

**Preuve requise :** Output complet de la commande de test.

```
Q1 : Les tests passent-ils ?
Preuve : [coller l'output exact de la commande]
  cargo test 2>&1 | tail -20
  →  test result: ok. 47 passed; 0 failed; 0 ignored
Réponse : OUI ✓ / NON ✗
```

**Si NON :** Identifier les tests en échec, corriger, relancer. Ne pas
passer à la question 2 avant que Q1 soit OUI.

### Question 2 — Tous les requirements/AC sont-ils couverts ?

**Preuve requise :** Mapping explicite AC → code.

```
Q2 : Tous les AC sont-ils couverts ?
Preuve :
  AC-1 "Validation email obligatoire" → src/auth/validator.rs:42 fn validate_email()
  AC-2 "Message d'erreur en français" → src/auth/errors.rs:18 EMAIL_INVALID_FR
  AC-3 "Test de régression" → tests/auth_test.rs:89 test_email_validation
Réponse : OUI ✓ / NON ✗ (AC-X non couvert)
```

**Si NON :** Identifier l'AC manquant, implémenter, revenir à Q1.

### Question 3 — Y a-t-il des assumptions non vérifiées ?

**Preuve requise :** Liste explicite des hypothèses faites pendant l'implémentation.

```
Q3 : Y a-t-il des assumptions non vérifiées ?
Preuve — Hypothèses faites :
  H1 : "L'email est toujours en minuscules" → VÉRIFIÉE (src/auth/mod.rs:12 .to_lowercase())
  H2 : "Le champ email a une longueur max de 254" → VÉRIFIÉE (RFC 5321)
  H3 : "Les doublons sont gérés par la DB" → NON VÉRIFIÉE — à risque
Réponse : OUI (hypothèses non vérifiées) / NON (tout vérifié)
```

**Si OUI (hypothèses non vérifiées) :** Vérifier ou implémenter une
protection explicite pour chaque hypothèse non vérifiée.

### Question 4 — Ai-je des preuves concrètes, pas des spéculations ?

**Preuve requise :** Diff et/ou output de commande.

```
Q4 : Ai-je des preuves concrètes ?
Preuve :
  - Diff des fichiers modifiés : [coller git diff --stat]
  - Output lint : cargo clippy → 0 warnings
  - Output typecheck (si applicable) : tsc --noEmit → 0 errors
Réponse : OUI ✓ / NON ✗
```

**Si NON :** Exécuter les commandes manquantes et collecter les outputs.

---

## Scoring

| Score | Résultat | Action suivante |
|-------|----------|-----------------|
| 4/4 OUI | **PASS** | Passer à Validate (step-04) |
| 3/4 OUI | **WARNING** | Corriger la question en échec, puis PASS |
| 2/4 OUI ou moins | **FAIL** | Retour à Execute (step-03), retravailler |

**Règle FAIL :** Ne jamais ignorer un FAIL. Ne jamais marquer PASS avec
une question en échec "parce que c'est mineur". Fail CLOSED.

---

## Template à remplir (agent validateur)

```
## SelfCheckProtocol — [Nom de la tâche]

Niveau : L[2-4]
Agent validateur : [même agent / agent séparé]

---

### Q1 — Tests
Commande : [commande exacte]
Output :
[coller l'output]
Résultat : OUI ✓ / NON ✗

---

### Q2 — Couverture AC
| AC | Description | Implémenté dans | Ligne |
|----|-------------|-----------------|-------|
| AC-1 | ... | fichier.rs | L42 |
| AC-2 | ... | fichier.rs | L87 |
Résultat : OUI ✓ / NON ✗ — [AC manquant si NON]

---

### Q3 — Assumptions
| Hypothèse | Vérifiée ? | Preuve/Mitigation |
|-----------|-----------|-------------------|
| H1 : ... | OUI | ... |
| H2 : ... | NON | RISQUE — à adresser |
Résultat : OUI (risques) ✗ / NON (tout OK) ✓

---

### Q4 — Preuves concrètes
- git diff --stat : [output]
- lint : [output]
- typecheck : [output ou N/A]
Résultat : OUI ✓ / NON ✗

---

### Score final : [X]/4 — PASS / WARNING / FAIL

[Si WARNING ou FAIL] Actions correctives :
1. ...
2. ...
```

---

## Enregistrement dans le checkpoint

Le résultat du SelfCheck doit être écrit dans `.hk/hk-state.json`.
Champs conformes au schema `shared/schemas/checkpoint.schema.json` :

```json
{
  "confidence": {
    "self_check_score": 4,
    "post_validate": 0.94,
    "_detail": {
      "q1_tests": true,
      "q2_ac_coverage": true,
      "q3_no_unverified_assumptions": true,
      "q4_concrete_proof": true,
      "result": "PASS",
      "validator_agent": "separate"
    }
  }
}
```

- `self_check_score` : entier 0-4 (nombre de questions OUI)
- `post_validate` : score overall 0.0-1.0 issu du ConfidenceCheck post-Validate
- `_detail` : données supplémentaires non normatives (pour debug/audit)
