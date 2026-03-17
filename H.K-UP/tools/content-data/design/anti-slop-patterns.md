# Anti-AI-Slop Design Patterns

> **Load this file at the start of the design workflow AND re-read at the start of each step.**
> These patterns are NON-NEGOTIABLE. Every mockup, direction, and design decision must pass these checks.

---

## The Problem

AI-generated interfaces converge on the same generic aesthetic: Inter font, purple gradients,
white backgrounds, evenly-spaced cards, `opacity: 0.7` hover states, and predictable layouts.
This is "AI slop" — technically correct but instantly forgettable.

H.K-UP design must be **distinctive, intentional, and memorable**.

---

## NEVER List — Banned Patterns

### Typography
- NEVER use Inter, Roboto, Arial, Helvetica, or system-ui as the primary font
- NEVER use the same font family for headings and body (pair a display font with a body font)
- NEVER default to 16px/1.5 for everything — create a deliberate type scale with contrast
- NEVER converge on trending AI-favorites (Space Grotesk, Outfit, Plus Jakarta Sans)

### Colors
- NEVER use purple-on-white as the default color scheme (`#6366f1`, `#8b5cf6`, indigo-*)
- NEVER distribute colors evenly — use a dominant color with sharp accents
- NEVER use gray-100 through gray-900 as the only neutral palette
- NEVER use the same palette across different projects — each project has its own identity

### Layout
- NEVER create 3 identical cards side by side with the same content length
- NEVER use perfectly symmetrical grids for everything
- NEVER make every section the same height with the same padding
- NEVER stack everything vertically on mobile without rethinking the hierarchy

### Interactions
- NEVER use `opacity: 0.7` or `opacity: 0.8` as the only hover effect
- NEVER use `transform: scale(1.05)` as the only hover animation
- NEVER use generic `transition: all 0.3s ease` on everything
- NEVER leave focus states as the browser default blue outline without replacement

### Visual
- NEVER use solid white (#fff) or solid black (#000) as the only background options
- NEVER use box-shadow as the only depth mechanism
- NEVER create empty, flat surfaces without texture or atmosphere
- NEVER use the same border-radius everywhere (vary by component purpose)

---

## ALWAYS List — Required Patterns

### Typography
- ALWAYS choose fonts with CHARACTER — distinctive display fonts that create identity
- ALWAYS pair fonts intentionally: one for headings (personality), one for body (readability)
- ALWAYS create visual hierarchy through size, weight, AND spacing — not just size
- ALWAYS vary between projects — if the last project used a geometric sans, use a humanist or serif next

### Colors
- ALWAYS commit to a dominant color and use it confidently — not sprinkled timidly
- ALWAYS verify contrast ratios (WCAG AA 4.5:1 for text) — accessibility is a constraint, not an afterthought
- ALWAYS define colors as CSS variables (design tokens) — zero hardcoded hex values in components
- ALWAYS create distinct states: default, hover, focus, active, disabled — each visually different

### Layout
- ALWAYS create a SIGNATURE element — one unique visual detail that makes the design recognizable
- ALWAYS vary content in repeated elements (different text lengths, different data, different states)
- ALWAYS consider the FLOW — where does the eye go first? second? third?
- ALWAYS design empty states and error states as first-class screens (not afterthoughts)

### Interactions
- ALWAYS design hover states that REVEAL something (information, color, movement) — not just dim
- ALWAYS use `focus-visible` for keyboard navigation with a custom focus ring
- ALWAYS animate with purpose — entrance reveals, state changes, feedback — not decoration
- ALWAYS define transition durations as tokens (--duration-fast, --duration-normal, --duration-slow)

### Visual Depth
- ALWAYS create atmosphere — subtle gradients, noise textures, layered transparencies, or grain
- ALWAYS use elevation intentionally — cards lift, modals float, dropdowns emerge
- ALWAYS consider the BACKGROUND — it sets the mood (warm, cool, dark, textured)
- ALWAYS add at least ONE unexpected visual detail per screen (a border treatment, a gradient angle, an icon style)

---

## The Signature Test

Before presenting any mockup, ask:

1. **"Could this be ANY app?"** — If yes, it lacks identity. Add the project's signature.
2. **"Would I screenshot this?"** — If no, it's not distinctive enough. Push further.
3. **"Is this the same as last time?"** — If yes, you're converging. Break the pattern.
4. **"Does every screen have the signature element?"** — If no, the design lacks cohesion.

---

## Brownfield Adaptation

When redesigning an existing interface:
- Study what the CURRENT design does well — don't discard everything
- Identify the existing "visual DNA" — colors, shapes, spacing that users recognize
- Evolve the identity rather than replacing it (unless the user explicitly wants a full redesign)
- Keep the signature element CONSISTENT with the project's existing personality
- New components should feel like they BELONG in the existing interface, not imported from a template

---

## Per-Step Reminders

### Step 01 — Audit
When evaluating the existing UI, note specifically:
- Which patterns are generic/AI-slop vs intentionally designed
- What is the current "signature" (if any)
- Which typography and color choices have character vs which are defaults

### Step 02 — Explore
When creating visual directions:
- Each direction must have a GENUINELY DIFFERENT aesthetic — not 3 shades of the same vibe
- Each direction must name its signature element explicitly
- Verify: would each direction pass the Signature Test above?

### Step 03 — Mockup
Before presenting each mockup, run the full NEVER list as a checklist.
Every NEVER item that is violated must be fixed before showing the mockup.

### Step 04 — Validate
During the final checkup, verify anti-slop compliance across ALL mockups:
- Consistent signature element across screens
- No NEVER items in any mockup
- Typography and color choices are distinctive (not defaults)
