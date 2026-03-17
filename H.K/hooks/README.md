# H.K Git Hooks

## Pre-Commit Hook

A universal code quality gate that runs before every commit. Catches problems early so they don't reach the repository.

### What it checks

| # | Check | Action | What it catches |
|---|-------|--------|----------------|
| 1 | Code files > 250 lines | **BLOCKS** | Files that need refactoring (target 50-150 lines) |
| 2 | Secrets in code | **BLOCKS** | API keys, tokens, passwords, private keys hardcoded in source |
| 3 | .env / credential files | **BLOCKS** | Sensitive files that should never be committed |
| 4 | Merge conflicts | **BLOCKS** | Unresolved `<<<<<<<` / `=======` / `>>>>>>>` markers |
| 5 | Debug statements | **WARNS** | `console.log`, `print`, `dbg!`, `debugger` left in code |
| 6 | TODO/FIXME markers | **WARNS** | Temporary code markers that should be resolved |
| 7 | Lint + Typecheck | **BLOCKS** | Auto-detects and runs project linter/typechecker |

### What it does NOT check

- **Documentation files** (.md, .txt, .rst) — no line limit, a PRD or design-specs can be as long as needed
- **Config files** (.json, .yaml, .toml, .lock) — no line limit
- **Generated files** (dist/, build/, node_modules/) — excluded
- **Test files** (.test., .spec., __tests__/) — excluded from line count
- **HTML/CSS/SVG/SQL** — excluded from line count

### Supported languages

TypeScript, JavaScript, Rust, Go, Python, Ruby, Java, Kotlin, Swift, C, C++, C#, PHP, Vue, Svelte.

### Lint/Typecheck auto-detection

The hook automatically detects your project's linter and typechecker:

| Project type | Lint | Typecheck |
|-------------|------|-----------|
| Node.js (package.json) | `npm run lint` | `npm run typecheck` |
| Rust (Cargo.toml) | `cargo clippy` | `cargo check` |
| Go (go.mod) | `go vet ./...` | — |
| Python (pyproject.toml) | `ruff check .` | `mypy .` |
| H.K state (.hk/hk-state.json) | Uses detected commands | Uses detected commands |

### Installation

```bash
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

That's it. The hook runs automatically before every `git commit`.

### Bypassing (use sparingly)

If you need to commit despite a blocking check (e.g., work in progress):

```bash
git commit --no-verify -m "wip: work in progress"
```

This skips ALL hooks. Use only when you know what you're doing.

### Keeping debug statements

Add `// keep` (or `# keep` in Python) at the end of a line to prevent the debug warning:

```javascript
console.log('Server started on port', port); // keep
```

---

# H.K Git Hooks (Fran\u00e7ais)

## Hook Pre-Commit

Un contr\u00f4le qualit\u00e9 universel qui s'ex\u00e9cute avant chaque commit. D\u00e9tecte les probl\u00e8mes t\u00f4t pour qu'ils n'atteignent pas le d\u00e9p\u00f4t.

### Ce qu'il v\u00e9rifie

| # | V\u00e9rification | Action | Ce que \u00e7a d\u00e9tecte |
|---|-------|--------|----------------|
| 1 | Fichiers code > 250 lignes | **BLOQUE** | Fichiers \u00e0 refactorer (cible 50-150 lignes) |
| 2 | Secrets dans le code | **BLOQUE** | Cl\u00e9s API, tokens, mots de passe, cl\u00e9s priv\u00e9es en dur |
| 3 | Fichiers .env / credentials | **BLOQUE** | Fichiers sensibles qui ne doivent jamais \u00eatre commit\u00e9s |
| 4 | Conflits de merge | **BLOQUE** | Marqueurs `<<<<<<<` / `=======` / `>>>>>>>` non r\u00e9solus |
| 5 | Statements de debug | **AVERTIT** | `console.log`, `print`, `dbg!`, `debugger` oubli\u00e9s |
| 6 | Marqueurs TODO/FIXME | **AVERTIT** | Code temporaire qui devrait \u00eatre r\u00e9solu |
| 7 | Lint + Typecheck | **BLOQUE** | D\u00e9tecte et lance automatiquement le linter/typechecker du projet |

### Ce qu'il ne v\u00e9rifie PAS

- **Fichiers de documentation** (.md, .txt, .rst) \u2014 pas de limite de lignes, un PRD peut \u00eatre aussi long que n\u00e9cessaire
- **Fichiers de config** (.json, .yaml, .toml, .lock) \u2014 pas de limite
- **Fichiers g\u00e9n\u00e9r\u00e9s** (dist/, build/, node_modules/) \u2014 exclus
- **Fichiers de test** (.test., .spec., __tests__/) \u2014 exclus du comptage
- **HTML/CSS/SVG/SQL** \u2014 exclus du comptage

### Installation

```bash
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Le hook s'ex\u00e9cute automatiquement avant chaque `git commit`.

### Contourner (avec pr\u00e9caution)

```bash
git commit --no-verify -m "wip: travail en cours"
```

Ceci ignore TOUS les hooks. \u00c0 utiliser uniquement en connaissance de cause.
