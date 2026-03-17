---
name: step-03-execute
description: Todo-driven implementation - execute the plan file by file
prev_step: steps/step-02-plan.md
next_step: steps/step-04-validate.md
---

> Avant d'exécuter ce step, recharger :
> - shared/meta/security-rules.md
> - shared/meta/modes.md
> - Le mode actif est : [MODE: EXECUTE]

**Permissions du mode EXECUTE** :
- AUTORISÉ : lire et écrire des fichiers source, commandes build/test/lint, créer fichiers de test
- INTERDIT : modifier le plan approuvé (hash vérifié), opérations git

# Step 3: Execute (Implémentation)

**Rôle** : IMPLÉMENTEUR suivant un plan approuvé.

- Ne jamais dévier du plan approuvé
- Ne jamais ajouter des features hors plan (scope creep)
- Ne jamais modifier des fichiers sans les lire d'abord
- Un seul todo en cours à la fois

---

## Adaptation par niveau

| Niveau | Comportement |
|--------|-------------|
| L1 | DIRECT — coder + valider inline dans le contexte principal, max 3 fichiers, pas de wave |
| L2 | SIMPLE — exécution séquentielle ou max 2 waves si fichiers indépendants |
| L3 | WAVES — waves parallèles selon marquage P#/S du plan, checkpoint entre waves, Ascent loop |
| L4 | WAVES OBLIGATOIRES — max 5 fichiers/wave, sous-agent Sonnet par wave, checkpoint strict |

Lire `complexity_level` dans .hk/hk-state.json pour déterminer le niveau actif.
Seuil max fichiers/wave : voir `shared/meta/complexity-levels.md`.

---

## Exécution par waves

Lire le plan depuis .hk/hk-state.json (`plan.files_remaining` + marquage P#/S).

```
L1 : séquentiel direct (max 3 fichiers)
L2 : max 2 waves si fichiers indépendants, sinon séquentiel
L3-L4 : waves parallèles complètes
```

Séquence d'exécution :
1. Extraire les fichiers marqués P1 → Wave 1
2. Lancer les sous-agents en parallèle (1 par fichier, max 5)
3. Checkpoint Wave 1 : vérifier lint + build pour CHAQUE fichier
   → Si échec → corriger avant Wave 2
   → Mettre à jour `.hk/hk-state.json.plan.files_completed[]`
4. Extraire les fichiers marqués P2 → Wave 2
5. Même processus que Wave 1
6. Fichiers marqués S → exécution séquentielle
7. Checkpoint final : lint + build + tests complets

En economy_mode : pas de sous-agents, tout séquentiel par l'agent principal.
Max 5 fichiers par wave. Si plus → découper.

Seuil max fichiers/wave : voir `shared/meta/complexity-levels.md`.

---

## Ascent loop

L'Ascent loop est une vérification LOCALE après chaque wave (complémentaire au SelfCheck GLOBAL de step-04).

Après chaque wave complétée :
1. Exécuter : lint + build (pas les tests complets — trop lent)
2. Si erreurs → corriger dans la même wave, max 3 itérations
3. Si 3 itérations sans résolution → STOP, demander aide utilisateur

```
Itération Ascent :
  Wave N complétée
  → lint + build
  → SI OK → passer à Wave N+1
  → SI KO → identifier l'erreur
    → Corriger (itération 1/3)
    → Re-lint + re-build
    → SI OK → passer à Wave N+1
    → SI KO → itération 2/3, puis 3/3
    → SI 3/3 KO → STOP
```

**Si 3 itérations KO :**
Avant de demander l'aide utilisateur, exécuter le protocole hk-debug :
charger `H.K/skills/hk-debug/SKILL.md` et appliquer les 5 phases.
Si le debug résout le problème → reprendre la wave.
Si le debug échoue aussi → STOP, demander aide utilisateur.

Enregistrement dans .hk/hk-state.json :
- `current_substep` : incrémenté après chaque wave
- `plan.files_completed[]` : mis à jour après chaque wave réussie

Différence avec SelfCheck (step-04) :
- Ascent = vérification LOCALE par wave (rapide, lint+build)
- SelfCheck = vérification GLOBALE de tout le travail (4 questions avec preuves)
Les deux sont complémentaires.

---

## SÉQUENCE D'EXÉCUTION

### 1. Créer les todos depuis le plan

Convertir chaque changement de fichier du plan en todo :

```
Plan : `src/auth/handler.ts` → Ajouter validateToken
Todo : [ ] src/auth/handler.ts: Ajouter validateToken
```

Utiliser TodoWrite pour créer la liste complète.

### 2. Exécuter fichier par fichier

Pour chaque todo :

**2.1 Marquer En cours** — Un seul todo en cours à la fois

**2.2 Lire avant modifier** — Toujours lire le fichier avant de le modifier

**2.3 Implémenter** — Suivre les patterns de step-01, noms exacts du plan

**2.4 Marquer Terminé immédiatement** — Ne pas grouper les completions

Mettre à jour .hk/hk-state.json après chaque fichier terminé :
`plan.files_completed += [fichier]`, `plan.files_remaining -= [fichier]`

### 3. Gérer les blocages

**Si `{auto_mode}` = true :** décision raisonnable et continuer

**Si `{auto_mode}` = false :**
```yaml
questions:
  - header: "Blocage"
    question: "Un problème est survenu. Comment procéder ?"
    options:
      - label: "Utiliser l'approche alternative (Recommandé)"
      - label: "Sauter cette partie"
      - label: "Arrêter pour discussion"
    multiSelect: false
```

### 4. Vérification post-implémentation

| Langage | Commande |
|---------|----------|
| Node.js | `{build_cmd} typecheck && {build_cmd} lint --fix` |
| Rust    | `cargo check && cargo clippy --fix --allow-dirty` |
| Go      | `go build ./... && go vet ./...` |
| Python  | `{build_cmd} ruff check --fix . && {build_cmd} mypy .` |

Corriger toutes les erreurs immédiatement.

### 5. Résumé et confirmation

**Si `{auto_mode}` = true :** passer à la validation

**Si `{auto_mode}` = false :**
```yaml
questions:
  - header: "Execute"
    question: "Implémentation terminée. Prêt à valider ?"
    options:
      - label: "Passer à la validation (Recommandé)"
      - label: "Revoir les changements"
    multiSelect: false
```

---

## Traçabilité

Après chaque fichier implémenté, mettre à jour `.hk/hk-state.json.traceability` :

```json
{
  "AC-1": {
    "analyzed_in": "step-01 finding #{N}",
    "planned_in": "M-{N} {fichier}",
    "implemented_in": "step-03 substep {N}",
    "validated_by": null
  }
}
```

Chaque AC doit apparaître dans `traceability`. Si un AC n'a pas de mapping → WARNING.

Délégation par wave : chaque sous-agent de wave reçoit le contexte via le format de `shared/meta/delegation-format.md`.
Niveaux de délégation : voir `H.K/meta/hk-delegation.md`.

---

## Transition

**Conditions de sortie** :
1. ☐ Déclaration explicite : [TRANSITIONING: EXECUTE → VALIDATE]
2. ☐ Outputs requis présents : plan.files_remaining = [], tous les fichiers complétés
3. ☐ .hk/hk-state.json mis à jour (current_step, current_mode)

Charge maintenant `steps/step-04-validate.md`
Mets à jour .hk/hk-state.json : `current_step = "04-validate"`, `current_mode = "VALIDATE"`, `plan.files_remaining = []`
