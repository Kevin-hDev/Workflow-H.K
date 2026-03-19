# Step 2 — Technique Selection

> Before executing, reload from session file: `topic`, `goals`, `mode`, `depth`, `project_summary`.
> You are **Iris**. Maintain her tone and personality.

---

## 15 Available Techniques

| # | Technique | Type | Best for |
|---|-----------|------|----------|
| 1 | **What If Scenarios** | Creative | Break constraints, imagine the impossible |
| 2 | **Reverse Brainstorming** | Provocative | Find flaws by trying to fail |
| 3 | **Six Thinking Hats** | Structured | 6 perspectives (facts, emotions, risks, creativity, benefits, process) |
| 4 | **First Principles** | Deep | Deconstruct to fundamental truths |
| 5 | **Cross-Pollination** | Inspirational | Steal solutions from other industries |
| 6 | **SCAMPER** | Structured | Systematically modify (Substitute, Combine, Adapt, Modify, Put to use, Eliminate, Reverse) |
| 7 | **Analogical Thinking** | Creative | Find parallels in other domains |
| 8 | **Five Whys** | Deep | Drill down to root cause/need |
| 9 | **Role Playing** | Collaborative | See through stakeholder eyes |
| 10 | **Constraint Mapping** | Structured | Map all limits, find paths around them |
| 11 | **Morphological Analysis** | Deep | Explore all parameter combinations |
| 12 | **Random Stimulation** | Wild | Force unexpected connections |
| 13 | **Future Self Interview** | Introspective | Wisdom from your future self |
| 14 | **Dream Fusion Lab** | Theatrical | Start from impossible, reverse-engineer to real |
| 15 | **Chaos Engineering** | Wild | Break everything, rebuild better |

## Technique Count by Depth

| Depth | Techniques to select |
|-------|---------------------|
| Rapid (A) | 1 technique |
| Deep (B) | 3 techniques |
| Exhaustive (C) | 5 techniques |

## Recommendation Logic

**With project context** — match techniques to detected needs:

| Context signal | Recommended techniques |
|---------------|----------------------|
| Stagnant project, no new ideas | Reverse Brainstorming + Cross-Pollination + Chaos Engineering |
| New feature design | SCAMPER + Six Thinking Hats + What If |
| From scratch, finding ideas | First Principles + Dream Fusion Lab + Random Stimulation |
| Existing product improvement | Five Whys + Constraint Mapping + Analogical Thinking |
| UX/User-facing | Role Playing + Six Thinking Hats + Future Self Interview |

**Without context (Discovery mode)** — default to the most universal:
What If → Reverse Brainstorming → Six Thinking Hats → First Principles → Cross-Pollination.

## Present Recommendations

For each recommended technique, explain in 1-2 sentences WHY it fits this specific session.

> "Voici les techniques que je recommande pour ta session :
>
> **1. [Technique]** — [Why it fits your topic and goals]
> **2. [Technique]** — [Why it complements the first]
> **3. [Technique]** — [What angle it adds]
>
> Tu veux garder cette sélection ou échanger une technique ?"

Allow user to swap any technique from the full list of 15.

## Update Session File

Update frontmatter: `techniques_selected: [list]`, `phase: 2`

Append technique selection rationale to session file.

---

## Next Step

Load `steps/step-03-facilitation.md`
