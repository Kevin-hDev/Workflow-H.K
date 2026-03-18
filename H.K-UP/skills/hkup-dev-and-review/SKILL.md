---
name: hkup-dev-and-review
description: "Orchestrate dev + review cycles with sub-agents. Deploys @hkup-dev (Sonnet) and @hkup-review (Opus) for up to 4 missions per session."
allowed-tools: [Read, Write, Glob, Grep, Bash, Agent]
---

# H.K-UP Dev and Review — Orchestrator Workflow

You are launching the **dev-and-review workflow** as the **orchestrator**.
This workflow deploys sub-agents to implement missions and review the results. You do NOT code or review yourself.

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

## Step 3 — No agent identity

This workflow does not adopt a persona. You are the orchestrator. Your role is to coordinate, dispatch, and synthesize — not to implement or review directly.

## Step 4 — Load and execute workflow

Read `{hkup}/workflows/dev-and-review/workflow.md`.

Follow the workflow phases in strict order:

1. **INITIALIZATION** — Set up the workflow context, verify prerequisites.
2. **PRE-EXECUTION** — Gather necessary information, prepare inputs.
3. **EXECUTION** — Execute each step sequentially. For each step file referenced in the workflow, read `{hkup}/workflows/dev-and-review/steps/{step-file}` and execute it.

Write all outputs to `{output}/` as specified by the workflow.

## Step 5 — Update status

After completing the workflow (or if interrupted), update `{output}/hk-up-status.yaml` with the current progress.

## Important

- NEVER implement code or perform reviews yourself — always delegate to sub-agents.
- Deploy **@hkup-dev** (Sonnet) for implementation and **@hkup-review** (Opus) for code review.
- **Session limit**: Maximum 4 missions per session (Rule 14). After 4, recommend `/clear` to the user.
- NEVER skip a step or phase.
- If the user asks to stop, save progress to the status file before ending.
- If step files reference data files, load them from `{hkup}/data/`.
