# rust-runtime-hardening.md
# Blindage du runtime Rust — techniques défensives concrètes

Ce fichier documente les techniques de protection Rust à appliquer dans chaque projet du stack Tauri+Rust+React. Chaque section fournit du code compilable et des explications sur le pourquoi de chaque mesure.

---

## Vue d'ensemble

Le runtime Rust est memory-safe par défaut pour les opérations normales, mais plusieurs vecteurs d'attaque subsistent dans le code applicatif : comparaison de secrets en temps non-constant, résidus de secrets en mémoire, usage de générateurs pseudo-aléatoires inadéquats, et collections sans limite pouvant provoquer des crashs mémoire (OOM). Ces défenses s'appliquent à tout code Rust dans le backend Tauri.

---

## 1. Comparaison en temps constant : crate `subtle`

### Le problème

L'opérateur `==` en Rust s'arrête à la première différence trouvée. Pour des tokens d'authentification ou des signatures HMAC, cela crée une **timing attack** : un attaquant peut mesurer le temps de réponse pour deviner les bytes corrects un par un.

### La défense

```toml
# Cargo.toml
[dependencies]
subtle = "2.6"
```

```rust
use subtle::ConstantTimeEq;

/// Comparaison de tokens d'authentification en temps constant.
/// JAMAIS utiliser == pour comparer des secrets.
fn verify_auth_token(expected: &[u8], received: &[u8]) -> bool {
    // ConstantTimeEq garantit que le temps d'exécution ne dépend PAS
    // du contenu des bytes — impossible d'exploiter par timing.
    expected.ct_eq(received).into()
}

/// Comparaison de signatures HMAC en temps constant.
fn verify_hmac_signature(expected_sig: &[u8], computed_sig: &[u8]) -> bool {
    if expected_sig.len() != computed_sig.len() {
        // Longueurs différentes = toujours faux, mais en temps constant
        // via une opération dummy pour éviter le timing sur la longueur.
        let _ = expected_sig.ct_eq(&expected_sig);
        return false;
    }
    expected_sig.ct_eq(computed_sig).into()
}

/// PIÈGE : les extension types Dart/Rust héritent == du type sous-jacent.
/// Un newtype autour de Vec<u8> utilise == de Vec<u8> par défaut.
/// Implémenter PartialEq manuellement avec ConstantTimeEq.
#[derive(Clone)]
pub struct AuthToken(Vec<u8>);

impl PartialEq for AuthToken {
    fn eq(&self, other: &Self) -> bool {
        // Implémentation manuelle obligatoire — derive(PartialEq)
        // déléguerait à Vec<u8>::eq() qui n'est PAS en temps constant.
        self.0.ct_eq(&other.0).into()
    }
}

impl Eq for AuthToken {}

#[cfg(test)]
mod tests_timing {
    use super::*;

    #[test]
    fn test_token_comparaison_egalite() {
        let t1 = AuthToken(vec![0xAB; 32]);
        let t2 = AuthToken(vec![0xAB; 32]);
        assert!(t1 == t2);
    }

    #[test]
    fn test_token_comparaison_inegalite() {
        let t1 = AuthToken(vec![0xAB; 32]);
        let t2 = AuthToken(vec![0xCD; 32]);
        assert!(t1 != t2);
    }

    #[test]
    fn test_verify_auth_token_correct() {
        let secret = b"token_secret_32bytes_abcdefghijk";
        assert!(verify_auth_token(secret, secret));
    }

    #[test]
    fn test_verify_auth_token_incorrect() {
        let expected = b"token_secret_32bytes_abcdefghijk";
        let received  = b"token_wrong_32bytes_xxxxxxxxxxxxk";
        assert!(!verify_auth_token(expected, received));
    }
}
```

---

## 2. Zéroisation mémoire : crate `zeroize`

### Le problème

Quand une variable Rust sort de son scope, le compilateur libère la mémoire mais **n'efface pas le contenu**. Un attaquant avec accès à la mémoire du processus (dump, core dump, swap) peut retrouver des clés API, tokens, ou mots de passe. Le compilateur peut aussi éliminer les `memset()` manuels comme "dead store" — une optimisation qui supprime précisément le nettoyage prévu.

### La défense

```toml
# Cargo.toml
[dependencies]
zeroize = { version = "1.8", features = ["derive", "alloc"] }
secrecy = { version = "0.10", features = ["alloc"] }
```

```rust
use zeroize::{Zeroize, ZeroizeOnDrop};
use secrecy::{SecretString, ExposeSecret};

/// Newtype pour données sensibles avec zéroisation automatique.
/// Drop efface les bytes via write_volatile (résiste aux optimisations).
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct SensitiveBytes(Vec<u8>);

impl SensitiveBytes {
    pub fn new(data: Vec<u8>) -> Self {
        Self(data)
    }

    /// Accès temporaire aux données — expose uniquement le temps nécessaire.
    pub fn expose(&self) -> &[u8] {
        &self.0
    }
}

/// Struct avec plusieurs champs sensibles — tous zéroïsés au drop.
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct ApiCredentials {
    api_key: Vec<u8>,
    session_token: Vec<u8>,
    hmac_secret: [u8; 32],
}

impl ApiCredentials {
    pub fn new(api_key: &str, session_token: &str, hmac_secret: [u8; 32]) -> Self {
        Self {
            api_key: api_key.as_bytes().to_vec(),
            session_token: session_token.as_bytes().to_vec(),
            hmac_secret,
        }
    }
}

/// Utilisation de SecretString de la crate secrecy.
/// Debug affiche "[REDACTED]" — impossible de logger accidentellement.
/// Clone est interdit par design.
/// Serialize est interdit par défaut.
fn stocker_cle_api(raw_key: String) {
    let secret: SecretString = raw_key.into();

    // Seule façon d'accéder à la valeur : expose_secret()
    // Chaque appel est visible dans le code source — facilement auditable.
    let valeur = secret.expose_secret();

    // Utilisation de la valeur...
    let _ = valeur.len(); // exemple

    // À la fin du scope, SecretString zéroïse automatiquement la mémoire.
}

/// Zéroisation manuelle explicite avant libération.
/// Utile quand on ne peut pas utiliser ZeroizeOnDrop (code bas niveau).
fn traiter_secret_temporaire() {
    let mut cle_temporaire = vec![0u8; 32];
    // ... remplir la clé ...

    // Utilisation...
    let _ = cle_temporaire.len();

    // Zéroisation AVANT que le Vec soit droppé.
    cle_temporaire.zeroize();
    // La mémoire sera libérée maintenant, mais les bytes valent 0.
}

/// Zéroisation de strings intermédiaires contenant des secrets.
fn construire_header_auth(api_key: &SecretString) -> String {
    let mut header_value = format!("Bearer {}", api_key.expose_secret());
    // ... envoyer la requête HTTP ...

    // Zéroiser la string intermédiaire après usage.
    header_value.zeroize();
    // Ne pas retourner header_value ici — elle vaut "".
    // Retourner ce qui est nécessaire, pas le secret.
    "ok".to_string()
}

#[cfg(test)]
mod tests_zeroize {
    use super::*;

    #[test]
    fn test_sensitive_bytes_contenu_accessible() {
        let data = vec![1u8, 2, 3, 4];
        let sb = SensitiveBytes::new(data.clone());
        assert_eq!(sb.expose(), &data);
    }

    #[test]
    fn test_api_credentials_creation() {
        let creds = ApiCredentials::new("sk-test", "tok-abc", [0xFFu8; 32]);
        assert_eq!(creds.api_key, b"sk-test");
    }
}
```

---

## 3. Newtype pattern pour données sensibles

### Le problème

Passer des `String` ou `Vec<u8>` bruts dans des fonctions crée des risques : mauvais ordre d'arguments, logging accidentel via `Debug`, sérialisation involontaire. Le type `String` Rust ne zéroïse pas à la libération et peut être cloné librement.

### La défense : struct SecretString maison avec Drop + Zeroize

```rust
use zeroize::Zeroize;
use std::fmt;

/// Wrapper pour clés API — empêche affichage, clonage, et sérialisation.
pub struct SecretApiKey {
    inner: Vec<u8>,
}

impl SecretApiKey {
    /// Constructeur — valide le format avant de stocker.
    pub fn from_str(raw: &str) -> Result<Self, SecretKeyError> {
        if raw.len() < 20 {
            return Err(SecretKeyError::TropCourt);
        }
        if raw.len() > 256 {
            return Err(SecretKeyError::TropLong);
        }
        Ok(Self { inner: raw.as_bytes().to_vec() })
    }

    /// Expose la valeur uniquement le temps d'un appel.
    pub fn expose_secret(&self) -> &str {
        // Sûr car on contrôle la construction : toujours de l'UTF-8 valide.
        std::str::from_utf8(&self.inner).unwrap_or("")
    }

    /// Masquage pour affichage UI : "sk-ant-••••••1234"
    pub fn masquer(&self) -> String {
        let s = self.expose_secret();
        if s.len() <= 12 {
            return "••••••••".to_string();
        }
        let prefix_end = s.find('-')
            .map(|i| (i + 1).min(10))
            .unwrap_or(4);
        let suffix_start = s.len().saturating_sub(4);
        format!("{}••••••{}", &s[..prefix_end], &s[suffix_start..])
    }
}

/// Drop zéroïse la mémoire — protection contre les core dumps.
impl Drop for SecretApiKey {
    fn drop(&mut self) {
        self.inner.zeroize();
    }
}

/// Debug n'affiche pas la valeur — protection contre le logging accidentel.
impl fmt::Debug for SecretApiKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("SecretApiKey([REDACTED])")
    }
}

/// Display n'affiche pas la valeur non plus.
impl fmt::Display for SecretApiKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("[REDACTED]")
    }
}

#[derive(Debug, thiserror::Error)]
pub enum SecretKeyError {
    #[error("Clé trop courte (minimum 20 caractères)")]
    TropCourt,
    #[error("Clé trop longue (maximum 256 caractères)")]
    TropLong,
}

#[cfg(test)]
mod tests_newtype {
    use super::*;

    #[test]
    fn test_masquage() {
        let k = SecretApiKey::from_str("sk-ant-api03-AbCdEfGhIjKlMnOp1234").unwrap();
        let masque = k.masquer();
        assert!(masque.contains("••••••"));
        assert!(!masque.contains("AbCdEf"));
        assert!(masque.ends_with("1234"));
    }

    #[test]
    fn test_debug_ne_revele_pas_secret() {
        let k = SecretApiKey::from_str("sk-secret-valeur-tres-importante").unwrap();
        let debug_str = format!("{:?}", k);
        assert!(!debug_str.contains("secret-valeur"));
        assert!(debug_str.contains("REDACTED"));
    }

    #[test]
    fn test_trop_court_rejete() {
        assert!(SecretApiKey::from_str("court").is_err());
    }
}
```

---

## 4. CSPRNG : `OsRng` et `ChaCha20Rng`

### Le problème

`rand::thread_rng()` est un générateur pseudo-aléatoire rapide, adapté aux simulations et jeux. Pour des secrets cryptographiques (clés, nonces, tokens), il ne fournit **pas les garanties de sécurité nécessaires** : il peut être prévisible si l'état interne est compromis.

### La défense

```toml
[dependencies]
rand = { version = "0.8", features = ["std", "std_rng"] }
rand_chacha = "0.3"
ring = "0.17"
```

```rust
use rand::RngCore;
use rand::rngs::OsRng;
use rand_chacha::ChaCha20Rng;
use rand::SeedableRng;

/// Génération d'un nonce IPC — OsRng lit depuis /dev/urandom ou l'équivalent OS.
/// C'est le RNG à utiliser pour TOUS les secrets cryptographiques.
pub fn generer_nonce_ipc() -> [u8; 32] {
    let mut nonce = [0u8; 32];
    OsRng.fill_bytes(&mut nonce);
    nonce
}

/// Génération d'une clé de session — OsRng garanti CSPRNG.
pub fn generer_cle_session() -> Vec<u8> {
    let mut key = vec![0u8; 32];
    OsRng.fill_bytes(&mut key);
    key
}

/// ChaCha20Rng : CSPRNG seedé depuis OsRng.
/// Avantage sur OsRng direct : génération en lot plus rapide, déterministe
/// une fois seedé (utile pour les tests).
pub fn generer_plusieurs_nonces(count: usize) -> Vec<[u8; 16]> {
    // Seed depuis OsRng — la sécurité vient de la seed, pas du générateur seul.
    let mut rng = ChaCha20Rng::from_rng(OsRng).expect("OsRng indisponible");
    (0..count).map(|_| {
        let mut nonce = [0u8; 16];
        rng.fill_bytes(&mut nonce);
        nonce
    }).collect()
}

/// INTERDIT pour les secrets cryptographiques :
///   rand::thread_rng()   — pas garanti CSPRNG selon la plateforme
///   rand::random::<u64>() — utilise thread_rng en interne
///
/// AUTORISÉ pour les secrets :
///   OsRng.fill_bytes()
///   ChaCha20Rng::from_rng(OsRng)
///   ring::rand::SystemRandom
fn exemple_ring_osrng() {
    use ring::rand::{SecureRandom, SystemRandom};
    let rng = SystemRandom::new();
    let mut key = [0u8; 32];
    rng.fill(&mut key).expect("SystemRandom indisponible");
}

#[cfg(test)]
mod tests_csprng {
    use super::*;

    #[test]
    fn test_nonces_uniques() {
        let n1 = generer_nonce_ipc();
        let n2 = generer_nonce_ipc();
        // La probabilité de collision est 1/2^256 — acceptable comme test.
        assert_ne!(n1, n2);
    }

    #[test]
    fn test_cle_session_longueur() {
        let cle = generer_cle_session();
        assert_eq!(cle.len(), 32);
    }

    #[test]
    fn test_nonces_multiples_uniques() {
        let nonces = generer_plusieurs_nonces(100);
        let unique: std::collections::HashSet<_> = nonces.iter().collect();
        assert_eq!(unique.len(), 100);
    }
}
```

---

## 5. Gestion d'erreurs sécurisée : `thiserror` + fail closed

### Le problème

`unwrap()` panique en production et peut révéler des informations internes. Les `catch (_) {}` vides avalent les erreurs silencieusement, laissant l'application dans un état incertain. Les messages d'erreur envoyés au frontend peuvent fuiter des chemins, des noms de tables SQL, ou des stack traces.

### La défense

```toml
[dependencies]
thiserror = "2"
tracing = "0.1"
```

```rust
use thiserror::Error;

/// Erreurs internes détaillées — jamais envoyées au frontend.
#[derive(Debug, Error)]
pub enum AppError {
    #[error("Erreur base de données : {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Erreur keyring : {0}")]
    Keyring(String),

    #[error("Entrée invalide : {reason}")]
    ValidationInput { reason: String },

    #[error("Intégrité compromise : {component}")]
    IntegrityCheck { component: String },

    #[error("Opération non autorisée")]
    Unauthorized,
}

/// Messages d'erreur génériques pour le frontend.
/// JAMAIS envoyer AppError directement — il contient des infos internes.
#[derive(Debug, serde::Serialize)]
pub struct FrontendError {
    pub code: &'static str,
    pub message: &'static str,
}

impl FrontendError {
    fn depuis_app_error(e: &AppError) -> Self {
        match e {
            AppError::Database(_) => FrontendError {
                code: "DB_ERROR",
                message: "Erreur de base de données",
            },
            AppError::Keyring(_) => FrontendError {
                code: "KEYRING_ERROR",
                message: "Erreur d'accès aux secrets",
            },
            AppError::ValidationInput { .. } => FrontendError {
                code: "VALIDATION_ERROR",
                message: "Données invalides",
            },
            AppError::IntegrityCheck { .. } => FrontendError {
                code: "INTEGRITY_ERROR",
                message: "Vérification d'intégrité échouée",
            },
            AppError::Unauthorized => FrontendError {
                code: "UNAUTHORIZED",
                message: "Opération non autorisée",
            },
        }
    }
}

/// Commande Tauri — conversion d'erreur sécurisée.
#[tauri::command]
async fn get_article(id: i64) -> Result<Article, FrontendError> {
    recuperer_article_interne(id).map_err(|e| {
        // Log interne complet avec tous les détails.
        tracing::error!(
            error = %e,
            error_debug = ?e,
            article_id = id,
            "Erreur lors de la récupération d'article"
        );
        // Message générique vers le frontend — zéro info interne.
        FrontendError::depuis_app_error(&e)
    })
}

fn recuperer_article_interne(id: i64) -> Result<Article, AppError> {
    // Fail closed : si la validation échoue, on bloque, on ne laisse pas passer.
    if id <= 0 {
        return Err(AppError::ValidationInput {
            reason: "L'ID doit être positif".into(),
        });
    }
    // ... logique réelle ...
    todo!()
}

/// Structure placeholder pour la compilation.
#[derive(Debug, serde::Serialize)]
pub struct Article { pub id: i64 }
```

---

## 6. Validation d'entrées : crate `regex` + limites strictes

### Le problème

Toute donnée venant du frontend ou d'une source externe est potentiellement hostile. Les entrées non validées peuvent provoquer des injections (SQL, chemin, argument), des débordements mémoire, ou des comportements inattendus.

### La défense

```toml
[dependencies]
regex = "1.11"
once_cell = "1.20"
url = "2.5"
```

```rust
use regex::Regex;
use once_cell::sync::Lazy;
use std::net::IpAddr;

/// Regex compilées une seule fois au démarrage (pas de recompilation à chaque appel).
static RE_NOM_FICHIER: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^[a-zA-Z0-9][a-zA-Z0-9_\-\.]{0,62}[a-zA-Z0-9]$").unwrap()
});

static RE_KEYWORD: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^[a-zA-Z0-9][a-zA-Z0-9 _\-\.,]{0,98}$").unwrap()
});

static RE_IDENTIFIANT: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^[a-zA-Z0-9_]{1,64}$").unwrap()
});

/// Validation complète d'un nom de fichier de sortie.
pub fn valider_nom_fichier(nom: &str) -> Result<String, String> {
    // 1. Longueur
    if nom.is_empty() {
        return Err("Nom de fichier vide".into());
    }
    if nom.len() > 64 {
        return Err(format!("Nom de fichier trop long : {} > 64", nom.len()));
    }
    // 2. Octets nuls
    if nom.contains('\0') {
        return Err("Octets nuls interdits".into());
    }
    // 3. Traversée de chemin
    if nom.contains("..") || nom.contains('/') || nom.contains('\\') {
        return Err("Traversée de chemin interdite".into());
    }
    // 4. Noms de devices Windows réservés
    const RESERVED: &[&str] = &[
        "CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
    ];
    let stem_upper = nom.split('.').next().unwrap_or("").to_uppercase();
    if RESERVED.contains(&stem_upper.as_str()) {
        return Err(format!("Nom de device réservé Windows : {}", stem_upper));
    }
    // 5. Format regex
    if !RE_NOM_FICHIER.is_match(nom) {
        return Err("Format invalide : alphanumériques, tirets, underscores uniquement".into());
    }
    Ok(nom.to_string())
}

/// Validation d'une URL — uniquement HTTPS, pas d'IP privées.
pub fn valider_url(url_str: &str) -> Result<url::Url, String> {
    if url_str.len() > 2048 {
        return Err("URL trop longue (max 2048 caractères)".into());
    }
    let parsed = url::Url::parse(url_str)
        .map_err(|e| format!("URL malformée : {}", e))?;

    if parsed.scheme() != "https" {
        return Err(format!("Seul https:// est autorisé, reçu : {}", parsed.scheme()));
    }
    if parsed.username() != "" || parsed.password().is_some() {
        return Err("Credentials dans l'URL interdits".into());
    }
    let host = parsed.host_str().ok_or("L'URL doit avoir un hostname")?;
    if est_hote_prive(host) {
        return Err(format!("Hôte interne/privé interdit : {}", host));
    }
    Ok(parsed)
}

fn est_hote_prive(host: &str) -> bool {
    let lower = host.to_lowercase();
    const HOTES_BLOQUES: &[&str] = &[
        "localhost", "127.0.0.1", "169.254.169.254",
        "metadata.google.internal", "0.0.0.0",
    ];
    if HOTES_BLOQUES.contains(&lower.as_str()) || lower.ends_with(".internal") {
        return true;
    }
    if let Ok(ip) = host.parse::<IpAddr>() {
        return match ip {
            IpAddr::V4(v4) => v4.is_loopback() || v4.is_private()
                || v4.is_link_local() || v4.is_unspecified(),
            IpAddr::V6(v6) => v6.is_loopback() || v6.is_unspecified(),
        };
    }
    // Encodages numériques (hex, octal, décimal entier)
    host.starts_with("0x") || host.starts_with("0o") ||
    host.chars().all(|c| c.is_ascii_digit() || c == '.')
}

/// Validation d'un keyword de recherche.
pub fn valider_keyword(kw: &str) -> Result<String, String> {
    if kw.is_empty() {
        return Err("Keyword vide".into());
    }
    if kw.len() > 100 {
        return Err(format!("Keyword trop long : {} > 100", kw.len()));
    }
    if kw.starts_with('-') {
        return Err("Les keywords ne doivent pas commencer par '-' (injection d'option)".into());
    }
    if !RE_KEYWORD.is_match(kw) {
        return Err("Caractères interdits dans le keyword".into());
    }
    Ok(kw.to_string())
}

#[cfg(test)]
mod tests_validation {
    use super::*;

    #[test]
    fn test_nom_fichier_valide() {
        assert!(valider_nom_fichier("rapport_2026").is_ok());
        assert!(valider_nom_fichier("scan-results").is_ok());
    }

    #[test]
    fn test_nom_fichier_traversal_rejete() {
        assert!(valider_nom_fichier("../../etc/passwd").is_err());
        assert!(valider_nom_fichier("../evil").is_err());
    }

    #[test]
    fn test_nom_fichier_device_windows_rejete() {
        assert!(valider_nom_fichier("CON").is_err());
        assert!(valider_nom_fichier("NUL.txt").is_err());
    }

    #[test]
    fn test_url_https_valide() {
        assert!(valider_url("https://example.com/articles").is_ok());
    }

    #[test]
    fn test_url_http_rejete() {
        assert!(valider_url("http://example.com").is_err());
    }

    #[test]
    fn test_url_localhost_rejete() {
        assert!(valider_url("https://localhost/admin").is_err());
        assert!(valider_url("https://169.254.169.254/meta").is_err());
    }

    #[test]
    fn test_keyword_tiret_debut_rejete() {
        assert!(valider_keyword("--config=/tmp/evil").is_err());
    }
}
```

---

## 7. Collections bornées : HashMap avec limite et éviction LRU

### Le problème

Une `HashMap` qui grandit sans limite peut provoquer un crash mémoire (OOM) si la taille dépend d'une entrée externe : sessions utilisateur, IPs de connexion, IDs de messages. Un attaquant envoie des millions d'entrées uniques et fait crasher l'application.

### La défense

```toml
[dependencies]
lru = "0.12"
```

```rust
use std::collections::HashMap;
use lru::LruCache;
use std::num::NonZeroUsize;
use std::net::IpAddr;
use std::time::{Duration, Instant};

/// Cache LRU borné pour les nonces anti-replay.
/// Quand la limite est atteinte, le nonce le plus anciennement vu est évincé.
pub struct NonceCache {
    cache: LruCache<[u8; 32], Instant>,
    ttl: Duration,
}

impl NonceCache {
    /// Capacité maximale : 10 000 nonces.
    /// Un nonce de 32 bytes → 10 000 * (32 + 8) bytes ≈ 400 Ko maximum.
    pub fn new(max_capacity: usize, ttl: Duration) -> Self {
        Self {
            cache: LruCache::new(NonZeroUsize::new(max_capacity).unwrap()),
            ttl,
        }
    }

    /// Retourne false si le nonce a déjà été vu (replay détecté).
    pub fn inserer(&mut self, nonce: [u8; 32]) -> bool {
        let maintenant = Instant::now();
        // Nettoyage des nonces expirés (pas à chaque insertion pour les perfs).
        if self.cache.len() > self.cache.cap().get() / 2 {
            self.nettoyer_expires(maintenant);
        }
        if self.cache.contains(&nonce) {
            return false; // Replay détecté
        }
        self.cache.put(nonce, maintenant);
        true
    }

    fn nettoyer_expires(&mut self, maintenant: Instant) {
        let ttl = self.ttl;
        // LruCache ne supporte pas le drain conditionnel direct —
        // on itère et collecte les clés à supprimer.
        let a_supprimer: Vec<[u8; 32]> = self.cache.iter()
            .filter(|(_, ts)| maintenant.duration_since(**ts) > ttl)
            .map(|(k, _)| *k)
            .collect();
        for k in a_supprimer {
            self.cache.pop(&k);
        }
    }
}

/// Rate limiter par IP avec limite stricte.
pub struct RateLimiter {
    /// Clé = IP, Valeur = (timestamp premier hit, nombre de hits)
    compteurs: HashMap<IpAddr, (Instant, u32)>,
    max_par_ip: u32,
    fenetre: Duration,
    max_ips: usize,
}

impl RateLimiter {
    pub fn new(max_par_ip: u32, fenetre: Duration, max_ips: usize) -> Self {
        Self {
            compteurs: HashMap::with_capacity(max_ips),
            max_par_ip,
            fenetre,
            max_ips,
        }
    }

    /// Retourne true si la requête est autorisée.
    pub fn autoriser(&mut self, ip: IpAddr) -> bool {
        let maintenant = Instant::now();

        // Éviction si trop d'IPs : supprimer les entrées expirées d'abord.
        if self.compteurs.len() >= self.max_ips {
            let fenetre = self.fenetre;
            self.compteurs.retain(|_, (ts, _)| {
                maintenant.duration_since(*ts) < fenetre
            });
            // Si toujours trop plein après nettoyage : refuser la nouvelle IP.
            if self.compteurs.len() >= self.max_ips {
                return false;
            }
        }

        let entree = self.compteurs.entry(ip).or_insert((maintenant, 0));
        if maintenant.duration_since(entree.0) >= self.fenetre {
            // Fenêtre expirée : reset du compteur.
            *entree = (maintenant, 1);
            true
        } else if entree.1 < self.max_par_ip {
            entree.1 += 1;
            true
        } else {
            false // Limite atteinte
        }
    }
}

#[cfg(test)]
mod tests_collections {
    use super::*;

    #[test]
    fn test_nonce_cache_anti_replay() {
        let mut cache = NonceCache::new(100, Duration::from_secs(30));
        let nonce = [0x42u8; 32];
        assert!(cache.inserer(nonce));   // Premier usage : OK
        assert!(!cache.inserer(nonce));  // Replay : refusé
    }

    #[test]
    fn test_nonce_cache_borne() {
        let mut cache = NonceCache::new(10, Duration::from_secs(30));
        for i in 0u8..15 {
            let mut nonce = [0u8; 32];
            nonce[0] = i;
            cache.inserer(nonce); // Ne doit pas paniquer
        }
        // La taille ne dépasse jamais 10.
        assert!(cache.cache.len() <= 10);
    }

    #[test]
    fn test_rate_limiter_limite() {
        let ip: IpAddr = "1.2.3.4".parse().unwrap();
        let mut limiter = RateLimiter::new(3, Duration::from_secs(60), 1000);
        assert!(limiter.autoriser(ip));  // 1
        assert!(limiter.autoriser(ip));  // 2
        assert!(limiter.autoriser(ip));  // 3
        assert!(!limiter.autoriser(ip)); // 4 — refusé
    }
}
```

---

## 8. Type-state pattern pour workflows critiques

### Le problème

Certains workflows doivent être exécutés dans un ordre strict : valider avant d'exécuter, authentifier avant d'autoriser. Si l'ordre peut être contourné par une erreur de code, la sécurité est compromise au niveau de la logique métier.

### La défense : enforce au niveau des types (erreur de compilation si mauvais ordre)

```rust
use std::marker::PhantomData;

/// États du workflow de lancement de sidecar.
pub struct NonValide;
pub struct Valide;
pub struct IntegritéVerifiee;

/// La configuration de sidecar évolue d'état en état.
/// On ne peut pas appeler `lancer()` sans avoir d'abord `valider()` et `verifier_integrite()`.
pub struct ConfigSidecar<Etat> {
    urls: Vec<String>,
    output_name: String,
    keywords: Vec<String>,
    _etat: PhantomData<Etat>,
}

impl ConfigSidecar<NonValide> {
    pub fn new(urls: Vec<String>, output_name: String, keywords: Vec<String>) -> Self {
        Self { urls, output_name, keywords, _etat: PhantomData }
    }

    /// Valide toutes les entrées — retourne une config validée ou une erreur.
    pub fn valider(self) -> Result<ConfigSidecar<Valide>, String> {
        for url in &self.urls {
            valider_url(url).map_err(|e| format!("URL invalide : {}", e))?;
        }
        valider_nom_fichier(&self.output_name)?;
        for kw in &self.keywords {
            valider_keyword(kw)?;
        }
        Ok(ConfigSidecar {
            urls: self.urls,
            output_name: self.output_name,
            keywords: self.keywords,
            _etat: PhantomData,
        })
    }
}

impl ConfigSidecar<Valide> {
    /// Vérifie l'intégrité SHA-256 du binaire sidecar.
    pub fn verifier_integrite(self) -> Result<ConfigSidecar<IntegritéVerifiee>, String> {
        // Vérification réelle du hash — voir ipc-sidecar-hardening.md
        // pour l'implémentation complète avec build.rs.
        let _attendu = env!("SIDECAR_SHA256");
        // ... vérification ...
        Ok(ConfigSidecar {
            urls: self.urls,
            output_name: self.output_name,
            keywords: self.keywords,
            _etat: PhantomData,
        })
    }
}

impl ConfigSidecar<IntegritéVerifiee> {
    /// Lancement sécurisé — uniquement accessible après validation ET vérification.
    /// Impossible d'appeler cette méthode sur ConfigSidecar<NonValide> ou <Valide>.
    pub fn lancer(self, app: &tauri::AppHandle) -> Result<(), String> {
        // Le type garantit au niveau de la compilation que validation
        // et vérification d'intégrité ont été effectuées.
        let _ = app; // Utilisation réelle de l'AppHandle ici
        Ok(())
    }
}

/// Utilisation — le compilateur empêche les raccourcis.
fn exemple_type_state(app: &tauri::AppHandle) -> Result<(), String> {
    let config = ConfigSidecar::<NonValide>::new(
        vec!["https://example.com".into()],
        "resultat".into(),
        vec!["mot-cle".into()],
    );

    // Cette ligne ne compile PAS — lancer() n'existe pas sur NonValide :
    // config.lancer(app)?; // Erreur de compilation

    config
        .valider()?          // NonValide → Valide
        .verifier_integrite()? // Valide → IntegritéVerifiee
        .lancer(app)          // IntegritéVerifiee → exécution
}
```

---

## 9. Audit des blocs `unsafe`

### Le problème

Les blocs `unsafe` contournent les garanties de sécurité mémoire de Rust. Un `unsafe` injustifié ou mal utilisé peut introduire des corruptions mémoire, des use-after-free, ou des data races.

### La défense : recenser, justifier, encapsuler

```rust
/// Règle : chaque bloc unsafe doit avoir :
/// 1. Un commentaire SAFETY: expliquant pourquoi c'est sûr.
/// 2. Une encapsulation dans une fonction safe avec invariants documentés.
/// 3. Un test unitaire couvrant les cas limites.

/// MAUVAIS : unsafe sans justification, sans encapsulation.
// unsafe { std::ptr::write_volatile(ptr, 0); }

/// BON : encapsulé dans une fonction safe avec invariants documentés.
///
/// Efface de façon volatile des bytes en mémoire.
/// Résiste à l'élimination des "dead stores" par le compilateur.
///
/// # Sécurité
///
/// L'appelant doit garantir que `slice` pointe vers une mémoire valide
/// et que personne d'autre n'accède à cette mémoire pendant l'appel.
pub fn effacement_volatile(slice: &mut [u8]) {
    for byte in slice.iter_mut() {
        // SAFETY: byte est une référence mutable valide fournie par l'itérateur.
        // write_volatile empêche le compilateur d'éliminer cette écriture
        // comme "dead store optimization". C'est l'unique usage légitime
        // de write_volatile ici — l'élimination d'optimisation est délibérée.
        unsafe {
            std::ptr::write_volatile(byte, 0u8);
        }
    }
    // Barrière mémoire pour empêcher la réorganisation par le CPU.
    std::sync::atomic::fence(std::sync::atomic::Ordering::SeqCst);
}

/// Vérification de la présence de blocs unsafe dans une PR :
/// La commande suivante dans la CI liste tous les unsafe blocks :
///   cargo geiger --all-targets 2>/dev/null
///   grep -rn "unsafe {" src-tauri/src/
///
/// Objectif : chaque unsafe doit avoir un commentaire SAFETY: adjacent.

#[cfg(test)]
mod tests_unsafe {
    use super::*;

    #[test]
    fn test_effacement_volatile_met_a_zero() {
        let mut data = vec![0xABu8; 16];
        effacement_volatile(&mut data);
        assert!(data.iter().all(|&b| b == 0));
    }
}
```

---

## Checklist d'implémentation Rust

- [ ] Toutes les comparaisons de secrets utilisent `subtle::ConstantTimeEq` — jamais `==`
- [ ] Les types secrets utilisent `zeroize::ZeroizeOnDrop` ou `secrecy::SecretString`
- [ ] `SecretString` ne dérive jamais `Clone` ni `Serialize` sans revue explicite
- [ ] Les secrets sont encapsulés dans des newtypes avec `Debug` personnalisé affichant `[REDACTED]`
- [ ] Toute génération de secret utilise `OsRng` ou `ChaCha20Rng::from_rng(OsRng)`
- [ ] `rand::thread_rng()` n'est jamais utilisé pour des secrets cryptographiques
- [ ] Les erreurs internes (rusqlite, keyring) ne sont jamais propagées directement au frontend
- [ ] Chaque frontière `#[tauri::command]` mappe les erreurs vers un type `FrontendError` générique
- [ ] Toute entrée externe est validée : longueur, format regex, absence de `..` et `/`
- [ ] Les `HashMap` et `Vec` dont la taille dépend d'une entrée externe ont une limite `max_entries`
- [ ] Les blocs `unsafe` ont un commentaire `// SAFETY:` justificatif adjacent
- [ ] `cargo clippy -- -W clippy::unwrap_used -W clippy::expect_used` passe sans warnings
- [ ] `cargo geiger` recense tous les unsafe blocks dans les dépendances
- [ ] `cargo audit` est exécuté en CI à chaque PR et hebdomadairement
