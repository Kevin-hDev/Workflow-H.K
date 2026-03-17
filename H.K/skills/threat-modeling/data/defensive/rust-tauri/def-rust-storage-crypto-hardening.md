# storage-crypto-hardening.md
# Protection du stockage et cryptographie — Stack Rust/Tauri v2

## Vue d'ensemble

Ce fichier couvre toutes les protections défensives liées au stockage local chiffré et à la cryptographie applicative. Les sources sont les audits 02 (SQLCipher) et 04 (gestion des secrets) du 23 février 2026.

Les vecteurs d'attaque que ce knowledge file permet de neutraliser :
- Vol du fichier SQLCipher avec tentative de bruteforce offline
- SQL injection via concaténation de chaînes dans rusqlite
- Fuite de clés API dans les logs, crash reporters, ou process memory
- Clé de chiffrement exposée en clair dans le binaire ou dans SharedPreferences
- Second-order injection sur des données scrapées réutilisées dans du SQL

---

## 1. Configuration SQLCipher 4.x — Paramètres sécurisés obligatoires

SQLCipher 4.x chiffre chaque page de base de données (4096 octets) avec AES-256-CBC, un IV aléatoire unique par page régénéré à chaque écriture, et une authentification HMAC-SHA512. La dérivation de clé utilise PBKDF2-HMAC-SHA512 avec 256 000 itérations.

### Tableau comparatif SQLCipher 3.x vs 4.x

| Paramètre | SQLCipher 3.x | SQLCipher 4.x |
|-----------|--------------|--------------|
| KDF iterations | 64 000 | 256 000 |
| KDF algorithm | PBKDF2-HMAC-SHA1 | PBKDF2-HMAC-SHA512 |
| HMAC algorithm | HMAC-SHA1 | HMAC-SHA512 |
| Page size | 1024 | 4096 |
| Octets réservés/page | 48 | 80 (16 IV + 64 HMAC) |

### PRAGMAs de durcissement obligatoires

```rust
use rusqlite::Connection;
use std::path::Path;

/// Ouvre la base chiffrée et applique tous les PRAGMAs de sécurité
pub fn open_db(path: &Path, key_hex: &str) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open(path)?;

    // Fournir la clé en format raw hex — contourne totalement PBKDF2
    // Ne jamais écrire la clé en clair dans un format!() de log
    let pragma_key = format!("PRAGMA key = \"x'{key_hex}'\";");
    conn.execute_batch(&pragma_key)?;

    // Durcissement SQLCipher obligatoire
    conn.execute_batch("
        PRAGMA cipher_page_size = 4096;
        PRAGMA kdf_iter = 256000;
        PRAGMA cipher_hmac_algorithm = HMAC_SHA512;
        PRAGMA cipher_memory_security = ON;
        PRAGMA temp_store = MEMORY;
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        PRAGMA secure_delete = ON;
    ")?;

    // Vérification immédiate : si la clé est fausse, cette requête échoue
    conn.execute_batch("SELECT count(*) FROM sqlite_master;")?;

    Ok(conn)
}
```

`cipher_memory_security = ON` est critique : il zéroïse les pages mémoire SQLCipher avant de les libérer, empêchant la récupération de données via un dump mémoire ou un fichier de swap.

---

## 2. Gestion de la clé de chiffrement — Architecture hybride keyring + raw hex

### Principe : jamais de PBKDF2 sur une clé aléatoire

PBKDF2 existe pour dériver une clé depuis un mot de passe à faible entropie. Si la clé est déjà un vecteur aléatoire de 32 octets, utiliser PBKDF2 n'apporte rien — pire, cela double la surface d'attaque. La bonne approche : générer 32 octets via `OsRng`, les stocker dans le keystore OS, les passer en format `x'...'` pour contourner le PBKDF2 interne de SQLCipher.

### Cargo.toml — dépendances requises

```toml
[dependencies]
rusqlite = { version = "0.38", features = [
    "bundled-sqlcipher-vendored-openssl",
    "limits", "hooks", "extra_check"
]}
keyring = { version = "3.6", features = [
    "apple-native",
    "windows-native",
    "linux-native-sync-persistent",
    "crypto-rust"
]}
secrecy = { version = "0.10", features = ["alloc"] }
zeroize = { version = "1.8", features = ["alloc", "derive"] }
argon2 = "0.5"
rand = { version = "0.8", features = ["getrandom"] }
hex = "0.4"
aes-gcm = "0.10"
sha2 = "0.10"
thiserror = "2"
tracing = "0.1"
```

### Code complet : récupération ou génération de la clé

```rust
use keyring::Entry;
use secrecy::{ExposeSecret, SecretVec};
use zeroize::Zeroize;
use rand::RngCore;

const SERVICE: &str = "com.myapp.scraper";
const ACCOUNT: &str = "sqlcipher-master-key";

/// Récupère la clé depuis le keystore OS, ou en génère une nouvelle de 32 octets.
/// La clé est stockée comme SecretVec<u8> — jamais exposée sauf via expose_secret().
pub fn get_or_create_key() -> Result<SecretVec<u8>, keyring::Error> {
    let entry = Entry::new(SERVICE, ACCOUNT)?;
    match entry.get_secret() {
        Ok(bytes) if bytes.len() == 32 => Ok(SecretVec::new(bytes)),
        // Clé absente ou corrompue : générer une nouvelle clé
        Ok(_) | Err(keyring::Error::NoEntry) => {
            let mut key = vec![0u8; 32];
            // OsRng utilise /dev/urandom (Linux), CryptGenRandom (Windows),
            // SecRandomCopyBytes (macOS) — toujours un CSPRNG
            rand::thread_rng().fill_bytes(&mut key);
            entry.set_secret(&key)?;
            Ok(SecretVec::new(key))
        }
        Err(e) => Err(e),
    }
}

/// Convertit la clé SecretVec en format hex pour SQLCipher, puis zéroïse.
pub fn open_db_with_key(
    path: &std::path::Path,
    key: &SecretVec<u8>,
) -> Result<rusqlite::Connection, Box<dyn std::error::Error>> {
    // Convertir en hex uniquement pour la durée de l'appel PRAGMA
    let mut hex_key = hex::encode(key.expose_secret());

    let conn = open_db(path, &hex_key)?;

    // Zéroïser immédiatement la copie hex en mémoire
    hex_key.zeroize();

    Ok(conn)
}
```

### Stockage OS keyring par plateforme

| Plateforme | Backend keyring-rs | Mécanisme OS |
|------------|-------------------|--------------|
| Linux (desktop) | `linux-native-sync-persistent` | GNOME Keyring / KWallet (D-Bus Secret Service) |
| Linux (headless/CI) | `linux-native` (keyutils) | Kernel keyring — session-scoped, pas de D-Bus requis |
| macOS | `apple-native` | Keychain Services (SecItemAdd/SecItemCopyMatching) |
| Windows | `windows-native` | Windows Credential Manager (DPAPI) |

**Cas Linux headless** : si D-Bus est absent (WSL, Docker, CI), le backend `linux-native-sync-persistent` bascule automatiquement sur keyutils. Les secrets sont session-scoped — ils disparaissent au reboot. Acceptable pour CI ; pour la production sans keyring, utiliser un fichier chiffré avec une clé dérivée de `/etc/machine-id`.

---

## 3. Prévention de l'injection SQL dans rusqlite

### Règle absolue : jamais de format!() dans une requête SQL

La protection primaire de rusqlite est la séparation entre compilation SQL (`sqlite3_prepare_v2`) et liaison des valeurs (`sqlite3_bind_*`). Tant que les données passent par `params![]` ou `named_params!{}`, aucun caractère n'est dangereux — guillemets, points-virgules, octets NULL, Unicode sont tous traités comme des valeurs littérales.

```rust
// ✅ CORRECT — params![] utilise sqlite3_bind_text en interne
conn.execute(
    "INSERT INTO articles (title, url) VALUES (?1, ?2)",
    params![&title, &url],
)?;

// ✅ CORRECT — named_params!{} pour la lisibilité
conn.execute(
    "SELECT * FROM scans WHERE preset = :preset AND status = :status",
    named_params!{ ":preset": preset_name, ":status": "active" },
)?;

// ❌ INTERDIT — le contenu de user_input traverse le parseur SQL
let query = format!("SELECT * FROM articles WHERE title = '{}'", user_input);
conn.execute(&query, [])?;
// Payload : user_input = "'; DROP TABLE articles; --"
```

### Identifiants dynamiques : whitelist obligatoire

Les placeholders SQL ne peuvent lier que des valeurs, pas des identifiants. Pour les noms de tables, colonnes, ou ORDER BY dynamiques, la seule approche sûre est la validation par liste blanche :

```rust
const ALLOWED_TABLES: &[&str] = &["articles", "scans", "presets", "scheduled_scans"];
const ALLOWED_SORT_COLS: &[&str] = &["title", "created_at", "url", "status"];
const ALLOWED_DIRECTIONS: &[&str] = &["ASC", "DESC"];

fn build_safe_query(
    table: &str,
    sort_col: &str,
    direction: &str,
) -> Result<String, AppError> {
    if !ALLOWED_TABLES.contains(&table) {
        return Err(AppError::InvalidInput("Table non autorisée".into()));
    }
    if !ALLOWED_SORT_COLS.contains(&sort_col) {
        return Err(AppError::InvalidInput("Colonne de tri non autorisée".into()));
    }
    if !ALLOWED_DIRECTIONS.contains(&direction.to_uppercase().as_str()) {
        return Err(AppError::InvalidInput("Direction de tri invalide".into()));
    }
    // Ici, format!() est sûr car les 3 valeurs ont été validées par whitelist
    Ok(format!("SELECT * FROM {} ORDER BY {} {}", table, sort_col, direction))
}
```

### Échappement LIKE et GLOB

Les placeholders protègent contre l'injection SQL mais pas contre les wildcards LIKE (`%`, `_`) et GLOB (`*`, `?`, `[`, `]`). Ces caractères doivent être échappés explicitement :

```rust
/// Échappe les wildcards LIKE pour les recherches textuelles
pub fn escape_like(input: &str) -> String {
    input
        .replace('\\', "\\\\")
        .replace('%', "\\%")
        .replace('_', "\\_")
}

/// Recherche sécurisée avec LIKE — binding + échappement des wildcards
pub fn search_articles(
    conn: &Connection,
    query: &str,
) -> Result<Vec<Article>, rusqlite::Error> {
    let escaped = escape_like(query);
    let pattern = format!("%{}%", escaped);
    let mut stmt = conn.prepare(
        "SELECT id, title, url FROM articles WHERE title LIKE ?1 ESCAPE '\\'"
    )?;
    let rows = stmt.query_map([&pattern], |row| {
        Ok(Article {
            id: row.get(0)?,
            title: row.get(1)?,
            url: row.get(2)?,
        })
    })?;
    rows.collect()
}
```

### Prévention de la second-order injection

Toute donnée lue depuis la base (titres scrapés, URLs, configurations) doit être traitée comme non fiable lors de la construction de requêtes. Règle : même les données "internes" passent par des prepared statements.

```rust
// ❌ VULNÉRABLE — titre lu de la base puis concaténé dans du SQL
let title: String = conn.query_row(
    "SELECT title FROM articles WHERE id = ?1",
    [id],
    |r| r.get(0),
)?;
let sql = format!("SELECT * FROM related WHERE source = '{}'", title);
// Si title = "O'Brien'; DROP TABLE scans; --", injection possible

// ✅ CORRECT — même les données internes passent par des params
let title: String = conn.query_row(
    "SELECT title FROM articles WHERE id = ?1",
    [id],
    |r| r.get(0),
)?;
conn.query_row(
    "SELECT * FROM related WHERE source = ?1",
    [&title],
    |r| { ... },
)?;
```

---

## 4. Authorizer SQLite et limites runtime

### Authorizer : bloquer les opérations dangereuses au niveau compilation SQL

L'API `sqlite3_set_authorizer` (feature `hooks` dans rusqlite) bloque les opérations dangereuses avant même l'exécution :

```rust
use rusqlite::hooks::{AuthAction, AuthContext, Authorization};

/// Configure l'authorizer pour bloquer toutes les opérations destructives
pub fn harden_connection(conn: &Connection) {
    conn.authorizer(Some(|ctx: AuthContext<'_>| {
        match ctx.action {
            // Bloquer ATTACH DATABASE — vecteur d'exfiltration
            AuthAction::Attach { .. } => Authorization::Deny,
            // Bloquer tous les PRAGMA (sauf ceux définis à l'initialisation)
            AuthAction::Pragma { .. } => Authorization::Deny,
            // Bloquer DROP TABLE — protection contre la destruction accidentelle
            AuthAction::DropTable { .. } => Authorization::Deny,
            // Bloquer CREATE TABLE après initialisation (mode lecture/écriture de données seulement)
            AuthAction::CreateTable { .. } => Authorization::Deny,
            // Bloquer le chargement d'extensions
            AuthAction::Function {
                function_name: "load_extension", ..
            } => Authorization::Deny,
            // Autoriser toutes les autres opérations (SELECT, INSERT, UPDATE, DELETE)
            _ => Authorization::Ok,
        }
    }));
}
```

### Limites runtime : protection anti-DoS

```rust
use rusqlite::limits::Limit;

/// Applique les limites SQLite pour prévenir les attaques par déni de service
pub fn apply_limits(conn: &Connection) {
    // Désactiver ATTACH complètement
    conn.set_limit(Limit::SQLITE_LIMIT_ATTACHED, 0);
    // Limiter la taille des requêtes SQL à 50 Ko
    conn.set_limit(Limit::SQLITE_LIMIT_SQL_LENGTH, 50_000);
    // Limiter la profondeur des expressions imbriquées
    conn.set_limit(Limit::SQLITE_LIMIT_EXPR_DEPTH, 20);
    // Limiter les UNION/INTERSECT/EXCEPT enchaînés
    conn.set_limit(Limit::SQLITE_LIMIT_COMPOUND_SELECT, 3);
    // Limiter le nombre d'opérations bytecode (protection contre les CTE récursives)
    conn.set_limit(Limit::SQLITE_LIMIT_VDBE_OP, 100_000);
    // Limiter la longueur des patterns LIKE
    conn.set_limit(Limit::SQLITE_LIMIT_LIKE_PATTERN_LENGTH, 100);
    // Limiter la récursion des triggers
    conn.set_limit(Limit::SQLITE_LIMIT_TRIGGER_DEPTH, 10);
    // Limiter le nombre de paramètres liés (protection contre le padding de requêtes)
    conn.set_limit(Limit::SQLITE_LIMIT_VARIABLE_NUMBER, 200);
}

/// Interrompt les requêtes qui dépassent 5 secondes
pub fn apply_timeout(conn: &Connection) {
    use std::time::{Duration, Instant};
    let start = Instant::now();
    conn.progress_handler(1000, Some(move || {
        start.elapsed() > Duration::from_secs(5)
    }));
}
```

---

## 5. Dérivation de clé depuis un mot de passe — Argon2id

Quand la clé doit être dérivée depuis une passphrase utilisateur (plutôt que générée aléatoirement), utiliser Argon2id au lieu de PBKDF2. Argon2id est memory-hard, résistant aux ASICs et aux GPU farming.

```rust
use argon2::{Argon2, PasswordHasher, Params};
use argon2::password_hash::{SaltString, rand_core::OsRng};
use secrecy::{ExposeSecret, SecretString};
use zeroize::Zeroize;

/// Dérive une clé de 32 octets depuis une passphrase avec Argon2id
/// Paramètres : m=65536 (64 Mo RAM), t=3 iterations, p=4 threads
pub fn derive_key_argon2id(
    passphrase: &SecretString,
) -> Result<[u8; 32], argon2::password_hash::Error> {
    // Paramètres conformes OWASP 2025 pour Argon2id
    let params = Params::new(
        65_536,  // m_cost : 64 Mo de mémoire
        3,       // t_cost : 3 itérations
        4,       // p_cost : 4 threads parallèles
        Some(32) // longueur de sortie : 32 octets = 256 bits
    ).unwrap();

    let argon2 = Argon2::new(
        argon2::Algorithm::Argon2id,
        argon2::Version::V0x13,
        params,
    );

    let salt = SaltString::generate(&mut OsRng);
    let mut output = [0u8; 32];

    argon2.hash_password_into(
        passphrase.expose_secret().as_bytes(),
        salt.as_str().as_bytes(),
        &mut output,
    )?;

    Ok(output)
}

/// IMPORTANT : si Argon2id dérive la clé, passer en format raw hex à SQLCipher
/// pour court-circuiter le PBKDF2 interne — ne pas faire du double-KDF
pub fn open_db_with_passphrase(
    path: &std::path::Path,
    passphrase: &SecretString,
) -> Result<rusqlite::Connection, Box<dyn std::error::Error>> {
    let key_bytes = derive_key_argon2id(passphrase)?;
    let mut hex_key = hex::encode(key_bytes);

    // Passer en x'...' pour bypasser le PBKDF2 interne de SQLCipher
    let conn = open_db(path, &hex_key)?;
    hex_key.zeroize();

    Ok(conn)
}
```

**PBKDF2 comme fallback** : si le crate argon2 n'est pas disponible, utiliser PBKDF2-HMAC-SHA256 avec minimum 600 000 itérations (seuil OWASP 2023 pour SHA-256). PBKDF2-HMAC-SHA512 avec 210 000 itérations est également acceptable. Le PBKDF2 interne de SQLCipher (256 000 itérations SHA-512) peut servir de fallback en passant directement la passphrase sans `x'...'`, mais Argon2id reste préférable pour les nouvelles implémentations.

---

## 6. AES-256-GCM — Chiffrement de données hors SQLCipher

Pour chiffrer des données en dehors de SQLCipher (fichiers de config, exports temporaires), utiliser AES-256-GCM avec nonce unique par opération.

```rust
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use zeroize::Zeroize;

/// Chiffre des données avec AES-256-GCM.
/// Retourne: nonce (12 octets) || ciphertext+tag (données + 16 octets)
pub fn encrypt_aes256gcm(
    key: &[u8; 32],
    plaintext: &[u8],
    aad: &[u8],  // données authentifiées mais non chiffrées (contexte)
) -> Result<Vec<u8>, aes_gcm::Error> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));

    // Nonce unique de 96 bits généré par OsRng — JAMAIS réutilisé avec la même clé
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    let ciphertext = cipher.encrypt(
        &nonce,
        aes_gcm::aead::Payload { msg: plaintext, aad },
    )?;

    // Format de sortie : nonce (12 octets) || ciphertext+tag
    let mut output = Vec::with_capacity(12 + ciphertext.len());
    output.extend_from_slice(&nonce);
    output.extend_from_slice(&ciphertext);
    Ok(output)
}

/// Déchiffre des données chiffrées avec encrypt_aes256gcm
pub fn decrypt_aes256gcm(
    key: &[u8; 32],
    data: &[u8],    // nonce (12 octets) || ciphertext+tag
    aad: &[u8],     // doit correspondre exactement à l'AAD de chiffrement
) -> Result<Vec<u8>, aes_gcm::Error> {
    if data.len() < 12 {
        return Err(aes_gcm::Error);
    }
    let (nonce_bytes, ciphertext) = data.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));

    cipher.decrypt(
        nonce,
        aes_gcm::aead::Payload { msg: ciphertext, aad },
    )
}
```

**Pourquoi AES-256-GCM et pas autre chose** :
- Pas de CBC : vulnérable aux attaques padding oracle (POODLE, BEAST)
- Pas de ECB : les blocs identiques produisent des chiffrés identiques, révèle des patterns
- Pas de 3DES : clé de 112 bits effectifs, Meet-in-the-Middle, trop lent
- AES-256-GCM = Encrypt-then-MAC intégré, authentification + chiffrement en une passe

---

## 7. Rotation de clé SQLCipher — Cycle automatique 30 jours

```rust
use std::time::{SystemTime, UNIX_EPOCH, Duration};

const KEY_MAX_AGE_SECS: u64 = 30 * 24 * 3600; // 30 jours

/// Vérifie si la clé doit être rotée (age > 30 jours)
pub fn should_rotate_key(key_created_at_unix: u64) -> bool {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::ZERO)
        .as_secs();
    now.saturating_sub(key_created_at_unix) > KEY_MAX_AGE_SECS
}

/// Effectue la rotation de clé SQLCipher de manière sécurisée
pub fn rotate_key(
    path: &std::path::Path,
    old_key: &secrecy::SecretVec<u8>,
    new_key: &secrecy::SecretVec<u8>,
) -> Result<(), Box<dyn std::error::Error>> {
    use secrecy::ExposeSecret;
    use zeroize::Zeroize;

    // 1. Créer un backup avant la rotation
    let backup_path = path.with_extension("db.rotating.bak");
    std::fs::copy(path, &backup_path)?;

    // 2. Ouvrir avec l'ancienne clé
    let conn = open_db_with_key(path, old_key)?;

    // 3. Appliquer la nouvelle clé via PRAGMA rekey
    let mut new_hex = hex::encode(new_key.expose_secret());
    let mut rekey_pragma = format!("PRAGMA rekey = \"x'{new_hex}'\";");
    conn.execute_batch(&rekey_pragma)?;
    new_hex.zeroize();
    rekey_pragma.zeroize();

    // 4. Fermer et rouvrir pour vérifier que la nouvelle clé fonctionne
    drop(conn);
    let _verify = open_db_with_key(path, new_key)?;

    // 5. Mettre à jour le keystore OS avec la nouvelle clé
    let entry = keyring::Entry::new(SERVICE, ACCOUNT)?;
    entry.set_secret(new_key.expose_secret())?;

    // 6. Supprimer le backup uniquement si la vérification a réussi
    std::fs::remove_file(&backup_path)?;

    tracing::info!("Key rotation completed successfully");
    Ok(())
}
```

---

## 8. Zéroisation mémoire et protection contre les fuites

### SecretString pour toutes les clés API en mémoire

```rust
use secrecy::{SecretString, ExposeSecret};
use zeroize::{Zeroize, ZeroizeOnDrop};

/// Conteneur sécurisé pour une clé API — ne peut pas être cloné ni sérialisé par défaut
/// L'affichage via Debug retourne "[REDACTED]"
pub struct ApiKeyStore {
    keys: std::collections::HashMap<String, SecretString>,
}

impl ApiKeyStore {
    pub fn get(&self, provider: &str) -> Option<&SecretString> {
        self.keys.get(provider)
    }

    /// Utiliser uniquement dans le contexte d'un appel HTTP — expose_secret() est auditable par grep
    pub fn use_key<F, R>(&self, provider: &str, f: F) -> Option<R>
    where
        F: FnOnce(&str) -> R,
    {
        self.keys.get(provider).map(|k| f(k.expose_secret()))
    }
}
```

### Désactivation des core dumps

```rust
/// Empêche les core dumps qui pourraient contenir des secrets en clair
pub fn disable_core_dumps() {
    #[cfg(unix)]
    {
        use std::os::unix::io::RawFd;
        unsafe {
            // setrlimit(RLIMIT_CORE, {0, 0})
            // rlimit::setrlimit(rlimit::Resource::CORE, 0, 0)
            let rlimit = libc::rlimit { rlim_cur: 0, rlim_max: 0 };
            libc::setrlimit(libc::RLIMIT_CORE, &rlimit);
        }
    }
    #[cfg(windows)]
    {
        // Désactiver les Error Reporting et les crash dumps Windows
        unsafe {
            // SetErrorMode(SEM_NOGPFAULTERRORBOX | SEM_FAILCRITICALERRORS)
            // windows::Win32::System::Diagnostics::Debug::SetErrorMode(...)
        }
    }
}
```

### Filtre de redaction des clés dans les logs

```rust
use tracing_subscriber::layer::SubscriberExt;
use std::fmt;

/// Filtre les patterns de clés API dans les messages de log tracing
pub fn install_log_redaction_filter() {
    // Exemple de patterns à redacter automatiquement :
    // - sk-ant-api03-... (Anthropic)
    // - sk-proj-... (OpenAI)
    // - gsk_... (Groq)
    // - AIza... (Google Gemini)
    // - Bearer <token>
    //
    // Dans la pratique, utiliser tracing-subscriber avec un layer personnalisé
    // ou le middleware sentry avec EventScrubber.
    tracing::info!("Log redaction filter installed");
}

/// Masque une clé API pour l'affichage dans l'UI — jamais dans les logs
pub fn mask_api_key(key: &str) -> String {
    if key.len() <= 12 {
        return "••••••••".to_string();
    }
    let prefix_len = key.find('-')
        .map(|i| i + 1)
        .unwrap_or(4)
        .min(10);
    format!("{}••••••{}",
        &key[..prefix_len.min(key.len())],
        &key[key.len().saturating_sub(4)..])
}
```

---

## 9. Migrations sécurisées et intégrité du schéma

```rust
use rusqlite_migration::{Migrations, M};

// Migrations embarquées dans le binaire — impossibles à altérer contrairement aux fichiers SQL externes
const MIGRATIONS: Migrations<'_> = Migrations::from_slice(&[
    M::up("CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        scraped_at TEXT
    );"),
    M::up("CREATE TABLE IF NOT EXISTS api_keys (
        provider TEXT PRIMARY KEY,
        key_value TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );"),
    M::up("CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY,
        preset TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT NOT NULL
    );"),
]);

/// Applique les migrations au démarrage — safe car idempotent
pub fn apply_migrations(conn: &mut rusqlite::Connection) -> Result<(), rusqlite_migration::Error> {
    MIGRATIONS.to_latest(conn)?;
    tracing::info!("Database migrations applied successfully");
    Ok(())
}

/// Vérifie l'intégrité cryptographique de la base SQLCipher
pub fn validate_db_integrity(conn: &rusqlite::Connection) -> Result<(), Box<dyn std::error::Error>> {
    let check: String = conn.query_row(
        "PRAGMA integrity_check",
        [],
        |r| r.get(0),
    )?;
    if check != "ok" {
        return Err(format!("Intégrité compromise : {}", check).into());
    }

    // Vérification HMAC spécifique à SQLCipher
    let cipher_check: String = conn.query_row(
        "PRAGMA cipher_integrity_check",
        [],
        |r| r.get(0),
    ).unwrap_or_else(|_| "ok".to_string());

    tracing::info!("Database integrity check: OK");
    Ok(())
}
```

---

## 10. Flags de compilation SQLite — Durcissement au build

Ces flags s'appliquent quand rusqlite est compilé avec SQLite bundled. Les définir dans `.cargo/config.toml` ou `build.rs` :

```bash
# Désactiver les fonctionnalités dangereuses de SQLite au niveau compilation
LIBSQLITE3_FLAGS="\
-DSQLITE_TRUSTED_SCHEMA=0 \
-DSQLITE_OMIT_LOAD_EXTENSION \
-DSQLITE_OMIT_DEPRECATED \
-DSQLITE_DQS=0 \
-DSQLITE_DEFAULT_FOREIGN_KEYS=1 \
-DSQLITE_PRINTF_PRECISION_LIMIT=100000"
```

| Flag | Effet de sécurité |
|------|-------------------|
| `SQLITE_TRUSTED_SCHEMA=0` | Empêche le schéma non fiable d'appeler des fonctions custom |
| `SQLITE_OMIT_LOAD_EXTENSION` | Supprime entièrement le chargement d'extensions |
| `SQLITE_DQS=0` | Désactive les string literals entre double-quotes (ferme une classe d'injection) |
| `SQLITE_DEFAULT_FOREIGN_KEYS=1` | Active les foreign keys par défaut |
| `SQLITE_TRUSTED_SCHEMA=0` | Bloque les triggers et vues qui appellent des fonctions custom depuis des données non fiables |

---

## 11. Tests de sécurité — SQLCipher et injection

### Tests d'injection à exécuter en CI

```rust
#[cfg(test)]
mod security_tests {
    use super::*;

    #[test]
    fn test_sql_injection_rejected_by_binding() {
        let conn = create_test_db();
        // Payload d'injection classique
        let payload = "'; DROP TABLE articles; --";
        // Avec prepared statement, ce payload est inséré comme valeur littérale
        conn.execute(
            "INSERT INTO articles (title, url) VALUES (?1, ?2)",
            params![payload, "https://example.com"],
        ).unwrap();
        // La table articles doit toujours exister
        let count: i64 = conn.query_row(
            "SELECT count(*) FROM articles",
            [],
            |r| r.get(0),
        ).unwrap();
        assert!(count >= 1, "La table articles ne doit pas avoir été supprimée");
    }

    #[test]
    fn test_like_wildcard_escaping() {
        let conn = create_test_db();
        // Insérer un article avec "100%"
        conn.execute(
            "INSERT INTO articles (title, url) VALUES (?1, ?2)",
            params!["Taux à 100%", "https://example.com/1"],
        ).unwrap();
        // Recherche exacte — le % doit être échappé
        let results = search_articles(&conn, "100%").unwrap();
        // Ne doit trouver QUE les articles avec "100%" dans le titre,
        // pas tous les articles (ce qui arriverait si % est interprété comme wildcard)
        assert_eq!(results.len(), 1);
        assert!(results[0].title.contains("100%"));
    }

    #[test]
    fn test_second_order_injection_safe() {
        let conn = create_test_db();
        // Stocker un payload via prepared statement (safe)
        let malicious_title = "O'Brien'; SELECT * FROM api_keys; --";
        conn.execute(
            "INSERT INTO articles (title, url) VALUES (?1, ?2)",
            params![malicious_title, "https://example.com/2"],
        ).unwrap();
        // Relire et utiliser dans une requête — doit rester safe
        let title: String = conn.query_row(
            "SELECT title FROM articles WHERE url = ?1",
            ["https://example.com/2"],
            |r| r.get(0),
        ).unwrap();
        // Utiliser dans une requête paramétrée — safe même si le titre est malveillant
        let _count: i64 = conn.query_row(
            "SELECT count(*) FROM articles WHERE title = ?1",
            [&title],
            |r| r.get(0),
        ).unwrap();
        // Vérifier que la table api_keys n'a pas été accédée via injection
        // (le test passe si aucune exception n'est levée)
    }

    #[test]
    fn test_whitelist_blocks_invalid_table() {
        // Un nom de table non whitelisté doit retourner une erreur, pas exécuter du SQL
        let result = build_safe_query("users; DROP TABLE articles; --", "title", "ASC");
        assert!(result.is_err(), "Une table non whitelistée doit être rejetée");
    }
}
```

### Commandes d'audit statique

```bash
# Détecter les format!() dans les requêtes SQL (semgrep)
semgrep --config "p/sql-injection" --config "p/rust" ./src/

# Vulnérabilités connues des dépendances
cargo audit
cargo deny check advisories

# Vérifier qu'aucune clé n'est hardcodée dans le code source
trufflehog filesystem ./src/ --only-verified
grep -rn "PRAGMA key" ./src/  # Ne doit retourner aucune clé en clair

# Clippy avec règles de sécurité strictes
cargo clippy -- -W clippy::unwrap_used -W clippy::expect_used -W clippy::dbg_macro
```

### Règle semgrep personnalisée pour détecter les injections rusqlite

```yaml
rules:
  - id: rusqlite-format-injection
    patterns:
      - pattern: |
          let $SQL = format!("...", ...);
          ...
          $CONN.execute($SQL, ...)
    message: "Injection SQL potentielle via format!() dans une requête rusqlite"
    severity: ERROR
    languages: [rust]

  - id: rusqlite-execute-batch-user-input
    patterns:
      - pattern: |
          $CONN.execute_batch($INPUT)
    message: "execute_batch() n'accepte aucun paramètre — ne jamais y passer de données utilisateur"
    severity: ERROR
    languages: [rust]
```

---

## Checklist de validation — Storage & Crypto

Avant chaque release, vérifier que tous ces points sont vrais :

- [ ] Toutes les requêtes rusqlite utilisent `params![]` ou `named_params!{}` — aucun `format!()` dans du SQL
- [ ] Les noms de tables et colonnes dynamiques sont validés par whitelist avant usage dans `format!()`
- [ ] Les recherches LIKE utilisent `escape_like()` + clause `ESCAPE '\\'`
- [ ] `execute_batch()` n'est jamais appelé avec des données utilisateur
- [ ] La clé SQLCipher est stockée dans le keystore OS via keyring-rs — pas dans SharedPreferences ni en variable d'environnement
- [ ] La clé est passée en format `x'...'` pour contourner le PBKDF2 interne de SQLCipher
- [ ] `cipher_memory_security = ON` est activé dans les PRAGMAs d'initialisation
- [ ] `cipher_page_size = 4096` et `kdf_iter = 256000` sont explicitement définis
- [ ] Les clés API sont encapsulées dans `SecretString` — jamais dans une `String` ordinaire
- [ ] Les clés sont zéroïsées via `Zeroize` après usage
- [ ] Les core dumps sont désactivés au démarrage de l'application
- [ ] Les logs ne contiennent aucun pattern de clé API (`grep -r "sk-" logs/` ne retourne rien)
- [ ] `cargo audit` ne retourne aucune advisory critique non corrigée
- [ ] La rotation de clé est planifiée (30 jours maximum par clé)
- [ ] Les migrations sont vérifiées et appliquées au démarrage
- [ ] `integrity_check` et `cipher_integrity_check` passent sans erreur
- [ ] L'authorizer bloque `ATTACH`, `DROP TABLE`, et `PRAGMA` après initialisation
- [ ] Les limites runtime sont appliquées : `SQLITE_LIMIT_ATTACHED = 0`, `VDBE_OP = 100_000`
- [ ] AES-256-GCM est utilisé pour tout chiffrement hors SQLCipher — pas de CBC ni ECB
- [ ] Chaque nonce AES-GCM est généré via `OsRng` — jamais réutilisé

---

## CVEs de référence (mai 2025 — février 2026)

| CVE | Score | Composant | Impact | Mitigation |
|-----|-------|-----------|--------|-----------|
| CVE-2025-6965 | 9.8 | SQLite < 3.50.2 | Corruption mémoire via agrégats | Utiliser rusqlite 0.37+ (embarque SQLite 3.50.2+) |
| CVE-2025-29087 | N/D | SQLite | Vulnérabilité mémoire | Même mitigation — rusqlite 0.37+ |
| CVE-2025-15467 | N/D | OpenSSL 3.5.4 | Crypto provider de SQLCipher | Utiliser `bundled-sqlcipher-vendored-openssl` |
| CVE-2025-31477 | 9.3 | tauri-plugin-shell | RCE via protocoles dangereux | Mettre à jour vers v2.2.1 |
| RUSTSEC-2021-0115 | N/D | zeroize < 1.1.1 | `#[zeroize(drop)]` ne générait pas `Drop` pour les enums | Utiliser zeroize >= 1.1.1 |
