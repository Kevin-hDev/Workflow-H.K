# security-tools-attacks.md
# Attaques sur les outils de sécurité — Vue offensif

Point de vue : ATTAQUANT. Comment abuser, contourner, ou exploiter les outils de sécurité eux-mêmes pour progresser dans une attaque.

---

## Vue d'ensemble

Les outils de sécurité sont devenus une cible prioritaire des adversaires avancés. Trois raisons :
1. Ils s'exécutent avec des privilèges élevés — les compromettre donne directement accès admin/root.
2. Ils font confiance à leur propre liste blanche — un attaquant qui s'y introduit est invisible.
3. Les désactiver avant le déploiement du payload rend toute détection impossible.

**Project LOST** (0xanalyst.github.io/Project-Lost/) cataloge systématiquement l'abus d'outils de sécurité par les adversaires. C'est l'équivalent de LOLBAS pour les security tools.

Catalogues complémentaires :
- **GTFOBins** : binaires Unix avec fonctionnalités cachées exploitables (sudo, SUID, capabilities)
- **LOOBins** : équivalent macOS (osascript, launchctl, sysctl, etc.)
- **LOLDrivers** (loldrivers.io) : drivers Windows signés mais vulnérables utilisables pour le BYOVD

---

## Techniques d'attaque par outil

### 1. UFW — Docker bypass (Linux)

**Outil ciblé** : UFW (Uncomplicated Firewall)
**Vecteur** : Docker contourne UFW silencieusement via des règles iptables directes
**Prérequis** : Docker installé sur la même machine qu'UFW

**Étapes d'exploitation** :
1. La victime active UFW pour bloquer les connexions entrantes — elle se croit protégée.
2. Docker, à chaque démarrage d'un conteneur avec un port mappé (`-p 8080:80`), injecte directement ses propres règles iptables dans la chaîne `DOCKER-USER` et `DOCKER`.
3. Ces règles iptables court-circuitent UFW : le trafic vers les ports des conteneurs arrive avant d'atteindre les chaînes INPUT gérées par UFW.
4. Un conteneur Docker exposant un service sur `0.0.0.0:8080` est accessible depuis Internet malgré `ufw deny 8080`.

**Impact** : L'administrateur croit son service protégé. Il ne l'est pas. Tout port mappé par Docker est accessible en externe.

**Détection par l'attaquant** :
- Scanner la cible : `nmap -sV -p- <IP>` révèle des ports ouverts qu'UFW devrait bloquer.
- La présence de Docker suffit pour suspecter ce vecteur.

---

### 2. LuLu — Bypass via binaire whitelisté (macOS)

**Outil ciblé** : LuLu (pare-feu sortant macOS, Objective-See)
**Documentation officielle de LuLu elle-même** : "implements only limited self-defense mechanisms. Proactive bypass attempts will likely succeed."

**Technique documentée par Null Byte** :
1. LuLu crée des règles basées sur les chemins de binaires.
2. Identifier un binaire dans la liste blanche de LuLu (ex: `ksfetch` dans le chemin `~/Library/Google/GoogleSoftwareUpdate/GoogleSoftwareUpdate.bundle/...`).
3. Copier `/usr/bin/curl` (ou tout autre outil réseau) vers ce chemin whitelisté :
   ```bash
   cp /usr/bin/curl ~/Library/Google/GoogleSoftwareUpdate/.../ksfetch
   ```
4. Exécuter ce "faux ksfetch" — LuLu l'autorise car il correspond au chemin whitelisté.
5. Connexion sortante possible vers n'importe quelle destination.

**Impact** : Exfiltration de données ou communication C2 contournant le pare-feu sortant. Zéro alerte.

**Alternative** : Identifier des chemins whitelistés via la configuration LuLu stockée dans `~/Library/Application Support/com.objective-see.lulu/`.

---

### 3. Sysmon — CVE-2023-29343 EoP → SYSTEM (Windows)

**Outil ciblé** : Sysmon (Microsoft Sysinternals)
**CVE** : CVE-2023-29343
**Impact** : Élévation de SYSTEM

**Mécanisme** :
- Sysmon résout des liens symboliques de manière impropre lors du traitement de certains événements.
- Un attaquant ayant accès local peut créer des liens symboliques spécifiques qui sont résolus dans le contexte du service Sysmon (SYSTEM).
- Exploitation : création d'un lien vers un fichier privilégié → écriture ou écrasement d'un fichier système → LPE.

**Impact pour l'attaquant** : Élévation SYSTEM en abusant de l'outil de monitoring lui-même. Ironie : l'outil censé détecter les attaques est le vecteur d'élévation.

---

### 4. CrowdSec — Faux positifs pour DoS de services légitimes

**Outil ciblé** : CrowdSec IPS collaboratif
**Vecteur** : Manipulation des détections pour bannir des IPs légitimes

**Technique** :
1. CrowdSec bannit les IPs basé sur des comportements (N échecs d'authentification, scans, etc.).
2. Un attaquant contrôlant un accès intermédiaire (ou spoofant des IPs) peut fabriquer du trafic qui ressemble à des attaques provenant d'IPs légitimes.
3. CrowdSec ban ces IPs "attaquantes" → les services légitimes derrière ces IPs sont coupés.
4. Variante : si CrowdSec partage les IPs avec la communauté, empoisonner la base collaborative.

**Impact** : DoS sélectif de services légitimes. Idéal pour couper les communications d'une victime avec son équipe IT.

---

### 5. Fail2ban — IP rotation pour contourner les bans

**Outil ciblé** : Fail2ban
**Vecteur** : Brute force à grande échelle malgré la protection

**Technique** :
1. Fail2ban bannit une IP après N échecs dans une fenêtre de temps.
2. L'attaquant utilise un pool de milliers d'IPs (botnet, proxies résidentiels, Tor) pour distribuer les tentatives.
3. Chaque IP ne dépasse jamais le seuil de Fail2ban (ex: 3 tentatives par IP si le seuil est 5).
4. Brute force totale = (nb IPs) × (seuil Fail2ban - 1) tentatives, sans aucun ban.

**Calcul pratique** : avec 10 000 IPs et un seuil de 5 → 40 000 tentatives sans ban.

**Variante avancée** : Fail2ban utilise les logs comme source de vérité. Si l'attaquant peut manipuler les logs (log injection via des usernames malformés contenant des IPs), il peut faire bannir l'IP de l'administrateur lui-même.

---

### 6. AIDE/OSSEC — Modifier la baseline de référence

**Outils ciblés** : AIDE (Advanced Intrusion Detection Environment), OSSEC FIM
**Prérequis** : Accès root (obtenu via LPE préalable)
**Contexte** : Une fois root, l'attaquant veut persister sans déclencher les alertes FIM

**Technique AIDE** :
1. L'attaquant obtient root.
2. Identifier l'emplacement de la base AIDE : `/var/lib/aide/aide.db`
3. Modifier les fichiers du système pour installer la persistance (ex: cron, LD_PRELOAD, PAM module).
4. Régénérer la base AIDE pour intégrer les fichiers modifiés comme "baseline légitime" :
   ```bash
   aide --init
   cp /var/lib/aide/aide.db.new /var/lib/aide/aide.db
   ```
5. Désormais, AIDE ne détecte plus aucune anomalie — les fichiers malveillants font partie de la baseline.

**Technique OSSEC** : similaire — modifier `ossec.conf` pour exclure les chemins de persistance, ou corrompre les syscheck databases.

---

### 7. Suricata — Évasion par fragmentation et encoding

**Outil ciblé** : Suricata IDS/IPS
**Principe** : Suricata a des limites de détection sur certains vecteurs de dissimulation

**Techniques d'évasion** :

**Fragmentation IP/TCP** :
1. Fragmenter les paquets malveillants en segments plus petits que la taille d'inspection de Suricata.
2. Si les règles recherchent des patterns dans une seule payload, la fragmentation les divise sur plusieurs paquets.
3. Suricata réassemble normalement — mais les règles mal écrites ne vérifient que la première fragment.

**Encodage et obfuscation** :
- HTTP chunked encoding avec des chunks de 1 octet — certaines règles ne gèrent pas correctement la réassemblage chunked.
- Compression (gzip, deflate) des payloads malveillants — si la règle cherche un pattern en clair.
- Protocoles non-standards : utiliser un port non-standard pour HTTP pour contourner les règles basées sur le port.

**Timing** :
- Attaques lentes (slow-rate) : une connexion par heure — les règles de détection de scan/brute force ont des fenêtres temporelles fixes.

---

### 8. EDR Killers — Neutralisation avant déploiement du payload

**Marché dark web** : EDR killers disponibles à partir de 350 $/mois (abonnement), jusqu'à 10 000 $ à l'achat
**Technique principale** : BYOVD (Bring Your Own Vulnerable Driver)

#### EDRKillShifter (RansomHub, août 2024)

**Adopteurs** : Medusa, BianLian, Play + 5 autres gangs après la fuite du code
**Mécanisme** :
1. Charger un driver Windows signé mais contenant une vulnérabilité connue.
2. Exploiter la vulnérabilité depuis l'espace utilisateur pour exécuter du code kernel.
3. Depuis le kernel : terminer les processus EDR/antivirus par PID ou nom.
4. Supprimer les services EDR.
5. Désactiver les callbacks kernel enregistrés par l'EDR (ex: `PsSetCreateProcessNotifyRoutine`).

**Drivers vulnérables couramment utilisés** :
- TrueSight anti-rootkit driver v2.0.2 (2500+ variantes documentées, Checkpoint Research)
- Catalogue LOLDrivers : loldrivers.io (mis à jour continuellement)

#### EDRSilencer

**Technique différente de EDRKillShifter** : au lieu de tuer les processus EDR, EDRSilencer utilise WFP (Windows Filtering Platform) pour bloquer la communication réseau des processus EDR.
1. Identifier les processus EDR en cours (CrowdStrike, SentinelOne, Cortex).
2. Ajouter des filtres WFP bloquant toutes les connexions sortantes de ces processus.
3. L'EDR continue à fonctionner et à consommer de la CPU — mais ne peut plus remonter ses alertes vers la console centrale.
4. L'attaquant opère pendant que les alertes s'accumulent localement mais n'atteignent jamais l'équipe SOC.

---

### 9. Abus de Wazuh — Exfiltration via le canal de monitoring

**Outil ciblé** : Wazuh XDR/SIEM
**Vecteur** : Abuser du canal légitime agent → manager pour exfiltrer des données

**Technique** :
1. Compromettre un endpoint qui a un agent Wazuh installé.
2. L'agent Wazuh envoie des logs au manager Wazuh via un canal chiffré et authentifié sur le port 1514.
3. Injecter des données arbitraires dans les logs envoyés par l'agent Wazuh — ces données transitent sur le canal légitime, non bloqué par les règles réseau.
4. Côté serveur : les "logs" contiennent en réalité des données exfiltrées encodées.

**Variante** : modifier les règles Wazuh locales pour supprimer la détection des activités malveillantes spécifiques à l'attaquant.

---

### 10. Lynis / OpenSCAP — Cartographie préalable de la configuration

**Outils ciblés** : Lynis, OpenSCAP (outils d'audit)
**Prérequis** : Exécution locale avec les privilèges de l'utilisateur compromis

**Technique** :
1. Exécuter Lynis en mode silencieux depuis le compte compromis :
   ```bash
   lynis audit system --quiet --no-colors 2>/dev/null
   ```
2. Le rapport identifie toutes les faiblesses : services non patchés, configurations manquantes, capabilités SUID, etc.
3. Utiliser ce rapport comme roadmap d'exploitation — Lynis fait le travail de reconnaissance pour l'attaquant.

**Données récoltées** :
- Services installés et versions (surface d'attaque CVE)
- Configurations SSH faibles
- Répertoires inscriptibles par l'utilisateur courant
- Binaires SUID/SGID
- Modules kernel chargés

**Impact** : L'outil d'audit génère lui-même un guide d'exploitation de la cible.

---

### 11. Trivy / Nuclei — Scan offensif légitimisé

**Outils ciblés** : Trivy (scanner), Nuclei (scanner de vulnérabilités)
**Vecteur** : Ces outils, légitimes, sont utilisés pour le reconnaissance offensive

**Technique avec Nuclei** :
1. Depuis un système compromis ou en reconnaissance externe :
   ```bash
   nuclei -u https://target.com -t nuclei-templates/ -severity critical,high
   ```
2. Les 10 000+ templates YAML de Nuclei (mis à jour quasi-quotidiennement) identifient : CVEs exploitables, misconfigurations exposées, endpoints d'admin non protégés, fichiers de credentials exposés.
3. Ces outils sont "légitimes" — leur trafic ressemble à des scans de sécurité normaux.

**Technique avec Trivy** :
```bash
trivy fs / --security-checks secret,vuln 2>/dev/null
```
Scan local du filesystem pour trouver des secrets embarqués dans les fichiers de configuration, packages npm, images Docker, etc.

---

### 12. Privilege escalation via les helper processes des outils de sécurité

**Principe général** : Les outils de sécurité s'exécutent souvent avec des privilèges élevés et communiquent via des IPC (sockets, pipes, COM). Ces canaux IPC sont souvent moins bien sécurisés que le processus principal.

**Pattern d'attaque universel** :
1. Identifier les processus s'exécutant en root/SYSTEM appartenant aux outils de sécurité.
2. Identifier leurs IPC : sockets Unix (`ls -la /var/run/`), named pipes Windows (`\\.\pipe\`), sockets réseau locaux.
3. Analyser les permissions de ces IPC (`ls -la /var/run/*.socket`).
4. Tester l'envoi de commandes sans authentification.
5. Si le helper accepte des commandes sans vérifier l'identité du connecteur → exécution de code avec les privilèges du helper.

**Exemple concret (CCleaner pattern)** :
```bash
# Identifier les sockets Unix avec permissions faibles
find /var/run -name "*.socket" -perm /0006 2>/dev/null
# Tenter une connexion
nc -U /var/run/com.piriform.ccleaner.CCleanerAgent.socket
```

**Outil de référence** : GTFOBins pour les binaires Unix avec fonctionnalités cachées exploitables — chaque binaire listé peut être utilisé pour lire des fichiers, spawner des shells, ou escalader des privilèges dans des contextes particuliers (sudo, SUID, capabilities).

---

## Table des outils et leurs faiblesses

| Outil | OS | Faiblesse | Impact offensif | Source |
|---|---|---|---|---|
| UFW | Linux | Docker bypass iptables direct | Faux sentiment de sécurité | Documenté UFW |
| LuLu | macOS | Bypass via binaire whitelisté (ksfetch) | Exfiltration C2 | Null Byte writeup |
| Sysmon | Windows | CVE-2023-29343 EoP → SYSTEM | Élévation privilèges | NVD |
| CrowdSec | Multi | Faux positifs pour DoS | Isolation victime | Design flaw |
| Fail2ban | Linux | IP rotation contourne les bans | Brute force illimité | Design flaw |
| AIDE/OSSEC | Linux | Reconstruire baseline post-compromise | Persistance invisible | Technique post-root |
| Suricata | Linux | Fragmentation, encoding, slow-rate | Évasion détection réseau | Research |
| Wazuh | Multi | Canal agent → manager pour exfiltration | Data exfiltration camouflée | Research |
| Lynis | Multi | Fournit cartographie faiblesses | Guide d'exploitation prêt | Design |
| Nuclei/Trivy | Multi | Reconnaissance offensive légitimisée | Intel gathering | Usage détourné |
| Malwarebytes | Windows | gRPC pipes (CVSS 9.8), symlink LPE | RCE, LPE | ZDI-CAN-22321 |
| Windows Defender | Windows | Defendnot (faux AV WSC) | Désactivation Defender | Mai 2025 |
| EDR (général) | Windows | BYOVD, EDRKillShifter | Neutralisation complète | Dark web |
| Hardentools | Windows | Restauration = rollback de toutes protections | Désactivation batch | Design |
| CrowdStrike | Windows | Channel File 291 (DoS systémique) | BSoD 8.5M machines | Juillet 2024 |

---

## Patterns Grep — Détecter les configurations vulnérables

```bash
# Trouver des sockets Unix world-accessible (pattern CCleaner)
find /var/run /tmp /var/tmp -name "*.socket" -perm /0006 2>/dev/null
find /var/run /tmp -name "*.sock" -perm /0006 2>/dev/null

# Identifier les named pipes Windows accessibles
# (PowerShell)
Get-ChildItem \\.\pipe\ | Where-Object Name -match "security|agent|helper|service"

# Détecter la présence de Docker avec UFW (config dangereuse)
which ufw && which docker && ufw status | grep "Status: active" && echo "POTENTIELLEMENT BYPASSABLE"

# Lister les binaires avec capabilities dangereuses (vecteur GTFOBins)
getcap -r / 2>/dev/null | grep -E "cap_sys_admin|cap_net_raw|cap_sys_ptrace|cap_dac_read"

# Trouver les binaires SUID (vecteur GTFOBins)
find / -perm -4000 -type f 2>/dev/null

# Identifier les services Sysmon (pour cibler CVE-2023-29343)
sc query Sysmon64 2>/dev/null || sc query Sysmon 2>/dev/null

# Détecter la présence de LuLu et son emplacement de config (macOS)
ls ~/Library/Application\ Support/com.objective-see.lulu/ 2>/dev/null

# Trouver la base AIDE et ses permissions
ls -la /var/lib/aide/aide.db* 2>/dev/null

# Identifier les processus de sécurité tournant en root (cibles BYOVD / helper abuse)
ps aux | grep -E "crowdstrike|sysmon|malwarebytes|wazuh|suricata" | grep root
```
