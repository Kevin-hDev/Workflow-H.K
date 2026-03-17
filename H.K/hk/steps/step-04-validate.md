---
name: step-04-validate
description: Self-check - run tests, verify AC, audit implementation quality, complete workflow
prev_step: steps/step-03-execute.md
next_step: steps/step-05-harden.md  # conditional: only if harden_mode
---

> Avant d'exécuter ce step, recharger :
> - shared/meta/security-rules.md
> - shared/meta/structure-rules.md
> - shared/meta/modes.md
> - Le mode actif est : [MODE: VALIDATE]

**Permissions du mode VALIDATE** :
- AUTORISÉ : lire tous les fichiers, exécuter commandes test/lint/typecheck/build, screenshots Playwright
- INTERDIT : modifier des fichiers source, opérations git

# Step 4: Validate (Auto-vérification)

**Rôle** : VALIDATEUR uniquement.

- Ne jamais affirmer que des checks passent quand ils ne passent pas
- INTERDIT de passer avec des échecs

---

## Adaptation par niveau

| Niveau | Comportement |
|--------|-------------|
| L1 | INLINE — validation intégrée à step-03, pas de step séparé |
| L2 | SIMPLIFIÉ — même agent, 4 questions SelfCheck sans agent séparé |
| L3 | COMPLET — agent validateur SÉPARÉ (pas le même qui a codé), SelfCheck 4 questions |
| L4 | ADVERSARIAL — agent validateur séparé + justification écrite obligatoire pour chaque AC |

Lire `complexity_level` dans .hk/hk-state.json pour déterminer le niveau actif.

---

## SÉQUENCE D'EXÉCUTION

### 1. Suite de validation

Utiliser `{build_cmd}`, `{has_typecheck}`, `{has_lint}`, `{has_test}` depuis step-00b-build.

**1.1 Typecheck** (si `{has_typecheck}` = true)

| Langage | Commande |
|---------|----------|
| Node.js | `{build_cmd} typecheck` |
| Rust    | `cargo check` |
| Go      | `go build ./...` |
| Python  | `{build_cmd} mypy .` ou `pyright` |

**DOIT PASSER.** Corriger les erreurs et relancer.

**1.2 Lint** (si `{has_lint}` = true)

| Langage | Commande |
|---------|----------|
| Node.js | `{build_cmd} lint` (essayer `--fix` en premier) |
| Rust    | `cargo clippy` |
| Go      | `go vet ./...` |
| Python  | `{build_cmd} ruff check --fix .` |

**DOIT PASSER.**

**1.3 Tests** (si `{has_test}` = true)

| Langage | Commande |
|---------|----------|
| Node.js | `{build_cmd} test` |
| Rust    | `cargo test` |
| Go      | `go test ./...` |
| Python  | `{build_cmd} pytest` |

**DOIT PASSER.** Identifier la cause racine, corriger.

### 2. Checklist d'auto-audit

**8 réflexes de structure** (voir shared/meta/structure-rules.md) :
- [ ] Aucun fichier > 250 lignes
- [ ] Pas de code dupliqué
- [ ] Pas de valeurs en dur
- [ ] Responsabilités séparées
- [ ] Existant vérifié avant de créer
- [ ] Conventions de nommage cohérentes
- [ ] Pas de code mort
- [ ] Organisé par domaine/feature

**Critères d'acceptation :**
- [ ] Chaque AC démontrablement satisfait
- [ ] Cas limites considérés

### 3. Formater le code

```bash
{build_cmd} format   # Node.js
cargo fmt            # Rust
gofmt -w .           # Go
{build_cmd} ruff format .  # Python
```

### 4. Vérification finale

Relancer typecheck + lint. Les deux DOIVENT passer.

### 5. Présenter les résultats

```
Validation terminée

Typecheck : Passé
Lint : Passé
Tests : {X}/{X} passent
Format : Appliqué

Critères d'acceptation :
- [x] AC1 : Vérifié par [comment]
- [x] AC2 : Vérifié par [comment]
```

---

## SelfCheckProtocol

> Exécuter APRÈS l'implémentation (step-03), AVANT de passer à Harden/Ship.
> Spec complète (template, exemples) : `shared/meta/self-check.md`.
> Taux anti-hallucination : 94% — chaque réponse exige une PREUVE concrète.

### Quand l'exécuter

| Niveau | Application |
|--------|-------------|
| **L1** | SKIP — validation inline dans step-03 suffit |
| **L2** | Même agent — 4 questions simplifiées, sans agent séparé |
| **L3** | **Agent validateur SÉPARÉ** (pas le même qui a codé) |
| **L4** | **Agent validateur SÉPARÉ** + justification écrite obligatoire par AC |

En L3-L4 : le sous-agent reçoit le plan, les fichiers modifiés, les AC.
Il n'a PAS le contexte émotionnel de l'agent codeur → anti-biais de confirmation.
JAMAIS Opus en sous-agent (sauf demande explicite de l'utilisateur).

### Les 4 questions avec preuves obligatoires

```
Q1 — Les tests passent-ils ?
     Preuve : output complet de la commande de test

Q2 — Tous les AC sont-ils couverts ?
     Preuve : mapping AC → fichier:ligne pour chaque AC
     Après Q2 : mettre à jour traceability[AC-N].validated_by avec le test ou la preuve.

Q3 — Y a-t-il des assumptions non vérifiées ?
     Preuve : liste explicite des hypothèses + statut (vérifiée / non vérifiée)

Q4 — Ai-je des preuves concrètes, pas des spéculations ?
     Preuve : git diff --stat, output lint, output typecheck
```

### Scoring et décision

```
4/4 OUI → PASS    — passer à Harden/Ship
3/4 OUI → WARNING — corriger la question en échec, puis PASS
< 3/4   → FAIL    — retour à Execute (step-03), retravailler
```

**Si SelfCheck = FAIL (< 3/4) :**
Avant de retourner à Execute, exécuter le protocole hk-debug sur les questions en échec :
charger `H.K/skills/hk-debug/SKILL.md` et appliquer les 5 phases sur chaque question FAIL.
Si le debug résout les questions → recalculer le score avant de retourner à Execute.

Fail CLOSED : ne jamais ignorer un FAIL, ne jamais marquer PASS avec une question en échec.

### Enregistrement dans .hk/hk-state.json

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
      "validator_agent": "same"
    }
  }
}
```

`validator_agent` = `"same"` (L2) ou `"separate"` (L3-L4).

---

## Transition

**Conditions de sortie** :
1. ☐ Déclaration explicite : [TRANSITIONING: VALIDATE → HARDEN] ou [TRANSITIONING: VALIDATE → SHIP]
2. ☐ Outputs requis présents : tous les checks passants, SelfCheck exécuté, .hk/hk-state.json mis à jour
3. ☐ .hk/hk-state.json mis à jour (current_step, current_mode, confidence.post_validate, confidence.self_check_score)
4. ☐ SelfCheck score >= 3/4 ET confidence.post_validate >= 0.85 (seuil : `shared/meta/complexity-levels.md`)

```
SI {harden_mode} = true  → Charge `steps/step-05-harden.md`
                           Mets à jour : current_step = "05-harden", current_mode = "HARDEN"
SINON SI {ship_mode}     → Charge `steps/step-06-ship.md`
                           Mets à jour : current_step = "06-ship", current_mode = "SHIP"
SINON                    → Workflow terminé
                           Mets à jour : current_step = "done", current_mode = "IDLE"
```
