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

---

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

**Creator risks:** Without ToS, the creator has no contractual protection. Users can claim anything.

**Concrete actions (MANDATORY for commercial):**
- Write `/terms` page: usage rules, prohibited behavior, account termination conditions
- Write `/legal` page (for EU): creator identity, business address, registration number

---

### 3 — Liability

**Scope:** Projects that give advice, process financial data, affect health, or make decisions.

**Creator risks:** If the product gives wrong advice and a user is harmed, liability depends on disclaimers.

**Concrete actions (RECOMMENDED):**
- Add disclaimers where the product gives advice (health, financial, legal)
- Document what the product does NOT guarantee
- Add error reporting and audit logs for decision-making systems

---

### 4 — Intellectual Property

**Scope:** Projects using open-source libraries, AI-generated content, third-party assets.

**What to check:**
- License compatibility (GPL vs MIT vs proprietary — can they be combined?)
- AI-generated code ownership (varies by tool and jurisdiction)
- Images, fonts, icons — are they licensed for commercial use?

**Concrete actions (MANDATORY):**
- Add a `LICENSES` or `NOTICE` file if required by open-source licenses used
- Check all open-source dependencies for license compatibility via `license-checker` or equivalent
- Replace any unlicensed assets (fonts, icons, images)

---

### 5 — Accessibility

**Scope:** Any user-facing interface.

**Creator risks:** ADA (US), EN 301 549 (EU), AODA (Canada) — legal claims possible.

**User risks:** People with disabilities cannot use the product.

**What to check:** WCAG 2.1 AA compliance minimum for commercial projects.

**Concrete actions (RECOMMENDED):**
- Run an automated accessibility audit (Lighthouse, axe-core)
- Fix Critical and Serious violations
- Add keyboard navigation for all interactive elements
- Add alt text to all images

---

### 6 — Commerce

**Scope:** Projects that sell products, subscriptions, or services.

**What to check:**
- VAT/tax collection (especially cross-border EU VAT)
- Right of withdrawal (EU: 14-day cooling-off period for digital products)
- Invoice generation (legally required in many jurisdictions)
- Consumer protection disclosures (price, delivery time, return policy)

**Concrete actions (MANDATORY for EU commerce):**
- Display total price including VAT before purchase
- Provide a withdrawal form and process
- Send purchase confirmation with invoice

---

### 7 — AI and Algorithms

**Scope:** Projects using AI, ML models, or automated decision-making.

**Creator risks:** EU AI Act (2024+), algorithmic transparency requirements, bias liability.

**What to check:**
- Is the system making decisions that affect people's rights or opportunities? (high-risk under EU AI Act)
- Is there human oversight for critical decisions?
- Are users informed when interacting with AI?

**Concrete actions (MANDATORY for EU):**
- Disclose when users interact with AI (chatbots, recommendations, decisions)
- For high-risk AI: document the model, its limitations, and the human oversight process
- Add a way for users to contest automated decisions

---

### 8 — Hosting and Data Location

**Scope:** Projects storing personal data about EU, US, or other regulated users.

**What to check:**
- Where is the data stored? (EU data must stay in EU or in approved countries under GDPR)
- Are cross-border data transfers covered by Standard Contractual Clauses (SCCs)?

**Concrete actions (RECOMMENDED):**
- Document data storage location in the privacy policy
- If using US cloud services for EU users: verify they have GDPR-compliant terms + SCCs

---

### 9 — Minors

**Scope:** Any project that might be used by people under 13 (US) or 16 (EU).

**What to check:**
- Is there age verification?
- Is parental consent obtained for under-13 users?
- Are there features that should be restricted for minors?

**Concrete actions (MANDATORY if minors may use the product):**
- Add an age gate or age verification
- Remove targeted advertising for minors
- Add parental consent flow for accounts under 13

---

### 10 — Security Breach Notification

**Scope:** Any project storing personal data.

**Creator risks:** GDPR requires notification to the supervisory authority within 72 hours of discovering a breach. CCPA requires notification to affected users.

**Concrete actions (MANDATORY):**
- Document the breach notification procedure (who notifies, who decides, what timeline)
- Identify the relevant supervisory authority for the project's primary geography
- Prepare a breach notification template (what to say to users)

---

## How to run a Conformité session

### Step 1 — Scope the analysis

Identify the project's profile:
```
Conformité — Let me identify the applicable domains.

  Project type: {web app | mobile app | API | e-commerce | SaaS | tool | other}
  Target geography: {EU | US | global | specific country}
  Handles personal data: {yes | no | partially}
  Sells products or services: {yes | no}
  Uses AI/ML: {yes | no}
  Audience includes minors: {possible | no | unknown}
  Open source components: {yes | no}

  I'll now run targeted web searches for the regulations that apply to this profile.
```

### Step 2 — Web research

Run searches for the applicable domains. Use Rule 8 (precise queries):

```
"{jurisdiction} {data_type} privacy law {current_year}"
"{jurisdiction} e-commerce consumer protection requirements {current_year}"
"EU AI Act compliance checklist {current_year}"
"{open_source_license} commercial use requirements"
```

### Step 3 — Present findings by domain

For each applicable domain, present findings:

```
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
```

Skip domains that do not apply to this project.

### Step 4 — Summary and prioritization

```
CONFORMITÉ SUMMARY

  Domains analyzed: {count}
  🔴 MANDATORY items: {count}
  🟡 RECOMMENDED items: {count}
  🟢 OPTIONAL items: {count}

  Top 3 priority actions (MANDATORY, ranked by legal risk):
  1. {action} — domain: {domain} — effort: {estimate}
  2. {action} — domain: {domain} — effort: {estimate}
  3. {action} — domain: {domain} — effort: {estimate}
```

---

## Saving output

```markdown
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
```
