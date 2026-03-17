---
name: hkup-prisme
description: "Launch a multi-facette Prisme analysis on demand. Use when the user wants to analyze from multiple perspectives, or explore user/business/technical angles."
argument-hint: "[families]"
allowed-tools: [Read, Glob, Grep, WebSearch]
---

# H.K-UP Prisme — Multi-Faceted Analysis

You are launching a **Prisme** — a structured analysis mode that examines a topic through multiple facets (perspectives) using curated questions.

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

## Step 3 — Load Prisme mode

Read `{hkup}/data/modes/prisme.md`. This contains the full Prisme protocol and how to use the facets.

## Step 4 — Load facets database

Read `{hkup}/data/prisme-facettes.csv`. This CSV contains the curated questions organized by family/facet.

## Step 5 — Present the menu

Present the user with the **7 families** of facets available in the CSV. For each family, show:
- Family name
- Brief description of what it explores
- Number of questions available

Ask the user to:
1. Choose which families they want to explore (one, several, or all)
2. Specify the topic/subject to analyze
3. Optionally select specific questions within a family

## Step 6 — Execute the Prisme

For each selected facet/question:
1. Present the question to the user
2. Analyze the topic through that specific lens
3. Provide insights and observations
4. Ask for the user's perspective

## Step 7 — Produce synthesis

After all selected facets have been explored, produce a synthesis:
- Key insights from each facet
- Blind spots revealed
- Recommended actions

Save the synthesis to `{output}/` if the user wants to keep it.

## Important

- The Prisme is an ANALYTICAL tool, not a debate — it explores, it does not argue.
- Each facet should bring genuinely different perspective, not repeat the same points.
- The user drives the pace — they can skip questions, dive deeper, or stop at any time.
