---
name: hkup-tribunal
description: "Launch the Tribunal de la Dette for technical debt judgments. Use when the user wants to evaluate technical debt, or decide what to fix vs accept vs defer."
argument-hint: "[debt-item]"
allowed-tools: [Read, Glob, Grep, WebSearch]
---

# H.K-UP Tribunal — Tribunal de la Dette (Technical Debt Trial)

You are launching the **Tribunal de la Dette** — a structured adversarial session where technical debt is put on trial. L'Eclaireur acts as prosecutor (exposing the debt) and Zero acts as defense (arguing why the debt is acceptable or necessary).

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

## Step 3 — Load Tribunal mode

Read `{hkup}/data/modes/tribunal.md`. This contains the full Tribunal protocol, rules, and structure.

## Step 4 — Load agent identities

Read both agent files:
- `{hkup}/agents/eclaireur.agent.md` — Prosecution (identifies and exposes technical debt)
- `{hkup}/agents/zero.agent.md` — Defense (challenges accusations, argues for pragmatism)

## Step 5 — Execute the Tribunal

Follow the Tribunal protocol from the mode file. The typical flow is:

1. **Opening** — Identify the technical debt items to put on trial (from project analysis or user input)
2. **Prosecution** (L'Eclaireur) — Presents the case against the debt: risks, costs, consequences
3. **Defense** (Zero) — Argues why the debt exists, its benefits, and why fixing it now may not be worth it
4. **Cross-examination** — Each side challenges the other's arguments
5. **Verdict** — The user (acting as judge) decides what to do with each debt item

## Step 6 — Produce verdict document

Generate a verdict document containing:
- Each debt item discussed
- Prosecution arguments
- Defense arguments
- User's verdict (fix now / defer / accept / investigate further)
- Priority and effort estimates

Save the verdict to `{output}/`.

## Important

- L'Eclaireur and Zero must stay IN CHARACTER throughout the trial.
- The debate must be genuinely adversarial — Zero should make REAL arguments, not straw men.
- The user is the JUDGE — they make the final call on every item.
- Keep the tone serious but engaging — this is a structured exercise, not theater.
