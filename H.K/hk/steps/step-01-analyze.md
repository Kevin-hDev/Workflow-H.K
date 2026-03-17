---
name: step-01-analyze
description: Pure context gathering - explore codebase to understand WHAT EXISTS
next_step: steps/step-02-plan.md
---

> Avant d'exécuter ce step, recharger :
> - shared/meta/security-rules.md
> - shared/meta/modes.md
> - Le mode actif est : [MODE: ANALYZE]

**Permissions du mode ANALYZE** :
- AUTORISÉ : lire fichiers, explorer structure, web search, lancer sous-agents lecture
- INTERDIT : créer ou modifier des fichiers source ou de plan, commandes système, git

# Step 1: Analyze (Collecte de contexte)

**Rôle** : EXPLORATEUR uniquement — pas de planification.

- Ne jamais planifier ou concevoir des solutions
- Toujours rapporter les findings avec chemins et numéros de lignes
- INTERDIT de suggérer des implémentations

---

## Adaptation par niveau

| Niveau | Comportement |
|--------|-------------|
| L1 | SKIP ENTIER — pas d'analyse formelle, compréhension directe dans le contexte principal |
| L2 | ALLÉGÉ — 1 sous-agent Haiku exploration rapide (~500 tokens), pas de wave |
| L3 | COMPLET — 2-3 sous-agents Haiku en parallèle (Wave pattern), synthèse |
| L4 | MAXIMUM — 2-3 sous-agents Sonnet (pas Haiku), analyse approfondie + threat pre-scan |

Lire `complexity_level` dans .hk/hk-state.json pour déterminer le niveau actif.
Seuils de fichiers : voir `shared/meta/complexity-levels.md`.

---

## SÉQUENCE D'EXÉCUTION

### 1. Extraire les mots-clés de recherche

À partir de la description de tâche, identifier :
- **Termes domaine** : auth, user, payment, etc.
- **Termes techniques** : API, route, component, etc.
- **Indices d'action** : create, update, fix, add, etc.

### 2. Explorer le codebase

**Si `{economy_mode}` = true :**
→ Utiliser les outils directs (voir step-00b-economy.md)

**Si `{economy_mode}` = false :**
→ Lancer des agents d'exploration selon le niveau actif (voir tableau Adaptation par niveau)

---

### Stratégie adaptative des agents

**Analyser avant de lancer :**
```
1. PORTÉE : Single file → Medium (quelques fichiers) → Complex (cross-cutting)
2. LIBRAIRIES : Connues → Skip docs | Inconnues → Explorer docs
3. PATTERNS : Simple → Moins d'agents | Intégration → Plus d'agents
```

**Types d'agents disponibles :**

| Agent | Modèle | Utiliser quand |
|-------|--------|----------------|
| `explore-codebase` | haiku | Trouver patterns existants, fichiers liés (L2/L3) |
| `explore-codebase` | sonnet | Analyse approfondie cross-cutting (L4 uniquement) |
| `explore-docs` | haiku | API de librairie inconnue |
| `websearch` | haiku | Approches communes, best practices |

**Lancer TOUS les agents en UN SEUL message (parallèle).**

---

## Wave pattern d'exploration

```
L1 : pas de wave (skip entier)
L2 : pas de wave (1 seul agent Haiku, exploration linéaire)
L3-L4 : Wave pattern actif

Wave 1 (parallèle) :
  - [explore-codebase] : patterns existants, fichiers, utilitaires
  - [explore-docs] : documentation libs (si API inconnue)
  - [web-search] : approches, best practices (sujet PRÉCIS, pas générique)
Checkpoint : fusionner les résultats, évaluer la couverture
  → Si couverture insuffisante → Wave 2

Wave 2 (parallèle, si nécessaire) :
  - [deep-dive fichiers identifiés en Wave 1]
  - [analyze dependencies]
Checkpoint : synthèse finale → passer à step-02-plan

Règles :
- Max 3 sous-agents par wave (pas plus, overhead > gain)
- En economy_mode : waves exécutées séquentiellement par l'agent principal
- JAMAIS Opus en sous-agent (sauf demande explicite)
- Haiku pour L3, Sonnet pour L4 (voir H.K/meta/hk-delegation.md)
- Format résumé sous-agents : voir shared/meta/delegation-format.md

Recherche web (dans Wave 1 si L3-L4) :
- Sujet PRÉCIS — format : "{technologie spécifique} + {problème concret}"
  - BON : "axum middleware authentication JWT extraction"
  - MAUVAIS : "Rust web framework best practices"
- Max 2 recherches web par run (économie de tokens)
- Résultats résumés dans le format delegation-format.md
```

---

### 3. Synthétiser les findings

```markdown
## Contexte codebase

### Fichiers trouvés
| Fichier | Lignes | Contient |

### Patterns observés
- Pattern routes, validation, gestion d'erreurs...

### Utilitaires disponibles
- `src/lib/auth.ts` — fonctions JWT

### Patterns de tests
- Tests dans `__tests__/`, utilise vitest
```

### 4. Inférer les critères d'acceptation

```markdown
## Critères d'acceptation inférés

- [ ] AC1: [résultat mesurable spécifique]
- [ ] AC2: [résultat mesurable spécifique]
```

Mettre à jour .hk/hk-state.json avec le niveau de complexité affiné (L1/L2/L3/L4).

### 5. Afficher le résumé

```
Collecte de contexte terminée

Fichiers analysés : {count}
Patterns identifiés : {count}
Niveau de complexité : {L1/L2/L3/L4}

→ Passage à la planification...
```

Ne pas demander de confirmation — toujours passer directement à step-02-plan.

---

## Validate-gap brownfield

Activation : automatique si >= 50% des fichiers du scope existent déjà.

En mode brownfield :
1. Lire le code existant des fichiers cibles
2. Comparer avec les requirements/AC de la tâche
3. Identifier le "gap" : ce qui existe déjà vs ce qui manque
4. Le plan (step-02) ne contient QUE les modifications nécessaires, pas de réécriture

En greenfield pur (tous fichiers nouveaux) → skip cette section.

Enregistrer dans .hk/hk-state.json :
- `variables.brownfield_mode` = true/false
- `variables.existing_files_count` = {N}
- `variables.gap_files_count` = {N}

---

## Détection du niveau de risque

Après l'exploration du codebase, scanner les fichiers que le plan va modifier.
Référence patterns complets : `shared/meta/modes.md` (section Trust-Adaptive Security Gates).

### 1. Patterns dans les noms/chemins de fichiers

**HIGH** — si un nom ou chemin contient :
`auth`, `login`, `password`, `token`, `secret`, `key`, `encrypt`, `decrypt`,
`payment`, `billing`, `pii`, `gdpr`, `session`, `cookie`, `jwt`, `oauth`,
`hmac`, `certificate`, `signature`, `hash`

**MEDIUM** — si un nom ou chemin contient :
`api`, `endpoint`, `route`, `handler`, `middleware`, `config`, `env`,
`database`, `query`, `network`, `socket`, `http`, `tls`, `webhook`

**Défaut** : LOW

### 2. Règles par répertoire

**AUTO-HIGH** : tout fichier sous `auth/`, `security/`, `crypto/`, `payments/`, `secrets/`, `certificates/`

**AUTO-MEDIUM** : tout fichier sous `api/`, `middleware/`, `config/`, `database/`

### 3. Règle de combinaison

Le niveau le plus élevé l'emporte. Si 1 fichier est HIGH et 10 sont LOW → risk_level global = HIGH.

### 4. Écriture dans .hk/hk-state.json

```
security.risk_level     = "LOW" | "MEDIUM" | "HIGH"
security.harden_required = true si MEDIUM ou HIGH
```

### 5. Impact sur le flag -H (--no-harden)

- risk_level = LOW → `-H` respecté, harden skippé si demandé
- risk_level = MEDIUM ou HIGH → `-H` IGNORÉ silencieusement, `harden_required = true` TOUJOURS

---

## Escalade / Désescalade

Après l'analyse, si le nombre de fichiers estimé ne correspond pas au niveau actuel :
- Si fichiers > seuil du niveau → STOP, proposer escalade à l'utilisateur
- Si fichiers < seuil du niveau précédent → proposer désescalade
- Logger dans .hk/hk-state.json.meta.deescalation_log
- Ne JAMAIS escalader/désescalader silencieusement

Référence seuils : `shared/meta/complexity-levels.md`

---

## Transition

**Conditions de sortie** :
1. ☐ Déclaration explicite : [TRANSITIONING: ANALYZE → PLAN]
2. ☐ Outputs requis présents : findings dans .hk/hk-state.json, complexity_level affiné
3. ☐ .hk/hk-state.json mis à jour (current_step, current_mode)

Charge maintenant `steps/step-02-plan.md`
Mets à jour .hk/hk-state.json : `current_step = "02-plan"`, `current_mode = "PLAN"`, `complexity_level = "{L?}"`
