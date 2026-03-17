---
name: step-05-harden
description: Security review adaptative — 3 niveaux selon risk_level (LOW/MEDIUM/HIGH)
prev_step: steps/step-04-validate.md
next_step: steps/step-06-ship.md  # conditional: only if ship_mode
load_condition: harden_mode = true
---

> Avant d'exécuter ce step, recharger :
> - shared/meta/security-rules.md — 10 réflexes à appliquer
> - shared/meta/modes.md
> - Le mode actif est : [MODE: HARDEN]

**Permissions du mode HARDEN** :
- AUTORISÉ : lire tous les fichiers modifiés, analyser avec patterns sécurité, écrire rapport (.hk/security-report.md)
- INTERDIT : modifier des fichiers source, opérations git

# Step 5: Harden (Revue sécurité)

**Rôle** : AUDITEUR SÉCURITÉ uniquement.

- Ne jamais sauter ce step quand `{harden_mode}` = true
- Toujours fail closed : les violations BLOQUENT la progression
- PORTÉE : uniquement les fichiers modifiés depuis step-03
- **Ce step n'est JAMAIS chargé en economy mode**

---

## Adaptation par niveau

| Niveau | Comportement |
|--------|-------------|
| L1 | SKIP — sauf si risk_level MEDIUM/HIGH (dans ce cas : 10 réflexes rapides inline) |
| L2 | SKIP — sauf si risk_level MEDIUM/HIGH (dans ce cas : mini-STRIDE) |
| L3 | CONDITIONNEL — LOW = skip, MEDIUM = mini-STRIDE, HIGH = full STRIDE |
| L4 | OBLIGATOIRE — minimum mini-STRIDE, HIGH = full STRIDE + Five-Persona Review |

Lire `complexity_level` et `security.risk_level` dans .hk/hk-state.json.
Détail STRIDE et Five-Persona : voir `shared/meta/modes.md`.

---

## SÉQUENCE D'EXÉCUTION

### 1. Lire le risk_level

```
risk_level = .hk/hk-state.json.security.risk_level   # LOW | MEDIUM | HIGH
```

Brancher sur la section correspondante ci-dessous.

---

## Risk LOW — 10 réflexes rapides

**Qui** : Agent principal (pas de sous-agent). Durée estimée ~2 min.

### Checklist 10 réflexes (pour chaque fichier modifié)

Référence complète : `shared/meta/security-rules.md`

```
1. ☐ Pas de == pour comparer des secrets (temps constant)
2. ☐ Collections avec maxSize + éviction
3. ☐ Zéro secret en dur dans le code
4. ☐ Entrées validées (type, longueur, format)
5. ☐ Zéro info interne dans les erreurs visibles
6. ☐ CSPRNG pour tokens/IDs/nonces
7. ☐ Zéro concaténation dans les commandes système
8. ☐ Zéro catch vide (fail CLOSED)
9. ☐ Zéro donnée sensible dans les logs
10. ☐ Secrets zéroïsés après usage
```

**Si toutes les cases sont cochées** → passer à la section Résumé.

**Si une violation est trouvée** → corriger immédiatement, recochier le réflexe.

---

## Risk MEDIUM — Mini-STRIDE + réflexes

**Qui** : Sous-agent Sonnet pour la review (agent principal continue).

### Étape A — 10 réflexes (même checklist que LOW)

Appliquer la checklist ci-dessus sur chaque fichier modifié.

### Étape B — Mini-STRIDE par composant

Pour chaque composant modifié, évaluer brièvement :

```
S — Spoofing          : L'identité est-elle vérifiable ?
T — Tampering         : Les données sont-elles intègres ?
R — Repudiation       : Les actions sont-elles traçables ?
I — Info Disclosure   : Les données sensibles sont-elles protégées ?
D — Denial of Service : Le système résiste-t-il à la surcharge ?
E — Elev. of Privilege: Les permissions sont-elles minimales ?
```

Consigner les résultats dans `.hk/security-report.md`.

---

## Risk HIGH — Full STRIDE + Five-Persona Review

**Qui** : Sous-agent Sonnet DÉDIÉ à la review sécurité.
**Prérequis de sortie** : `security.threat_model_done = true` obligatoire avant transition.

### Étape A — 10 réflexes (même checklist que LOW)

### Étape B — Full STRIDE avec documentation

Pour chaque composant modifié, documenter dans `.hk/security-report.md` :

```
S — Spoofing          : Vecteurs d'usurpation d'identité + mitigations
T — Tampering         : Intégrité des données + mitigations
R — Repudiation       : Traçabilité des actions + mitigations
I — Info Disclosure   : Exposition de données sensibles + mitigations
D — Denial of Service : Résistance à la surcharge + mitigations
E — Elev. of Privilege: Périmètre des permissions + mitigations
```

### Étape C — Five-Persona Review

1. **Attaquant** — Comment exploiter ce code ? (injection, bypass, replay)
2. **Auditeur** — Conformité OWASP, CWE, standards du domaine
3. **Ops** — Observabilité, debuggabilité en production, pas de secrets dans les logs
4. **Coût** — Risque d'explosion de coûts (boucles infinies, requêtes non bornées)
5. **Utilisateur** — Impact sur l'expérience si attaque réussie

Écrire le rapport Five-Persona dans `.hk/security-report.md`.

---

## Traitement des violations

**Si aucune violation :**

```
Revue sécurité : PASSÉE (0 violations)
10 réflexes vérifiés sur {count} fichiers.
```

**Si des violations existent :**

Afficher le tableau des violations, puis corriger TOUTES avant de continuer.
Relancer la revue sur les fichiers corrigés.

---

## Résumé de sécurité

```
Hardening terminé

risk_level      : {LOW | MEDIUM | HIGH}
Violations      : {count} trouvées / {count} corrigées
Fichiers scannés: {count}
Réflexes vérifiés: tous les 10
STRIDE          : {none | mini | full}
Five-Persona    : {non | oui}
```

---

## Mise à jour .hk/hk-state.json

```
security.threat_model_done  = true  (après STRIDE MEDIUM ou HIGH)
security.force_skip_log     = [{timestamp, reason, step}]  (si force-skip sur LOW)
```

---

## Transition

**Conditions de sortie** :
1. ☐ Déclaration explicite : [TRANSITIONING: HARDEN → SHIP]
2. ☐ Outputs requis présents : 0 violation non corrigée, rapport écrit dans .hk/security-report.md
3. ☐ .hk/hk-state.json mis à jour (current_step, current_mode, security.threat_model_done)
4. ☐ Pour HIGH : security.threat_model_done = true obligatoire

```
SI {ship_mode} = true → Charge `steps/step-06-ship.md`
                        Mets à jour : current_step = "06-ship", current_mode = "SHIP"
SINON                 → Workflow terminé
                        Mets à jour : current_step = "done", current_mode = "IDLE"
```
