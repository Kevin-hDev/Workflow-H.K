---
step: "04"
name: "Path Recommendation"
workflow: diagnostic
agent: eclaireur
---

# Step 04 — Path Recommendation

> **CRITICAL — Rule 1:** The user confirms the path. Never commit to a path without confirmation.
> **CRITICAL — Rule 3:** Offer the reflection modes menu before asking for confirmation.
> **CRITICAL — Rule 9:** These first 10 lines are your priority.
> **CRITICAL:** Use the size × objective matrix. Do not invent a path.
> **CRITICAL:** If ambition exceeds size, propose escalade before presenting the path.

---

## Goal

Use the size × objective matrix to recommend the right path.
Present what it includes. Detect escalade scenarios. Get user confirmation.

---

## Size × objective matrix

| Objective | SMALL (<5K LOC) | MEDIUM (5K–50K LOC) | LARGE (>50K LOC) |
|-----------|-----------------|---------------------|------------------|
| Evolve | Express | Standard | Full |
| Modernize | Express | Standard + web research | Full + Audit |
| Add Features | Express | Express+ | Standard |
| Redesign | Design | Design+ | Full Design |
| Audit | Light Audit | Audit | Full Audit |
| Restructure | Express | Standard | Full + Migration |

**Multiple objectives:** Use the most demanding objective as the baseline.
Example: Evolve + Redesign, MEDIUM project → Standard (Evolve baseline) + Designer agent added.

---

## Path descriptions

### Express (~3–5 missions)
- Agents: L'Éclaireur → L'Architecte → Le Chirurgien → Le Gardien
- Documents: `project-context.md`, `plan.md`
- No formal PRD. Direct execution after a quick plan.

### Standard (~8–15 missions)
- Agents: L'Éclaireur → Le Stratège → L'Architecte → Le Chirurgien + Le Gardien
- Documents: `project-context.md`, `prd.md`, `architecture.md`, `plan.md`
- Brainstorm + PRD before execution.

### Full (~15–30 missions)
- Agents: ALL (including Nyx, Designer if UI, The Mask, Zero in Table Rondes)
- Documents: ALL (`project-context.md`, `prd.md`, `architecture.md`, `spec-design.md`, `security-audit.md`, `plan.md`)
- Full brainstorm, architecture, security audit, then execution.

### Design (~5–12 missions)
- Agents: L'Éclaireur → Le Designer → Le Stratège → Le Chirurgien + Le Gardien
- Documents: `project-context.md`, `spec-design.md`, `plan.md`
- Focus on UI/UX. Optional functional spec from Le Stratège.

### Audit (~3–5 missions, no coding)
- Agents: L'Éclaireur → Nyx → [The Mask + Zero in Table Ronde]
- Documents: `project-context.md`, `security-audit.md`, `audit-report.md`
- Read-only. Output is a standalone exportable report.

---

## Recommendation format

Present the recommendation:

```
Based on your project (SIZE: {size_class}) and your objective ({objectives}),
I recommend: **{path_name}**

What this includes:
  Phases:    {phases_list}
  Agents:    {agents_list}
  Documents: {documents_list}
  Estimate:  ~{mission_count} missions · ~{session_estimate} sessions

{optional_escalade_note}

Does this work for you? Or would you like to adjust?
```

---

## Escalade detection

If ambition signals were detected in step-03, or if the user's vision implies
more scope than the recommended path covers:

```
Note: Based on what you described, this could grow beyond the standard scope
for a {size_class} project. I could recommend:

  1. Stay on {recommended_path} — faster, more focused
  2. Escalate to {higher_path} — more thorough, covers your full vision
  3. Let's discuss it (Table Ronde with Le Stratège)

What do you prefer?
```

---

## Reflection modes menu

After presenting the recommendation:

```
Before confirming, would you like to explore further?

  REFLECTION MODES
  1. Table Ronde       — Debate the path choice with multiple agents
  2. Conformité        — Check legal risks before committing
  3. Benchmark Vivant  — Compare with current industry standards for this stack

  ─────────────────────────────────────────
  S. Save and confirm the path
```

---

## Transition

After the user confirms:

```
Step 04 complete.

Confirmed path: {confirmed_path}
Estimated scope: ~{mission_count} missions

→ Step 05 — Final confirmation and project-context.md creation.
```

Update `hk-up-status.yaml`: `3-2-objectif-parcours → step-04: done`
Proceed to **step-05-confirm.md**
