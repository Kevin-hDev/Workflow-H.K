---
name: step-02b-design
description: Phase Design optionnelle — explore 3 options UI/UX avant implémentation
returns_to: step-03-execute.md
---

> Avant d'exécuter ce step, recharger :
> - shared/meta/security-rules.md
> - shared/meta/structure-rules.md
> - shared/meta/modes.md → [MODE: CREATIVE]
> - shared/meta/design-rules.md
> - H.K/meta/hk-workflow.md

**Permissions du mode CREATIVE** :
- AUTORISÉ : lire fichiers, explorer design system, créer maquettes textuelles, écrire le Design Brief
- INTERDIT : écrire du code source, modifier des fichiers existants, commandes système, git

---

# Step 02b: Design (Exploration créative)

**Rôle** : DESIGNER uniquement — pas d'implémentation.

---

## Conditions d'activation

```
Automatique : le plan modifie des fichiers UI (.tsx, .vue, .svelte, .html, .css)
              ET complexity_level >= L3
Manuelle    : flag --design / -d (force le mode, même pour backend)
L4          : OBLIGATOIRE sans exception
```

## Adaptation par niveau

| Niveau | Comportement |
|--------|-------------|
| L1 | SKIP |
| L2 | SKIP — sauf flag `--design` explicite |
| L3 | Activé si fichiers frontend détectés OU flag `--design` |
| L4 | OBLIGATOIRE — même pour backend (design d'API, architecture) |

---

## SÉQUENCE D'EXÉCUTION

### Étape 1 — Analyser le contexte design

```
- Thème existant ? (tokens CSS, Tailwind config, variables globales)
- Composants existants ? (patterns UI, component library)
- Style guide ? (Figma, Storybook, screenshots)
- Contraintes : dark mode, responsive, accessibilité, RTL
```

### Étape 2 — Intent-first (3 questions obligatoires)

Répondre avant toute proposition. Si une réponse est vague → **demander à l'utilisateur**.

```
1. Qui est cet humain ? (pas "les utilisateurs" — la personne concrète)
2. Quel est le verbe exact ? (pas "utiliser" — l'action précise)
3. Quel ressenti ? (formulation qui signifie quelque chose de précis)
```

### Étape 3 — Explorer exactement 3 options

Toujours 3 — pas 2, pas 4. La contrainte force la diversité réelle.

```
Option A : [direction + structure composants + justification domaine]
Option B : [direction + structure composants + justification domaine]
Option C : [direction + structure composants + justification domaine]
```

Chaque option doit être réellement distincte — pas des variations de la même idée.

### Étape 4 — Évaluer chaque option

| Critère | Option A | Option B | Option C |
|---------|----------|----------|----------|
| Cohérence avec l'existant | ★★★ | ★★ | ★★★ |
| Accessibilité (WCAG) | ★★ | ★★★ | ★★ |
| Responsive | ★★★ | ★★ | ★★★ |
| Performance | ★★ | ★★★ | ★★ |
| Originalité | ★★ | ★★ | ★★★ |

### Étape 5 — Choisir

- `auto_mode = true` : sélectionner l'option au score total le plus élevé
- `auto_mode = false` : présenter les 3 options à l'utilisateur, attendre son choix

### Étape 6 — Produire le Design Brief

Créer `H.K-output/design-specs.md` :

```markdown
# Design Brief — {task_description}

## Intent
[Qui / Verbe exact / Ressenti]

## Layout
[Structure des composants, hiérarchie visuelle]

## Tokens
[Variables CSS nommées selon le monde du produit — pas des valeurs techniques]

## Typographie
[Fontes choisies + rôles justifiés]

## Comportements interactifs
[Hover, focus, transitions, micro-animations ~150ms]

## Responsive
[Breakpoints : mobile, tablet, desktop]

## Accessibilité
[Contraste WCAG, navigation clavier, ARIA labels]
```

---

## Règles anti-AI-slop

Référence complète : `shared/meta/design-rules.md`

### INTERDIT
- Inter, Roboto, Arial ou toute police "safe" sans justification
- Gradients violet/rose (`#667eea → #764ba2`) ou palettes génériques
- `rounded-2xl` appliqué partout sans intention
- "Clean and modern" ou "minimal and elegant" comme direction
- Cards identiques répétées en grille sans raison
- Icônes hero-icons par défaut sans réflexion

### OBLIGATOIRE
- Commencer par l'INTENTION (3 questions Intent-first)
- Explorer le DOMAINE : 5+ métaphores, 5+ couleurs du monde du produit
- 3 options VRAIMENT différentes (pas des variations)
- Micro-animations et profondeur (shadows, layers, perspective subtils)
- Typographie avec personnalité — chaque choix justifié
- Tokens CSS nommés selon le monde du produit (`--ink`, `--parchment`)

---

## Transition

**Conditions de sortie** :
1. ☐ `[TRANSITIONING: CREATIVE → EXECUTE]`
2. ☐ Design Brief produit et écrit dans `H.K-output/design-specs.md`
3. ☐ `variables.design_mode = true` dans .hk/hk-state.json
4. ☐ ConfidenceCheck >= 0.90 (voir shared/meta/confidence-checker.md)
5. ☐ .hk/hk-state.json mis à jour : `current_step = "03-execute"`, `current_mode = "EXECUTE"`

Charger `steps/step-03-execute.md`, `current_mode = "EXECUTE"`
