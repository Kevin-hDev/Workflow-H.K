# Modes — Permissions par phase

> Charge ce fichier une seule fois au démarrage. Chaque step y fait référence
> sans le recharger. Le mode actif est écrit dans `.hk/hk-state.json.current_mode`.
> **Toute action hors permission du mode actif est BLOQUÉE.**

---

## Modes disponibles

| Mode | Description | Lecture | Écriture code | Écriture plans | Commandes |
|------|-------------|---------|--------------|----------------|-----------|
| `ANALYZE` | Exploration, collecte d'informations | OUI | NON | NON | lecture seule |
| `PLAN` | Rédaction du plan d'action | OUI | NON | OUI | lecture seule |
| `CREATIVE` | Design, exploration d'options | OUI | NON | OUI (design brief) | lecture seule |
| `EXECUTE` | Implémentation du code | OUI | OUI | NON | build/test limité |
| `VALIDATE` | Vérification des outputs | OUI | NON | NON | run commands |
| `HARDEN` | Review sécurité | OUI | NON | NON | analyse seule |
| `SHIP` | Opérations git | OUI | NON | NON | git uniquement |
| `IDLE` | Aucun step actif | OUI | NON | NON | aucune |

---

## Détail des permissions

### [MODE: ANALYZE]

```
AUTORISÉ   : lire fichiers, explorer structure, web search, sous-agents lecture
INTERDIT   : créer ou modifier des fichiers source
INTERDIT   : créer ou modifier des fichiers de plan
INTERDIT   : exécuter des commandes système
INTERDIT   : toute opération git
```

### [MODE: PLAN]

```
AUTORISÉ   : lire fichiers, rédiger le plan dans .hk/hk-state.json
AUTORISÉ   : créer/modifier fichiers de plan uniquement (*.plan.md, .hk/hk-state.json)
INTERDIT   : modifier des fichiers source du projet
INTERDIT   : exécuter des commandes système
INTERDIT   : toute opération git
```

### [MODE: CREATIVE]

```
AUTORISÉ   : lire fichiers, explorer design system, web search références visuelles
AUTORISÉ   : écrire le design brief (H.K-output/design-specs.md)
INTERDIT   : modifier des fichiers source du projet
INTERDIT   : exécuter des commandes système
NOTE       : exactement 3 options doivent être explorées avant de choisir
```

### [MODE: EXECUTE]

```
AUTORISÉ   : lire et écrire des fichiers source
AUTORISÉ   : exécuter commandes build/test/lint (selon build_systems détectés)
AUTORISÉ   : créer des fichiers de test
INTERDIT   : modifier le plan approuvé (hash vérifié dans .hk/hk-state.json)
INTERDIT   : toute opération git
CHECKPOINT : écrire .hk/hk-state.json après chaque fichier modifié avec succès
```

### [MODE: VALIDATE]

```
AUTORISÉ   : lire tous les fichiers
AUTORISÉ   : exécuter commandes de test/lint/typecheck/build
AUTORISÉ   : capturer screenshots si Playwright disponible
INTERDIT   : modifier des fichiers source
INTERDIT   : toute opération git
```

### [MODE: HARDEN]

```
AUTORISÉ   : lire tous les fichiers modifiés
AUTORISÉ   : analyser avec patterns sécurité (voir security-rules.md)
AUTORISÉ   : écrire rapport de sécurité (.hk/security-report.md)
INTERDIT   : modifier des fichiers source
INTERDIT   : toute opération git
NOTE       : non-bypassable si risk_level = MEDIUM ou HIGH
```

### [MODE: SHIP]

```
AUTORISÉ   : opérations git (add, commit, push, PR)
AUTORISÉ   : écrire .hk/learnings.md (résumé du run)
INTERDIT   : modifier des fichiers source
INTERDIT   : modifier le plan
```

---

## Transitions entre modes

Chaque transition exige **3 conditions** :

1. **Déclaration explicite** : écrire `[TRANSITIONING: MODE_A -> MODE_B]` avant de changer
2. **Outputs requis présents** : vérifier dans `.hk/hk-state.json` que le step précédent a produit ses outputs
3. **ConfidenceCheck passé** si applicable (voir tableau ci-dessous)

### Transitions valides et prérequis

```
IDLE     → ANALYZE   : aucun prérequis (début de session)
ANALYZE  → PLAN      : .hk/hk-state.json mis à jour avec findings
PLAN     → CREATIVE  : plan rédigé (si design_mode = true)
PLAN     → EXECUTE   : plan approuvé + confidence.pre_execute >= 0.90
CREATIVE → EXECUTE   : design brief écrit + confidence.pre_execute >= 0.90
EXECUTE  → VALIDATE  : tous les fichiers du plan complétés
VALIDATE → HARDEN    : confidence.post_validate >= 0.85 (ou 4/4 SelfCheck)
VALIDATE → SHIP      : si risk_level = LOW et harden_mode = false
HARDEN   → SHIP      : threat_model_done = true (si HIGH) ou review complète
SHIP     → IDLE      : run terminé
```

### Transitions interdites

```
ANALYZE  → EXECUTE   : INTERDIT — le plan doit exister avant l'exécution
ANALYZE  → SHIP      : INTERDIT
EXECUTE  → ANALYZE   : INTERDIT — retour arrière nécessite validation explicite
HARDEN   → EXECUTE   : INTERDIT — pas de modification après review sécurité
```

---

## Enforcement dans .hk/hk-state.json

À chaque action, l'agent vérifie :

```
1. Lire .hk/hk-state.json.current_mode
2. Vérifier que l'action est dans les permissions du mode actif
3. Si OUI → exécuter + mettre à jour checkpoint_version et last_checkpoint
4. Si NON → BLOQUER, écrire dans .hk/hk-state.json l'action refusée, notifier l'utilisateur
```

**Fail closed** : en cas de doute sur le mode, bloquer et demander confirmation.

---

## Trust-Adaptive Security Gates

La sécurité s'adapte au risque mais n'est jamais désactivée sur les chemins critiques.

### Détection automatique du risque (step ANALYZE)

**Patterns HIGH** (scan noms de fichiers et contenu) :
`auth`, `login`, `password`, `token`, `secret`, `key`, `encrypt`, `decrypt`,
`payment`, `billing`, `pii`, `gdpr`, `session`, `cookie`, `jwt`, `oauth`,
`hmac`, `certificate`, `signature`, `hash`

**Patterns MEDIUM** :
`api`, `endpoint`, `route`, `handler`, `middleware`, `config`, `env`,
`database`, `query`, `network`, `socket`, `http`, `tls`, `webhook`

**Répertoires AUTO-HIGH** : `auth/`, `security/`, `crypto/`, `payments/`, `secrets/`, `certificates/`

**Répertoires AUTO-MEDIUM** : `api/`, `middleware/`, `config/`, `database/`

### Règles par niveau

| Niveau | Review sécurité | Désactivable ? | Threat modeling |
|--------|----------------|----------------|-----------------|
| `LOW` | 10 réflexes rapides inline | OUI (flag `--skip-harden`) | Aucun |
| `MEDIUM` | Sous-agent Sonnet + réflexes | NON | Mini-STRIDE |
| `HIGH` | Full STRIDE + Five-Persona | NON | STRIDE complet |

**Règle absolue** : si `risk_level` est MEDIUM ou HIGH, le mode HARDEN est obligatoire.
Le flag `--skip-harden` est ignoré silencieusement. L'agent continue vers HARDEN.

### Five-Persona Review (HIGH uniquement)

1. **Attaquant** — Comment exploiter ce code ? (injection, bypass, replay)
2. **Auditeur** — Conformité OWASP, CWE, standards du domaine
3. **Ops** — Observabilité, debuggabilité en production, pas de secrets dans les logs
4. **Coût** — Risque d'explosion de coûts (boucles infinies, requêtes non bornées)
5. **Utilisateur** — Impact sur l'expérience si attaque réussie

### Mini-STRIDE (MEDIUM)

Pour chaque composant modifié, évaluer brièvement :
- **S** — Spoofing : l'identité est-elle vérifiable ?
- **T** — Tampering : les données sont-elles intègres ?
- **R** — Repudiation : les actions sont-elles tracables ?
- **I** — Info Disclosure : les données sensibles sont-elles protégées ?
- **D** — Denial of Service : le système résiste-t-il à la surcharge ?
- **E** — Elevation of Privilege : les permissions sont-elles minimales ?

---

## Adaptation par niveau de complexité

| Niveau | Modes actifs | Strict Mode |
|--------|-------------|-------------|
| L1 | EXECUTE + VALIDATE (inline, fusionnés) | Simplifié — pas de transitions formelles |
| L2 | ANALYZE (rapide) + PLAN + EXECUTE + VALIDATE | Transitions vérifiées |
| L3 | Tous les modes selon le pipeline | Transitions strictes + ConfidenceCheck |
| L4 | Tous les modes + CREATIVE obligatoire | Transitions strictes + Double vérification |

En L1, les modes sont fusionnés en un seul pass. Les permissions restent actives
mais les transitions ne sont pas formellement déclarées.
