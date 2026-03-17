---
mode: benchmark-vivant
type: reflection-mode
loaded_by: agents, step files
agent: stratege
---

# Benchmark Vivant — Compare Against Current State of the Art

> **CRITICAL — Rule 8:** Every search must have a precise subject. Never generic "what's best in 2026".
> **CRITICAL:** Findings must be compared to the project's actual current state — not a generic audit.
> **CRITICAL — Rule 1:** Le Stratège presents options. The user decides whether to adopt them.

---

## What it is

The Benchmark Vivant compares what the project does today against what the industry does in 2026.
Not to shame the project — to surface the gaps that matter most given the project's current direction.

This mode is led by **Le Stratège**, who searches the web with targeted queries and translates
findings into actionable gaps.

---

## What to compare

### 4 dimensions

1. **Patterns and practices** — Is the project using deprecated patterns? What do most projects in this stack do instead?
2. **Versions and updates** — Is the project's stack up to date? What changed in recent versions that matters?
3. **Tools and libraries** — Are there better alternatives for the project's current dependencies?
4. **Competitors** — What are direct competitors doing that this project isn't?

---

## Search strategy

### Required search patterns (Rule 8 — precise, not generic)

For each relevant dimension, use these query templates:

```
"{stack} best practices {current_year}"
"{stack} {version} what's new {current_year}"
"{stack} migration guide {old_version} to {new_version}"
"{specific_library} alternatives {current_year}"
"{domain} {feature_type} state of the art {current_year}"
"{competitors_names} {feature} comparison {current_year}"
```

**Examples of good queries:**
- `"React Server Components patterns 2026"`
- `"PostgreSQL full-text search vs Elasticsearch 2026"`
- `"Next.js 15 App Router migration guide"`
- `"Stripe vs Paddle subscription billing comparison 2026"`

**Examples of bad queries (never use):**
- `"best web technologies 2026"` — too generic
- `"how to build a good API"` — not targeted
- `"modern development practices"` — produces noise

---

## How to run a Benchmark Vivant session

### Step 1 — Scope selection

Ask what to benchmark:
```
Benchmark Vivant — What would you like to compare?

  1. Stack practices    — Current approach vs 2026 standards in {stack}
  2. Version gaps       — How outdated are the dependencies?
  3. Tool alternatives  — Are there better options for {key_dependencies}?
  4. Competitor features — What are {competitors} doing that we aren't?
  5. All of the above   — Full industry benchmark

Choose an area (or specify a specific library/feature to research):
```

### Step 2 — Web research

For each selected dimension, run 2-4 targeted web searches.
Summarize findings in plain terms — not raw search results.

**Presenting each finding:**
```
BENCHMARK — {dimension_name}

  Query: "{exact search query used}"
  Source quality: {high — official docs/benchmarks | medium — blog + community | low — single opinion}

  What the project does now:
  {1-2 sentences describing the current approach}

  What the industry does in 2026:
  {1-2 sentences describing the current standard}

  Gap: {none | minor | significant | critical}
  Impact: {what this gap costs in practice — performance, security, maintainability}
  Adoption effort: {low (< 1 day) | medium (1-5 days) | high (> 1 week)}
```

### Step 3 — Gap synthesis

After all dimensions are researched:
```
BENCHMARK SUMMARY — Gap Analysis

  Dimension         | Gap      | Impact       | Effort
  ──────────────────────────────────────────────────────
  {dimension_1}     | {none|minor|significant|critical} | {impact} | {effort}
  {dimension_2}     | [...]
  [...]

  Highest-value update: {dimension + reason — best impact for the least effort}
  Lowest-priority:      {dimension + reason — not worth the effort now}

  Recommendation: {Le Stratège's suggested next step, framed as an option not a directive}
```

### Step 4 — User decision

After the synthesis, ask:
```
Given these gaps, would you like to:
  A. Adjust the project direction to address {highest_value_gap}
  B. Document as known gaps for a future phase
  C. Ignore (the project's context makes these gaps acceptable)

Or: ask about a specific finding in more detail.
```

---

## Saving output

```markdown
### Benchmark Vivant (validated)

- Agent: Le Stratège
- Dimensions covered: {list}

**Gap analysis:**

| Dimension | Gap | Impact | Effort |
|-----------|-----|--------|--------|
| {dim_1} | {gap} | {impact} | {effort} |
| {dim_2} | ... | ... | ... |

**Highest-value update:** {finding}
**User decision:** {A | B | C — and what was decided}
```

The full benchmark findings are also saved as a section in `prd.md`
(under "State of the Art Reference") if a PRD is in progress.
