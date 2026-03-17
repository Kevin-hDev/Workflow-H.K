<!-- Threat Modeling Skill | Version 1.0.0-universal | https://github.com/Kevin-hDev/claude-redteam-vs-blueteam | Original: https://github.com/fr33d3m0n/threat-modeling | License: BSD-3-Clause -->

# Threat Modeling Skill v1.0.0-universal

AI-native automated software risk analysis skill. LLM-driven, Code-First approach for comprehensive security risk assessment, threat modeling, security analysis, security audit, and penetration testing.

> **Based on** [threat-modeling v3.0.3](https://github.com/fr33d3m0n/threat-modeling) by [fr33d3m0n](https://github.com/fr33d3m0n) (BSD-3-Clause).
> **Adapted by** Kevin-hDev — universalized for any stack, integrated into the `claude-redteam-vs-blueteam` security audit chain.

## What's New in v1.0.0-universal

- **P0-DETECTION**: Auto-detects any tech stack (Rust, Flutter, Node, Python, Go, etc.) — no manual configuration required
- **INDEX-THEN-SELECTIVE**: Shared data loading from `data/offensive/`, `data/defensive/`, `data/shared/` — loads index first, selects only relevant data
- **Chain output**: Produces `threat_model_output.yaml` consumed by the next step in the audit chain (adversary-simulation)
- **Integrated chain**: Threat Modeling → Adversary Simulation → Defensive Hardening

See [CHANGELOG.md](CHANGELOG.md) for full version history.

## What's New in v3.0.3 (upstream)

- Comprehensively optimized the report system — reports are now more detailed and complete, with significantly enhanced human readability
- Now supports HTML format report output

## What's New in v3.0.2 (upstream)

- Major system architecture refactoring, improved security analysis depth and path coverage
- Backported SM2 state machine from next-gen AI-Native penetration testing system named "Cobweb" for problem-solving in depth
- Added multi-version task history and precise structured phase outputs for CI/CD integration
- Optimized context engineering and data disclosure, ~35% token reduction

## Security Audit Chain

This skill is the **first step** of a 3-step security audit chain:

```
Threat Modeling  →  Adversary Simulation  →  Defensive Hardening
     (this)              (step 2)                 (step 3)
```

**How data flows through the chain:**

1. `threat-modeling` produces `threat_model_output.yaml` (threats, attack paths, risk scores)
2. `adversary-simulation` reads that YAML and simulates offensive attacks
3. `defensive-hardening` reads adversary output and produces hardening recommendations

**Shared data directories** (read by all three steps):

| Directory | Contents |
|-----------|----------|
| `data/offensive/` | Attack patterns, CAPEC, ATT&CK TTPs |
| `data/defensive/` | Controls, ASVS, mitigations |
| `data/shared/` | CWE database, severity matrices, cross-references |

## Installation

### Option 1: Global Installation (Recommended)

```bash
# Clone the full claude-redteam-vs-blueteam repo
git clone https://github.com/Kevin-hDev/claude-redteam-vs-blueteam.git \
    ~/.claude/skills/claude-redteam-vs-blueteam

# Enable hooks (optional, for automatic validation)
cp ~/.claude/skills/claude-redteam-vs-blueteam/threat-modeling/hooks/settings-example.json \
   ~/.claude/settings.json
```

### Option 2: Project-Local Installation

```bash
# Clone to project's .claude/skills directory
mkdir -p .claude/skills
git clone https://github.com/Kevin-hDev/claude-redteam-vs-blueteam.git \
    .claude/skills/claude-redteam-vs-blueteam
```

### Requirements

- Claude Code CLI
- Python 3.10+
- SQLite3 (for knowledge base queries)

## Quick Start

1. **Start Claude Code** in your target project directory:
   ```bash
   cd /path/to/your/project
   claude
   ```

2. **Invoke the skill** with a simple prompt:
   ```
   /threat-modeling Perform a complete threat model analysis on @.
   ```

3. **Follow the 8-phase workflow** - Claude will guide you through each phase.

## Usage Modes

The skill supports **6 flexible application modes** beyond the standard 8-phase workflow:

### Mode 1: Complete Workflow (Standard)

Full 8-phase threat modeling for codebases.

```
/threat-modeling Perform a complete threat model analysis on @/path/to/project

Project context:
- This is an e-commerce platform backend API service
- Built with Django REST Framework
- User data includes PII and payment information

Focus areas: Authentication mechanisms, payment flow, API security
```

### Mode 2: Knowledge Base Consultation

Use as security consulting resource without executing complete workflow.

```
Query complete information for CWE-89 (SQL Injection),
including attack patterns, testing methods, and mitigations
```

**Response includes**: CWE overview, related CAPEC patterns, WSTG testing steps, ASVS requirements, mitigation examples.

### Mode 3: Deep Vulnerability Analysis

In-depth analysis of specific vulnerabilities or code snippets.

```
Analyze SSRF risk in this code, construct attack path and design POC
[Code snippet]
```

**Response includes**: Vulnerability mechanism, attack path, POC design, CWE/CAPEC/ATT&CK mapping.

### Mode 4: Security Test Generation

Generate test cases based on security standards.

```
Generate WSTG-based security test cases for this API endpoint
```

**Response includes**: Authentication, authorization, input validation, session management test cases with payloads.

### Mode 5: Forward Integration (Design Phase)

Pre-emptive threat modeling during design without waiting for code.

```
Conduct STRIDE threat analysis based on this API specification
[OpenAPI specification]
```

**Response includes**: DFD from API endpoints, trust boundaries, STRIDE enumeration, design recommendations.

### Mode 6: Backward Integration (Penetration Testing)

Attack path and POC design support for pentesting.

```
I found JWT signature verification bypass in the target system,
help construct complete attack chain
```

**Response includes**: Vulnerability confirmation, attack chain, POC payload, ATT&CK mapping, report template.

## Mode Selection Guide

| Mode | Input | Output | When to Use |
|------|-------|--------|-------------|
| **Complete Workflow** | Codebase | Full threat report | Development / Pre-release |
| **KB Consultation** | Question | Knowledge response | Any stage |
| **Vulnerability Analysis** | Code / Description | Attack path + POC | Code review / Pentest |
| **Test Generation** | Target description | Test checklist | Testing phase |
| **Forward Integration** | Design docs | Design-phase analysis | Design phase |
| **Backward Integration** | Found vulnerability | Attack chain + Plan | Penetration testing |

## Command Line Flags

| Flag | Description |
|------|-------------|
| `--debug` | Publish internal YAML data files and evaluation reports |
| `--lang=xx` | Set output language (en, zh, ja, ko, es, fr, de, pt, ru) |

**Examples**:
```bash
/threat-model @my-project                    # Default mode
/threat-model @my-project --debug            # With internal data
/threat-model @my-project --lang=zh --debug  # Chinese output with debug
```

## Advanced Scenarios (Extended Prompts)

Beyond the standard 8-phase workflow, use these extended prompts for deeper security analysis:

### Scenario 1: Complete Interface & Data Flow Discovery

Comprehensive discovery and risk analysis of all system interfaces.

```
/threat-modeling @/path/to/project

Perform complete interface and data flow discovery analysis:

1. Comprehensive discovery of all system interfaces:
   - User interaction interfaces (Web UI, CLI, Mobile)
   - External APIs (REST, GraphQL, gRPC, WebSocket)
   - System interfaces (File system, Database, Message queue)
   - Internal services (Microservice calls, RPC, Event bus)

2. Build complete data flow diagram:
   - Annotate all data entry and exit points
   - Identify sensitive data flow paths
   - Mark trust boundary crossing points

3. Risk analysis for each interface:
   - Input validation risks
   - Authentication/authorization risks
   - Data leakage risks
   - Injection attack risks

Output format: Complete interface inventory sorted by risk level, with CWE mapping and CVSS scores
```

### Scenario 2: Attack Tree, POC Generation & Pentest Plan

Deep attack chain analysis with exploit POC generation and penetration testing plan.

```
/threat-modeling @/path/to/project --debug

Based on discovered security issues, perform deep attack analysis:

1. Attack tree construction:
   - Build attack tree for each high-risk threat
   - Analyze attack prerequisites and dependencies
   - Calculate attack success probability and impact scope

2. Attack chain analysis:
   - Identify multi-step attack paths (Initial Access → Execution → Persistence → Exfiltration)
   - Map to MITRE ATT&CK tactics and techniques
   - Mark critical pivot points in attack chain

3. Exploit POC generation:
   - Generate POC code for each exploitable vulnerability
   - Include payload construction, trigger conditions, expected results
   - Provide safe testing methods (avoid destructive operations)

4. Penetration testing plan:
   | Issue ID | Vulnerability | Test Case | Test Steps | POC | Recommended Tools |
   |----------|---------------|-----------|------------|-----|-------------------|

Output: Complete penetration testing plan document, ready for security testing execution
```

### Scenario 3: Docker Test Environment & Automated Verification

Set up isolated test environment and execute penetration testing plan.

```
/threat-modeling @/path/to/project

Set up test environment and execute penetration test verification:

1. Environment analysis:
   - Parse project's docker-compose.yml / Dockerfile
   - Identify required service dependencies (database, cache, message queue)
   - Analyze default configuration and environment variables

2. Docker test environment construction:
   - Generate isolated test environment docker-compose.test.yml
   - Configure network isolation and port mapping
   - Prepare test data and initialization scripts
   - Integrate security testing tool containers (OWASP ZAP, Nuclei, SQLMap)

3. Automated test execution:
   - Execute generated penetration testing plan
   - Collect test results and evidence screenshots
   - Verify vulnerability exploitability

4. Test report:
   - Vulnerability confirmation status (Confirmed / Not Exploitable / False Positive)
   - Actual risk assessment adjustment
   - Reproduction steps and evidence chain

Output: Test environment config files + Automated test scripts + Test results report
```

### Scenario 4: Attack Chain Visualization & POC Optimization

Comprehensive attack chain analysis with visualization and optimized exploitation.

```
/threat-modeling @/path/to/project --debug

Complete attack chain analysis and visualization:

1. Attack graph construction:
   - Build complete system attack graph
   - Nodes: Assets, vulnerabilities, attack techniques
   - Edges: Attack paths, prerequisites, success probability

2. Critical path analysis:
   - Identify shortest attack path (from entry to core assets)
   - Identify highest success rate path
   - Identify attack chain with maximum impact scope

3. POC optimization combination:
   - Tool chain optimization (Recon → Exploit → Post-Exploit)
   - Automated attack script generation
   - One-click vulnerability verification workflow

4. Visualization output:
   - Mermaid format attack tree diagram
   - Attack path heatmap
   - Risk-impact matrix diagram
   - ATT&CK Navigator mapping

Output format:
- Attack graph Markdown (with Mermaid diagrams)
- Optimized POC toolkit
- Risk visualization dashboard data
```

### Quick Reference: Extended Prompts

| Scenario | Focus | Key Output |
|----------|-------|------------|
| **Interface Discovery** | All interfaces + Data flows | Risk-ranked interface inventory |
| **Attack Tree & POC** | Attack chains + Exploits | Pentest plan with POC code |
| **Docker Test Env** | Isolated testing | Test environment + Auto scripts |
| **Attack Visualization** | Visual analysis | Attack graphs + Heatmaps |

## Output Structure

```
{PROJECT_ROOT}/
├── Risk_Assessment_Report/           # Final reports (P8)
│   ├── {PROJECT}-RISK-ASSESSMENT-REPORT.md
│   ├── {PROJECT}-RISK-INVENTORY.md
│   ├── {PROJECT}-PENETRATION-TEST-PLAN.md
│   └── ...
├── threat_model_output.yaml          # Chain output → adversary-simulation
└── .phase_working/{SESSION_ID}/      # Working data
    ├── data/                         # YAML phase data
    │   ├── P1_project_context.yaml
    │   ├── P2_dfd_elements.yaml
    │   └── ...
    └── reports/                      # Markdown reports
        ├── P1-PROJECT-UNDERSTANDING.md
        └── ...
```

## Script Commands

### Knowledge Base Queries

```bash
# STRIDE threat patterns
python scripts/unified_kb_query.py --stride spoofing

# Security controls
python scripts/unified_kb_query.py --control AUTHN

# CWE information with full chain
python scripts/unified_kb_query.py --cwe CWE-89 --full-chain

# CAPEC attack patterns
python scripts/unified_kb_query.py --capec CAPEC-66 --attack-chain

# AI/LLM specific threats
python scripts/unified_kb_query.py --all-llm
```

### Module Discovery

```bash
python scripts/module_discovery.py /path/to/project --p1-discovery
```

### Phase Data Management

```bash
# Query previous phase data
python scripts/phase_data.py --query --phase 1 --root /path/to/project

# Validate phase output
python scripts/phase_data.py --validate --phase 2 --root /path/to/project

# Initialize new session
python scripts/phase_data.py --init --project "PROJECT-NAME" --path /path/to/project
```

## 8-Phase Workflow

```
P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8
│    │    │    │    │    │    │    └── Report Generation
│    │    │    │    │    │    └── Mitigation Planning
│    │    │    │    │    └── Risk Validation (POC, attack paths)
│    │    │    │    └── STRIDE Threat Analysis (threat matrix)
│    │    │    └── Security Design Review (16 domains)
│    │    └── Trust Boundary Evaluation
│    └── Call Flow & DFD Analysis (data flows, call flows)
└── Project Understanding (modules, entry points)
```

## Knowledge Base

| Category | Coverage |
|----------|----------|
| Security Controls | 16 domains, 107 controls |
| Threat Patterns | CWE/CAPEC/ATT&CK (1,900+ patterns) |
| AI/LLM Threats | 350+ threats |
| Compliance | OWASP ASVS, WSTG, MASTG |
| SQLite Index | 26+ MB searchable |

## Project Types Supported

| Type | Example Technologies | Special Focus |
|------|---------------------|---------------|
| Web API | Django, FastAPI, Express | Authentication, API Security |
| Microservices | K8s, Istio, Kafka | Service Mesh, Zero Trust |
| AI/LLM Application | Claude API, RAG, Vector DB | Prompt Injection, Model Security |
| Mobile Backend | JWT, OAuth, Firebase | Token Security, Data Privacy |
| Legacy System | Monolith, SOAP | Technical Debt, Migration Risks |
| Desktop / Native | Rust, Tauri, Flutter | IPC, Local Secrets, Process Isolation |

## Credits

Original skill created by [fr33d3m0n](https://github.com/fr33d3m0n) — [threat-modeling v3.0.3](https://github.com/fr33d3m0n/threat-modeling) — BSD-3-Clause.

Adaptation by Kevin-hDev:
- Universalized stack detection (P0-DETECTION)
- INDEX-THEN-SELECTIVE data loading from shared data directories
- Chain output (`threat_model_output.yaml`) for adversary-simulation
- Integration into the `claude-redteam-vs-blueteam` 3-step security audit chain

## License

BSD-3-Clause (original license by fr33d3m0n, preserved in full — see [LICENSE](LICENSE))

## Repositories

- Adaptation: https://github.com/Kevin-hDev/claude-redteam-vs-blueteam
- Original: https://github.com/fr33d3m0n/threat-modeling
