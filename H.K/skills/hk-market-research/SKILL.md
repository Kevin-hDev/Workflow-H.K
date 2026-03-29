---
name: hk-market-research
description: "Conduct automated market research and competitive analysis using free APIs and web data. Use when analyzing a market, industry, competitor, product opportunity, or business idea. Use when applying SWOT, PESTEL, Porter's Five Forces, TAM/SAM/SOM, or any strategic framework to real data. Triggers on: market research, study market, analyse de marche, etude de marche, competitive analysis, analyse concurrentielle, industry analysis, SWOT, PESTEL, Porter, TAM SAM SOM, market opportunity, opportunite marche, /hk-market-research."
argument-hint: "<industry, topic, or company to analyze>"
allowed-tools:
  - "Bash(uv run python3 /Users/kevinh/.claude/skills/hk-market-research/scripts/*)"
  - "WebSearch"
  - "WebFetch"
---

# Market Research — Automated market analysis

This skill runs a complete market study by combining:
- **WebSearch/WebFetch** (native Claude Code) for web research
- **Python scripts** (stdlib-only) for free structured data APIs
- **Claude itself** for analysis, sentiment, and strategic synthesis

Fully autonomous. No questions to the user.

<critical_constraints>
This workflow has 5 phases (0-4). Execute IN ORDER.
Phase N+1 is impossible without completing Phase N.
Phase 0 checks which API keys are available — run it first.
Phase 2 has a STOP CHECK at the end — you cannot pass to Phase 3
until the stop check criteria are met.
The "Limitations and biases" section in Phase 4 is mandatory — never omit it.
</critical_constraints>

## Materialize this checklist with TaskCreate — one task per item

Create a task for each item below. Check off as you complete them.
Do NOT track these mentally — use TaskCreate so skipped steps are visible.

- Phase 0: Pre-check (list available API keys and sources)
- Phase 1: Scoping (industry, geo, competitors, central question)
- Phase 2 source: WebSearch
- Phase 2 source: WebFetch
- Phase 2 source: GDELT
- Phase 2 source: Reddit
- Phase 2 source: Google Trends (WebFetch on trends.google.com)
- Phase 2 source: FRED (if FRED_API_KEY available)
- Phase 2 source: World Bank
- Phase 2 source: Finnhub (if FINNHUB_API_KEY available)
- Phase 2: STOP CHECK (count sources, verify minimum 4)
- Phase 3: Strategic analysis (2+ frameworks)
- Phase 4: Report written to {project}-output/market-research.md
- Phase 4: Limitations and biases section included

---

## Quick Start

```bash
# Search global news on a topic (GDELT, free unlimited)
uv run python3 /Users/kevinh/.claude/skills/hk-market-research/scripts/gdelt_search.py "artificial intelligence" --mode artlist --max 20

# US economic data (FRED, 800K+ series)
uv run python3 /Users/kevinh/.claude/skills/hk-market-research/scripts/fred_data.py "GDP" --limit 5
# Then with a series ID:
uv run python3 /Users/kevinh/.claude/skills/hk-market-research/scripts/fred_data.py --series GDPC1 --observations --start 2024-01-01

# Company financial data (Finnhub)
uv run python3 /Users/kevinh/.claude/skills/hk-market-research/scripts/finnhub_data.py --profile AAPL
uv run python3 /Users/kevinh/.claude/skills/hk-market-research/scripts/finnhub_data.py --news AAPL --from 2026-03-01
uv run python3 /Users/kevinh/.claude/skills/hk-market-research/scripts/finnhub_data.py --market-news "AI"

# World indicators (World Bank, unlimited)
uv run python3 /Users/kevinh/.claude/skills/hk-market-research/scripts/world_bank_data.py --indicator NY.GDP.MKTP.CD --country FR --start 2020

# Social opinions (Reddit, 100 req/min)
uv run python3 /Users/kevinh/.claude/skills/hk-market-research/scripts/reddit_search.py "market research AI tools" --subreddit entrepreneur --sort relevance --limit 15
```

---

## Workflow: Complete market study

### Phase 0 — Pre-check available sources

Run this before anything else to know which sources are available:

```bash
echo "FRED_API_KEY: ${FRED_API_KEY:-(MISSING)}"
echo "FINNHUB_API_KEY: ${FINNHUB_API_KEY:-(MISSING)}"
```

Record which API keys are present. Sources without keys (GDELT, World
Bank, Reddit, Google Trends, WebSearch, WebFetch) are always available.
Adapt your Phase 2 strategy based on what is actually reachable.

### Phase 1 — Scoping

Determine from context (argument, project, brainstorm):
- **Industry/sector** target
- **Geographic zone** (global, EU, France, US, etc.)
- **Competitors** identified or to identify
- **Central question** (opportunity? threat? positioning?)

### Phase 2 — Data collection

Collect in parallel from multiple sources.
Each source provides a different angle:

| Source | What it provides | Command |
|--------|-----------------|---------|
| **WebSearch** | General overview, recent articles, competitor sites | Native WebSearch |
| **WebFetch** | Detailed content from specific pages | Native WebFetch |
| **GDELT** | Global news, media coverage, trends | `gdelt_search.py` |
| **FRED** | US macro data (GDP, unemployment, inflation, rates) | `fred_data.py` |
| **World Bank** | Global indicators (200+ countries, 1400+ indicators) | `world_bank_data.py` |
| **Finnhub** | Financial data, company profiles, sector news | `finnhub_data.py` |
| **Reddit** | Opinions, frustrations, unmet needs | `reddit_search.py` |
| **Google Trends** | Search trends, seasonality, regional interest | WebSearch "google trends [topic]" (see note below) |

**Google Trends note:** trends.google.com is a dynamic JS app — WebFetch
returns an empty page. Instead, use WebSearch with queries like
`"google trends" [topic] site:trends.google.com` or
`[topic] "search interest over time"` to find published trend data.

**JS-only pages fallback:** If WebFetch returns only CSS/empty HTML
(no readable content), the page is rendered client-side. Do not retry
the same URL. Instead, WebSearch for the page title or key content
to find the same information from a different source or cached version.

**WebFetch redirect (301/302):** If WebFetch returns a redirect instead
of content, re-fetch the redirect URL. Do not skip — the data is there.

<important if="collecting data in Phase 2">
Cross-reference minimum 3 different sources for each claim.
One source = hypothesis. Three concordant sources = fact.
Reddit --sort new without a subreddit returns irrelevant results.
Use --sort relevance by default, or specify a subreddit.
If Reddit returns 0 results: try broader terms, remove jargon,
try related subreddits (r/technology, r/startups, r/entrepreneur,
r/smallbusiness, r/SaaS). Max 3 attempts before marking as empty.
If a script fails with rate limit (429): wait 30 seconds and retry
once before abandoning. Do not silently skip — retry first.
For each API key found available in Phase 0, run at least one query
in Phase 2. Do not skip an available source — if the key exists, use it.
Do NOT launch scripts in parallel with WebSearch — rate limits on
one script can cascade-cancel parallel tool calls.
Run scripts SEQUENTIALLY after WebSearch calls complete.
Scripts on DIFFERENT APIs (e.g. GDELT then Reddit then World Bank)
can run back-to-back but not in parallel with each other.
</important>

### STOP CHECK — End of Phase 2

Before moving to Phase 3, execute this verification:

1. Count the source categories with usable data: ____
   Minimum required: **4 distinct source categories**.
   (WebSearch, WebFetch, GDELT, Reddit, Google Trends, FRED, World Bank, Finnhub)
   - If < 4: retry failed scripts (1 retry with 30s delay)
   - If still < 4 after retry: try untested sources from Phase 0
   - If still < 4 after all attempts: document why in the report

2. Cross-reference check — fill this table for each key claim:

   | Claim | Source 1 | Source 2 | Source 3 | Status |
   |-------|----------|----------|----------|--------|
   | ...   | ...      | ...      | ...      | OK/MISSING |

   If any key claim has < 3 sources: search for corroboration now.

3. Update the TaskCreate tasks for each source with its status
   (success / failed-retried / unavailable / skipped-irrelevant).

**Phase 3 is BLOCKED until this stop check passes.**

### Phase 3 — Strategic analysis (separate from report writing)

Apply frameworks suited to the context.
Claude performs the analysis itself from collected data.

**Available frameworks** (see [references/frameworks.md](references/frameworks.md)):

| Framework | When to use it |
|-----------|---------------|
| **SWOT** | Synthetic view of strengths/weaknesses/opportunities/threats |
| **PESTEL** | Macro-environment analysis (political, economic, social, tech, environmental, legal) |
| **Porter 5 Forces** | Competitive intensity of a sector |
| **TAM/SAM/SOM** | Market size estimation |
| **JTBD** | Identifying unmet user needs |
| **Blue Ocean** | Value mapping vs competitors |

**Do not apply all frameworks systematically.**
Choose those that answer the central question from scoping.

<important if="completing Phase 3">
Phase 3 produces an INTERMEDIATE deliverable: a structured analysis
summary displayed in the conversation (not a separate file).
Output the analysis with frameworks applied, key findings, and data
points BEFORE starting Phase 4. Do not merge analysis and report
writing into one step. The sequence is:
1. Display analysis summary in conversation
2. Mark Phase 3 task as completed
3. Then start Phase 4 (write the report file)
</important>

### Phase 4 — Synthesis and report

Generate the report in `{project}-output/market-research.md`:

```markdown
# Market Research — {Subject}

**Date:** {YYYY-MM-DD}
**Scope:** {industry, geo, competitors}
**Central question:** {what we're trying to understand}

## Executive summary
{3-5 bullet points of key conclusions}

## Data collected
### Sources used
{List of sources with collection dates}

### Key data
{Numbers, trends, key facts}

## Analysis
### {Framework 1 applied}
{Structured analysis}

### {Framework 2 applied}
{Structured analysis}

## Conclusions and recommendations
{Answer to the central question, suggested actions}

## Limitations and biases
{What could not be verified, missing sources, identified biases}

## Sources
{Complete list with URLs and access dates}
```

**The "Limitations and biases" section is mandatory.** Never present
results as absolute certainties. AI can hallucinate, data can be
outdated, sources can be biased.

---

## Available scripts

### gdelt_search.py — Global news (free, unlimited)

GDELT indexes news from 100+ countries in real time. No API key.

```bash
# Search articles
uv run python3 scripts/gdelt_search.py "electric vehicles" --mode artlist --max 25

# Search by GDELT theme
uv run python3 scripts/gdelt_search.py "ECON_BANKRUPTCY" --mode artlist --theme --max 10

# Timeline: article volume over time
uv run python3 scripts/gdelt_search.py "bitcoin" --mode timeline --max 50
```

**Modes**: `artlist` (articles), `timeline` (temporal volume)
**Output**: JSON with title, URL, date, domain, language, tone

### fred_data.py — US economic data (free API key required)

FRED contains 800K+ time series from the Federal Reserve.

```bash
# Search series by keyword
uv run python3 scripts/fred_data.py "unemployment rate" --limit 5

# Get observations for a series
uv run python3 scripts/fred_data.py --series UNRATE --observations --start 2023-01-01

# Useful series: GDP, UNRATE, CPIAUCSL, FEDFUNDS, HOUST, PAYEMS
```

**API key**: environment variable `FRED_API_KEY`
Get free at fred.stlouisfed.org/docs/api/api_key.html

### finnhub_data.py — Financial data (free API key required)

Finnhub provides company profiles, prices, and company-specific news.

```bash
# Company profile
uv run python3 scripts/finnhub_data.py --profile AAPL

# Company news (requires stock SYMBOL, not keyword)
uv run python3 scripts/finnhub_data.py --news MSFT --from 2026-03-01 --to 2026-03-28
uv run python3 scripts/finnhub_data.py --news AAPL --from 2026-03-20

# General market news (optional keyword filter)
uv run python3 scripts/finnhub_data.py --market-news "AI"
uv run python3 scripts/finnhub_data.py --market-news

# Financial metrics
uv run python3 scripts/finnhub_data.py --metrics MSFT
```

**Query strategy:** `--news` requires a US stock symbol (MSFT, AAPL,
GOOGL), not a keyword. Use competitor symbols from Phase 1 scoping.
European symbols (TMV.DE, ADS.DE) return 403 on the free tier.
`--market-news "keyword"` filters the 100 latest general finance
articles — works for broad terms (AI, tech, inflation) but returns
0 for niche queries. For niche topics, prefer `--news SYMBOL`.

**API key**: environment variable `FINNHUB_API_KEY`
Get free at finnhub.io/register

### world_bank_data.py — Global indicators (free, no key)

World Bank offers 1400+ indicators for 200+ countries.

```bash
# Country GDP
uv run python3 scripts/world_bank_data.py --indicator NY.GDP.MKTP.CD --country FR --start 2018

# Population
uv run python3 scripts/world_bank_data.py --indicator SP.POP.TOTL --country US;CN;IN --start 2015

# Search indicator by keyword
uv run python3 scripts/world_bank_data.py --search "internet users"
```

**Useful indicators**: NY.GDP.MKTP.CD (GDP), SP.POP.TOTL (population),
IT.NET.USER.ZS (% internet users), NY.GDP.PCAP.CD (GDP/capita)

For domain-specific indicators (IT, finance, healthcare, energy, etc.),
see [references/frameworks.md](references/frameworks.md) section
"World Bank indicators by domain". Use --indicator with known IDs
instead of --search (faster and more reliable).

### reddit_search.py — Social opinions (free, 100 req/min)

Reddit as a source of opinions, frustrations, and needs.

```bash
# Search all of Reddit
uv run python3 scripts/reddit_search.py "best CRM for small business" --sort relevance --limit 20

# Search a specific subreddit
uv run python3 scripts/reddit_search.py "pricing strategy" --subreddit startups --limit 15

# Sort by date
uv run python3 scripts/reddit_search.py "AI market research" --sort new --limit 10
```

**Output**: title, score, comment count, URL, subreddit, excerpt

---

## Data collection rules (legal compliance)

1. **Public data only** — no login, no bypass
2. **Official APIs first** — direct scraping as last resort
3. **No personal data** — names, emails, phone numbers = excluded
4. **If WebFetch fails** on a site → note as inaccessible source, move on
5. **Rate limiting** — scripts include delays between requests
6. **Cite all sources** with URLs and dates in the final report

---

## What Claude does vs what scripts do

| Claude does (native) | Scripts do (APIs) |
|---------------------|-------------------|
| Web search (WebSearch) | Call structured data APIs |
| Page reading (WebFetch) | Parse JSON responses |
| Sentiment analysis | Handle authentication (API keys) |
| Strategic synthesis | Rate limiting and pagination |
| Framework application | Format data for Claude |
| Report writing | Error handling and retries |
| Source cross-referencing | — |

Scripts are **data collectors**. Claude is the **analytical brain**.

---

## APIs requiring a key (environment variables)

| Variable | API | How to get |
|----------|-----|-----------|
| `FRED_API_KEY` | FRED | fred.stlouisfed.org/docs/api/api_key.html |
| `FINNHUB_API_KEY` | Finnhub | finnhub.io/register |

APIs without keys (GDELT, World Bank, Reddit public) work directly.
If a key is missing, the script displays a clear error and Claude
continues with available sources.
