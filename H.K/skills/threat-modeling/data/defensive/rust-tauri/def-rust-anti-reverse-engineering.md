# Anti-Reverse Engineering — Défense pour stack Rust/Tauri/PyInstaller/React

## Vue d'ensemble

Ce fichier couvre les techniques de durcissement binaire et de protection contre le reverse engineering pour une application desktop composée d'un binaire Rust/Tauri, d'un sidecar PyInstaller, et d'un frontend React dans une WebView. L'objectif défensif n'est pas de cacher du code source public (code source ouvert = pas de secret à protéger), mais de :

1. Rendre l'analyse plus coûteuse pour un attaquant ciblant les données runtime (clés, tokens, secrets en mémoire)
2. Éliminer les fuites d'information dans les binaires (chemins sources, symboles, panic strings)
3. Prévenir la redistribution de binaires trojanisés (code signing)
4. Détecter les tentatives de débogage actif (anti-debug)
5. Vérifier l'intégrité du sidecar avant chaque lancement

**Modèle de menace réel pour un projet OSS desktop :**
- CRITIQUE : redistribution de binaires trojanisés (acteurs étatiques — voir attaque Notepad++ février 2026)
- CRITIQUE : attaques supply chain sur les dépendances (454 600+ packages malveillants identifiés en 2025, Sonatype)
- ELEVÉ : remplacement du sidecar PyInstaller sur disque après installation
- MOYEN : extraction de secrets depuis la mémoire du processus (gdb, lldb, procdump)
- FAIBLE (OSS) : reverse engineering du code source déjà public

Bitwarden (AES-256-CBC + HMAC, architecture zero-knowledge) et Signal Desktop (AGPL-3.0) ne pratiquent aucune obfuscation et protègent des données ultra-sensibles. La sécurité vient du design cryptographique, pas de l'obscurité.

---

## 1. Durcissement du binaire Rust

### 1.1 Profil Cargo.release optimal

Le profil release par défaut de Cargo **ne strippe pas les symboles** (`strip = "none"`). Un binaire Rust non configuré expose les noms de fonctions, les chemins de fichiers sources, les messages de `expect()`, et les noms de modules — toutes des informations exploitables pour l'analyse.

```toml
# Cargo.toml
[profile.release]
opt-level = 3          # Optimisation maximale — inlining agressif, déplie les boucles
debug = false          # Aucune information de débogage DWARF
strip = "symbols"      # Supprime TOUS les symboles — élimine les noms de fonctions
lto = "fat"            # LTO cross-crate — fusionne et détruit les frontières de modules
codegen-units = 1      # Maximise l'inlining (empêche l'analyse module par module)
panic = "abort"        # Supprime l'infrastructure d'unwind — réduit la taille binaire
                       # et élimine les landing pads analysables
```

**Effets concrets :**
- `strip = "symbols"` : élimine tous les symboles exportés et locaux, rendant le démangling inutile
- `lto = "fat"` : fusionne tous les crates en un seul objet — les frontières de modules disparaissent
- `codegen-units = 1` : force la compilation monolithique, maximisant l'inlining inter-fonctions
- `panic = "abort"` : supprime les tables d'unwind qui révèlent la structure du code

### 1.2 Suppression des panic strings (fuites de chemins sources)

Même dans un binaire strippé, `core::panic::Location` embarque les chemins de fichiers sources dans le binaire final :

```
src/api/auth.rs:42
src/db/sqlcipher.rs:187
src/crypto/key_manager.rs:93
```

Un script Binary Ninja (documenté par Cindy Xiao) peut extraire automatiquement toutes ces chaînes depuis le segment `.rodata`. La mitigation nécessite le compilateur nightly :

```bash
# Supprime les informations de localisation des panics
RUSTFLAGS="-Zlocation-detail=none" cargo +nightly build \
  -Z build-std \
  --target x86_64-unknown-linux-gnu \
  --release
```

```bash
# Pour Windows
RUSTFLAGS="-Zlocation-detail=none" cargo +nightly build \
  -Z build-std \
  --target x86_64-pc-windows-msvc \
  --release
```

**Vérification :** après build, inspecter avec `strings` (Linux/macOS) ou `strings.exe` (Windows) et vérifier l'absence de chemins `src/` dans la sortie.

### 1.3 Protection des secrets en mémoire

Les clés API et tokens SQLCipher en mémoire sont lisibles via `/proc/PID/mem` (Linux), `procdump.exe` (Windows), ou `lldb` (macOS) sans nécessiter un debugger interactif.

```toml
# Cargo.toml
[dependencies]
secrecy = "0.10"
zeroize = { version = "1.8", features = ["derive"] }
```

```rust
use secrecy::{SecretString, ExposeSecret};
use zeroize::Zeroize;

// Utilisation d'une clé API de façon sécurisée
fn use_api_key(key: &SecretString) {
    // ExposeSecret force l'accès explicite — visible dans les code reviews
    let mut plaintext = key.expose_secret().clone();
    do_api_call(&plaintext);
    // Zéroisation explicite de la copie avant le drop
    plaintext.zeroize();
}
// SecretString est automatiquement zéroïsé au drop (via impl Drop)

// Struct avec dérivation automatique de Zeroize
#[derive(Zeroize, ZeroizeOnDrop)]
struct SessionKeys {
    encryption_key: [u8; 32],
    hmac_key: [u8; 32],
    auth_token: Vec<u8>,
}
```

**Règle absolue :** `SecretString` ne doit jamais être cloné dans un `String` ordinaire sauf pour la durée strictement nécessaire à l'opération, puis zéroïsé immédiatement.

---

## 2. Anti-debug — Détection multi-plateforme

### 2.1 Crate recommandé : secmem-proc

`secmem-proc v0.3.x` (auteur : niluxv) est la solution la plus complète pour une application cross-platform :

```toml
[dependencies]
secmem-proc = "0.3"
```

```rust
use secmem_proc;

fn main() {
    // À appeler EN PREMIER, avant tout chargement de secret
    // Active en une ligne :
    // - Désactivation des core dumps (Linux : prctl PR_SET_DUMPABLE)
    // - Restriction ptrace (Linux)
    // - DACL restrictif sur le handle de processus (Windows)
    // - Détection IsDebuggerPresent + KUSER_SHARED_DATA (Windows)
    // - PT_DENY_ATTACH (macOS)
    #[cfg(not(debug_assertions))]  // Uniquement en production
    if let Err(e) = secmem_proc::harden_process() {
        // Fail CLOSED : si le durcissement échoue, on bloque
        eprintln!("Process hardening failed: {}", e);
        std::process::exit(1);
    }

    // Vérification manuelle complémentaire
    #[cfg(not(debug_assertions))]
    check_debugger_attached();

    // Suite de l'initialisation...
}
```

### 2.2 Détection Linux — TracerPid

```rust
/// Détecte un debugger via /proc/self/status (Linux uniquement)
#[cfg(target_os = "linux")]
fn is_traced_linux() -> bool {
    use std::fs;
    let status = match fs::read_to_string("/proc/self/status") {
        Ok(s) => s,
        Err(_) => return false, // Fail open sur erreur de lecture — ne pas bloquer
    };
    for line in status.lines() {
        if line.starts_with("TracerPid:") {
            let pid: i32 = line
                .split_whitespace()
                .nth(1)
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);
            return pid != 0;
        }
    }
    false
}
```

### 2.3 Détection Windows — PEB + NtQueryInformationProcess

```rust
/// Détecte un debugger Windows via IsDebuggerPresent et ProcessDebugPort
#[cfg(target_os = "windows")]
fn is_debugger_present_windows() -> bool {
    use windows::Win32::System::Diagnostics::Debug::IsDebuggerPresent;
    use windows::Win32::System::Threading::{GetCurrentProcess, OpenProcess};

    unsafe {
        // Méthode 1 : IsDebuggerPresent (lit le flag PEB.IsDebugged)
        if IsDebuggerPresent().as_bool() {
            return true;
        }
        // Méthode 2 : CheckRemoteDebuggerPresent (debugger distant)
        let mut is_remote = windows::Win32::Foundation::BOOL(0);
        windows::Win32::System::Diagnostics::Debug::CheckRemoteDebuggerPresent(
            GetCurrentProcess(),
            &mut is_remote,
        );
        if is_remote.as_bool() {
            return true;
        }
        false
    }
}
```

### 2.4 Détection macOS — sysctl P_TRACED

```rust
/// Détecte un debugger macOS via sysctl (flag P_TRACED)
#[cfg(target_os = "macos")]
fn is_traced_macos() -> bool {
    use std::mem;
    use libc::{kinfo_proc, CTL_KERN, KERN_PROC, KERN_PROC_PID, sysctl};

    unsafe {
        let mut info: kinfo_proc = mem::zeroed();
        let mut size = mem::size_of::<kinfo_proc>();
        let mib = [CTL_KERN, KERN_PROC, KERN_PROC_PID, std::process::id() as i32];
        let ret = sysctl(
            mib.as_ptr() as *mut _,
            mib.len() as u32,
            &mut info as *mut _ as *mut _,
            &mut size,
            std::ptr::null_mut(),
            0,
        );
        if ret != 0 {
            return false;
        }
        // P_TRACED = 0x800 dans p_flag
        (info.kp_proc.p_flag & 0x800) != 0
    }
}
```

### 2.5 Réponse à la détection — Fail CLOSED

```rust
/// Réponse à la détection d'un debugger — Fail CLOSED
fn handle_debugger_detected() {
    // 1. Logger l'événement (AVANT de wiper la mémoire)
    log_security_event(SecurityEvent {
        severity: Severity::Critical,
        event_type: "debugger_detected",
        details: "Active debugger detected on process",
    });

    // 2. Envoyer alerte Telegram P0 (non-bloquant)
    spawn_alert_p0("Debugger detected in production process");

    // 3. Zéroiser les secrets en mémoire
    clear_all_secrets_from_memory();

    // 4. Fermer les connexions sécurisées
    close_secure_connections();

    // 5. Terminer proprement (PAS abort() — crée des core dumps)
    // PAS std::process::abort() — core dump peut contenir des secrets
    std::process::exit(1);
}

/// Wrapper de vérification utilisé au démarrage
fn check_debugger_attached() {
    let detected = {
        #[cfg(target_os = "linux")]
        { is_traced_linux() }
        #[cfg(target_os = "windows")]
        { is_debugger_present_windows() }
        #[cfg(target_os = "macos")]
        { is_traced_macos() }
        #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
        { false }
    };

    if detected {
        handle_debugger_detected();
    }
}
```

---

## 3. Détection d'injection de bibliothèques

### 3.1 Linux — LD_PRELOAD

```rust
/// Détecte LD_PRELOAD au démarrage (Linux)
#[cfg(target_os = "linux")]
fn check_ld_preload() {
    if let Ok(val) = std::env::var("LD_PRELOAD") {
        if !val.is_empty() {
            log_security_event(SecurityEvent {
                severity: Severity::Warning,
                event_type: "library_injection_ld_preload",
                details: &format!("LD_PRELOAD set: [REDACTED {} chars]", val.len()),
            });
            // Supprimer pour les processus enfants
            std::env::remove_var("LD_PRELOAD");
        }
    }
}

/// Lit /proc/self/maps et compare aux bibliothèques attendues
#[cfg(target_os = "linux")]
fn check_loaded_libraries() -> Vec<String> {
    use std::fs;
    let maps = fs::read_to_string("/proc/self/maps").unwrap_or_default();
    let mut unexpected = Vec::new();
    let allowlist = [
        "libgcc", "libc.so", "libm.so", "libdl.so", "libpthread",
        "libwebkit2gtk", "libgtk", "libglib", "libgio", "libgobject",
    ];
    for line in maps.lines() {
        if !line.contains(".so") { continue; }
        let path = line.split_whitespace().last().unwrap_or("");
        if path.ends_with(".so") || path.contains(".so.") {
            let allowed = allowlist.iter().any(|a| path.contains(a));
            if !allowed {
                unexpected.push(path.to_string());
            }
        }
    }
    unexpected
}
```

### 3.2 macOS — DYLD_INSERT_LIBRARIES

```rust
/// Détecte DYLD_INSERT_LIBRARIES au démarrage (macOS)
#[cfg(target_os = "macos")]
fn check_dyld_insert_libraries() {
    if let Ok(val) = std::env::var("DYLD_INSERT_LIBRARIES") {
        if !val.is_empty() {
            log_security_event(SecurityEvent {
                severity: Severity::Warning,
                event_type: "library_injection_dyld",
                details: "DYLD_INSERT_LIBRARIES set — possible dylib injection",
            });
            // Note : sur macOS avec Hardened Runtime, cette variable
            // est ignorée par le système, mais son existence est suspecte
        }
    }
}
```

---

## 4. Code signing multi-plateforme

### 4.1 macOS — Notarization obligatoire

macOS 15 Sequoia a supprimé le contournement Ctrl-clic de Gatekeeper. Un binaire non notarisé bloque l'utilisateur derrière plusieurs écrans de sécurité.

```xml
<!-- entitlements.plist minimal pour une app Tauri -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Requis pour la WebView Tauri (JIT compilation JavaScript) -->
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <!-- Accès réseau sortant -->
    <key>com.apple.security.network.client</key>
    <true/>
    <!-- NE JAMAIS ACTIVER : ouvre l'injection DYLD -->
    <!-- <key>com.apple.security.cs.allow-dyld-environment-variables</key> -->
    <!-- <true/> -->
</dict>
</plist>
```

```bash
# Signature du sidecar (AVANT signature du .app bundle — inside-out)
codesign --sign "Developer ID Application: Nom (TEAMID)" \
  --options runtime \
  --entitlements entitlements.plist \
  my-sidecar-binary

# Notarization via xcrun (gérée automatiquement par Tauri v2)
# Variables d'environnement requises :
# APPLE_CERTIFICATE, APPLE_CERTIFICATE_PASSWORD
# APPLE_SIGNING_IDENTITY, APPLE_ID, APPLE_PASSWORD, APPLE_TEAM_ID
```

### 4.2 Windows — Authenticode via SignPath Foundation

SignPath Foundation offre la signature Authenticode **gratuite** pour les projets OSS (licence OSI, dépôt GitHub public).

```yaml
# .github/workflows/release.yml — étape de signing Windows
- name: Sign Windows binary
  uses: signpath/github-action-submit-signing-request@v1
  with:
    api-token: '${{ secrets.SIGNPATH_API_TOKEN }}'
    organization-id: '${{ secrets.SIGNPATH_ORG_ID }}'
    project-slug: 'my-app'
    signing-policy-slug: 'release-signing'
    artifact-configuration-slug: 'tauri-bundle'
    github-artifact-id: '${{ steps.build.outputs.artifact-id }}'
```

### 4.3 Linux — GPG + Sigstore/cosign

```bash
# Signature GPG de l'AppImage
SIGN=1 SIGN_KEY=<GPG_KEY_ID> tauri build

# Signature keyless via Sigstore (vérifiable sans clé prépartagée)
cosign sign-blob myapp.AppImage \
  --bundle myapp.AppImage.sigstore.json \
  --yes

# Vérification par l'utilisateur
cosign verify-blob myapp.AppImage \
  --bundle myapp.AppImage.sigstore.json \
  --certificate-identity="https://github.com/ORG/REPO/.github/workflows/release.yml@refs/tags/v1.0.0" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com"
```

---

## 5. Vérification d'intégrité du sidecar PyInstaller

### 5.1 Contexte — Pourquoi le sidecar est une cible

Un attaquant ayant accès au répertoire d'installation peut remplacer le sidecar PyInstaller par une version malveillante. PyInstaller ne fournit aucune vérification native. Tauri v2 n'a pas de plugin officiel (issue #4869, en statut "Proposal" en février 2026).

La vérification SHA-256 doit être implémentée manuellement dans le code Rust.

### 5.2 Injection du hash en CI/CD via build.rs

```rust
// build.rs — exécuté au moment de la compilation Rust
fn main() {
    // Le hash est calculé par le CI après build du sidecar
    // et injecté comme variable d'environnement
    if let Ok(hash) = std::env::var("SIDECAR_EXPECTED_HASH") {
        println!("cargo:rustc-env=SIDECAR_HASH={}", hash);
    }
    tauri_build::build();
}
```

### 5.3 Vérification au runtime — Comparaison en temps constant

```rust
// src/integrity.rs
use sha2::{Sha256, Digest};
use std::io::Read;
use std::path::Path;

// Hash injecté au build time par le CI — absent = pas de vérification
const EXPECTED_SIDECAR_HASH_HEX: &str = env!("SIDECAR_HASH");

/// Vérifie l'intégrité du sidecar via SHA-256 en temps constant.
/// Fail CLOSED : toute erreur (fichier absent, hash incorrect) retourne Err.
pub fn verify_sidecar(path: &Path) -> Result<(), String> {
    let mut file = std::fs::File::open(path)
        .map_err(|e| format!("Sidecar unreachable: {}", e))?;

    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192];
    loop {
        let n = file.read(&mut buffer)
            .map_err(|e| format!("Read error: {}", e))?;
        if n == 0 { break; }
        hasher.update(&buffer[..n]);
    }

    let computed: [u8; 32] = hasher.finalize().into();
    let expected = hex::decode(EXPECTED_SIDECAR_HASH_HEX)
        .map_err(|_| "Invalid expected hash format".to_string())?;

    if expected.len() != 32 {
        return Err("Expected hash has wrong length".to_string());
    }

    // OBLIGATOIRE : comparaison en temps constant (anti-timing attack)
    // NE PAS utiliser == ou PartialEq ici
    let mut diff = 0u8;
    for (a, b) in computed.iter().zip(expected.iter()) {
        diff |= a ^ b;
    }

    if diff != 0 {
        return Err(format!(
            "Sidecar integrity check FAILED — binary may be tampered"
        ));
    }

    Ok(())
}

/// Commande Tauri : lance le sidecar seulement après vérification
#[tauri::command]
pub async fn launch_verified_sidecar(app: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_shell::ShellExt;

    let resource_dir = app.path().resource_dir()
        .map_err(|e| e.to_string())?;

    // Chemin du sidecar selon la plateforme
    let sidecar_name = if cfg!(target_os = "windows") {
        "my-sidecar-x86_64-pc-windows-msvc.exe"
    } else if cfg!(target_os = "macos") {
        "my-sidecar-aarch64-apple-darwin"
    } else {
        "my-sidecar-x86_64-unknown-linux-gnu"
    };

    let sidecar_path = resource_dir.join("binaries").join(sidecar_name);

    // Vérification avant lancement — Fail CLOSED
    verify_sidecar(&sidecar_path)?;

    let output = app.shell()
        .sidecar("my-sidecar")
        .map_err(|e| e.to_string())?
        .output()
        .await
        .map_err(|e| e.to_string())?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
```

### 5.4 Calcul du hash en CI

```yaml
# .github/workflows/release.yml
- name: Build Python sidecar
  run: pyinstaller --onefile --clean sidecar.spec
  env:
    PYTHONHASHSEED: '42'  # Reproductibilité

- name: Compute sidecar SHA-256
  id: sidecar_hash
  run: |
    HASH=$(sha256sum dist/my-sidecar | awk '{print $1}')
    echo "hash=$HASH" >> $GITHUB_OUTPUT

- name: Build Rust/Tauri (hash injecté)
  uses: tauri-apps/tauri-action@v0
  env:
    SIDECAR_EXPECTED_HASH: ${{ steps.sidecar_hash.outputs.hash }}
```

---

## 6. Protection du frontend React

### 6.1 Source maps — Interdiction absolue en production

Les source maps exposent le code source TypeScript/JavaScript original, les noms de variables, les commentaires, et la structure exacte du code.

```javascript
// webpack.config.js
module.exports = (env, argv) => ({
  devtool: argv.mode === 'development'
    ? 'cheap-module-source-map'  // Development uniquement
    : false,                      // JAMAIS de source map en production

  output: {
    // Désactiver également les source map comments dans le bundle
    sourceMapFilename: undefined,
  },
});
```

```json
// package.json — pour Create React App
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

```toml
# tauri.conf.json / Vite config — vérification supplémentaire
[build]
# Vite : désactiver les source maps
# vite.config.ts : build.sourcemap = false (valeur par défaut en mode production)
```

### 6.2 Minification avec Terser

```javascript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    minify: 'terser',
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,    // Supprime les console.log en production
        drop_debugger: true,   // Supprime les debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        // Mangling des noms de propriétés (attention : peut casser les APIs)
        properties: {
          regex: /^_/,  // Seulement les propriétés commençant par _
        },
      },
      format: {
        comments: false,  // Supprime tous les commentaires
      },
    },
  },
})
```

---

## 7. Attestations SLSA et provenance de build

### 7.1 GitHub Attestations (SLSA Level 2+)

```yaml
# .github/workflows/release.yml
permissions:
  contents: write
  id-token: write
  attestations: write

jobs:
  build:
    steps:
      # ... étapes de build ...

      - name: Attestation de provenance SLSA
        uses: actions/attest-build-provenance@v3
        with:
          subject-path: 'target/release/bundle/**/*'
          # Génère une attestation SLSA v1.0 Build Level 2 signée par Sigstore
```

### 7.2 Publication des checksums

```yaml
- name: Générer checksums SHA-256
  run: |
    cd target/release/bundle
    sha256sum **/* > ../../../SHA256SUMS.txt

- name: Signer les checksums avec cosign
  run: |
    cosign sign-blob SHA256SUMS.txt \
      --bundle SHA256SUMS.txt.sigstore.json \
      --yes

- name: Publier sur GitHub Release
  run: gh release upload ${{ github.ref_name }} SHA256SUMS.txt SHA256SUMS.txt.sigstore.json
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 8. Considérations pour le sidecar PyInstaller

### 8.1 État de la protection PyInstaller

L'option `--key` (chiffrement AES) a été **supprimée dans PyInstaller 6.0.0**. Elle n'avait jamais été efficace : la clé était stockée dans le module `pyimod00_crypto_key` du binaire lui-même.

L'outil `pyinstxtractor v2.0` extrait et corrige automatiquement les `.pyc` depuis tout binaire PyInstaller 2.0 à 6.16.0. Pour un projet OSS MIT, c'est sans objet : le code source est déjà sur GitHub.

**Version minimale requise :** PyInstaller 6.10.0 (corrige CVE-2025-59042, CVSS 7.0 — injection via manipulation de `sys.path`).

### 8.2 Alternative : Nuitka pour logique propriétaire future

Si le sidecar acquiert de la logique propriétaire :

```bash
# Build Nuitka — transpile en C, compile en code machine natif
python -m nuitka --standalone --onefile \
  --follow-imports \
  --python-flag=no_site \
  --output-filename=my-sidecar \
  main.py
# Les noms de variables disparaissent, récupération du code source Python
# nécessite des compétences de RE binaire natif (IDA Pro, Ghidra)
```

---

## Checklist défensive

- [ ] `Cargo.toml` : `strip = "symbols"`, `lto = "fat"`, `codegen-units = 1`, `panic = "abort"`, `opt-level = 3`
- [ ] Panic strings supprimées : `RUSTFLAGS="-Zlocation-detail=none"` (nightly uniquement si acceptable)
- [ ] `secmem_proc::harden_process()` appelé en toute première ligne du `main()`, sous `cfg(not(debug_assertions))`
- [ ] Détection multi-plateforme : TracerPid (Linux), IsDebuggerPresent + KUSER_SHARED_DATA (Windows), sysctl P_TRACED (macOS)
- [ ] Réponse à la détection : log → alerte → zéroisation → `exit(1)` (jamais `abort()`)
- [ ] LD_PRELOAD supprimé au démarrage (Linux), DYLD_INSERT_LIBRARIES loggué (macOS)
- [ ] Code signing : macOS notarisation ($99/an), Windows Authenticode (SignPath Foundation gratuit OSS), Linux GPG + cosign
- [ ] Entitlement `com.apple.security.cs.allow-dyld-environment-variables` : JAMAIS activé
- [ ] Vérification SHA-256 du sidecar avant chaque lancement (comparaison en temps constant XOR)
- [ ] Hash du sidecar injecté au build time via `build.rs` et CI
- [ ] Source maps React : `GENERATE_SOURCEMAP=false` ou `build.sourcemap = false` en production
- [ ] `console.log` supprimés en production (Terser `drop_console: true`)
- [ ] Attestations SLSA via `actions/attest-build-provenance@v3`
- [ ] SHA-256 des binaires publiés sur GitHub Releases avec signature cosign
- [ ] PyInstaller >= 6.10.0 (CVE-2025-59042 corrigé)
- [ ] `secrecy` + `zeroize` pour tous les secrets en mémoire
- [ ] Aucune clé API embarquée dans le code source ou les binaires
