# Faiblesses Cryptographiques -- Base de connaissance offensive
# Skill : adversary-simulation | Fichier knowledge
# Architecture cible : Mobile (ChillShell) -> Tailscale mesh -> Desktop (Chill) -> SSH -> PC

> **Source** : Extractions de CYBERSEC_MOBILE.md et CYBERSEC_DESKTOP.md

---

## TABLE DES MATIERES

1. [PRNG faible (Random() vs Random.secure())](#1--prng-faible)
2. [Reutilisation de nonce AES-GCM](#2--reutilisation-de-nonce-aes-gcm)
3. [Comparaison non constante (timing attack)](#3--comparaison-non-constante-timing-attack)
4. [Derivation de cle faible (PBKDF2)](#4--derivation-de-cle-faible-pbkdf2)
5. [Cles en dur dans le code source](#5--cles-en-dur-dans-le-code-source)
6. [IV/Nonce previsible](#6--ivnonce-previsible)
7. [Hash obsolete (MD5, SHA1)](#7--hash-obsolete-md5-sha1)
8. [Gestion d'erreur crypto ignoree](#8--gestion-derreur-crypto-ignoree)
9. [Padding Oracle](#9--padding-oracle)
10. [Attaques post-quantiques](#10--attaques-post-quantiques)
11. [pointycastle -- vulnerabilites specifiques](#11--pointycastle--vulnerabilites-specifiques)
12. [Chaines d'attaque crypto](#12--chaines-dattaque-crypto)
13. [flutter_secure_storage v10 -- Padding Oracle historique](#13--flutter_secure_storage-v10--vulnerabilite-padding-oracle-historique)
14. [GC Dart -- Risques detailles pour les secrets](#14--garbage-collector-dart--risques-detailles-pour-les-secrets)
15. [Cold Boot Attacks DDR4/DDR5](#15--cold-boot-attacks-ddr4ddr5)
16. [Dart 3.7-3.11 -- Absence API securisee memoire](#16--dart-37-311--absence-dapi-native-de-gestion-securisee-de-la-memoire)

---

## 1 -- PRNG faible

### Vulnerabilite (CWE-330)

Utilisation de `Random()` au lieu de `Random.secure()` en Dart. Le PRNG standard de Dart est **deterministe** -- il utilise un seed basee sur l'horloge systeme, ce qui le rend previsible.

### Ce que l'attaquant cherche

```dart
// VULNERABLE
final random = Random();
final iv = List<int>.generate(16, (_) => random.nextInt(256));
final nonce = List<int>.generate(12, (_) => random.nextInt(256));
final token = List<int>.generate(32, (_) => random.nextInt(256));

// SECURISE
final random = Random.secure();
```

### Impact

- Si utilise pour generer des IVs/nonces : chiffrement cassable
- Si utilise pour generer des tokens : tokens previsibles et forgeables
- Si utilise pour generer des cles de session : cles reproductibles

### Audit

```bash
grep -rn "Random()" --include="*.dart" . | grep -v "Random.secure"
```

---

## 2 -- Reutilisation de nonce AES-GCM

### Vulnerabilite (CWE-323)

AES-GCM avec un nonce reutilise est **catastrophique** : l'attaquant peut retrouver le keystream par XOR des deux textes chiffres, puis dechiffrer tous les messages passes et futurs utilisant le meme nonce.

### Ce que l'attaquant cherche

```dart
// VULNERABLE -- nonce fixe ou compteur simple
final nonce = Uint8List(12); // tout a zero !
final cipher = AesGcm(secretKey, nonce: nonce);

// VULNERABLE -- compteur reset apres redemarrage
static int _counter = 0;
final nonce = _counter++;

// SECURISE -- nonce aleatoire cryptographique
final nonce = List<int>.generate(12, (_) => Random.secure().nextInt(256));
```

### Impact

- **Nonce-Reuse Attack** : XOR de deux chiffres avec le meme nonce = XOR des deux clairs
- **Forgery Attack** : Reconstruction de l'authentication tag -> forgerie de messages
- Compromission totale de la confidentialite et de l'integrite

### Audit

```bash
grep -rn "GCM\|gcm\|nonce\|Nonce" --include="*.dart" .
```

---

## 3 -- Comparaison non constante (timing attack)

### Vulnerabilite (CWE-208)

Utilisation de `==` pour comparer des secrets (HMAC, tokens, mots de passe hashes). L'operateur `==` retourne `false` des le premier octet different, creant une difference de temps mesurable.

### Ce que l'attaquant cherche

```dart
// VULNERABLE -- timing attack possible
if (computedHmac == receivedHmac) { ... }
if (storedHash == inputHash) { ... }
if (token == expectedToken) { ... }

// SECURISE -- comparaison en temps constant
import 'package:crypto/crypto.dart';
if (constantTimeEquals(computedHmac, receivedHmac)) { ... }
```

### Impact

- L'attaquant mesure le temps de reponse pour chaque tentative
- Il reconstruit le secret octet par octet
- Nombre de tentatives : 256 * N (au lieu de 256^N par force brute)

### Audit

```bash
grep -rn "==.*hmac\|==.*hash\|==.*token\|==.*mac\|==.*digest" --include="*.dart" .
```

---

## 4 -- Derivation de cle faible (PBKDF2)

### Vulnerabilite (CWE-916)

PBKDF2 avec un nombre d'iterations insuffisant. OWASP recommande minimum 600000 iterations pour SHA256 en 2026. Beaucoup de code utilise 1000 ou 10000 iterations.

### Ce que l'attaquant cherche

```dart
// VULNERABLE -- iterations trop faibles
final key = Pbkdf2(
  macAlgorithm: Hmac.sha256(),
  iterations: 10000,  // TROP FAIBLE
  bits: 256,
);

// SECURISE -- iterations suffisantes
final key = Pbkdf2(
  macAlgorithm: Hmac.sha256(),
  iterations: 600000,  // Minimum OWASP 2026
  bits: 256,
);
```

### Alternatives recommandees

| Algorithme | Avantage | Recommandation |
|-----------|----------|---------------|
| Argon2id | Resistance GPU/ASIC (memory-hard) | Prefere pour les mots de passe |
| scrypt | Resistance GPU (memory-hard) | Alternative a Argon2 |
| PBKDF2-SHA256 | Disponible partout | Minimum 600000 iterations |

### Audit

```bash
grep -rn "Pbkdf2\|pbkdf2\|PBKDF\|iterations" --include="*.dart" .
```

---

## 5 -- Cles en dur dans le code source

### Vulnerabilite (CWE-321)

Cles de chiffrement, secrets API, ou passphrases codes en dur dans le code source. Extractibles par reverse engineering du binaire Flutter.

### Ce que l'attaquant cherche

```dart
// VULNERABLE -- cle en dur
const encryptionKey = 'MyS3cr3tK3y!2024';
const apiSecret = 'sk_live_abc123xyz';
final aesKey = utf8.encode('16-byte-key-here');

// Meme obfusque, extractible par analyse statique
final key = [0x4d, 0x79, 0x53, 0x33, 0x63, 0x72, 0x33, 0x74];
```

### Outils d'extraction

- **Blutter** : Extrait les symboles et constantes du binaire Flutter AOT
- **reFlutter** : Analyse le snapshot Dart
- **strings** : Recherche basique dans le binaire

### Audit

```bash
# Chercher des patterns de cles/secrets en dur
grep -rn "const.*key\|const.*secret\|const.*password\|const.*token" --include="*.dart" .
grep -rn "'[A-Za-z0-9+/=]{20,}'" --include="*.dart" .
```

---

## 6 -- IV/Nonce previsible

### Vulnerabilite (CWE-329)

IV ou nonce base sur un timestamp, un compteur simple, ou toute autre source previsible.

### Ce que l'attaquant cherche

```dart
// VULNERABLE -- IV base sur timestamp
final iv = utf8.encode(DateTime.now().millisecondsSinceEpoch.toString().padLeft(16, '0'));

// VULNERABLE -- IV compteur simple
static int _ivCounter = 0;
final iv = Uint8List(16)..buffer.asByteData().setInt64(8, _ivCounter++);

// VULNERABLE -- IV constant
final iv = Uint8List(16); // tout a zero

// SECURISE -- IV cryptographiquement aleatoire
final iv = List<int>.generate(16, (_) => Random.secure().nextInt(256));
```

---

## 7 -- Hash obsolete (MD5, SHA1)

### Vulnerabilite (CWE-328)

Utilisation de MD5 ou SHA1 pour des operations de securite. MD5 a des collisions triviales. SHA1 est casse depuis 2017 (SHAttered).

### Ce que l'attaquant cherche

```dart
// VULNERABLE
import 'package:crypto/crypto.dart';
final hash = md5.convert(utf8.encode(password));
final hash = sha1.convert(utf8.encode(data));

// SECURISE
final hash = sha256.convert(utf8.encode(data));
final hash = sha512.convert(utf8.encode(data));
```

### Pertinence dartssh2

- `ssh-rsa` utilise SHA1 pour les signatures -- algorithme a bannir
- `hmac-md5` et `hmac-sha1-96` sont des MAC tronques/faibles

### Audit

```bash
grep -rn "md5\|sha1\|MD5\|SHA1\|hmac-md5\|hmac-sha1" --include="*.dart" .
```

---

## 8 -- Gestion d'erreur crypto ignoree

### Vulnerabilite (CWE-392)

Les erreurs cryptographiques ignorees ou mal gerees. Analogue a CVE-2025-5372 (libssh mismatch semantique OpenSSL).

### Ce que l'attaquant cherche

```dart
// VULNERABLE -- erreur ignoree
try {
  final decrypted = cipher.decrypt(ciphertext);
  return decrypted;
} catch (e) {
  return ciphertext; // CATASTROPHIQUE : retourne les donnees non dechiffrees
}

// VULNERABLE -- fallback silencieux
final key = await deriveKey(password);
if (key == null) {
  key = defaultKey; // Cle de fallback connue
}

// SECURISE -- fail closed
try {
  final decrypted = cipher.decrypt(ciphertext);
  return decrypted;
} catch (e) {
  throw CryptoException('Dechiffrement echoue', e);
}
```

### Pertinence dartssh2

Pattern d'erreur analogue a CVE-2025-5372 (libssh) : verifier que dartssh2 gere correctement les codes retour de pointycastle/cryptography dans les routines KDF.

---

## 9 -- Padding Oracle

### Vulnerabilite (CWE-649)

Si le chiffrement utilise CBC avec PKCS7 padding, et que les erreurs de padding sont distinguables des erreurs de dechiffrement, l'attaquant peut dechiffrer les donnees octet par octet.

### Ce que l'attaquant cherche

```dart
// VULNERABLE -- messages d'erreur differents pour padding vs contenu
try {
  final decrypted = cbcCipher.decrypt(data);
  if (!isValid(decrypted)) {
    return Response(400, 'Invalid data');    // Erreur contenu
  }
} on PaddingException {
  return Response(400, 'Decryption failed'); // Erreur padding DISTINGUABLE
}

// SECURISE -- utiliser AES-GCM (authenticated encryption) au lieu de CBC
```

### AES-GCM vs AES-CBC

| Mode | Authentication | Padding Oracle | Recommandation |
|------|---------------|----------------|---------------|
| AES-CBC | Non (necessite HMAC separé) | Vulnerable | A eviter |
| AES-GCM | Oui (integree) | Non vulnerable | Recommande |
| ChaCha20-Poly1305 | Oui (integree) | Non vulnerable | Recommande |

---

## 10 -- Attaques post-quantiques

### Contexte 2026

Les ordinateurs quantiques menacent les algorithmes classiques :
- RSA : vulnerable a l'algorithme de Shor
- ECDSA/EdDSA : vulnerable a l'algorithme de Shor
- AES-256 : resiste (Grover reduit la securite effective a 128 bits)
- SHA-256 : resiste

### Risque "Harvest Now, Decrypt Later"

Un attaquant capture le trafic SSH/WireGuard chiffre maintenant et le dechiffre dans quelques annees quand les ordinateurs quantiques seront disponibles.

### Algorithmes post-quantiques

| Algorithme | Usage | Standard |
|-----------|-------|---------|
| ML-KEM (CRYSTALS-Kyber) | Echange de cles | FIPS 203 |
| ML-DSA (CRYSTALS-Dilithium) | Signatures | FIPS 204 |
| SLH-DSA (SPHINCS+) | Signatures (stateless) | FIPS 205 |

### Pertinence dartssh2

dartssh2 n'implemente probablement pas les algorithmes post-quantiques. OpenSSH 9.0+ supporte le hybrid key exchange `sntrup761x25519-sha512@openssh.com`.

---

## 11 -- pointycastle -- vulnerabilites specifiques

### Surface d'attaque

pointycastle (^3.7.3) est la bibliotheque crypto principale de dartssh2. Vulnerabilites potentielles :

| Risque | Description | CWE |
|--------|-------------|-----|
| Timing side-channels | Operations modular arithmetic non constant-time | CWE-385 |
| Buffer overflow Dart | Moins probable que C, mais possible dans les operations BigInt | CWE-119 |
| Dependance non auditee | Pas d'audit de securite publie pour pointycastle | CWE-1395 |
| Implementation RSA | Verification de signature RSA potentiellement vulnerable a Bleichenbacher | CWE-327 |

### Audit

```bash
# Verifier les dependances crypto
grep -rn "pointycastle\|pinenacl\|cryptography" pubspec.yaml pubspec.lock
```

---

## 12 -- Chaines d'attaque crypto

### Chaine 1 : PRNG faible + nonce previsible

```
Random() utilise pour generer les nonces AES-GCM
  -> Nonces previsibles
  -> L'attaquant reconstruit le keystream
  -> Dechiffrement de toutes les communications
```

### Chaine 2 : Timing attack + comparaison non constante

```
Token d'authentification compare avec ==
  -> L'attaquant mesure le temps de reponse
  -> Reconstruction du token octet par octet (256 * N tentatives)
  -> Authentification forcement contournee
```

### Chaine 3 : Cle en dur + reverse engineering

```
Cle AES codee en dur dans le code source
  -> Blutter extrait les constantes du binaire Flutter
  -> L'attaquant recupere la cle
  -> Dechiffrement de toutes les donnees chiffrees avec cette cle
```

### Chaine 4 : Erreur crypto ignoree + fallback

```
Erreur de derivation de cle ignoree silencieusement
  -> Fallback vers une cle par defaut ou un buffer non initialise
  -> Chiffrement avec une cle connue ou previsible
  -> Interception triviale
```

---

## 13 -- flutter_secure_storage v10 -- Vulnerabilite Padding Oracle historique

### Contexte

flutter_secure_storage v9.x utilisait **AES/CBC/PKCS7Padding** (CWE-649) pour chiffrer les donnees sur Android. Ce mode est inherement vulnerable aux attaques Padding Oracle (voir section 9).

### Historique de la vulnerabilite

| Version | Mode de chiffrement | Vulnerabilite |
|---------|-------------------|---------------|
| flutter_secure_storage v9.x et anterieures | AES/CBC/PKCS7Padding | **Padding Oracle** -- un attaquant peut distinguer les erreurs de padding des erreurs de dechiffrement, permettant un dechiffrement octet par octet |
| flutter_secure_storage v10.0.0+ | AES/GCM/NoPadding | **Corrige** -- AES-GCM est un mode de chiffrement authentifie, immunise contre les attaques Padding Oracle |

### Impact pour ChillShell/Chill

- Si l'app utilisait une version < v10.0.0 a un moment quelconque, les donnees chiffrees avec l'ancien mode restent potentiellement dechiffrables
- La migration de v9 vers v10 doit re-chiffrer toutes les donnees existantes en AES/GCM
- Si la migration n'est pas faite, les anciennes donnees restent en AES/CBC vulnerable
- Verifier que les backups ne contiennent pas de donnees chiffrees avec l'ancien mode

### Audit

```bash
# Verifier la version de flutter_secure_storage
grep -rn "flutter_secure_storage" pubspec.yaml pubspec.lock
# Chercher des references a CBC ou PKCS7
grep -rn "CBC\|PKCS7\|pkcs7\|cbc" --include="*.dart" .
```

---

## 14 -- Garbage Collector Dart -- Risques detailles pour les secrets

### Fonctionnement du GC Dart et impact sur les secrets

Le Garbage Collector (GC) de Dart presente des risques specifiques pour la gestion des secrets cryptographiques :

#### Young Space Scavenger
- Le GC Dart utilise un collecteur generationnel avec un **Young Space Scavenger**
- Ce scavenger **copie** les objets survivants d'un espace a un autre (semi-space copying)
- Chaque copie cree un **duplicata du secret** dans une zone differente de la heap
- L'original n'est **pas zerotise** -- il reste en memoire jusqu'a reutilisation de la zone

#### String immutables
- Les `String` en Dart sont **immutables** -- elles ne peuvent pas etre modifiees apres creation
- Il est **impossible** de zeroiser une String Dart apres utilisation
- Si une cle SSH ou un mot de passe est stocke comme String, il persiste indefiniment en heap
- Meme si la variable sort du scope, le GC n'appelle aucune zeroisation

#### Moment de collecte non deterministe
- Le GC ne garantit **aucun moment precis** pour la liberation de la memoire
- Un secret peut rester en memoire pendant des minutes, des heures, voire jusqu'a l'arret de l'app
- Pendant ce temps, il est accessible via un dump memoire (Frida, gdbserver, /proc/pid/mem)

#### Multiples copies en heap
- A cause du Scavenger, un meme secret peut exister en **3+ copies simultanees** dans la heap Dart :
  1. L'objet original dans le Young Space
  2. La copie dans le To-Space apres le premier GC
  3. La copie dans le Old Space apres promotion
  4. Les copies intermediaires de chaque cycle GC traversant

### Mitigations possibles

| Technique | Description | Efficacite |
|-----------|-------------|-----------|
| `Uint8List` + `fillRange(0, length, 0)` | Utiliser Uint8List au lieu de String, zeroiser explicitement apres usage | **Partielle** -- le GC peut avoir copie l'objet avant la zeroisation |
| `SecretKeyData.destroy()` | API de la bibliotheque `cryptography` pour detruire les cles | **Partielle** -- zerotise l'objet actuel mais pas les copies du GC |
| `dart:ffi` + `malloc.allocate()` | Allouer la memoire **hors du heap Dart** via FFI, echappant au GC | **Bonne** -- la memoire n'est jamais copiee par le GC, zeroisation deterministe possible |
| Combinaison FFI + `mlock()` | Allouer hors heap + empecher le swap | **Meilleure** -- memoire non copiee, non swappee, zeroisation controlee |

### Audit

```bash
# Chercher des secrets stockes comme String
grep -rn "String.*key\|String.*password\|String.*secret\|String.*token" --include="*.dart" .
# Chercher l'utilisation de Uint8List pour les secrets
grep -rn "Uint8List\|fillRange\|SecretKeyData.destroy\|dart:ffi.*malloc" --include="*.dart" .
```

---

## 15 -- Cold Boot Attacks DDR4/DDR5

### Viabilite en 2026

Les attaques cold boot restent viables sur les memoires DDR4 et DDR5 :

- **Remanence DRAM** : apres extinction du PC, les donnees en DRAM persistent pendant plusieurs secondes a minutes, plus longtemps si le module est refroidi (spray de refroidissement)
- Les cles SSH en memoire (dartssh2, flutter_secure_storage) sont recoverables pendant cette fenetre
- L'attaquant boot sur une cle USB live et dumpe la RAM physique

### Defenses materielles

| Defense | Description | Efficacite |
|---------|-------------|-----------|
| Intel TME (Total Memory Encryption) | Chiffrement AES-XTS de toute la DRAM par le CPU | **Haute** -- la RAM physique est chiffree, le cold boot extrait du chiffre |
| AMD SME (Secure Memory Encryption) | Equivalent AMD de TME | **Haute** -- meme protection |
| TRESOR | Implementation AES stockant les cles uniquement dans les registres CPU (pas en RAM) | **Tres haute** -- les cles n'apparaissent jamais en DRAM |

### Pertinence ChillShell/Chill

- Le PC cible contient les cles SSH en RAM pendant les sessions actives
- Si le PC est eteint physiquement (evil maid), cold boot = extraction des cles
- Les sessions SSH longues (flutter_foreground_task) augmentent la fenetre d'exposition
- Intel TME et AMD SME ne sont pas actives par defaut sur tous les systemes

---

## 16 -- Dart 3.7-3.11 -- Absence d'API native de gestion securisee de la memoire

### Deficit compare aux autres langages

| Langage | API native gestion securisee memoire | Statut |
|---------|--------------------------------------|--------|
| Java (21+) | Foreign Memory API (JEP 454) -- allocation hors heap, zeroisation deterministe, auto-close | **Disponible** |
| Rust | `zeroize` crate, `SecretVec`, `Box` avec Drop, `mlock` | **Mature** |
| Go | `memguard`, `mlock`, allocation manuelle | **Disponible** |
| Dart 3.7 a 3.11 | **AUCUNE API native** -- seul `dart:ffi` permet un controle bas niveau | **Absent** |

### Implications

- Dart ne fournit **aucun equivalent** a Java Foreign Memory API ou Rust `zeroize`
- Les developpeurs doivent utiliser `dart:ffi` manuellement pour toute gestion securisee
- Le GC Dart est le seul gestionnaire de memoire, sans hooks de nettoyage securise
- `NativeFinalizer` : aucune modification majeure dans Dart 3.7-3.11, travaux en cours pour les finalizers partages entre isolates (issue #55511)
- Consequence : toute application Dart manipulant des secrets (cles SSH, tokens) est inherement exposee a des fuites memoire non controlees

### Workaround recommande

```dart
// WORKAROUND -- Allocation hors heap Dart via FFI
import 'dart:ffi';
import 'package:ffi/ffi.dart';

class SecureBuffer {
  final Pointer<Uint8> _ptr;
  final int length;
  bool _destroyed = false;

  SecureBuffer(this.length) : _ptr = malloc.allocate<Uint8>(length);

  void destroy() {
    if (!_destroyed) {
      // Zeroisation explicite
      for (int i = 0; i < length; i++) {
        _ptr[i] = 0;
      }
      malloc.free(_ptr);
      _destroyed = true;
    }
  }
}
```

---

## REFERENCES

- OWASP Cryptographic Failures (A02:2021)
- CWE-310 : Cryptographic Issues
- CWE-649 : Reliance on Obfuscation or Encryption of Security-Relevant Inputs without Integrity Checking (Padding Oracle)
- NIST SP 800-131A Rev. 2 : Transitioning to Post-Quantum
- FIPS 203, 204, 205 : Post-Quantum Standards
- CYBERSEC_MOBILE.md -- Section 10 (Hardening Stockage & Crypto)
- CYBERSEC_DESKTOP.md -- Section 10 (Hardening Stockage & Crypto)
- COMPLEMENT_MOBILE_3_2026.md -- Sections IA, crypto, memoire
- COMPLEMENT_DESKTOP_3_2026.md -- Sections cold boot, memoire
- Dart SDK issue #55511 -- NativeFinalizer shared isolates
- flutter_secure_storage changelog v9.x -> v10.0.0
