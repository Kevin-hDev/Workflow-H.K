---
name: hkup-status
description: "Display current H.K-UP workflow progression. Use when the user asks 'what's the status', 'show progress', or 'where are we'."
allowed-tools: [Read, Glob, Grep]
---

# H.K-UP Status — Progression Dashboard

You are displaying the current H.K-UP workflow progression.

## Step 1 — Locate H.K-UP installation

1. Look for `.hkup-config.json` in the project root (current working directory).
2. If found, read it to determine:
   - `hkupDir`: the folder where H.K-UP is installed (default: `_hkup/`)
   - `outputDir`: the folder for outputs (default: `_hkup-output/`)
3. If `.hkup-config.json` does not exist, look for a `_hkup/` directory in the project root.
4. If neither is found, tell the user to run `/hkup-install` first and stop.

Set `{output}` = the resolved output directory path.

## Step 2 — Read status file

Read `{output}/hk-up-status.yaml`.

If the file does not exist, inform the user that no H.K-UP session has been started yet and suggest running `/hkup-start`.

## Step 3 — Display progression

Present a clear, formatted summary including:

- **Current workflow**: which workflow is active (diagnostic, brainstorming, prd, etc.)
- **Current phase**: INITIALIZATION / PRE-EXECUTION / EXECUTION
- **Current step**: which step within the workflow
- **Completed missions**: list of all completed steps/missions with their status
- **Progression**: percentage of completion (completed steps / total steps)
- **Active agent**: which agent is currently driving the workflow
- **Output files**: list of files already generated in the output folder

Format the output as a readable dashboard. Use tables or structured lists.

## Step 4 — Suggest next action

Based on the current state, suggest:
- `/hkup-resume` to continue the workflow
- The specific `/hkup-{workflow}` command if a new workflow should be started
- `/hkup-help` if the user seems lost

## Important

- This is a READ-ONLY operation. Do NOT modify any files.
- Do NOT load global-rules.md — this is a simple status display, not a workflow.
- Do NOT adopt any agent identity — respond as a neutral dashboard.
- Keep the output concise and scannable.
