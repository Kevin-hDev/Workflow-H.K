<!-- Threat Modeling Skill (Universal) | Version 1.1.0 (20260314) | https://github.com/Kevin-hDev/claude-redteam-vs-blueteam | License: BSD-3-Clause | Based on threat-modeling v3.0.3 (fr33d3m0n, BSD-3-Clause) -->

# Phase 0: Automatic Project Detection

**Type**: Detection and loading
**Executor**: LLM + File scanning
**Knowledge**: data/offensive/index-offensive.md + data/defensive/index-defensive.md + data/shared/index-shared.md
**Input**: Project path (provided by the user)

---

## Objective

Automatically detect the project's tech stack, target OS, frameworks, and security-sensitive components. Load relevant offensive AND defensive DATA from data/offensive/ and data/defensive/ (threat modeling analyzes risks AND evaluates existing controls). This phase lays the foundation for all subsequent phases.

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

---

### THINKING - P0 Entry Gate

**Purpose**: Before any analysis, scan the project to understand WHAT will be modeled. Determine the stack, OS, frameworks, and sensitive components to load only relevant DATA. Threat modeling loads BOTH types (offensive + defensive) because it analyzes threats AND controls.

```
THINKING - P0 Entry Gate
================================================

CORE PROBLEM
Scan the target project to automatically detect:
- Languages and build systems in use
- Target OS platforms
- Critical frameworks and libraries
- Security-sensitive components (auth, crypto, LLM, IPC, DB)
Then load relevant offensive AND defensive DATA from data/.
Then search for a previous threat-modeling report for potential continuation.

KNOWN CONTEXT
| Metric | Value | Source |
|--------|-------|--------|
| Project path | {project_path} | User input |
| Offensive DATA path | data/offensive/ | SKILL.md S4 |
| Defensive DATA path | data/defensive/ | SKILL.md S4 |
| Shared DATA path | data/shared/ | SKILL.md S4 |

UNKNOWNS (to discover)
- Which languages are used?
- Which framework(s) structure the project?
- Which OS(es) is the application deployed on?
- Are there LLM/AI, IPC, auth, crypto components?
- Does a previous threat-modeling report exist?

================================================
STOP CHECK
- Project path accessible? [YES/NO]
- data/offensive/index-offensive.md accessible? [YES/NO]
- data/defensive/index-defensive.md accessible? [YES/NO]
- data/shared/index-shared.md accessible? [YES/NO]
- Ready to continue to PLANNING? [YES/NO]
================================================
```

**STOP CONDITION**: If any check = NO -> Resolve before continuing

---

### PLANNING - Sub-task Decomposition

```
PLANNING - P0 Sub-tasks
================================================

| # | Sub-task | Expected Output |
|---|----------|-----------------|
| T1 | Scan config files at project root | List of detected build systems |
| T2 | Detect target OS platforms | List of target platforms |
| T3 | Detect frameworks | List of frameworks and versions |
| T4 | Detect security-sensitive components | List of critical components |
| T5 | Load index-offensive.md + index-defensive.md + index-shared.md | Index of available DATA |
| T6 | Match tags and select offensive files | List of offensive DATA to load |
| T7 | Match tags and select defensive files | List of defensive DATA to load |
| T8 | Load relevant shared references | Shared DATA loaded |
| T9 | Search for a previous threat-modeling report | Report path or null |
| T10 | Write P0_detection.yaml + report | Phase output |

PLANNING CHECK
- Sub-tasks decomposed? [YES/NO]
- Ready to execute? [YES/NO]
================================================
```

---

### EXECUTION

#### T1: Scan Configuration Files

Search the root and immediate subdirectories for files that signal a language or build system:

| Config File | Stack Signal | Language |
|-------------|-------------|---------|
| `Cargo.toml` | Rust + Cargo | Rust |
| `package.json` | Node.js / npm | JavaScript/TypeScript |
| `pyproject.toml`, `setup.py`, `requirements.txt` | Python | Python |
| `go.mod` | Go | Go |
| `pubspec.yaml` | Flutter/Dart | Dart |
| `pom.xml`, `build.gradle`, `build.gradle.kts` | Java/Kotlin + Maven/Gradle | Java/Kotlin |
| `composer.json` | PHP + Composer | PHP |
| `Gemfile` | Ruby + Bundler | Ruby |
| `*.csproj`, `*.sln` | C# / .NET | C# |
| `CMakeLists.txt`, `Makefile` | C/C++ | C/C++ |
| `deno.json`, `deno.jsonc` | Deno | TypeScript |
| `bun.lockb`, `bunfig.toml` | Bun | TypeScript |

```bash
# Scan root and subdirectories (depth 2)
find {project_path} -maxdepth 2 -type f \( \
  -name "Cargo.toml" -o -name "package.json" -o \
  -name "pyproject.toml" -o -name "setup.py" -o -name "requirements.txt" -o \
  -name "go.mod" -o -name "pubspec.yaml" -o \
  -name "pom.xml" -o -name "build.gradle" -o -name "build.gradle.kts" -o \
  -name "composer.json" -o -name "Gemfile" -o \
  -name "*.csproj" -o -name "*.sln" -o \
  -name "CMakeLists.txt" -o -name "Makefile" -o \
  -name "deno.json" -o -name "deno.jsonc" \
\) ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" 2>/dev/null
```

For each file found, read its content to extract:
- Dependency versions
- Activated features
- Build scripts
- Security-relevant dependencies

#### T2: Detect Target OS Platforms

Clues to look for based on the detected stack:

| Clue | Where to Look | OS Signal |
|------|--------------|-----------|
| `targets` in tauri.conf.json | Tauri config | Per values |
| `platforms` in pubspec.yaml | Flutter config | android, ios, linux, macos, windows |
| CI matrix (GitHub Actions, GitLab CI) | `.github/workflows/*.yml`, `.gitlab-ci.yml` | OS in matrix |
| Build scripts | `Makefile`, `build.sh`, `build.ps1` | Implied OS |
| Compilation targets | `Cargo.toml` targets, cross-compilation | Target OS |
| OS-specific dependencies | `#[cfg(target_os)]` (Rust), platform checks | Conditional OS |
| Entitlements / manifests | `*.entitlements` (macOS), `AndroidManifest.xml` | Specific OS |

If no clear clue: infer from the stack (e.g., Flutter = mobile + desktop, Django = Linux server).

#### T3: Detect Frameworks

Analyze configuration files to identify frameworks:

| Framework | How to Detect |
|-----------|---------------|
| Tauri | `tauri` in Cargo.toml dependencies + `tauri.conf.json` |
| Electron | `electron` in package.json dependencies |
| Flutter | `pubspec.yaml` with `flutter` SDK |
| React | `react` in package.json dependencies |
| Vue | `vue` in package.json dependencies |
| Angular | `@angular/core` in package.json |
| Next.js | `next` in package.json dependencies |
| Django | `django` in requirements.txt / pyproject.toml |
| Flask | `flask` in requirements.txt / pyproject.toml |
| FastAPI | `fastapi` in requirements.txt / pyproject.toml |
| Express | `express` in package.json dependencies |
| NestJS | `@nestjs/core` in package.json |
| Spring Boot | `spring-boot` in pom.xml / build.gradle |
| Laravel | `laravel/framework` in composer.json |
| Gin / Echo / Fiber | Respective deps in go.mod |

For each framework, note the exact version and activated features.

#### T4: Detect Security-Sensitive Components

Scan the code to identify critical components:

| Component | Patterns to Search |
|-----------|-------------------|
| **Auth** | `auth`, `login`, `password`, `jwt`, `oauth`, `session`, `token`, `bcrypt`, `argon2` |
| **Crypto** | `encrypt`, `decrypt`, `aes`, `rsa`, `sha`, `hmac`, `keyring`, `keychain`, `vault` |
| **LLM/AI** | `openai`, `anthropic`, `groq`, `ollama`, `langchain`, `llm`, `prompt`, `completion`, `embedding` |
| **IPC** | `invoke`, `ipc`, `channel`, `bridge`, `postMessage`, `platform_channel`, `d-bus`, `xpc` |
| **Database** | `sqlite`, `sqlcipher`, `postgres`, `mysql`, `mongodb`, `redis`, `prisma`, `sequelize` |
| **Subprocess** | `Command::new`, `child_process`, `subprocess`, `exec`, `spawn`, `popen` |
| **Privilege Elevation** | `pkexec`, `sudo`, `polkit`, `UAC`, `osascript`, `runas` |
| **Network** | `reqwest`, `fetch`, `axios`, `http`, `websocket`, `grpc`, `mqtt` |
| **Sensitive Files** | `.env`, `secrets`, `credentials`, `config.toml`, `secrets.yaml` |

#### T5: Load DATA Indexes

Read the three index files to obtain the complete list of available DATA with their tags:
1. `data/offensive/index-offensive.md` — current attack patterns
2. `data/defensive/index-defensive.md` — current defense patterns
3. `data/shared/index-shared.md` — shared references (CVE catalog, etc.)

#### T6: Match Tags and Select Offensive Files

Cross-reference the detected stack (T1-T4) with the offensive index tags (T5) to select relevant offensive files:

**Selection rules:**
1. **Load generic/ selectively**: Load `data/offensive/generic/*.md` files whose tags match the detected stack. Skip condensers for undetected stacks (e.g., skip `atk-condenser-backend-python.md` if Python not detected, skip `atk-condenser-mobile-ios-android.md` if no mobile target).
2. **Load exploits/ selectively**: Load `data/offensive/exploits/*.md` files matching the detected OS targets. Skip platform-specific exploits for undetected platforms (e.g., skip `atk-exploit-mobile.md` if no mobile target).
3. **If specific stack detected**: Load `data/offensive/{stack}/*.md` accordingly
4. **If LLM/AI detected**: Load `data/offensive/llm-ai/*.md`

#### T7: Match Tags and Select Defensive Files

Cross-reference the detected stack (T1-T4) with the defensive index tags (T5) to select relevant defensive files:

**Selection rules:**
1. **Load generic/ selectively**: Load `data/defensive/generic/*.md` files whose tags match the detected stack. Skip condensers for undetected stacks (e.g., skip files specific to undetected languages or platforms).
2. **If specific stack detected**: Load `data/defensive/{stack}/*.md` accordingly
3. **If specific OS detected**: Load `data/defensive/platform/platform-{os}.md`
4. **If stack framework detected**: Load `data/defensive/stack/stack-{framework}.md`
5. **If LLM/AI detected**: Load `data/defensive/generic/def-llm-*.md`

#### T8: Load Shared References

From `data/shared/index-shared.md`, select relevant references:
- `data/shared/references/ref-cve-catalog.md` (always useful for CVE references)
- Other shared files based on relevance to the detected stack

#### T9: Search for a Previous Threat-Modeling Report

```bash
# Search for existing threat modeling reports (previous session)
find {project_path} -maxdepth 3 -type f \( \
  -name "*threat*model*" -o -name "*stride*" -o \
  -name "*risk*assess*" -o -name "*security*review*" -o \
  -name "*threat*report*" -o -name "*threat_model_output*" \
\) ! -path "*/node_modules/*" ! -path "*/target/*" 2>/dev/null

# Also search in .phase_working/ (previous session from this same skill)
find {project_path} -maxdepth 5 -path "*/.phase_working/*/data/*" -name "*.yaml" 2>/dev/null
```

If a report is found, read it to extract priority risks and potentially continue the analysis.

#### T10: Write Output

**Write order** (CRITICAL):
1. **YAML first**: `.phase_working/{SESSION_ID}/data/P0_detection.yaml`
2. **MD second**: `.phase_working/{SESSION_ID}/reports/P0-DETECTION.md`

YAML template (see WORKFLOW.md S3 for the complete contract):

```yaml
schema_version: "1.1.0"
phase: 0
generated_at: "ISO8601"

detected_stack:
  os_targets: []          # ["linux", "macos", "windows", "android", "ios"]
  languages: []           # ["rust", "typescript", "python", ...]
  frameworks: []          # ["tauri_v2", "react", "django", ...]
  package_managers: []    # ["cargo", "npm", "pip", ...]
  config_files_found:
    - file: "filename"
      path: "relative/path"
      stack_signal: "detected_signal"
  key_dependencies:
    - name: "dep_name"
      version: "^x.y.z"
      source: "source_file"
      security_relevance: "CRITICAL|HIGH|MEDIUM|LOW"

sensitive_components:
  auth: []                # Auth-related files/modules
  crypto: []              # Crypto files/modules
  llm_ai: []              # LLM/AI files/modules
  ipc: []                 # IPC files/modules
  database: []            # DB files/modules
  subprocess: []          # Subprocess files/modules
  privilege_elevation: [] # Elevation files/modules
  network: []             # Network files/modules

previous_threat_model:
  found: false
  path: null
  risk_priorities: []     # Priority risks extracted from previous report

loaded_data:
  offensive:
    from_index: "data/offensive/index-offensive.md"
    attack_files:
      - path: "relative/path/from/data/offensive"
        tags_matched: ["tag1", "tag2"]
        reason: "Loading justification"
    exploit_files: []
  defensive:
    from_index: "data/defensive/index-defensive.md"
    generic_files: []       # data/defensive/generic/ files loaded
    stack_files: []         # data/defensive/{stack}/ files loaded
    platform_files: []      # data/defensive/platform/ files loaded
    framework_files: []     # data/defensive/stack/ files loaded
  shared:
    from_index: "data/shared/index-shared.md"
    reference_files: []     # data/shared/ files loaded

stride_categories_relevant:
  - code: "S"
    name: "Spoofing"
    applicable_components: ["auth", "ipc"]
    data_files_offensive: []
    data_files_defensive: []
  - code: "T"
    name: "Tampering"
    applicable_components: []
    data_files_offensive: []
    data_files_defensive: []
```

---

### REFLECTING - Completion Verification

```
REFLECTING - P0 Verification
================================================

| Check Item | Status |
|------------|--------|
| Project path accessible? | [PASS/FAIL] |
| At least 1 config file found? | [PASS/FAIL] |
| At least 1 language detected? | [PASS/FAIL] |
| Target OS determined? | [PASS/FAIL] |
| Frameworks identified? | [PASS/FAIL] |
| Security-sensitive components scanned? | [PASS/FAIL] |
| data/offensive/index-offensive.md read? | [PASS/FAIL] |
| data/defensive/index-defensive.md read? | [PASS/FAIL] |
| data/shared/index-shared.md read? | [PASS/FAIL] |
| Tags matched with stack (offensive)? | [PASS/FAIL] |
| Tags matched with stack (defensive)? | [PASS/FAIL] |
| Offensive files selected? | [PASS/FAIL] |
| Defensive files selected? | [PASS/FAIL] |
| Shared references loaded? | [PASS/FAIL] |
| Relevant STRIDE categories determined? | [PASS/FAIL] |
| Previous threat-modeling report searched? | [PASS/FAIL] |
| P0_detection.yaml written and valid? | [PASS/FAIL] |
| P0-DETECTION.md report written? | [PASS/FAIL] |

COMPLETION GATE
- All checks passed? [YES/NO]
- Ready to enter P1? [YES/NO]
================================================
```

---

## P0 Report Template

```markdown
# P0 - Detection Report

## Summary
[Summary: detected stack, target OS, frameworks, number of DATA loaded (offensive + defensive)]

## Detected Stack
| Component | Value | Source |
|-----------|-------|--------|
| Languages | [list] | [config files] |
| Frameworks | [list] | [config files] |
| Target OS | [list] | [clues] |
| Package Managers | [list] | [lockfiles] |

## Critical Dependencies
| Name | Version | Source | Security Relevance |
|------|---------|--------|-------------------|

## Security-Sensitive Components
| Component | Files | Criticality |
|-----------|-------|-------------|

## Offensive DATA Loaded
| Category | Files Loaded | Reason |
|----------|-------------|--------|
| generic/ | [list] | Common base |
| {stack}/ | [list] | Stack specific |
| exploits/ | [list] | Red team |
| llm-ai/ | [list] | If LLM/AI detected |

## Defensive DATA Loaded
| Category | Files Loaded | Reason |
|----------|-------------|--------|
| generic/ | [list] | Universal common base |
| {stack}/ | [list] | Stack specific |
| platform/ | [list] | Target OS |
| stack/ | [list] | Framework specific |

## Shared References Loaded
| File | Reason |
|------|--------|

## Relevant STRIDE Categories
| Code | Category | Applicable Components | Offensive DATA | Defensive DATA |
|------|----------|----------------------|----------------|----------------|

## Previous Threat Model
[Found/Not found. If found: summary of priority risks]

## Initial Observations
[First impressions from a risk modeling perspective]
[Which surfaces deserve particular attention in STRIDE?]
[Where to focus priority in the following phases?]
```

---

**End of P0-DETECTION.md**
