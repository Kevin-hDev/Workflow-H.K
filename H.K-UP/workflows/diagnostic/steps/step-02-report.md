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

<output-format>
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
  Features:      {feature_count} features · {integration_count} integrations · {table_count} data tables
  CLAUDE.md:     {claudemd_status}
  Git:           {project_age} old · {total_commits} commits · {contributors} contributor(s)
  Last commit:   {last_commit_date}

  {optional_notes}

Do you confirm? Anything to add or correct?
</output-format>

**Guidelines for filling placeholders:**
- `{health_summary}`: factual, e.g. "No tests, no CI, minimal README" or "Tests present, CI configured, README complete"
- `{feature_count}`, `{integration_count}`, `{table_count}`: from scan section 9 (functional inventory)
- `{claudemd_status}`: based on scan section 10 results:
  - No file: "Not found"
  - Optimal: "{lines} lines (optimal)"
  - Acceptable: "{lines} lines (acceptable)"
  - Oversized: "⚠ {lines} lines (oversized — impacts performance)"
- `{optional_notes}`: only if there is something worth highlighting (e.g. "No dependency file found — stack detection may be incomplete")
- If something could not be detected, say so honestly: "Could not determine architecture pattern from folder structure"

---

## CLAUDE.md optimization alert

> This section is presented ONLY if `claudemd_health` = `oversized` (> 200 lines).
> It appears AFTER the main report block, BEFORE asking for confirmation.
> Present it as a factual observation, not a judgment.

If the CLAUDE.md is oversized, present this alert block:

<output-format>
⚠ CLAUDE.md OPTIMIZATION NEEDED

  Your CLAUDE.md is {claudemd_lines} lines — the recommended maximum is 200 lines.
  Optimal target: ~60 lines.

  Why this matters:
  CLAUDE.md is loaded IN FULL at EVERY request. An oversized file:
  — Creates noise that reduces instruction adherence
  — Wastes context window tokens on every single interaction
  — Can cause Claude to ignore critical rules buried in the text

  What your CLAUDE.md currently contains:
  {list each content category detected in step-01 section 9, with line count estimate}

  Anthropic's recommended approach:

  | WHERE | WHAT GOES THERE |
  |-------|-----------------|
  | CLAUDE.md (< 200 lines) | Rules for EVERY session: identity, build commands, conventions |
  | .claude/rules/*.md | Domain-specific rules, can be path-scoped |
  | .claude/skills/ | On-demand workflows — NOT loaded every session |
  | Auto-memory | Learned preferences — managed by Claude itself |
  | DELETE | Info Claude can infer: versions, standard conventions, structure |

  Test for each line: "If I remove this, will Claude make a mistake?"
  If the answer is no → move it out or delete it.

  Current AI standards setup:
  — .claude/rules/: {rules_count} files
  — .claude/skills/: {skills_count} skills
  — Auto-memory: {memory_exists}

  Would you like me to include CLAUDE.md optimization as a mission
  in the development plan?

Do you confirm the findings? Anything to add or correct?
</output-format>

**Important:** The optimization alert is informational. The user decides whether to act on it.
L'Éclaireur does NOT modify CLAUDE.md — that is Le Chirurgien's job if it becomes a mission.

---

## After user confirms

Once the user confirms the findings:

Present the reflection modes menu:

<output-format>
Before we continue, would you like to explore further?

  REFLECTION MODES
  1. Prisme        — Analyze from multiple perspectives (technical, business, risk...)
  2. Archéologie   — Explore the code's history and evolution (git archaeology)

  ─────────────────────────────────────────
  S. Save and continue to the next step
</output-format>

**Rules for the menu:**
- The user can select one or more modes, in any order
- Each completed mode is marked ✓ in the menu when done
- When the user selects S (or is ready to continue) → proceed to step-03
- If the user skips the menu entirely → proceed to step-03 immediately

### Mode 1 — Prisme
**LOAD `data/modes/prisme.md` AND `data/prisme-facettes.csv` BEFORE executing.** Follow their format exactly.
Run selected facette families from `data/prisme-facettes.csv`.
Suggested families for this step: `technique`, `echec`
Ask the user which families they want to explore.
Present each facette with its question. Discuss. Mark mode as ✓ when done.

### Mode 2 — Archéologie
**LOAD `data/modes/archeologie.md` BEFORE executing.** Follow its format exactly.
Use `git log`, `git blame`, and `git log --follow` to trace the project's evolution.
Identify: major phases, rewrites, contributors who left, recurring hotspot files.
Present findings as a timeline narrative. Mark mode as ✓ when done.

---

## Transition

After the user is ready to continue:

<output-format>
Step 02 complete. Moving to step 03.

Next: I'll ask what you want to do with this project.
→ Step 03 — Objective selection
</output-format>

Update `hk-up-status.yaml`: `3-1-scan-rapport → step-02: done`
Proceed to **step-03-objective.md**
