---
type: security-data
category: attack-patterns
tags: [supply-chain, npm, pip, cargo, dependencies]
loaded_by: Nyx, The Mask (INDEX_THEN_SELECTIVE only)
---

# Attack Patterns — Supply Chain

> Load this file only when the project uses external package managers (npm, pip, cargo, gem, etc.)
> and when dependency confusion or injection risks are in scope.

---

## Typosquatting

**What it is:** Malicious package published with a name similar to a popular one (e.g., `lodahs` instead of `lodash`).

**Attack vector:**
1. Attacker publishes `{legit-package-name-with-typo}` on npm/PyPI
2. Developer mistypos the install command
3. Malicious package executes in CI or developer machine

**Detection signals:**
- New dependency with unusual name not matching its stated purpose
- Package published very recently with high download count
- Install scripts (`postinstall`) doing network calls

**Remediation:**
- Lock file (package-lock.json / yarn.lock / Cargo.lock) committed and verified
- Dependency pinning with exact versions
- Regular `npm audit` / `pip-audit` / `cargo audit` runs
- Private registry mirror for critical dependencies

---

## Slopsquatting (AI-generated package names)

**What it is:** Attacker publishes packages matching names that LLMs hallucinate when generating code suggestions.

**Attack vector:**
1. LLM suggests `import {package}` where `{package}` does not exist
2. Attacker publishes a malicious package under that name
3. Developer installs without verifying

**Detection signals:**
- Package not found in official documentation
- Package name not matching any known library for the stated purpose

**Remediation:**
- Always verify package existence in official registry before installing
- Use `npm info {package}` / `pip show {package}` before `npm install` / `pip install`

---

## Lockfile Attacks

**What it is:** Attacker modifies the lockfile to point to a malicious package version.

**Attack vector:**
1. Attacker gains write access to the repository (e.g., via PR)
2. Modifies `package-lock.json` to point to a malicious resolved URL
3. CI runs `npm ci` and installs the malicious version

**Detection signals:**
- Lockfile changes in PRs that don't add/remove packages in the manifest
- Resolved URLs pointing to non-standard registries
- Integrity hashes changed without corresponding manifest change

**Remediation:**
- Require lockfile review in PRs
- Verify lockfile integrity: `npm ci` (uses lockfile) vs `npm install` (may update it)
- Use Subresource Integrity (SRI) or integrity checking in CI

---

## Dependency Confusion

**What it is:** Internal package name published on public registry, causing resolution to prefer the attacker's public version.

**Attack vector:**
1. Organization uses internal package `@company/internal-lib` hosted on private registry
2. Attacker publishes `@company/internal-lib` on public npm with higher version number
3. Package manager resolves to the higher-versioned public package

**Detection signals:**
- Internal package names appearing on public registries
- Unexpected version bumps in lockfile pointing to public registry

**Remediation:**
- Scope all internal packages (`@company/`) and configure registry to serve them exclusively
- Use `npm config set @company:registry https://private.registry/`
- `.npmrc` with explicit registry per scope committed to the repo

---

## Malicious Install Scripts

**What it is:** Package's `postinstall` / `preinstall` scripts execute malicious code during install.

**Attack vector:**
1. Attacker publishes a package with a `postinstall` script
2. Script runs arbitrary code: exfiltrates env vars, installs backdoor, etc.

**Detection signals:**
- Package has `scripts.postinstall` / `scripts.preinstall` in package.json
- Script makes network calls or writes outside the package directory

**Remediation:**
- `npm install --ignore-scripts` for untrusted packages
- Audit packages with install scripts before adding them
- Use `socket.dev` or similar for automated supply chain analysis

---

## DREAD Reference Scores

| Attack | D | R | E | A | D | Total |
|--------|---|---|---|---|---|-------|
| Typosquatting | 9 | 6 | 7 | 8 | 6 | 36/50 — High |
| Slopsquatting | 8 | 5 | 6 | 7 | 5 | 31/50 — High |
| Lockfile Attack | 9 | 4 | 5 | 8 | 3 | 29/50 — Medium |
| Dependency Confusion | 10 | 5 | 6 | 9 | 4 | 34/50 — High |
| Malicious Install Scripts | 9 | 7 | 8 | 8 | 6 | 38/50 — High |
