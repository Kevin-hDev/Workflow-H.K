# deception-anti-re-attacks.md
# Contournement des protections anti-RE et déception — Vue offensif

Point de vue : ATTAQUANT. Comment contourner les mécanismes de déception, d'obfuscation, de signing et de monitoring pour analyser, modifier ou exfiltrer sans être détecté.

---

## Vue d'ensemble

Une application Tauri/Rust + sidecar PyInstaller + frontend React déploie plusieurs couches défensives :
- Protections anti-reverse engineering (obfuscation, signing, stripping)
- Mécanismes de déception (canary files, honeypots)
- Monitoring actif (logging, alertes Telegram, intégrité fichiers)
- Anti-debug (ptrace detection, IsDebuggerPresent, sysctl P_TRACED)
- Injection de bibliothèques (DLL, dylib, LD_PRELOAD)

Cet inventaire détaille comment chacune de ces couches est contournée par un adversaire compétent.

---

## Partie 1 : Reverse Engineering des composants

### 1. PyInstaller — Extraction triviale

**Outil principal** : pyinstxtractor (v2.0, compatible PyInstaller 2.0 à 6.16.0 et Python 3.12+)
**Fork alternatif** : pyinstxtractor-ng — fonctionne sans installation Python préalable, déchiffre automatiquement les archives chiffrées (même celles créées avec l'ancienne option `--key`, supprimée en PyInstaller 6.0.0 mais anciens binaires encore présents)

**Étapes d'extraction** :
1. Exécuter pyinstxtractor sur le binaire :
   ```bash
   python pyinstxtractor.py target_binary
   ```
2. L'outil localise automatiquement le "magic cookie" dans l'archive CArchive appendue au bootloader natif.
3. Extraction des fichiers `.pyc` avec correction automatique des headers.
4. Décompilation avec PyLingual (présenté à IEEE S&P 2025 et BlackHat USA 2024) :
   - 77 à 87% de décompilation parfaite sur Python 3.6 à 3.13
   - Les outils classiques (uncompyle6, pycdc) échouent largement au-delà de Python 3.8
   - Les noms de variables et constantes de chaînes sont toujours préservés dans le bytecode `.pyc`
   - Le code récupéré est immédiatement lisible

**Point critique** : L'option `--key` de PyInstaller a été supprimée dans la version 6.0.0 — elle n'a jamais été efficace car la clé AES était embarquée dans le module `pyimod00_crypto_key` du binaire lui-même, détectable et déchiffrable automatiquement par pyinstxtractor-ng.

**Exploitation du répertoire `_MEIPASS`** :
- En mode onefile, PyInstaller crée un répertoire temporaire `_MEIxxxxxx` via `mkdtemp()`.
- Sur Windows, les permissions sont plus faibles qu'Unix — CVE-2019-16784, CVE-2023-49797, CVE-2025-59042 exploitent ce répertoire.
- Un attaquant local avec accès au même utilisateur peut lire tous les `.pyc` extraits en temps réel pendant l'exécution.
- CVE-2025-59042 (CVSS 7.0-7.3) : injection de code via manipulation de `sys.path` au bootstrap.

**Protection PyArmor** : contournable. L'équipe Unit 42 de Palo Alto Networks a réussi à déobfusquer le malware VVS Stealer protégé par PyArmor v9.x en 2025. Les analystes compétents passent PyArmor. Seul Nuitka (transpile Python → C → binaire natif) constitue une vraie barrière.

---

### 2. Tauri/Rust — Plus difficile mais pas impossible

**Difficulté** : Significativement plus élevée que Python, C++ ou Go.
**Raison** : Le système d'ownership/borrowing crée des patterns stack complexes, la monomorphisation génère des milliers de fonctions spécialisées, les itérateurs se désucrent en chaînes incompréhensibles, le pattern matching compile en tables de sauts complexes.

**Mais** : un binaire release Rust sans stripping (configuration par défaut de Cargo) contient tous les symboles.

**Outils de décompilation** :
- **IDA Pro 9.x** + plugin **IDARustler** (2025) : identifie les fonctions par hashes connus, corrige les noms même dans des binaires strippés.
- **Ghidra 11.x** : analyseur natif "Detect Rust libstd functions", fonctionnalités GhidRust intégrées.
- **Binary Ninja** : APIs Rust natives, plugin de détection de chaînes Rust.
- Article arXiv (juillet 2025) : Ghidra ne peut pas reconstruire les enums Rust sans information de type runtime — limitation réelle.

**Extraction des panic strings** :
Les panic strings constituent une fuite d'information majeure même dans un binaire strippé :
- `core::panic::Location` embarque les chemins de fichiers (`src/api/auth.rs:42`) et les messages de `expect()`.
- Un script Binary Ninja (documenté par Cindy Xiao) extrait automatiquement toute cette métadonnée.
- Ces chemins révèlent l'arborescence du projet, les noms de modules, et la logique interne.

**Exemple de ce qu'un attaquant récupère** :
```
src/api/auth.rs:42 — révèle l'existence d'un module d'authentification
src/db/migration.rs:108 — révèle la structure de la base de données
src/ipc/helper_commands.rs:67 — révèle les commandes IPC disponibles
```

**Schéma de mangling Rust** : Rust a basculé vers le schéma v0 (préfixe `_R`) sur nightly en novembre 2025. Les trois désassembleurs supportent le demangling des deux schémas. Le stripping des symboles (`strip = "symbols"` dans Cargo.toml) élimine ces informations — mais de nombreux projets oublient de l'activer.

---

### 3. React — Source maps et bundle analysis

**Source maps** :
- Si le build React inclut les source maps (`.js.map`), le code original TypeScript/JavaScript est entièrement récupérable depuis les DevTools du navigateur ou depuis le fichier `.js.map` directement.
- Commande pour extraire le code source depuis une source map :
  ```bash
  curl https://app.target.com/static/js/main.abc123.js.map -o main.js.map
  # Puis utiliser un outil comme source-map-extractor
  ```

**Webpack bundle analysis** :
- Même sans source maps, l'analyse du bundle webpack révèle la structure de l'application.
- Outil : webpack-bundle-analyzer ou simplement inspecter le contenu du bundle avec des recherches de chaînes.
- Les noms de variables sont souvent courts mais les chaînes (API endpoints, messages d'erreur, noms de routes) restent lisibles.

**Obfuscation bypass** :
- La minification Terser standard ne constitue pas une vraie obfuscation — elle réduit la taille, pas la lisibilité.
- Les outils d'obfuscation JavaScript comme obfuscator.io sont contournables avec des déobfusqueurs automatiques (deobfuscate.io, JS Nice).
- Priorité attaquante : chercher les endpoints API hardcodés, les clés, les tokens, les URLs de configuration.

---

## Partie 2 : Contournement des protections anti-debug

### 4. Contourner la détection ptrace (Linux)

**Technique de détection ptrace** (côté défenseur) :
```rust
// ptrace(PTRACE_TRACEME) échoue si un debugger est déjà attaché
// /proc/self/status champ TracerPid != 0 si tracé
```

**Contournement attaquant** :

**Méthode 1 — LD_PRELOAD hook** :
1. Créer une bibliothèque qui intercepte l'appel `ptrace` :
   ```c
   // fake_ptrace.c
   long ptrace(int request, ...) {
       if (request == PTRACE_TRACEME) return 0; // Simuler succès
       // Appeler le vrai ptrace pour les autres requêtes
       return real_ptrace(request, ...);
   }
   ```
2. Compiler et injecter :
   ```bash
   LD_PRELOAD=./fake_ptrace.so ./target_binary
   ```

**Méthode 2 — Patcher le binaire** :
1. Localiser les appels à `ptrace` dans le binaire avec IDA/Ghidra.
2. NOP l'instruction ou patcher le code pour toujours retourner 0 (succès).
3. Exécuter le binaire patché.

**Méthode 3 — `/proc/self/status` hook** :
1. Hooker l'appel `open()` ou `read()` pour intercepter la lecture de `/proc/self/status`.
2. Retourner une version falsifiée avec `TracerPid: 0`.

**Méthode 4 — gdb patches** :
- GDB lui-même peut être configuré pour patcher à la volée les instructions de détection.
- `catch syscall ptrace` → `return 0` dans le handle GDB.

---

### 5. Contourner IsDebuggerPresent (Windows)

**Technique de détection** (côté défenseur) :
```rust
// IsDebuggerPresent() lit le flag BeingDebugged dans le PEB
// NtQueryInformationProcess avec ProcessDebugPort
```

**Contournement attaquant** :

**Méthode 1 — Patcher le PEB directement** :
```python
# Avec x64dbg ou depuis Python via ctypes
# Lire l'adresse du PEB depuis NtCurrentTeb()->ProcessEnvironmentBlock
# Écrire 0 au byte BeingDebugged (offset 0x2 dans le PEB)
```

**Méthode 2 — ScyllaHide / HideDebugger** :
- Plugin x64dbg qui patche automatiquement IsDebuggerPresent, CheckRemoteDebuggerPresent, NtQueryInformationProcess, GetTickCount, QueryPerformanceCounter, et 20+ autres vérifications.
- Une seule activation dans x64dbg → toutes les vérifications contournées.

**Méthode 3 — Frida** :
```javascript
// Frida script pour hoquer IsDebuggerPresent
Interceptor.attach(Module.findExportByName("kernelbase.dll", "IsDebuggerPresent"), {
    onLeave: function(retval) { retval.replace(0); }
});
```

---

### 6. Contourner sysctl CTL_KERN (macOS)

**Technique de détection** (côté défenseur) :
```rust
// sysctl(CTL_KERN, KERN_PROC, KERN_PROC_PID) → vérification P_TRACED dans p_flag
// ptrace(PT_DENY_ATTACH) → SIGKILL si debugger tente de s'attacher
```

**Contournement pour PT_DENY_ATTACH** :
- `PT_DENY_ATTACH` envoie un SIGKILL si un debugger essaie de s_attacher après l'appel.
- Contournement : patcher le binaire pour NOP ou sauter l'appel `ptrace(PT_DENY_ATTACH)`.
- Avec LLDB, utiliser `process attach --pid <PID> --stop` avant que l'application atteigne l'appel `ptrace`.

**Contournement pour sysctl P_TRACED** :
```c
// Dylib injection avec DYLD_INSERT_LIBRARIES (si Hardened Runtime désactivé)
// Hoquer sysctl pour retourner kp_proc.p_flag sans le bit P_TRACED (0x800)
```

---

## Partie 3 : Injection de bibliothèques

### 7. DLL hijacking — Windows search order

**Principe** : Windows cherche les DLLs dans un ordre spécifique. Si une DLL attendue n'existe pas dans les premiers chemins cherchés, un attaquant peut la placer là.

**Ordre de recherche Windows** (SetDefaultDllDirectories non configuré) :
1. Répertoire de l'application
2. System directory (C:\Windows\System32)
3. Windows directory (C:\Windows)
4. Current working directory
5. Répertoires dans %PATH%

**DLLs de Tauri souvent ciblées** :
- `WebView2Loader.dll` — chargée par le runtime Tauri, souvent absente du System32
- `msvcp140.dll`, `vcruntime140.dll` — Redistributables Visual C++

**Étapes** :
1. Utiliser Process Monitor (ProcMon) ou API Monitor pour identifier les DLLs en `NAME NOT FOUND`.
2. Créer une DLL malveillante avec le même nom, exécutant le payload + forwardant les fonctions légitimes.
3. Placer la DLL dans un répertoire inscriptible précédant le chemin légitime.

**Outil automatisé** : DLLSpy, rattrap (énumèrent automatiquement les hijacking opportunities).

---

### 8. DYLD_INSERT_LIBRARIES (macOS)

**Prérequis** : L'application ne doit PAS avoir le Hardened Runtime activé. Si l'entitlement `com.apple.security.cs.allow-dyld-environment-variables` est activé, l'injection est possible même avec Hardened Runtime.

**Vérification** :
```bash
codesign -dv --verbose=4 /Applications/target.app/Contents/MacOS/target 2>&1 | grep allow-dyld
```

**Étapes d'injection** :
1. Créer une dylib qui s'exécute au chargement :
   ```c
   __attribute__((constructor)) void inject() {
       // Payload exécuté avant le main de l'application
   }
   ```
2. Compiler :
   ```bash
   clang -dynamiclib -o inject.dylib inject.c
   ```
3. Lancer avec injection :
   ```bash
   DYLD_INSERT_LIBRARIES=./inject.dylib /Applications/target.app/Contents/MacOS/target
   ```

**Note** : Les applications notarisées avec Hardened Runtime bloquent automatiquement `DYLD_INSERT_LIBRARIES` — sauf si `allow-dyld-environment-variables` est explicitement activé dans les entitlements.

---

### 9. LD_PRELOAD injection (Linux)

**Prérequis** : Aucune protection native Linux n'empêche LD_PRELOAD pour les binaires non-SUID.

**Étapes** :
1. Identifier la fonction à hoquer (ex: `read()`, `open()`, `connect()`).
2. Créer une bibliothèque de remplacement :
   ```c
   #define _GNU_SOURCE
   #include <dlfcn.h>

   ssize_t read(int fd, void *buf, size_t count) {
       // Payload
       // Puis appeler le vrai read
       typeof(read) *real_read = dlsym(RTLD_NEXT, "read");
       return real_read(fd, buf, count);
   }
   ```
3. Injecter :
   ```bash
   LD_PRELOAD=./hook.so ./target_binary
   ```

**Cibles intéressantes pour LD_PRELOAD sur une app Tauri** :
- Hooker `open()` pour intercepter l'ouverture de la base SQLite avant déchiffrement.
- Hooker `read()` sur des sockets pour intercepter les communications.
- Hooker les fonctions de dérivation de clé pour capturer les secrets en mémoire.

**Persistance via /etc/ld.so.preload** : Si root est obtenu, écrire dans `/etc/ld.so.preload` applique LD_PRELOAD à TOUS les processus du système, y compris ceux lancés ultérieurement.

---

## Partie 4 : Contournement de la déception

### 10. Identification et évitement des canary files

**Problème pour l'attaquant** : Les fichiers canary (`.env.production`, `credentials.json`, `wallet.dat`, etc.) sont conçus pour déclencher des alertes s'ils sont lus.

**Technique de détection des canary files** :

**Méthode 1 — Corrélation temporelle** :
1. Observer les alertes déclenchées (si l'attaquant a accès aux logs ou aux alertes Telegram).
2. Les alertes canary ont un pattern : elles surviennent immédiatement après l'accès à un fichier.
3. Tester des fichiers par petits groupes avec des pauses — identifier lequel déclenche une alerte.

**Méthode 2 — Analyse du code source** (si l'app est open source) :
1. Le code révèle les noms et emplacements des canary files dans le code Rust.
2. Chercher dans le code source : `canary`, `decoy`, `honeypot`, ou les noms de fichiers pièges.
3. Grep dans les sources :
   ```bash
   grep -r "\.env\.production\|credentials\.json\|wallet\.dat\|private_key\.pem" --include="*.rs" .
   ```

**Méthode 3 — Différenciation par contenu** :
1. Les canary files ont du contenu structurellement valide mais non fonctionnel.
2. Tenter d'utiliser les credentials trouvés — si la connexion échoue pour TOUS les credentials d'un fichier, suspect.
3. Les vrais credentials d'une app Tauri ne sont jamais stockés en clair dans des fichiers plats.

**Méthode 4 — Analyse des timestamps** :
1. Comparer les dates de création et de modification des fichiers "sensibles" avec les autres fichiers de l'application.
2. Les canary files sont souvent créés au même moment (lors de l'installation), avec des timestamps artificiellement semblables.
3. Des fichiers de credentials légitimes auraient des timestamps plus variés et liés à des événements réels (création de compte, rotation de clé).

**Méthode 5 — Listing indirect sans lecture** :
1. Sur Linux, `stat` et `ls` ne déclenchent pas d'alerte `IN_OPEN` ou `IN_ACCESS` d'inotify.
2. Lister les fichiers sans les ouvrir pour identifier les candidats canary.
3. Utiliser `find` avec `-ls` (stat sans open) pour cartographier sans déclencher.

**Note critique** : Si l'app est open source, la liste exacte des canary files est dans le code. Le seul moyen de maintenir l'efficacité de la déception est de randomiser les noms et emplacements au déploiement — ce que la plupart des implémentations ne font pas.

---

### 11. Contournement du monitoring et effacement des traces

**Monitoring à contourner** :
- Audit log hash-chained (SHA-256, JSON structuré)
- Alertes Telegram (file d'attente SQLite + worker Tokio)
- Surveillance `notify` des fichiers critiques

**Technique — Interception avant envoi Telegram** :

**Méthode 1 — LD_PRELOAD sur connect/send** :
1. Hooker `connect()` ou `send()` pour bloquer les connexions vers `api.telegram.org`.
2. Les alertes s'accumulent dans la file d'attente SQLite mais ne partent jamais.

**Méthode 2 — Manipulation des règles réseau** :
```bash
# Sur Linux, bloquer api.telegram.org si root obtenu
iptables -A OUTPUT -d 149.154.160.0/20 -j DROP
iptables -A OUTPUT -d 91.108.4.0/22 -j DROP
# ou via /etc/hosts
echo "149.154.167.99 api.telegram.org" >> /etc/hosts
```

**Méthode 3 — Manipulation de la file SQLite** :
1. Localiser la base SQLite de l'application.
2. Si non chiffré (ou clé accessible) : modifier le statut des alertes en `dead` avant qu'elles soient traitées.
3. Si chiffré via SQLCipher : nécessite la clé — récupérable via LD_PRELOAD hookant les fonctions d'ouverture SQLite.

---

### 12. Contournement de la chaîne de hash des logs

**Technique de défense** : Chaque entrée de log contient le SHA-256 de l'entrée précédente. Toute modification brise la chaîne.

**Attaque — Reconstruction de la chaîne après modification** :
1. L'attaquant supprime les entrées de log révélant ses activités.
2. Recalculer le hash de chaque entrée restante pour recréer une chaîne cohérente.
3. Si les ancres HMAC-SHA256 dans le keychain OS ne sont pas vérifiées au moment de l'audit → la falsification passe.

**Condition de succès** : L'attaquant doit avoir accès à l'algorithme de hashing (connu si open source) et la chaîne doit être vérifiée manuellement et non automatiquement.

**Limitation pour l'attaquant** : Si des ancres HMAC périodiques sont stockées dans le keychain OS, la reconstruction de la chaîne ne peut pas correspondre aux ancres — la falsification est détectable.

---

## Partie 5 : Contournement du code signing

### 13. Code signing bypass — Techniques

**Self-signed certificates** :
1. Créer un certificat auto-signé avec le même Common Name que l'éditeur légitime.
2. Les systèmes qui ne valident pas la CA (juste la présence d'une signature) sont trompés.
3. Sur Windows, SmartScreen vérifie la réputation de la CA — les certificats auto-signés n'ont aucune réputation.

**Certificats volés** :
- Les certificats EV de signature de code sont des cibles de haute valeur sur le dark web.
- Des campagnes de phishing ciblées visent les développeurs pour voler leurs certificats.
- Une fois le certificat volé, les binaires signés avec lui passent SmartScreen.

**Manipulation de l'auto-updater Tauri** :
1. Si l'auto-updater Tauri vérifie les signatures mais que la clé publique est hardcodée dans le binaire :
2. Extraire la clé publique du binaire (IDA/Ghidra).
3. Générer une nouvelle paire de clés.
4. Patcher le binaire pour remplacer la clé publique par la nouvelle.
5. Signer un update malveillant avec la nouvelle clé privée.
6. L'updater patché accepte la mise à jour malveillante.

**Note** : Si la vérification du hash SHA-256 du sidecar est faite par le binaire Tauri, et que le binaire lui-même est patché, la vérification est neutralisée.

---

## Partie 6 : Anti-forensique

### 14. Rotation des artefacts et minimisation des traces

**Objectif** : Laisser le moins de traces possibles pour compliquer l'investigation forensique.

**Timestamps** :
```bash
# Modifier les timestamps d'un fichier (timestomping)
touch -t 202301010000.00 /path/to/file
# Copier les timestamps d'un fichier légitime
touch -r /usr/bin/ls /path/to/malicious/file
```

**Effacer les traces des logs système** :
```bash
# Linux — journald
journalctl --rotate && journalctl --vacuum-time=1s
# Effacement sélectif : plus difficile avec journald (binaire)
# Édition des logs texte classiques
sed -i '/attacker_activity/d' /var/log/auth.log
```

**Inhiber l'écriture des logs SQLite** :
1. Si l'app est en cours d'exécution, hooker les appels SQLite d'écriture vers la table d'audit.
2. LD_PRELOAD vers `sqlite3_exec` ou `sqlite3_step` pour filtrer les requêtes d'INSERT dans la table d'audit.

**Contournement du WAL SQLite en forensique** :
- Les analystes forensiques savent que l'ouverture d'une base SQLite déclenche un checkpoint WAL qui détruit le WAL.
- En tant qu'attaquant : déclencher délibérément ce checkpoint pour effacer les transactions non-checkpointées qui révéleraient des modifications.
- `PRAGMA wal_checkpoint(TRUNCATE)` depuis une connexion SQLite locale.

---

## Table CVE et incidents

| CVE/Incident | Type | CVSS | Composant | Description courte |
|---|---|---|---|---|
| CVE-2025-59042 | RCE bootstrap | 7.0–7.3 | PyInstaller < 6.10.0 | Injection code via sys.path au bootstrap |
| CVE-2023-49797 | LPE tmpdir | Moyen | PyInstaller Windows | Race condition _MEIPASS Windows |
| CVE-2019-16784 | LPE tmpdir | Moyen | PyInstaller Windows | Race condition répertoire temporaire |
| CVE-2025-43530 | TCC bypass | Critique | macOS ScreenReader | SecStaticCodeCreateWithPath vs audit tokens |
| CVE-2025-31250 | TCC spoof | Critique | macOS Ventura/Sonoma | XPC forgé → dialogue TCC trompeur |
| CVE-2025-31191 | Sandbox escape | Élevé | macOS | Security-scoped bookmarks exploitation |
| RUSTSEC-2025-0151 | Typosquatting | N/A | sha-rst (Rust) | Package malveillant imitant sha2 |

---

## Patterns Grep — Détecter les protections contournables

```bash
# Détecter Hardened Runtime désactivé sur macOS (DYLD injection possible)
codesign -dv --verbose=4 ./target.app 2>&1 | grep -i "hardened\|allow-dyld"

# Trouver les panic strings révélant l'arborescence (binaire Rust)
strings ./target_binary | grep -E "src/.*\.rs:[0-9]+"

# Détecter source maps exposées (React)
curl -s https://target.com/static/js/main.*.js | grep "//# sourceMappingURL"

# Vérifier si PyInstaller est utilisé (magic bytes)
xxd target_binary | grep -i "meiboot\|pyi-archive\|pyinstaller"

# Tester la détection de debugger contournable (présence de secmem-proc)
strings ./target_binary | grep -E "secmem|ptrace|TracerPid|IsDebuggerPresent"

# Identifier les DLLs potentiellement hijackables (Windows)
# (depuis ProcMon ou équivalent)
# Filtrer : Operation=NAME NOT FOUND, Path se termine par .dll

# Détecter l'absence de vérification d'intégrité du sidecar
grep -r "tauri_plugin_shell\|sidecar\|spawn" --include="*.rs" . | grep -v "verify_sidecar\|check_hash\|integrity"

# Trouver les canary files dans le code source (si open source)
grep -r "canary\|honeypot\|decoy\|\.env\.production\|credentials\.json\|wallet\.dat" --include="*.rs" .

# Détecter LD_PRELOAD non nettoyé au démarrage
grep -r "remove_var\|LD_PRELOAD\|DYLD_INSERT" --include="*.rs" . | grep -v "remove_var"

# Identifier les logs non chiffrés (fichier de logs en clair)
find ~/.local/share ~/.config /tmp -name "*.log" -name "*security*" 2>/dev/null
find "$APPDATA" -name "security_logs" -type d 2>/dev/null
```
