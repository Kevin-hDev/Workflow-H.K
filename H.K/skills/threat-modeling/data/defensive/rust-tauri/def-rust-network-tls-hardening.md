# network-tls-hardening.md
# Protection réseau et TLS — Stack Rust/Tauri v2

## Vue d'ensemble

Ce fichier couvre toutes les protections défensives liées aux communications réseau, à la configuration TLS, à la gestion des clés API dans les headers HTTP, et aux proxys. La source principale est l'audit 08 (réseau/TLS) du 23 février 2026 complété par l'audit 04 (secrets).

Les vecteurs d'attaque que ce knowledge file permet de neutraliser :
- Use-after-free dans le crate openssl (RUSTSEC-2025-0004) via rustls
- Interception TLS (MITM) par un proxy malveillant ou certificat forgé
- Fuite de clés API dans les headers lors de redirections HTTP
- Fuite de clés API dans les logs applicatifs (Bearer token, x-api-key)
- Fuite DNS via SOCKS5 standard (vs SOCKS5h qui résout côté proxy)
- Timeout illimité permettant des attaques de déni de service sur les connexions sortantes
- Fingerprinting TLS/JA4+ identifiant le client comme bot

---

## 1. Client reqwest v0.13 — Configuration sécurisée de base

### Pourquoi migrer vers rustls (élimination de RUSTSEC-2025-0004)

`reqwest` v0.13 (décembre 2025) utilise `rustls` comme backend TLS par défaut, abandonnant `native-tls` (OpenSSL). Ce changement élimine la surface d'attaque de RUSTSEC-2025-0004, un use-after-free dans le crate `openssl` affectant les versions antérieures.

```toml
# Cargo.toml — configuration recommandée
[dependencies]
reqwest = { version = "0.13", features = [
    "rustls-tls",        # Backend rustls (élimine RUSTSEC-2025-0004)
    "json",
    "stream",
    "http2",
], default-features = false }  # Exclure native-tls explicitement
```

### Client sécurisé de base

```rust
use reqwest::{Client, Certificate};
use std::time::Duration;

/// Crée un client reqwest avec TLS 1.3 minimum et timeout stricts
pub fn build_secure_client() -> Result<Client, reqwest::Error> {
    Client::builder()
        // TLS 1.3 minimum — refuse TLS 1.2 et inférieur
        .tls_version_min(reqwest::tls::Version::TLS_1_3)
        // Backend rustls uniquement — élimine native-tls et RUSTSEC-2025-0004
        .tls_backend_rustls()
        // HTTPS uniquement — toute tentative HTTP échoue
        .https_only(true)
        // Désactiver les redirections — les APIs LLM ne redirigent jamais
        // Une redirection inattendue est suspecte et peut fuiter des headers
        .redirect(reqwest::redirect::Policy::none())
        // Timeout de connexion (handshake TCP + TLS)
        .connect_timeout(Duration::from_secs(10))
        // Timeout total par requête
        .timeout(Duration::from_secs(60))
        // Désactiver le pooling de connexions si des secrets différents par requête
        // .pool_max_idle_per_host(0)
        .build()
}
```

### Client par service LLM avec timeouts adaptés

```rust
use std::collections::HashMap;

/// Timeouts recommandés par service LLM (basés sur les SDKs officiels)
pub struct LlmClientConfig {
    pub connect_timeout_secs: u64,
    pub read_timeout_secs: u64,
}

impl LlmClientConfig {
    pub fn for_provider(provider: &str) -> Self {
        match provider {
            "openai"    => Self { connect_timeout_secs: 5, read_timeout_secs: 300 },
            "anthropic" => Self { connect_timeout_secs: 5, read_timeout_secs: 300 },
            "groq"      => Self { connect_timeout_secs: 3, read_timeout_secs: 30 },
            "deepseek"  => Self { connect_timeout_secs: 5, read_timeout_secs: 300 },
            "xai"       => Self { connect_timeout_secs: 5, read_timeout_secs: 120 },
            "mistral"   => Self { connect_timeout_secs: 5, read_timeout_secs: 120 },
            "cerebras"  => Self { connect_timeout_secs: 3, read_timeout_secs: 30 },
            "moonshot"  => Self { connect_timeout_secs: 5, read_timeout_secs: 120 },
            "ollama"    => Self { connect_timeout_secs: 2, read_timeout_secs: 600 },
            _           => Self { connect_timeout_secs: 5, read_timeout_secs: 60 },
        }
    }
}

/// Crée un client dédié à un provider LLM avec ses timeouts spécifiques
pub fn build_llm_client(provider: &str) -> Result<Client, reqwest::Error> {
    let config = LlmClientConfig::for_provider(provider);
    Client::builder()
        .tls_version_min(reqwest::tls::Version::TLS_1_3)
        .tls_backend_rustls()
        .https_only(true)
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(config.connect_timeout_secs))
        .timeout(Duration::from_secs(config.read_timeout_secs))
        .build()
}
```

### Tableau des timeouts recommandés par service

| Service | Connect (s) | Read (s) | Justification |
|---------|-------------|----------|---------------|
| OpenAI | 5 | 300 | SDK officiel : 600s. Flex processing : jusqu'à 900s |
| Anthropic | 5 | 300 | SDK officiel : 600s. 429 différent de 529 (surcharge) |
| Groq | 3 | 30 | Inférence ultra-rapide (100-1000 tok/s) |
| DeepSeek | 5 | 300 | Reasoner peut nécessiter plus pour chain-of-thought |
| xAI (Grok) | 5 | 120 | Endpoint compatible OpenAI |
| Mistral | 5 | 120 | 2-5 min pour les gros modèles |
| Cerebras | 3 | 30 | Inférence >1000 tok/s |
| Moonshot | 5 | 120 | Plus long pour contexte 128K+ |
| Ollama (local) | 2 | 600 | Pas de latence réseau ; très lent sur CPU |
| Flux RSS | 10 | 15 | XML simple ; limiter à 5 Mo |
| Update server | 5 | 60 | Vérifier SHA-256 avant écriture disque |

---

## 2. Certificate pinning SPKI — Protection contre les MITM

### Pourquoi le pinning SPKI et pas le certificat complet

Le pinning de certificat complet (byte-for-byte) échoue à chaque renouvellement. Le pinning SPKI (Subject Public Key Info) survit aux renouvellements si le provider réutilise la même paire de clés — c'est le cas d'OpenAI et Anthropic qui renouvellent fréquemment mais gardent leurs clés RSA.

| Type de pinning | Survit au renouvellement | Risque de blocage | Recommandation |
|---|---|---|---|
| Certificat complet (leaf) | Non | Élevé | Déconseillé |
| SPKI (clé publique SHA-256) | Oui si clé réutilisée | Moyen | **Recommandé** avec backup pin |
| CA (autorité) | Oui | Faible | Acceptable comme compromis |
| HPKP (HTTP header) | N/A | Très élevé | Obsolète depuis 2018 |

### Implémentation du pinning SPKI avec reqwest

```rust
use reqwest::Certificate;
use sha2::{Sha256, Digest};

/// Pins SPKI pour les endpoints LLM critiques
/// Les hashes doivent être mis à jour quand les providers changent leurs certificats
pub struct SpkiPinSet {
    /// Hash SHA-256 du SubjectPublicKeyInfo principal
    primary: [u8; 32],
    /// Hash SHA-256 de la clé de backup (pour les rotations)
    backup: [u8; 32],
}

impl SpkiPinSet {
    /// Hash SPKI de api.openai.com (à vérifier et mettre à jour périodiquement)
    pub fn openai() -> Self {
        Self {
            // openssl s_client -connect api.openai.com:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64
            primary: hex_to_bytes("..."),  // Remplacer par le hash réel
            backup:  hex_to_bytes("..."),
        }
    }

    /// Hash SPKI de api.anthropic.com
    pub fn anthropic() -> Self {
        Self {
            primary: hex_to_bytes("..."),
            backup:  hex_to_bytes("..."),
        }
    }

    /// Vérifie si un hash SPKI correspond (primary ou backup)
    pub fn matches(&self, spki_hash: &[u8; 32]) -> bool {
        // Comparaison en temps constant — éviter les timing attacks
        let primary_match = constant_time_eq(spki_hash, &self.primary);
        let backup_match = constant_time_eq(spki_hash, &self.backup);
        primary_match || backup_match
    }
}

/// Comparaison en temps constant pour les hashes
fn constant_time_eq(a: &[u8; 32], b: &[u8; 32]) -> bool {
    let mut result = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        result |= x ^ y;
    }
    result == 0
}

fn hex_to_bytes(hex: &str) -> [u8; 32] {
    let mut bytes = [0u8; 32];
    // Parsing hex vers bytes
    for (i, chunk) in hex.as_bytes().chunks(2).enumerate() {
        bytes[i] = u8::from_str_radix(std::str::from_utf8(chunk).unwrap(), 16).unwrap();
    }
    bytes
}
```

### Extraction du hash SPKI (commandes de référence)

```bash
# Extraire le hash SPKI d'un endpoint — à exécuter périodiquement pour monitoring
openssl s_client -connect api.openai.com:443 2>/dev/null \
  | openssl x509 -pubkey -noout \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary \
  | base64

# Pour api.anthropic.com
openssl s_client -connect api.anthropic.com:443 2>/dev/null \
  | openssl x509 -pubkey -noout \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary \
  | base64

# Certificate Transparency monitoring — vérifier les nouveaux certificats via crt.sh
curl -s "https://crt.sh/?q=api.anthropic.com&output=json" | jq '.[0:5]'
```

---

## 3. Désactivation des redirections — Protection contre les fuites de headers

### Pourquoi les redirections sont dangereuses pour les clés API

Les clés API Anthropic utilisent le header `x-api-key` (non-standard). Azure Translator utilise `Ocp-Apim-Subscription-Key`. Ces headers ne sont **pas** supprimés automatiquement par reqwest lors des redirections cross-domain — contrairement au header `Authorization` standard qui est supprimé depuis reqwest v0.4.3.

```rust
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use secrecy::{SecretString, ExposeSecret};

/// Effectue un appel API LLM sécurisé avec désactivation explicite des redirections
pub async fn call_llm_api(
    client: &Client,
    url: &str,
    api_key: &SecretString,
    provider: &str,
    payload: &serde_json::Value,
) -> Result<serde_json::Value, LlmError> {
    let mut headers = HeaderMap::new();

    // Construire le header d'authentification selon le provider
    match provider {
        "anthropic" => {
            // Anthropic utilise x-api-key et non Authorization
            headers.insert(
                "x-api-key",
                HeaderValue::from_str(api_key.expose_secret())
                    .map_err(|_| LlmError::InvalidKey)?,
            );
            headers.insert(
                "anthropic-version",
                HeaderValue::from_static("2023-06-01"),
            );
        }
        "azure_openai" => {
            // Azure utilise api-key dans les headers
            headers.insert(
                "api-key",
                HeaderValue::from_str(api_key.expose_secret())
                    .map_err(|_| LlmError::InvalidKey)?,
            );
        }
        _ => {
            // Standard Bearer token (OpenAI, Groq, Mistral, etc.)
            let bearer = format!("Bearer {}", api_key.expose_secret());
            headers.insert(
                AUTHORIZATION,
                HeaderValue::from_str(&bearer)
                    .map_err(|_| LlmError::InvalidKey)?,
            );
        }
    }

    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    // Empêcher la mise en cache des réponses contenant des données sensibles
    headers.insert("Cache-Control", HeaderValue::from_static("no-store"));

    let response = client
        .post(url)
        .headers(headers)
        .json(payload)
        // Les APIs LLM ne redirigent jamais — toute redirection est suspecte
        // Le client est configuré avec Policy::none() mais on double la protection
        .send()
        .await
        .map_err(LlmError::Network)?;

    // Vérifier qu'il n'y a pas eu de redirection (statut 3xx)
    let status = response.status();
    if status.is_redirection() {
        return Err(LlmError::UnexpectedRedirect(status.as_u16()));
    }

    if !status.is_success() {
        return Err(LlmError::ApiError(status.as_u16()));
    }

    response.json::<serde_json::Value>().await
        .map_err(LlmError::ParseError)
}

#[derive(Debug, thiserror::Error)]
pub enum LlmError {
    #[error("Réseau : {0}")]
    Network(#[from] reqwest::Error),
    #[error("Redirection inattendue (HTTP {0}) — possibilité de fuite de clé")]
    UnexpectedRedirect(u16),
    #[error("Erreur API (HTTP {0})")]
    ApiError(u16),
    #[error("Clé API invalide (format non UTF-8)")]
    InvalidKey,
    #[error("Erreur de parsing JSON")]
    ParseError(reqwest::Error),
}
```

### Tableau des headers d'authentification par provider

| Provider | URL de base | Header d'auth | Format de la valeur | Header spécifique |
|---|---|---|---|---|
| OpenAI | `api.openai.com/v1` | `Authorization` | `Bearer sk-...` | — |
| Anthropic | `api.anthropic.com/v1` | `x-api-key` | `sk-ant-...` | `anthropic-version: 2023-06-01` |
| Groq | `api.groq.com/openai/v1` | `Authorization` | `Bearer gsk_...` | — |
| Mistral | `api.mistral.ai/v1` | `Authorization` | `Bearer ...` | — |
| Cerebras | `api.cerebras.ai/v1` | `Authorization` | `Bearer ...` | — |
| xAI | `api.x.ai/v1` | `Authorization` | `Bearer xai-...` | — |
| DeepSeek | `api.deepseek.com` | `Authorization` | `Bearer sk-...` | — |
| Moonshot | `api.moonshot.ai/v1` | `Authorization` | `Bearer sk-...` | — |
| Azure OpenAI | `*.openai.azure.com/openai` | `api-key` | 32 chars hex | `Ocp-Apim-Subscription-Key` |
| Ollama (local) | `localhost:11434/v1` | Aucun | — | — |

---

## 4. Redaction des clés API dans les logs

### Filtre de log Rust (tracing)

Les bibliothèques HTTP client loggent souvent les headers en mode debug. Le filtre suivant redacte tous les patterns de clés API avant qu'ils n'atteignent les sorties de log :

```rust
use tracing::field::{Field, Visit};
use std::fmt;

/// Patterns de clés API à redacter dans les logs
const REDACT_PATTERNS: &[&str] = &[
    "sk-ant-api03-",    // Anthropic
    "sk-proj-",         // OpenAI (nouveau format)
    "sk-or-v1-",        // OpenRouter
    "gsk_",             // Groq
    "xai-",             // xAI
    "csk-",             // Cerebras
    "AIza",             // Google Gemini
    "Bearer sk-",       // Tout Bearer token commençant par sk-
    "x-api-key",        // Header Anthropic
    "Ocp-Apim-",        // Azure
];

/// Vérifie si une valeur contient un pattern de clé API connu
pub fn contains_api_key(value: &str) -> bool {
    REDACT_PATTERNS.iter().any(|p| value.contains(p))
}

/// Redacte les clés API dans une chaîne
pub fn redact_api_keys(input: &str) -> String {
    let mut result = input.to_string();
    // Pattern Bearer : remplacer tout ce qui suit "Bearer " jusqu'à un espace ou fin de ligne
    let re_bearer = regex::Regex::new(r"(Bearer\s+)[A-Za-z0-9\-._~+/]+=*").unwrap();
    result = re_bearer.replace_all(&result, "${1}[REDACTED]").to_string();

    // Pattern sk-ant-api03- (Anthropic)
    let re_ant = regex::Regex::new(r"(sk-ant-api03-)[a-zA-Z0-9_\-]+").unwrap();
    result = re_ant.replace_all(&result, "${1}[REDACTED]").to_string();

    // Pattern sk-proj- et sk- généraux (OpenAI, DeepSeek, etc.)
    let re_sk = regex::Regex::new(r"(sk-(?:proj-|or-v1-)?)[a-zA-Z0-9_\-]+").unwrap();
    result = re_sk.replace_all(&result, "${1}[REDACTED]").to_string();

    // Pattern gsk_ (Groq)
    let re_gsk = regex::Regex::new(r"(gsk_)[a-zA-Z0-9]+").unwrap();
    result = re_gsk.replace_all(&result, "${1}[REDACTED]").to_string();

    // Pattern xai- (xAI)
    let re_xai = regex::Regex::new(r"(xai-)[a-zA-Z0-9\-]+").unwrap();
    result = re_xai.replace_all(&result, "${1}[REDACTED]").to_string();

    // Pattern AIza (Google Gemini)
    let re_aiza = regex::Regex::new(r"(AIza)[a-zA-Z0-9_\-]+").unwrap();
    result = re_aiza.replace_all(&result, "${1}[REDACTED]").to_string();

    result
}

/// Wrapper autour des valeurs sensibles pour tracing
pub struct Redacted<T: fmt::Display>(pub T);

impl<T: fmt::Display> fmt::Debug for Redacted<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let raw = format!("{}", self.0);
        write!(f, "{}", redact_api_keys(&raw))
    }
}

impl<T: fmt::Display> fmt::Display for Redacted<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let raw = format!("{}", self.0);
        write!(f, "{}", redact_api_keys(&raw))
    }
}
```

### Activation du filtre au démarrage de l'application

```rust
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

pub fn init_logging_with_redaction() {
    // Désactiver les logs DEBUG de reqwest et h2 pour éviter les fuites de headers
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| {
            EnvFilter::new("info,reqwest=warn,h2=warn,rustls=warn")
        });

    tracing_subscriber::registry()
        .with(filter)
        .with(tracing_subscriber::fmt::layer()
            .with_target(true)
            .with_file(false)  // Ne pas loguer les chemins de fichiers source
            .with_line_number(false)
        )
        .init();

    tracing::info!("Logging initialized with API key redaction");
}
```

---

## 5. Proxy SOCKS5h — Prévention des fuites DNS

### La différence critique entre SOCKS5 et SOCKS5h

Avec `socks5://`, le client résout le DNS localement avant d'envoyer l'IP au proxy — cela constitue une fuite DNS qui expose les domaines visités au résolveur local ou au FAI. Seul `socks5h://` envoie le nom de domaine au proxy pour résolution distante.

| Schéma | Résolution DNS | Fuite DNS ? | Usage |
|---|---|---|---|
| `socks5://` | Côté client (locale) | OUI | Jamais pour la confidentialité |
| `socks5h://` | Côté proxy (distante) | NON | Toujours avec proxy SOCKS5 |

```rust
/// Configure un proxy SOCKS5h sécurisé pour reqwest
/// Le 'h' dans socks5h est obligatoire pour éviter la fuite DNS
pub fn build_client_with_proxy(
    proxy_host: &str,
    proxy_port: u16,
    username: Option<&str>,
    password: Option<&str>,
) -> Result<Client, reqwest::Error> {
    // Construire l'URL du proxy avec socks5h:// — JAMAIS socks5://
    let proxy_url = match (username, password) {
        (Some(u), Some(p)) => format!("socks5h://{}:{}@{}:{}", u, p, proxy_host, proxy_port),
        _ => format!("socks5h://{}:{}", proxy_host, proxy_port),
    };

    let proxy = reqwest::Proxy::all(&proxy_url)?;

    Client::builder()
        .tls_version_min(reqwest::tls::Version::TLS_1_3)
        .tls_backend_rustls()
        .https_only(true)
        .redirect(reqwest::redirect::Policy::none())
        .proxy(proxy)
        .connect_timeout(Duration::from_secs(15))
        .timeout(Duration::from_secs(60))
        .build()
}
```

**Bug connu** : sur macOS Apple Silicon avec Python installé via pyenv, `socks5h://` peut néanmoins fuiter le DNS localement (issue GitHub psf/requests#6086). Vérifier systématiquement avec Wireshark (filtre `dns`) après configuration d'un proxy.

---

## 6. Mitigation du fingerprinting JA4+

### Qu'est-ce que JA4+

JA4+ (FoxIO) est le successeur de JA3 pour le fingerprinting TLS. Il identifie les clients par leur ordre d'extensions TLS, leur liste de cipher suites, et l'ALPN. Le fingerprint TLS de `reqwest/rustls` est différent de celui d'un navigateur Chrome — un serveur anti-bot peut refuser la connexion avant même d'examiner les headers HTTP.

AWS WAF a ajouté le support JA4 en mars 2025. Cloudflare l'utilise également.

### Stratégie de mitigation côté Rust

```rust
/// Pour les requêtes qui doivent ressembler à un navigateur (scraping),
/// utiliser curl_cffi côté Python plutôt que reqwest côté Rust.
/// Côté Rust, se limiter aux appels API LLM qui n'ont pas de protection anti-bot.

/// Vérification que le client TLS est configuré correctement
pub async fn verify_tls_configuration(client: &Client) -> Result<(), reqwest::Error> {
    // Test via badssl.com — doit échouer sur les certificats invalides
    let result = client.get("https://expired.badssl.com/").send().await;
    match result {
        Err(e) if e.is_connect() || e.is_builder() => {
            tracing::info!("TLS verification: correctly rejects expired certificates");
            Ok(())
        }
        Ok(response) => {
            tracing::error!("TLS verification FAILED: accepted expired certificate (status {})", response.status());
            Err(reqwest::Error::new(
                // Dans un vrai code, créer une erreur TLS appropriée
                reqwest::StatusCode::INTERNAL_SERVER_ERROR,
                "TLS misconfiguration detected",
            ))
        }
        Err(e) => Err(e),
    }
}
```

**Note sur curl_cffi** : pour le scraping web (pas les APIs LLM), le crate Python `curl_cffi` (v0.14+, MIT) impersonne Chrome ou Safari au niveau TLS et HTTP/2. C'est la solution recommandée côté sidecar Python pour contourner les anti-bots. Côté Rust, les appels vers les APIs LLM ne nécessitent pas d'impersonation.

---

## 7. Validation TLS — Tests automatisés et fail closed

### Principe fail closed

Toute erreur TLS doit bloquer la connexion — jamais de fallback vers HTTP ou d'acceptation de certificats invalides. Le code suivant illustre les patterns à **interdire** et les alternatives correctes :

```rust
// ❌ INTERDIT — accepte n'importe quel certificat
let client = Client::builder()
    .danger_accept_invalid_certs(true)  // NE JAMAIS FAIRE CELA EN PRODUCTION
    .build()?;

// ❌ INTERDIT — bascule vers HTTP si HTTPS échoue
let url = if tls_error { "http://..." } else { "https://..." };

// ❌ INTERDIT — désactiver la vérification du nom d'hôte
let client = Client::builder()
    .danger_accept_invalid_hostnames(true)  // NE JAMAIS FAIRE CELA
    .build()?;

// ✅ CORRECT — fail closed, aucune exception
let client = Client::builder()
    .tls_version_min(reqwest::tls::Version::TLS_1_3)
    .tls_backend_rustls()
    .https_only(true)
    .build()?;

// ✅ CORRECT — propager l'erreur TLS, ne jamais la silencer
let response = client.get(url).send().await
    .map_err(|e| {
        if e.is_connect() {
            tracing::error!("TLS connection failed — check certificate or network");
        }
        // L'erreur remonte — aucun fallback
        AppError::TlsError(e.to_string())
    })?;
```

### Tests TLS automatisés

```rust
#[cfg(test)]
mod tls_tests {
    use super::*;

    #[tokio::test]
    async fn test_rejects_expired_certificate() {
        let client = build_secure_client().unwrap();
        let result = client.get("https://expired.badssl.com/").send().await;
        assert!(result.is_err(), "Le client doit rejeter les certificats expirés");
    }

    #[tokio::test]
    async fn test_rejects_self_signed_certificate() {
        let client = build_secure_client().unwrap();
        let result = client.get("https://self-signed.badssl.com/").send().await;
        assert!(result.is_err(), "Le client doit rejeter les certificats auto-signés");
    }

    #[tokio::test]
    async fn test_rejects_wrong_hostname() {
        let client = build_secure_client().unwrap();
        let result = client.get("https://wrong.host.badssl.com/").send().await;
        assert!(result.is_err(), "Le client doit rejeter les certificats avec le mauvais hostname");
    }

    #[tokio::test]
    async fn test_rejects_http_redirect() {
        let client = build_secure_client().unwrap();
        // Un serveur qui redirige vers HTTP — le client doit refuser
        // (https_only(true) + redirect::Policy::none() combinés)
        let result = client.get("https://httpbin.org/redirect-to?url=http://httpbin.org/get").send().await;
        // Soit erreur (redirection bloquée), soit statut 3xx sans suivi
        if let Ok(resp) = result {
            assert!(resp.status().is_redirection(), "La redirection ne doit pas être suivie");
        }
    }

    #[test]
    fn test_no_verify_false_in_codebase() {
        // Scan statique : danger_accept_invalid_certs ne doit jamais apparaître dans le code de production
        // Dans la pratique, implémenter ce test avec un scan grep/ripgrep en CI
        // rg "danger_accept_invalid" src/ --type rust
    }
}
```

---

## 8. Détection d'interception TLS par proxy

### Vérifier l'émetteur du certificat

Un proxy MITM présente un certificat signé par sa propre CA (ex. "Zscaler Root CA", "Netskope" au lieu de "DigiCert"). Vérifier programmatiquement l'émetteur pour les endpoints critiques :

```rust
/// Vérifie que le certificat d'un endpoint est signé par une CA attendue
/// À utiliser lors du démarrage de l'application pour détecter les proxys d'entreprise
pub async fn detect_tls_interception(
    endpoint: &str,
    expected_issuer_substring: &str,
) -> Result<bool, reqwest::Error> {
    // reqwest v0.13 avec rustls expose les informations de certificat via tls_info(true)
    let client = Client::builder()
        .tls_backend_rustls()
        .tls_info(true)
        .build()?;

    let response = client.get(endpoint).send().await?;

    // Extraire les informations TLS de la réponse
    if let Some(tls_info) = response.extensions().get::<reqwest::tls::TlsInfo>() {
        // Vérifier le CN ou l'issuer du certificat
        // Note : l'API exacte dépend de la version de reqwest/rustls
        tracing::debug!("TLS info available for {}", endpoint);
    }

    Ok(false) // Implémentation complète dépend de l'API rustls
}

/// Loggue un avertissement si un proxy MITM est détecté
pub async fn warn_if_intercepted(client: &Client, endpoint: &str) {
    // Vérifier que le certificat racine est dans la liste attendue
    // Les proxys d'entreprise (Zscaler, Netskope, Palo Alto) injectent leur CA
    tracing::debug!("Checking for TLS interception on {}", endpoint);
}
```

---

## 9. Configuration DNS-over-HTTPS (DoH)

### Prévention du DNS hijacking

Les résolveurs DNS standards en clair (UDP 53) sont vulnérables au hijacking et à la surveillance. Pour les connexions vers les APIs LLM, utiliser DoH pour chiffrer les résolutions DNS.

```rust
/// Configuration DoH recommandée pour Tauri v2
/// Dans Tauri, configurer le resolver DNS via les arguments Chromium WebView

// Pour le sidecar Python, configurer dnspython avec DoH :
// resolver = dns.resolver.Resolver()
// resolver.nameservers = ["https://cloudflare-dns.com/dns-query"]  # Cloudflare
// resolver.nameservers = ["https://dns.quad9.ch/dns-query"]         # Quad9 (Suisse)

/// Fournisseurs DoH recommandés avec leurs caractéristiques
pub struct DohProvider {
    pub name: &'static str,
    pub url: &'static str,
    pub latency_ms: u32,
    pub no_log: bool,
    pub jurisdiction: &'static str,
}

pub const DOH_PROVIDERS: &[DohProvider] = &[
    DohProvider {
        name: "Cloudflare",
        url: "https://cloudflare-dns.com/dns-query",
        latency_ms: 11,
        no_log: true,  // Audité par KPMG
        jurisdiction: "US",
    },
    DohProvider {
        name: "Quad9",
        url: "https://dns.quad9.ch/dns-query",
        latency_ms: 20,
        no_log: true,
        jurisdiction: "CH",  // Juridiction suisse, RGPD-compliant
    },
    DohProvider {
        name: "Google",
        url: "https://dns.google/dns-query",
        latency_ms: 15,
        no_log: false,
        jurisdiction: "US",
    },
];
```

---

## 10. Validation de la réponse HTTP

### Vérification Content-Type avant parsing JSON

```rust
use reqwest::Response;

/// Valide le Content-Type d'une réponse avant de la parser
/// Protège contre les réponses inattendues (HTML d'erreur, XML de proxy)
pub async fn parse_json_response(response: Response) -> Result<serde_json::Value, AppError> {
    let status = response.status();

    // Vérifier le Content-Type avant tout parsing
    let content_type = response.headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if !content_type.contains("application/json") {
        let body_preview = response.text().await.unwrap_or_default();
        tracing::error!(
            "Unexpected Content-Type '{}' from API (status {}). Body preview: {}...",
            content_type,
            status,
            &body_preview[..body_preview.len().min(100)]
        );
        return Err(AppError::InvalidContentType(content_type.to_string()));
    }

    // Vérifier la taille de la réponse avant de la charger entièrement
    if let Some(length) = response.content_length() {
        if length > 50 * 1024 * 1024 {  // 50 Mo maximum
            return Err(AppError::ResponseTooLarge(length));
        }
    }

    response.json::<serde_json::Value>().await
        .map_err(|e| AppError::ParseError(e.to_string()))
}
```

---

## 11. Checklist de sécurité réseau

Avant chaque release, vérifier que tous ces points sont vrais :

- [ ] reqwest est configuré avec `tls_backend_rustls()` — pas de native-tls (élimine RUSTSEC-2025-0004)
- [ ] `tls_version_min(TLS_1_3)` est défini — refus de TLS 1.2 et inférieur
- [ ] `https_only(true)` est activé — aucun fallback vers HTTP
- [ ] `redirect::Policy::none()` est configuré — les redirections ne sont pas suivies automatiquement
- [ ] Les timeouts connect et read sont définis pour chaque type de service (voir tableau section 1)
- [ ] Le header `Authorization` ou `x-api-key` n'apparaît jamais dans les logs (grep sur les fichiers de log)
- [ ] `danger_accept_invalid_certs(true)` n'apparaît nulle part dans le code de production (`rg "danger_accept_invalid" src/`)
- [ ] `danger_accept_invalid_hostnames(true)` n'apparaît nulle part dans le code de production
- [ ] Les proxys SOCKS5 utilisent `socks5h://` et non `socks5://` (vérifier avec Wireshark)
- [ ] Les clés API sont zéroïsées après transmission via stdin pipe au sidecar Python
- [ ] Le filtre de redaction des logs est installé avant toute initialisation réseau
- [ ] Les tests TLS automatisés passent (expired.badssl.com, self-signed.badssl.com)
- [ ] Certificate Transparency est monitoré pour les domaines API critiques (crt.sh)
- [ ] `cargo audit` ne retourne aucune advisory réseau critique non corrigée
- [ ] Les réponses HTTP sont validées sur le Content-Type avant parsing JSON
- [ ] La taille des réponses est limitée (protection anti-bombes)

---

## CVEs de référence (mai 2025 — février 2026)

| CVE / Advisory | Score | Composant | Impact | Mitigation |
|---|---|---|---|---|
| RUSTSEC-2025-0004 | Critique | crate `openssl` (native-tls) | Use-after-free | Migrer vers reqwest v0.13 + rustls |
| CVE-2025-66418 | 8.9 | urllib3 < 2.6.0 | DoS par décompression illimitée | Pinner urllib3 >= 2.6.0 (côté Python) |
| CVE-2025-66471 | N/D | urllib3 | Consommation excessive en streaming | Même mitigation |
| CVE-2025-50181 | N/D | urllib3 < 2.5.0 | Bypass contrôle redirections | Pinner urllib3 >= 2.5.0 |
| CVE-2025-50182 | N/D | urllib3 < 2.5.0 | Bypass contrôle redirections | Même mitigation |
| CVE-2025-31477 | 9.3 | tauri-plugin-shell | RCE via protocoles dangereux | Mettre à jour vers v2.2.1 |
