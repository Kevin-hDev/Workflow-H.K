---
step: "02"
name: "Report to User"
workflow: diagnostic
agent: eclaireur
---

# Step 02 — Report to User

> **CRITICAL — Rule 1:** The user confirms. Never auto-advance to the next step.
> **CRITICAL — Rule 3:** Offer the reflection modes menu after confirmation.
> **CRITICAL — Rule 10:** Announce the explicit transition to step-03 at the end.
> **CRITICAL — No judgment:** Present findings. Let the user draw conclusions.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.

---

## Goal

Present scan results from step-01 in a clear, honest, non-judgmental format.
Ask for confirmation. Offer reflection modes. Transition to step-03.

---

## Report format

Present the following block exactly:

```
Here's what I found:

  Project:       {project_name}
  Type:          {project_type}
  Size:          ~{loc_count} lines ({size_class})
  Stack:         {languages} · {main_framework} {framework_version}
  Key libraries: {list of important libs: crypto, db, auth, testing, etc.}
  Dependencies:  {dep_count} packages
  Health:        {health_summary}
  Architecture:  {architecture_pattern}
  Conventions:   {naming_style} · {error_handling_pattern} · {formatting}
  Git:           {project_age} old · {total_commits} commits · {contributors} contributor(s)
  Last commit:   {last_commit_date}

  {optional_notes}

Do you confirm? Anything to add or correct?
```

**Guidelines for filling placeholders:**
- `{health_summary}`: factual, e.g. "No tests, no CI, minimal README" or "Tests present, CI configured, README complete"
- `{optional_notes}`: only if there is something worth highlighting (e.g. "No dependency file found — stack detection may be incomplete")
- If something could not be detected, say so honestly: "Could not determine architecture pattern from folder structure"

---

## After user confirms

Once the user confirms the findings:

Present the reflection modes menu:

```
Before we continue, would you like to explore further?

  REFLECTION MODES
  1. Prisme        — Analyze from multiple perspectives (technical, business, risk...)
  2. Archéologie   — Explore the code's history and evolution (git archaeology)

  ─────────────────────────────────────────
  S. Save and continue to the next step
```

**Rules for the menu:**
- The user can select one or more modes, in any order
- Each completed mode is marked ✓ in the menu when done
- When the user selects S (or is ready to continue) → proceed to step-03
- If the user skips the menu entirely → proceed to step-03 immediately

### Mode 1 — Prisme
Run selected facette families from `data/prisme-facettes.csv`.
Suggested families for this step: `technique`, `echec`
Ask the user which families they want to explore.
Present each facette with its question. Discuss. Mark mode as ✓ when done.

### Mode 2 — Archéologie
Use `git log`, `git blame`, and `git log --follow` to trace the project's evolution.
Identify: major phases, rewrites, contributors who left, recurring hotspot files.
Present findings as a timeline narrative. Mark mode as ✓ when done.

---

## Transition

After the user is ready to continue:

```
Step 02 complete. Moving to step 03.

Next: I'll ask what you want to do with this project.
→ Step 03 — Objective selection
```

Update `hk-up-status.yaml`: `3-1-scan-rapport → step-02: done`
Proceed to **step-03-objective.md**
