---
name: dev-and-review
description: "Orchestrates dev + review cycles using sub-agents. Max 4 missions per session."
agent: orchestrator
mode: EXECUTION
---

# Dev & Review Workflow — Orchestrator

**Goal:** For each mission with status `ready`, deploy @hkup-dev (Sonnet) then @hkup-review (Opus). Present each report to the user. Max 4 missions per conversation.
**Agent:** Orchestrator — main conversation (Opus). No persona. Purely functional.
**Mode:** EXECUTION — code is written and reviewed. Sub-agents do all the work.

---

## INITIALIZATION

**Load:** `data/global-rules.md`

This workflow does NOT load an agent identity. The orchestrator is the main conversation (Opus), not a persona. It coordinates — it does not implement or review code itself.

### Pre-flight

Search for:
- `{output_folder}/hk-up-status.yaml` — required
- `{output_folder}/architecture/plan.md` — required
- `{output_folder}/missions/` — check which mission briefs exist with status `ready`

Present what's found:

<output-format>
Dev & Review Orchestrator — Pre-flight

  Status file: ✓/✗ hk-up-status.yaml
  Plan:        ✓/✗ plan.md

  Missions ready for dev:
  {for each mission with status "ready":}
  ✓ Mission {X.Y} — {title} (brief: missions/mission-{X}-{Y}.md)

  Missions pending (need /hkup-create-mission first):
  {for each mission with status "pending":}
  ○ Mission {X.Y} — {title}

  ─────────────────────────────────────────
  1. Start dev cycle with the ready missions
  2. I need to run /hkup-create-mission first
</output-format>

⛔ STOP CONDITION: Do NOT proceed until the user confirms with option 1.
If `hk-up-status.yaml` or `plan.md` is missing, abort with a clear message pointing to the required workflow.

---

## PRE-EXECUTION

Rules for this workflow:

1. **Max 4 missions per conversation** — after 4, STOP and recommend /clear (Rule 14)
2. **Rule 14** — this workflow runs in its own dedicated session
3. **Sub-agents are autonomous** — deploy them and wait for their report. Do NOT interfere or implement code yourself
4. **Validate between steps** — after each dev report and each review report, present the output to the user
5. **The user decides** — always ask before continuing to the next mission

---

## EXECUTION

Execute the single orchestration step:

| Step | File | Description | Output |
|------|------|-------------|--------|
| 01 | `steps/step-01-orchestrate.md` | Dev + Review loop for each ready mission | Updated hk-up-status.yaml |

---

## End condition

- [ ] All ready missions processed (or session limit of 4 reached)
- [ ] `hk-up-status.yaml` updated for each completed mission (status: done)
- [ ] User informed of remaining missions and next steps
- [ ] /clear recommended if session limit reached (Rule 14)
