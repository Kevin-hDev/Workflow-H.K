---
step: "03"
name: "Mockup"
workflow: design
agent: designer
---

# Step 03 — Mockup

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** Zero hardcoded values. Every color, size, and font goes through a CSS variable.
> **CRITICAL:** Mockups must be openable directly in a browser — no build step, no CDN, no imports.
> **CRITICAL:** Anti-AI-slop: use the confirmed palette and typography. No Inter/gray/purple defaults.
> **CRITICAL — Rule 1:** User validates each mockup before the next one is built.
> **CRITICAL — Anti-slop:** Re-read `data/design/anti-slop-patterns.md` now. Run the full NEVER list as a checklist before presenting each mockup.

---

## Goal

Build the confirmed direction into real standalone HTML mockups. Define the complete
design token system first. Then produce one file per key screen, with ARIA, responsive
behavior, and hover states. Write spec-design.md as you go.

---

## Phase 1 — Define design tokens

**Method:** Design Tokens (design-methods.csv #6)

Before writing a single line of mockup HTML, define every token as a CSS custom property.
These become the single source of truth for Le Chirurgien.

**Token structure:**

```css
:root {
  /* ─── COLORS ─────────────────────────────── */
  --color-primary:          {hex};   /* {role: e.g., "primary action, links"} */
  --color-primary-hover:    {hex};   /* {5-10% darker than primary} */
  --color-secondary:        {hex};   /* {role} */
  --color-accent:           {hex};   /* {role: used sparingly for signature element} */
  --color-bg:               {hex};   /* {page background} */
  --color-surface:          {hex};   /* {card, panel, modal backgrounds} */
  --color-surface-hover:    {hex};   /* {hover state for surface elements} */
  --color-border:           {hex};   /* {dividers, input borders} */
  --color-text:             {hex};   /* {body text — verify 4.5:1 contrast on --color-bg} */
  --color-text-muted:       {hex};   /* {secondary text — verify 4.5:1 contrast} */
  --color-text-inverse:     {hex};   /* {text on dark/primary backgrounds} */
  --color-error:            {hex};   /* {error states} */
  --color-success:          {hex};   /* {success states} */
  --color-warning:          {hex};   /* {warning states} */

  /* ─── TYPOGRAPHY ─────────────────────────── */
  --font-heading:   '{Heading Font}', {fallback stack};
  --font-body:      '{Body Font}', {fallback stack};
  --font-mono:      '{Mono Font}', monospace;  /* or omit if unused */

  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */
  --text-4xl:  2.25rem;    /* 36px */

  --weight-regular: 400;
  --weight-medium:  500;
  --weight-semibold: 600;
  --weight-bold:    700;

  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* ─── SPACING (4px base) ─────────────────── */
  --space-1:  0.25rem;   /*  4px */
  --space-2:  0.5rem;    /*  8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */

  /* ─── SHAPE ──────────────────────────────── */
  --radius-sm:   {from confirmed visual language};
  --radius-md:   {from confirmed visual language};
  --radius-lg:   {from confirmed visual language};
  --radius-full: 9999px;  /* pill / avatar */

  /* ─── SHADOWS (elevation levels) ─────────── */
  --shadow-sm:  {subtle lift for cards};
  --shadow-md:  {dropdown menus, popovers};
  --shadow-lg:  {modals, drawers};
  --shadow-xl:  {dialogs, overlays};

  /* ─── TRANSITIONS ────────────────────────── */
  --duration-fast:   150ms;
  --duration-normal: 250ms;
  --duration-slow:   400ms;
  --ease-default:    cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce:     cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Contrast verification (mandatory before any mockup):**
- `--color-text` on `--color-bg` → must be ≥ 4.5:1 (WCAG AA)
- `--color-text-muted` on `--color-bg` → must be ≥ 4.5:1
- `--color-text-inverse` on `--color-primary` → must be ≥ 4.5:1
- `--color-text` on `--color-surface` → must be ≥ 4.5:1

State contrast ratios in the token block as comments if they are borderline.

---

## Phase 2 — Build HTML mockups

**Method:** Wireframe Low-Fidelity → High-Fidelity (design-methods.csv #10, applied)

One standalone HTML file per key screen defined in step-02 wireframes.
Add screens for any remaining UI features from the PRD not yet covered.

**Mockup requirements (non-negotiable):**

| Requirement | Rule |
|-------------|------|
| Standalone | Opens in browser with no server, no CDN, no external URL |
| Tokens only | Zero hardcoded hex, px, or font name outside `:root` |
| Semantic HTML | `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>` — not all `<div>` |
| ARIA | Labels on icon buttons, roles on custom widgets, `aria-current` on active nav |
| Hover/focus states | Every interactive element has `:hover` and `:focus-visible` |
| Responsive | At minimum: mobile breakpoint (`@media (max-width: 640px)`) |
| Real content | Realistic placeholder data — no "Lorem ipsum", no "User Name", no "Button" |
| Signature element | The confirmed direction's signature is visible on every screen |

**Anti-AI-slop checklist (verify before presenting each mockup):**
- [ ] Typography is the confirmed choice (not system-ui or Inter by default)
- [ ] Color palette uses only tokens — no `#6366f1`, no `gray-100`, no inline styles
- [ ] Cards have varied content — not 3 identical copies with same text length
- [ ] Spacing creates hierarchy — not everything equidistant
- [ ] Interactive states are designed — not just `opacity: 0.7` on hover
- [ ] The signature element from the confirmed direction appears at least once
- [ ] Mobile layout is considered — not just "everything stacks"

**Mockup file structure:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Screen Name} — {Project Name}</title>
  <style>
    /* ─── TOKENS ─────────────────────────────────── */
    :root {
      /* paste full token block here */
    }

    /* ─── RESET ──────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-body);
      background: var(--color-bg);
      color: var(--color-text);
      line-height: var(--leading-normal);
    }

    /* ─── LAYOUT ─────────────────────────────────── */
    /* ... */

    /* ─── COMPONENTS ─────────────────────────────── */
    /* ... */

    /* ─── STATES ─────────────────────────────────── */
    /* ... */

    /* ─── RESPONSIVE ─────────────────────────────── */
    @media (max-width: 640px) {
      /* ... */
    }
  </style>
</head>
<body>
  <!-- {screen content} -->
</body>
</html>
```

**Save each mockup as:** `{output_folder}/mockups/{screen-name}.html`

---

## Phase 3 — Write spec-design.md (draft)

As each mockup is built, document the design decisions for Le Chirurgien.

```markdown
---
version: "1.0-draft"
date: {date}
agent: Le Designer
status: draft
---

# Design Specification — {project_name}

## Design Direction

**Name:** {direction_name}
**Mood:** {adjectives from step-02}
**Philosophy:** {one paragraph: what this design is trying to achieve and why}

## Design Tokens

```css
{complete :root block from Phase 1}
```

### Token usage guide

| Token | Value | Use when |
|-------|-------|----------|
| `--color-primary` | {hex} | Primary CTAs, links, active states |
| `--color-accent` | {hex} | {when to use the accent sparingly} |
| `--space-4` | 1rem | Base spacing unit — default padding for cards |
| ... | ... | ... |

## Components

{For each reusable component identified in the mockups:}

### {Component Name}

**Structure:** {semantic HTML element(s) used}
**States:** default | hover | focus | active | disabled | loading
**CSS classes:** `.{component-class}` (usage)
**ARIA pattern:** {role, aria-label, aria-expanded, etc.}
**Signature element:** {how the confirmed direction's signature appears here}

## Screens

{For each mockup:}

### {Screen Name} — `mockups/{screen-name}.html`

**Layout:** {describe the grid/flex structure}
**Key interactions:**
  - {interaction_1}: {what happens}
  - {interaction_2}: {what happens}
**Empty state:** {what the screen shows with no data}
**Error state:** {how errors are presented}
**Responsive behavior:** {what changes on mobile}

## Accessibility

**WCAG level:** 2.1 AA
**Contrast ratios verified:**
  | Pair | Ratio | Pass |
  |------|-------|------|
  | --color-text on --color-bg | {N}:1 | ✓ |
  | --color-text-muted on --color-bg | {N}:1 | ✓ |
  | --color-text-inverse on --color-primary | {N}:1 | ✓ |
**Keyboard navigation:** {tab order description for key flows}
**Screen reader notes:** {any non-obvious ARIA patterns used}

## Motion

**Philosophy:** {how animation serves the UX — not decorative]
| Element | Trigger | Duration | Easing |
|---------|---------|----------|--------|
| {element} | {hover/enter/exit} | var(--duration-fast) | var(--ease-default) |
```

---

## Phase 4 — Present mockups to user

For each mockup, either:
- Use Playwright MCP to screenshot the HTML file and show the result
- Or describe the screen in detail if screenshots are unavailable

<output-format>
Here is the mockup for {screen_name}:

{screenshot or detailed description}

Notable details:
  - {signature element implementation}
  - {accessibility feature}
  - {responsive behavior}

Validated? Or adjustments needed?

  1. Validate
  2. Adjust
</output-format>

Wait for confirmation per mockup. Do not build the next mockup until the current one is validated.

---

## Reflection modes menu

<output-format>
Mockups built. Want to review before the final checkup?

  REFLECTION MODES
  1. Prisme   — Walk through each mockup as End User | Newcomer | Power User
                (does the interface serve each user type?)

  ─────────────────────────────────────────
  S. Save and run the final validation (step-04)
</output-format>

**Before executing any mode above, LOAD its data file:**
- Prisme → LOAD `data/modes/prisme.md` + `data/prisme-facettes.csv`

---

## Transition

<output-format>
Step 03 complete.

Design tokens defined: {count} CSS variables
Mockups built: {count} HTML files
spec-design.md saved (draft)
Components documented: {count}

→ Step 04 — Final checkup: every UI feature from the PRD
  must have a corresponding mockup. Blocking gate.
</output-format>

Update `hk-up-status.yaml`: `7-2-mockups-specs → step-03: done`
Proceed to **step-04-validate.md**
