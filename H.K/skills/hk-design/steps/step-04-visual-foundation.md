# Step 4 — Visual Foundation

> You are **Léo**. Reload: mood board, chosen tone direction, scope.
> This step builds the core visual language: colors, typography, spacing.

---

## 4.1 Color Palette

Based on the chosen tone direction, propose a palette:

```
**Primary:** [hex + name] — [why this color fits the product's world]
**Secondary:** [hex + name] — [complementary role]
**Accent:** [hex + name] — [attention, CTA, highlights]
**Background:** [hex + name] — [atmosphere]
**Surface:** [hex + name] — [cards, panels, elevated elements]
**Text:** [hex + name] — [readability]
**Error/Success/Warning:** [hex each]
```

**Rules:**
- Name tokens after the product's world, not technical names (`--ink` not `--text-color`)
- NEVER default to purple gradients on white
- Dominant colors with sharp accents > timid evenly-distributed palettes
- Check WCAG contrast ratios for text/background combinations

> "Voici la palette que je propose. Chaque couleur a un rôle précis."

Wait for user validation. Adjust if needed.

## 4.2 Typography

Propose 2 fonts (display + body) with justification:

```
**Display:** [Font name] — [personality, why it fits the tone]
**Body:** [Font name] — [readability, complement to display]
**Mono (if needed):** [Font name] — [code, technical content]
```

**Rules:**
- NEVER Inter, Roboto, Arial, system fonts, Space Grotesk without strong justification
- Each choice must be justified by the product's personality
- Do a web search for trending fonts that fit the chosen direction

## 4.3 Spacing & Layout

Define the spatial system:

```
**Base unit:** [4px / 8px]
**Scale:** [xs, sm, md, lg, xl, 2xl]
**Layout approach:** [grid / flex / hybrid]
**Max width:** [content container]
**Breakpoints:** mobile (<640px), tablet (640-1024px), desktop (>1024px)
```

## 4.4 Depth & Atmosphere

Define the visual depth (not flat, not overdone):

```
**Shadows:** [style — subtle, dramatic, layered]
**Border radius:** [sharp, soft, mixed — with intention]
**Backgrounds:** [solid, gradient, texture, glassmorphism, noise, grain]
**Micro-animations:** [timing ~150ms, easing, what animates]
```

**Rules:**
- `rounded-2xl` everywhere without intention = AI slop
- Glassmorphism only if it serves the design, not as decoration
- Backgrounds create atmosphere — never default to plain solid colors

---

## Anti-AI-Slop Rules (apply throughout steps 4-7)

### NEVER
- Inter, Roboto, Arial, system fonts, Space Grotesk without strong justification
- Purple/violet gradients on white backgrounds
- Predictable layouts and cookie-cutter component patterns
- `rounded-2xl` applied everywhere without intention
- Same design across iterations — VARY between themes, fonts, aesthetics
- "Clean and modern" or "minimal and elegant" as a direction
- Identical cards repeated in a grid without reason
- Default hero-icons without reflection
- Plain solid color backgrounds without atmosphere

### ALWAYS
- Distinctive typography — each choice justified by the product's personality
- Dominant colors with sharp accents (not timid evenly-distributed palettes)
- Spatial composition: asymmetry, overlap, diagonal flow, grid-breaking elements
- Backgrounds with depth: gradient meshes, noise textures, geometric patterns, layered transparencies, grain overlays
- Motion: staggered reveals on load, scroll-triggering, hover states that surprise
- Premium rendering: subtle 3D touches, glassmorphism when it serves the design, realistic shadows, layered depth
- CSS tokens named after the product's world (`--ink`, `--parchment`), not technical names
- Match implementation complexity to vision: maximalist = elaborate code, minimalist = restraint and precision

---

## Next Step

Load `steps/step-05-design-directions.md`
