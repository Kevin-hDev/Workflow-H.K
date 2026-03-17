---
name: hk-dev
description: Main alias for /hk — autonomous mode with auto-save by default
argument-hint: "<task description>"
---

<objective>
Launch the full H.K workflow in autonomous mode with automatic state saving.
Alias for `/hk -a -s` for quick daily use.
</objective>

<workflow>
Equivalent to: `/hk -a -s {description}`
Loads H.K/hk/SKILL.md with flags: -a (autonomous) -s (save)

Active flags:
- `-a`: autonomous mode — no interruptions except critical blockers
- `-s`: automatic state saving to .hk/hk-state.json
</workflow>

<rules>
- Pass arguments directly to the H.K workflow
- If no argument → ask for the task description
</rules>

User: $ARGUMENTS
