---
mode: conformite
type: reflection-mode
loaded_by: agents, step files
agent: any
---

# Conformité — Legal and Compliance Risk Assessment

> **CRITICAL — Rule 8:** Web search is mandatory for current regulations. Never rely on training data alone for legal requirements.
> **CRITICAL — Rule 1:** This mode identifies risks. The user decides what to do about each one.
> **CRITICAL:** Concrete actions only. "Comply with GDPR" is not an action. "Add a /privacy page with data deletion form" is.

---

## What it is

The Conformité mode analyzes legal and compliance exposure for the project — from two angles:
- **Creator risks** — what the person building the project could be liable for
- **User risks** — what users of the product could be exposed to

Any agent can activate this mode. The analysis adapts to the project's type, domain, and target geography.


## 3 severity levels

Every finding is assigned a severity level:

| Level | Label | Meaning |
|-------|-------|---------|
| 🔴 | MANDATORY | Legally required. Not complying creates direct legal liability. |
| 🟡 | RECOMMENDED | Best practice. Significantly reduces risk and builds trust. |
| 🟢 | OPTIONAL | Not required, but signals professionalism and care. |

---

## 10 domains covered

### 1 — Personal Data (GDPR, CCPA, LGPD)

**Scope:** Any project that collects, stores, or processes data about users.

**Creator risks:** Fines (up to 4% of global revenue for GDPR), breach notification obligation (72h), data subject requests.

**User risks:** Unwanted data collection, profiling, data sold to third parties.

**What to check:**
- Is there a privacy policy? (/privacy page)
- Is there a cookie consent mechanism? (for EU users)
- Is there a way for users to request data deletion?
- Is personal data encrypted at rest and in transit?
- Are third-party analytics and tracking tools disclosed?

**Concrete actions (MANDATORY):**
- Write a `/privacy` page listing: what data is collected, why, for how long, who has access
- Add a cookie consent banner (for EU audiences)
- Add a data deletion form or email contact
- Disclose all third-party services that receive user data

---

### 2 — Terms of Service and Legal Notices

**Scope:** Any project accessible by end users.
**Creator risks:** Without ToS, no contractual protection.
**Concrete actions (MANDATORY for commercial):**
- Write `/terms` page: usage rules, prohibited behavior, termination conditions
- Write `/legal` page (for EU): creator identity, address, registration number

---

### 3 — Liability

**Scope:** Projects giving advice, processing financial data, affecting health, or making decisions.
**Concrete actions (RECOMMENDED):**
- Add disclaimers where the product gives advice (health, financial, legal)
- Document what the product does NOT guarantee
- Add audit logs for decision-making systems

---

### 4 — Intellectual Property

**Scope:** Projects using open-source libraries, AI-generated content, third-party assets.
**What to check:** License compatibility (GPL vs MIT vs proprietary), AI-generated code ownership, asset licenses.
**Concrete actions (MANDATORY):**
- Add `LICENSES`/`NOTICE` file if required by dependencies
- Check dependencies for license compatibility (`license-checker` or equivalent)
- Replace any unlicensed assets

---

### 5 — Accessibility

**Scope:** Any user-facing interface.
**Creator risks:** ADA (US), EN 301 549 (EU), AODA (Canada).
**What to check:** WCAG 2.1 AA minimum for commercial projects.
**Concrete actions (RECOMMENDED):**
- Run automated audit (Lighthouse, axe-core), fix Critical/Serious violations
- Add keyboard navigation for all interactive elements
- Add alt text to all images

---

### 6 — Commerce

**Scope:** Projects that sell products, subscriptions, or services.
**What to check:** VAT/tax collection, right of withdrawal (EU 14-day), invoice generation, consumer protection disclosures.
**Concrete actions (MANDATORY for EU commerce):**
- Display total price including VAT before purchase
- Provide a withdrawal form and process
- Send purchase confirmation with invoice

---

### 7 — AI and Algorithms

**Scope:** Projects using AI, ML models, or automated decision-making.
**Creator risks:** EU AI Act (2024+), transparency requirements, bias liability.
**Concrete actions (MANDATORY for EU):**
- Disclose when users interact with AI (chatbots, recommendations, decisions)
- For high-risk AI: document model, limitations, human oversight process
- Add a way for users to contest automated decisions

---

### 8 — Hosting and Data Location

**Scope:** Projects storing personal data about EU/US/regulated users.
**What to check:** Data storage location (EU data in EU), cross-border SCCs.
**Concrete actions (RECOMMENDED):**
- Document storage location in privacy policy
- If US cloud for EU users: verify GDPR-compliant terms + SCCs

---

### 9 — Minors

**Scope:** Any project that might be used by under-13 (US) or under-16 (EU).
**Concrete actions (MANDATORY if minors may use the product):**
- Add age gate or verification
- Remove targeted advertising for minors
- Add parental consent flow for under-13 accounts

---

### 10 — Security Breach Notification

**Scope:** Any project storing personal data.
**Creator risks:** GDPR 72h notification to authority, CCPA notification to users.
**Concrete actions (MANDATORY):**
- Document breach notification procedure (who, when, what)
- Identify relevant supervisory authority
- Prepare breach notification template

---

## How to run a Conformité session

### Step 1 — Scope the analysis

Identify the project's profile:
<output-format>
Conformité — Let me identify the applicable domains.

  Project type: {web app | mobile app | API | e-commerce | SaaS | tool | other}
  Target geography: {EU | US | global | specific country}
  Handles personal data: {yes | no | partially}
  Sells products or services: {yes | no}
  Uses AI/ML: {yes | no}
  Audience includes minors: {possible | no | unknown}
  Open source components: {yes | no}

  I'll now run targeted web searches for the regulations that apply to this profile.
</output-format>

### Step 2 — Web research

Run searches for the applicable domains. Use Rule 8 (precise queries):
`"{jurisdiction} {data_type} privacy law {year}"`, `"EU AI Act compliance checklist {year}"`, `"{license} commercial use requirements"`.

### Step 3 — Present findings by domain

For each applicable domain, present findings:

<output-format>
CONFORMITÉ — {domain_name}

  Applicable to this project: {yes | partially | no}
  Regulation: {GDPR | CCPA | ADA | EU AI Act | etc.}

  Creator risk: {description}
  User risk: {description}

  Findings:
  🔴 MANDATORY: {specific finding}
     Action: {concrete action — what to build or write}
  🟡 RECOMMENDED: {specific finding}
     Action: {concrete action}
  🟢 OPTIONAL: {specific finding}
     Action: {concrete action}
</output-format>

Skip domains that do not apply to this project.

### Step 4 — Summary and prioritization

<output-format>
CONFORMITÉ SUMMARY

  Domains analyzed: {count}
  🔴 MANDATORY items: {count}
  🟡 RECOMMENDED items: {count}
  🟢 OPTIONAL items: {count}

  Top 3 priority actions (MANDATORY, ranked by legal risk):
  1. {action} — domain: {domain} — effort: {estimate}
  2. {action} — domain: {domain} — effort: {estimate}
  3. {action} — domain: {domain} — effort: {estimate}

  ─────────────────────────────────────────
  1. Save the compliance report and continue
  2. Explore another domain

  Close keywords: "done" / "terminé", "close" / "on ferme"
</output-format>

---

## Saving output

<output-format>
### Conformité (validated)

- Agent: {agent who ran the mode}
- Project type: {type}
- Geography: {jurisdiction}

**Findings:**

| Domain | Severity | Finding | Action |
|--------|----------|---------|--------|
| Personal Data | 🔴 MANDATORY | No /privacy page | Create /privacy with data deletion form |
| Commerce | 🔴 MANDATORY | No VAT display | Show total price + VAT before purchase |
| Accessibility | 🟡 RECOMMENDED | No automated audit | Run Lighthouse, fix Critical violations |
| [domain] | [severity] | [finding] | [action] |

**MANDATORY items not yet addressed:** {count}
**Recommended next action:** {highest-risk item + concrete implementation step}
</output-format>
