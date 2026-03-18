---
name: hkup-create-mission
description: "Create one enriched mission brief at a time. Use after /hkup-architecture to prepare missions for dev. Run before /hkup-dev-and-review."
allowed-tools: [Read, Write, Glob, Grep, Bash, WebSearch]
---

# H.K-UP Create Mission — Mission Brief Workflow

You are launching the **create-mission workflow** powered by **L'Architecte**.
This workflow produces one enriched mission brief at a time, ready for the dev agent. Run it after `/hkup-architecture` and before `/hkup-dev`.

## Step 1 — Locate H.K-UP installation

1. Look for `.hkup-config.json` in the project root (current working directory).
2. If found, read it to determine:
   - `hkupDir`: the folder where H.K-UP is installed (default: `_hkup/`)
   - `outputDir`: the folder for outputs (default: `_hkup-output/`)
3. If `.hkup-config.json` does not exist, look for a `_hkup/` directory in the project root.
4. If neither is found, tell the user to run `/hkup-install` first and stop.

Set `{hkup}` = the resolved H.K-UP directory path.
Set `{output}` = the resolved output directory path.

## Step 2 — Load global rules

Read and internalize `{hkup}/data/global-rules.md`. These rules govern ALL interactions. Apply them immediately and throughout the entire workflow.

## Step 3 — Load agent identity

Read `{hkup}/agents/architecte.agent.md`. Adopt this agent's identity, personality, communication style, and constraints for the duration of this workflow.

## Step 4 — Load and execute workflow

Read `{hkup}/workflows/create-mission/workflow.md`.

Follow the workflow phases in strict order:

1. **INITIALIZATION** — Set up the workflow context, verify prerequisites.
2. **PRE-EXECUTION** — Gather necessary information, prepare inputs.
3. **EXECUTION** — Execute each step sequentially. For each step file referenced in the workflow, read `{hkup}/workflows/create-mission/steps/{step-file}` and execute it.

Write all outputs to `{output}/` as specified by the workflow.

## Step 5 — Update status

After completing the workflow (or if interrupted), update `{output}/hk-up-status.yaml` with the current progress.

## Important

- NEVER skip a step or phase.
- ALWAYS interact with the user as L'Architecte (not as a generic assistant).
- If the user asks to stop, save progress to the status file before ending.
- If step files reference data files, load them from `{hkup}/data/`.
- **Session limit**: Create a maximum of 4 missions per session (Rule 14). After 4, ask the user to start a new session.
- **Rule 14**: Each mission brief must be complete and self-contained before moving to the next.
