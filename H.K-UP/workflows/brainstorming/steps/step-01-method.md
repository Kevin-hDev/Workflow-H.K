---
step: "01"
name: "Directive Method Selection"
workflow: brainstorming
agent: stratege
---

# Step 01 — Directive Method Selection

> **CRITICAL — Rule 1:** The user chooses the method. Never push toward a specific one.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** If user picks option 9 (recommend), use the mapping table below — never guess.
> **CRITICAL:** After selection, explain the method's phases before moving to step-02.
> **CRITICAL — Rule 3:** Offer the reflection modes menu after method is confirmed.

---

## Goal

Choose the directive method that will structure the entire brainstorm session.
Present the 8 methods clearly. Collect the selection. Explain what to expect.

---

⛔ STOP CHECK
- data/global-rules.md READ (not just listed)? [YES/NO]
- data/brain-methods.csv READ (not just listed)? [YES/NO]
- {output_folder}/project-context.md READ? [YES/NO]
- Ready to proceed? [YES/NO]

⛔ STOP CONDITION: If any check = NO → Go back and READ the file contents before continuing.

---

## Method menu

Present this menu:

<output-format>
Before we brainstorm, let's choose our approach.
Each method guides the session differently:

  USER-CENTERED
  1. Design Thinking   — Start from human needs, prototype fast
  2. Story Mapping     — Map user journeys end to end

  BUSINESS-CENTERED
  3. Lean Canvas       — Validate the business model
  4. Blue Ocean        — Differentiate from competition

  STRATEGY-CENTERED
  5. Impact Mapping    — Goal → Actors → Behaviors → Features
  6. SWOT              — Strengths / Weaknesses / Opportunities / Threats

  EXPLORATION-CENTERED
  7. Double Diamond    — Explore then converge (twice)
  8. Opportunity Tree  — Sort ideas and prioritize by impact

  ─────────────────────────────────────────
  9. Recommend         — Suggest the best method for my objective

  Choose a number:
</output-format>

---

## Handling option 9 (recommend)

If the user picks 9, use the confirmed objective from L'Éclaireur to map:

| Objective | Recommended method |
|-----------|-------------------|
| Evolve | Impact Mapping |
| Modernize | SWOT + Blue Ocean (run both sequentially) |
| Add Features | Opportunity Tree |
| Redesign | Design Thinking |
| Audit | SWOT |
| Restructure | Story Mapping |
| Unknown / "I don't know" | Double Diamond |

Present the recommendation with a brief explanation:

<output-format>
Based on your objective [{objective}], I recommend: {method_name}

Why: {one sentence explanation}

  ─────────────────────────────────────────
  1. Go with {method_name}
  2. Choose a different method (show the menu again)
</output-format>

The user still confirms. Never auto-start without confirmation.

---

## After selection — explain the method

Once the user confirms a method, briefly explain its phases and what to expect
during the session. Keep it concise (3-5 lines max):

**Design Thinking:**
> We'll go through 5 phases: Empathize → Define → Ideate → Prototype → Test.
> We start with your users' real needs before jumping to solutions.

**Story Mapping:**
> We'll map user activities (horizontal), then tasks under each activity,
> then features by priority (vertical). The result is a 2D map showing what to build first.

**Lean Canvas:**
> We'll fill 9 sections of the business model interactively — one by one.
> This helps validate whether the project makes business sense before building.

**Blue Ocean:**
> We'll use the Four Actions framework: Eliminate, Reduce, Raise, Create.
> The goal is to find what makes this project stand out from everything else.

**Impact Mapping:**
> We'll work top-down: Why (goal) → Who (actors) → How (behaviors) → What (features).
> Every feature must trace back to a real behavioral change.

**SWOT:**
> We'll analyze 4 dimensions: Strengths, Weaknesses, Opportunities, Threats.
> Then cross-analyze them to find the best strategic moves.

**Double Diamond:**
> Two diverge-converge cycles: first for the problem, then for the solution.
> We explore widely before narrowing down — twice.

**Opportunity Tree:**
> We start from the desired outcome, brainstorm opportunities,
> list solutions for each, then rank by impact × effort.

---

## Reflection modes menu

After the method is confirmed and explained:

<output-format>
Before we start the session, would you like to explore further?

  REFLECTION MODES
  1. Table Ronde   — Discuss the method choice with multiple agents
  2. Prisme        — Analyze the objective from multiple perspectives

  ─────────────────────────────────────────
  S. Save and start the session (step-02)
</output-format>

**Before executing any mode above, LOAD its data file:**
- Table Ronde → `data/modes/table-ronde.md`
- Prisme → `data/modes/prisme.md` + `data/prisme-facettes.csv`

---

## Transition

<output-format>
Step 01 complete.

Chosen method: {method_name}
Objective: {confirmed_objective}

→ Step 02 — We'll now run the {method_name} session.
  I'll guide you through each phase with questions and suggestions.
</output-format>

Update `hk-up-status.yaml`: `4-1-methode-directrice → step-01: done`
Proceed to **step-02-session.md**
