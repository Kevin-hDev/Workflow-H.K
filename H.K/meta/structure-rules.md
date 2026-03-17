# Règles de structure — 8 réflexes obligatoires

> Fichier rechargé à CHAQUE step. Non négociable. Aucune exception.
> Note : la limite de 250 lignes s'applique aux fichiers de CODE, pas aux
> fichiers de documentation comme celui-ci.

---

## RÈGLE 1 — Fichiers de code : 250 lignes maximum

**INTERDIT :** Tout fichier source dépassant 250 lignes.
**CIBLE :** 50-150 lignes par fichier (responsabilité unique).
**OBLIGATOIRE :** Au-delà de 250 lignes, découper en modules séparés.

**Comment découper :**
- Identifier les responsabilités distinctes dans le fichier
- Créer un fichier par responsabilité
- Le fichier original devient un point d'entrée qui importe les modules

**Vérification :** `wc -l [fichiers modifiés]` — aucun résultat > 250.

---

## RÈGLE 2 — Duplication : interdite

**INTERDIT :** Copier-coller du code existant dans un nouveau fichier.
**OBLIGATOIRE :** Avant d'écrire une fonction, chercher si elle existe.

**Processus obligatoire avant d'écrire :**
1. Grep le nom de la fonction candidate dans le projet
2. Grep la logique (ex: `parse_date`, `format_currency`, `validate_email`)
3. Si trouvé → importer et réutiliser
4. Si absent → créer dans le module approprié (pas dans le fichier courant
   si la fonction sera réutilisée ailleurs)

```bash
# Exemple de vérification
grep -r "fn validate_email\|validateEmail\|validate_email" src/
```

---

## RÈGLE 3 — Valeurs en dur : interdites

**INTERDIT :** Nombres magiques, chaînes hardcodées, URLs, délais,
limites, couleurs directement dans le code.
**OBLIGATOIRE :** Centralisé dans un fichier de configuration ou constantes.

```rust
// INCORRECT
if items.len() > 100 { ... }
let url = "https://api.example.com/v1";

// CORRECT — dans config/constants.rs
pub const MAX_ITEMS: usize = 100;
pub const API_BASE_URL: &str = env!("API_BASE_URL");

// Dans le code
if items.len() > MAX_ITEMS { ... }
```

**Exceptions autorisées :** `0`, `1`, `-1`, `""`, `true`, `false` quand
leur sens est évident dans le contexte immédiat.

---

## RÈGLE 4 — Responsabilités : séparées en fichiers distincts

**INTERDIT :** Mélanger interface, logique métier, et accès données dans
un même fichier.
**OBLIGATOIRE :** Un fichier = une responsabilité.

**Séparation type :**
```
feature/
  mod.rs         # point d'entrée, réexports
  handler.rs     # interface (HTTP, CLI, événements)
  service.rs     # logique métier
  repository.rs  # accès données (DB, fichiers, API)
  models.rs      # types et structures
```

**Vérification :** Un fichier `handler.rs` ne doit pas contenir de
requêtes SQL. Un fichier `service.rs` ne doit pas contenir de HTML.

---

## RÈGLE 5 — Créer : vérifier l'existant d'abord

**INTERDIT :** Créer un composant/module/fonction sans avoir cherché
un équivalent dans le projet.
**OBLIGATOIRE :** Recherche en 2 étapes avant toute création.

**Étape 1 — Chercher par nom :**
```bash
grep -r "ComponentName\|component_name" src/
```

**Étape 2 — Chercher par responsabilité :**
```bash
# Ex: avant de créer un parser de dates
grep -r "parse.*date\|date.*parse\|DateTime::from" src/
```

Si un équivalent existe → l'utiliser ou l'étendre, jamais le dupliquer.

---

## RÈGLE 6 — Conventions de nommage : cohérentes dans tout le projet

**INTERDIT :** Mélanger `camelCase` et `snake_case` dans le même projet
(sauf contrainte de langage).
**OBLIGATOIRE :** Détecter la convention existante et la suivre.

**Détection de la convention du projet :**
```bash
# Regarder les 5 premiers fichiers source pour détecter la convention
grep -r "^fn \|^pub fn \|^async fn " src/ | head -20
```

**Règles par langage (conventions standard) :**
- Rust : `snake_case` pour tout sauf types (`PascalCase`)
- TypeScript/JS : `camelCase` variables/fonctions, `PascalCase` types
- Python : `snake_case` variables/fonctions, `PascalCase` classes
- Go : `camelCase` (exporté = `PascalCase`)

---

## RÈGLE 7 — Code mort : supprimer immédiatement

**INTERDIT :**
- Code commenté (`// ancien code`)
- Imports non utilisés
- Fonctions déclarées mais jamais appelées
- Variables déclarées mais jamais lues

**OBLIGATOIRE :** Supprimer, pas commenter.

**Vérification :**
```bash
# Rust : cargo check signale les dead_code
cargo check 2>&1 | grep "dead_code\|unused"

# TypeScript : ts-unused-exports
# Python : vulture ou pylint
```

**Exception :** Code avec `#[allow(dead_code)]` ou `// TODO:` explicite
avec ticket référencé — mais jamais de code commenté sans raison.

---

## RÈGLE 8 — Organisation par domaine/feature

**INTERDIT :** Tout mettre à plat dans un seul dossier.
**OBLIGATOIRE :** Organiser par domaine métier ou feature.

**Structure obligatoire :**
```
src/
  auth/           # tout ce qui concerne l'authentification
    mod.rs
    handler.rs
    service.rs
    repository.rs
  payments/       # tout ce qui concerne les paiements
    mod.rs
    ...
  shared/         # utilitaires transversaux
    errors.rs
    config.rs
```

**INTERDIT :**
```
src/
  handlers.rs     # TOUS les handlers ensemble
  services.rs     # TOUS les services ensemble
  models.rs       # TOUS les modèles ensemble
```

---

## Checklist d'auto-vérification (avant de créer ou modifier)

Répondre à ces 5 questions. Un seul "non" = bloquer et corriger.

1. Ce fichier dépasse-t-il 250 lignes ? Si oui → découper.
2. Cette fonction existe-t-elle déjà ailleurs ? Si oui → réutiliser.
3. Y a-t-il des valeurs en dur ? Si oui → centraliser.
4. Ce fichier mélange-t-il plusieurs responsabilités ? Si oui → séparer.
5. La convention de nommage est-elle cohérente avec le reste du projet ?
