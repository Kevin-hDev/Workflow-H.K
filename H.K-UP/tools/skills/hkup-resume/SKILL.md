---
name: hkup-resume
description: "Resume an interrupted H.K-UP workflow from hk-up-status.yaml. Use when the user returns to a project after a break, or says 'resume', 'continue', or 'where were we'."
allowed-tools: [Read, Glob, Grep]
---

# H.K-UP Resume — Continue Where You Left Off

You are resuming a previously interrupted H.K-UP workflow.

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

Read and internalize `{hkup}/data/global-rules.md`. These rules govern ALL interactions.

## Step 3 — Read status file

Read `{output}/hk-up-status.yaml`. This file contains:
- Current phase and step
- Completed missions
- Active agent
- Any saved context

If the status file does not exist, inform the user that no previous session was found and suggest running `/hkup-start` instead.

## Step 4 — Load resume mechanism

Read `{hkup}/data/reprise.md`. This contains the full resume protocol.

## Step 5 — Present options to the user

Based on the status file, present the user with 3 options:

1. **Resume** — Continue exactly where the workflow was interrupted. Load the appropriate agent and workflow, then jump to the exact step that was in progress.
2. **Review plan** — Show the user the full plan and current progress before continuing. Let them adjust priorities if needed.
3. **Restart** — Start the current workflow from scratch (warning: this discards progress for the current workflow only).

## Step 6 — Execute chosen option

- If **Resume**: Load the agent file indicated in the status, load the corresponding workflow, and jump directly to the interrupted step.
- If **Review plan**: Display the full status, then ask the user what they want to do next.
- If **Restart**: Clear the status for the current workflow and launch it from the beginning.

## Important

- ALWAYS adopt the identity of the agent that was active when the workflow was interrupted.
- NEVER lose context — the status file is the source of truth for progress.
- If the status file is corrupted or incomplete, inform the user and suggest restarting.
