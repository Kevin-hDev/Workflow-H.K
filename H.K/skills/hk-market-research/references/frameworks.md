# Strategic frameworks — Detailed reference

How to apply each framework with collected data.

---

## SWOT (Strengths, Weaknesses, Opportunities, Threats)

### How to feed each quadrant

| Quadrant | Data sources | Method |
|----------|-------------|--------|
| **Strengths** | Positive reviews (WebFetch G2/Capterra/Trustpilot), financial reports (Finnhub), patents | NLP on positive reviews, solid financial metrics |
| **Weaknesses** | Negative reviews, Reddit complaints, Glassdoor, support tickets | NLP on negative reviews, recurring frustration themes |
| **Opportunities** | Google Trends (growth), GDELT (favorable regulation), FRED (market growth) | Rising trends, gaps in competitor offerings |
| **Threats** | Competitor monitoring (WebSearch), competitor patents, negative PESTEL | New entrants, regulatory changes |

### Output format

```markdown
### SWOT — {Subject}

| | Positive | Negative |
|---|---------|---------|
| **Internal** | **Strengths**: [list] | **Weaknesses**: [list] |
| **External** | **Opportunities**: [list] | **Threats**: [list] |
```

---

## PESTEL (Political, Economic, Social, Technological, Environmental, Legal)

### Sources per factor

| Factor | Primary source | Secondary source |
|--------|---------------|-----------------|
| **Political** | GDELT (government news) | WebSearch (sector policy) |
| **Economic** | FRED + World Bank + Eurostat | Finnhub (sector data) |
| **Social** | Reddit (opinions) + WebSearch (demographics) | Google Trends (behaviors) |
| **Technological** | WebSearch (innovations) + patents (USPTO) | GitHub trending |
| **Environmental** | GDELT (climate regulation) | WebSearch (ESG, sustainability) |
| **Legal** | WebSearch (legislation) + GDELT | EUR-Lex (EU regulation) |

### Output format

```markdown
### PESTEL — {Industry}

| Factor | Trend | Impact | Source |
|--------|-------|--------|--------|
| Political | {description} | Positive/Negative/Neutral | {source} |
| Economic | {description} | ... | ... |
| Social | {description} | ... | ... |
| Technological | {description} | ... | ... |
| Environmental | {description} | ... | ... |
| Legal | {description} | ... | ... |
```

---

## Porter's Five Forces

### Sources per force

| Force | What to measure | Sources |
|-------|----------------|---------|
| **Rivalry** | Number of competitors, price wars, differentiation | WebSearch competitors, Finnhub prices |
| **New entrants** | Entry barriers, recent startups, patents | WebSearch funding, USPTO patents |
| **Substitutes** | Alternatives, tech trends, behavior changes | Google Trends, Reddit |
| **Buyer power** | Price sensitivity, switching costs, concentration | Reddit opinions, reviews |
| **Supplier power** | Concentration, dependencies, alternatives | WebSearch supply chain |

### Scoring

Each force is rated from 1 (weak) to 5 (strong):
- 1-2: Weak force → favorable for entering the market
- 3: Moderate force → vigilance required
- 4-5: Strong force → significant barrier or risk

---

## TAM/SAM/SOM (Market sizing)

### Estimation methods

**TAM (Total Addressable Market)** — total worldwide market:
- Top-down: sector reports (WebSearch) + macro data (World Bank)
- Bottom-up: number of potential customers x average price

**SAM (Serviceable Addressable Market)** — reachable market:
- TAM filtered by: geography, customer segment, distribution channel

**SOM (Serviceable Obtainable Market)** — capturable market:
- SAM x realistic capture rate (1-5% for a new entrant)
- Requires internal data (not 100% automatable)

### Automatable sources

| Level | Source | Automatable |
|-------|--------|------------|
| TAM | World Bank (sector GDP) + reports via WebSearch | Yes |
| SAM | Geo/demo filters + SimilarWeb/competitor data | Partially |
| SOM | Internal data (conversion, capacity) | No |

---

## JTBD (Jobs-to-be-Done)

### Automatic job extraction

1. **Collect** product reviews (WebFetch on G2, Capterra, Amazon)
2. **Identify** verb-object patterns: "I want to [verb] [object]"
3. **Categorize**:
   - Functional jobs: "send invoices quickly"
   - Emotional jobs: "feel secure"
   - Social jobs: "impress my colleagues"
4. **Prioritize** by frequency x dissatisfaction

Sources: Reddit (frustrations), product reviews, specialized forums

---

## Blue Ocean Strategy Canvas

### Building the value curve

1. **Identify competitive factors** in the sector
   (price, quality, features, service, speed, etc.)
2. **Score each competitor** from 1 to 5 on each factor
   (via reviews, WebSearch comparisons, product data)
3. **Plot the curve** for each competitor
4. **Identify** factors where all competitors look alike
   (differentiation opportunity)

Limitation: the "Create" dimension (entirely new factors)
requires human creativity. AI excels at mapping what exists
but struggles to invent the truly new.

---

## World Bank indicators by domain

Use --indicator with these IDs instead of --search (which is slow).
Pick 2-3 relevant indicators per study, not all of them.

### Technology / IT / SaaS

| Indicator | ID | What it measures |
|-----------|-----|-----------------|
| Internet users (% pop) | IT.NET.USER.ZS | Digital adoption |
| ICT service exports (% service exports) | BX.GSR.CCIS.ZS | IT industry size |
| Fixed broadband subscriptions (per 100) | IT.NET.BBND.P2 | Infrastructure |
| Mobile subscriptions (per 100) | IT.CEL.SETS.P2 | Mobile reach |
| High-tech exports (% manufactured exports) | TX.VAL.TECH.MF.ZS | Innovation output |
| R&D expenditure (% GDP) | GB.XPD.RSDV.GD.ZS | Innovation investment |

### Finance / Fintech

| Indicator | ID | What it measures |
|-----------|-----|-----------------|
| Domestic credit to private sector (% GDP) | FS.AST.PRVT.GD.ZS | Financial depth |
| Account ownership (% age 15+) | FX.OWN.TOTL.ZS | Financial inclusion |
| Commercial bank branches (per 100K) | FB.CBK.BRCH.P5 | Banking access |
| Stock market capitalization (% GDP) | CM.MKT.LCAP.GD.ZS | Capital markets |

### Healthcare / Biotech

| Indicator | ID | What it measures |
|-----------|-----|-----------------|
| Health expenditure (% GDP) | SH.XPD.CHEX.GD.ZS | Healthcare spending |
| Physicians (per 1,000) | SH.MED.PHYS.ZS | Healthcare workforce |
| Life expectancy | SP.DYN.LE00.IN | Health outcomes |
| Out-of-pocket health spending (%) | SH.XPD.OOPC.CH.ZS | Cost burden |

### E-commerce / Retail / Consumer

| Indicator | ID | What it measures |
|-----------|-----|-----------------|
| GDP per capita (current US$) | NY.GDP.PCAP.CD | Purchasing power |
| Population (total) | SP.POP.TOTL | Market size |
| Urban population (%) | SP.URB.TOTL.IN.ZS | Urbanization |
| Inflation (consumer prices %) | FP.CPI.TOTL.ZG | Price stability |
| Trade (% GDP) | NE.TRD.GNFS.ZS | Openness |

### Energy / Cleantech

| Indicator | ID | What it measures |
|-----------|-----|-----------------|
| Renewable energy (% total) | EG.FEC.RNEW.ZS | Green transition |
| CO2 emissions (metric tons per capita) | EN.ATM.CO2E.PC | Environmental impact |
| Energy use (kg oil equiv per capita) | EG.USE.PCAP.KG.OE | Energy consumption |
| Access to electricity (%) | EG.ELC.ACCS.ZS | Infrastructure |

### Education / EdTech

| Indicator | ID | What it measures |
|-----------|-----|-----------------|
| Govt expenditure on education (% GDP) | SE.XPD.TOTL.GD.ZS | Education investment |
| School enrollment tertiary (%) | SE.TER.ENRR | Higher ed access |
| Literacy rate (% adult) | SE.ADT.LITR.ZS | Baseline |
| Researchers in R&D (per million) | SP.POP.SCIE.RD.P6 | Talent pool |
