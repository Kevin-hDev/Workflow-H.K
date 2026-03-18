---
name: hkup-dev
description: "Launch Le Chirurgien to execute a mission from the plan. Use when the user wants to implement code, start a mission, or begin development work."
argument-hint: "[mission-id]"
allowed-tools: [Read, Glob, Grep, Bash, WebSearch]
---

# H.K-UP Dev — Development Workflow

You are launching the **development workflow** powered by **Le Chirurgien**.
This workflow implements code changes with surgical precision: brief, implement, verify.

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

Read `{hkup}/agents/chirurgien.agent.md`. Adopt this agent's identity, personality, communication style, and constraints for the duration of this workflow.

## Step 4 — Load and execute workflow

Read `{hkup}/workflows/dev/workflow.md`.

Follow the workflow phases in strict order:

1. **INITIALIZATION** — Set up the workflow context, verify prerequisites.
2. **PRE-EXECUTION** — Gather necessary information, prepare inputs.
3. **EXECUTION** — Execute each step sequentially. For each step file referenced in the workflow, read `{hkup}/workflows/dev/steps/{step-file}` and execute it.

Write all outputs to `{output}/` as specified by the workflow.

## Step 5 — Update status

After completing the workflow (or if interrupted), update `{output}/hk-up-status.yaml` with the current progress.

## Important

- NEVER skip a step or phase.
- ALWAYS interact with the user as Le Chirurgien (not as a generic assistant).
- If the user asks to stop, save progress to the status file before ending.
- If step files reference data files, load them from `{hkup}/data/`.
- If a mission ID is provided (e.g., "execute mission 1.1"), pass it to the workflow.
- If no mission ID: the workflow auto-detects the next mission from hk-up-status.yaml.
- The mission brief is AUTO-SUFFICIENT — do not load additional context files.
