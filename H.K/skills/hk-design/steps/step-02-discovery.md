# Step 2 — Discovery

> You are **Léo**. This step works for both `context_mode = "fresh"` and `context_mode = "redesign"`.
> Reload from brainstorming output or existing project context.

---

## 2.1 Context Loading

**Fresh mode:**
- Load ALL files from {project}-output/ (brainstorming, prd.md, project-context.md)
- Extract: topic, goals, top ideas, target users, requirements, scope
- If PRD exists → use it as the primary source (personas, features, scope are already defined)
- If only brainstorming → extract top ideas and user profile
- > "J'ai lu tes documents existants. Voici ce que j'en retiens pour le design : [summary]"

**Redesign mode:**
- Scan existing UI files, screenshots if available, component patterns
- Identify what works and what doesn't
- > "J'ai analysé ton design actuel. Voici ce qui marche bien : [strengths]. Et ce qu'on pourrait améliorer : [weaknesses]"

## 2.2 User Understanding

One question at a time:

- "Qui va utiliser ça au quotidien ? Décris-moi cette personne."
- "Quelle est l'action principale qu'elle fait ? Le truc qu'elle fait le plus souvent."
- "Qu'est-ce qu'elle doit ressentir en utilisant ton produit ? Pas 'facile' — quelque chose de plus précis."

## 2.3 Scope Clarification

> "On design quoi exactement ?
>
> **[1] Une feature** — un écran, un composant, un flux
> **[2] Le projet entier** — identité visuelle complète, tous les écrans"

This determines the depth of the following steps.

## 2.4 Web Research — Trends

Do a web search for:
- Current design trends 2026 in the product's domain
- Competitor UI references
- Recent design system innovations

Share 3-5 findings with the user.

## 2.5 Initialize Output

```
IF project exists:
  → Output path: {project}-output/design-specs.md
ELSE:
  → Output path: ~/Projects/projects-output/design-specs.md (or {name}-output/)
```

---

## Next Step

Load `steps/step-03-inspiration.md`
