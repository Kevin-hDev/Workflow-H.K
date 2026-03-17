# Hardening Framework Flutter -- Base de connaissances defensive
# Skill : defensive-hardening | Fichier knowledge
# Source : CYBERSEC_MOBILE.md section 9, CYBERSEC_DESKTOP.md section 9

---

## TABLE DES MATIERES

1. [Anti-screenshot FLAG_SECURE](#1--anti-screenshot)
2. [Clipboard protection](#2--clipboard-protection)
3. [Anti-tapjacking](#3--anti-tapjacking)
4. [Navigation securisee](#4--navigation-securisee)
5. [Biometrie renforcee](#5--biometrie-renforcee)
6. [Confirmation progressive](#6--confirmation-progressive)
7. [Anti-DLL Hijacking Windows](#7--anti-dll-hijacking)
8. [Anti-LD_PRELOAD Linux](#8--anti-ld_preload)
9. [IPC securise desktop](#9--ipc-securise)
10. [Attestation mutuelle mobile-desktop](#10--attestation-mutuelle)
11. [Screenshot protection desktop](#11--screenshot-protection-desktop)
12. [freeRASP v14-v17 nouvelles detections](#12--freerasp-v14-v17-nouvelles-detections)
13. [Dart Confidential obfuscation des litteraux](#13--dart-confidential-obfuscation-des-litteraux)
14. [Flutter 3.38 widget SensitiveContent](#14--flutter-338-widget-sensitivecontent)
15. [Approov 3.5 attestation cloud per-request](#15--approov-35-attestation-cloud-per-request)
16. [Play Integrity bascule hardware-backed](#16--play-integrity-bascule-hardware-backed)
17. [Apple MIE (Memory Integrity Enforcement)](#17--apple-mie-memory-integrity-enforcement)
18. [Detection WebSocket anti-Frida](#18--detection-websocket-anti-frida-aimardcr)
19. [AndroidNativeGuard detection SVC inline](#19--androidnativeguard-detection-via-svc-inline)

---

## 1 -- Anti-screenshot

### Complexite : Simple | Plateforme : Mobile

Android : `FLAG_SECURE` dans Activity empeche captures d'ecran et enregistrement.
iOS : UITextField trick pour bloquer la capture.

### Implementation

Android (Kotlin dans MainActivity) :
```kotlin
window.setFlags(
  WindowManager.LayoutParams.FLAG_SECURE,
  WindowManager.LayoutParams.FLAG_SECURE
)
```

Flutter (via Platform Channel) :
```dart
const channel = MethodChannel('com.app.security/screen');
await channel.invokeMethod('enableScreenProtection');
```

**Source** : CYBERSEC_MOBILE.md section 9.1

---

## 2 -- Clipboard protection

### Complexite : Simple

Le clipboard est accessible a toutes les apps. Clipboard securise custom qui s'efface apres 30 secondes. Android 13+ a un auto-nettoyage natif.

### Implementation

```dart
static Future<void> copyWithTimeout(String text, {int seconds = 30}) async {
  await Clipboard.setData(ClipboardData(text: text));
  Timer(Duration(seconds: seconds), () {
    Clipboard.setData(const ClipboardData(text: ''));
  });
}
```

**Source** : CYBERSEC_MOBILE.md section 9.2, CYBERSEC_DESKTOP.md section 9.5

---

## 3 -- Anti-tapjacking

### Complexite : Simple | Plateforme : Android

`filterTouchesWhenObscured` detecte les overlays et bloque les touches quand l'app est couverte.

### Implementation native

```kotlin
// Android : dans la vue
view.filterTouchesWhenObscured = true
```

**Source** : CYBERSEC_MOBILE.md section 9.3

---

## 4 -- Navigation securisee

### Complexite : Moderee

Route guards qui activent automatiquement `FLAG_SECURE` sur les pages sensibles (config SSH, affichage cles).

**Source** : CYBERSEC_MOBILE.md section 9.4

---

## 5 -- Biometrie renforcee

### Criticite : Haute

- Biometrie AVANT chaque connexion SSH (pas juste login)
- Re-auth apres inactivite
- Re-auth pour commandes dangereuses (sudo, rm, chmod 777, shutdown)
- Android : biometrie deverrouille CryptoObject (exigence crypto, pas juste UI)
- Rate limiting : 5 tentatives -> 5min, 8 -> 15min, 10 -> wipe cles SSH

**Source** : CYBERSEC_MOBILE.md section 9.5

---

## 6 -- Confirmation progressive

### Complexite : Moderee

Pas juste "Etes-vous sur?" mais confirmation en 3 etapes avec delai pour les commandes destructrices.

**Source** : CYBERSEC_MOBILE.md section 9.6

---

## 7 -- Anti-DLL Hijacking

### Plateforme : Windows Desktop

`SetDefaultDllDirectories`, `LOAD_LIBRARY_SEARCH_SYSTEM32`. Chemins absolus pour FFI. Signature numerique des DLLs chargees.

**Source** : CYBERSEC_DESKTOP.md section 9.1

---

## 8 -- Anti-LD_PRELOAD

### Plateforme : Linux Desktop

Verifier les variables d'environnement au demarrage. Refuser si `LD_PRELOAD` est defini. Profils AppArmor/SELinux.

**Source** : CYBERSEC_DESKTOP.md section 9.2

---

## 9 -- IPC securise

### Plateforme : Desktop

Authentifier toutes les communications IPC. Chiffrement des canaux. Ne pas exposer de named pipes/sockets sans protection.

**Source** : CYBERSEC_DESKTOP.md section 9.3

---

## 10 -- Attestation mutuelle

### Complexite : Avancee

Au demarrage, l'app mobile et desktop verifient mutuellement leur integrite (signature binaire, version, etat RASP).

**Source** : CYBERSEC_DESKTOP.md section 9.6

---

## 11 -- Screenshot protection desktop

Les malwares desktop capturent facilement l'ecran. Protections limitees. Windows DRM, macOS CGWindowLevel. Alerter si outil de capture detecte.

**Source** : CYBERSEC_DESKTOP.md section 9.4

---

## 12 -- freeRASP v14-v17 nouvelles detections

### Criticite : Haute

Evolutions majeures du RASP gratuit pour Flutter :

| Version | Nouvelles detections |
|---------|---------------------|
| **v14** | Protection capture d'ecran via `FLAG_SECURE` |
| **v15** | Detection KernelSU (au-dela de Magisk/su classiques), detection HMA/Hide My Applist, detection automatisation Appium, detection multi-instance (Parallel Space, Dual Space) |
| **v16** | Detection environnements de clonage |
| **v17** | **`killOnBypass`** — termine l'app si les callbacks de menace sont hookes ou supprimes. Detection time/location spoofing. `RaspExecutionState` avec callback `onAllChecksFinished()` pour la synchronisation |

### iOS v6.14.x

Detection des jailbreaks modernes **palera1n** et **Dopamine**. Talsec Portal pour monitoring en temps reel.

### Impact killOnBypass

Reponse directe au bypass de luca-regne (hook `Intent.getStringExtra()` + vidage TALSEC_INFO). En fevrier 2026, la balance penche legerement cote defensif pour les apps utilisant freeRASP v17+ avec `killOnBypass` active.

### Action

Mettre a jour vers freeRASP v17+. Activer `killOnBypass` obligatoirement. Utiliser `onAllChecksFinished()` pour synchroniser le demarrage de l'app.

**Source** : COMPLEMENT_MOBILE_2026.md section 2.1

---

## 13 -- Dart Confidential obfuscation des litteraux

### Criticite : Haute

Package Dart Confidential v1.2.1 (~octobre 2025), port du projet Swift Confidential.

### Pourquoi c'est critique

Le flag `--obfuscate` de Dart ne fait QUE du renommage de symboles. Les chaines de caracteres, URLs, cles API restent en clair dans le binaire. Dart Confidential comble ce manque.

### Fonctionnalites

Obfuscation composable des litteraux (chaines, URLs, cles API) avec :
- **AES-256-GCM**
- **ChaCha20-Poly1305**
- **XOR**
- **Compression polymorphique**
- Support **iOS Keychain**
- Support **Android Keystore**

### Fonctionnement

Les litteraux sont chiffres au repos dans le binaire et dechiffres juste avant usage en memoire. Sur desktop, c'est ENCORE PLUS CRITIQUE car le binaire est directement accessible sur le filesystem sans protections App Attest/Play Integrity.

### Action

Integrer Dart Confidential pour tous les secrets dans le code : URLs de serveurs, cles API, tokens, chaines sensibles.

**Source** : COMPLEMENT_MOBILE_2026.md section 2.2, COMPLEMENT_DESKTOP_2026.md section 3.1

---

## 14 -- Flutter 3.38 widget SensitiveContent

### Criticite : Haute (mobile) | Faible (desktop)

Nouveau widget `SensitiveContent` dans Flutter 3.38 qui declare des zones UI comme sensibles. Android obscurcit automatiquement l'ecran lors de l'enregistrement ou du partage d'ecran.

### Avantage

Plus propre et plus fiable que `FLAG_SECURE` sur tout l'ecran — s'applique uniquement aux zones concernees. Protege les cles SSH, tokens Tailscale, et mots de passe affiches dans l'interface.

### Limitation desktop

L'impact est LIMITE sur desktop car :
- Windows n'a pas de mecanisme equivalent d'obscurcissement automatique
- macOS a des protections limitees (CGWindowLevel)
- Linux n'a aucune protection native

### Action

Utiliser `SensitiveContent` pour envelopper tous les champs de secrets dans l'UI mobile. Continuer a utiliser les techniques manuelles sur desktop.

**Source** : COMPLEMENT_MOBILE_2_2026.md section 4.4, COMPLEMENT_DESKTOP_2_2026.md section 6.1

---

## 15 -- Approov 3.5 attestation cloud per-request

### Criticite : Haute

Approov 3.5 (octobre 2025) — attestation cloud per-request hors device.

### Innovations

1. **Detection de dump memoire** : Bloque les tentatives de scraping de donnees sensibles
2. **Securite hardware-backed sur Android** : Cles cryptographiques dans le hardware securise
3. **Attestation per-request dynamique** : Chaque requete est attestee individuellement

### Difference fondamentale

La decision de securite est prise HORS du dispositif (cloud-based), immunisant contre le tampering local. Meme si l'attaquant controle totalement le telephone, il ne peut pas forger l'attestation.

### Classification

TAG Top 5 des vendors en Mobile App Security 2025-2026.

**Source** : COMPLEMENT_MOBILE_2026.md section 2.5

---

## 16 -- Play Integrity bascule hardware-backed

### Criticite : Haute | Plateforme : Android

Changement mai 2025 : Tous les developpeurs bascules automatiquement vers les verdicts renforces utilisant Android Platform Key Attestation hardware-backed.

### Changements

- **`MEETS_STRONG_INTEGRITY`** : Requiert mise a jour de securite dans les 12 derniers mois pour Android 13+
- **Bootloaders deverrouilles** : Ne passent PLUS `MEETS_DEVICE_INTEGRITY`
- **SafetyNet** : Completement desactive le 20 mai 2025
- **Version 1.5.0** (aout 2025) : Remediation dialogs in-app, signaux `deviceRecall` (beta) pour identifier un device deja signale meme apres reinstallation

### Limitation

Atteste le device et l'app mais NE PROTEGE PAS le contexte de la requete API. Gap exploitable. De plus, la combinaison SukiSU-Ultra + SUSFS + TrickyStore PASSE les 3 niveaux tant que le keybox n'est pas revoque par Google (~1-2 fois par mois).

**Source** : COMPLEMENT_MOBILE_2026.md section 2.6

---

## 17 -- Apple MIE (Memory Integrity Enforcement)

### Criticite : Moyenne (impact futur) | Plateforme : iOS

Annonce septembre 2025, puces A19/A19 Pro (iPhone 17).

### 3 technologies combinees

1. **Allocateurs memoire types** : `kalloc_type` et `xzone malloc` — chaque bloc memoire a un type defini
2. **Enhanced Memory Tagging Extension (EMTE)** en mode synchrone — chaque bloc porte un tag secret verifie par le hardware a CHAQUE acces
3. **Tag Confidentiality Enforcement** — protection contre les attaques side-channel sur les tags

### Comportement

Un tag incorrect provoque la **terminaison immediate du processus** — aucune fenetre d'exploitation. Bloque : buffer overflows, use-after-free, acces memoire non autorises.

### Caracteristiques

Toujours actif, integre au silicium, NON desactivable. Corellium affirme que « l'ere d'attente des jailbreaks pourrait etre revolue » sur les appareils MIE.

### Impact

Le code natif des plugins Flutter beneficiera de la protection sur les appareils compatibles. Activable via Xcode (fonctionnalite « Enhanced Security »).

**Source** : COMPLEMENT_MOBILE_2_2026.md section 2.2

---

## 18 -- Detection WebSocket anti-Frida (aimardcr)

### Complexite : Moderee

Technique exploitant le protocole interne de Frida pour le detecter.

### Fonctionnement

1. Scan des ports 1-65535
2. Envoi d'un handshake WebSocket sur chaque port ouvert
3. Detection du fingerprint `tyZql/Y8dNFFyopTrHadWzvbvRs=` dans la reponse

### Avantage

Fonctionne MEME avec strongR-Frida car la reponse WebSocket est inherente au protocole Frida, pas aux chaines de caracteres randomisees.

### Applicabilite desktop

Directement applicable sur desktop. L'app a plus de ressources pour scanner les ports sans impact sur les performances. Scanner periodiquement les ports locaux.

### Limite

Contournable par modification du protocole WebSocket cote Frida, mais necessite un effort supplementaire de l'attaquant.

**Source** : COMPLEMENT_MOBILE_2026.md section 2.3, COMPLEMENT_DESKTOP_2026.md section 3.3

---

## 19 -- AndroidNativeGuard detection via SVC inline

### Complexite : Avancee | Plateforme : Android

Appels systeme directs via instructions `SVC` inline en assembleur. Empeche le hooking des fonctions de detection via libc puisque les appels ne passent PAS par libc.

### Avantage

Rend le hooking classique via Frida inefficace pour les fonctions protegees, car Frida intercepte les appels libc, pas les syscalls directs.

### Limite

Contournable par `frida-syscall-interceptor` (AeonLucid) qui intercepte les syscalls directs, mais ajoute une couche de protection significative et force l'attaquant a utiliser des outils specialises.

**Source** : COMPLEMENT_MOBILE_2026.md section 2.4

---

## Sources

- CYBERSEC_MOBILE.md sections 9.1-9.6
- CYBERSEC_DESKTOP.md sections 9.1-9.7
- COMPLEMENT_MOBILE_2026.md sections 2.1-2.6
- COMPLEMENT_DESKTOP_2026.md sections 3.1-3.3
- COMPLEMENT_MOBILE_2_2026.md sections 2.2, 4.4
- COMPLEMENT_DESKTOP_2_2026.md section 6.1
