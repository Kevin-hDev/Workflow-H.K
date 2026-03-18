---
step: "01"
name: "Audit"
workflow: design
agent: designer
---

# Step 01 — Audit

> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL — Rule 2:** Audit the existing UI before proposing ANYTHING. Never design blind.
> **CRITICAL:** If Playwright MCP is available, take screenshots FIRST before reading code.
> **CRITICAL:** Apply ALL 10 Nielsen heuristics. Don't skip the ones that seem obvious.
> **CRITICAL — Rule 1:** Present findings to the user and wait for confirmation before step-02.
> **CRITICAL — Anti-slop:** Re-read `data/design/anti-slop-patterns.md` now. Note which existing UI patterns are generic AI-slop vs intentionally designed.

---

## Goal

Understand the existing UI before proposing anything. Capture the current state with
screenshots or code reading. Evaluate usability with Nielsen's 10 heuristics. Scan the
competitive landscape. Surface patterns worth keeping and problems that must change.

---

⛔ STOP CHECK
- data/global-rules.md READ (not just listed)? [YES/NO]
- data/design-methods.csv READ (not just listed)? [YES/NO]
- data/design/anti-slop-patterns.md READ (not just listed)? [YES/NO]
- {output_folder}/project-context.md READ? [YES/NO]
- {output_folder}/prd.md READ (UI features identified)? [YES/NO]
- Ready to proceed with UI audit? [YES/NO]

⛔ STOP CONDITION: If any check = NO → Go back and READ the file contents before continuing.

---

## Phase 1 — Capture the current state

**If Playwright MCP is available:**
Take screenshots of every key screen. Prioritize:
- Homepage / landing
- Main user flow screens (from project-context.md user types)
- Error states and empty states
- Navigation patterns (menu, sidebar, breadcrumbs)
- Forms and interactive elements
- Mobile breakpoints if applicable

**If Playwright MCP is not available:**
Read the UI source code to understand the current look:
- Component files (`.jsx`, `.vue`, `.svelte`, `.html`, `.erb`, etc.)
- CSS / stylesheet files (look for design values: colors, fonts, spacing)
- Layout files and templates
- Any existing design tokens or theme files

**Inventory all screens/views:**

```
SCREENS INVENTORY
  {screen_name}     — {what it does, who uses it}
  {screen_name}     — {what it does, who uses it}
  ...
```

**Identify the current tech stack:**
- CSS framework? (Tailwind, Bootstrap, plain CSS, SCSS...)
- Component library? (shadcn, MUI, Chakra, custom...)
- Design tokens already present? (CSS variables, theme files...)
- Animation library? (Framer Motion, GSAP, CSS transitions...)

---

## Phase 2 — Heuristic Evaluation (Nielsen's 10)

Apply each heuristic systematically. Score 1-5 (1 = major problem, 5 = no issues).
Note one specific observation per heuristic — not a generic comment.

**Method:** Heuristic Evaluation (design-methods.csv #3)

```
HEURISTIC EVALUATION

  1. Visibility of system status
     Score: {1-5}
     Observation: {what the UI does or fails to do — specific screen/element}

  2. Match between system and real world
     Score: {1-5}
     Observation: {specific example of language or mental model alignment/mismatch}

  3. User control and freedom
     Score: {1-5}
     Observation: {can users undo? cancel? escape dead ends?}

  4. Consistency and standards
     Score: {1-5}
     Observation: {are patterns consistent across the app? any platform convention violations?}

  5. Error prevention
     Score: {1-5}
     Observation: {does the UI prevent errors before they happen? confirmation dialogs?}

  6. Recognition rather than recall
     Score: {1-5}
     Observation: {are options visible? does the user have to remember things?}

  7. Flexibility and efficiency of use
     Score: {1-5}
     Observation: {shortcuts for power users? or one-size-fits-all?}

  8. Aesthetic and minimalist design
     Score: {1-5}
     Observation: {is there visual noise? irrelevant information competing for attention?}

  9. Help users recognize, diagnose, and recover from errors
     Score: {1-5}
     Observation: {are error messages plain-language? do they suggest solutions?}

  10. Help and documentation
      Score: {1-5}
      Observation: {is the interface self-explaining? where does documentation fail?}

  Overall: {average}/5
  Critical issues (score 1-2): {list}
```

---

## Phase 3 — Competitive UI Audit

**Method:** Competitive UI Audit (design-methods.csv #2)

Search for 3-5 direct competitors or reference interfaces in the same domain.

**Search pattern:**
- `"{domain} best interface design {year}"`
- `"{competitors} app UI design"`
- `"best {app_type} UX {year}"`

For each competitor or reference:

```
  {Competitor / Reference name}
  URL or description: {link or "described below"}
  What they do well: {specific — layout, interaction, visual hierarchy, onboarding...}
  What's weak: {honest observation}
  What's missing: {gap or opportunity}
  Relevant for us: {what we could adapt or react against}
```

Aim for diversity: one "industry standard", one "innovative outlier", one "aspirational reference"
outside the domain (a product known for exceptional UX).

---

## Phase 4 — Present findings

Present in this exact format:

<output-format>
UI AUDIT — {project_name}

SCREENS INVENTORY
  {screen_1} — {description}
  {screen_2} — {description}
  {count} screens total

CURRENT TECH
  CSS: {framework or plain}
  Components: {library or custom}
  Design tokens: {yes / no / partial}

HEURISTIC EVALUATION
  1. Visibility of system status:     {score}/5 — {key observation}
  2. Match with real world:           {score}/5 — {key observation}
  3. User control and freedom:        {score}/5 — {key observation}
  4. Consistency and standards:       {score}/5 — {key observation}
  5. Error prevention:                {score}/5 — {key observation}
  6. Recognition over recall:         {score}/5 — {key observation}
  7. Flexibility and efficiency:      {score}/5 — {key observation}
  8. Aesthetic and minimalist:        {score}/5 — {key observation}
  9. Error recovery:                  {score}/5 — {key observation}
  10. Help and documentation:         {score}/5 — {key observation}
  Overall: {average}/5

STRENGTHS TO KEEP
  - {pattern or convention worth preserving — be specific}
  - {well-functioning interaction or layout to build on}

PROBLEMS TO FIX
  - {issue_1} — severity: high/medium/low — heuristic: {N}
  - {issue_2} — severity: high/medium/low — heuristic: {N}

COMPETITIVE LANDSCAPE
  - {reference_1}: {what they do better than us}
  - {reference_2}: {interesting pattern to consider}
  - {reference_3}: {aspirational UX benchmark}

ACCESSIBILITY BASELINE
  {current state: any ARIA, semantic HTML, color contrast issues spotted?}

  1. Confirm — move to visual directions
  2. Adjust — correct or add something first
</output-format>

Wait for user confirmation. Adjust if they correct or add anything.

---

## Reflection modes menu

<output-format>
Step 01 complete. Want to look at the existing UI from specific angles?

  REFLECTION MODES
  1. Prisme — User facettes: review the audit from the perspective of:
              End User | Newcomer | Power User | Frustrated User | Admin
  2. Simulation — User Journey: walk through one key user flow step by step
                  and note friction points

  ─────────────────────────────────────────
  S. Save and explore visual directions (step-02)
</output-format>

**Before executing any mode above, LOAD its data file:**
- Prisme → LOAD `data/modes/prisme.md` + `data/prisme-facettes.csv`
- Simulation → LOAD `data/modes/simulation.md`

---

## Transition

<output-format>
Step 01 complete.

Screens audited: {count}
Heuristic score: {average}/5
Critical issues identified: {count}
Competitive references: {count}

→ Step 02 — I'll now explore 3+ visual directions.
  Each direction will be a distinct mood with palette, typography, and vibe.
  You'll choose before I produce any mockup.
</output-format>

Update `hk-up-status.yaml`: `7-1-audit-exploration → step-01: done`
Proceed to **step-02-explore.md**
