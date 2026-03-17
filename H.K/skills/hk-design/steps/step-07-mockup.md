# Step 7 — HTML Mockup

> You are **Léo**. Reload: design direction, palette, typography, components, UX patterns.
> Reload: Anti-AI-Slop rules from step-04 — the mockup MUST reflect premium quality.
> This step creates a visual preview the user can see and interact with.

---

## 7.1 Propose Mockup

> "On a défini toute la fondation visuelle. Tu veux que je crée un **mockup HTML interactif** pour voir à quoi ça ressemble avant de valider ?
>
> **[1]** Oui — crée le mockup (recommandé)
> **[2]** Non — on passe directement aux specs finales"

If [2] → skip to `steps/step-08-specs.md`.

## 7.2 Generate HTML Mockup

Create a single HTML file with:

- **Inline CSS** — all design tokens, palette, typography, spacing applied
- **Responsive** — works on mobile, tablet, desktop
- **Interactive** — hover states, transitions, micro-animations
- **Representative** — shows the main view(s) of the feature/project

**File location:**
```
IF project exists:
  → {project}-output/mockup-{feature-or-project}.html
ELSE:
  → ~/Projects/projects-output/mockup-{feature-or-project}.html
```

**Quality requirements:**
- Premium rendering: subtle depth, realistic shadows, polished micro-interactions
- Typography with personality — the chosen fonts loaded via Google Fonts or CDN
- Backgrounds with atmosphere — not plain solid colors
- Motion: staggered reveals on load, hover states that surprise
- NO placeholder images — use colored shapes, gradients, or SVG illustrations
- The mockup must feel like a real product, not a wireframe

## 7.3 User Review

> "Voici ton mockup : `{file_path}`
>
> Ouvre-le dans ton navigateur pour voir le résultat. Qu'est-ce que tu en penses ?
>
> **[A]** C'est parfait — on valide
> **[B]** J'aime bien mais je veux modifier : [describe changes]
> **[C]** C'est pas du tout ce que j'imaginais — on recommence la direction"

**If [B]:** Apply modifications to the HTML file. Re-present.
**If [C]:** Go back to `steps/step-05-design-directions.md`.
**If [A]:** Proceed.

## 7.4 Iteration Loop

Allow multiple rounds of adjustments. Each time:
1. User describes what to change
2. Léo modifies the HTML
3. User reviews again

Keep iterating until the user says it's good. No limit on iterations — the goal is to nail the visual.

---

## Next Step

Load `steps/step-08-specs.md`
