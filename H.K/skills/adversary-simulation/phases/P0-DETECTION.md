# Phase 0: Automatic Project Detection

**Type** : Detection and loading
**Executor** : LLM + File scan
**Knowledge** : data/offensive/index-offensive.md
**Input** : Project path (provided by the user)

---

## Objective

Automatically detect the technical stack, target OS, frameworks, and security-sensitive components of the project. Load relevant offensive DATA from data/offensive/. This phase lays the groundwork for all subsequent phases.

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

---

### REFLECTION - P0 Entry Gate

**Objective** : Before any analysis, scan the project to understand WHAT we are about to audit. Determine the stack, OS, frameworks, and sensitive components to load only the relevant DATA.

```
REFLECTION - P0 Entry Gate
================================================

CENTRAL PROBLEM
Scan the target project to automatically detect:
- The languages and build systems used
- The target OS of the application
- The frameworks and critical libraries
- The security-sensitive components (auth, crypto, LLM, IPC, DB)
Then load the relevant offensive DATA from data/offensive/.

KNOWN CONTEXT
| Metric | Value | Source |
|--------|-------|--------|
| Project path | {project_path} | User input |
| DATA path | data/offensive/ | SKILL.md S4 |

UNKNOWNS (to discover)
- Which languages are used?
- Which framework(s) structure the project?
- On which OS(es) is the application deployed?
- Are there LLM/AI, IPC, auth, or crypto components?
- Does a threat-modeling report already exist?

================================================
STOP CHECK
- Project path accessible? [YES/NO]
- data/offensive/index-offensive.md accessible? [YES/NO]
- Ready to proceed to PLANNING? [YES/NO]
================================================
```

**STOP CONDITION** : If any check = NO -> Resolve before continuing

---

### PLANNING - Sub-task Breakdown

```
PLANNING - P0 Sub-tasks
================================================

| # | Sub-task | Expected output |
|---|----------|-----------------|
| T1 | Scan config files at root | List of detected build systems |
| T2 | Detect target OS | List of target platforms |
| T3 | Detect frameworks | List of frameworks and versions |
| T4 | Detect security-sensitive components | List of critical components |
| T5 | Load data/offensive/index-offensive.md | Index of available DATA |
| T6 | Match tags and select files | List of offensive DATA to load |
| T7 | Search for a threat-modeling report | Report path or null |
| T8 | Write P0_detection.yaml + report | Phase output |

PLANNING CHECK
- Sub-tasks broken down? [YES/NO]
- Ready to execute? [YES/NO]
================================================
```

---

### EXECUTION

#### T1: Scan Configuration Files

Search at root and in immediate sub-folders for files that signal a language or build system:

| Config file | Stack signal | Language |
|-------------|-------------|----------|
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
# Scan root and sub-folders (depth 2)
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
- Enabled features
- Build scripts
- Security-relevant dependencies

#### T2: Detect Target OS

Clues to look for depending on the detected stack:

| Clue | Where to look | OS signal |
|------|---------------|-----------|
| `targets` in tauri.conf.json | Tauri config | Based on values |
| `platforms` in pubspec.yaml | Flutter config | android, ios, linux, macos, windows |
| CI matrix (GitHub Actions, GitLab CI) | `.github/workflows/*.yml`, `.gitlab-ci.yml` | OS in the matrix |
| Build scripts | `Makefile`, `build.sh`, `build.ps1` | Implicit OS |
| Compilation targets | `Cargo.toml` targets, cross-compilation | Target OS |
| OS-specific dependencies | `#[cfg(target_os)]` (Rust), platform checks | Conditional OS |
| Entitlements / manifests | `*.entitlements` (macOS), `AndroidManifest.xml` | Specific OS |

If no clear clue: infer from the stack (e.g.: Flutter = mobile + desktop, Django = Linux server).

#### T3: Detect Frameworks

Analyze configuration files to identify frameworks:

| Framework | How to detect |
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

For each framework, note the exact version and enabled features.

#### T4: Detect Security-Sensitive Components

Scan the code to identify critical components:

| Component | Patterns to search |
|-----------|-------------------|
| **Auth** | `auth`, `login`, `password`, `jwt`, `oauth`, `session`, `token`, `bcrypt`, `argon2` |
| **Crypto** | `encrypt`, `decrypt`, `aes`, `rsa`, `sha`, `hmac`, `keyring`, `keychain`, `vault` |
| **LLM/AI** | `openai`, `anthropic`, `groq`, `ollama`, `langchain`, `llm`, `prompt`, `completion`, `embedding` |
| **IPC** | `invoke`, `ipc`, `channel`, `bridge`, `postMessage`, `platform_channel`, `d-bus`, `xpc` |
| **Database** | `sqlite`, `sqlcipher`, `postgres`, `mysql`, `mongodb`, `redis`, `prisma`, `sequelize` |
| **Subprocess** | `Command::new`, `child_process`, `subprocess`, `exec`, `spawn`, `popen` |
| **Privilege elevation** | `pkexec`, `sudo`, `polkit`, `UAC`, `osascript`, `runas` |
| **Network** | `reqwest`, `fetch`, `axios`, `http`, `websocket`, `grpc`, `mqtt` |
| **Sensitive files** | `.env`, `secrets`, `credentials`, `config.toml`, `secrets.yaml` |

#### T5: Load data/offensive/index-offensive.md

Read the file `data/offensive/index-offensive.md` to get the complete list of available offensive DATA with their tags.

#### T6: Match Tags and Select Files

By crossing the detected stack (T1-T4) with the index tags (T5), select the relevant offensive files:

**Selection rules:**
1. **ALWAYS load** : `data/offensive/generic/*.md` (universal common base)
2. **ALWAYS load** : `data/offensive/exploits/*.md` (red team simulation)
3. **If specific stack detected** : Load the corresponding `data/offensive/{stack}/*.md`
4. **If LLM/AI detected** : Load `data/offensive/llm-ai/*.md`
5. **NEVER load** : `data/defensive/` (reserved for the defensive-hardening skill)

**Determine active attack categories** among the 14 possible:
`IPC`, `XSS`, `SUBPROCESS`, `LLM`, `SUPPLY`, `NET`, `CRYPTO`, `PRIVESC`, `DECEPTION`, `COMMS`, `INJECTION`, `DESERIALIZATION`, `SSRF`, `AUTH_BYPASS`

Each category is activated if the detected stack or components justify it.

#### T7: Search for a Threat-Modeling Report

```bash
# Search for existing threat modeling reports
find {project_path} -maxdepth 3 -type f \( \
  -name "*threat*model*" -o -name "*stride*" -o \
  -name "*risk*assess*" -o -name "*security*review*" -o \
  -name "*threat*report*" \
\) ! -path "*/node_modules/*" ! -path "*/target/*" 2>/dev/null
```

If a report is found, read it to extract priority risks and focus the analysis.

#### T7b: Parse threat_model_output.yaml (if found)

If a `threat_model_output.yaml` is found from a previous threat-modeling session, parse its structured data:

- `threat_surfaces[]` → Use to prioritize reconnaissance targets in P1
- `recommended_attack_vectors[]` → Use to guide attack scenario construction in P4
- `critical_components[]` → Use to focus vulnerability hunting in P3
- `stride_findings[]` → Context for each vulnerability's STRIDE classification

This structured data provides significantly more value than just `risk_priorities[]` titles/scores.

#### T8: Write Output

**Writing order** (CRITICAL):
1. **YAML first** : `.attacker_working/{SESSION_ID}/data/P0_detection.yaml`
2. **MD second** : `.attacker_working/{SESSION_ID}/reports/P0-DETECTION.md`

YAML template (see WORKFLOW.md S3 for the full contract):

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
    - file: "file_name"
      path: "relative/path"
      stack_signal: "detected_signal"
  key_dependencies:
    - name: "dep_name"
      version: "^x.y.z"
      source: "source_file"
      attack_relevance: "CRITICAL|HIGH|MEDIUM|LOW"

sensitive_components:
  auth: []                # Auth-related files/modules
  crypto: []              # Crypto files/modules
  llm_ai: []              # LLM/AI files/modules
  ipc: []                 # IPC files/modules
  database: []            # DB files/modules
  subprocess: []          # Subprocess files/modules
  privilege_elevation: [] # Elevation files/modules
  network: []             # Network files/modules

threat_model:
  found: false
  path: null
  risk_priorities: []     # Priority risks extracted from the report

loaded_data:
  from_index: "data/offensive/index-offensive.md"
  attack_files:
    - path: "relative/path/from/data/offensive"
      tags_matched: ["tag1", "tag2"]
      reason: "Justification for loading"
  exploit_files: []

attack_categories_active:
  - code: "CATEGORY_CODE"
    reason: "Justification for activation"
    data_files: ["path/to/data.md"]
```

---

### VALIDATION - Completeness Check

```
VALIDATION - P0 Check
================================================

| Checked element | Status |
|-----------------|--------|
| Project path accessible? | [OK/FAIL] |
| At least 1 config file found? | [OK/FAIL] |
| At least 1 language detected? | [OK/FAIL] |
| Target OS determined? | [OK/FAIL] |
| Frameworks identified? | [OK/FAIL] |
| Security-sensitive components scanned? | [OK/FAIL] |
| data/offensive/index-offensive.md read? | [OK/FAIL] |
| Tags matched with stack? | [OK/FAIL] |
| attacks/ files selected? | [OK/FAIL] |
| exploits/ files selected? | [OK/FAIL] |
| Active attack categories determined? | [OK/FAIL] |
| Threat-modeling report searched? | [OK/FAIL] |
| P0_detection.yaml written and valid? | [OK/FAIL] |
| P0-DETECTION.md report written? | [OK/FAIL] |

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
[Overview: detected stack, target OS, frameworks, number of DATA files loaded]

## Detected Stack
| Component | Value | Source |
|-----------|-------|--------|
| Languages | [list] | [config files] |
| Frameworks | [list] | [config files] |
| Target OS | [list] | [clues] |
| Package managers | [list] | [lockfiles] |

## Critical Dependencies
| Name | Version | Source | Attack relevance |
|------|---------|--------|-----------------|

## Security-Sensitive Components
| Component | Files | Criticality |
|-----------|-------|-------------|

## Offensive DATA Loaded
| Category | Files loaded | Reason |
|----------|-------------|--------|
| generic/ | [list] | Common base |
| {stack}/ | [list] | Stack-specific |
| exploits/ | [list] | Red team |
| llm-ai/ | [list] | If LLM/AI detected |

## Active Attack Categories
| Code | Category | Activation reason | DATA sources |
|------|----------|------------------|-------------|

## Existing Threat Model
[Found/Not found. If found: summary of priority risks]

## Initial Observations
[First impressions from the attacker's perspective]
[Which components stand out immediately?]
[Where to focus in the following phases?]
```

---

**End of P0-DETECTION.md**
