---
name: hk-context
description: Generate or update project context ({project}-output/project-context.md). Auto-detects if file exists — creates or updates accordingly. Use when starting work on a project, onboarding, or after significant changes.
argument-hint: "[force]"
---

# Project Context Generator

Scan the project and produce a living context file that informs all H.K steps
about what the project does, its tech stack, architecture, security posture, and conventions.

---

## Step 0 — Auto-detect mode

Before anything else, determine the project name and check for an existing context file.

```
PROJECT_NAME = basename of current working directory (uppercase, hyphens allowed)
CONTEXT_FILE = {PROJECT_NAME}-output/project-context.md

IF $ARGUMENTS == "force":
  → Delete existing file, create from scratch

IF CONTEXT_FILE exists:
  → MODE = UPDATE (read existing, preserve ## Notes, refresh everything else)
ELSE:
  → MODE = CREATE (scan everything, write new file)

IF MODE == UPDATE:
  → Read the existing file
  → Extract the ## Notes section content (preserve it exactly)
  → Proceed to Step 1 with fresh scan
```

---

## Step 1 — Scan the project

Read these sources in order. Skip any that don't exist.

### 1.1 Project identity
- `README.md` → project description, purpose, target users
- `CLAUDE.md` → conventions, rules, security requirements
- `.claude/rules/*.md` → additional rules

### 1.2 Tech stack detection
Scan for config files and extract language + version + dependencies:

| Config file | Stack signal |
|-------------|-------------|
| `package.json` | Node.js / TypeScript / JavaScript |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `pyproject.toml` / `setup.py` / `requirements.txt` | Python |
| `pubspec.yaml` | Flutter / Dart |
| `pom.xml` / `build.gradle` | Java / Kotlin |
| `Gemfile` | Ruby |
| `composer.json` | PHP |

For multi-stack projects (e.g., Tauri = Rust + TypeScript + Python sidecar),
detect ALL config files and list each stack.

### 1.3 Framework detection
- `tauri.conf.json` → Tauri
- `next.config.*` → Next.js
- `vite.config.*` → Vite
- `angular.json` → Angular
- `vue.config.*` → Vue
- `tsconfig.json` → TypeScript (check `strict`, `target`)
- `tailwind.config.*` or `@tailwindcss` in package.json → Tailwind CSS (check version)
- `django` / `flask` / `fastapi` in dependencies → Python web framework
- `electron` in dependencies → Electron

### 1.4 Directory structure
List directories 2 levels deep, excluding: `node_modules`, `.git`, `dist`, `build`,
`venv`, `.venv`, `__pycache__`, `target` (Rust).

### 1.5 Database detection
- `prisma/` → Prisma
- SQLite / SQLCipher in dependencies → embedded DB
- PostgreSQL / MySQL / MongoDB drivers in dependencies → external DB

### 1.6 Security posture (discovery only — no audit)
Check for presence of security-related artifacts:
- `audit/` directory → security audit reports exist
- `.githooks/` or `.git/hooks/` → git hooks in place
- `.claude/hooks/` → Claude Code hooks
- `SECURITY.md` → security policy
- Security dependencies (e.g., `zeroize`, `keyring`, `aes-gcm`, `hmac`, `dompurify`)
- CSP configuration in framework config

Report what EXISTS, do not analyze or audit.

### 1.7 CI/CD
- `.github/workflows/` → GitHub Actions
- `.gitlab-ci.yml` → GitLab CI
- `Jenkinsfile` → Jenkins
- `Dockerfile` / `docker-compose.yml` → Docker

### 1.8 Conventions
- Git log (last 10 commits) → commit message format
- Branch names → branching strategy
- File naming patterns → naming convention per layer
- Linter / formatter config → code style

---

## Step 2 — Write the context file

Create or overwrite `{PROJECT_NAME}-output/project-context.md` with the template below.

- In UPDATE mode: preserve the `## Notes` section content from the existing file.
- Replace all `{placeholders}` with detected values.
- Remove sections that don't apply (e.g., no DB → remove DB line).
- Target: **60-120 lines**. Be concise but complete. No filler.

```markdown
# Project Context — {PROJECT_NAME}

## Description
{1-3 sentences: what the project does, its purpose, who it's for.
Extract from README.md or infer from code structure.}

## Tech Stack
- **Language(s)**: {language + version for each}
- **Frontend**: {framework + version, CSS framework}
- **Backend**: {framework + version}
- **DB**: {database + driver/ORM}
- **Build**: {build tools}
- **CI**: {CI platform + trigger}

## Architecture
- **Type**: {desktop app | web app | CLI | library | monorepo | microservices}
- **Pattern**: {layered | hexagonal | MVC | feature-based | ...}
- **Key boundaries**: {e.g., "Frontend → IPC → Backend → Subprocess → APIs"}
- **Tests**: {test framework + command to run}

## File Structure
```text
{2-level directory tree of source directories only,
exclude node_modules/dist/build/venv/.git/target}
```

## Security
{List what security measures are IN PLACE — not recommendations.
e.g., "SQLCipher encryption, CSRF tokens on IPC, pre-commit hook with secret detection"
If audit/ directory exists: "Security audit reports available in audit/"
If nothing found: "No security measures detected."}

## Conventions
- **Naming**: {snake_case | camelCase | PascalCase — per layer if mixed}
- **Branches**: {main only | feat/ branches | ...}
- **Commits**: {conventional commits | freeform | ...}
- **i18n**: {system used, if any}
- **Max file size**: {if enforced by linter/hook}

## Commands
```bash
{Essential commands only: dev, build, test, lint, typecheck.
Use comments to label each command.}
```

## Notes
{In UPDATE mode: preserve existing content exactly.
In CREATE mode: leave this comment:}
<!-- Manual notes — this section is never overwritten by /hk-context -->
```

---

## Integration with H.K workflow

### In step-00-init
```
IF {PROJECT_NAME}-output/project-context.md exists:
  → Read it to inform the analysis
ELSE:
  → Run /hk-context to generate it
```

### When to re-run
- After adding a new major dependency or framework
- After restructuring the project
- After a security audit
- At the start of a new work session on an unfamiliar project

---

User: $ARGUMENTS
