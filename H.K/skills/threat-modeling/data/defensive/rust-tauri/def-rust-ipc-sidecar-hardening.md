# ipc-sidecar-hardening.md
# Blindage IPC et Sidecar — défenses concrètes

Ce fichier documente les protections à appliquer à la communication inter-processus (IPC entre Tauri core et sidecar Python) et au lancement sécurisé du sidecar. Il couvre l'authentification HMAC-SHA256, la prévention d'injection de commandes, la vérification d'intégrité SHA-256, les sockets sécurisés, et la protection anti-replay.

---

## Vue d'ensemble

Le pipeline Tauri (Rust) ↔ sidecar Python est non authentifié par défaut. Aucun mécanisme de Tauri ne vérifie que le processus qui répond sur stdout est bien le sidecar légitime, ni que les messages n'ont pas été altérés. Les risques principaux sont : remplacement du binaire sidecar, injection d'arguments (CWE-88), `subprocess.run(shell=True)` dans le sidecar Python, et replay d'anciens messages IPC. Chaque section de ce fichier fournit une contre-mesure concrète.

---

## 1. Authentification IPC : HMAC-SHA256

### Le problème

Sans authentification, tout processus du même utilisateur peut envoyer des messages sur le stdin du sidecar ou lire son stdout. Le sidecar ne peut pas vérifier que les instructions qu'il reçoit viennent bien du backend Tauri légitime.

### La défense : HMAC-SHA256 avec nonce + timestamp + fenêtre anti-replay

```toml
# Cargo.toml — dépendances pour l'authentification IPC
[dependencies]
hmac = "0.12"
sha2 = "0.10"
rand = { version = "0.8", features = ["std"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

```rust
// src-tauri/src/ipc/auth.rs
use hmac::{Hmac, Mac};
use sha2::Sha256;
use rand::RngCore;
use rand::rngs::OsRng;
use std::collections::HashSet;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use zeroize::ZeroizeOnDrop;

type HmacSha256 = Hmac<Sha256>;

/// Durée de validité d'un message — au-delà, il est rejeté.
const MESSAGE_TTL_MS: u64 = 30_000;

/// Taille maximale du cache de nonces anti-replay.
/// 32 bytes/nonce × 10 000 = 320 Ko maximum.
const MAX_NONCES: usize = 10_000;

/// Message IPC signé transmis entre le backend Rust et le sidecar Python.
#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct SignedCommand {
    /// Nonce aléatoire 256 bits — garantit l'unicité de chaque message.
    pub nonce: [u8; 32],
    /// Timestamp en millisecondes depuis UNIX epoch.
    pub timestamp_ms: u64,
    /// Payload JSON sérialisé.
    pub payload: Vec<u8>,
    /// Signature HMAC-SHA256(nonce || timestamp || payload).
    pub signature: Vec<u8>,
}

/// Clé partagée entre Rust et le sidecar — zéroïsée au drop.
#[derive(ZeroizeOnDrop)]
pub struct SharedSecret([u8; 32]);

impl SharedSecret {
    /// Génère une nouvelle clé depuis le CSPRNG système.
    pub fn generate() -> Self {
        let mut key = [0u8; 32];
        OsRng.fill_bytes(&mut key);
        Self(key)
    }

    pub fn as_bytes(&self) -> &[u8] {
        &self.0
    }
}

/// Signe un payload et retourne le message prêt à être transmis.
pub fn signer_commande(secret: &SharedSecret, payload: &[u8]) -> Result<SignedCommand, String> {
    let mut nonce = [0u8; 32];
    OsRng.fill_bytes(&mut nonce);

    let timestamp_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("Horloge système invalide : {}", e))?
        .as_millis() as u64;

    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|e| format!("Création HMAC échouée : {}", e))?;
    mac.update(&nonce);
    mac.update(&timestamp_ms.to_be_bytes());
    mac.update(payload);
    let signature = mac.finalize().into_bytes().to_vec();

    Ok(SignedCommand {
        nonce,
        timestamp_ms,
        payload: payload.to_vec(),
        signature,
    })
}

/// Vérifie un message reçu du sidecar — retourne le payload si valide.
pub fn verifier_commande(
    secret: &SharedSecret,
    msg: &SignedCommand,
    nonces_vus: &mut NonceCache,
) -> Result<Vec<u8>, &'static str> {
    // 1. Vérification de la fraîcheur du message.
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    if now_ms.saturating_sub(msg.timestamp_ms) > MESSAGE_TTL_MS {
        return Err("Message expiré");
    }

    // 2. Vérification anti-replay — nonce déjà vu = rejeter.
    if !nonces_vus.inserer(msg.nonce) {
        return Err("Replay détecté : nonce déjà utilisé");
    }

    // 3. Vérification HMAC — comparaison en temps constant.
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|_| "Création HMAC échouée")?;
    mac.update(&msg.nonce);
    mac.update(&msg.timestamp_ms.to_be_bytes());
    mac.update(&msg.payload);

    // verify_slice utilise une comparaison en temps constant.
    mac.verify_slice(&msg.signature)
        .map_err(|_| "Signature HMAC invalide")?;

    Ok(msg.payload.clone())
}

/// Cache de nonces avec limite stricte (protection OOM).
pub struct NonceCache {
    vus: HashSet<[u8; 32]>,
    max: usize,
}

impl NonceCache {
    pub fn new(max: usize) -> Self {
        Self { vus: HashSet::with_capacity(max), max }
    }

    /// Retourne true si le nonce est nouveau (jamais vu), false si replay.
    pub fn inserer(&mut self, nonce: [u8; 32]) -> bool {
        if self.vus.len() >= self.max {
            // Cache plein : vider la moitié pour éviter l'OOM.
            // Une meilleure implémentation utiliserait LruCache (voir rust-runtime-hardening.md).
            let a_garder: Vec<[u8; 32]> = self.vus.iter()
                .take(self.max / 2)
                .copied()
                .collect();
            self.vus = a_garder.into_iter().collect();
        }
        self.vus.insert(nonce) // true si nouveau, false si déjà présent
    }
}

#[cfg(test)]
mod tests_ipc_auth {
    use super::*;

    #[test]
    fn test_sign_verify_valide() {
        let secret = SharedSecret::generate();
        let payload = b"action:scrape";
        let msg = signer_commande(&secret, payload).unwrap();
        let mut nonces = NonceCache::new(100);
        let resultat = verifier_commande(&secret, &msg, &mut nonces);
        assert!(resultat.is_ok());
        assert_eq!(resultat.unwrap(), payload);
    }

    #[test]
    fn test_replay_rejete() {
        let secret = SharedSecret::generate();
        let msg = signer_commande(&secret, b"test").unwrap();
        let mut nonces = NonceCache::new(100);
        assert!(verifier_commande(&secret, &msg, &mut nonces).is_ok());
        // Deuxième tentative avec le même message = replay.
        assert_eq!(
            verifier_commande(&secret, &msg, &mut nonces),
            Err("Replay détecté : nonce déjà utilisé")
        );
    }

    #[test]
    fn test_signature_incorrecte_rejetee() {
        let secret = SharedSecret::generate();
        let mut msg = signer_commande(&secret, b"test").unwrap();
        // Altérer un byte de la signature.
        msg.signature[0] ^= 0xFF;
        let mut nonces = NonceCache::new(100);
        assert_eq!(
            verifier_commande(&secret, &msg, &mut nonces),
            Err("Signature HMAC invalide")
        );
    }
}
```

### Côté Python : vérification HMAC

```python
# sidecar/ipc_auth.py
import hmac
import hashlib
import time
import os
import json
from typing import Optional

MESSAGE_TTL_MS = 30_000  # 30 secondes
MAX_NONCES = 10_000

# Cache des nonces vus — ensemble borné.
_nonces_vus: set[bytes] = set()


def signer_message(shared_secret: bytes, payload: bytes) -> dict:
    """Signe un message avec HMAC-SHA256 + nonce + timestamp."""
    nonce = os.urandom(32)
    timestamp_ms = int(time.time() * 1000)

    mac = hmac.new(shared_secret, digestmod=hashlib.sha256)
    mac.update(nonce)
    mac.update(timestamp_ms.to_bytes(8, 'big'))
    mac.update(payload)
    signature = mac.digest()

    return {
        "nonce": list(nonce),
        "timestamp_ms": timestamp_ms,
        "payload": list(payload),
        "signature": list(signature),
    }


def verifier_message(shared_secret: bytes, msg: dict) -> Optional[bytes]:
    """
    Vérifie un message signé. Retourne le payload si valide, None sinon.
    Ne lève jamais d'exception — retourne None en cas d'erreur.
    """
    try:
        nonce = bytes(msg["nonce"])
        timestamp_ms = int(msg["timestamp_ms"])
        payload = bytes(msg["payload"])
        signature_recue = bytes(msg["signature"])
    except (KeyError, TypeError, ValueError):
        return None

    # 1. Fraîcheur
    now_ms = int(time.time() * 1000)
    if now_ms - timestamp_ms > MESSAGE_TTL_MS:
        return None  # Message expiré

    # 2. Anti-replay
    if nonce in _nonces_vus:
        return None  # Replay détecté
    global _nonces_vus
    if len(_nonces_vus) >= MAX_NONCES:
        # Cache plein : vider la moitié (peu probable en pratique).
        _nonces_vus = set(list(_nonces_vus)[MAX_NONCES // 2:])
    _nonces_vus.add(nonce)

    # 3. HMAC — comparaison en temps constant via hmac.compare_digest.
    mac = hmac.new(shared_secret, digestmod=hashlib.sha256)
    mac.update(nonce)
    mac.update(timestamp_ms.to_bytes(8, 'big'))
    mac.update(payload)
    signature_attendue = mac.digest()

    # compare_digest est en temps constant — résiste aux timing attacks.
    if not hmac.compare_digest(signature_recue, signature_attendue):
        return None  # Signature invalide

    return payload
```

---

## 2. Enum fermée pour les actions autorisées

### Le problème

Si les actions IPC sont transmises comme des strings libres (`"action": "kill_process"`), un attaquant peut forger une action non prévue. Le parsing de strings est toujours plus risqué qu'une enum.

### La défense : enum fermée Rust avec serde

```rust
// src-tauri/src/ipc/actions.rs
use serde::{Serialize, Deserialize};

/// Actions que le backend peut envoyer au sidecar.
/// Pas de variante `Other(String)` — délibéré pour empêcher le scope creep.
/// Si une nouvelle action est nécessaire, elle doit être ajoutée ici
/// et auditée explicitement.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "action_type", content = "params")]
pub enum SidecarAction {
    /// Démarrer un scraping d'URLs.
    LancerScraping {
        urls: Vec<String>,
        output_name: String,
        keywords: Vec<String>,
    },
    /// Arrêter le scraping en cours.
    ArreterScraping,
    /// Vérifier l'état du sidecar.
    Ping,
}

/// Réponses que le sidecar peut envoyer au backend.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "response_type", content = "data")]
pub enum SidecarResponse {
    /// Sidecar prêt et opérationnel.
    Pret,
    /// Scraping en cours.
    ScrapingDemarre { job_id: String },
    /// Résultat disponible.
    ResultatDisponible { article_count: usize },
    /// Erreur survenue.
    Erreur { code: String },
    /// Pong en réponse au Ping.
    Pong,
}

/// Désérialise une action depuis JSON — fail closed si format inconnu.
pub fn parser_action(json_bytes: &[u8]) -> Result<SidecarAction, String> {
    // Limite de taille pour éviter les DoS.
    if json_bytes.len() > 65_536 {
        return Err("Payload d'action trop volumineux".into());
    }

    serde_json::from_slice(json_bytes)
        .map_err(|e| format!("Action invalide : {}", e))
    // Si le tag "action_type" est absent ou inconnu, serde retourne une erreur.
    // Aucune action par défaut n'est exécutée en cas d'erreur de parsing.
}

/// Côté Python — validation équivalente avec Pydantic.
// Voir ci-dessous pour l'implémentation Python.
```

```python
# sidecar/actions.py — validation Pydantic des actions reçues
from pydantic import BaseModel, Field, field_validator
from typing import Union, Literal, List
import re

URL_RE = re.compile(
    r"^https://[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    r"(/[a-zA-Z0-9._~:/?#@!$&'()*+,;=-]*)?$"
)
KEYWORD_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9 _\-\.,]{0,98}$")


class LancerScrapingParams(BaseModel):
    urls: List[str] = Field(..., min_length=1, max_length=50)
    output_name: str = Field(..., min_length=1, max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")
    keywords: List[str] = Field(default_factory=list, max_length=20)

    @field_validator("urls", mode="before")
    @classmethod
    def valider_urls(cls, v):
        for url in v:
            if not URL_RE.match(str(url)):
                raise ValueError(f"URL invalide : {url!r}")
        return v

    @field_validator("keywords", mode="before")
    @classmethod
    def valider_keywords(cls, v):
        for kw in v:
            if str(kw).startswith('-'):
                raise ValueError(f"Keyword ne doit pas commencer par '-' : {kw!r}")
            if not KEYWORD_RE.match(str(kw)):
                raise ValueError(f"Keyword invalide : {kw!r}")
        return v


class ArreterScrapingParams(BaseModel):
    pass


class PingParams(BaseModel):
    pass


class SidecarAction(BaseModel):
    action_type: Literal["LancerScraping", "ArreterScraping", "Ping"]
    params: Union[LancerScrapingParams, ArreterScrapingParams, PingParams, None] = None


def parser_action(json_bytes: bytes) -> SidecarAction:
    """Parse et valide une action — lève ValueError si invalide."""
    if len(json_bytes) > 65_536:
        raise ValueError("Payload trop volumineux")
    import json
    data = json.loads(json_bytes)
    return SidecarAction.model_validate(data)
```

---

## 3. Prévention d'injection de commandes dans le sidecar Python

### Règle absolue : jamais `shell=True`

```python
# sidecar/subprocess_secure.py
import subprocess
import shlex
import re
from pathlib import Path
from urllib.parse import urlparse
import ipaddress

# INTERDIT : shell=True avec interpolation de chaîne
# subprocess.run(f"playwright screenshot {url}", shell=True)  # Injection possible

# CORRECT : liste d'arguments, shell=False (défaut)
def capturer_screenshot(url: str, output_path: str) -> None:
    """Capture un screenshot avec Playwright — sans shell=True."""
    # Validation de l'URL AVANT de la passer à subprocess.
    url_validee = _valider_url(url)
    # Validation du chemin AVANT de la passer à subprocess.
    chemin_valide = _valider_chemin_sortie(output_path)

    # Arguments en liste — jamais en string concaténée.
    # Chaque élément est un argument distinct, pas interprété par le shell.
    resultat = subprocess.run(
        ["playwright", "screenshot", "--", url_validee, str(chemin_valide)],
        capture_output=True,
        timeout=30,
        shell=False,  # Valeur par défaut — explicite pour la lisibilité
        env={},       # Environnement vide — pas de LD_PRELOAD, PYTHONPATH, etc.
    )

    if resultat.returncode != 0:
        stderr = resultat.stderr.decode('utf-8', errors='replace')
        # Ne jamais propager stderr directement — peut contenir des infos internes.
        raise RuntimeError("Capture screenshot échouée")


def _valider_url(url: str) -> str:
    """Valide une URL — seul HTTPS vers des hôtes publics est autorisé."""
    if len(url) > 2048:
        raise ValueError("URL trop longue")
    parsed = urlparse(url)
    if parsed.scheme != "https":
        raise ValueError(f"Seul https:// est autorisé, reçu : {parsed.scheme!r}")
    if not parsed.hostname:
        raise ValueError("L'URL doit avoir un hostname")
    if parsed.username or parsed.password:
        raise ValueError("Credentials dans l'URL interdits")

    hostname = parsed.hostname.lower()
    HOTES_BLOQUES = {"localhost", "127.0.0.1", "169.254.169.254",
                     "metadata.google.internal", "0.0.0.0", "[::1]"}
    if hostname in HOTES_BLOQUES or hostname.endswith(".internal"):
        raise ValueError(f"Hôte interne interdit : {hostname!r}")

    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise ValueError(f"IP privée interdite : {ip}")
    except ValueError:
        pass  # Pas une IP — hostname normal

    if parsed.port and parsed.port not in (80, 443):
        raise ValueError(f"Port non standard interdit : {parsed.port}")

    return url


def _valider_chemin_sortie(path_str: str, base_dir: str = "./output") -> Path:
    """Valide et confine un chemin dans le répertoire de sortie autorisé."""
    if "\x00" in path_str:
        raise ValueError("Octets nuls interdits dans le chemin")
    base = Path(base_dir).resolve()
    cible = (base / path_str).resolve()
    # Vérification de confinement — empêche path traversal.
    if not str(cible).startswith(str(base)):
        raise ValueError(f"Path traversal détecté : {path_str!r}")
    return cible


# Exemple avec argparse — protection contre l'injection d'options.
def configurer_parser():
    import argparse
    # allow_abbrev=False : "--key" n'est pas accepté comme abréviation de "--keywords"
    # Empêche l'injection d'options via des préfixes.
    parser = argparse.ArgumentParser(allow_abbrev=False)
    parser.add_argument("--scrape", required=True, nargs="+",
                        help="URLs à scraper (https:// uniquement)")
    parser.add_argument("--output", required=True,
                        help="Nom du fichier de sortie JSON")
    parser.add_argument("--exclude-keywords", nargs="*", default=[],
                        dest="exclude_keywords")
    return parser
```

### Séparateur `--` côté Rust

```rust
// src-tauri/src/sidecar/launcher.rs — insertion du séparateur --
use tauri_plugin_shell::ShellExt;

pub async fn lancer_sidecar(
    app: &tauri::AppHandle,
    urls: &[String],
    output_name: &str,
    keywords: &[String],
) -> Result<(), String> {
    let mut args: Vec<String> = vec!["--scrape".into()];
    for url in urls {
        args.push(url.clone());
    }
    args.push("--output".into());
    args.push(format!("{}.json", output_name));

    if !keywords.is_empty() {
        args.push("--exclude-keywords".into());
        // Le séparateur -- indique au parseur Python que ce qui suit
        // est un argument positionnel, pas une option.
        // Empêche "--config=/evil" d'être interprété comme option.
        args.push("--".into());
        for kw in keywords {
            args.push(kw.clone());
        }
    }

    let shell = app.shell();
    let sidecar = shell.sidecar("cyber_news_scraper")
        .map_err(|e| e.to_string())?
        .args(args);

    // Lancement avec spawn() pour récupérer les événements stdout/stderr.
    let (mut rx, _child) = sidecar.spawn().map_err(|e| e.to_string())?;

    // Traitement des événements...
    while let Some(event) = rx.recv().await {
        use tauri_plugin_shell::process::CommandEvent;
        match event {
            CommandEvent::Stdout(line) => {
                let text = String::from_utf8_lossy(&line);
                // Ne jamais logger le contenu brut stdout en production.
                tracing::debug!("Sidecar stdout : {} bytes", line.len());
                let _ = text;
            }
            CommandEvent::Terminated(status) => {
                tracing::info!("Sidecar terminé : code {:?}", status.code);
                break;
            }
            _ => {}
        }
    }

    Ok(())
}
```

---

## 4. Vérification d'intégrité SHA-256 du sidecar PyInstaller

### Le problème

Le binaire PyInstaller peut être remplacé par un binaire malveillant entre les builds. Sur Windows, le DLL hijacking via les répertoires `_MEIPASS` est un vecteur actif (campagne Trellix janvier 2026). CVE-2025-59042 (PyInstaller < 6.10.0) permet aussi le chargement de modules arbitraires via `sys.path` modifié.

### La défense : hash gravé dans le binaire Rust au build

```rust
// build.rs — calcul du hash au moment du build, gravé dans le binaire
use sha2::{Sha256, Digest};

fn main() {
    // Recalculer si le binaire sidecar change.
    println!("cargo:rerun-if-changed=binaries/cyber_news_scraper");
    println!("cargo:rerun-if-changed=binaries/cyber_news_scraper.exe");

    // Calculer le hash du binaire sidecar au moment du build.
    let binary_path = if cfg!(windows) {
        "binaries/cyber_news_scraper.exe"
    } else {
        "binaries/cyber_news_scraper"
    };

    match std::fs::read(binary_path) {
        Ok(data) => {
            let hash = format!("{:x}", Sha256::new().chain_update(&data).finalize());
            println!("cargo:rustc-env=SIDECAR_SHA256={}", hash);
        }
        Err(e) => {
            // Fail closed : si le binaire est absent au build, on plante.
            panic!("Impossible de lire le binaire sidecar : {}", e);
        }
    }
}
```

```rust
// src-tauri/src/sidecar/integrity.rs
use sha2::{Sha256, Digest};
use std::path::{Path, PathBuf};

/// Hash SHA-256 du sidecar gravé au moment du build.
/// Toute modification du binaire après le build est détectée.
const SIDECAR_HASH_ATTENDU: &str = env!("SIDECAR_SHA256");

/// Résout le chemin absolu du binaire sidecar.
/// Tauri suit une convention de nommage : nom + target triple.
fn chemin_sidecar() -> Result<PathBuf, String> {
    let ressource = std::env::current_exe()
        .map_err(|e| format!("Impossible de trouver l'exécutable : {}", e))?;
    let dir = ressource.parent()
        .ok_or("Pas de répertoire parent pour l'exécutable")?;

    // Nom avec target triple (ex: cyber_news_scraper-x86_64-pc-linux-gnu).
    let target_triple = env!("TARGET");
    let nom = format!("cyber_news_scraper-{}", target_triple);

    let chemin = if cfg!(windows) {
        dir.join(format!("{}.exe", nom))
    } else {
        dir.join(nom)
    };

    Ok(chemin)
}

/// Vérifie l'intégrité du binaire sidecar avant tout lancement.
/// Fail closed : si la vérification échoue, le lancement est bloqué.
pub fn verifier_integrite_sidecar() -> Result<(), String> {
    let chemin = chemin_sidecar()?;

    let donnees = std::fs::read(&chemin)
        .map_err(|e| format!("Lecture du sidecar impossible : {}", e))?;

    let hash_actuel = format!("{:x}", Sha256::new().chain_update(&donnees).finalize());

    if hash_actuel != SIDECAR_HASH_ATTENDU {
        return Err(format!(
            "Intégrité du sidecar compromise ! Attendu : {}, Obtenu : {}. \
             Le binaire a peut-être été remplacé.",
            SIDECAR_HASH_ATTENDU,
            hash_actuel
        ));
    }

    tracing::info!("Intégrité du sidecar vérifiée : {}", &hash_actuel[..16]);
    Ok(())
}

#[cfg(test)]
mod tests_integrite {
    // Tests d'intégration — nécessitent le binaire présent au moment du test.
    // En CI, le binaire est buildé avant les tests.

    #[test]
    fn test_hash_attendu_non_vide() {
        // Vérification basique que la constante a bien été injectée par build.rs.
        assert!(!super::SIDECAR_HASH_ATTENDU.is_empty());
        assert_eq!(super::SIDECAR_HASH_ATTENDU.len(), 64); // SHA-256 = 64 hex chars
    }
}
```

---

## 5. Permissions des sockets Unix (0600) et Named Pipes Windows

### Unix Domain Sockets — permissions restrictives

```rust
// src-tauri/src/ipc/socket.rs — UDS avec SO_PEERCRED
#[cfg(unix)]
pub mod unix_socket {
    use std::os::unix::fs::PermissionsExt;
    use tokio::net::{UnixListener, UnixStream};
    use std::path::{Path, PathBuf};

    /// Crée un socket Unix avec permissions 0600 — accessible uniquement
    /// au propriétaire du processus.
    pub async fn creer_socket_securise(path: &Path) -> Result<UnixListener, std::io::Error> {
        // Supprimer le socket précédent si existant.
        let _ = std::fs::remove_file(path);

        let listener = UnixListener::bind(path)?;

        // Permissions restrictives : propriétaire uniquement (rw-------)
        // Empêche les autres utilisateurs de se connecter.
        std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600))?;

        Ok(listener)
    }

    /// Vérifie l'identité du processus connecté via SO_PEERCRED.
    /// Non spoofable — vérifié par le kernel Linux/macOS.
    pub fn verifier_identite_client(stream: &UnixStream) -> Result<u32, String> {
        use std::os::unix::io::AsRawFd;

        #[cfg(target_os = "linux")]
        {
            // ucred : uid, gid, pid du processus client
            let fd = stream.as_raw_fd();
            let mut cred = libc::ucred { pid: 0, uid: 0, gid: 0 };
            let mut len = std::mem::size_of::<libc::ucred>() as libc::socklen_t;
            unsafe {
                if libc::getsockopt(
                    fd,
                    libc::SOL_SOCKET,
                    libc::SO_PEERCRED,
                    &mut cred as *mut _ as *mut libc::c_void,
                    &mut len,
                ) != 0 {
                    return Err("getsockopt SO_PEERCRED échoué".into());
                }
            }
            // Vérifier que le client a le même UID que le serveur.
            let notre_uid = unsafe { libc::getuid() };
            if cred.uid != notre_uid {
                return Err(format!(
                    "UID client ({}) != UID serveur ({})",
                    cred.uid, notre_uid
                ));
            }
            Ok(cred.pid as u32)
        }

        #[cfg(not(target_os = "linux"))]
        {
            // Sur macOS : utiliser LOCAL_PEERCRED
            // Simplification : retourner le pid depuis le socket
            Ok(0) // Implémentation complète dans la version macOS
        }
    }

    /// Chemin du socket dans un répertoire à accès restreint.
    pub fn chemin_socket_securise() -> PathBuf {
        // /tmp/<uid>/ est accessible uniquement au propriétaire sur Linux moderne.
        let uid = unsafe { libc::getuid() };
        let dir = PathBuf::from(format!("/run/user/{}", uid));
        if dir.exists() {
            dir.join("myapp.sock")
        } else {
            std::env::temp_dir().join(format!("myapp-{}.sock", uid))
        }
    }
}
```

### Named Pipes Windows — DACL restrictif

```rust
// src-tauri/src/ipc/named_pipe_windows.rs
#[cfg(windows)]
pub mod windows_pipe {
    /// Crée un Named Pipe avec DACL restrictif (propriétaire uniquement).
    ///
    /// Le DACL par défaut de CreateNamedPipe accorde l'accès à Everyone —
    /// vulnérabilité de pipe squatting exploitée dans CVE-2022-21893 (RDP)
    /// et CVE-2022-25365 (Docker Desktop).
    pub fn creer_pipe_securise(nom: &str) -> Result<(), String> {
        use std::ffi::CString;

        // Le nom doit commencer par \\.\pipe\
        let nom_complet = format!("\\\\.\\pipe\\{}", nom);

        // Créer un DACL qui autorise uniquement le SID de l'utilisateur courant.
        // Le code Windows complet nécessite windows-sys ou winapi.
        // Voici la logique en pseudocode documenté :
        //
        // 1. OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &token)
        // 2. GetTokenInformation(token, TokenUser, ...) → obtenir le SID utilisateur
        // 3. InitializeSecurityDescriptor(&sd, SECURITY_DESCRIPTOR_REVISION)
        // 4. InitializeAcl(&acl, ..., ACL_REVISION)
        // 5. AddAccessAllowedAce(&acl, ACL_REVISION, GENERIC_ALL, user_sid)
        // 6. SetSecurityDescriptorDacl(&sd, TRUE, &acl, FALSE)
        // 7. sa.lpSecurityDescriptor = &sd
        // 8. CreateNamedPipe(nom_complet, ..., &sa)
        //    avec FILE_FLAG_FIRST_PIPE_INSTANCE pour empêcher le squatting

        // En pratique, utiliser le crate `windows-sys` :
        // windows_sys::Win32::System::Pipes::CreateNamedPipeA
        // avec SECURITY_ATTRIBUTES configuré comme ci-dessus.

        todo!("Implémentation Windows complète avec windows-sys")
    }
}
```

---

## 6. Bootstrap du secret partagé via stdin pipe

### Le problème

Les secrets transmis via arguments CLI (`--secret abc123`) sont visibles dans `/proc/PID/cmdline` et `ps aux`. Les variables d'environnement sont visibles dans `/proc/PID/environ` pendant toute la durée de vie du processus. Le stdin pipe est éphémère : son contenu n'est pas visible dans `/proc`.

### La défense

```rust
// src-tauri/src/sidecar/bootstrap.rs
use std::io::Write;
use serde_json::json;
use zeroize::Zeroize;

/// Transmet le secret partagé au sidecar via stdin pipe.
/// La clé disparaît immédiatement après la première ligne lue par le sidecar.
pub async fn bootstrap_sidecar(
    app: &tauri::AppHandle,
    secret: &crate::ipc::auth::SharedSecret,
    api_keys: &std::collections::HashMap<String, String>,
) -> Result<tauri_plugin_shell::process::CommandChild, String> {
    use tauri_plugin_shell::ShellExt;

    let shell = app.shell();
    let (_rx, mut child) = shell
        .sidecar("cyber_news_scraper")
        .map_err(|e| e.to_string())?
        .spawn()
        .map_err(|e| e.to_string())?;

    // Construire le payload de bootstrap.
    let payload = json!({
        "type": "bootstrap",
        "shared_secret": hex::encode(secret.as_bytes()),
        "api_keys": api_keys,
    });

    let mut payload_str = serde_json::to_string(&payload)
        .map_err(|e| e.to_string())?;

    // Transmettre sur stdin — éphémère, non visible dans /proc.
    child.write((payload_str.as_str().to_owned() + "\n").as_bytes())
        .map_err(|e| e.to_string())?;

    // Zéroiser le payload immédiatement après transmission.
    payload_str.zeroize();

    Ok(child)
}
```

```python
# sidecar/bootstrap.py — lecture du secret depuis stdin au démarrage
import sys
import json
import ctypes
import os

try:
    import resource
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
except Exception:
    pass  # Windows ou permissions insuffisantes


class SecretBytes:
    """Wrapper pour bytes sensibles — zéroïsé au garbage collect."""
    __slots__ = ('_buf',)

    def __init__(self, valeur: str | bytes):
        if isinstance(valeur, str):
            self._buf = bytearray(valeur.encode('utf-8'))
        else:
            self._buf = bytearray(valeur)

    def expose(self) -> bytes:
        return bytes(self._buf)

    def expose_str(self) -> str:
        return self._buf.decode('utf-8')

    def zeroize(self):
        for i in range(len(self._buf)):
            self._buf[i] = 0

    def __del__(self):
        self.zeroize()

    def __repr__(self):
        return "SecretBytes([REDACTED])"

    def __str__(self):
        return "[REDACTED]"


def lire_bootstrap_stdin() -> tuple[SecretBytes, dict[str, SecretBytes]]:
    """
    Lit le payload de bootstrap depuis stdin (première ligne).
    Retourne (shared_secret, api_keys).
    Quitte le processus si le bootstrap est invalide.
    """
    try:
        ligne = sys.stdin.readline()
        if not ligne:
            print("BOOTSTRAP_ERROR: Aucune donnée reçue", file=sys.stderr)
            sys.exit(1)

        data = json.loads(ligne.strip())

        if data.get("type") != "bootstrap":
            print("BOOTSTRAP_ERROR: Type invalide", file=sys.stderr)
            sys.exit(1)

        # Extraire le secret partagé.
        secret_hex = data.get("shared_secret", "")
        if len(secret_hex) != 64:  # SHA-256 hex = 64 caractères
            print("BOOTSTRAP_ERROR: Secret invalide", file=sys.stderr)
            sys.exit(1)
        shared_secret = SecretBytes(bytes.fromhex(secret_hex))

        # Extraire les clés API.
        api_keys = {}
        for provider, key in data.get("api_keys", {}).items():
            if isinstance(provider, str) and isinstance(key, str):
                api_keys[provider] = SecretBytes(key)

        # Zéroiser la ligne brute avant de libérer.
        ligne_buf = bytearray(ligne.encode('utf-8'))
        for i in range(len(ligne_buf)):
            ligne_buf[i] = 0

        print("BOOTSTRAP_OK", flush=True)
        return shared_secret, api_keys

    except (json.JSONDecodeError, ValueError, KeyError) as e:
        print(f"BOOTSTRAP_ERROR: {type(e).__name__}", file=sys.stderr)
        sys.exit(1)
```

---

## 7. Invocation sécurisée de pkexec (élévation de privilèges)

### Le problème

`sudo` et `pkexec` avec `shell=True` ou arguments dynamiques permettent l'escalade de privilèges. CVE-2021-4034 (PwnKit) exploitait une mauvaise gestion des arguments dans pkexec.

### La défense

```rust
// src-tauri/src/privilege/pkexec.rs
use std::process::Command;
use std::ffi::OsStr;

/// Actions nécessitant une élévation de privilèges — enum fermée.
/// Jamais de variante dynamique.
#[derive(Debug, Clone)]
pub enum ActionPrivilegiee {
    InstallerCertificat { chemin_cert: String },
    ModifierResolv,
    RedemarrerService { nom_service: ServiceAutorise },
}

/// Services dont le redémarrage est autorisé — liste blanche.
#[derive(Debug, Clone)]
pub enum ServiceAutorise {
    NetworkManager,
    SystemdResolved,
}

impl ServiceAutorise {
    fn nom_exact(&self) -> &'static str {
        match self {
            Self::NetworkManager => "NetworkManager",
            Self::SystemdResolved => "systemd-resolved",
        }
    }
}

/// Invocation de pkexec avec chemin absolu et environnement purgé.
/// Jamais de `shell=true`, jamais de concaténation de strings.
#[cfg(unix)]
pub fn executer_avec_privilege(action: ActionPrivilegiee) -> Result<(), String> {
    // Chemin absolu vers pkexec — jamais de PATH lookup.
    const PKEXEC: &str = "/usr/bin/pkexec";

    // Vérifier que pkexec existe.
    if !std::path::Path::new(PKEXEC).exists() {
        return Err("pkexec non disponible sur ce système".into());
    }

    // Construire la liste d'arguments selon l'action — pas de string dynamique.
    let (programme, args): (&str, Vec<&OsStr>) = match &action {
        ActionPrivilegiee::InstallerCertificat { chemin_cert } => {
            // Valider le chemin avant de l'utiliser.
            let chemin = std::path::Path::new(chemin_cert);
            if !chemin.exists() {
                return Err("Fichier certificat introuvable".into());
            }
            if chemin_cert.contains("..") || !chemin_cert.ends_with(".crt") {
                return Err("Chemin de certificat invalide".into());
            }
            ("/usr/sbin/update-ca-certificates", vec![])
            // Note : le chemin est déjà connu au niveau système
        }
        ActionPrivilegiee::ModifierResolv => {
            ("/usr/sbin/resolvconf", vec![OsStr::new("-u")])
        }
        ActionPrivilegiee::RedemarrerService { nom_service } => {
            // Le nom du service vient de l'enum — pas d'entrée utilisateur.
            ("/usr/bin/systemctl",
             vec![OsStr::new("restart"), OsStr::new(nom_service.nom_exact())])
        }
    };

    let statut = Command::new(PKEXEC)
        .arg(programme)
        .args(&args)
        // Purger l'environnement — bloque LD_PRELOAD, PYTHONPATH, etc.
        .env_clear()
        // Variables minimales nécessaires à pkexec.
        .env("DISPLAY", std::env::var("DISPLAY").unwrap_or_default())
        .env("DBUS_SESSION_BUS_ADDRESS",
             std::env::var("DBUS_SESSION_BUS_ADDRESS").unwrap_or_default())
        .status()
        .map_err(|e| format!("Lancement pkexec échoué : {}", e))?;

    if statut.success() {
        Ok(())
    } else {
        Err(format!("pkexec a retourné le code : {:?}", statut.code()))
    }
}

#[cfg(test)]
mod tests_pkexec {
    use super::*;

    #[test]
    fn test_service_autorise_nom_exact() {
        assert_eq!(ServiceAutorise::NetworkManager.nom_exact(), "NetworkManager");
    }
}
```

---

## 8. Sandboxing OS du sidecar Python

### Le problème

Le sandboxing Python au niveau du langage est impossible par conception (confirmé par Victor Stinner, auteur de pysandbox). La seule protection fiable est au niveau de l'OS.

### La défense : seccomp-bpf + AppArmor

```python
# sidecar/sandbox.py — activation du sandboxing OS au démarrage
import os
import sys

def activer_sandbox():
    """
    Active le sandboxing OS. À appeler au tout début du sidecar,
    avant tout chargement de données utilisateur.
    """
    # 1. Désactiver les core dumps (fuite de mémoire).
    try:
        import resource
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    except Exception:
        pass

    # 2. Limiter les ressources système.
    try:
        import resource
        resource.setrlimit(resource.RLIMIT_NPROC, (0, 0))   # Pas de fork()
        resource.setrlimit(resource.RLIMIT_AS, (512 * 1024 * 1024, 512 * 1024 * 1024))  # 512 Mo
        resource.setrlimit(resource.RLIMIT_FSIZE, (10 * 1024 * 1024, 10 * 1024 * 1024)) # 10 Mo max par fichier
    except Exception:
        pass  # Ignorer si les limites ne peuvent pas être définies

    # 3. seccomp-bpf (Linux uniquement) — whitelist de syscalls.
    if sys.platform == "linux":
        _activer_seccomp()


def _activer_seccomp():
    """Active un filtre seccomp-bpf autorisant uniquement les syscalls nécessaires."""
    try:
        # Utiliser python-prctl ou seccomp-python si disponible.
        import seccomp
        f = seccomp.SyscallFilter(defaction=seccomp.KILL)

        # Syscalls nécessaires au scraping web.
        SYSCALLS_AUTORISES = [
            "read", "write", "close", "fstat", "mmap", "mprotect",
            "munmap", "brk", "rt_sigaction", "rt_sigprocmask",
            "ioctl", "access", "pipe", "select", "dup", "dup2",
            "nanosleep", "getpid", "socket", "connect", "accept",
            "sendto", "recvfrom", "shutdown", "bind", "listen",
            "getsockname", "getpeername", "getsockopt", "setsockopt",
            "clone", "wait4", "exit", "exit_group", "getrlimit",
            "openat", "getdents64", "newfstatat", "pread64",
            "lseek", "fcntl", "stat", "lstat",
            # Bloquer explicitement :
            # "execve" — empêche le lancement de nouveaux processus
            # "fork" — déjà bloqué par RLIMIT_NPROC
            # "ptrace" — empêche l'attachement de debugger
        ]

        for syscall in SYSCALLS_AUTORISES:
            try:
                f.add_rule(seccomp.ALLOW, syscall)
            except Exception:
                pass

        f.load()
    except ImportError:
        # seccomp non disponible — documenter dans les logs.
        print("WARN: seccomp non disponible, sandboxing réduit", file=sys.stderr)
    except Exception as e:
        print(f"WARN: Activation seccomp échouée : {e}", file=sys.stderr)
```

---

## Checklist d'implémentation IPC + Sidecar

**Authentification IPC :**
- [ ] Chaque message IPC est signé avec HMAC-SHA256(nonce + timestamp + payload)
- [ ] Le secret partagé est transmis via stdin pipe, jamais via CLI ou variables d'environnement
- [ ] La vérification de signature utilise `hmac.verify_slice()` (Rust) ou `hmac.compare_digest()` (Python) — temps constant
- [ ] Le cache de nonces anti-replay est borné (max 10 000 entrées)
- [ ] Les messages sont rejetés après 30 secondes (timestamp trop ancien)

**Actions IPC :**
- [ ] Les actions sont représentées par une enum fermée — pas de string libres
- [ ] Côté Python, les actions sont validées avec Pydantic avant traitement
- [ ] Taille maximale des payloads vérifiée (max 65 536 bytes)

**Injection de commandes :**
- [ ] Jamais `subprocess.run(..., shell=True)` dans le sidecar Python
- [ ] Les arguments subprocess sont toujours en liste, jamais en string concaténée
- [ ] Le séparateur `--` est inséré avant tout argument positionnel contrôlé par l'utilisateur
- [ ] `argparse` configuré avec `allow_abbrev=False`
- [ ] `env_clear()` ou `env={}` sur tous les lancements de sous-processus

**Intégrité :**
- [ ] SHA-256 du binaire sidecar gravé dans le binaire Rust via `build.rs`
- [ ] `verify_sidecar_integrity()` appelé avant chaque lancement du sidecar
- [ ] PyInstaller >= 6.10.0 (correction CVE-2025-59042)
- [ ] Rust >= 1.81.0 (correction CVE-2024-24576 BatBadBut Windows complet)

**Permissions sockets :**
- [ ] Sockets Unix créés avec permissions 0600 (propriétaire uniquement)
- [ ] `SO_PEERCRED` vérifié pour confirmer l'UID du client sur Linux
- [ ] Named Pipes Windows créés avec DACL restrictif + `FILE_FLAG_FIRST_PIPE_INSTANCE`

**Sandboxing :**
- [ ] Core dumps désactivés au démarrage du sidecar
- [ ] `RLIMIT_NPROC=0` pour empêcher le fork depuis le sidecar
- [ ] seccomp-bpf activé sur Linux si la dépendance `seccomp` est disponible
- [ ] `env_clear()` systématiquement sur les `Command::new()` en Rust
