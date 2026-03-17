---
step: "02"
name: "Explore"
workflow: design
agent: designer
---

# Step 02 — Explore

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** ALWAYS present 3 directions minimum. A single proposal is not a choice.
> **CRITICAL:** Directions must be genuinely distinct — not 3 shades of the same vibe.
> **CRITICAL — Rule 1:** User chooses the direction. Le Designer recommends but never decides.
> **CRITICAL:** Validate wireframe structure BEFORE step-03 invests in full mockups.
> **CRITICAL — Anti-slop:** Re-read `data/design/anti-slop-patterns.md` now. Each direction must pass the Signature Test. No NEVER items allowed.

---

## Goal

Create 3+ distinct visual directions with mood boards. User chooses one (or a mix).
Validate the layout structure with low-fidelity wireframes before building full mockups.
Nothing is definitive until the user confirms both the direction AND the wireframes.

---

## Phase 1 — Prepare for exploration

Before creating directions, review:
- Audit findings from step-01: what patterns must change, what must stay
- PRD design requirements (section 8 if defined): any visual constraints or directives
- User types from project-context.md: who will live in this interface daily
- Competitive landscape findings: what to differentiate from, what conventions to respect

These form the design brief that constrains the directions.

---

## Phase 2 — Create 3 visual directions

**Method:** Mood Board (design-methods.csv #7)

Each direction must be:
- **Genuinely distinct** in mood, color, and typography — not the same idea at different intensities
- **Justified** by the project's context (user types, domain, tone)
- **Complete** — color palette, typography, mood description, and design philosophy

For each direction, use this format:

```
DIRECTION {A/B/C} — {direction_name}

Mood: {3-5 descriptive adjectives that define the feeling}
      Example: "Focused · Clinical · Trustworthy · Precise · Low-stimulation"

Color Palette:
  Primary:      #{hex} — {name/role}
  Secondary:    #{hex} — {name/role}
  Accent:       #{hex} — {name/role}
  Background:   #{hex} — {name/role}
  Surface:      #{hex} — {name/role}
  Text:         #{hex} — {name/role}
  Text-muted:   #{hex} — {name/role}
  (verify contrast ratios: WCAG AA minimum = 4.5:1 for normal text)

Typography:
  Headings: {font family} — {weight range used} — {character: geometric/humanist/slab/display}
  Body:     {font family} — {weight range used} — {reason this pairs well with headings}
  Mono:     {font family or 'none'} — {used for: code, data, labels}

Visual language:
  Border radius: {sharp (0) / soft (4-8px) / rounded (12-16px) / pill (9999px)}
  Shadows:       {none / minimal / pronounced / layered depth}
  Borders:       {heavy / light / none / dividers only}
  Density:       {compact / comfortable / spacious}
  Motion:        {instant / subtle / expressive — describe what animates and how}

Signature element:
  {One unique design detail that makes this direction recognizable:
   e.g., "Left-bordered cards as status indicators",
         "Oversized data labels with light weight",
         "Gradient overlays only on interactive states",
         "Monochrome with a single accent color used sparingly"}

Inspired by: {reference products or design movements — be specific, not generic}

Best for: {which user type or use case this serves best, and why}

Accessibility note: {any contrast or readability consideration for this palette}
```

**Direction archetypes to consider** (pick 3 genuinely contrasting ones):

| Archetype | Character |
|-----------|-----------|
| Clinical / Focused | Minimal, high contrast, data-forward, no decorative noise |
| Warm / Human | Organic shapes, warm neutrals, approachable, generous whitespace |
| Bold / Editorial | Strong type hierarchy, intentional asymmetry, confident color |
| Dark / Premium | Dark backgrounds, luminous accents, layered depth, refined |
| Playful / Energetic | Saturated palette, expressive motion, rounded shapes |
| Technical / Industrial | Monospace accents, grid-first, systematic, no-nonsense |
| Soft / Airy | Pastels, generous spacing, light hierarchy, calm |

Do not pick 3 archetypes that are close (e.g., "Warm", "Soft", "Airy" is not a real choice).
Ensure meaningful contrast between directions.

---

## Phase 3 — Present directions and get feedback

```
Here are {N} visual directions for {project_name}:

─────────────────────────────────────────────
DIRECTION A — {name}
{full direction card from Phase 2 format}
─────────────────────────────────────────────
DIRECTION B — {name}
{full direction card from Phase 2 format}
─────────────────────────────────────────────
DIRECTION C — {name}
{full direction card from Phase 2 format}
─────────────────────────────────────────────

My recommendation: Direction {X}
Reason: {specific — tied to the user type, domain, or audit findings.
         Never "because it looks clean" — always a justified argument.}

Which direction speaks to you?
  A — Go with Direction A
  B — Go with Direction B
  C — Go with Direction C
  Mix — Combine elements (tell me what to take from each)
  Explore more — I'll add a Direction D or adjust one
```

**If the user wants a mix:**
Record every element they want from each direction:
- Color palette from: {direction}
- Typography from: {direction}
- Visual language (radius, density) from: {direction}
- Signature element from: {direction}

Merge into a single **Confirmed Direction** document and present it back.

Wait for the user to explicitly confirm the direction before moving to wireframes.

---

## Phase 4 — Low-fidelity wireframes

**Method:** Wireframe Low-Fidelity (design-methods.csv #10)

For the confirmed direction, sketch the layout of **2-3 key screens** in text/ASCII.
Focus on structure and information hierarchy — no visual polish at this stage.

**Which screens to wireframe:**
1. The most visited / most important screen (usually the main dashboard or home)
2. The most complex screen (most UI features from the PRD)
3. A screen that changes significantly from the current UI

**Wireframe format (text):**
Use ASCII to communicate layout intent. Be structural, not decorative.

```
WIREFRAME — {screen_name}
─────────────────────────────────────────
┌────────────────────────────────────────┐
│  NAV: Logo     [{item}] [{item}]  [CTA]│
├────────────────────────────────────────┤
│  ┌──────────────────┐  ┌────────────┐  │
│  │  MAIN CONTENT    │  │  SIDEBAR   │  │
│  │  ─────────────   │  │  [filter]  │  │
│  │  [Card 1]        │  │  [filter]  │  │
│  │  [Card 2]        │  │            │  │
│  │  [Card 3]        │  │  [CTA btn] │  │
│  └──────────────────┘  └────────────┘  │
└────────────────────────────────────────┘
Layout: 2-column, sidebar fixed right, cards stack vertically
Key interactions: card click → detail panel slides in from right
Empty state: placeholder illustration + "Add your first {item}" CTA
```

For each wireframe, note:
- Layout choice (grid, sidebar, tabs, full-page...)
- Key interactions (what happens on click/hover/scroll)
- Empty states and error states (not decorative, structural)
- Mobile behavior (collapses to single column? bottom nav?)

---

## Phase 5 — Present wireframes and confirm

```
Here are wireframes for the 3 key screens:

WIREFRAME 1 — {screen_name}
{ASCII wireframe}
Layout rationale: {why this structure serves the user}

WIREFRAME 2 — {screen_name}
{ASCII wireframe}
Layout rationale: {why this structure}

WIREFRAME 3 — {screen_name}
{ASCII wireframe}
Layout rationale: {why this structure}

Any changes to layout or structure before I build the full mockups?
(This is the right moment — changing structure after mockups is expensive.)
```

Wait for confirmation. Adjust wireframes if needed. Do not proceed to step-03 until
the user explicitly confirms the wireframe structure.

---

## Reflection modes menu

```
Direction confirmed, wireframes validated. Want to check before building mockups?

  REFLECTION MODES
  1. Prisme       — User facettes: does this direction work for End User, Newcomer, Admin?
  2. Table Ronde  — Debate the direction with Le Stratège
                    (does it align with the product positioning in the PRD?)

  ─────────────────────────────────────────
  S. Save and build mockups (step-03)
```

---

## Transition

```
Step 02 complete.

Visual direction confirmed: {direction_name}
  Colors: {N} tokens defined
  Typography: {heading_font} / {body_font}
  Visual language: {radius}, {density}, {motion}

Wireframes confirmed:
  - {screen_1}
  - {screen_2}
  - {screen_3}

→ Step 03 — I'll now build the full HTML mockups.
  One standalone HTML file per key screen.
  Design tokens as CSS variables — no hardcoded values.
```

Update `hk-up-status.yaml`: `7-1-audit-exploration → step-02: done`
Proceed to **step-03-mockup.md**
