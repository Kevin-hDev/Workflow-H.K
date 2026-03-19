# H.K Context-Limit — Tutoriel

> **Createur original : [Kevin Huynh](https://github.com/Kevin-hDev)**

## Prerequis

- [Claude Code](https://claude.ai/claude-code) installe et configure
- Un projet a implementer (avec ou sans plan existant)

## Etape 1 — Installation

```bash
npx hk-context-limit install
```

Ca installe les skills et agents dans votre dossier global `~/.claude/`. A faire une seule fois.

## Etape 2 — Lancer une conversation

Ouvrez Claude Code dans le dossier de votre projet et tapez :

```
/hk-dev-and-review
```

Jackson se presente et commence a chercher les fichiers de votre projet.

## Etape 3 — Jackson detecte votre projet

Jackson cherche un dossier `*-output/` contenant `roadmap.md` et `*-status.yaml`.

**Si trouve :** Jackson montre votre avancement et propose de reprendre.

**Si pas trouve :** Jackson cherche un fichier plan dans votre codebase (`*plan*`, `*roadmap*`, `*spec*`, etc.).

**Si un plan existe :** Jackson le lit et propose de l'adapter au format Quest/Mission :
- Il scanne d'abord votre codebase pour comprendre ce qui existe deja
- Il cree `{projet}-output/roadmap.md` avec votre plan restructure
- Il cree `{projet}-output/{projet}-status.yaml` pour suivre l'avancement

**Si pas de plan :** Jackson propose un brainstorming avec `/hk-brainstorm` dans une nouvelle conversation.

## Etape 4 — Mode normal vs mode auto

Avant de lancer la premiere mission, Jackson demande :

- **Mode normal (1) :** Mission par mission. Vous validez entre chaque et pouvez tester l'UI.
- **Mode auto (2) :** 5 missions d'affilee sans s'arreter. Plus rapide, mais pas de validation entre les missions. Si une erreur survient, Jackson repasse automatiquement en mode normal.

Vous pouvez aussi lancer le mode auto directement :
```
/hk-dev-and-review --auto
```

## Etape 5 — Le cycle dev/review

Pour chaque mission, Jackson :

1. Marque la mission `[in-progress]`
2. **Deploie Iris** (Sonnet) — elle lit le brief, code, ecrit les tests, marque `[review]`
3. Verifie le rapport d'Iris (taches completees, tests crees)
4. **Deploie Mike** (Opus) — il verifie 3 points (plan suivi, logique correcte, integration OK), corrige les problemes, fait une revue adversariale, marque `[done]`
5. Verifie le rapport de Mike (checkpoints OK, tests valides)
6. Vous montre un resume et propose la suite

## Etape 6 — Apres 5 missions

Jackson recommande de rafraichir le contexte :
- `/clear` et relancer `/hk-dev-and-review`
- Ou ouvrir une nouvelle conversation

Ca garde le contexte frais et maintient la qualite.

## Debug Escalation

Si Iris ou Mike rencontre un bug qu'ils n'arrivent pas a corriger apres 3 tentatives :
1. Ils reviennent vers Jackson avec un rapport d'echec detaille
2. Jackson investigue avec `/hk-debug` (analyse de cause racine, 3 hypotheses)
3. Jackson deploie un agent correcteur avec des instructions precises
4. La boucle reprend normalement

## Brainstorming

Dans une **nouvelle conversation**, tapez :

```
/hk-brainstorm
```

Iris (en mode facilitatrice) vous guide a travers un brainstorming structure :
- Choisissez la profondeur : Rapide (15 min), Approfondi (30 min), ou Exhaustif (60+ min)
- 15 techniques disponibles (SCAMPER, First Principles, Shark Tank, Pre-mortem, etc.)
- Recherche web integree
- Finit avec un Top 3 priorise et un plan d'action

## Conseils

- **Toujours une nouvelle conversation** pour le brainstorming — un contexte frais produit de meilleures idees
- **Le createur decide toujours** — Jackson, Iris et Mike proposent mais n'imposent jamais
- **Choix numerotes partout** — tapez juste un numero pour choisir, jamais besoin d'ecrire des phrases
- **Plans avec du code existant** — Jackson scanne votre codebase avant de creer un plan, les taches referencent les fichiers existants et respectent vos conventions
- **Verifiez le fichier status** — `{projet}-output/{projet}-status.yaml` reflete toujours l'etat actuel de votre projet
