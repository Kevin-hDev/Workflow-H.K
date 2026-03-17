# Hardening Stockage et Crypto -- Base de connaissances defensive
# Skill : defensive-hardening | Fichier knowledge
# Source : CYBERSEC_MOBILE.md section 10, CYBERSEC_DESKTOP.md section 10

---

## 1 -- Hardware-Backed Key Storage

### Criticite : CRITIQUE

Android : StrongBox Keymaster, AES_GCM_NoPadding. Les operations de signature sont deleguees au hardware. La cle n'est JAMAIS lisible par le CPU.

iOS : Secure Enclave + AccessControlFlag.userPresence.

### Configuration flutter_secure_storage

```dart
FlutterSecureStorage(
  aOptions: AndroidOptions(
    encryptedSharedPreferences: true,
    keyCipherAlgorithm: KeyCipherAlgorithm.RSA_ECB_PKCS1Padding,
    storageCipherAlgorithm: StorageCipherAlgorithm.AES_GCM_NoPadding,
  ),
  iOptions: IOSOptions(
    accessibility: KeychainAccessibility.first_unlock_this_device,
  ),
)
```

### Desktop (alternatives)

- Windows : Credential Manager via Platform Channels
- Linux : libsecret (GNOME Keyring)
- macOS : Keychain

**Source** : CYBERSEC_MOBILE.md section 10.1, CYBERSEC_DESKTOP.md section 10.1

---

## 2 -- Rotation automatique des cles SSH

### Complexite : Avancee

Rotation tous les 30 jours sans intervention utilisateur. Synchronisation securisee mobile <-> desktop.

Etapes :
1. Generer nouvelle cle (Ed25519 recommande)
2. Deployer la cle publique via la connexion SSH existante
3. Tester la nouvelle cle
4. Revoquer l'ancienne cle
5. Mettre a jour le stockage securise

**Source** : CYBERSEC_MOBILE.md section 10.2, CYBERSEC_DESKTOP.md section 10.3

---

## 3 -- Post-quantum cryptography

### Criticite : Moyenne (preparation)

Algorithmes post-quantiques disponibles en 2026 :
- `sntrup761x25519-sha512` (OpenSSH 9.x)
- `mlkem768nistp256-sha256`
- libssh 0.12.0 implemente les echanges hybrides

dartssh2 ne supporte probablement pas encore les algorithmes post-quantiques.

**Action** : Surveiller l'evolution. Planifier la migration.

**Source** : CYBERSEC_MOBILE.md section 10.3, CYBERSEC_DESKTOP.md section 10.2

---

## 4 -- flutter_secure_storage v10.0.0 correction crypto critique

### Criticite : CRITIQUE

Les versions <=9.x utilisaient `AES/CBC/PKCS7Padding` comme cipher de stockage — un mode **vulnerable aux attaques Padding Oracle** (CWE-649). Un attaquant avec acces au dispositif pouvait theoriquement restaurer le texte clair bloc par bloc en analysant les erreurs de dechiffrement.

### Tableau comparatif v9 vs v10

| Aspect | v9.x | v10.0.0 |
|---|---|---|
| Bibliotheque crypto | Jetpack Security / Tink | Implementation personnalisee |
| Cipher de stockage | AES/CBC/PKCS7Padding (VULNERABLE) | **AES/GCM/NoPadding** |
| Cipher de cle | RSA/ECB/PKCS1Padding | **RSA/ECB/OAEP+SHA-256** |
| EncryptedSharedPreferences | Obligatoire | **Deprecie** |
| Support biometrique | Non natif | **`AndroidOptions.biometric()`** |
| Secure Enclave iOS/macOS | Non | **`useSecureEnclave: true`** |

### Comportements par defaut v10

- **`migrateOnAlgorithmChange: true`** par defaut — migration automatique de l'ancien format
- **`resetOnError: true`** nouveau defaut — les erreurs de keystore sont generalement irrecuperables

### Probleme de visibilite du fichier de stockage (Issue #947)

Le fichier `FlutterSecureKeyStorage.xml` est visible dans `/data/data/<package>/shared_prefs/` sur les appareils rootes. La structure de stockage est exposee meme si le contenu est chiffre. Aucun CVE formel — vulnerabilites suivies exclusivement via GitHub.

### Fork flutter_secure_storage_x

Version v10.2.3 avec support **DataStore** comme backend alternatif, resolvant le probleme de visibilite `shared_prefs`.

### Actions requises

1. Migrer vers v10+ obligatoirement
2. Activer `AndroidOptions.biometric()` pour les cles SSH et tokens Tailscale
3. Desactiver les sauvegardes Google Drive (`android:allowBackup="false"`)
4. Configurer le Keychain iOS avec `first_unlock` pour l'acces en arriere-plan
5. Activer `useSecureEnclave: true` pour iOS et macOS
6. Combiner avec freeRASP pour la detection de root

**Source** : COMPLEMENT_MOBILE_2_2026.md sections 3.1-3.4, COMPLEMENT_DESKTOP_2_2026.md sections 3.1-3.2

---

## 5 -- Cold boot attacks DDR4/DDR5

### Criticite : Haute | Plateforme : Desktop specifiquement

### Description

La remanence DRAM fonctionne avec DDR4 et DDR5 (recherche 3MDEB 2024-2025). Apres extinction du PC, les donnees en memoire (incluant les cles SSH, tokens, secrets) persistent physiquement pendant plusieurs secondes a minutes.

### Impact desktop

Un attaquant avec acces physique au PC peut extraire les secrets de la RAM apres extinction. Particulierement pertinent pour le desktop bridge qui detient les cles SSH.

### Mitigations au niveau OS/materiel

| Technologie | Description |
|-------------|-------------|
| **Intel TME** (Total Memory Encryption) | Chiffrement transparent de la RAM |
| **AMD SME** (Secure Memory Encryption) | Equivalent AMD |
| **TRESOR** | Stockage des cles dans les registres CPU au lieu de la RAM |

### Limitation Dart

Dart n'offre AUCUN mecanisme de chiffrement memoire. Seules les protections au niveau OS/materiel peuvent attenuer. Le GC Dart copie les secrets dans differentes zones de la heap, aggravant le probleme.

### Defense applicative

Zeroisation active des secrets en memoire (meme si imparfaite a cause du GC Dart). Allocation via FFI pour les secrets critiques.

**Source** : COMPLEMENT_DESKTOP_2026.md section 1.8

---

## 6 -- Allocation native FFI pour secrets critiques desktop

### Criticite : Haute | Plateforme : Desktop

### Principe

Utiliser `dart:ffi` avec `malloc.allocate<Uint8>()` pour placer les secrets HORS du controle du GC Dart. La memoire allouee via FFI n'est pas soumise aux copies et deplacements du garbage collector.

### Implementation

```dart
import 'dart:ffi';
import 'package:ffi/package:ffi.dart';

/// Allocation native pour un secret critique
final secretPtr = malloc.allocate<Uint8>(32); // 32 octets pour une cle AES-256

// ... utilisation du secret ...

// Zeroisation deterministe via memset
for (int i = 0; i < 32; i++) {
  secretPtr[i] = 0;
}
malloc.free(secretPtr);
```

### NativeFinalizer

Utiliser `NativeFinalizer` pour garantir la zeroisation meme en cas d'exception :

```dart
final _pointerFinalizer = NativeFinalizer(
  DynamicLibrary.process().lookup('free'),
);
```

### Pourquoi c'est plus critique sur desktop

- **Cold boot attacks** viables (DDR4/DDR5)
- **Pas de sandbox** → un malware peut dumper la memoire de l'app sans restriction
- **Outils plus accessibles** : gdb, Volatility 3, Process Hacker
- **Surface de persistance** : Les secrets copies par le GC persistent plus longtemps (plus de RAM)

### Action

Utiliser l'allocation FFI native pour TOUS les secrets sur desktop : cles SSH, tokens Tailscale, cles de chiffrement.

**Source** : COMPLEMENT_MOBILE_2026.md section 3.2, COMPLEMENT_DESKTOP_2026.md sections 1.8, 4.2

---

## Sources

- CYBERSEC_MOBILE.md sections 10.1-10.3
- CYBERSEC_DESKTOP.md sections 10.1-10.3
- COMPLEMENT_MOBILE_2_2026.md sections 3.1-3.4
- COMPLEMENT_DESKTOP_2_2026.md sections 3.1-3.2
- COMPLEMENT_MOBILE_2026.md section 3.2
- COMPLEMENT_DESKTOP_2026.md sections 1.8, 4.2
- FIPS 203, 204, 205 (Post-Quantum Standards)
- CWE-649 : Reliance on Obfuscation or Encryption with a Risky or Broken Crypto Algorithm
