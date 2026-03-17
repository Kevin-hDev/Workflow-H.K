# Sécurité mobile iOS/Android — Condensé 2025-2026

## CVEs critiques iOS — zero-days exploités in-the-wild

| CVE | Composant | CVSS | Type | Exploit | Patch |
|-----|-----------|------|------|---------|-------|
| CVE-2025-31200 | CoreAudio (AAC) | CRITICAL | zero-click RCE via iMessage | Spyware (Apple SEAR + Google TAG) | iOS 18.4.1 |
| CVE-2025-31201 | RPAC | CRITICAL | Bypass Pointer Auth → kernel | Chaîné avec -31200 | iOS 18.4.1 |
| CVE-2025-43200 | Messages/iCloud | 9.8 | Logic flaw → zero-click | Paragon Graphite | iOS 18.3.1 |
| CVE-2025-43300 | ImageIO (DNG) | 8.8 | OOB write | Spyware via WhatsApp | iOS 18.6.2 |
| CVE-2025-43529 | WebKit | 8.8 | Use-after-free → RCE | Spyware (Google TAG) | iOS 26.2 |
| CVE-2025-14174 | WebKit/ANGLE | 8.8 | Memory corruption | Chaîné avec -43529 | iOS 26.2 |
| CVE-2025-24201 | WebKit | 8.8 | OOB write → sandbox escape | Attaque sophistiquée | iOS 18.3.2 |
| CVE-2025-24200 | USB Restricted Mode | HIGH | Bypass autorisation | Cellebrite/GrayKey | iOS 18.3.1 |
| CVE-2025-24085 | CoreMedia | HIGH | Use-after-free → EoP | Spyware (~233$ dark web) | iOS 18.3 |
| CVE-2025-24204 | gcore (Keychain) | — | Entitlement bug → lecture Keystore | — | — |

**Chaîne la plus grave :** CVE-2025-31200 + CVE-2025-31201 — heap corruption décodeur AAC déclenché par fichier audio malformé via iMessage (contourne BlastDoor) + bypass PAC pour escalade kernel.

## CVEs critiques Android

| CVE | Composant | CVSS | Type | Impact |
|-----|-----------|------|------|--------|
| CVE-2025-48593 | Android System (13-16) | CRITICAL | zero-click RCE | Sans interaction utilisateur |
| CVE-2025-21042 | Samsung libimagecodec.quram.so | — | OOB via DNG | LANDFALL spyware (Irak, Iran, Turquie) |
| CVE-2025-21043 | Samsung libimagecodec.quram.so | — | OOB via DNG | Chaîné avec -21042 |
| CVE-2024-53104 | Kernel driver UVC | — | EoP via USB | Chaîne Cellebrite Serbie |
| CVE-2024-53197 | Kernel driver ALSA USB | — | EoP via USB | Chaîne Cellebrite Serbie |
| CVE-2024-50302 | Kernel driver HID | — | EoP via USB | Chaîne Cellebrite Serbie |
| CVE-2025-48572 | Framework | 7.4 | EoP | Activement exploité déc 2025 |
| CVE-2025-48633 | Framework | — | Info disclosure | Activement exploité |
| CVE-2026-21385 | Qualcomm Graphics (235 chipsets) | 7.8 | Integer overflow | CISA KEV 3 mars 2026 |
| CVE-2022-20138 | PendingIntent | — | Hijacking via fillIn() | Voir code ci-dessous |

---

## iOS — Stockage sécurisé

### Keychain : niveaux d'accès

| Niveau | Accessible | Sauvegardes | Sécurité |
|--------|-----------|-------------|---------|
| `kSecAttrAccessibleAlways` | Toujours | Oui | DÉPRÉCIÉ — CRITIQUE |
| `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` | Déverrouillé | Non | Haute |
| `kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly` | Déverrouillé + code | Non | Maximale |

```swift
// VULNÉRABLE : accessible même appareil verrouillé
kSecAttrAccessible as String: kSecAttrAccessibleAlways

// CORRIGÉ : biométrie + non-transférable
var error: Unmanaged<CFError>?
let access = SecAccessControlCreateWithFlags(
    kCFAllocatorDefault,
    kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
    [.biometryCurrentSet, .or, .devicePasscode], &error)
// [kSecAttrAccessControl: access] dans la query SecItemAdd
```

**UserDefaults = plist non chiffré** — jamais de JWT, token, clé, PII.

### Data Protection : NSFileProtectionComplete rend les fichiers inaccessibles 10s après verrouillage
```swift
description?.setOption(FileProtectionType.complete as NSObject,
                       forKey: NSPersistentStoreFileProtectionKey)
```

### ATS : 63% des apps le désactivent — faille MITM directe
```xml
<!-- VULNÉRABLE -->
<key>NSAllowsArbitraryLoads</key><true/>

<!-- CORRIGÉ : exception ciblée uniquement -->
<key>NSAllowsArbitraryLoads</key><false/>
<!-- + NSExceptionDomains pour l'hôte legacy uniquement -->
```

### Certificate Pinning SPKI (survit aux rotations de cert)
```swift
// Vérifier sha256 de la clé publique — comparer à une Set<String> codée en dur
// Fail : completionHandler(.cancelAuthenticationChallenge, nil)
// Tools de bypass : Frida/objection hookent SecTrustEvaluateWithError
// Détection : port 27042, _dyld_image_count() → "FridaGadget", "MobileSubstrate"
```

### Erreurs CryptoKit critiques
- Mode ECB → ciphertext identique pour blocs identiques
- IV statique en GCM → perte d'authenticité totale
- Clé dérivée d'un string → attaque dictionnaire (PBKDF2 ≥100K rounds)
- `CommonCrypto` pour nouveau code → utiliser `CryptoKit` (AEAD par défaut)

### OAuth : vol via ASWebAuthenticationSession
```swift
// VULNÉRABLE : schéma custom → n'importe quelle app peut le réclamer
callbackURLScheme: "myapp"

// CORRIGÉ : Universal Links (iOS 17.4+)
callback: .https(host: "example.com", path: "/oauth/callback")
session.prefersEphemeralWebBrowserSession = true  // Pas de partage cookies Safari
```

---

## Android — Stockage sécurisé

### Keystore : StrongBox vs TEE
```kotlin
// TEE = tous appareils modernes | StrongBox = Titan M, Android 9+, 35-55× plus lent
val hasStrongBox = context.packageManager
    .hasSystemFeature(PackageManager.FEATURE_STRONGBOX_KEYSTORE)
// Utiliser keyInfo.securityLevel (API 31+) — isInsideSecureHardware() déprécié
```

### SharedPreferences en clair = toujours vulnérable sur appareil rooté
```kotlin
// VULNÉRABLE
context.getSharedPreferences("prefs", MODE_PRIVATE).edit()
    .putString("auth_token", token).apply()

// CORRIGÉ : EncryptedSharedPreferences (AES256-SIV clés + AES256-GCM valeurs)
val masterKey = MasterKey.Builder(context).setKeyScheme(AES256_GCM).build()
val securePrefs = EncryptedSharedPreferences.create(context, "secure", masterKey,
    AES256_SIV, AES256_GCM)
// Note : androidx.security dépréciée avr 2025 → DataStore + Tink pour nouveaux projets
// Exclure des sauvegardes Auto Backup — MasterKey ne survit pas à une restauration
```

### TrustManager qui accepte tout = CRITICAL (rejet Google Play)
```kotlin
// VULNÉRABLE — MITM total
object : X509TrustManager {
    override fun checkServerTrusted(chain: Array<X509Certificate>, type: String) {}
}
// CORRIGÉ : TrustManager plateforme par défaut + pinning OkHttp
val pinner = CertificatePinner.Builder()
    .add("api.example.com", "sha256/YLh1dUR9y...")
    .add("api.example.com", "sha256/sRHdihwg...")  // ≥2 pins obligatoires
    .build()
```

### Network Security Config (pinning déclaratif)
```xml
<network-security-config>
  <base-config cleartextTrafficPermitted="false"/>
  <domain-config>
    <domain includeSubdomains="true">api.example.com</domain>
    <pin-set expiration="2027-01-01">
      <pin digest="SHA-256">HASH_PRINCIPAL=</pin>
      <pin digest="SHA-256">HASH_BACKUP=</pin>
    </pin-set>
  </domain-config>
</network-security-config>
```

### Play Integrity (SafetyNet entièrement déprécié mai 2025)
- `MEETS_STRONG_INTEGRITY` = Android 13+, attestation hardware, màj sécu < 12 mois
- Bypass via Magisk "Play Integrity Fix" — attestation hardware Android 13+ le rend difficile

### Intent Hijacking + PendingIntent mutable
```xml
<!-- VULNÉRABLE : activité exportée sans permission -->
<activity android:name=".TransferActivity" android:exported="true"/>
<!-- Attaque : adb shell am start -n com.bank/.TransferActivity --es recipient "attacker" -->

<!-- CORRIGÉ -->
<permission android:name="com.bank.permission.TRANSFER" android:protectionLevel="signature"/>
<activity android:name=".TransferActivity" android:permission="com.bank.permission.TRANSFER"/>
```

```kotlin
// VULNÉRABLE : intent vide + FLAG_MUTABLE → hijacking via fillIn()
PendingIntent.getActivity(context, 0, Intent(), PendingIntent.FLAG_MUTABLE)

// CORRIGÉ
val intent = Intent(context, MainActivity::class.java).apply {
    action = "com.bank.VIEW"; setPackage(context.packageName)
}
PendingIntent.getActivity(context, 0, intent, FLAG_IMMUTABLE or FLAG_ONE_SHOT)
```

---

## Cross-platform

### CVE-2025-11953 (React Native CLI, CVSS 9.8) — RCE
`/open-url` du serveur Metro passe l'input à `open()` sans sanitisation + bind sur interfaces externes par défaut.

### Flutter — reFlutter bypass SSL pinning
`reFlutter` patche `libflutter.so` — contourne tout pinning. Détection jailbreak Flutter bypassable en 11 lignes Frida (retourne un booléen).

### Kotlin Multiplatform — secrets dans commonMain exposés sur toutes plateformes
```kotlin
// commonMain : expect object AppSecrets { val apiKey: String }
// androidMain : BuildConfig.API_KEY via local.properties
// iosMain : NSBundle.mainBundle.objectForInfoDictionaryKey("API_KEY")
```

---

## OWASP Mobile Top 10 2024 (première màj depuis 2016)

| Rang | Catégorie | Nouveau |
|------|-----------|---------|
| M1 | Improper Credential Usage | ⭐ |
| M2 | Inadequate Supply Chain Security | ⭐ |
| M3 | Insecure Authentication/Authorization | — |
| M4 | Insufficient Input/Output Validation | ⭐ étendu |
| M6 | Inadequate Privacy Controls | ⭐ |

---

## Tendances 2025-2026

- **Vecteur émergent :** bibliothèques de traitement d'images (ImageIO iOS, libimagecodec Samsung) via WhatsApp/iMessage zero-click — supplante les exploits navigateur
- **Chaînes longues :** 3+ CVEs par chaîne (cost attaquant ↑ mais pas impossible)
- **Spyware commercial** = premier exploitant zero-days (18/42 zero-days en 2025 — surpasse les acteurs étatiques)
- **150+ apps** avec Firebase non authentifié exposant PII, tokens AWS, mots de passe en clair (certaines >100M téléchargements)
