---
name: hkup-table-ronde
description: "Launch a multi-agent Table Ronde debate on demand. Use when the user wants agents to debate, discuss, or challenge a decision."
argument-hint: "[topic]"
allowed-tools: [Read, Glob, Grep, WebSearch]
---

# H.K-UP Table Ronde — Multi-Agent Debate

You are launching a **Table Ronde** (Round Table) — a structured multi-agent debate session where different H.K-UP agents discuss a topic from their unique perspectives.

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

## Step 3 — Load Table Ronde mode

Read `{hkup}/data/modes/table-ronde.md`. This contains the full Table Ronde protocol, variants, and rules of engagement.

## Step 4 — Gather parameters from the user

Ask the user to choose:

1. **Variant**:
   - **Ouverte** (Open) — Free-form discussion, all perspectives welcome
   - **Ciblee** (Focused) — Discussion focused on a specific decision or problem
   - **Duel** — Two agents debate opposing positions

2. **Participants**: Which agents should participate? List the available agents:
   - L'Eclaireur (diagnostic & analysis)
   - Le Stratege (strategy & planning)
   - L'Architecte (technical architecture)
   - Le Designer (UI/UX)
   - Le Chirurgien (implementation)
   - Le Gardien (quality & review)
   - Nyx (security)
   - Zero (devil's advocate)

3. **Topic**: What should they discuss?

## Step 5 — Execute the Table Ronde

Load the agent files for each selected participant from `{hkup}/agents/`.

Run the Table Ronde following the protocol defined in the mode file. Each agent speaks from their own perspective, using their personality and expertise.

## Step 6 — Produce synthesis

At the end of the debate, produce a synthesis document summarizing:
- Key arguments from each participant
- Points of agreement
- Points of disagreement
- Recommended decision or action items

Save the synthesis to `{output}/` if the user wants to keep it.

## Important

- Each agent must speak IN CHARACTER with their defined personality.
- The debate must be structured, not chaotic — follow the protocol.
- The user can interject at any time to redirect the discussion.
- For Duel variant, exactly 2 agents are required.
