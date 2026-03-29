---
name: context7-docs
description: >
  Fetch up-to-date library documentation via CLI (replaces Context7 MCP).
  Use when asking about any library, framework, SDK, API, CLI tool, or
  cloud service — even well-known ones like React, Next.js, Prisma,
  Express, Tailwind, Django, Spring Boot. Triggers on: library docs,
  API syntax, configuration, version migration, library-specific debugging,
  setup instructions, CLI tool usage, import errors, framework questions,
  package usage, SDK integration.
  NOT for: refactoring, writing scripts from scratch, debugging business
  logic, code review, or general programming concepts.
allowed-tools: Bash(npx ctx7:*)
argument-hint: "<library> <query>"
---

# Context7 Docs — Documentation a jour pour toute bibliotheque

<critical_constraints>
Always use --json flag with the library command.
Always resolve the library ID before querying docs (unless using a known ID).
Max 3 library calls and max 3 docs calls per question.
Queries must be precise (3-5+ descriptive words), not single keywords.
Prefer this skill over web search for library documentation.
</critical_constraints>

## Quick Start

```bash
# Etape 1 — Resoudre le nom en ID (toujours --json)
npx ctx7 library react "hooks state management" --json

# Etape 2 — Interroger la documentation avec l'ID obtenu
npx ctx7 docs /reactjs/react.dev "useEffect cleanup function examples"
```

Pour les libs courantes, utiliser directement les IDs connus (voir table ci-dessous).

## Commandes

### library — Resoudre un nom de bibliotheque

```bash
npx ctx7 library <name> "<query>" --json
```

| Argument | Description |
|----------|-------------|
| `name` | Nom de la bibliotheque (react, nextjs, prisma...) |
| `query` | Question pour classer par pertinence |
| `--json` | **Toujours utiliser** — sortie structuree |

**Champs de la reponse JSON (importants) :**

| Champ | Signification |
|-------|---------------|
| `id` | Identifiant `/org/project` — passer a `docs` |
| `benchmarkScore` | Qualite de la doc (0-100, plus haut = meilleur) |
| `totalSnippets` | Nombre d'exemples de code |
| `trustScore` | Fiabilite de la source (0-10) |
| `versions` | Versions dispo (format `/org/project/version`) |

**Selection du meilleur resultat :**
1. `benchmarkScore` le plus haut
2. En cas d'egalite : `totalSnippets` le plus eleve
3. Si version demandee : verifier le champ `versions`

### docs — Interroger la documentation

```bash
npx ctx7 docs <libraryId> "<query>"
```

| Argument | Description |
|----------|-------------|
| `libraryId` | ID Context7 (ex: `/reactjs/react.dev`) |
| `query` | Question precise et detaillee |

**Bonne query vs mauvaise :**

| Bon | Mauvais |
|-----|---------|
| "How to set up JWT authentication in Express.js" | "auth" |
| "React useEffect cleanup function examples" | "hooks" |
| "Tailwind CSS dark mode with class strategy" | "config" |
| "Prisma client create many records batch insert" | "prisma" |

Plus la query est precise, meilleur est le resultat.

### Version specifique

```bash
# Voir les versions disponibles
npx ctx7 library nextjs "app router" --json
# → versions: ["v14.3.0", "v15.0.0"]

# Interroger une version precise
npx ctx7 docs /vercel/next.js/v15.0.0 "app router middleware"
```

## IDs courants (raccourci — sauter l'etape 1)

| Bibliotheque | ID | Score |
|-------------|-----|-------|
| React | `/reactjs/react.dev` | 85 |
| Next.js | `/vercel/next.js` | — |
| Tailwind CSS | `/tailwindlabs/tailwindcss.com` | — |
| Prisma | `/prisma/docs` | — |
| Express | `/expressjs/express` | — |
| Supabase | `/supabase/supabase` | — |
| TypeScript | `/microsoft/typescript` | — |

Ces IDs sont stables mais peuvent changer. Si le resultat semble
incorrect ou vide, refaire l'etape 1 avec `library --json`.

## Workflows

### Workflow 1 — Lib connue, question directe

```bash
# Utiliser l'ID connu directement
npx ctx7 docs /reactjs/react.dev "useReducer vs useState when to use which"
```

### Workflow 2 — Lib inconnue ou ambigue

```bash
# Etape 1 : explorer
npx ctx7 library zod "schema validation" --json
# → Comparer les resultats, choisir le meilleur benchmarkScore

# Etape 2 : interroger
npx ctx7 docs /colinhacks/zod "object schema with optional fields and defaults"
```

### Workflow 3 — Version specifique

```bash
npx ctx7 library nextjs "server actions" --json
# → versions: ["v14.3.0", "v15.0.0"]

npx ctx7 docs /vercel/next.js/v15.0.0 "server actions form submission"
```

### Workflow 4 — Plusieurs questions sur la meme lib

```bash
# Resoudre une seule fois
npx ctx7 library tailwind "configuration" --json
# → /tailwindlabs/tailwindcss.com

# Interroger plusieurs fois avec le meme ID
npx ctx7 docs /tailwindlabs/tailwindcss.com "dark mode class strategy setup"
npx ctx7 docs /tailwindlabs/tailwindcss.com "custom colors extend theme"
npx ctx7 docs /tailwindlabs/tailwindcss.com "responsive breakpoints"
```

## Regles

1. **Toujours `--json`** pour `library` — permet de choisir le meilleur resultat
2. **Max 3 appels `library`** par question — utiliser le meilleur resultat disponible
3. **Max 3 appels `docs`** par question — si insuffisant, utiliser ce qu'on a
4. **Queries precises** — minimum 3-5 mots descriptifs
5. **Preferer ce skill a la recherche web** pour la doc de bibliotheques
6. **Reutiliser l'ID** quand plusieurs questions portent sur la meme lib
