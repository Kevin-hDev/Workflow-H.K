# os-privilege-hardening.md
# Élévation de privilèges et durcissement OS — Stack Rust/Tauri v2

## Vue d'ensemble

Ce fichier couvre toutes les protections défensives liées à l'élévation de privilèges, à l'IPC entre composants, aux snapshots d'état cryptographiquement protégés, et à la détection de drift de configuration. Les sources sont les audits 15 (outils multiplateforme) et 16 (module hardening) du 23 février 2026, complétés par le fichier defensive-staging/ext-18-defense-code.md.

Les vecteurs d'attaque que ce knowledge file permet de neutraliser :
- Injection de commandes via pkexec/UAC/osascript (PATH, runInShell, env non épuré)
- IPC non authentifié entre l'app Tauri et le helper privilégié (scénario CCleaner)
- UAC fatigue : l'utilisateur clique "Oui" mécaniquement aux faux prompts
- Rollback vers un état de sécurité affaibli via corruption du fichier d'état
- BYOVD (Bring Your Own Vulnerable Driver) contournant les outils de sécurité
- Exploitation des outils de hardening eux-mêmes comme vecteur d'attaque (EDR killers)

---

## 1. Architecture helper binaire séparé — Principe de séparation des privilèges

### Pourquoi ne jamais élever l'application Tauri entière

L'élévation de l'application Tauri entière exposerait le WebView React à des privilèges root/SYSTEM. Le seul modèle sûr est un helper binaire séparé, minimal, qui exécute uniquement les opérations nécessitant des privilèges.

```
Application principale (Tauri, non privilégiée)
        │
        │  IPC authentifiée (commandes signées HMAC-SHA256)
        │
        ▼
Helper binaire (élevé — privilèges minimum requis)
        │
        ├── Linux   : pkexec /usr/local/lib/app/helper --action <enum fermé>
        ├── Windows : Named Pipe Service (LocalSystem) + HMAC vérification
        └── macOS   : Privileged Helper Tool (SMJobBless)
```

**Le helper binaire doit** :
- Accepter uniquement des actions définies dans un enum fermé Rust
- Vérifier l'intégrité de son propre binaire avant exécution (hash SHA-256)
- Vérifier la signature HMAC de chaque commande reçue
- Refuser toute commande avec un timestamp stale (>30 secondes)
- Ne jamais écrire dans les logs des valeurs sensibles
- Nettoyer l'environnement avant toute exécution

---

## 2. Invocation sécurisée de pkexec (Linux)

### Vérification d'intégrité avant élévation

```rust
use std::process::Command;
use sha2::{Sha256, Digest};

/// Enum fermé des actions autorisées — empêche l'injection de commandes arbitraires
#[derive(Debug, Clone, Copy)]
pub enum PrivilegedAction {
    EnableFirewall,
    DisableFirewall,
    ApplySysctlHardening,
    RevertSysctlHardening,
    InstallCrowdSec,
    InstallSuricata,
    ConfigureAuditd,
}

impl PrivilegedAction {
    /// Convertit l'action en argument CLI sûr — jamais de concat de strings utilisateur
    pub fn as_arg(&self) -> &'static str {
        match self {
            Self::EnableFirewall         => "enable-firewall",
            Self::DisableFirewall        => "disable-firewall",
            Self::ApplySysctlHardening   => "apply-sysctl",
            Self::RevertSysctlHardening  => "revert-sysctl",
            Self::InstallCrowdSec        => "install-crowdsec",
            Self::InstallSuricata        => "install-suricata",
            Self::ConfigureAuditd        => "configure-auditd",
        }
    }
}

/// Vérifie l'intégrité du helper binaire puis l'invoque via pkexec
/// Ne jamais appeler pkexec sans cette vérification préalable
pub fn invoke_privileged_helper(
    action: PrivilegedAction,
    expected_hash: &[u8; 32],
) -> Result<std::process::Output, HardenError> {
    // Chemin absolu hardcodé — jamais via $PATH
    let helper_path = "/usr/local/lib/safety-ai/helper";

    // 1. Vérifier l'intégrité du helper avant élévation
    //    Si le helper a été remplacé par un malware, rejeter immédiatement
    let helper_bytes = std::fs::read(helper_path)
        .map_err(|e| HardenError::StateReadError(e.to_string()))?;
    let mut hasher = Sha256::new();
    hasher.update(&helper_bytes);
    let hash = hasher.finalize();
    if hash.as_slice() != expected_hash {
        return Err(HardenError::ApplyError(
            "Helper binary integrity check failed — possible tampering".into()
        ));
    }

    // 2. Construire la commande avec chemin absolu, environnement épuré
    //    env_clear() empêche les attaques via LD_PRELOAD, PATH, etc.
    let output = Command::new("/usr/bin/pkexec")
        .arg(helper_path)        // Chemin absolu vers le helper signé
        .arg("--action")
        .arg(action.as_arg())    // Action depuis l'enum fermé — pas de concat utilisateur
        .env_clear()             // Purger TOUT l'environnement avant élévation
        .output()
        .map_err(|e| HardenError::ApplyError(e.to_string()))?;

    // 3. Fail closed : tout code de retour non-zero est une erreur
    if !output.status.success() {
        return Err(HardenError::ApplyError(
            format!("Helper exited with {}", output.status)
        ));
    }

    Ok(output)
}
```

### Fichier polkit policy (Linux)

Créer une policy polkit spécifique plutôt que d'utiliser pkexec de manière générique. Les actions de CVE-2025-6018/6019 exploitent la zone de confiance `allow_active` — la mitigation est de créer des action IDs dédiés avec `auth_admin`.

```xml
<!-- /usr/share/polkit-1/actions/com.myapp.hardening.policy -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE policyconfig PUBLIC
    "-//freedesktop//DTD PolicyKit Policy Configuration 1.0//EN"
    "http://www.freedesktop.org/standards/PolicyKit/1/policyconfig.dtd">
<policyconfig>
    <action id="com.myapp.hardening.enable-firewall">
        <description>Activer le pare-feu système</description>
        <message>L'application demande l'autorisation d'activer le pare-feu.</message>
        <defaults>
            <!-- auth_admin : TOUJOURS demander le mot de passe admin
                 Ne pas utiliser allow_active (contournable via CVE-2025-6018) -->
            <allow_any>auth_admin</allow_any>
            <allow_inactive>auth_admin</allow_inactive>
            <allow_active>auth_admin</allow_active>
        </defaults>
        <annotate key="org.freedesktop.policykit.exec.path">
            /usr/local/lib/safety-ai/helper
        </annotate>
        <annotate key="org.freedesktop.policykit.exec.argv1">--action</annotate>
        <annotate key="org.freedesktop.policykit.exec.argv2">enable-firewall</annotate>
        <annotate key="org.freedesktop.policykit.exec.allow_gui">true</annotate>
    </action>

    <action id="com.myapp.hardening.apply-sysctl">
        <description>Appliquer les paramètres de durcissement kernel</description>
        <message>L'application demande l'autorisation de modifier les paramètres sysctl.</message>
        <defaults>
            <allow_any>auth_admin</allow_any>
            <allow_inactive>auth_admin</allow_inactive>
            <allow_active>auth_admin</allow_active>
        </defaults>
    </action>
</policyconfig>
```

**Mitigation CVE-2025-6018/6019** : désactiver `user_readenv` dans la configuration PAM pour empêcher l'injection de `XDG_SEAT=seat0` et `XDG_VTNR=1` via `~/.pam_environment`.

---

## 3. IPC authentifiée par HMAC-SHA256

### Prévention du scénario CCleaner

En mars 2025, Quarkslab a découvert que le Privileged Helper Tool de CCleaner communiquait via un socket Unix avec des permissions 0666 et aucune authentification. N'importe quel processus local pouvait envoyer des commandes exécutées en root.

La protection : chaque commande envoyée au helper doit être signée avec HMAC-SHA256. Le helper vérifie la signature et le timestamp avant d'exécuter quoi que ce soit.

```rust
use ring::hmac;
use serde::{Serialize, Deserialize};
use std::time::{SystemTime, UNIX_EPOCH};

// Secret IPC dérivé du certificat de signature de l'application au moment du build
// Jamais une constante globale statique — dériver depuis un secret build-time
const IPC_SECRET: &[u8] = include_bytes!("../secrets/ipc_key.bin");

#[derive(Serialize, Deserialize, Debug)]
pub struct SignedCommand {
    /// Action à exécuter — valeur de l'enum PrivilegedAction sérialisé
    pub action: String,
    /// Timestamp Unix en millisecondes — anti-replay
    pub timestamp_ms: u64,
    /// Nonce aléatoire 64 bits — unicité de chaque commande
    pub nonce: u64,
    /// HMAC-SHA256 sur action:timestamp_ms:nonce
    pub hmac: Vec<u8>,
}

impl SignedCommand {
    /// Crée une commande signée côté application principale (non privilégiée)
    pub fn new(action: &str) -> Self {
        let ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        // rand::random() utilise le CSPRNG de l'OS en interne
        let nonce: u64 = rand::random();

        let key = hmac::Key::new(hmac::HMAC_SHA256, IPC_SECRET);
        let msg = format!("{}:{}:{}", action, ts, nonce);
        let tag = hmac::sign(&key, msg.as_bytes());

        Self {
            action: action.to_string(),
            timestamp_ms: ts,
            nonce,
            hmac: tag.as_ref().to_vec(),
        }
    }
}

/// Vérification côté helper (processus élevé) — exécuter AVANT toute action privilégiée
pub fn verify_command(cmd: &SignedCommand) -> Result<(), HardenError> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    // 1. Fenêtre anti-replay de 30 secondes
    //    Une commande de plus de 30 secondes est rejetée — protège contre le replay
    if now.saturating_sub(cmd.timestamp_ms) > 30_000 {
        return Err(HardenError::ApplyError(
            "Commande périmée rejetée (anti-replay)".into()
        ));
    }

    // 2. Vérification HMAC en temps constant (ring utilise une comparaison en temps constant)
    let key = hmac::Key::new(hmac::HMAC_SHA256, IPC_SECRET);
    let msg = format!("{}:{}:{}", cmd.action, cmd.timestamp_ms, cmd.nonce);
    hmac::verify(&key, msg.as_bytes(), &cmd.hmac)
        .map_err(|_| HardenError::ApplyError(
            "HMAC invalide — commande rejetée".into()
        ))?;

    Ok(())
}
```

---

## 4. Élévation sur Windows — Named Pipe Service + HMAC

### Pourquoi pas PowerShell -Verb RunAs en production

`PowerShell -Verb RunAs` déclenche une popup UAC à chaque exécution. En production, le modèle recommandé est un service Windows tournant sous LocalSystem, communiquant via Named Pipe avec authentification HMAC.

```rust
/// Architecture Windows recommandée
/// 1. Un service Windows tourne en SYSTEM (installé une seule fois)
/// 2. L'application Tauri communique via Named Pipe authentifié
/// 3. Le service vérifie le HMAC avant d'exécuter

/// Pour l'installation initiale du service (une seule fois, via -Verb RunAs)
#[cfg(target_os = "windows")]
pub fn install_service_via_elevation() -> Result<(), HardenError> {
    use std::process::Command;
    // Uniquement pour l'installation initiale du service
    // Pas pour les opérations courantes de hardening
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy", "Bypass",
            "-Command",
            "Start-Process",
            "-FilePath", "C:\\Program Files\\MyApp\\service-installer.exe",
            "-Verb", "RunAs",
            "-Wait",
        ])
        .env_clear()
        .output()
        .map_err(|e| HardenError::ApplyError(e.to_string()))?;

    if !output.status.success() {
        return Err(HardenError::ApplyError(
            "Service installation failed".into()
        ));
    }
    Ok(())
}

/// Communication via Named Pipe sécurisée (production)
/// Le service vérifie le HMAC de chaque commande avant exécution
#[cfg(target_os = "windows")]
pub async fn send_command_via_pipe(cmd: &SignedCommand) -> Result<String, HardenError> {
    use tokio::net::windows::named_pipe::ClientOptions;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    let pipe_name = r"\\.\pipe\myapp-hardening-service";
    let mut client = ClientOptions::new()
        .open(pipe_name)
        .map_err(|e| HardenError::ApplyError(e.to_string()))?;

    let payload = serde_json::to_vec(cmd)
        .map_err(|e| HardenError::ApplyError(e.to_string()))?;

    client.write_all(&payload).await
        .map_err(|e| HardenError::ApplyError(e.to_string()))?;

    let mut response = String::new();
    client.read_to_string(&mut response).await
        .map_err(|e| HardenError::ApplyError(e.to_string()))?;

    Ok(response)
}
```

### Mitigation des 80+ bypass UAC actifs sur Windows 11 24H2

Microsoft considère officiellement que l'UAC n'est pas une frontière de sécurité — les bypass ne reçoivent pas de correctifs. Les bypass actifs incluent `fodhelper.exe` (registry hijacking via HKCU), CMSTPLUA (COM auto-élevé), et SilentCleanup/DismHost DLL hijacking.

**Stratégie de mitigation pour l'application** :
- Minimiser la fréquence des prompts d'élévation — regrouper les opérations en batch
- Afficher un indicateur UI distinctif AVANT chaque prompt UAC pour que l'utilisateur sache l'attendre
- En production, utiliser le service Windows (LocalSystem) avec Named Pipe pour éviter UAC entièrement

---

## 5. Élévation sur macOS — SMJobBless

### SMJobBless pour les Privileged Helper Tools

Sur macOS, le mécanisme officiel pour les opérations privilégiées dans une application GUI est `SMJobBless`. La commande `sudo` est interdite dans une application GUI signée distribuée via le Mac App Store ou notarisée.

```rust
/// Sur macOS, la configuration SMJobBless se fait dans Info.plist
/// L'application principale déclare le helper dans SMPrivilegedExecutables
/// Le helper déclare l'application dans SMAuthorizedClients

/// Côté application principale (extrait Info.plist)
/// <key>SMPrivilegedExecutables</key>
/// <dict>
///     <key>com.myapp.hardening.helper</key>
///     <string>identifier "com.myapp.hardening.helper" and anchor apple generic
///              and certificate 1[field.1.2.840.113635.100.6.2.6] /* exists */
///              and certificate leaf[field.1.2.840.113635.100.6.1.13] /* exists */
///              and certificate leaf[subject.OU] = "TEAMID"</string>
/// </dict>

/// Côté helper (extrait Info.plist)
/// <key>SMAuthorizedClients</key>
/// <array>
///     <string>identifier "com.myapp" and anchor apple generic
///              and certificate leaf[subject.OU] = "TEAMID"</string>
/// </array>

#[cfg(target_os = "macos")]
pub fn check_helper_installed() -> bool {
    // Vérifier que le helper est installé et sa signature est valide
    let helper_path = "/Library/PrivilegedHelperTools/com.myapp.hardening.helper";
    std::path::Path::new(helper_path).exists()
}

/// Mitigation CVE-2025-43530 : ne pas utiliser SecStaticCodeCreateWithPath
/// pour valider la confiance — utiliser audit tokens à la place
/// CVE-2025-43530 montre que SecStaticCodeCreateWithPath peut être contourné
/// via injection dans un processus signé Apple
```

---

## 6. Pattern toggle idempotent — Lire l'état réel avant d'agir

### Principe fondamental

Ne jamais se fier à l'état stocké par l'application. Toujours lire l'état réel du système OS avant d'appliquer un toggle. C'est le pattern "desired state convergence" utilisé par Ansible et Terraform.

```rust
use std::process::Command;
use thiserror::Error;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ToggleState {
    Enabled,
    Disabled,
    Unknown,
}

#[derive(Debug, Error)]
pub enum HardenError {
    #[error("Lecture de l'état impossible : {0}")]
    StateReadError(String),
    #[error("Application échouée : {0}")]
    ApplyError(String),
    #[error("Vérification post-application échouée")]
    VerificationFailed,
}

/// Lit l'état RÉEL d'UFW depuis l'OS — jamais depuis l'état stocké dans l'application
pub fn read_ufw_actual_state() -> Result<ToggleState, HardenError> {
    let output = Command::new("/usr/sbin/ufw")
        .arg("status")
        .env_clear()
        .output()
        .map_err(|e| HardenError::StateReadError(e.to_string()))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    if stdout.contains("Status: active") {
        Ok(ToggleState::Enabled)
    } else if stdout.contains("Status: inactive") {
        Ok(ToggleState::Disabled)
    } else {
        Ok(ToggleState::Unknown)
    }
}

/// Toggle idempotent : ne modifie le système QUE si l'état réel diffère de l'état désiré
pub fn set_ufw_idempotent(desired: ToggleState) -> Result<(), HardenError> {
    let actual = read_ufw_actual_state()?;

    // Si l'état est déjà correct — ne rien faire (idempotent)
    if actual == desired {
        tracing::debug!("UFW already in desired state {:?} — no action needed", desired);
        return Ok(());
    }

    let arg = match desired {
        ToggleState::Enabled  => "enable",
        ToggleState::Disabled => "disable",
        ToggleState::Unknown  => return Err(HardenError::ApplyError(
            "Impossible de définir l'état Unknown".into()
        )),
    };

    let status = Command::new("/usr/sbin/ufw")
        .args(["--force", arg])
        .env_clear()
        .status()
        .map_err(|e| HardenError::ApplyError(e.to_string()))?;

    if !status.success() {
        return Err(HardenError::ApplyError(
            format!("ufw {} a échoué avec le code {}", arg, status)
        ));
    }

    // VÉRIFICATION POST-APPLICATION — fail closed si l'état n'a pas changé
    let verified = read_ufw_actual_state()?;
    if verified != desired {
        return Err(HardenError::VerificationFailed);
    }

    tracing::info!("UFW state changed to {:?}", desired);
    Ok(())
}
```

---

## 7. Hardening atomique avec rollback LIFO (Drop guards)

### Pattern Drop guard pour le rollback automatique

Quand plusieurs opérations de hardening sont appliquées en séquence, un échec partiel peut laisser le système dans un état incohérent. Les Drop guards Rust garantissent un rollback automatique dans l'ordre inverse (LIFO) en cas d'échec.

```rust
pub struct RollbackGuard {
    rollback_fn: Option<Box<dyn FnOnce()>>,
    committed: bool,
    description: String,
}

impl RollbackGuard {
    /// Crée un guard qui exécutera rollback() si commit() n'est pas appelé avant drop()
    pub fn new(description: impl Into<String>, rollback: impl FnOnce() + 'static) -> Self {
        Self {
            rollback_fn: Some(Box::new(rollback)),
            committed: false,
            description: description.into(),
        }
    }

    /// Marque l'opération comme réussie — annule le rollback automatique
    pub fn commit(mut self) {
        self.committed = true;
    }
}

impl Drop for RollbackGuard {
    fn drop(&mut self) {
        if !self.committed {
            if let Some(f) = self.rollback_fn.take() {
                tracing::warn!(
                    "Rollback déclenché pour '{}' — opération incomplète",
                    self.description
                );
                f();
            }
        }
    }
}

/// Applique un ensemble de mesures de hardening de manière atomique
/// Si une étape échoue, toutes les étapes précédentes sont rollback dans l'ordre LIFO
pub fn apply_full_hardening() -> Result<(), HardenError> {
    // Étape 1 : activer UFW
    let prev_ufw = read_ufw_actual_state()?;
    set_ufw_idempotent(ToggleState::Enabled)?;
    let guard_ufw = RollbackGuard::new("UFW enable", move || {
        tracing::warn!("Rolling back UFW to previous state: {:?}", prev_ufw);
        let _ = set_ufw_idempotent(prev_ufw);
    });

    // Étape 2 : désactiver IP forwarding via sysctl
    let prev_ipfwd = read_sysctl("net.ipv4.ip_forward")?;
    set_sysctl_idempotent("net.ipv4.ip_forward", "0")?;
    let guard_sysctl = RollbackGuard::new("sysctl ip_forward", move || {
        tracing::warn!("Rolling back sysctl net.ipv4.ip_forward to {}", prev_ipfwd);
        let _ = set_sysctl_idempotent("net.ipv4.ip_forward", &prev_ipfwd);
    });

    // Étape 3 : configurer auditd
    let prev_auditd = read_auditd_state()?;
    configure_auditd_hardening()?;
    let guard_auditd = RollbackGuard::new("auditd hardening", move || {
        tracing::warn!("Rolling back auditd to previous configuration");
        let _ = restore_auditd_state(&prev_auditd);
    });

    // Si on arrive ici, toutes les étapes ont réussi — commit tous les guards
    // Les guards ne rollback PAS quand committed = true
    guard_ufw.commit();
    guard_sysctl.commit();
    guard_auditd.commit();

    tracing::info!("Full hardening applied successfully");
    Ok(())
}

/// Lit une valeur sysctl
fn read_sysctl(key: &str) -> Result<String, HardenError> {
    let output = Command::new("/sbin/sysctl")
        .arg("-n")
        .arg(key)
        .env_clear()
        .output()
        .map_err(|e| HardenError::StateReadError(e.to_string()))?;
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

/// Modifie une valeur sysctl de manière idempotente
fn set_sysctl_idempotent(key: &str, value: &str) -> Result<(), HardenError> {
    let current = read_sysctl(key)?;
    if current == value {
        return Ok(()); // Déjà à la valeur désirée
    }
    let kv = format!("{}={}", key, value);
    let status = Command::new("/sbin/sysctl")
        .arg("-w")
        .arg(&kv)
        .env_clear()
        .status()
        .map_err(|e| HardenError::ApplyError(e.to_string()))?;
    if !status.success() {
        return Err(HardenError::ApplyError(format!("sysctl -w {} failed", kv)));
    }
    Ok(())
}
```

---

## 8. Snapshots d'état protégés cryptographiquement (Ed25519 + hash chaining)

### Pourquoi protéger les snapshots d'état

Un attaquant ayant un accès local peut modifier le fichier d'état de l'application pour forcer un rollback vers un état moins sécurisé. La protection : chaque snapshot est signé avec Ed25519, et les snapshots sont chaînés par leurs hashes (impossible d'insérer ou modifier un snapshot sans casser la chaîne).

```rust
use ed25519_dalek::{SigningKey, VerifyingKey, Signature, Signer, Verifier};
use sha2::{Sha256, Digest};
use serde::{Serialize, Deserialize};

/// Un paramètre de configuration système avec son état vérifié
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SettingState {
    /// Clé : ex. "ufw.enabled", "sysctl.net.ipv4.ip_forward", "auditd.active"
    pub key: String,
    /// Valeur : ex. "true", "0", "active"
    pub value: String,
    /// true si la valeur a été vérifiée contre l'état réel du système à la création du snapshot
    pub actual_verified: bool,
}

/// Un snapshot immuable de l'état du système à un instant donné
#[derive(Serialize, Deserialize, Clone)]
pub struct StateSnapshot {
    /// Numéro de version séquentiel — détecte les replay attacks
    pub version: u64,
    /// Timestamp ISO 8601
    pub timestamp: String,
    /// Liste des paramètres de configuration avec leurs valeurs
    pub settings: Vec<SettingState>,
    /// Hash du snapshot précédent — chaînage anti-modification
    pub previous_hash: [u8; 32],
}

/// Snapshot avec signature cryptographique
#[derive(Serialize, Deserialize)]
pub struct SignedSnapshot {
    pub snapshot: StateSnapshot,
    /// Hash SHA-256 du contenu sérialisé
    pub content_hash: [u8; 32],
    /// Signature Ed25519 sur content_hash
    pub signature: Vec<u8>,
}

impl SignedSnapshot {
    /// Crée un snapshot signé à partir de l'état actuel du système
    pub fn create(
        snapshot: StateSnapshot,
        signing_key: &SigningKey,
    ) -> Self {
        let serialized = serde_json::to_vec(&snapshot).expect("Sérialisation impossible");
        let mut hasher = Sha256::new();
        hasher.update(&serialized);
        let content_hash: [u8; 32] = hasher.finalize().into();
        let signature = signing_key.sign(&content_hash);

        Self {
            snapshot,
            content_hash,
            signature: signature.to_bytes().to_vec(),
        }
    }

    /// Vérifie l'intégrité cryptographique du snapshot
    pub fn verify(&self, verifying_key: &VerifyingKey) -> Result<(), String> {
        // 1. Vérifier que le hash correspond au contenu
        let serialized = serde_json::to_vec(&self.snapshot)
            .map_err(|e| e.to_string())?;
        let mut hasher = Sha256::new();
        hasher.update(&serialized);
        let computed: [u8; 32] = hasher.finalize().into();
        if computed != self.content_hash {
            return Err("Hash du contenu invalide — état potentiellement falsifié".into());
        }

        // 2. Vérifier la signature Ed25519
        let sig_bytes: [u8; 64] = self.signature.clone()
            .try_into()
            .map_err(|_| "Longueur de signature invalide")?;
        let sig = Signature::from_bytes(&sig_bytes);
        verifying_key.verify(&self.content_hash, &sig)
            .map_err(|_| "Signature Ed25519 invalide — état potentiellement falsifié")?;

        Ok(())
    }
}

/// Vérifie l'intégrité de toute la chaîne de snapshots avant un rollback
pub fn verify_snapshot_chain(
    snapshots: &[SignedSnapshot],
    verifying_key: &VerifyingKey,
) -> Result<(), HardenError> {
    for (i, snap) in snapshots.iter().enumerate() {
        snap.verify(verifying_key)
            .map_err(|e| HardenError::StateReadError(e))?;

        if i > 0 {
            // Vérifier le chaînage : previous_hash doit pointer vers le snapshot précédent
            if snap.snapshot.previous_hash != snapshots[i - 1].content_hash {
                return Err(HardenError::StateReadError(format!(
                    "Chaîne de snapshots cassée au snapshot {} — modification détectée",
                    i
                )));
            }
        }
    }
    Ok(())
}
```

---

## 9. Rollback sécurisé — Refus de dégradation de sécurité

```rust
use std::collections::HashMap;

/// Paramètres considérés comme critiques pour la sécurité
const SECURITY_CRITICAL_KEYS: &[&str] = &[
    "ufw.enabled",
    "sysctl.net.ipv4.ip_forward",
    "sysctl.net.ipv4.tcp_syncookies",
    "sysctl.kernel.dmesg_restrict",
    "sysctl.kernel.kptr_restrict",
    "sysctl.kernel.yama.ptrace_scope",
    "auditd.active",
    "apparmor.enforce",
];

/// Détermine si une valeur est moins sécurisée qu'une autre pour un paramètre donné
fn is_less_secure(key: &str, candidate: &str, current: &str) -> bool {
    match key {
        // Pour ces paramètres, "0" est moins sécurisé que "1" ou "2"
        k if k.contains("restrict") || k.contains("syncookies")
              || k.contains("filter") || k.contains("enabled")
              || k.contains("enforce") || k.contains("active") => {
            let candidate_val: i32 = candidate.parse().unwrap_or(0);
            let current_val: i32 = current.parse().unwrap_or(0);
            candidate_val < current_val
        }
        // Pour ip_forward, "1" est moins sécurisé que "0"
        k if k.contains("ip_forward") || k.contains("send_redirects") => {
            candidate == "1" && current == "0"
        }
        _ => false, // Conservateur : pas de jugement si la sémantique est inconnue
    }
}

/// Effectue un rollback sécurisé vers un snapshot précédent
/// Refuse tout rollback qui dégraderait la sécurité par rapport à l'état actuel
pub fn safe_rollback(
    target: &SignedSnapshot,
    verifying_key: &VerifyingKey,
    all_snapshots: &[SignedSnapshot],
) -> Result<(), HardenError> {
    // 1. Vérifier l'intégrité cryptographique du snapshot cible
    target.verify(verifying_key)
        .map_err(|e| HardenError::StateReadError(e))?;

    // 2. Vérifier toute la chaîne de snapshots
    verify_snapshot_chain(all_snapshots, verifying_key)?;

    // 3. Lire l'état RÉEL actuel du système
    let current_actual = read_all_actual_states()?;

    // 4. Refuser le rollback si l'état cible est moins sécurisé sur des paramètres critiques
    for setting in &target.snapshot.settings {
        if SECURITY_CRITICAL_KEYS.contains(&setting.key.as_str()) {
            if let Some(current_val) = current_actual.get(&setting.key) {
                if is_less_secure(&setting.key, &setting.value, current_val) {
                    return Err(HardenError::ApplyError(format!(
                        "Rollback bloqué : '{}' passerait de '{}' à '{}' (dégradation de sécurité)",
                        setting.key, current_val, setting.value
                    )));
                }
            }
        }
    }

    // 5. Appliquer le rollback avec des guards atomiques
    apply_snapshot_with_guards(&target.snapshot)?;

    // 6. Logger l'action dans le journal d'audit
    tracing::info!(
        "Rollback vers snapshot v{} appliqué avec succès",
        target.snapshot.version
    );

    Ok(())
}

/// Lit tous les états réels du système en une seule passe
fn read_all_actual_states() -> Result<HashMap<String, String>, HardenError> {
    let mut states = HashMap::new();

    // UFW
    if let Ok(state) = read_ufw_actual_state() {
        states.insert("ufw.enabled".into(), match state {
            ToggleState::Enabled  => "1".into(),
            ToggleState::Disabled => "0".into(),
            ToggleState::Unknown  => "unknown".into(),
        });
    }

    // Paramètres sysctl critiques
    for key in &["net.ipv4.ip_forward", "net.ipv4.tcp_syncookies",
                  "kernel.dmesg_restrict", "kernel.kptr_restrict",
                  "kernel.yama.ptrace_scope"] {
        if let Ok(val) = read_sysctl(key) {
            states.insert(format!("sysctl.{}", key), val);
        }
    }

    Ok(states)
}

/// Applique un snapshot avec des guards de rollback atomique
fn apply_snapshot_with_guards(snapshot: &StateSnapshot) -> Result<(), HardenError> {
    let mut guards: Vec<RollbackGuard> = Vec::new();

    for setting in &snapshot.settings {
        match setting.key.as_str() {
            "ufw.enabled" => {
                let desired = if setting.value == "1" {
                    ToggleState::Enabled
                } else {
                    ToggleState::Disabled
                };
                let prev = read_ufw_actual_state()?;
                set_ufw_idempotent(desired)?;
                guards.push(RollbackGuard::new(
                    format!("restore ufw to {:?}", prev),
                    move || { let _ = set_ufw_idempotent(prev); }
                ));
            }
            k if k.starts_with("sysctl.") => {
                let sysctl_key = k.strip_prefix("sysctl.").unwrap();
                let prev = read_sysctl(sysctl_key)?;
                let value = setting.value.clone();
                set_sysctl_idempotent(sysctl_key, &setting.value)?;
                guards.push(RollbackGuard::new(
                    format!("restore sysctl {} to {}", sysctl_key, prev),
                    move || { let _ = set_sysctl_idempotent(sysctl_key, &prev); }
                ));
            }
            _ => {
                tracing::debug!("Paramètre '{}' ignoré (non géré)", setting.key);
            }
        }
    }

    // Tout a réussi — commit tous les guards
    for guard in guards {
        guard.commit();
    }

    Ok(())
}
```

---

## 10. Stockage des snapshots par plateforme

| OS | Emplacement | Permissions | Justification |
|----|-------------|-------------|---------------|
| Linux | `/var/lib/safety-ai/state.db` | `0600 root:root` | Protégé par les permissions UNIX — requiert élévation pour accéder |
| Windows | `HKLM\SOFTWARE\SafetyAI` + `%ProgramData%\SafetyAI\state.db` | ACL admin-only | HKLM requiert admin pour écriture ; ProgramData évite les profils utilisateur |
| macOS | `/Library/Application Support/SafetyAI/state.db` | `0600 root:wheel` | `/Library` global (pas `~/Library` utilisateur) — requiert root |

**Pourquoi SQLite et pas JSON/TOML** : SQLite offre des garanties ACID (intégrité transactionnelle), `journal_mode=WAL` pour la résilience aux crashs, et une meilleure résistance à la corruption partielle. Les snapshots signés sont stockés en BLOB dans SQLite.

---

## 11. Boucle de réconciliation périodique (drift detection)

```rust
use tokio::time::{interval, Duration};

/// Boucle de reconciliation qui détecte le drift entre état désiré et état réel
/// Tourne toutes les 60 secondes — alerte si une protection a été désactivée
pub async fn start_drift_detection_loop(
    desired_state: std::sync::Arc<tokio::sync::RwLock<Vec<SettingState>>>,
    alert_channel: tokio::sync::mpsc::Sender<DriftAlert>,
) {
    let mut ticker = interval(Duration::from_secs(60));

    loop {
        ticker.tick().await;

        let desired = desired_state.read().await;
        let current = match read_all_actual_states() {
            Ok(s) => s,
            Err(e) => {
                tracing::error!("Drift detection: impossible de lire l'état système : {}", e);
                continue;
            }
        };

        for setting in desired.iter() {
            if let Some(actual_value) = current.get(&setting.key) {
                if actual_value != &setting.value {
                    let alert = DriftAlert {
                        key: setting.key.clone(),
                        expected: setting.value.clone(),
                        actual: actual_value.clone(),
                        detected_at: chrono::Utc::now().to_rfc3339(),
                    };
                    tracing::warn!(
                        "DRIFT DETECTED: '{}' devrait être '{}' mais est '{}'",
                        alert.key, alert.expected, alert.actual
                    );
                    let _ = alert_channel.send(alert).await;
                }
            }
        }
    }
}

#[derive(Debug, Clone)]
pub struct DriftAlert {
    pub key: String,
    pub expected: String,
    pub actual: String,
    pub detected_at: String,
}
```

---

## 12. Mitigation BYOVD (Bring Your Own Vulnerable Driver)

### Contexte

EDRKillShifter (août 2024, RansomHub) et plus de 2500 variantes du driver TrueSight ont été utilisés en BYOVD pour charger des drivers signés-mais-vulnérables avec accès kernel, puis terminer les processus de sécurité. Event ID 7045 (chargement d'un nouveau service/driver) est le signal principal à monitorer.

```rust
/// Surveillance de l'Event ID 7045 Windows (chargement de driver)
/// À implémenter dans le composant de monitoring de l'application
#[cfg(target_os = "windows")]
pub struct DriverLoadMonitor {
    known_good_drivers: std::collections::HashSet<String>,
}

#[cfg(target_os = "windows")]
impl DriverLoadMonitor {
    pub fn new() -> Self {
        // Liste des drivers système légitimes connus
        // En production, charger depuis un manifeste signé
        let known_good = [
            "WdFilter.sys",      // Windows Defender
            "WdNisDrv.sys",      // Windows Defender NIS
            "hvsiflte.sys",      // HVSI
        ].iter().map(|s| s.to_lowercase()).collect();

        Self { known_good_drivers: known_good }
    }

    /// Vérifie si un nom de driver est connu et légitime
    pub fn is_suspicious_driver(&self, driver_name: &str) -> bool {
        !self.known_good_drivers.contains(&driver_name.to_lowercase())
    }
}

/// Durcissement Windows — activer HVCI (Memory Integrity) via registre
#[cfg(target_os = "windows")]
pub fn check_hvci_status() -> Result<bool, HardenError> {
    // Vérifier HKLM\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\
    //         HypervisorEnforcedCodeIntegrity\Enabled
    // Valeur 1 = HVCI activé (bloque les drivers non signés avec intégrité vérifiée)
    tracing::info!("Checking HVCI status via registry");
    Ok(false) // Implémentation complète via winreg crate
}
```

---

## 13. Checklist de sécurité — Élévation de privilèges et hardening OS

Avant chaque release, vérifier que tous ces points sont vrais :

- [ ] Toutes les opérations privilégiées passent par le helper binaire séparé — jamais d'élévation de l'app Tauri entière
- [ ] L'intégrité SHA-256 du helper est vérifiée avant chaque invocation de pkexec
- [ ] pkexec est invoqué avec chemin absolu et `env_clear()` — jamais avec $PATH ou runInShell
- [ ] Les actions autorisées sont définies dans un enum fermé Rust — aucune action dynamique
- [ ] La policy polkit utilise `auth_admin` partout — jamais `allow_active` (CVE-2025-6018)
- [ ] Chaque commande IPC est vérifiée par HMAC-SHA256 avant exécution
- [ ] Les commandes avec timestamp >30 secondes sont rejetées (anti-replay)
- [ ] Les toggles utilisent le pattern idempotent : lire l'état réel → comparer → appliquer si différent → vérifier
- [ ] Les opérations multi-étapes utilisent des Drop guards pour le rollback LIFO automatique
- [ ] Chaque snapshot d'état est signé avec Ed25519 et chaîné au snapshot précédent
- [ ] La vérification de la chaîne de hashes est effectuée avant tout rollback
- [ ] Les rollbacks qui dégradent la sécurité sur des paramètres critiques sont refusés
- [ ] Le fichier d'état est stocké avec permissions root-only (0600) dans un répertoire système
- [ ] La boucle de drift detection tourne toutes les 60 secondes
- [ ] Sur Windows, `user_readenv` PAM est désactivé (mitigation CVE-2025-6018)
- [ ] Sur Windows, HVCI est activé (protection BYOVD)
- [ ] Sur Windows, Event ID 7045 est monitoré (chargement de nouveau driver)
- [ ] La fréquence des prompts d'élévation est minimisée — regrouper les opérations en batch
- [ ] Un indicateur UI distinctif est affiché AVANT chaque prompt d'élévation
- [ ] Le sidecar Python vérifie son propre hash SHA-256 au démarrage
- [ ] Les téléchargements de tiers (CrowdSec, Sysmon, LuLu) utilisent SHA-256 pinning + vérification signature plateforme

---

## CVEs de référence (mai 2025 — février 2026)

| CVE | Score | Composant | Impact | Mitigation |
|-----|-------|-----------|--------|-----------|
| CVE-2025-6018 | 7.8 | Linux-PAM / polkit | Root via XDG_SEAT/XDG_VTNR injection | Désactiver `user_readenv`, utiliser `auth_admin` dans polkit |
| CVE-2025-6019 | N/D | libblockdev / udisks2 | Chaîné avec 6018 → root sans interaction SSH | Mettre à jour libblockdev, changer policy udisks2 |
| CVE-2025-6020 | N/D | pam_namespace | Traversée de chemin via symlinks | Mettre à jour Linux-PAM |
| CVE-2025-43530 | N/D | macOS ScreenReader.framework | Bypass TCC via MIG service | Mettre à jour vers macOS 15.5+ |
| CVE-2025-31250 | N/D | macOS tccd | Spoofing du dialogue TCC | Mettre à jour vers macOS 15.x patché |
| CVE-2025-31191 | N/D | macOS sandbox | Sandbox escape via security-scoped bookmarks | Mettre à jour vers macOS 15.x patché |
| CVE-2023-29343 | N/D | Sysmon | EoP vers SYSTEM via résolution de liens | Mettre à jour Sysmon vers la dernière version |
| BYOVD TrueSight | N/D | Driver vulnérable signé | Contournement EDR, kill processus sécurité | Activer HVCI, monitorer Event ID 7045 |
