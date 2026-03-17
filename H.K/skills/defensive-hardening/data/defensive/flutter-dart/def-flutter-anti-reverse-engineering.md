# Anti-Reverse Engineering -- Base de connaissances defensive
# Skill : defensive-hardening | Fichier knowledge
# Source : CYBERSEC_MOBILE.md section 12, CYBERSEC_DESKTOP.md section 13

---

## 1 -- Obfuscation Dart avancee

### Complexite : Moderee

Au-dela de `--obfuscate --split-debug-info` :
- Dead code injection
- Fonctions indirectes
- Chaines splittees et chiffrees au repos
- Dechiffrement juste avant usage

### Build command

```bash
flutter build apk --obfuscate --split-debug-info=build/symbols
flutter build appbundle --obfuscate --split-debug-info=build/symbols
```

### Limitation desktop

Moins efficace sur desktop que mobile (pas de Play Integrity/App Attest).

**Source** : CYBERSEC_MOBILE.md section 12.1, CYBERSEC_DESKTOP.md section 13.1

---

## 2 -- freeRASP / Talsec

### Criticite : Haute

SDK gratuit Talsec. Detection :
- Hooks Frida
- Root/Magisk/KernelSU
- Debugger attache
- Tampering du binaire

Callbacks pour wiper les cles si detection.

### Detection avancee

- Scanner `/proc/self/maps` pour `frida-agent.so`
- Verifier les prologues des fonctions systeme pour detecter des JMP typiques des hooks
- Ports Frida typiques : 27042, 27043

**Source** : CYBERSEC_MOBILE.md section 12.2

---

## 3 -- Integrite du runtime

### Complexite : Avancee

- Verification signature APK au demarrage
- Hash SHA-256 de `libapp.so`/`libflutter.so` valide par serveur
- Play Integrity API (Android)
- App Attest (iOS)
- Windows : code signing avec SignTool
- macOS : codesign
- Linux : verification GPG

**Source** : CYBERSEC_MOBILE.md section 12.3, CYBERSEC_DESKTOP.md section 13.2

---

## 4 -- Canary values et tripwires

### Complexite : Moderee

Valeurs sentinelles en memoire, fichiers config, keystore, registre Windows. Si elles changent, l'app a ete modifiee.

Difference avec honey tokens : les canaries DETECTENT, les honey tokens ATTIRENT.

**Source** : CYBERSEC_MOBILE.md section 12.4, CYBERSEC_DESKTOP.md section 13.4

---

## 5 -- Anti-debugging desktop

### Plateforme : Desktop

- Windows : `IsDebuggerPresent`, `CheckRemoteDebuggerPresent`
- Linux : `ptrace` detection via `/proc/self/status` (TracerPid)
- macOS : `sysctl` avec `CTL_KERN, KERN_PROC, KERN_PROC_PID`

**Source** : CYBERSEC_DESKTOP.md section 13.3

---

## 6 -- Dart Confidential v1.2.1 : obfuscation composable

### Probleme

Le flag `--obfuscate` de Flutter ne fait que **renommer les symboles**. Les chaines de caracteres, URLs, cles API et secrets restent **en clair** dans le binaire. Un simple `strings libapp.so` les revele.

### Solution

Dart Confidential v1.2.1 offre une obfuscation composable des litteraux :
- **AES-256-GCM** : chiffrement fort des chaines sensibles
- **ChaCha20-Poly1305** : alternative performante
- **XOR** : couche legere combinable
- **Compression polymorphique** : chaque build produit un pattern different

Les couches sont combinables : XOR + AES-256-GCM + compression = analyse statique extremement difficile.

**Source** : COMPLEMENT_MOBILE_3_2026.md

---

## 7 -- Detection WebSocket anti-Frida

### Technique

Scan des ports 1-65535 avec detection du handshake WebSocket a la fingerprint :

```
tyZql/Y8dNFFyopTrHadWzvbvRs=
```

### Caracteristiques

- Fonctionne **MEME avec strongR-Frida** (variante furtive de Frida)
- Applicable **desktop et mobile** (pas seulement Android)
- Scanner en arriere-plan avec intervalle aleatoire pour eviter la detection du scanner lui-meme

**Source** : COMPLEMENT_MOBILE_3_2026.md

---

## 8 -- AndroidNativeGuard (SVC inline)

### Technique

Appels systeme directs en assembleur ARM (`SVC #0`), contournant completement `libc`. Les hooks Frida sur `libc` (open, read, write, ptrace) ne fonctionnent pas car les appels ne passent jamais par les fonctions hookees.

### Limitation

Contournable par `frida-syscall-interceptor` qui hooke au niveau des syscalls. A combiner avec d'autres couches de detection.

**Source** : COMPLEMENT_MOBILE_3_2026.md

---

## 9 -- freeRASP v17 killOnBypass

### Mecanisme

Si les callbacks de detection sont hookes ou supprimes par un attaquant, l'app se **termine immediatement**. C'est la reponse au bypass `TALSEC_INFO` qui neutralisait les versions precedentes.

### Etat de l'art (fevrier 2026)

La balance penche cote **defensif** pour les apps utilisant freeRASP v17+ avec `killOnBypass` active. Les contournements publics ne fonctionnent plus sur cette version.

**Source** : COMPLEMENT_MOBILE_3_2026.md

---

## 10 -- Signature de code multi-OS

### Premiere ligne de defense

La signature de code est la premiere defense contre le DLL sideloading et le remplacement de binaire.

| OS | Outil | Details |
|----|-------|---------|
| Windows | Authenticode (`signtool`) | Signer .exe et .dll, certificat EV recommande |
| macOS | Developer ID + notarisation | Hardened Runtime obligatoire, `codesign` + `xcrun notarytool` |
| Linux | GPG | Signer paquets et binaires, verifier a l'installation |

**Source** : COMPLEMENT_DESKTOP_3_2026.md

---

## 11 -- Integrite DLL Windows

### Technique

```c
// Forcer le chargement UNIQUEMENT depuis System32
SetDefaultDllDirectories(LOAD_LIBRARY_SEARCH_SYSTEM32);
```

- Verification de la signature de **chaque DLL** au chargement
- Empeche le DLL sideloading depuis le repertoire de l'application
- Combiner avec WDAC (Windows Defender Application Control) pour une protection complete

**Source** : COMPLEMENT_DESKTOP_3_2026.md

---

## 12 -- Verification LD_PRELOAD / DYLD_INSERT_LIBRARIES au demarrage

### Technique

Au demarrage de l'application desktop, verifier la presence de variables d'environnement d'injection :

- **Linux** : `LD_PRELOAD` -- si defini et non vide, l'application est potentiellement hookee
- **macOS** : `DYLD_INSERT_LIBRARIES` -- meme principe

### Action

Si detecte :
1. Logger l'evenement (alerte securite)
2. Refuser de demarrer ou effacer les cles en memoire
3. Signaler a l'utilisateur

**Source** : COMPLEMENT_DESKTOP_3_2026.md

---

## Sources

- CYBERSEC_MOBILE.md sections 12.1-12.4
- CYBERSEC_DESKTOP.md sections 13.1-13.4
- COMPLEMENT_MOBILE_3_2026.md
- COMPLEMENT_DESKTOP_3_2026.md
