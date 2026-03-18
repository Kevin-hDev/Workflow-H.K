---
step: "01"
name: "Dev & Review Orchestration"
workflow: dev-and-review
agent: orchestrator
---

# Step 01 — Dev & Review Orchestration

> **CRITICAL:** Deploy sub-agents with @hkup-dev and @hkup-review. NEVER do the dev or review yourself.
> **CRITICAL:** Max 4 missions per conversation. After 4, STOP.
> **CRITICAL:** Between each mission, present the report and ask the user what to do.
> **CRITICAL:** The sub-agents invoke their own skills. Pass them ONLY the mission ID.
> **CRITICAL — Rule 14:** Recommend /clear after 4 missions or at end of session.

---

## Inputs

- `{output_folder}/hk-up-status.yaml` — source of truth for mission statuses
- `{output_folder}/missions/mission-{X}-{Y}.md` — one per ready mission

## Session counter

Track `session_count` (starts at 0). Increment after each completed mission. Hard stop at 4.

---

## Orchestration loop

For each mission with status `ready` in `hk-up-status.yaml` (up to 4), execute phases 1–6:

---

### Phase 1 — Announce

<output-format>
═══════════════════════════════════════════
  MISSION {X}.{Y} — {title}
═══════════════════════════════════════════

  Starting dev cycle...
  Deploying @hkup-dev (Sonnet) for implementation.
</output-format>

---

### Phase 2 — Deploy dev sub-agent

Deploy `@hkup-dev` with the following prompt:

```
Execute mission {X.Y} from the H.K-UP plan.
```

Wait for the dev report. Do NOT implement anything yourself.
When complete, update `hk-up-status.yaml` → status: `review` for this mission.

---

### Phase 3 — Dev report

Present the dev agent's report to the user:

<output-format>
  DEV REPORT — Mission {X}.{Y}
  ─────────────────────────────────────────
  {dev agent's report: tasks completed, tests created, files modified}

  Status: review

  Deploying @hkup-review (Opus) for validation...
</output-format>

---

### Phase 4 — Deploy review sub-agent

Deploy `@hkup-review` with the following prompt:

```
Review mission {X.Y} from the H.K-UP plan.
```

Wait for the review report. Do NOT review anything yourself.
When complete, update `hk-up-status.yaml` → status: `done` for this mission.

---

### Phase 5 — Review report

Present the review agent's report:

<output-format>
  REVIEW REPORT — Mission {X}.{Y}
  ─────────────────────────────────────────
  {review agent's report: control points, issues found, issues fixed, tests verified}

  Status: done ✓

  ─────────────────────────────────────────
  Mission {X}.{Y} complete.

  {session_count}/{4} missions this session.

  1. Test the changes (frontend/UI) before continuing
  2. Continue to next mission ({next_mission_id} — {next_title})
  3. Stop for now
</output-format>

---

### Phase 6 — User decision

- If user picks **1** (test): wait for them to test, then re-present options 2 and 3
- If user picks **2** (continue): increment `session_count`, loop back to Phase 1 with next mission
- If user picks **3** (stop): go to session end

If `session_count` reaches 4: do NOT ask — go directly to session end.

---

## Session end

Triggered when: user picks "stop", all ready missions are done, or `session_count` == 4.

<output-format>
═══════════════════════════════════════════
  SESSION COMPLETE
═══════════════════════════════════════════

  Missions completed this session: {count}
  {for each completed mission:}
  ✓ Mission {X.Y} — {title}

  Remaining missions:
  {for each remaining mission:}
  {status_icon} Mission {X.Y} — {title} ({status})

  ─────────────────────────────────────────
  To continue:          /clear then /hkup-dev-and-review
  To create more briefs: /hkup-create-mission

  Rule 14: Fresh session = fresh context = better results.
═══════════════════════════════════════════
</output-format>

---

## hk-up-status.yaml — update rules

| Event | Status transition |
|-------|------------------|
| Dev complete | `ready` → `review` |
| Review complete | `review` → `done` |
| Any sub-agent failure | Keep current status, report the error to the user |
