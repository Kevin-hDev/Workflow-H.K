# Niveaux de complexité L1-L4

> Charge ce fichier une seule fois (step-00 Init). Il définit la cérémonie,
> les limites et les steps actifs par niveau. Le niveau est stocké dans
> `.hk/hk-state.json.complexity_level`. L'utilisateur peut forcer avec `--level L2`.

---

## Seuils de détection (config centralisée)

```
L1_MAX_FILES     = 3
L2_MAX_FILES     = 7
L3_MAX_FILES     = 15
L4_MIN_FILES     = 16

L1_MAX_AC        = 0   (pas de plan formel)
L2_MAX_AC        = 5
L3_MAX_AC        = 8
L4_MAX_AC        = 12

L1_TOKEN_BUDGET  = 1000
L2_TOKEN_BUDGET  = 3000
L3_TOKEN_BUDGET  = 6000
L4_TOKEN_BUDGET  = 12000

CONFIDENCE_THRESHOLD_EXECUTE  = 0.90
CONFIDENCE_THRESHOLD_VALIDATE = 0.85
CONFIDENCE_SKIP_LEVEL         = L1
```

---

## Vue d'ensemble

| Niveau | Nom | Critères | Steps actifs | Tokens estimés |
|--------|-----|----------|-------------|----------------|
| **L1** | Quick Fix | ≤ 3 fichiers, fix clair, pas de nouveau module | EXECUTE + VALIDATE inline | ~1 000 |
| **L2** | Focused Change | 4-7 fichiers, feature simple, 1 domaine | ANALYZE (rapide) + PLAN + EXECUTE + VALIDATE | ~3 000 |
| **L3** | Standard Feature | 8-15 fichiers, feature complète, 2+ domaines | Pipeline complet (6 modes) | ~6 000 |
| **L4** | Complex Initiative | 16+ fichiers, cross-cutting, architecture | Pipeline complet + CREATIVE + waves obligatoires | ~12 000 |

---

## L1 — Quick Fix

**Critères de classification :**
- 1 à 3 fichiers impactés
- Fix clair (typo, bug isolé, ajout d'un champ)
- Pas de nouveau module, pas de nouveau domaine
- Domaine non sensible (auth/crypto/payments → force L3 minimum)

**Cérémonie :**
- Pas de sous-agent, pas de plan formel, pas de step ANALYZE
- Flux : comprendre → coder → valider inline (tout dans le contexte principal)
- ConfidenceCheck : skippé (toujours >= 0.95 sur L1)
- Strict Mode : simplifié, permissions actives mais pas de transitions formelles
- Sécurité : 10 réflexes inline rapides

**Limites :**
- Max 3 fichiers. Si l'exécution révèle plus de 3 fichiers → escalade vers L2
- Pas de plan formel → pas d'acceptance criteria formels

**Instruction step-00 pour L1 :**
```
MODE: EXECUTE (direct, pas de transition ANALYZE → PLAN)
Écrire .hk/hk-state.json minimal avec current_mode = "EXECUTE"
Coder, valider inline, mettre à jour .hk/hk-state.json.current_mode = "IDLE"
```

---

## L2 — Focused Change

**Critères de classification :**
- 4 à 7 fichiers impactés
- Feature simple dans 1 domaine
- Pas de changement architectural
- Domaine non critique (ou critique mais limité à 1 fichier sensible)

**Cérémonie :**
- 1 sous-agent Haiku pour l'exploration (ANALYZE rapide, ~500 tokens)
- Plan allégé : liste de fichiers sans détails, max 5 AC
- Waves parallèles si fichiers indépendants (max 2 waves)
- ConfidenceCheck : actif, seuil 0.90 avant EXECUTE

**Limites :**
- Max 7 fichiers. Au-delà → escalade vers L3
- Max 5 AC par mission
- Max 1 mission (si 2+ missions nécessaires → découper en 2 sessions L2)

**Sous-agents :**
- 1 Haiku pour exploration
- Pas de sous-agent codeur (agent principal code directement)

---

## L3 — Standard Feature

**Critères de classification :**
- 8 à 15 fichiers impactés
- Feature complète touchant 2+ domaines
- Peut inclure des fichiers sensibles (auth, API, config)
- Monorepo : plusieurs sous-projets touchés

**Cérémonie :**
- Pipeline complet : ANALYZE → PLAN → [CREATIVE si frontend] → EXECUTE → VALIDATE → HARDEN
- 2-3 sous-agents Haiku en ANALYZE (Wave pattern)
- SelfCheckProtocol post-VALIDATE (4 questions avec preuves)
- ConfidenceCheck actif : 0.90 avant EXECUTE, 0.85 avant SHIP
- Sécurité : selon risk_level (Trust-Adaptive)

**Limites :**
- Max 15 fichiers. Au-delà → escalade vers L4 ou découper
- Max 8 AC au total (répartis sur max 3 missions, 5 AC max par mission)
- Missions : 2-3 max par session. Si plus → découper en quests séparées

**Sous-agents :**
- 2-3 Haiku en parallèle pour ANALYZE
- Sous-agent Sonnet séparé pour validation (SelfCheck anti-biais de confirmation)
- Sous-agent Sonnet pour review sécurité si HIGH

**Waves en EXECUTE :**
```
Wave 1 : fichiers indépendants (marqués P1 dans le plan)
Checkpoint : vérifier lint + build
Wave 2 : fichiers dépendants de Wave 1 (marqués P2)
Checkpoint : vérifier lint + tests unitaires
Séquentiel : fichiers d'intégration (marqués S)
```

---

## L4 — Complex Initiative

**Critères de classification :**
- 16+ fichiers impactés
- Changement architectural (nouveaux patterns, refactoring global)
- Cross-cutting (touche infrastructure, auth, data, UI simultanément)
- Migration ou refactoring de systèmes existants

**Cérémonie :**
- Pipeline L3 + phase CREATIVE obligatoire (même pour backend)
- Threat modeling STRIDE complet obligatoire
- Five-Persona Review obligatoire
- Waves obligatoires avec max 5 fichiers par wave
- Découpage en missions de 2-3 taches max (zéro compaction)

**Limites :**
- Max 30 fichiers par session. Au-delà → découper en quests séparées
- Max 12 AC au total
- Si une wave dépasse 5 fichiers → la couper en 2 waves

**Sous-agents :**
- 2-3 Sonnet en parallèle pour ANALYZE (projet complexe)
- Sous-agent Sonnet dédié pour chaque wave d'EXECUTE
- Sous-agent Sonnet séparé pour validation adversariale

**Instruction découpage :**
Si le plan dépasse les limites L4, découper automatiquement :
```
1. Identifier les dépendances entre fichiers
2. Grouper en quests indépendantes (chacune respecte les limites L3/L4)
3. Proposer l'ordre d'exécution à l'utilisateur
4. Chaque quest a son propre .hk/hk-state.json
```

---

## Détection automatique du niveau

L'agent exécute ces étapes dans step-00 Init :

```
1. Analyser la description de la tâche
   - Mots-clés de scope large ("refactoring", "architecture", "migration") → +2 niveaux
   - Domaine sensible ("auth", "payment") → niveau minimum L3
   - "fix", "typo", "rename" → suggère L1

2. Scanner le codebase (1 sous-agent Haiku, lecture rapide)
   - Compter les fichiers potentiellement impactés
   - Détecter les domaines touchés

3. Appliquer les seuils de la section config ci-dessus

4. Proposer le niveau avec justification :
   "Niveau détecté : L2 (5 fichiers estimés, 1 domaine, feature simple)
    Pour forcer un autre niveau : --level L3"

5. Attendre confirmation ou override de l'utilisateur

6. Écrire complexity_level dans .hk/hk-state.json
```

---

## Désescalade dynamique

Si en cours d'exécution le plan révèle moins de complexité que prévu :

```
Condition : current_substep > 3 ET fichiers_restants < L_PREVIOUS_MAX_FILES
Action    : réduire la cérémonie des steps restants
Log       : écrire dans .hk/hk-state.json.meta.deescalation_log
Exemple   : L3 → L2 si seulement 4 fichiers au lieu de 10 estimés
```

La désescalade ne remonte **jamais** les gates de sécurité déjà franchis.
Un `risk_level = HIGH` détecté en ANALYZE reste HIGH même si le scope réduit.

---

## Escalade en cours de session

Si l'exécution révèle plus de complexité :

```
Condition : fichiers_restants > L_CURRENT_MAX_FILES
Action    : STOP, proposer à l'utilisateur de continuer en L_NEXT ou de découper
Ne jamais : escalader silencieusement sans informer l'utilisateur
Log       : écrire dans .hk/hk-state.json.meta.deescalation_log (même champ, direction inverse)
```
