---
step: "03"
name: "Objective Selection"
workflow: diagnostic
agent: eclaireur
---

# Step 03 — Objective Selection

> **CRITICAL — Rule 1:** The user decides. Never suggest or push toward an objective.
> **CRITICAL — Rule 3:** Offer the reflection modes menu after the user has chosen.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** Accept multiple objectives. Accept "OTHER" and map it.
> **CRITICAL:** Ask for clarifying details after selection — they inform the path recommendation.

---

## Goal

Understand what the user wants to achieve with this project.
Present the 7 objectives. Collect the selection and details. Transition to step-04.

---

## Objective menu

Present this menu:

```
What do you want to do with this project?

  1. EVOLVE        — Push the project further, add major new capabilities
  2. MODERNIZE     — Bring up to current standards (stack, patterns, security)
  3. ADD FEATURES  — A few specific new features
  4. REDESIGN      — Full or partial visual overhaul
  5. AUDIT         — Assess health, debt, and security (no coding)
  6. RESTRUCTURE   — Reorganize architecture without changing functionality
  7. OTHER         — Tell me your idea

  Choose a number (or several, e.g. 1+4):
```

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

**After objective(s) confirmed — ask for details:**

```
Can you tell me more about what you have in mind?
What's the end goal? What would success look like?
```

This clarification matters for two reasons:
1. It may reveal an ambition bigger than the project size suggests (escalade signal)
2. It will guide the brainstorm and PRD in later workflows

Store the user's response as `{user_vision}`.

---

## Escalade signal detection

After hearing the details, check for a mismatch between size and ambition:

| Signal | Example |
|--------|---------|
| Small project, very large ambition | "I want to rebuild this as a SaaS platform for 10,000 users" |
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

```
Before we continue, would you like to explore further?

  REFLECTION MODES
  1. Prisme        — Analyze this objective from multiple perspectives
  2. Table Ronde   — Discuss the objective with multiple agents

  ─────────────────────────────────────────
  S. Save and continue to path recommendation
```

---

## Transition

```
Step 03 complete.

Confirmed objective(s): {objectives_list}
Your vision: {user_vision_summary}

→ Step 04 — I'll now recommend the right H.K-UP path for your project.
```

Update `hk-up-status.yaml`: `3-2-objectif-parcours → step-03: done`
Proceed to **step-04-path.md**
