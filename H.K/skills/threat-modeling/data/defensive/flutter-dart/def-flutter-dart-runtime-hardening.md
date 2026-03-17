# Hardening Runtime Dart -- Base de connaissances defensive
# Skill : defensive-hardening | Fichier knowledge
# Source : CYBERSEC_MOBILE.md sections 8, CYBERSEC_DESKTOP.md section 8

---

## TABLE DES MATIERES

1. [Comparaison en temps constant](#1--comparaison-en-temps-constant)
2. [Generation de nombres aleatoires securises](#2--generation-de-nombres-aleatoires)
3. [Nonce AES-GCM et gestion de limites](#3--nonce-aes-gcm)
4. [Dart Isolates pour isolation crypto](#4--dart-isolates)
5. [Extension Types pour donnees sensibles](#5--extension-types)
6. [Sealed Classes pour state machines](#6--sealed-classes)
7. [GC Dart et secrets en memoire](#7--gc-dart-et-secrets)
8. [Zone error handling securise](#8--zone-error-handling)
9. [Streams Dart securises](#9--streams-dart)
10. [Dart FFI security](#10--dart-ffi-security)
11. [Dart 3.10 parsing IPv4 corrige (anti-SSRF)](#11--dart-310-parsing-ipv4-corrige-anti-ssrf)
12. [Dart 3.10 Build Hooks (compilation native)](#12--dart-310-build-hooks-compilation-native-securisee)
13. [Dart 3.10 desactivation publication manuelle pub.dev](#13--dart-310-desactivation-publication-manuelle-pubdev)
14. [Dart 3.11 Sockets Unix Windows](#14--dart-311-sockets-unix-windows)
15. [dart pub cache gc](#15--dart-pub-cache-gc)
16. [GC Dart proprietes securitaires structurelles](#16--gc-dart-proprietes-securitaires-structurelles)
17. [GC Dart probleme fondamental des secrets](#17--gc-dart-probleme-fondamental-des-secrets-en-memoire)
18. [dart:ffi tension securitaire](#18--dartffi-tension-securitaire)

---

## 1 -- Comparaison en temps constant

### Criticite : CRITIQUE (CWE-208)

L'operateur `==` de Dart est optimise pour retourner `false` des la premiere difference. La difference de temps `DeltaT ≈ i * t_byte_cmp + epsilon` permet de reconstruire le secret.

PointyCastle < 3.4.0 avait des fuites temporelles dans GCM (validateMac).

### Code defensif

```dart
/// Comparaison en temps constant - OBLIGATOIRE pour tous les secrets
bool constantTimeEquals(List<int> a, List<int> b) {
  if (a.length != b.length) return false;
  int result = 0;
  for (int i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result == 0;
}
```

### Ou appliquer

- Verification HMAC des messages SSH
- Comparaison de tokens d'authentification
- Verification de PIN/mot de passe hashe
- Tout endroit ou deux secrets sont compares

### Audit

```bash
grep -rn "==.*hmac\|==.*hash\|==.*token\|==.*mac\|==.*digest" --include="*.dart" .
```

**Source** : CYBERSEC_MOBILE.md section 8.2, CYBERSEC_DESKTOP.md section 8.1

---

## 2 -- Generation de nombres aleatoires

### Criticite : CRITIQUE (CWE-330)

`dart:math Random()` est DANGEREUX - seed basee sur l'horloge systeme, previsible. Seul `Random.secure()` est acceptable (wrapper vers /dev/urandom Linux, SecRandomCopyBytes iOS, BCryptGenRandom Windows).

### Risques supplementaires

- VMs Linux clonees avec pool d'entropie faible
- Containers Docker partageant /dev/urandom

### Code defensif

```dart
import 'dart:math';
import 'dart:typed_data';

/// Generateur cryptographique - SEUL generateur autorise
class SecureRandom {
  static final Random _rng = Random.secure();

  static Uint8List bytes(int length) =>
    Uint8List.fromList(List.generate(length, (_) => _rng.nextInt(256)));

  static Uint8List nonce12() => bytes(12); // AES-GCM
  static Uint8List iv16() => bytes(16);    // AES-CBC
  static Uint8List key32() => bytes(32);   // AES-256
}
```

### Audit

```bash
grep -rn "Random()" --include="*.dart" . | grep -v "Random.secure"
```

**Source** : CYBERSEC_MOBILE.md section 8.3, CYBERSEC_DESKTOP.md section 8.2

---

## 3 -- Nonce AES-GCM

### Criticite : Haute

AES-GCM exige un nonce unique de 12 octets par operation. Pour une cle unique : max 2^32 operations (recommandation NIST). Si le nonce est reutilise, l'attaquant recupere le flux XOR et dechiffre le trafic.

### Code defensif

```dart
/// Compteur de nonces avec limite et rekey automatique
class NonceManager {
  int _counter = 0;
  static const maxOperations = 0xFFFFFFFF; // 2^32 - 1

  Uint8List nextNonce() {
    if (_counter >= maxOperations) {
      throw StateError('Limite de nonce atteinte - rekey necessaire');
    }
    final nonce = Uint8List(12);
    // 4 octets aleatoires + 8 octets compteur
    final random = SecureRandom.bytes(4);
    nonce.setRange(0, 4, random);
    nonce.buffer.asByteData().setInt64(4, _counter++);
    return nonce;
  }

  bool needsRekey() => _counter >= maxOperations * 0.9; // 90% de la limite
}
```

**Source** : CYBERSEC_MOBILE.md section 8.4, CYBERSEC_DESKTOP.md section 8.3

---

## 4 -- Dart Isolates

### Complexite : Moderee

Les Isolates Dart isolent les operations cryptographiques dans un espace memoire separe. Le GC d'un Isolate ne touche pas les objets de l'autre. Protege contre le memory dumping partiel.

### Limite

Pas de memoire partagee entre Isolates. Transfert par copie uniquement.

### Code defensif

```dart
import 'dart:isolate';

/// Execution crypto dans un Isolate separe
Future<T> runInCryptoIsolate<T>(T Function() operation) async {
  return await Isolate.run(operation);
}
```

**Source** : CYBERSEC_MOBILE.md section 8.1, CYBERSEC_DESKTOP.md section 8.4

---

## 5 -- Extension Types

### Complexite : Simple (Dart 3+)

Extension types creent des wrappers type-safe autour des donnees sensibles. Zero cost runtime.

```dart
extension type SSHPrivateKeyData(Uint8List _bytes) {
  int get length => _bytes.length;
  Uint8List get rawBytes => _bytes;
  void secureDispose() => _bytes.fillRange(0, _bytes.length, 0);
}
```

**Source** : CYBERSEC_MOBILE.md section 8.5, CYBERSEC_DESKTOP.md section 8.5

---

## 6 -- Sealed Classes

### Complexite : Moderee (Dart 3+)

Sealed classes modelisent les etats de connexion SSH de maniere exhaustive. Le compilateur force le traitement de chaque etat.

```dart
sealed class SSHConnectionState {}
class Disconnected extends SSHConnectionState {}
class Connecting extends SSHConnectionState { final String host; Connecting(this.host); }
class Authenticating extends SSHConnectionState {}
class Connected extends SSHConnectionState { final SSHClient client; Connected(this.client); }
class Error extends SSHConnectionState { final String message; Error(this.message); }
```

**Source** : CYBERSEC_MOBILE.md section 8.6, CYBERSEC_DESKTOP.md section 8.6

---

## 7 -- GC Dart et secrets

### Criticite : Haute

Le GC Dart copie les objets dans differentes zones de la heap. Les secrets peuvent persister meme apres "suppression".

### Techniques de nettoyage

| Technique | Fiabilite | Complexite |
|-----------|----------|------------|
| `Uint8List.fillRange(0)` | Moyenne (GC peut copier avant) | Simple |
| FFI vers `secure_memset` natif | Haute | Moderee |
| `NativeFinalizer` | Haute (automatique) | Moderee |
| MemGuard via Rust FFI | Tres haute (mlock + guard pages) | Avancee |

**Source** : CYBERSEC_MOBILE.md section 8.8, CYBERSEC_DESKTOP.md section 8.7

---

## 8 -- Zone error handling

### Complexite : Simple

Zones Dart capturent TOUTES les erreurs non gerees. S'assurer qu'aucune stack trace ne fuite d'informations sensibles.

```dart
runZonedGuarded(() async {
  // Code applicatif
}, (error, stackTrace) {
  // NE JAMAIS logger la stack trace complete en production
  // NE JAMAIS retourner des details d'erreur crypto
  logSecure('Error: ${error.runtimeType}');
});
```

**Source** : CYBERSEC_MOBILE.md section 8.7

---

## 9 -- Streams Dart securises

Les connexions SSH utilisent des Streams. Points d'attention :
- Nettoyage des buffers apres usage
- Gestion du backpressure pour eviter les debordements
- Subscription leaks (cancel les listeners)

**Source** : CYBERSEC_DESKTOP.md section 8.8

---

## 10 -- Dart FFI security

Valider TOUTES les donnees traversant la frontiere Dart -> natif. Risques de buffer overflow dans le code C/C++ appele via FFI.

**Source** : CYBERSEC_DESKTOP.md section 8.9

---

## 11 -- Dart 3.10 parsing IPv4 corrige (anti-SSRF)

### Criticite : Haute

`Uri.parseIPv4Address` n'accepte plus les zeros en tete dans les adresses IP a partir de Dart 3.10. Les zeros en tete pouvaient etre interpretes comme notation octale sur certaines plateformes — un vecteur d'attaque SSRF connu (ex: `010.010.010.010` = `8.8.8.8` en octal).

### Impact

Pour une app SSH/Tailscale validant des adresses IP, c'est une correction essentielle. Empeche un attaquant de contourner des validations d'adresses via la notation octale.

### Action

S'assurer d'utiliser Dart 3.10+ pour beneficier de cette correction.

**Source** : COMPLEMENT_MOBILE_2_2026.md section 4.1, COMPLEMENT_DESKTOP_2_2026.md section 2.1

---

## 12 -- Dart 3.10 Build Hooks (compilation native securisee)

### Complexite : Moderee

Stabilisation des Build Hooks (anciennement « Native Assets »). Compilation de code natif C/C++/Rust via un script `hook/build.dart` standardise. Les variables d'environnement sont filtrees pour les hooks, garantissant une compilation reproductible.

### Impact

Pour une app utilisant du code natif via FFI (libssh2, WireGuard, configuration OS), les Build Hooks offrent une compilation reproductible et securisee. Particulierement pertinent pour le desktop qui utilise davantage de code natif.

**Source** : COMPLEMENT_MOBILE_2_2026.md section 4.2, COMPLEMENT_DESKTOP_2_2026.md section 2.2

---

## 13 -- Dart 3.10 desactivation publication manuelle pub.dev

### Complexite : Simple (defense supply chain)

Les developpeurs peuvent desormais desactiver la publication manuelle sur pub.dev, ne gardant que la publication automatisee via Trusted Publishers (CI/CD avec tokens OIDC temporaires). Elimine les secrets longue duree dans le CI/CD.

### Impact

Previent les attaques de supply chain via credentials personnels compromis. Les packages critiques ne peuvent etre publies que depuis un pipeline CI/CD authentifie par OIDC.

### Action

Verifier que les dependances critiques du projet utilisent Trusted Publishers.

**Source** : COMPLEMENT_MOBILE_2_2026.md section 4.3, COMPLEMENT_DESKTOP_2_2026.md section 2.5

---

## 14 -- Dart 3.11 Sockets Unix Windows

### Criticite : Haute (desktop)

Support des sockets Unix sur Windows a partir de Dart 3.11. Crucial pour la communication IPC avec le daemon Tailscale sur Windows. Avant Dart 3.11, l'IPC avec Tailscale sur Windows necessitait des named pipes ou des TCP sockets locaux — tous deux plus vulnerables.

### Avantage securitaire

Les sockets Unix ont des controles d'acces filesystem (permissions) que les TCP sockets n'ont pas. Cela permet de restreindre l'acces a l'IPC Tailscale aux seuls processus autorises.

### Action

Migrer la communication avec le daemon Tailscale vers les sockets Unix sur Windows des que possible.

**Source** : COMPLEMENT_MOBILE_2_2026.md section 4.5, COMPLEMENT_DESKTOP_2_2026.md section 2.3

---

## 15 -- dart pub cache gc

### Complexite : Simple

Nouvelle commande `dart pub cache gc` qui nettoie les packages non references du cache local. Elimine les anciennes versions potentiellement vulnerables.

### Action

Integrer `dart pub cache gc` dans le CI/CD pour nettoyage regulier du cache de packages.

**Source** : COMPLEMENT_MOBILE_2_2026.md section 4.6, COMPLEMENT_DESKTOP_2_2026.md section 2.4

---

## 16 -- GC Dart proprietes securitaires structurelles

### Complexite : Informationnel

Le GC Dart est un atout securitaire par conception :

| Propriete | Description | Consequence securitaire |
|-----------|-------------|------------------------|
| **Precis** (non conservatif) | Identifie exactement les objets vivants | Pas de fuite memoire par confusion de type |
| **Deplacant** | Copie les objets vivants vers une nouvelle zone | Elimine structurellement les use-after-free en Dart pur |
| **Pas de tableaux sur pile** | Aucun tableau alloue sur la pile | Pas de stack smashing possible |

### Consequence

Les vulnerabilites memoire ne peuvent provenir QUE du code FFI. Le code Dart pur est structurellement protege contre les classes de bugs memoire classiques (use-after-free, buffer overflow sur pile, stack smashing).

### NativeFinalizer

Pas de modifications majeures recentes. Travaux en cours sur les finalizers partages entre isolates (issue Dart SDK #55511).

### Note dart:ffi

Dart ne genere PAS de stack canaries car il n'a pas de tableaux alloues sur la pile, mais le code C appele via FFI peut etre vulnerable. Google considere les rapports a ce sujet comme des faux positifs des scanners.

**Source** : COMPLEMENT_MOBILE_2_2026.md section 4.7, COMPLEMENT_DESKTOP_2_2026.md section 7

---

## 17 -- GC Dart probleme fondamental des secrets en memoire

### Criticite : CRITIQUE

Le GC Dart pose un probleme fondamental pour la gestion des secrets :

1. Le **Young Space Scavenger COPIE** les objets vivants vers une autre zone memoire
2. Les copies residuelles restent dans l'ancienne zone
3. Les objets `String` sont **IMMUTABLES** — impossible d'ecraser leur contenu
4. Le GC **NE MET PAS A ZERO** la memoire liberee
5. Le moment de la collecte est **NON DETERMINISTE**

**Resultat** : Un secret peut persister en MULTIPLES copies dans le heap Dart bien apres sa "suppression" logique.

### Mitigations

| Technique | Fiabilite | Detail |
|-----------|----------|--------|
| `Uint8List` + `fillRange(0, length, 0)` | Moyenne | Le GC peut avoir copie AVANT l'effacement |
| Package `cryptography` — `SecretKeyData.destroy()` | Moyenne-Haute | Methode dediee de destruction |
| `dart:ffi` — `malloc.allocate<Uint8>()` | Haute | Place les secrets HORS du controle du GC, effacement via `memset` |

### Manque critique Dart 3.7-3.11

Dart 3.7 a 3.11 n'a introduit AUCUNE API native de gestion securisee de la memoire. Compare a Java (Foreign Memory API) ou Rust, c'est le deficit securitaire le plus important de l'ecosysteme Dart.

**Source** : COMPLEMENT_MOBILE_2026.md section 3.2, COMPLEMENT_DESKTOP_2026.md section 4.2

---

## 18 -- dart:ffi tension securitaire

### Criticite : Haute

`dart:ffi` est essentiellement un appel C en syntaxe Dart, NON memoire-sur.

### Risques

- **use-after-free** : Acces a de la memoire liberee
- **double-free** : Liberation multiple du meme bloc
- **buffer overflow** : Ecriture au-dela des limites du buffer
- **dangling pointers** : Pointeurs vers de la memoire liberee

### Notes

- Flutter ne genere PAS de stack canaries car Dart n'a pas de tableaux alloues sur la pile, mais le code C appele via FFI peut etre vulnerable
- **Position Google** : Considere les rapports de vulnerabilites FFI comme des faux positifs des scanners
- Sur desktop, l'utilisation de FFI est potentiellement PLUS FREQUENTE (APIs OS, Credential Manager Windows, libsecret Linux, configuration firewall, WOL) → plus de surface d'attaque

### Action

Validation rigoureuse a la frontiere Dart <-> natif. Tests de fuzzing sur les fonctions FFI.

**Source** : COMPLEMENT_MOBILE_2026.md section 3.4, COMPLEMENT_DESKTOP_2026.md section 4.3

---

## Sources

- CYBERSEC_MOBILE.md sections 8.1-8.8
- CYBERSEC_DESKTOP.md sections 8.1-8.9
- COMPLEMENT_MOBILE_2026.md sections 3.1-3.4
- COMPLEMENT_DESKTOP_2026.md sections 4.1-4.3, 7.1-7.2
- COMPLEMENT_MOBILE_2_2026.md sections 4.1-4.7
- COMPLEMENT_DESKTOP_2_2026.md sections 2.1-2.5, 7
- CWE-208 : Observable Timing Discrepancy
- CWE-330 : Use of Insufficiently Random Values
