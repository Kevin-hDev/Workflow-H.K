---
step: "01"
name: "Nyx Scan — STRIDE/DREAD Audit"
workflow: security
agent: nyx
---

# Step 01 — Nyx Scan

> **CRITICAL — Rule 8:** Every web search MUST include stack + version + component. No generic queries.
> **CRITICAL — Rule 2:** Read the code before auditing. No diagnosis without evidence.
> **CRITICAL — INDEX_THEN_SELECTIVE:** Read `data/security/index.md` first. Load only 3-5 relevant files.
> **CRITICAL — 6 CONTROL POINTS:** Any BLOCK finding is a highest-priority blocker. No exceptions.
> **CRITICAL:** This is a SECURITY mode step — analyze and recommend only. No code modifications.

---

## Goal

Systematic security audit of the existing codebase. Three mandatory frameworks: web CVE search, STRIDE threat modeling, DREAD scoring. Ends with a check of 6 non-negotiable control points.

---

## Phase 1 — Web Search: Latest Threats

Search for known vulnerabilities relevant to this project's stack. Use precise queries — Rule 8.

**Search pattern (mandatory — fill in from `project-context.md`):**

```
"{main_framework} {version} CVE {current_year}"          — known vulnerabilities
"{main_framework} security advisory {current_year}"      — framework-specific advisories
"{runtime} {version} security {current_year}"            — runtime-level issues
"{domain_type} security incidents {current_year}"        — domain-specific threats (e.g., "auth provider", "payment API")
"{key_dependency} vulnerability {current_year}"          — per critical dependency
```

**Record findings in this format:**

```
CVE/Advisory Search Results

  Query: "{exact_query_used}"
  Findings:
    - {CVE-ID or advisory}: {brief description} — Severity: {Critical/High/Medium/Low}
    - {CVE-ID or advisory}: {brief description} — Severity: {Critical/High/Medium/Low}
    (or: No relevant CVEs found for this query)

  [Repeat for each query]

  Applicable to this project:
    - {CVE/advisory}: {why it applies — which component, which version}
    - {CVE/advisory}: {why it does NOT apply — version not used, feature disabled, etc.}
```

---

## Phase 2 — Load Security Data (INDEX_THEN_SELECTIVE)

```
Security Data Loading

  1. Read: data/security/index.md
  2. Project stack (from project-context.md): {stack summary}
  3. Selected files (3-5 max):
     - data/security/{file-1}.md — Reason: {why this file is relevant}
     - data/security/{file-2}.md — Reason: {why this file is relevant}
     - data/security/{file-3}.md — Reason: {why this file is relevant}
  4. Files NOT loaded: {remaining files} — Not relevant to this stack
```

---

⛔ STOP CHECK
- data/global-rules.md READ (not just listed)? [YES/NO]
- data/security/index.md READ (not just listed)? [YES/NO]
- Selected DATA files (3-5) READ IN FULL (not just listed or skimmed)? [YES/NO]
- {output_folder}/project-context.md READ? [YES/NO]
- CVE web search completed with precise queries? [YES/NO]
- Ready to proceed with STRIDE analysis? [YES/NO]

⛔ STOP CONDITION: If any check = NO → Go back and READ the file contents before continuing. Security DATA files must be read IN FULL — skimming is not acceptable for a security audit.

---

## Phase 3 — STRIDE Analysis

Apply STRIDE to each critical component identified in `project-context.md` and `architecture.md`.

**Critical components to analyze (at minimum):**
- Authentication / authorization layer
- Data access layer (database queries, ORM)
- API endpoints (public-facing)
- External integrations (third-party APIs, webhooks)
- File uploads or user-supplied content processing
- Session management

**Format — one block per component:**

```
STRIDE — {component_name}

  S — Spoofing:
      Can identity be faked here?
      Finding: {description of vulnerability, or "✓ mitigated by {mechanism}"}

  T — Tampering:
      Can data be modified in transit or in storage?
      Finding: {description, or "✓ mitigated by {mechanism}"}

  R — Repudiation:
      Can actions be denied? Are they logged with enough context?
      Finding: {description, or "✓ audit log covers this"}

  I — Information Disclosure:
      Can sensitive data leak through this component?
      Finding: {description, or "✓ no sensitive data exposed"}

  D — Denial of Service:
      Can this component be overwhelmed or forced into failure?
      Finding: {description, or "✓ rate-limited / bounded"}

  E — Elevation of Privilege:
      Can a user gain access beyond their authorization level?
      Finding: {description, or "✓ authorization enforced at {layer}"}
```

Repeat this block for each critical component. Minimum 3 components. Do not skip a component because it "seems safe."

---

## Phase 4 — DREAD Scoring

Score every finding produced by STRIDE. Every unmitigated finding needs a score — no exceptions.

**Format — one block per finding:**

```
DREAD — {finding_title} ({component_name} / {STRIDE_category})

  Damage:           {1–10} — How severe is the impact if exploited?
                    {1-3: minimal | 4-6: significant | 7-9: severe | 10: catastrophic}

  Reproducibility:  {1–10} — How consistently can this be reproduced?
                    {1-3: hard | 4-6: occasional | 7-9: easy | 10: always}

  Exploitability:   {1–10} — How much skill/effort does exploitation require?
                    {1-3: expert only | 4-6: skilled | 7-9: script kiddie | 10: automated}

  Affected users:   {1–10} — What proportion of users are impacted?
                    {1-3: single user | 4-6: subset | 7-9: most | 10: all users + third parties}

  Discoverability:  {1–10} — How easily can this vulnerability be found?
                    {1-3: very hard | 4-6: moderate | 7-9: obvious | 10: public documentation}

  Total: {sum}/50
  Severity: {Critical (40+) | High (30–39) | Medium (20–29) | Low (<20)}
  Priority: {1 = fix immediately | 2 = fix before next release | 3 = fix in backlog | 4 = accept risk}
```

**DREAD Summary (after all findings):**

```
DREAD Summary

  Critical (40+):  {count} findings
  High (30–39):    {count} findings
  Medium (20–29):  {count} findings
  Low (<20):       {count} findings

  Top 3 by score:
    1. {finding_title} — {score}/50 — {component}
    2. {finding_title} — {score}/50 — {component}
    3. {finding_title} — {score}/50 — {component}
```

---

## Phase 5 — 6 Critical Control Points

Non-negotiable checks. A BLOCK finding cannot be deferred or accepted — it must be fixed.

```
CRITICAL CONTROL POINTS

  1. Secret comparisons with ==
     {file:line — BLOCK: secret compared with == (use constant-time comparison)} | ✓ constant-time comparison used everywhere

  2. Unlimited collections fed from external input
     {file:line — BLOCK: {collection_type} has no maxSize — can grow indefinitely} | ✓ all collections are bounded

  3. Hardcoded secrets in code
     {file:line — BLOCK: {type of secret} hardcoded at line {N}} | ✓ all secrets sourced from env/keystore

  4. Empty catch {} blocks
     {file:line — BLOCK: catch block is empty — errors swallowed silently} | ✓ all errors handled explicitly (fail closed)

  5. Math.random() or equivalent for tokens/IDs/nonces
     {file:line — BLOCK: Math.random() used for {token/ID/nonce}} | ✓ CSPRNG used everywhere (crypto.randomBytes / OsRng / SecureRandom)

  6. String concatenation in system commands
     {file:line — BLOCK: user input concatenated into {shell/exec/query} call} | ✓ all commands use parameterized/argument-list form

  ─────────────────────────────────────────────────────────────
  BLOCKING findings: {count}
  → {If count > 0}: These must be included in the remediation plan at highest priority.
  → {If count = 0}: No critical blockers detected.
```

---

## Reflection modes

After presenting all findings to the user:

```
Step 01 complete. Security scan results are ready.

  REFLECTION MODES
  1. Table Ronde  — Invite Zero to challenge Nyx's defensive assumptions
  2. Prisme       — Securité: Attaquant / Compliance / Privacy / Supply chain
                  — Echec: Pre-mortem on the highest DREAD findings
  3. Conformité   — Legal implications of the vulnerabilities found (GDPR, liability)

  ─────────────────────────────────
  S. Save and continue to step 02 → Table Ronde Duel: The Mask vs Nyx
```

**Before executing any mode above, LOAD its data file:**
- Table Ronde → LOAD `data/modes/table-ronde.md`
- Prisme → LOAD `data/modes/prisme.md` + `data/prisme-facettes.csv`
- Conformité → LOAD `data/modes/conformite.md`

---

## Transition

```
Step 01 done.

  STRIDE components analyzed: {count}
  DREAD findings scored:      {count} ({critical}/{high}/{medium}/{low})
  BLOCK control points:       {count}

→ Step 02 — step-02-challenge.md
  Agent: The Mask (enters) + Nyx (defends)
  The Mask will build attack chains targeting the highest DREAD findings and any BLOCK control points.
  Transmitting: STRIDE findings + DREAD scores + BLOCK control points + CVE search results
```

Update `hk-up-status.yaml`: step-01-scan → done
