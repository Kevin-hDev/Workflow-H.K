# Déception et Monitoring — Défense active pour stack Rust/Tauri desktop

## Vue d'ensemble

Ce fichier couvre l'architecture complète de défense active d'une application desktop Rust/Tauri sans serveur central. Une application locale peut — et doit — intégrer des mécanismes de détection autonomes qui fonctionnent entièrement hors ligne.

**Principes fondateurs :**
- Un attaquant accédant à votre machine ne doit pas progresser silencieusement
- Chaque action suspecte doit être détectée, loggée, et alertée
- Les logs doivent être inviolables par design (hash chaining)
- Les leurres doivent être irrésistibles mais jamais identifiables comme tels

**Règle absolue (CLAUDE.md) :** Les noms de fichiers canary ne doivent JAMAIS contenir les mots : canary, trap, honey, fake, decoy, bait, lure, test, dummy, sample. Les noms doivent être réalistes et indiscernables de vrais fichiers sensibles.

---

## 1. Canary Files — Leurres avec noms réalistes

### 1.1 Stratégie de nommage

Les outils automatisés (TruffleHog, GitGuardian, scripts de pentest) et les attaquants manuels cherchent systématiquement des noms de fichiers évoquant des credentials, des clés API, ou des sauvegardes. Un fichier canary doit être irrésistible pour l'attaquant mais totalement opaque pour un observateur externe.

**15 noms défensifs avec leur justification :**

| Nom de fichier | Attractivité |
|---|---|
| `.env.production` | Les attaquants grep systématiquement les `.env`. Le suffixe `production` implique des credentials réelles |
| `credentials.json` | Recherché par tous les outils de scraping de credentials |
| `api_keys.json` | Cible évidente pour l'extraction de clés API — nom générique couvrant de nombreux services |
| `private_key.pem` | Fichier de clé privée RSA/EC universel — extension `.pem` immédiatement reconnaissable |
| `wallet.dat` | Portefeuille crypto Bitcoin — extrêmement attractif pour les attaquants financièrement motivés |
| `backup.db` | Backup de base de données — implique une exfiltration complète possible |
| `master.key` | Clé maître (Rails, systèmes de chiffrement) — irrésistible |
| `.pgpass` | Fichier de mots de passe PostgreSQL standard — connu de tous les outils de pentest BD |
| `service_account.json` | Format standard de clé de service GCP |
| `recovery_codes.txt` | Codes de récupération 2FA — implique prise de contrôle de compte |
| `config.bak` | Backup de configuration avec potentiellement des secrets — extension `.bak` signal fort |
| `token.json` | Stockage de tokens OAuth/bearer — format utilisé par de nombreux SDK |
| `shadow.bak` | Backup de fichier shadow Linux — implique des hashes de mots de passe système |
| `.npmrc` | Token d'authentification npm — cible des attaques supply chain |
| `admin_creds.xlsx` | Tableur de credentials — difficile à résister, bypass certains filtres texte |

### 1.2 Contenu crédible (structurellement valide, non fonctionnel)

```bash
# .env.production — format reconnu par TruffleHog et GitGuardian
DATABASE_URL=postgresql://admin:Xk7mP2nQ9rL@db.internal:5432/production
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STRIPE_SECRET_KEY=sk_live_51OxKJL2eZvKYlo2Cv8YZnPqX4RtM3Vb
SENDGRID_API_KEY=SG.Xm3KpLn7Qr9Jv2Wy.fZt8QhR3nP6MkL9Xv2WqJm4Yt7Bs1Cp0DnEu5Fv
OPENAI_API_KEY=sk-proj-Xm3KpLn7Qr9Jv2WyfZt8QhR3nP6MkL9Xv2WqJm
TELEGRAM_BOT_TOKEN=7482936105:AAGx9Km2Np4Qr7Vy3Ws6Zt8Bu1Cp0DnEu5Fv
```

```json
// credentials.json — format attendu par les outils d'extraction
{
  "accounts": [
    {
      "provider": "aws",
      "access_key": "AKIAIOSFODNN7EXAMPLE",
      "secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "token": "FQoGZXIvYXdzENf//////////wEaDG1KpLn7Qr9Jv2Wy",
      "region": "eu-west-1"
    }
  ]
}
```

```python
# master.key — format Rails (64 caractères hexadécimaux)
# a3f8c2d1e9b4071652894c3a7f6d2e5b8c1a4f7e2d9b6c3a0f8e5d2b9c6a3f0
```

### 1.3 Génération aléatoire au déploiement (contre l'exposition via code source)

Pour un projet OSS, le code source révèle les noms et emplacements des canary files. La mitigation : générer les noms et chemins au runtime depuis un seed aléatoire stocké localement (exclu du dépôt via `.gitignore`).

```rust
// src/canary/generator.rs
use std::collections::HashMap;
use rand::Rng;

/// Génère les emplacements canary uniques à chaque installation
pub fn generate_canary_config() -> CanaryConfig {
    let mut rng = rand::thread_rng();
    let seed: u64 = rng.gen();

    // Les listes de templates sont dans le code source (acceptable pour OSS)
    // Les chemins réels sont dérivés du seed et stockés localement
    let base_names = [
        ".env.production", "credentials.json", "api_keys.json",
        "private_key.pem", "backup.db", "master.key", "token.json",
        "service_account.json", "recovery_codes.txt", "config.bak",
    ];

    let locations = [
        "~/.config/", "~/.local/share/", "~/Documents/",
        "~/.ssh/", "~/Desktop/", "~/.cache/",
    ];

    // Sélection déterministe basée sur le seed — reproductible entre redémarrages
    let mut canary_files = Vec::new();
    for (i, name) in base_names.iter().enumerate() {
        let location_idx = ((seed.wrapping_add(i as u64)) % locations.len() as u64) as usize;
        canary_files.push(CanaryFile {
            path: format!("{}{}", locations[location_idx], name),
            deployed: false,
        });
    }

    CanaryConfig { seed, canary_files }
}
```

```gitignore
# .gitignore — exclure la configuration canary locale
canary_config.json
.canary_state
```

---

## 2. Monitoring des accès — Détection des lectures de fichiers

### 2.1 Limitation critique de `notify`

Le crate `notify v8.2.0` (62M+ téléchargements, utilisé par rust-analyzer, Deno, Zed) ne détecte que les **modifications** (create, write, delete, rename), **pas les lectures**. Or un canary file doit détecter quand un attaquant le lit.

La solution requiert des API spécifiques par plateforme.

### 2.2 Linux — inotify direct (IN_OPEN, IN_ACCESS)

`inotify` natif supporte les masques `IN_OPEN` et `IN_ACCESS` sans privilèges root — ce que le crate `notify` n'expose pas.

```toml
[dependencies]
inotify = "0.11"
nix = { version = "0.29", features = ["fanotify", "process"] }
tokio = { version = "1", features = ["full"] }
```

```rust
// src/canary/watcher_linux.rs
use inotify::{Inotify, WatchMask, EventMask};
use std::path::Path;

/// Monitore un canary file pour les lectures (Linux uniquement)
pub async fn watch_canary_file_linux(path: &Path, alert_tx: tokio::sync::mpsc::Sender<CanaryAlert>) {
    let mut inotify = Inotify::init().expect("Failed to initialize inotify");

    // IN_OPEN : fichier ouvert (lecture ou écriture)
    // IN_ACCESS : contenu du fichier accédé
    // IN_CLOSE_NOWRITE : fermé après lecture seule
    inotify.watches().add(
        path,
        WatchMask::OPEN | WatchMask::ACCESS | WatchMask::CLOSE_NOWRITE
            | WatchMask::CREATE | WatchMask::DELETE | WatchMask::MODIFY,
    ).expect("Failed to add watch");

    let mut buffer = [0u8; 4096];
    loop {
        let events = inotify.read_events_blocking(&mut buffer)
            .expect("Failed to read events");

        for event in events {
            // Filtrer les auto-accès de l'application elle-même
            if is_our_process(event.wd) { continue; }

            let event_type = if event.mask.contains(EventMask::OPEN) {
                "file_opened"
            } else if event.mask.contains(EventMask::ACCESS) {
                "file_read"
            } else if event.mask.contains(EventMask::MODIFY) {
                "file_modified"
            } else {
                continue;
            };

            let alert = CanaryAlert {
                severity: AlertSeverity::Critical, // P0
                event_type: event_type.to_string(),
                file_path: path.to_string_lossy().to_string(),
                // Note : inotify ne fournit pas le PID sans fanotify
                accessor_pid: None,
                timestamp: chrono::Utc::now().to_rfc3339(),
            };

            let _ = alert_tx.send(alert).await;
        }
    }
}
```

### 2.3 Linux — fanotify avec PID (nécessite CAP_SYS_ADMIN)

fanotify fournit le PID du processus accédant au fichier et peut bloquer les ouvertures.

```rust
// src/canary/fanotify_watcher.rs
use nix::sys::fanotify::{Fanotify, FanotifyFlags, InitFlags, MarkFlags, MaskFlags};

/// Surveillance avec identification du processus accédant (nécessite CAP_SYS_ADMIN)
pub fn watch_with_fanotify(path: &str) {
    let fan = Fanotify::init(
        InitFlags::FAN_CLASS_NOTIF | InitFlags::FAN_NONBLOCK,
        nix::fcntl::OFlag::O_RDONLY,
    ).expect("fanotify requires CAP_SYS_ADMIN");

    fan.mark(
        MarkFlags::FAN_MARK_ADD,
        MaskFlags::FAN_OPEN | MaskFlags::FAN_ACCESS | MaskFlags::FAN_CLOSE_NOWRITE,
        None,
        path,
    ).expect("Failed to mark file");

    // fanotify_event_metadata.pid identifie l'accesseur
    // Filtrer les processus système connus (antivirus, indexeurs)
}
```

### 2.4 Windows — Surveillance par polling du timestamp last-access

Windows ne fournit pas d'API native pour détecter les lectures de fichiers sans privilèges administrateur (`ReadDirectoryChangesW` ne supporte pas les filtres d'accès en lecture).

```rust
// src/canary/watcher_windows.rs (polling comme fallback)
use std::time::{SystemTime, Duration};
use std::path::Path;

pub async fn poll_canary_access_windows(
    path: &Path,
    alert_tx: tokio::sync::mpsc::Sender<CanaryAlert>,
) {
    let mut last_atime: Option<SystemTime> = None;

    loop {
        if let Ok(metadata) = std::fs::metadata(path) {
            // Nécessite que last-access tracking soit activé :
            // fsutil behavior set disablelastaccess 0
            if let Ok(atime) = metadata.accessed() {
                if let Some(prev) = last_atime {
                    if atime > prev {
                        let _ = alert_tx.send(CanaryAlert {
                            severity: AlertSeverity::Critical,
                            event_type: "file_accessed_windows".to_string(),
                            file_path: path.to_string_lossy().to_string(),
                            accessor_pid: None,
                            timestamp: chrono::Utc::now().to_rfc3339(),
                        }).await;
                    }
                }
                last_atime = Some(atime);
            }
        }
        tokio::time::sleep(Duration::from_secs(5)).await; // Poll toutes les 5s
    }
}
```

### 2.5 Workflow de réponse complet

```rust
// src/canary/responder.rs

/// Pipeline de réponse à un accès canary
pub async fn handle_canary_access(alert: CanaryAlert, app_state: &AppState) {
    // Étape 1 : Vérifier que ce n'est pas l'application elle-même
    if let Some(pid) = alert.accessor_pid {
        if pid == std::process::id() { return; }
        // Filtrer les processus système connus
        if is_known_system_process(pid) { return; }
    }

    // Étape 2 : Log local immédiat (audit log hash-chained)
    app_state.audit_log.write(AuditEntry {
        severity: "CRITICAL",
        event_type: "canary_accessed",
        details: format!("Canary file accessed: {}", alert.file_path),
        accessor_pid: alert.accessor_pid,
        // ... hash chaining automatique ...
    });

    // Étape 3 : Alerte Telegram P0 (< 1 seconde)
    let message = format!(
        "🚨 P0 CRITICAL — Canary file accessed\nFile: {}\nPID: {:?}\nTime: {}",
        alert.file_path, alert.accessor_pid, alert.timestamp
    );
    app_state.telegram.send_priority(message).await;

    // Étape 4 (optionnel selon configuration) : Verrouillage de l'application
    if app_state.config.lock_on_canary_access {
        app_state.lock_application();
    }
}
```

---

## 3. Canary Database Records — Enregistrements pièges dans SQLCipher

Les canary records dans la base de données détectent un attaquant qui a réussi à déchiffrer ou dumper la base.

```sql
-- Table normale (réelle)
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Enregistrement canary dans la table réelle
-- Nom non révélateur, email avec domaine inexistant mais réaliste
INSERT INTO users (id, email, created_at) VALUES
(99999, 'admin.backup@internal.local', '2025-01-15T08:30:00Z');
```

```rust
// src/db/canary_records.rs

/// Vérifie périodiquement que les records canary n'ont pas été modifiés.
/// Un attaquant qui a déchiffré la BD pourrait en supprimer les traces.
pub async fn verify_canary_records(db: &Database) -> Result<(), CanaryViolation> {
    let count: i64 = db.query_one(
        "SELECT COUNT(*) FROM users WHERE id = 99999 AND email = 'admin.backup@internal.local'"
    ).await?;

    if count == 0 {
        return Err(CanaryViolation {
            severity: AlertSeverity::Critical,
            message: "Canary database record missing — possible database tampering".to_string(),
        });
    }

    // Vérifier aussi qu'aucune nouvelle session avec ce compte n'a été créée
    let sessions: i64 = db.query_one(
        "SELECT COUNT(*) FROM sessions WHERE user_id = 99999"
    ).await?;

    if sessions > 0 {
        return Err(CanaryViolation {
            severity: AlertSeverity::Critical,
            message: "Canary user account accessed — database compromise confirmed".to_string(),
        });
    }

    Ok(())
}
```

---

## 4. Tarpits — Ralentissement exponentiel des attaquants

### 4.1 Exponential backoff sur les échecs d'authentification

```rust
// src/auth/tarpit.rs
use std::collections::HashMap;
use std::time::{Instant, Duration};
use tokio::sync::Mutex;

/// État de tarpit par identifiant tentant l'authentification
struct TarpitState {
    failure_count: u32,
    last_attempt: Instant,
    blacklisted_until: Option<Instant>,
}

pub struct AuthTarpit {
    // Taille bornée : max 10 000 entrées (protection OOM)
    state: Mutex<HashMap<String, TarpitState>>,
    max_entries: usize,
}

impl AuthTarpit {
    pub fn new() -> Self {
        Self {
            state: Mutex::new(HashMap::new()),
            max_entries: 10_000,
        }
    }

    /// Calcule le délai d'attente selon le nombre d'échecs.
    /// Séquence : 0s → 2s → 4s → 8s → 16s → 32s → 60s (plafond)
    fn compute_delay(failure_count: u32) -> Duration {
        if failure_count == 0 { return Duration::ZERO; }
        let delay_secs = std::cmp::min(2u64.pow(failure_count), 60);
        Duration::from_secs(delay_secs)
    }

    /// Enregistre un échec et retourne le délai à imposer.
    /// Fail CLOSED : tout identifiant inconnu commence à 0 échec.
    pub async fn record_failure(&self, identifier: &str) -> AuthDecision {
        let mut state = self.state.lock().await;

        // Protection OOM : éviction des entrées les plus anciennes si limite atteinte
        if state.len() >= self.max_entries && !state.contains_key(identifier) {
            let oldest_key = state.iter()
                .min_by_key(|(_, v)| v.last_attempt)
                .map(|(k, _)| k.clone());
            if let Some(key) = oldest_key {
                state.remove(&key);
            }
        }

        let entry = state.entry(identifier.to_string()).or_insert(TarpitState {
            failure_count: 0,
            last_attempt: Instant::now(),
            blacklisted_until: None,
        });

        entry.failure_count += 1;
        entry.last_attempt = Instant::now();

        // Blacklist après 10 tentatives
        if entry.failure_count >= 10 {
            entry.blacklisted_until = Some(Instant::now() + Duration::from_secs(3600));
            return AuthDecision::BlacklistedFor(Duration::from_secs(3600));
        }

        let delay = Self::compute_delay(entry.failure_count);
        AuthDecision::DelayFor(delay)
    }

    /// Réinitialise le compteur sur succès
    pub async fn record_success(&self, identifier: &str) {
        let mut state = self.state.lock().await;
        state.remove(identifier);
    }
}

pub enum AuthDecision {
    Allow,
    DelayFor(Duration),
    BlacklistedFor(Duration),
}
```

---

## 5. Audit Log Tamper-Evident — Hash Chaining SHA-256

### 5.1 Architecture à deux pipelines

**Pipeline 1 (logs applicatifs) :** `tauri-plugin-log v2.7+` → stdout, fichier rotatif, console WebView.
**Pipeline 2 (logs de sécurité) :** subscriber `tracing` custom → JSON structuré, hash chaining, fichier dédié `security_logs/`.

Cette séparation est recommandée par NIST SP 800-92 : les logs de sécurité ont des exigences différentes (rétention 90 jours, format tamper-evident, conformité RGPD).

### 5.2 Format JSON structuré (OWASP Logging Vocabulary)

```json
{
  "timestamp": "2026-02-22T14:30:00.123456Z",
  "sequence": 42,
  "event_type": "crypt_decrypt_success",
  "severity": "INFO",
  "source_module": "db::init",
  "action": "sqlcipher_unlock",
  "result": "success",
  "details": {"target_id_hash": "sha256:a1b2c3d4"},
  "app_version": "1.2.3",
  "hash_prev": "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
  "hash_self": "sha256:ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d"
}
```

**Catégories d'événements OWASP :**
- `AUTHN` — authentification (succès, échec, lockout)
- `AUTHZ` — autorisations IPC commands
- `CRYPT` — opérations cryptographiques (unlock BD, signature, vérification)
- `DATA` — accès et modification de la base
- `SYS` — démarrage, arrêt, sidecar, crash

### 5.3 Implémentation Rust du hash chaining

```rust
// src/security/audit_log.rs
use sha2::{Sha256, Digest};
use serde::{Serialize, Deserialize};
use std::sync::Mutex;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AuditEntry {
    pub timestamp: String,
    pub sequence: u64,
    pub event_type: String,
    pub severity: String,
    pub source_module: String,
    pub action: String,
    pub result: String,
    pub details: serde_json::Value,
    pub app_version: String,
    pub hash_prev: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hash_self: Option<String>,
}

impl AuditEntry {
    /// Calcule le hash SHA-256 de l'entrée (en excluant hash_self du calcul)
    pub fn compute_hash(&mut self) {
        let prev_hash_self = self.hash_self.take();
        // Sérialisation canonique (clés triées pour déterminisme)
        let canonical = serde_json::to_string(self)
            .expect("Serialization should not fail");
        let hash = Sha256::digest(canonical.as_bytes());
        self.hash_self = Some(format!("sha256:{}", hex::encode(hash)));
        // Restaurer si nécessaire (ne devrait pas être le cas ici)
        let _ = prev_hash_self;
    }
}

pub struct TamperEvidentLog {
    last_hash: Mutex<String>,
    sequence: Mutex<u64>,
    log_file: Mutex<std::fs::File>,
}

impl TamperEvidentLog {
    pub fn new(path: &std::path::Path) -> std::io::Result<Self> {
        let file = std::fs::OpenOptions::new()
            .create(true)
            .append(true)  // Append-only — jamais de modification
            .open(path)?;

        Ok(Self {
            // Entrée genesis : 64 zéros
            last_hash: Mutex::new("sha256:".to_string() + &"0".repeat(64)),
            sequence: Mutex::new(0),
            log_file: Mutex::new(file),
        })
    }

    /// Écrit une entrée dans le log avec hash chaining.
    /// Fail CLOSED : toute erreur d'écriture est une erreur fatale.
    pub fn write(&self, event_type: &str, severity: &str, action: &str, details: serde_json::Value) {
        let mut last_hash = self.last_hash.lock().unwrap();
        let mut sequence = self.sequence.lock().unwrap();
        let mut file = self.log_file.lock().unwrap();

        let mut entry = AuditEntry {
            timestamp: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Micros, true),
            sequence: *sequence,
            event_type: event_type.to_string(),
            severity: severity.to_string(),
            source_module: module_path!().to_string(),
            action: action.to_string(),
            result: "logged".to_string(),
            details,
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            hash_prev: last_hash.clone(),
            hash_self: None,
        };

        entry.compute_hash();

        // Mettre à jour le hash pour la prochaine entrée
        *last_hash = entry.hash_self.clone().unwrap();
        *sequence += 1;

        // Écriture atomique (une ligne = une entrée JSON)
        let line = serde_json::to_string(&entry).unwrap() + "\n";
        use std::io::Write;
        file.write_all(line.as_bytes())
            .expect("Security log write MUST succeed — disk full or tampered");
    }

    /// Ancres HMAC périodiques dans le keychain OS pour résister à la reconstruction
    pub fn write_keychain_anchor(&self) {
        let last_hash = self.last_hash.lock().unwrap().clone();
        let sequence = *self.sequence.lock().unwrap();

        // Stocker dans le keychain OS (crate keyring v3.6)
        let entry = keyring::Entry::new("myapp-security", "audit-anchor").unwrap();
        let anchor = format!("{}:{}", sequence, last_hash);
        let _ = entry.set_password(&anchor);
    }
}
```

### 5.4 Vérification de la chaîne

```rust
/// Vérifie l'intégrité complète du log — parcourt tout le fichier
pub fn verify_chain(log_path: &std::path::Path) -> ChainVerificationResult {
    use std::io::{BufRead, BufReader};

    let file = match std::fs::File::open(log_path) {
        Ok(f) => f,
        Err(e) => return ChainVerificationResult::Error(e.to_string()),
    };

    let reader = BufReader::new(file);
    let mut expected_prev = "sha256:".to_string() + &"0".repeat(64);
    let mut line_number = 0u64;

    for line in reader.lines() {
        line_number += 1;
        let line = match line {
            Ok(l) => l,
            Err(e) => return ChainVerificationResult::ReadError(line_number, e.to_string()),
        };

        let mut entry: AuditEntry = match serde_json::from_str(&line) {
            Ok(e) => e,
            Err(e) => return ChainVerificationResult::ParseError(line_number, e.to_string()),
        };

        // Vérifier hash_prev
        if entry.hash_prev != expected_prev {
            return ChainVerificationResult::ChainBroken {
                at_sequence: entry.sequence,
                line_number,
            };
        }

        // Recomputer hash_self et comparer
        let recorded_hash = entry.hash_self.clone();
        entry.compute_hash();
        if entry.hash_self != recorded_hash {
            return ChainVerificationResult::EntryTampered {
                at_sequence: entry.sequence,
                line_number,
            };
        }

        expected_prev = entry.hash_self.unwrap();
    }

    ChainVerificationResult::Valid { total_entries: line_number }
}
```

---

## 6. Alertes Telegram — Notification en temps réel

### 6.1 Architecture recommandée

Telegram est recommandé face à WhatsApp Business API (incompatible avec le desktop : nécessite un serveur webhook, $0.004-$0.14 par message depuis juillet 2025).

**Crate :** `reqwest` (déjà une dépendance de Tauri) suffit pour l'envoi unidirectionnel en 20 lignes.

### 6.2 File d'attente persistante dans SQLCipher

```sql
-- Table de file d'attente (dans la base SQLCipher principale)
CREATE TABLE IF NOT EXISTS alert_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id TEXT NOT NULL UNIQUE,       -- UUID pour déduplication
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('P0', 'P1', 'P2')),
    payload TEXT NOT NULL,               -- JSON sérialisé
    event_hash TEXT NOT NULL,            -- SHA-256 pour déduplication (event_type + key_details)
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed', 'dead')),
    retry_count INTEGER DEFAULT 0,
    next_retry_at TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
```

### 6.3 Envoi avec retry exponentiel

```rust
// src/alerting/telegram.rs
use reqwest::Client;
use std::time::Duration;

pub struct TelegramAlerter {
    client: Client,
    bot_token: secrecy::SecretString,  // Stocké dans keychain OS
    chat_id: String,
}

impl TelegramAlerter {
    /// Envoie un message avec retry exponentiel (1s → 2s → 4s... plafond 1h)
    pub async fn send_with_retry(&self, message: &str, priority: &str) -> Result<(), AlertError> {
        let url = format!(
            "https://api.telegram.org/bot{}/sendMessage",
            self.bot_token.expose_secret()
        );

        let disable_notification = priority == "P2";  // P2 : silencieux
        let max_retries = 10u32;

        for attempt in 0..max_retries {
            let response = self.client
                .post(&url)
                .json(&serde_json::json!({
                    "chat_id": self.chat_id,
                    "text": message,
                    "parse_mode": "MarkdownV2",
                    "disable_notification": disable_notification,
                }))
                .timeout(Duration::from_secs(10))
                .send()
                .await;

            match response {
                Ok(r) if r.status().is_success() => return Ok(()),
                Ok(r) => {
                    eprintln!("Telegram error: HTTP {}", r.status());
                }
                Err(e) => {
                    eprintln!("Telegram network error: {}", e);
                }
            }

            if attempt < max_retries - 1 {
                // Backoff exponentiel avec 25% de jitter
                let base_delay = 2u64.pow(attempt).min(3600);
                let jitter = rand::thread_rng().gen_range(0..=(base_delay / 4));
                tokio::time::sleep(Duration::from_secs(base_delay + jitter)).await;
            }
        }

        Err(AlertError::MaxRetriesExceeded)
    }
}
```

### 6.4 Matrice de priorités

| Priorité | Événements | Délai d'envoi | Notification |
|---|---|---|---|
| **P0 — Critique** | Fichier canary accédé, debugger détecté, binaire falsifié, injection DLL, intégrité BD compromise | Immédiat (< 1s) | Sonore + priorité max |
| **P1 — Warning** | Chaîne de hash cassée, config modifiée, sidecar crashé, LD_PRELOAD détecté, 3+ échecs en 5 min | Batch 5 minutes | Standard |
| **P2 — Info** | Démarrage/arrêt, vérification réussie, rotation des logs | Digest quotidien | Silencieux |

**Règle d'escalade :** si 5+ alertes P1 surviennent en 10 minutes → agrégation en P0 unique "tempête d'alertes" + cooldown 30 minutes (seuls les P0 individuels passent ensuite).

---

## 7. Kill Switch et Remote Wipe — Confirmation progressive

### 7.1 Principes de conception

Les actions destructives et irréversibles (effacement des données, désactivation des protections) doivent nécessiter :
1. Plusieurs échecs consécutifs confirmés (minimum 3)
2. Délai incompressible entre les étapes
3. Confirmation explicite par saisie de texte

```rust
// src/security/kill_switch.rs

pub struct KillSwitchManager {
    confirmation_state: Mutex<KillSwitchState>,
}

#[derive(Default)]
struct KillSwitchState {
    trigger_count: u32,
    last_trigger: Option<std::time::Instant>,
    confirmation_token: Option<String>,
    token_expires_at: Option<std::time::Instant>,
}

impl KillSwitchManager {
    /// Phase 1 : Premier trigger — démarre le processus de confirmation
    pub fn trigger_phase_1(&self) -> KillSwitchResponse {
        let mut state = self.confirmation_state.lock().unwrap();
        state.trigger_count += 1;
        state.last_trigger = Some(std::time::Instant::now());

        if state.trigger_count < 3 {
            return KillSwitchResponse::RequireMoreConfirmations {
                remaining: 3 - state.trigger_count,
            };
        }

        // Générer un token de confirmation à usage unique
        let token: String = (0..8)
            .map(|_| format!("{:X}", rand::thread_rng().gen::<u8>()))
            .collect::<Vec<_>>()
            .join("-");

        state.confirmation_token = Some(token.clone());
        state.token_expires_at = Some(
            std::time::Instant::now() + std::time::Duration::from_secs(60)
        );

        KillSwitchResponse::RequireTokenConfirmation { token }
    }

    /// Phase 2 : Confirmation du token + délai incompressible de 5 secondes
    pub async fn trigger_phase_2(&self, entered_token: &str) -> KillSwitchResponse {
        {
            let state = self.confirmation_state.lock().unwrap();

            // Vérifier que le token est valide et non expiré
            match (&state.confirmation_token, state.token_expires_at) {
                (Some(token), Some(expires)) => {
                    if std::time::Instant::now() > expires {
                        return KillSwitchResponse::TokenExpired;
                    }
                    // Comparaison en temps constant
                    if !constant_time_eq(token.as_bytes(), entered_token.as_bytes()) {
                        return KillSwitchResponse::InvalidToken;
                    }
                }
                _ => return KillSwitchResponse::NotInitialized,
            }
        }

        // Délai incompressible avant exécution
        tokio::time::sleep(std::time::Duration::from_secs(5)).await;

        // Exécution du wipe
        self.execute_wipe().await;
        KillSwitchResponse::WipeExecuted
    }

    async fn execute_wipe(&self) {
        // Log AVANT effacement
        log_security_event("KILL_SWITCH_ACTIVATED");
        // Zéroiser tous les secrets en mémoire
        clear_all_secrets_from_memory();
        // Supprimer la base de données
        // Supprimer les logs locaux
        // Notifier via Telegram si encore possible
    }
}
```

---

## 8. Monitoring réseau — Détection de connexions suspectes

```rust
// src/monitoring/network.rs

/// Surveille les connexions sortantes inattendues
/// Via /proc/net/tcp (Linux) — lecture directe sans privilèges
#[cfg(target_os = "linux")]
pub async fn monitor_suspicious_connections(alert_tx: tokio::sync::mpsc::Sender<NetworkAlert>) {
    let mut known_connections: std::collections::HashSet<String> = std::collections::HashSet::new();

    // Ports légitimes de l'application
    let expected_ports = [443u16, 8080, 11434]; // HTTPS, API, Ollama local
    let expected_destinations = ["api.openai.com", "api.anthropic.com"];

    loop {
        if let Ok(tcp_data) = std::fs::read_to_string("/proc/net/tcp") {
            for line in tcp_data.lines().skip(1) {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() < 4 { continue; }

                // Format /proc/net/tcp : adresse:port en hex
                let remote_addr = parts[2];
                if let Ok(port) = u16::from_str_radix(&remote_addr[9..], 16) {
                    if !expected_ports.contains(&port) && port < 1024 {
                        let conn_id = format!("{}:{}", remote_addr, port);
                        if !known_connections.contains(&conn_id) {
                            known_connections.insert(conn_id);
                            let _ = alert_tx.send(NetworkAlert {
                                severity: AlertSeverity::Warning,
                                message: format!("Unexpected connection to port {}", port),
                            }).await;
                        }
                    }
                }
            }
        }
        tokio::time::sleep(std::time::Duration::from_secs(30)).await;
    }
}
```

---

## 9. Stockage des logs — Chemins et chiffrement

| Plateforme | Chemin par défaut |
|---|---|
| Linux | `~/.local/share/appname/security_logs/` |
| Windows | `%APPDATA%\OrgName\AppName\data\security_logs\` |
| macOS | `~/Library/Application Support/com.Org.App/security_logs/` |

```rust
// Résolution cross-platform via crate directories v5.x
use directories::ProjectDirs;

fn get_security_log_path() -> Option<std::path::PathBuf> {
    ProjectDirs::from("com", "MyOrg", "MyApp")
        .map(|dirs| dirs.data_dir().join("security_logs"))
}
```

**Chiffrement des logs :**
- Option 1 (simple) : stocker dans une table dédiée de la base SQLCipher existante — réutilise le chiffrement
- Option 2 (séparé) : AES-256-GCM (`aes-gcm v0.10`), clé dérivée via Argon2id (`argon2 v0.5`) depuis le mot de passe utilisateur, sel différent de la BD (séparation de domaine)

**Rétention :** 90 jours actifs, 1 an en archive compressée, plafond 50-100 Mo — conforme RGPD Article 5(1)(e). Ne jamais logguer de PII : utiliser des identifiants hachés tronqués (`sha256:a1b2c3d4`).

---

## Checklist défensive

- [ ] 15 canary files déployés avec noms réalistes (aucun mot interdit)
- [ ] Contenus crédibles : formats de clés AWS, Stripe, SendGrid syntaxiquement valides
- [ ] Génération des emplacements depuis un seed aléatoire au déploiement (pas en dur dans le code)
- [ ] Seed stocké dans `canary_config.json` (`.gitignore`)
- [ ] Linux : inotify `IN_OPEN` + `IN_ACCESS` pour détecter les lectures sans privilèges
- [ ] Linux : fanotify pour identification du PID accesseur (si `CAP_SYS_ADMIN` disponible)
- [ ] Windows : polling du timestamp `last-access` (+ `fsutil behavior set disablelastaccess 0`)
- [ ] Réponse canary : log → alerte Telegram P0 → verrouillage optionnel
- [ ] Canary records SQLCipher : enregistrements pièges dans les tables réelles
- [ ] Tarpit auth : exponential backoff 2s → 60s, blacklist après 10 tentatives
- [ ] Tarpit : taille bornée de la Map (max 10 000 entrées, protection OOM)
- [ ] Audit log : format JSON structuré (OWASP Logging Vocabulary)
- [ ] Hash chaining SHA-256 sur chaque entrée (hash_prev)
- [ ] Ancres HMAC périodiques dans le keychain OS (`keyring v3.6`)
- [ ] Outil de vérification de la chaîne disponible (CLI ou menu)
- [ ] Logs : append-only, jamais de modification ni suppression
- [ ] Telegram : file d'attente SQLite persistante (survie aux redémarrages)
- [ ] Telegram : retry exponentiel (backoff 1s → 3600s, max 10 tentatives)
- [ ] Déduplication par SHA-256 sur `event_type + key_details` (pas le timestamp)
- [ ] Token bot Telegram stocké dans keychain OS (pas en dur dans le code)
- [ ] Kill switch : 3 confirmations consécutives minimum + délai 5s incompressible
- [ ] P0 : < 1 seconde d'envoi ; P1 : batch 5 min ; P2 : digest quotidien silencieux
- [ ] Escalade tempête : 5+ P1 en 10 min → P0 agrégé + cooldown 30 min
- [ ] Chemins de log : `directories v5.x` pour résolution cross-platform
- [ ] Chiffrement des logs : table SQLCipher dédiée ou AES-256-GCM séparé
- [ ] Rétention : 90 jours actifs, 1 an archive, max 100 Mo
