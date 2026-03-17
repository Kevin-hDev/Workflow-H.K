---
name: step-00b-build
description: Détecte TOUS les build systems (monorepo-aware) et retourne variables.build_systems[]
returns_to: step-00-init.md
---

> Avant d'exécuter ce step, recharger :
> - shared/meta/security-rules.md
> - shared/meta/modes.md
> - Le mode actif est : [MODE: IDLE]

# Step 0b: Build System Detection

**Rôle** : DÉTECTEUR uniquement — pas d'implémentation, pas d'exécution de commandes.

- Scanner TOUS les sous-dossiers (monorepo-aware), pas seulement la racine
- Chaque build system détecté produit un objet conforme au schéma `build_system`

---

## SÉQUENCE D'EXÉCUTION

### 1. Glob récursif — détecter tous les manifestes

Chercher avec Glob récursif depuis la racine du projet :

```
Cargo.toml        → cargo
package.json      → bun / pnpm / yarn / npm  (voir étape 2)
go.mod            → go
build.gradle*     → gradle
pom.xml           → maven
pyproject.toml    → python / poetry / uv / hatch  (voir étape 3)
requirements.txt  → pip
mix.exs           → elixir
Gemfile           → ruby
CMakeLists.txt    → cmake
Makefile          → make
*.csproj / *.sln  → dotnet
pubspec.yaml      → dart / flutter  (voir étape 4)
Package.swift     → swift
```

Exclure : `node_modules/`, `.git/`, `vendor/`, `target/`, `dist/`, `build/`.
Pour chaque match, noter le `path` relatif au dossier racine.

### 2. Raffiner Node.js (si package.json trouvé)

Lire le lockfile au même niveau que package.json :

```
bun.lock / bun.lockb  → type = "bun",  test_cmd = "bun test",  lint_cmd = "bun lint"
pnpm-lock.yaml        → type = "pnpm", test_cmd = "pnpm test", lint_cmd = "pnpm lint"
yarn.lock             → type = "yarn", test_cmd = "yarn test",  lint_cmd = "yarn lint"
(aucun lockfile)      → type = "npm",  test_cmd = "npm test",  lint_cmd = "npm run lint"
```

Lire `package.json.scripts` pour détecter :

```
has_tests      = scripts contient "test" (valeur non vide, pas un echo)
has_lint       = scripts contient "lint"
has_typecheck  = scripts contient "typecheck" OU "type-check" OU "tsc"
test_cmd       = "{pkg} {run?} test"    (adapter selon le type)
lint_cmd       = "{pkg} {run?} lint"
typecheck_cmd  = "{pkg} {run?} typecheck" (ou "tsc --noEmit" si tsc direct)
```

### 3. Sous-détection Python (si pyproject.toml)

```
[tool.poetry]    → type = "poetry",  test_cmd = "poetry run pytest",  lint_cmd = "poetry run ruff check"
[tool.uv]        → type = "python",  test_cmd = "uv run pytest",      lint_cmd = "uv run ruff check"
hatchling        → type = "python",  test_cmd = "hatch run test",     lint_cmd = "hatch run lint"
sinon            → type = "python",  test_cmd = "python -m pytest",   lint_cmd = "python -m ruff check"
has_typecheck    = vérifier présence de mypy / pyright dans dépendances
```

Si requirements.txt sans pyproject.toml → type = "python", test_cmd = "pytest", lint_cmd = "ruff check".

### 4. Sous-détection Dart/Flutter (si pubspec.yaml)

```
flutter: (clé présente dans pubspec.yaml) → type = "flutter"
sinon                                      → type = "dart"

flutter : test_cmd = "flutter test",  lint_cmd = "flutter analyze", typecheck_cmd = "flutter analyze"
dart    : test_cmd = "dart test",     lint_cmd = "dart analyze",    typecheck_cmd = "dart analyze"
```

### 5. Commandes des autres écosystèmes

| type | has_tests | test_cmd | has_lint | lint_cmd | has_typecheck | typecheck_cmd |
|------|-----------|----------|----------|----------|---------------|---------------|
| cargo | true | `cargo test` | true | `cargo clippy` | true | `cargo check` |
| go | true | `go test ./...` | true | `go vet ./...` | true | `go build ./...` |
| gradle | true | `./gradlew test` | true | `./gradlew lint` | false | null |
| maven | true | `mvn test` | true | `mvn checkstyle:check` | false | null |
| dotnet | true | `dotnet test` | true | `dotnet format --verify-no-changes` | true | `dotnet build` |
| elixir | true | `mix test` | true | `mix credo` | true | `mix dialyzer` (si dep présente) |
| ruby | true | `bundle exec rake test` | true | `rubocop` | true | (sorbet si .sorbet/ existe) |
| swift | true | `swift test` | true | `swiftlint` (si .swiftlint.yml) | true | `swift build` |
| cmake | true | `ctest` | true | `clang-tidy` (si .clang-tidy) | false | `cmake --build .` |
| make | vérifier target "test" | `make test` | vérifier target "lint" | `make lint` | false | null |
| python (pip) | true | `pytest` | false | null | false | null |

Pour gradle/maven : `has_typecheck = false` car le build inclut la vérification de types.
Pour elixir : `has_typecheck = true` uniquement si `dialyxir` dans les dépendances mix.exs.
Pour swift : `has_lint = true` uniquement si `.swiftlint.yml` présent à la racine du projet.
Pour ruby : `has_typecheck = true` uniquement si dossier `.sorbet/` présent.

### 6. Construire les objets build_system

Pour chaque manifeste détecté, produire un objet conforme au schéma checkpoint :

```json
{
  "path": "dashboard/",
  "type": "pnpm",
  "has_tests": true,
  "has_lint": true,
  "has_typecheck": true,
  "test_cmd": "pnpm test",
  "lint_cmd": "pnpm lint",
  "typecheck_cmd": "pnpm typecheck"
}
```

`path` = dossier relatif du manifeste (ex: `"."` pour la racine, `"api/"` pour un sous-projet).
Les champs `*_cmd` sont `null` si la commande n'est pas disponible.

---

## Transition

Retourne à `steps/step-00-init.md`
Mettre à jour .hk/hk-state.json : `variables.build_systems = [{...}, ...]`

Si plusieurs build systems détectés (monorepo) → tous présents dans le tableau.
Ordre : racine en premier, sous-projets ensuite (ordre alphabétique par path).
