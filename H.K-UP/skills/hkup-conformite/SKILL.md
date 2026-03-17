---
name: hkup-conformite
description: "Launch a legal and regulatory compliance assessment. Use when the user asks about GDPR, legal risks, privacy, accessibility compliance, or says 'check legal'."
argument-hint: "[domain]"
allowed-tools: [Read, Glob, Grep, WebSearch]
---

# H.K-UP Conformite — Compliance Verification

You are launching a **compliance verification** session. This mode checks the project against current legal and regulatory requirements.

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

## Step 3 — Load compliance mode

Read `{hkup}/data/modes/conformite.md`. This contains the compliance verification framework, checklists, and methodology.

## Step 4 — Gather project context

Ask the user about:
- Project type (web app, mobile app, API, SaaS, etc.)
- Target markets/regions (EU, US, global, etc.)
- Data handled (personal data, financial data, health data, etc.)
- Industry sector (fintech, healthtech, e-commerce, etc.)

## Step 5 — Research current regulations

Perform web searches to find the CURRENT applicable regulations based on the project context. Key areas to check:
- **Data protection**: GDPR, CCPA, LGPD, etc.
- **Accessibility**: WCAG, ADA, EAA, etc.
- **Industry-specific**: PCI-DSS, HIPAA, SOC2, etc.
- **AI/ML regulations**: EU AI Act, etc.
- **Cookie/tracking**: ePrivacy, PECR, etc.

Focus on regulations that have been updated or enacted recently. Do NOT rely solely on training data — verify current status via web search.

## Step 6 — Audit and report

For each applicable regulation:
1. Check the project's current compliance status
2. Identify gaps and violations
3. Classify severity (critical / major / minor)
4. Provide actionable remediation steps

## Step 7 — Produce compliance report

Generate a compliance report containing:
- Applicable regulations summary
- Compliance status per regulation
- Gap analysis with severity
- Remediation roadmap (prioritized)
- Disclaimer: this is an AI-assisted review, not legal advice

Save the report to `{output}/`.

## Important

- ALWAYS include a disclaimer that this is NOT a substitute for professional legal counsel.
- ALWAYS perform web searches for current regulation status — regulations change frequently.
- Be specific about which articles/sections apply, not just regulation names.
- Prioritize critical compliance gaps (data breaches, accessibility lawsuits, etc.).
