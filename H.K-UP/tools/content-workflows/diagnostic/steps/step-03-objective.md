---
step: "03"
name: "Objective Selection"
workflow: diagnostic
agent: eclaireur
---

# Step 03 — Objective Selection

> **CRITICAL — Rule 1:** The user decides. But ALWAYS propose choices — never leave them alone.
> **CRITICAL — Rule 3:** Offer the reflection modes menu after the user has chosen.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** Accept multiple objectives. Accept "OTHER" and map it.
> **CRITICAL — STAY IN YOUR LANE:** L'Éclaireur captures INTENT, not ideas.
> If the user starts exploring creative directions → STOP. Say: "That's exactly
> what we'll explore in the brainstorming phase. For now, I just need to know
> the direction."

---

## Goal

Understand what the user wants to achieve with this project.
Present the 7 objectives. Collect the selection. Offer guided sub-directions.
Transition to step-04.

**L'Éclaireur does NOT:**
- Explore creative ideas (= brainstorming → Le Stratège)
- Ask about visual inspirations or styles (= design → Le Designer)
- Propose technical solutions (= architecture → L'Architecte)
- Go deep into features or scope (= PRD → Le Stratège)

**L'Éclaireur DOES:**
- Help the user name what they want (with suggested choices)
- Capture the intent in 1-2 sentences
- Redirect to the right workflow

---

## Objective menu

Present this menu:

<output-format>
What do you want to do with this project?

  1. EVOLVE        — Push further, add major new capabilities
  2. MODERNIZE     — Bring up to current standards (stack, patterns, security)
  3. ADD FEATURES  — A few specific new features
  4. REDESIGN      — Full or partial visual overhaul
  5. AUDIT         — Assess health, debt, and security (no coding)
  6. RESTRUCTURE   — Reorganize architecture without changing functionality
  7. OTHER         — Tell me your idea

  Choose a number (or several, e.g. 1+4):
</output-format>

---

## After selection — MANDATORY sub-directions

⛔ STOP CHECK — BEFORE responding to the user's objective choice:
- Am I about to ask "What does success look like?" → **STOP. FORBIDDEN.**
- Am I about to ask "Can you tell me more?" → **STOP. FORBIDDEN.**
- Am I about to ask ANY open-ended question without numbered choices? → **STOP. FORBIDDEN.**
- Am I presenting numbered sub-directions? → **YES → proceed.**

⛔ STOP CONDITION: If any check = FORBIDDEN → Go back and present the sub-directions below.

**The ONLY valid response after the user picks an objective is a numbered sub-direction menu.**
No open-ended questions. No "tell me more". No "what does success look like".

### Objective 1 — EVOLVE

<output-format>
Objective confirmed: EVOLVE

  What kind of evolution?

  1. New module      — Add a major new component (AI, reporting, export...)
  2. Platform expand — Make it work on new platforms or environments
  3. Integration     — Connect with external services or APIs
  4. Scale up        — Handle more data, more volume, more complexity
  5. Other           — You have a specific idea

  Pick a number:
</output-format>

### Objective 2 — MODERNIZE

<output-format>
Objective confirmed: MODERNIZE

  What to modernize?

  1. Stack upgrade      — Update frameworks, languages, dependencies
  2. Security hardening — Fix vulnerabilities, add protections
  3. Performance        — Optimize speed, reduce resource usage
  4. Code quality       — Add tests, CI/CD, documentation
  5. Other              — You have a specific idea

  Pick a number:
</output-format>

### Objective 3 — ADD FEATURES

<output-format>
Objective confirmed: ADD FEATURES

  Based on the scan, here are features that could make sense:

  1. {feature based on scan — e.g. "Export system (your app stores data but has no export)"}
  2. {feature based on scan — e.g. "Dashboard analytics (you have data but no visualization)"}
  3. {feature based on scan — e.g. "User preferences (settings exist but are minimal)"}
  4. {feature based on scan — ground in what the project already has}
  5. Other — you have a specific feature in mind

  Pick a number (or several):
</output-format>

**For ADD FEATURES only:** The suggestions MUST be grounded in what step-01 scan found.
Read the scan data. Identify what the project has but could extend. Propose those.

### Objective 4 — REDESIGN

<output-format>
Objective confirmed: REDESIGN

  What kind of redesign?

  1. Visual refresh    — New colors, typography, spacing (keep current layout)
  2. Layout rethink    — Rethink navigation and screen organization
  3. Complete overhaul — New visual identity + new layout
  4. Specific screens  — Redesign only certain parts of the app
  5. Other             — You have a specific idea

  Pick a number:
</output-format>

### Objective 5 — AUDIT

<output-format>
Objective confirmed: AUDIT

  What to audit?

  1. Security       — Vulnerabilities and attack surface
  2. Code quality   — Debt, structure, conventions
  3. Performance    — Bottlenecks and optimization opportunities
  4. Full audit     — All of the above
  5. Other          — You have a specific focus

  Pick a number:
</output-format>

### Objective 6 — RESTRUCTURE

<output-format>
Objective confirmed: RESTRUCTURE

  What kind of restructuring?

  1. Module split         — Break large files into focused modules
  2. File reorganization  — Better folder structure and naming
  3. Dependency cleanup   — Remove unused, update outdated
  4. Architecture migrate — Move to a different pattern
  5. Other                — You have a specific idea

  Pick a number:
</output-format>

### Objective 7 — OTHER

For OTHER only, ask: "Can you describe your idea in a few words?"
Then map to the closest objective and present its sub-directions.

### Multiple objectives (e.g. 1+4)

Present the sub-directions for the FIRST objective, then after the user picks,
present the sub-directions for the SECOND objective.

---

## Capture intent — not details

After the user picks a sub-direction, capture their intent in 1-2 sentences.
Do NOT go deeper. Do NOT explore ideas.

<output-format>
Got it. Here's what I'm capturing:

  Objective: {objective}
  Direction: {sub_direction}
  Intent: {1-2 sentence summary of what the user wants}

  The details will be explored in the brainstorming phase with Le Stratège.
  For now, this is enough to recommend the right path.

  Does this capture your intent correctly?
</output-format>

**If the user starts sharing detailed ideas** (inspirations, features, technical details):

```
Great input — I'm noting it down. These details are exactly what we'll
work on with Le Stratège in the brainstorming workflow.
For now, I just need the high-level direction to recommend the right path.
```

Store whatever they shared as `{user_notes}` — it will be passed to Le Stratège.

---

## Handling responses

**Multiple objectives:** Valid. Store all selected. Path recommendation in step-04
will account for the combination (e.g., 1+4 = Evolve + Redesign → Full path likely).

**Option 7 — OTHER:**
Ask: "Can you describe what you have in mind?"
Then map to the closest objective(s):
- "Add a payment system" → 3 (Add Features)
- "The whole app feels slow and old" → 2+4 (Modernize + Redesign)
- "I want to know if it's secure before selling it" → 5 (Audit)
- If truly ambiguous → map to the 2 closest options and confirm with the user

---

## Escalade signal detection

After hearing the sub-direction, check for a mismatch between size and ambition:

| Signal | Example |
|--------|---------|
| Small project, very large ambition | "I want to rebuild this as a SaaS platform" |
| Multiple objectives combined | Evolve + Redesign + Modernize together |
| Scope that implies full rewrite | "Everything needs to change" |

If detected:
```
Note: Your ambition sounds larger than what the current project size
would typically require. I'll take this into account for the path
recommendation — we may want to consider a more complete path.
```

Do not alarm the user — just note it and factor it into step-04.

---

## Reflection modes menu

After objective is confirmed:

<output-format>
Before we continue, would you like to explore further?

  REFLECTION MODES
  1. Prisme        — Analyze this objective from user and business perspectives

  ─────────────────────────────────────────
  S. Save and continue to path recommendation
</output-format>

**Before executing any mode above, LOAD its data file:**
- Prisme → `data/modes/prisme.md` + `data/prisme-facettes.csv`

---

## Transition

<output-format>
Step 03 complete.

  Confirmed objective(s): {objectives_list}
  Direction: {sub_direction}
  Intent: {user_intent_summary}

  → Step 04 — I'll now recommend the right H.K-UP path for your project.
</output-format>

Update `hk-up-status.yaml`: `3-2-objectif-parcours → step-03: done`
Proceed to **step-04-path.md**
