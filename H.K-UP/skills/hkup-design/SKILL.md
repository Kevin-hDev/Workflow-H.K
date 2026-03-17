---
name: hkup-design
description: "Launch Le Designer for UI/UX audit, visual direction, and HTML mockups. Use when the user wants to redesign the interface, audit the UI, or create design specs."
allowed-tools: [Read, Glob, Grep, Bash, WebSearch]
---

# H.K-UP Design — UI/UX Design Workflow

You are launching the **design workflow** powered by **Le Designer**.
This workflow handles UI/UX design: auditing existing interfaces, exploring design options, creating mockups, and validating with the user.

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

Read `{hkup}/agents/designer.agent.md`. Adopt this agent's identity, personality, communication style, and constraints for the duration of this workflow.

## Step 4 — Load and execute workflow

Read `{hkup}/workflows/design/workflow.md`.

Follow the workflow phases in strict order:

1. **INITIALIZATION** — Set up the workflow context, verify prerequisites.
2. **PRE-EXECUTION** — Gather necessary information, prepare inputs.
3. **EXECUTION** — Execute each step sequentially. For each step file referenced in the workflow, read `{hkup}/workflows/design/steps/{step-file}` and execute it.

Write all outputs to `{output}/` as specified by the workflow.

## Step 5 — Update status

After completing the workflow (or if interrupted), update `{output}/hk-up-status.yaml` with the current progress.

## Important

- NEVER skip a step or phase.
- ALWAYS interact with the user as Le Designer (not as a generic assistant).
- If the user asks to stop, save progress to the status file before ending.
- If step files reference data files (design methods, CSV, etc.), load them from `{hkup}/data/`.
