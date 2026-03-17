# privesc-os-attacks.md
# Élévation de privilèges OS — Vue offensif

Point de vue : ATTAQUANT. Toutes les techniques décrites visent à comprendre comment un adversaire exploite les failles des trois OS pour passer d'un utilisateur standard à root/SYSTEM/admin.

---

## Vue d'ensemble

La surface d'élévation de privilèges est massive en 2025-2026 :
- Linux : chaîne polkit CVE-2025-6018/6019/6020 transforme SSH user → root en quelques secondes
- Windows : Microsoft refuse de corriger les bypass UAC — 80+ méthodes actives sur Win11 24H2
- macOS : explosion des TCC bypasses via AppleScript et XPC forgé
- Outils tiers (Malwarebytes, CCleaner) : les helper binaires eux-mêmes sont des vecteurs LPE
- BYOVD : 2500+ variantes de drivers signés-mais-vulnérables disponibles pour tuer les EDR

L'objectif attaquant : obtenir des privilèges root/SYSTEM pour neutraliser les outils de sécurité, persister, et exfiltrer.

---

## Techniques d'attaque

### 1. Chaîne polkit CVE-2025-6018/6019/6020 (Linux)

**Vecteur** : Utilisateur SSH non-root sur une distribution Linux enterprise
**Prérequis** : Accès SSH valide, udisks2 installé (~98% des distributions enterprise), libblockdev présent
**CVSS** : CVE-2025-6018 : 7.8, CVE-2025-6019 : 7.8, CVE-2025-6020 : TBD
**Date** : Chaîne découverte par Qualys, juin 2025

**Étapes d'exploitation** :
1. Depuis une session SSH, écrire dans `~/.pam_environment` :
   ```
   XDG_SEAT=seat0
   XDG_VTNR=1
   ```
2. Cette manipulation (CVE-2025-6018) trompe PAM : Linux-PAM depuis v1.3.0 lit ce fichier et exporte les variables dans l'environnement de la session SSH.
3. polkit évalue la politique `allow_active` en vérifiant `XDG_SEAT` et `XDG_VTNR` — l'attaquant est maintenant traité comme un utilisateur physiquement présent à la console.
4. La zone de confiance `allow_active` de polkit donne accès aux actions qui seraient normalement refusées à un utilisateur SSH distant.
5. Exploiter CVE-2025-6019 (libblockdev omet le flag `nosuid` lors de montages temporaires via udisks2) pour monter un système de fichiers avec bit SUID activé.
6. Exécuter un binaire SUID depuis ce montage → root.

**Impact** : Root complet sur le système. La chaîne contourne entièrement pkexec sans jamais toucher à pkexec lui-même. Toute application qui invoque régulièrement pkexec repose sur un modèle de confiance (`allow_active`) que cette chaîne annule.

**CVE-2025-6020 (bonus)** : traversée de chemin dans `pam_namespace` via symlinks et race conditions — vecteur supplémentaire pour l'escalade dans des environnements durcis.

---

### 2. PwnKit CVE-2021-4034 (Linux — legacy toujours présent)

**Vecteur** : N'importe quelle session locale ou SSH
**Prérequis** : pkexec installé (présent par défaut sur presque toutes les distributions)
**CVSS** : 7.8

**Étapes d'exploitation** :
1. Créer un répertoire avec un nom qui sera le premier argument de `argc` lors de l'exécution de pkexec.
2. Exploiter la vulnérabilité out-of-bounds write dans la gestion de `argv` par pkexec.
3. Écraser des variables d'environnement pour injecter `LD_PRELOAD` pointant vers une bibliothèque malveillante.
4. pkexec charge la bibliothèque avec des privilèges root → shell root.

**Impact** : Root. Présent depuis 2009, corrigé en 2022 mais encore non patché sur de nombreux systèmes enterprise legacy. Les exploits PoC publics sont disponibles depuis Qualys.

---

### 3. Windows UAC bypass — 80+ méthodes actives (Windows)

**Vecteur** : Utilisateur standard ou processus malveillant tournant en mode utilisateur
**Prérequis** : L'UAC est configuré au niveau par défaut (pas au niveau maximum)
**Contexte** : Microsoft considère officiellement l'UAC comme non-frontière de sécurité — les bypass ne reçoivent pas de correctifs

#### 3a. CMSTPLUA COM auto-elevé

**Outil** : UACME (hfiref0x/UACME, 7400+ stars, mis à jour juillet 2025)
**CLSID** : `{3E5FC7F9-9A51-4367-9063-A120244FBEC7}`
**Utilisé par** : Formbook, LockBit, Cobalt Strike (module `uac-cmlua`)

**Étapes** :
1. Instancier l'objet COM CMSTPLUA via `CoCreateInstance`.
2. Cet objet est marqué `auto-elevate` dans son manifeste — Windows l'élève sans afficher de prompt UAC.
3. Utiliser l'interface `ICMLuaUtil` pour exécuter une commande arbitraire avec privilèges élevés.

**Impact** : Élévation SYSTEM sans prompt UAC visible.

#### 3b. Fodhelper registry hijacking

**Utilisé par** : BlankGrabber, Glupteba
**Principe** : `fodhelper.exe` est marqué `requestedExecutionLevel=requireAdministrator` ET `autoElevate=true` dans son manifeste. Il lit la clé registre `HKCU\Software\Classes\ms-settings\shell\open\command` pour ouvrir un lien — cette clé n'existe pas par défaut mais est inscriptible par l'utilisateur courant.

**Étapes** :
1. Écrire dans `HKCU\Software\Classes\ms-settings\shell\open\command` la commande à exécuter (`cmd.exe /c <payload>`).
2. Définir `HKCU\Software\Classes\ms-settings\shell\open\command\DelegateExecute` comme chaîne vide.
3. Exécuter `fodhelper.exe`.
4. Fodhelper lit la clé, élève le processus automatiquement, et exécute le payload en mode élevé.

**Impact** : Élévation administrative silencieuse.

#### 3c. SilentCleanup / DismHost DLL hijacking (UACME Method 34)

**Statut** : Confirmé fonctionnel sur Windows 11 24H2 (février 2025, après pseudo-correctif Microsoft)

**Étapes** :
1. La tâche planifiée `SilentCleanup` s'exécute avec le niveau `highestAvailable` sans prompt.
2. DismHost.exe lancé par SilentCleanup recherche des DLLs dans des chemins inscriptibles par l'utilisateur.
3. Placer une DLL malveillante dans le chemin de recherche.
4. DismHost.exe charge la DLL avec des privilèges élevés.

#### 3d. UAC Fatigue (attaque psychologique)

**Utilisé par** : DCRat, PureMiner
**Vecteur critique pour les apps affichant des prompts réguliers** : un malware qui affiche des prompts UAC au moment exact où l'utilisateur attend les prompts légitimes de l'application crée une confusion de dialogue.

**Technique** :
```powershell
while($true) { Start-Process "cmd.exe" -Verb runas }
```
Boucle infinie de prompts UAC — l'utilisateur finit par cliquer "Oui" par conditionnement.

---

### 4. Defendnot — Désactivation de Defender via faux AV (Windows)

**Date** : Mai 2025
**Principe** : Abuse l'API non-documentée Windows Security Center (WSC) pour enregistrer un faux antivirus, ce qui force Windows à désactiver Defender automatiquement.

**Étapes** :
1. Injecter une DLL dans `Taskmgr.exe` (binaire PPL signé Microsoft).
2. Depuis ce contexte PPL (Protected Process Light) de confiance, appeler l'API WSC non-documentée pour enregistrer un faux produit antivirus.
3. Windows Security Center détecte un AV "actif" et désactive Defender pour éviter les conflits.
4. L'attaquant opère désormais sans détection par Defender.

**Impact** : Defender désactivé de manière transparente. Aucun prompt pour l'utilisateur.
**Complément** : CVE-2024-20671 (bypass fonctionnalité Defender).

---

### 5. BYOVD — Bring Your Own Vulnerable Driver (Windows)

**Date** : Explosif depuis mi-2024
**Catalogues** : LOLDrivers (loldrivers.io), TrueSight anti-rootkit driver v2.0.2 (2500+ variantes utilisées)

**Outil principal** : EDRKillShifter (RansomHub, août 2024) — adopté ensuite par Medusa, BianLian, Play
**Prix dark web** : EDR killers disponibles de 350 $/mois à 10 000 $ à l'achat

**Étapes BYOVD** :
1. Charger un driver signé Windows mais contenant une vulnérabilité connue (ex: TrueSight v2.0.2).
2. Le driver signé est accepté par Windows même avec Secure Boot actif (il est signé par une CA valide).
3. Exploiter la vulnérabilité du driver pour exécuter du code en mode kernel.
4. Depuis le kernel : terminer les processus EDR/antivirus, désactiver leurs services, modifier leurs callbacks kernel.

**Impact** : Neutralisation complète de la solution EDR avant déploiement du ransomware. CrowdStrike, SentinelOne, Cortex XDR — tous ciblés.

**Incident CrowdStrike (19 juillet 2024, non-exploitation mais illustration)** : le Channel File 291 défectueux (pointeur non-initialisé, validateur défaillant) a causé le BSoD de ~8,5 millions de machines Windows. Pertes estimées : 10+ milliards USD. Démonstration que les outils de sécurité eux-mêmes sont un vecteur de dommage systémique.

---

### 6. TCC bypass — macOS (CVE-2025-43530 et CVE-2025-31250)

#### 6a. CVE-2025-43530 — ScreenReader.framework bypass complet

**Service ciblé** : MIG `com.apple.scrod` dans ScreenReader.framework
**Défaut** : La validation `isTrusted` utilise `SecStaticCodeCreateWithPath` au lieu d'audit tokens. Cette distinction est critique : l'audit token est lié au processus en cours, `SecStaticCodeCreateWithPath` valide un chemin sur disque — un attaquant peut fournir le chemin d'un binaire légitime signé Apple tout en étant un autre processus.

**Étapes** :
1. Identifier un binaire signé Apple sur le système (ex: `/usr/bin/osascript`).
2. Envoyer un message MIG au service `com.apple.scrod` avec ce chemin comme "preuve" d'identité.
3. Le service valide le chemin (pas le processus réel) et accorde les permissions.
4. Résultat : exécution d'AppleScript arbitraire, envoi d'AppleEvents à tout processus, accès au micro, à la caméra, aux documents — sans aucune interaction utilisateur.

**Impact** : TCC bypass complet. Accès silencieux à toutes les données protégées.

#### 6b. CVE-2025-31250 — Spoofing du dialogue de consentement TCC

**Statut** : macOS Ventura 13.7.6 et Sonoma 14.7.6 non-patchés au moment de la découverte
**Principe** : N'importe quelle application peut envoyer un message XPC forgé à `tccd` (le démon TCC) qui affiche un prompt semblant provenir de l'application légitime A mais qui accorde les permissions à l'application malveillante C.

**Impact** : L'utilisateur pense autoriser une application connue. Il autorise en réalité l'attaquant.

---

### 7. CVE-2025-31191 — Sandbox escape macOS

**Vecteur** : Microsoft Threat Intelligence, mars 2025
**Mécanisme** : Exploitation des security-scoped bookmarks pour sortir du sandbox applicatif macOS.

**Étapes** :
1. Une application sandboxée crée un security-scoped bookmark vers un fichier qu'elle a accès à lire.
2. Exploitation d'une faiblesse dans la résolution de ces bookmarks pour accéder à des chemins hors sandbox.
3. Escalade vers des ressources normalement inaccessibles depuis une app sandboxée.

**Impact** : Sortie du sandbox macOS, accès au système de fichiers non restreint.

---

### 8. Pattern CCleaner — IPC helper sans authentification

**Découverte** : Quarkslab, mars 2025
**Produit affecté** : CCleaner (CCleanerAgent — Privileged Helper Tool)
**Applicable à** : Tout helper binaire s'exécutant avec des privilèges élevés qui communique via socket Unix

**Détails de la vulnérabilité** :
- Socket Unix : `/var/run/com.piriform.ccleaner.CCleanerAgent.socket`
- Permissions du socket : `0666` (world-readable et world-writable)
- Authentification du connecteur : aucune

**Étapes d'exploitation** :
1. N'importe quel processus local se connecte au socket Unix.
2. Envoie des commandes arbitraires au helper.
3. Le helper les exécute avec ses privilèges root.

**Catalogues associés** : Project LOST (0xanalyst.github.io/Project-Lost/) — catalogue systématique de l'abus d'outils de sécurité par les adversaires, équivalent de LOLBAS pour les security tools.

---

### 9. Malwarebytes — RCE et LPE

| Vulnérabilité | Type | CVSS | Date | Mécanisme |
|---|---|---|---|---|
| gRPC named pipes | RCE | 9.8 | Fév. 2024 | Pipes nommées Windows mal sécurisées, accessible à tout utilisateur local |
| ZDI-CAN-22321 | LPE (symlink) | 7.8 | Nov. 2024 | Abus de liens symboliques pour écrire des fichiers dans des chemins privilégiés |

**Pipe RCE (CVSS 9.8)** :
1. Malwarebytes Firewall Control expose un endpoint gRPC via named pipes Windows.
2. Les permissions de la pipe permettent l'accès à n'importe quel utilisateur local.
3. Envoyer des commandes gRPC arbitraires → exécution de code dans le contexte du service Malwarebytes (SYSTEM).

---

### 10. Rollback attacks — Forcer une configuration affaiblie

**Cible** : Applications qui stockent un "état avant hardening" pour permettre le rollback
**Prérequis** : Accès en lecture/écriture au fichier d'état de l'application

**Trois scénarios d'attaque** :

**Scénario A — Rollback vers un état affaibli** :
1. Modifier le fichier d'état avant que le hardening soit appliqué.
2. Remplacer les valeurs "état initial" par des valeurs plus faibles que l'état réel.
3. Quand l'utilisateur demande un rollback, le système restaure un état plus faible que la baseline originale.

**Scénario B — Corruption pour empêcher le rollback** :
1. Rendre le fichier d'état illisible ou incohérent (corruption ciblée).
2. L'utilisateur est piégé dans un état intermédiaire, incapable de revenir en arrière.
3. Crée une fenêtre d'instabilité exploitable.

**Scénario C — Replay attack** :
1. Sauvegarder le fichier d'état à un moment T1 (configuration faible).
2. Attendre que la configuration soit durcie au moment T2.
3. Remplacer le fichier d'état actuel par la version T1.
4. Déclencher une "vérification d'état" → le système pense qu'il doit restaurer T1.

---

## Table CVE

| CVE | OS | Type | CVSS | Statut | Description courte |
|---|---|---|---|---|---|
| CVE-2025-6018 | Linux | LPE via polkit | 7.8 | Corrigé (juin 2025) | Manipulation PAM ~/.pam_environment → allow_active polkit bypass |
| CVE-2025-6019 | Linux | LPE via udisks2 | 7.8 | Corrigé (juin 2025) | libblockdev omet flag nosuid → montage SUID exploitable |
| CVE-2025-6020 | Linux | LPE via pam_namespace | TBD | Corrigé (juin 2025) | Traversée de chemin via symlinks et race conditions |
| CVE-2021-4034 | Linux | LPE pkexec | 7.8 | Corrigé 2022, non-patché legacy | PwnKit — OOB write pkexec → LD_PRELOAD injection |
| CVE-2025-43530 | macOS | TCC bypass | Critique | Corrigé | ScreenReader.framework — SecStaticCodeCreateWithPath vs audit tokens |
| CVE-2025-31250 | macOS | TCC spoof | Critique | Non-patché sur Ventura 13.7.6 + Sonoma 14.7.6 | XPC forgé → prompt TCC trompeur |
| CVE-2025-31191 | macOS | Sandbox escape | Élevé | Corrigé | Security-scoped bookmarks exploitation |
| CVE-2023-29343 | Windows (Sysmon) | EoP → SYSTEM | Élevé | Corrigé | Sysmon — résolution de liens impropre |
| CVE-2024-20671 | Windows (Defender) | Bypass fonctionnalité | Élevé | Corrigé | Contournement protection Defender |
| CVE-2019-16784 | Cross | PyInstaller tmpdir | Moyen | Corrigé | Race condition _MEIPASS |
| CVE-2025-59042 | Cross | PyInstaller bootstrap | 7.0–7.3 | Corrigé dans 6.10.0 | Injection code via manipulation sys.path |

---

## Patterns Grep — Détecter le code vulnérable

```bash
# Rechercher des helpers Unix avec permissions de socket non restreintes
grep -r "0666\|0o666" --include="*.rs" .
grep -r "UnixListener\|unix_socket" --include="*.rs" .

# Détecter l'absence d'authentification sur les handlers IPC
grep -r "fn handle_connection\|fn handle_client" --include="*.rs" . | grep -v "verify\|auth\|hmac\|check"

# Rechercher des appels pkexec sans validation d'environnement
grep -r "pkexec\|polkit" --include="*.rs" . | grep -v "env_clear\|env_remove"

# Détecter du code qui lit XDG_SEAT / XDG_VTNR sans sanitation
grep -r "XDG_SEAT\|XDG_VTNR" --include="*.rs" .

# Trouver des fichiers d'état non signés cryptographiquement
grep -r "serde_json::from_str\|serde_json::from_reader" --include="*.rs" . | grep -v "verify\|signature\|hmac"

# Détecter l'absence de rollback guard pour les opérations multi-étapes
grep -r "fn.*hardening\|fn.*harden\|fn enable" --include="*.rs" . | grep -v "RollbackGuard\|guard\|rollback"

# Rechercher des comparaisons de secrets avec == (timing attack)
grep -r "== expected\|expected ==" --include="*.rs" . | grep -v "constant_time\|ct_eq\|timing"
```
