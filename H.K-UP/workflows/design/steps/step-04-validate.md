---
step: "04"
name: "Validate"
workflow: design
agent: designer
---

# Step 04 — Validate

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL — Rule 4:** The PRD checkup is BLOCKING. 100% UI feature coverage required before handoff.
> **CRITICAL:** Accessibility verification is not optional — WCAG AA failures block the handoff.
> **CRITICAL — Rule 10:** Announce handoff explicitly — agent, files transmitted, implementation order.
> **CRITICAL — Rule 1:** Final user confirmation required before marking this workflow complete.
> **CRITICAL — Anti-slop:** Re-read `data/design/anti-slop-patterns.md` now. Verify anti-slop compliance across ALL mockups before handoff.

---

## Goal

Run the blocking checkup: every UI feature from the PRD must have a mockup. Verify accessibility.
Finalize spec-design.md. Hand off to Le Chirurgien (or to L'Architecte if Design path).

---

## Phase 1 — Blocking checkup: PRD UI features vs mockups

**Method:** Accessibility Audit WCAG (design-methods.csv #4) — applied partially here

Pull every UI feature from `prd.md` (sections 3, 4, 5 — features with any visual component).
For the Express path, pull UI objectives from `project-context.md`.

Use this exact format:

```
Design Checkup — PRD UI Features vs Mockups

  UI Feature                             Mockup                    Covered?
  ────────────────────────────────────   ───────────────────────   ─────────
  F1 — {feature name with UI aspect}     mockups/{file}.html       ✓
  F2 — {feature name with UI aspect}     mockups/{file}.html       ✓
                                         (section: {describe})
  F3 — {feature name with UI aspect}     mockups/{file}.html       ✓
  F5 — {feature — UI missing}            —                         ✗ MISSING
  F7 — {non-UI feature}                  N/A — no UI component     —

  UI features: {N}/{total features} have UI components
  Covered:     {M}/{N} UI features have a mockup
  Missing:     {count}
```

**If anything is MISSING:**
1. Build the missing mockup (or add the feature to an existing screen)
2. Update spec-design.md with the new screen/component
3. Re-run the checkup table
4. Do not proceed until coverage reaches 100%

**Features with no UI component** (pure backend, data, logic) → mark as `N/A`. Do not count
them as missing — they are not Le Designer's responsibility.

---

## Phase 2 — Accessibility verification

**Method:** Accessibility Audit WCAG (design-methods.csv #4)

For each mockup, verify these 5 points:

```
Accessibility Audit — {screen_name}

  1. Color contrast
     [ ] Body text (--color-text on --color-bg): {ratio}:1 {✓ ≥4.5 | ✗ fails AA}
     [ ] Muted text (--color-text-muted on --color-bg): {ratio}:1 {✓ ≥4.5 | ✗ fails AA}
     [ ] Primary button text (--color-text-inverse on --color-primary): {ratio}:1 {✓ | ✗}
     [ ] Any text on --color-surface: {ratio}:1 {✓ | ✗}

  2. Semantic HTML
     [ ] Page has a single <main> landmark
     [ ] Navigation uses <nav> with aria-label
     [ ] Headings follow logical hierarchy (h1 → h2 → h3)
     [ ] Images have alt text (or aria-hidden if decorative)

  3. Interactive elements
     [ ] All buttons have accessible names (text content or aria-label)
     [ ] Icon-only buttons have aria-label
     [ ] Links have descriptive text (not "click here")
     [ ] Form inputs have associated <label> elements

  4. Keyboard navigation
     [ ] All interactive elements are reachable by Tab
     [ ] Focus indicator is visible (not removed by outline: none without replacement)
     [ ] Modal/drawer traps focus while open
     [ ] Logical tab order matches visual layout

  5. Dynamic content
     [ ] Loading states are announced (aria-live or aria-busy)
     [ ] Error messages are associated with the input that triggered them
     [ ] Toast/notification uses role="alert" or aria-live="polite"
```

**Blocking accessibility failures** (must fix before handoff):
- Contrast ratio below 4.5:1 for normal text
- Interactive elements with no accessible name
- Missing `<main>` landmark
- Focus indicator completely removed

**Non-blocking warnings** (document in spec-design.md, fix in implementation):
- Sub-optimal heading hierarchy
- Verbose but functional ARIA
- Missing skip-to-content link (important but can be added in implementation)

---

## Phase 3 — Finalize spec-design.md

Update the draft from step-03 with the checkup results and accessibility audit:

1. Change `status: draft` → `status: final`
2. Add a **Checkup Results** section:

```markdown
## Checkup Results

### PRD UI Feature Coverage
{N}/{N} UI features covered — 100% ✓

### Accessibility Audit
WCAG 2.1 AA: ✓ All screens pass

Verified contrast ratios:
  {complete table from Phase 2}

Known limitations (to address in implementation):
  - {non-blocking warning 1}
  - {non-blocking warning 2}
```

3. Save the final version as `{output_folder}/spec-design.md`.

---

## Phase 4 — User confirmation

Present the final state before handoff:

```
Design workflow complete.

CHECKUP RESULTS
  UI feature coverage: {N}/{N} — 100% ✓
  WCAG 2.1 AA: ✓ Passed
  Blocking issues: 0

DELIVERABLES
  spec-design.md     — {count} tokens, {count} components, {count} screens documented
  mockups/           — {count} standalone HTML files

  Mockup list:
  - {screen_1}: {brief description}
  - {screen_2}: {brief description}
  - ...

Ready to hand off. Is this the design you want Le Chirurgien to implement?

  1. Yes — proceed to implementation
  2. Adjust {specific element} first
```

Wait for the user's confirmation.

---

## Phase 5 — Handoff

**Determine the next agent based on the path:**

| Path | Next step |
|------|-----------|
| **Design path** | Hand off to L'Architecte → Architecture workflow |
| **Standard / Full path** | Hand off to Le Chirurgien → Dev workflow |

**Announce the handoff:**

```
Design validated. Handing off to {Le Chirurgien | L'Architecte}.

  spec-design.md saved (final).
  Mockups: {count} HTML files in {output_folder}/mockups/
  Design tokens: {count} CSS variables
  UI feature coverage: {N}/{N} — 100% ✓
  Accessibility: WCAG 2.1 AA ✓

  WHAT {NEXT AGENT} RECEIVES
  ├── spec-design.md        — complete design specification + token system
  ├── mockups/{screen}.html — visual reference per screen (standalone, no build)
  ├── architecture.md       — technical context (Standard/Full path)
  └── prd.md                — feature list and acceptance criteria

  IMPLEMENTATION ORDER (recommended for Le Chirurgien)
  1. Set up CSS token system (copy :root from spec-design.md)
  2. Build shared components first (nav, buttons, cards, forms)
  3. Implement screens in this order: {order based on dependencies from plan.md}

  → {Dev Workflow — Le Chirurgien | Architecture Workflow — L'Architecte}
```

---

## Reflection modes menu

This menu is offered after Phase 3 (finalized spec) but before user confirmation in Phase 4.

```
Spec finalized. One last look?

  REFLECTION MODES
  1. Prisme   — Final walk-through from End User + Newcomer perspective
  2. Simulation — User Journey: simulate a full key flow through the mockups

  ─────────────────────────────────────────
  S. Confirm and hand off
```

---

## Transition

```
Step 04 complete. Design workflow done.

spec-design.md:  finalized
mockups/:        {count} HTML files
Coverage:        {N}/{N} UI features ✓
Accessibility:   WCAG 2.1 AA ✓

→ {Dev Workflow — Le Chirurgien | Architecture Workflow — L'Architecte}
  Implementation starts with: CSS token setup → shared components → screens
```

Update `hk-up-status.yaml`:
- `7-2-mockups-specs → done`
- `phase-7-design → done`
