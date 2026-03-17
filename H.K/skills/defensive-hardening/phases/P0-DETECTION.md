# Phase 0: Automatic Project Detection

**Type** : Detection and loading
**Executor** : LLM + File scan
**Knowledge** : data/defensive/index-defensive.md
**Input** : Project path (provided by user)

---

## Objective

Automatically detect the technical stack, target OS, frameworks, and security-sensitive components of the project. Load relevant defensive DATA from data/defensive/. Look for an `adversary_output.yaml` (adversary-simulation output) to target the hardening. This phase lays the foundation for all subsequent phases.

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

---

### REFLECTION - Entry Gate P0

**Objective** : Before any analysis, scan the project to understand WHAT we will be hardening. Determine the stack, OS, frameworks, and sensitive components to load only the relevant defensive DATA. If an adversary-simulation report exists, exploit it to target the identified vulnerabilities.

```
REFLECTION - P0 Entry Gate
================================================

CENTRAL PROBLEM
Scan the target project to automatically detect:
- Languages and build systems used
- Target OS for the application
- Critical frameworks and libraries
- Security-sensitive components (auth, crypto, LLM, IPC, DB)
Then load relevant defensive DATA from data/defensive/.
Then look for an adversary_output.yaml to target the hardening.

KNOWN CONTEXT
| Metric | Value | Source |
|--------|-------|--------|
| Project path | {project_path} | User input |
| DATA path | data/defensive/ | SKILL.md |

UNKNOWNS (to discover)
- What languages are used?
- What framework(s) structure the project?
- On which OS(s) is the application deployed?
- Are there LLM/AI, IPC, auth, crypto components?
- Does an adversary-simulation report already exist?
- Does a threat-modeling report already exist?

================================================
STOP CHECK
- Project path accessible? [YES/NO]
- data/defensive/index-defensive.md accessible? [YES/NO]
- Ready to continue to PLANNING? [YES/NO]
================================================
```

**STOP CONDITION** : If any check = NO -> Resolve before continuing

---

### PLANNING - Breakdown into Subtasks

```
PLANNING - P0 Subtasks
================================================

| # | Subtask | Expected output |
|---|---------|----------------|
| T1 | Scan config files at root | List of detected build systems |
| T2 | Detect target OS | List of target platforms |
| T3 | Detect frameworks | List of frameworks and versions |
| T4 | Detect security-sensitive components | List of critical components |
| T5 | Load data/defensive/index-defensive.md | Index of available DATA |
| T6 | Match tags and select files | List of defensive DATA to load |
| T7 | Look for adversary_output.yaml | Targeted vulnerabilities or full hardening |
| T8 | Look for threat-modeling report | Report path or null |
| T9 | Write P0_detection.yaml + report | Phase output |

PLANNING CHECK
- Subtasks decomposed? [YES/NO]
- Ready to execute? [YES/NO]
================================================
```

---

### EXECUTION

#### T1: Scan Configuration Files

Look at the root and in immediate subdirectories for files signaling a language or build system:

| Config file | Stack signal | Language |
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
- Enabled features
- Build scripts
- Security-relevant dependencies

#### T2: Detect Target OS

Signals to look for based on detected stack:

| Signal | Where to look | OS signal |
|--------|--------------|-----------|
| `targets` in tauri.conf.json | Tauri config | Based on values |
| `platforms` in pubspec.yaml | Flutter config | android, ios, linux, macos, windows |
| CI matrix (GitHub Actions, GitLab CI) | `.github/workflows/*.yml`, `.gitlab-ci.yml` | OS in matrix |
| Build scripts | `Makefile`, `build.sh`, `build.ps1` | Implicit OS |
| Compilation targets | `Cargo.toml` targets, cross-compilation | Target OS |
| OS-specific dependencies | `#[cfg(target_os)]` (Rust), platform checks | Conditional OS |
| Entitlements / manifests | `*.entitlements` (macOS), `AndroidManifest.xml` | Specific OS |

If no clear signal: infer from stack (e.g., Flutter = mobile + desktop, Django = Linux server).

#### T3: Detect Frameworks

Analyze config files to identify frameworks:

| Framework | How to detect |
|-----------|--------------|
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

| Component | Patterns to look for |
|-----------|---------------------|
| **Auth** | `auth`, `login`, `password`, `jwt`, `oauth`, `session`, `token`, `bcrypt`, `argon2` |
| **Crypto** | `encrypt`, `decrypt`, `aes`, `rsa`, `sha`, `hmac`, `keyring`, `keychain`, `vault` |
| **LLM/AI** | `openai`, `anthropic`, `groq`, `ollama`, `langchain`, `llm`, `prompt`, `completion`, `embedding` |
| **IPC** | `invoke`, `ipc`, `channel`, `bridge`, `postMessage`, `platform_channel`, `d-bus`, `xpc` |
| **Database** | `sqlite`, `sqlcipher`, `postgres`, `mysql`, `mongodb`, `redis`, `prisma`, `sequelize` |
| **Subprocess** | `Command::new`, `child_process`, `subprocess`, `exec`, `spawn`, `popen` |
| **Privilege elevation** | `pkexec`, `sudo`, `polkit`, `UAC`, `osascript`, `runas` |
| **Network** | `reqwest`, `fetch`, `axios`, `http`, `websocket`, `grpc`, `mqtt` |
| **Sensitive files** | `.env`, `secrets`, `credentials`, `config.toml`, `secrets.yaml` |

#### T5: Load data/defensive/index-defensive.md

Read the file `data/defensive/index-defensive.md` to get the complete list of available defensive DATA with their tags.

#### T6: Match Tags and Select Files

By crossing the detected stack (T1-T4) with the index tags (T5), select relevant defensive files:

**Selection rules:**
1. **ALWAYS load** : `data/defensive/generic/*.md` (universal common base)
2. **If specific stack detected** : Load matching `data/defensive/{stack}/*.md`
3. **If specific OS detected** : Load `data/defensive/platform/platform-{os}.md`
4. **If framework stack detected** : Load `data/defensive/stack/stack-{framework}.md`
5. **If LLM/AI detected** : Load `data/defensive/generic/def-llm-*.md` + stack-specific if exists
6. **NEVER load** : `data/offensive/` (reserved for adversary-simulation skill)

**Detected stack -> Defensive DATA mapping:**

| Detected stack | Tags to match in index-defensive.md | Typical files |
|----------------|--------------------------------------|---------------|
| Rust + Tauri | rust, tauri, ipc, webview | data/defensive/rust-tauri/*.md |
| Flutter + Dart | flutter, dart, mobile | data/defensive/flutter-dart/*.md |
| React / Vue / Angular | frontend, spa, csp | data/defensive/stack/stack-frontend*.md |
| Python backend | python, backend | data/defensive/stack/stack-python*.md |
| Node.js / TypeScript | js, node, typescript | data/defensive/stack/stack-js-node.md |
| PHP / Laravel | php, laravel | data/defensive/stack/stack-php.md |
| LLM / AI | llm, defense, pipeline | data/defensive/generic/def-llm-*.md |

**Determine active defense categories** from the possible ones:
`RUNTIME`, `FRAMEWORK`, `IPC`, `CRYPTO`, `NET`, `OS`, `ANTI-RE`, `DECEPTION`, `LLM`, `AUTH`, `STORAGE`, `SANDBOX`

Each category is activated if the stack or detected components justify it.

#### T7: Look for adversary_output.yaml

```bash
# Look for adversary-simulation report in the project
find {project_path} -maxdepth 4 -type f \( \
  -name "adversary_output.yaml" -o -name "adversary_output.yml" -o \
  -name "P3_vulnerabilities.yaml" -o -name "P5_attack_chains.yaml" -o \
  -name "*-OFFENSIVE-REPORT.md" \
\) ! -path "*/node_modules/*" ! -path "*/target/*" 2>/dev/null

# Also look in audit/Offensive_Report/.attacker_working/
find {project_path} -maxdepth 5 -path "*/audit/Offensive_Report/.attacker_working/*/data/*" -name "*.yaml" 2>/dev/null
```

**If adversary_output.yaml or P3_vulnerabilities.yaml found:**
- Extract identified vulnerabilities (VULN-xxx)
- Prioritize them to target hardening (fix found vulnerabilities first)
- Mode = TARGETED (hardening driven by known vulnerabilities)

**If no report found:**
- Mode = FULL (generic hardening, all categories)
- Scan all defense surfaces without specific targeting

#### T8: Look for Threat-Modeling Report

```bash
# Look for existing threat modeling reports
find {project_path} -maxdepth 3 -type f \( \
  -name "*threat*model*" -o -name "*stride*" -o \
  -name "*risk*assess*" -o -name "*security*review*" -o \
  -name "*threat*report*" \
\) ! -path "*/node_modules/*" ! -path "*/target/*" 2>/dev/null
```

If a report is found, read it to extract priority risks and target the hardening.

#### T9: Write Output

**Writing order** (CRITICAL):
1. **YAML first** : `audit/Defensive_Report/.defender_working/{SESSION_ID}/data/P0_detection.yaml`
2. **MD second** : `audit/Defensive_Report/.defender_working/{SESSION_ID}/reports/P0-DETECTION.md`

YAML template:

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
      defense_relevance: "CRITICAL|HIGH|MEDIUM|LOW"

sensitive_components:
  auth: []                # Files/modules related to auth
  crypto: []              # Crypto files/modules
  llm_ai: []              # LLM/AI files/modules
  ipc: []                 # IPC files/modules
  database: []            # DB files/modules
  subprocess: []          # Subprocess files/modules
  privilege_elevation: [] # Elevation files/modules
  network: []             # Network files/modules

adversary_input:
  found: false
  path: null
  mode: "FULL"            # "TARGETED" if adversary_output.yaml found
  vulnerabilities_found: []  # List of extracted VULN-xxx
  priority_targets: []    # Vulnerabilities to fix first

threat_model:
  found: false
  path: null
  risk_priorities: []     # Priority risks extracted from report

loaded_data:
  from_index: "data/defensive/index-defensive.md"
  generic_files: []       # Loaded data/defensive/generic/ files
  stack_files: []         # Loaded data/defensive/{stack}/ files
  platform_files: []      # Loaded data/defensive/platform/ files
  framework_files: []     # Loaded data/defensive/stack/ files

defense_categories_active:
  - code: "CATEGORY_CODE"
    reason: "Justification for activation"
    data_files: ["path/to/data.md"]
```

---

### VALIDATION - Completeness Check

```
VALIDATION - P0 Check
================================================

| Element verified | Status |
|-----------------|--------|
| Project path accessible? | [OK/FAIL] |
| At least 1 config file found? | [OK/FAIL] |
| At least 1 language detected? | [OK/FAIL] |
| Target OS determined? | [OK/FAIL] |
| Frameworks identified? | [OK/FAIL] |
| Security-sensitive components scanned? | [OK/FAIL] |
| data/defensive/index-defensive.md read? | [OK/FAIL] |
| Tags matched with stack? | [OK/FAIL] |
| Generic files loaded? | [OK/FAIL] |
| Stack-specific files selected? | [OK/FAIL] |
| adversary_output.yaml searched? | [OK/FAIL] |
| Mode determined (TARGETED or FULL)? | [OK/FAIL] |
| Active defense categories determined? | [OK/FAIL] |
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
[Summary: detected stack, target OS, frameworks, number of DATA files loaded]
[Mode: TARGETED (adversary_output.yaml found) or FULL (generic hardening)]

## Detected Stack
| Component | Value | Source |
|-----------|-------|--------|
| Languages | [list] | [config files] |
| Frameworks | [list] | [config files] |
| Target OS | [list] | [signals] |
| Package managers | [list] | [lockfiles] |

## Critical Dependencies
| Name | Version | Source | Defense relevance |
|------|---------|--------|------------------|

## Security-Sensitive Components
| Component | Files | Criticality |
|-----------|-------|-------------|

## Adversary Input
[If adversary_output.yaml found: summary of identified vulnerabilities and hardening priorities]
[If not found: FULL mode, generic all-category hardening]

## Loaded Defensive DATA
| Category | Loaded files | Reason |
|----------|-------------|--------|
| generic/ | [list] | Universal common base |
| {stack}/ | [list] | Specific stack |
| platform/ | [list] | Target OS |
| stack/ | [list] | Specific framework |

## Active Defense Categories
| Code | Category | Activation reason | DATA sources |
|------|----------|------------------|--------------|

## Existing Threat Model
[Found/Not found. If found: summary of priority risks]

## Initial Observations
[First impressions from a defender's perspective]
[Which surfaces are most exposed?]
[Where to focus priority in subsequent phases?]
```

---

**End of P0-DETECTION.md**
