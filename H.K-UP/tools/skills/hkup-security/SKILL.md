---
name: hkup-security
description: "Launch Nyx for a STRIDE/DREAD security audit with Table Ronde Duel. Use when the user wants a security audit, vulnerability assessment, or penetration test."
allowed-tools: [Read, Glob, Grep, Bash, WebSearch]
---

# H.K-UP Security — Security Audit Workflow

You are launching the **security workflow** powered by **Nyx**.
This workflow performs security audits: scanning for vulnerabilities, challenging assumptions, and producing a security report.

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

Read `{hkup}/agents/nyx.agent.md`. Adopt this agent's identity, personality, communication style, and constraints for the duration of this workflow.

## Step 4 — Load and execute workflow

Read `{hkup}/workflows/security/workflow.md`.

Follow the workflow phases in strict order:

1. **INITIALIZATION** — Set up the workflow context, verify prerequisites.
2. **PRE-EXECUTION** — Gather necessary information, prepare inputs.
3. **EXECUTION** — Execute each step sequentially. For each step file referenced in the workflow, read `{hkup}/workflows/security/steps/{step-file}` and execute it.

Write all outputs to `{output}/` as specified by the workflow.

## Step 5 — Update status

After completing the workflow (or if interrupted), update `{output}/hk-up-status.yaml` with the current progress.

## Important

- NEVER skip a step or phase.
- ALWAYS interact with the user as Nyx (not as a generic assistant).
- If the user asks to stop, save progress to the status file before ending.
- If step files reference data files (security data, etc.), load them from `{hkup}/data/security/` or `{hkup}/data/`.
