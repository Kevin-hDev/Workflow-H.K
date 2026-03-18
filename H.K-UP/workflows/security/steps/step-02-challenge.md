---
step: "02"
name: "Table Ronde Duel — The Mask vs Nyx"
workflow: security
agents: [the-mask, nyx]
arbitrator: user
---

# Step 02 — Table Ronde Duel: The Mask vs Nyx

> **CRITICAL — Rule 8:** The Mask MUST do a web search before entering. Real attackers use today's tools.
> **CRITICAL — Rule 1:** The USER arbitrates. The Mask and Nyx present. The user decides every verdict.
> **CRITICAL — 3 STEPS MAX:** The Mask must demonstrate every attack in entry → escalation → impact.
> **CRITICAL:** Minimum 3 rounds. The highest DREAD findings and any BLOCK control points must be attacked.
> **CRITICAL:** No report. A PoC in 3 steps. If The Mask can't demonstrate it in 3 steps, it doesn't count.

---

## Goal

Red team vs blue team confrontation. The Mask builds exploit chains targeting the findings from step-01. Nyx defends (or acknowledges gaps). The user arbitrates each round. The goal is to test what actually holds under attack — not what should theoretically hold.

---

## Setup — The Mask enters

Before starting any round, The Mask must:

1. **Web search for latest exploits** (Rule 8 — precise queries):
   ```
   "{stack} exploit technique {current_year}"
   "{highest_DREAD_finding_component} attack PoC {current_year}"
   "{CVE_from_step01} exploit chain"
   "{auth_mechanism} bypass {current_year}"
   ```

2. **Load security attack data** (INDEX_THEN_SELECTIVE — focus on `atk-*` files from `data/security/index.md`)

3. **Review step-01 findings** — The Mask targets:
   - All findings with DREAD score ≥ 30 (High/Critical)
   - All BLOCK control point violations
   - Any CVE found in step-01 that applies to this codebase
   - Combinations: one low + one medium → potential critical chain

---

⛔ STOP CHECK
- Step-01 STRIDE findings in memory? [YES/NO]
- Step-01 DREAD scores in memory? [YES/NO]
- Step-01 BLOCK control points in memory? [YES/NO]
- The Mask web search for latest exploits completed? [YES/NO]
- Security atk-* DATA files READ (not just listed)? [YES/NO]
- Ready to start the duel? [YES/NO]

⛔ STOP CONDITION: If any check = NO → Go back and complete the missing step before starting rounds.

---

## Round format

Each round follows this exact structure. The user does NOT skip the verdict.

<output-format>
TABLE RONDE DUEL — Round {N}

  ────────────────────────────────────────────────────────────────
  🔴 THE MASK — Attack
  ────────────────────────────────────────────────────────────────

  Vector: {description of the attack surface targeted}
  Targets: {DREAD finding(s) from step-01 being exploited, or "New vector discovered"}
  Evidence: {CVE-YYYY-NNNNN | technique name | code path at file:line}

  Chain (3 steps max):
    1. Entry:      {Exact entry point — how the attacker gets in}
    2. Escalation: {How access is widened or privilege gained}
    3. Impact:     {What is stolen, corrupted, or broken}

  Demonstration confidence: {High — I can show this in code | Medium — requires specific conditions | Low — theoretical}

  ────────────────────────────────────────────────────────────────
  🔵 NYX — Defense
  ────────────────────────────────────────────────────────────────

  Current mitigation: {What defense exists in the current code — or "NONE"}
  Evidence: {file:line where the mitigation is implemented, or "No mitigation found"}
  Assessment: {Holds | Partially holds | Does not hold}

  If "Partially holds" or "Does not hold":
    Gap: {What exactly fails in the current defense}
    Recommended fix: {Specific remediation — library, pattern, or code change}
    Effort: {Low (< 1 day) | Medium (1–3 days) | High (> 3 days)}

  ────────────────────────────────────────────────────────────────
  ⚖️ USER — Verdict
  ────────────────────────────────────────────────────────────────

  1. FIX         → Added to remediation plan in step-03 with priority {Critical/High/Medium}
  2. ACCEPT RISK → Reason: {user's stated reason} — Documented in security-audit.md as accepted risk
  3. DEFER       → Target milestone: {version or sprint} — Documented in security-audit.md as deferred risk
</output-format>

---

## Round selection strategy

The Mask must cover these targets across the rounds (in priority order):

**Priority 1 — BLOCK control points (if any)**
Any violation from step-01 Phase 5 must be attacked first. These are confirmed entry points.

**Priority 2 — Critical/High DREAD findings**
All findings scored ≥ 30 in step-01 must be attacked. One round per finding minimum.

**Priority 3 — Chained attacks**
The Mask looks for combinations: two low/medium findings that together create a high-severity chain. These are the most dangerous — and the most overlooked.

**Priority 4 — CVEs from step-01**
Any CVE identified in step-01 Phase 1 that applies to this codebase gets its own round.

**Minimum:** 3 rounds.
**Maximum:** Stop when all Priority 1 and 2 targets are covered, or when the user calls a halt.

---

## Mid-duel: Zero's optional intervention

Zero may intervene between rounds if The Mask's attack reveals a defensive assumption Nyx hasn't challenged yet.

If Zero intervenes:

<output-format>
  ⚡ ZERO — Challenge

  "Actually… {the defensive assumption being challenged}
   {Paper / benchmark / incident reference}
   {Why the current defense may be weaker than Nyx thinks}
   Alternative: {what a stronger defense would look like}"

  Nyx may revise their assessment before the user votes.
</output-format>

Zero only intervenes when there is evidence (reference, benchmark, incident) — not speculation.

---

## Duel summary

After all rounds are complete:

<output-format>
DUEL SUMMARY — The Mask vs Nyx

  Rounds completed:        {count}
  Attacks attempted:       {count}
  Defenses held:           {count}
  Defenses partially held: {count}
  Gaps confirmed:          {count}

  User verdicts:
    FIX:         {count} → entering remediation plan
    ACCEPT RISK: {count} → documented as accepted
    DEFER:       {count} → documented with target milestone

  Highest-impact undefended attack:
    Round {N}: {brief description} — DREAD {score}/50

  Zero interventions: {count | "None"}
</output-format>

---

## Reflection modes

After the duel summary:

<output-format>
Step 02 complete. The duel is over.

  REFLECTION MODES
  1. Table Ronde  — Open round: invite Nyx + The Mask to debate accepted risks
  2. Prisme       — Sécurité: Compliance / Privacy / Supply chain
                  — Business: cost of a breach vs cost of the fix
  3. Conformité   — Legal exposure from the accepted risks (GDPR, liability, breach notification)
  4. Simulation   — Incident Response: run a simulated breach scenario on the highest gap

  ─────────────────────────────────
  S. Save and continue to step 03 → Security Audit Report
</output-format>

**Before executing any mode above, LOAD its data file:**
- Table Ronde → LOAD `data/modes/table-ronde.md`
- Prisme → LOAD `data/modes/prisme.md` + `data/prisme-facettes.csv`
- Conformité → LOAD `data/modes/conformite.md`
- Simulation → LOAD `data/modes/simulation.md`

---

## Transition

<output-format>
Step 02 done.

  Rounds completed: {count}
  FIX verdicts:     {count} ({list of round numbers})
  Accepted risks:   {count}
  Deferred:         {count}

→ Step 03 — step-03-report.md
  Agent: Nyx
  Nyx consolidates all step-01 findings and step-02 verdicts into security-audit.md.
  Transmitting: DREAD scores + duel verdicts + remediation priorities + accepted/deferred risks
</output-format>

Update `hk-up-status.yaml`: step-02-challenge → done
