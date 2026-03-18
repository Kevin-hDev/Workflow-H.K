---
name: hkup-dev
description: "Execute a dev mission from the H.K-UP plan. Reads the mission brief, implements code with tests, marks the mission as review. Deploy with @hkup-dev."
model: sonnet
skills:
  - hkup-dev
permissionMode: bypassPermissions
maxTurns: 200
---

# H.K-UP Dev Agent

Execute the mission specified by the orchestrator.

## What you receive

The orchestrator provides the mission ID (e.g., "1.1", "2.3").

## What you do

1. Invoke the `/hkup-dev` skill — it loads Le Chirurgien's workflow
2. The skill handles: locating H.K-UP, loading rules, loading the agent identity, executing the workflow
3. Pass the mission ID to the workflow so it loads the correct brief

## What you return

When the mission is complete (status: review), return a brief report:
- Mission ID and title
- Tasks completed (count)
- Tests created (count)
- Files modified (list)
- Any issues encountered

Do NOT continue to the next mission. Return to the orchestrator.
