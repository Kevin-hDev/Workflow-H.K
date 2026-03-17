# Patterns de Chaines d'Attaque -- Adversary Simulation

## Reference pour le skill adversary-simulation
> **Applications cibles** : ChillShell (mobile SSH, dartssh2 + Flutter) et Chill (desktop bridge, Flutter + Go tsnet daemon)
> **Architecture** : Mobile (Android/iOS) -> Tailscale mesh -> Desktop Bridge -> PC cible via SSH
> **Sources** : CYBERSEC_MOBILE.md, CYBERSEC_DESKTOP.md (recherche fevrier 2026)

---

## TABLE DES MATIERES

1. [Chaines d'attaque cross-boundary (Mobile -> Reseau -> Desktop -> SSH)](#1--chaines-dattaque-cross-boundary)
2. [Chaines d'escalade de privileges](#2--chaines-descalade-de-privileges)
3. [Chaines de mouvement lateral (pivot)](#3--chaines-de-mouvement-lateral-pivot)
4. [Chaines d'exfiltration de donnees](#4--chaines-dexfiltration-de-donnees)
5. [Chaines d'attaque supply chain](#5--chaines-dattaque-supply-chain)
6. [Chaines d'attaque assistees par IA](#6--chaines-dattaque-assistees-par-ia)
7. [Chaines ingenierie sociale + technique](#7--chaines-ingenierie-sociale--technique)
8. [Chaines d'attaque reseau](#8--chaines-dattaque-reseau)
9. [Chaines d'attaque physique + technique](#9--chaines-dattaque-physique--technique)
10. [Templates generiques de construction de chaines](#10--templates-generiques-de-construction-de-chaines)
11. [Chaines d'attaque IA autonomes (2026)](#11--chaines-dattaque-ia-autonomes-2026)

---

## 1 -- Chaines d'attaque cross-boundary

### CHAIN-01 : Extraction de cle mobile -> compromission SSH complete

**Chemin** : Mobile -> Cle SSH -> Desktop -> PC cible

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Rooter le device | Magisk/Checkra1n ou exploit kernel | Mobile 4.3 |
| 2. Extraire la cle privee SSH | Acces /data/data/ ou hooks Frida sur flutter_secure_storage, ou dump RAM pendant utilisation par dartssh2 | Mobile 4.3 |
| 3. Obtenir l'adresse Tailscale du desktop | Reverse engineering de libapp.so (Blutter/reFlutter) pour extraire les constantes de connexion | Mobile 4.1 |
| 4. S'authentifier sur le serveur SSH du PC | Utiliser la cle volee via n'importe quel client SSH | Mobile 1.x |
| 5. Escalader les privileges sur le PC | Exploiter regreSSHion (CVE-2024-6387) ou configuration sshd faible | Mobile 1.4, Desktop 1.4 |

**Impact** : Acces root complet au PC cible. Persistence via ajout de cle SSH dans authorized_keys.

---

### CHAIN-02 : MITM Terrapin -> downgrade -> interception complete

**Chemin** : Reseau -> Transport SSH -> Session complete

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Se positionner en MITM | ARP spoofing sur LAN (ettercap/bettercap) ou Evil Twin WiFi | Desktop 5.1, Mobile 5.2 |
| 2. Exploiter Terrapin (CVE-2023-48795) | Tronquer les messages EXT_INFO pendant le key exchange -- possible si dartssh2 ne supporte pas Strict KEX (RFC 9308) | Mobile 1.5, Desktop 1.5 |
| 3. Imposer des algorithmes faibles | Forcer diffie-hellman-group1-sha1, ssh-rsa SHA1, arcfour via manipulation de la negociation | Mobile 1.8 |
| 4. Desactiver l'obscurcissement des frappes | Le message EXT_INFO supprime desactive le keystroke timing protection | Mobile 1.5 |
| 5. Capturer les frappes clavier | Analyse temporelle des paquets SSH pour reconstruire les commandes tapees | Mobile 1.10, Mobile 5.4 |

**Impact** : Reconstruction des mots de passe et commandes via analyse temporelle. Possibilite de decrypter la session si algorithmes suffisamment faibles.

---

### CHAIN-03 : Compromission Tailscale -> injection dans le mesh -> acces SSH

**Chemin** : Tailscale -> Mesh VPN -> Desktop -> SSH

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Exploiter le bypass Tailnet Lock (TS-2025-008) | Si le daemon tourne sans --statedir, les verifications de signature TKA sont ignorees | Mobile 2.2, Desktop 2.2 |
| 2. Enregistrer un noeud malveillant | Utiliser une cle d'auth one-off via race condition TOCTOU (TS-2025-007) | Mobile 2.3 |
| 3. Contourner les ACLs | Exploiter TS-2025-006 -- les filtres de protocole ne s'appliquent pas sur les subnet routers partages | Mobile 2.4 |
| 4. Atteindre le port SSH du desktop | Le noeud malveillant est maintenant dans le tailnet avec acces au service SSH | Desktop 2.6 |
| 5. Attaquer le serveur SSH | Brute force, exploit dartssh2, ou utilisation de credentials volees | Desktop 1.x |

**Impact** : Acces non autorise au PC via le mesh VPN, contournant toutes les protections reseau.

---

### CHAIN-04 : DNS Rebinding Tailscale -> RCE desktop (Windows)

**Chemin** : Web -> API locale Tailscale -> Desktop Windows -> SSH

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Attirer l'utilisateur sur un site malveillant | Phishing ou publicite malveillante | Mobile 14.1 |
| 2. Exploiter DNS Rebinding (GHSA-vqp6-rc3h-83cp) | L'API locale Tailscale sur Windows n'a pas de verification de l'en-tete Host sur le socket TCP | Mobile 2.7, Desktop 2.3 |
| 3. Changer le serveur de coordination | Le site force le client Tailscale a utiliser un serveur de coordination attaquant | Desktop 2.3 |
| 4. Distribuer des binaires malveillants | Le faux control plane pousse des mises a jour ou configurations compromises | Desktop 2.3 |
| 5. Prendre le controle du desktop | RCE via le VPN detourne | Desktop 2.3 |

**Impact** : RCE sur le desktop Windows via une simple visite de page web.

---

### CHAIN-05 : VerifyHostKeyDNS MITM -> capture session SSH complete

**Chemin** : DNS -> Verification d'hote SSH -> Session SSH

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Se positionner en MITM | WiFi Evil Twin ou ARP spoofing | Mobile 5.2, Desktop 5.1 |
| 2. Provoquer l'epuisement memoire (CVE-2025-26465) | Forcer SSH_ERR_ALLOC_FAIL dans sshkey_from_private() pendant la verification DNS SSHFP | Mobile 1.1, Desktop 1.1 |
| 3. Le client accepte la cle d'hote malveillante | Le contournement se fait sans alerte utilisateur -- dartssh2 potentiellement vulnerable si delegation DNS | Mobile 1.1 |
| 4. Intercepter toute la session | Capture des identifiants, injection de commandes, manipulation de fichiers | Mobile 1.1 |

**Impact** : Interception complete et transparente de la session SSH.

---

### CHAIN-06 : WOL Ryuk -> reveil massif -> deploiement ransomware

**Chemin** : Reseau local -> WOL -> Toutes les machines -> Ransomware

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Compromettre une machine sur le LAN | N'importe quel vecteur initial | Desktop 7.x |
| 2. Enumerer la table ARP | GetIpNetTable (Windows) pour lister toutes les MAC | Mobile 3.2, Desktop 3.2 |
| 3. Envoyer des WOL a toutes les machines | Magic Packets forges (aucune authentification requise) | Mobile 3.1 |
| 4. Attendre le reveil | Les machines se reveillent et exposent leurs services | Mobile 3.2 |
| 5. Deployer le ransomware | Via SMB/SSH sur toutes les machines reveillees | Mobile 3.2 |

**Impact** : Compromission de toutes les machines du reseau. Kill chain identique a l'architecture de ChillShell (wake -> connect -> execute).

---

## 2 -- Chaines d'escalade de privileges

### CHAIN-07 : regreSSHion -> acces root complet au PC

**Chemin** : Connexion SSH -> Race condition -> Root

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Identifier la version OpenSSH du serveur | Banner fingerprinting (trivial) | Mobile 1.9 |
| 2. Verifier la vulnerabilite (OpenSSH 8.5p1-9.7p1) | CVE-2024-6387 affecte ces versions | Mobile 1.4, Desktop 1.4 |
| 3. Exploiter la race condition SIGALRM | Milliers de tentatives avec timing precis pendant la phase d'authentification | Mobile 1.4 |
| 4. Obtenir un shell root | Execution de code en tant que root sur le serveur SSH | Mobile 1.4 |

**Impact** : Acces root complet au PC cible.

---

### CHAIN-08 : tssentineld macOS -> root local

**Chemin** : Tailscale macOS -> Injection de commande -> Root

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Identifier Tailscale macOS < 1.94.0 | Verifier la version installee | Mobile 2.1, Desktop 2.1 |
| 2. Exploiter l'injection dans tssentineld (TS-2026-001) | Le service root utilise NSTask avec /bin/sh -c sudo -u [username] -- substitution de chaine non securisee | Mobile 2.1 |
| 3. Injecter des commandes shell | Injection dans le champ username pour escalader en root | Mobile 2.1 |

**Impact** : Escalade de privileges root locale sur macOS.

---

### CHAIN-09 : ProxyCommand RCE -> controle du PC

**Chemin** : Input utilisateur SSH -> Shell systeme -> RCE

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Identifier l'utilisation de ProxyCommand | Analyser la configuration SSH du client | Mobile 1.3 |
| 2. Injecter des caracteres de controle dans le username (CVE-2025-61984) | Caracteres interpretes par Bash, fish, csh | Mobile 1.3, Desktop 1.3 |
| 3. Le shell systeme execute le code injecte | L'expansion des sequences dans ProxyCommand provoque l'execution de code arbitraire | Mobile 1.3 |

**Impact** : Prise de controle totale du PC cible avec les privileges du service bridge. CVSS 8.1.

---

### CHAIN-10 : Chaine Windows DWM + LSASS -> SYSTEM

**Chemin** : Desktop Window Manager -> ASLR bypass -> LSASS RCE -> SYSTEM

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Exploiter CVE-2026-20805 (DWM) | Fuite d'adresses memoire ALPC qui casse ASLR -- exploite activement | Desktop 7.5 |
| 2. Utiliser les adresses pour cibler LSASS | CVE-2026-20854 -- Use-After-Free dans LSASS permettant RCE via reseau | Desktop 7.5 |
| 3. Extraire les hashes NTLM | LSASS compromis expose les credentials | Desktop 7.5 |
| 4. Escalader vers SYSTEM | CVE-2026-20822 -- Graphics Component Use-After-Free pour privileges SYSTEM | Desktop 7.5 |

**Impact** : Compromission totale du poste Windows. Exploites activement (janvier 2026).

---

### CHAIN-11 : VBS Enclave + Secure Boot bypass -> persistence firmware

**Chemin** : VBS Buffer Overflow -> Virtual Trust Level 2 -> Secure Boot bypass

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Exploiter CVE-2026-20876 (VBS Enclave) | Buffer Overflow donnant acces au Virtual Trust Level 2 | Desktop 7.5 |
| 2. Contourner Secure Boot (CVE-2026-21265) | Expiration de certificat permettant le bypass | Desktop 7.5 |
| 3. Installer un rootkit firmware | Persistence survivant aux reinstallations OS | Desktop 7.5 |

**Impact** : Persistence au niveau firmware, indetectable par l'OS.

---

## 3 -- Chaines de mouvement lateral (pivot)

### CHAIN-12 : Desktop bridge comme pivot LAN

**Chemin** : Mobile compromis -> Desktop bridge -> LAN entier

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Compromettre le mobile | Tout vecteur (root, malware, vol physique) | Mobile 4.x |
| 2. Exploiter la confiance mutuelle mobile <-> desktop | Le desktop fait "confiance absolue" au mobile une fois authentifie | Mobile 7.2, Desktop 7.2 |
| 3. Activer SSH Tunneling via dartssh2 | Si le tunneling n'est pas desactive, creer un tunnel inverse | Desktop 1.11 |
| 4. Utiliser SSH Agent Forwarding | Si actif, l'agent de l'utilisateur est reutilisable pour se connecter a d'autres machines | Desktop 1.10 |
| 5. Rebondir vers d'autres serveurs du LAN | Le desktop bridge devient un pivot pour toute l'infrastructure | Desktop 7.2 |

**Impact** : Compromission laterale de toute l'infrastructure reseau accessible depuis le desktop.

---

### CHAIN-13 : WOL + SSH -> compromission de toutes les machines dormantes

**Chemin** : WOL -> Reveil -> SSH -> Propagation

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Lister les MAC du reseau | Table ARP, scan reseau | Mobile 3.2 |
| 2. Envoyer des WOL broadcast | Magic Packets sans authentification (UDP port 7/9) | Mobile 3.1 |
| 3. Se connecter en SSH sur chaque machine reveillee | Utiliser les cles volees ou des credentials par defaut | Desktop 1.x |
| 4. Propager l'acces | Installer des backdoors ou pivots sur chaque machine | Desktop 7.2 |

**Impact** : Toutes les machines du reseau compromises, meme celles qui etaient eteintes.

---

### CHAIN-14 : Tailscale exit node malveillant -> interception totale

**Chemin** : Exit node malveillant -> Route trafic Internet -> Interception

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Inserer un noeud malveillant dans le tailnet | Via Tailnet Lock bypass (TS-2025-008) ou cle d'auth TOCTOU (TS-2025-007) | Mobile 2.2, 2.3 |
| 2. Configurer le noeud comme exit node | Le noeud propose de router tout le trafic Internet | Mobile 2.9 |
| 3. L'utilisateur utilise l'exit node | Tout le trafic Internet du device passe par l'attaquant | Mobile 2.9 |
| 4. Intercepter le trafic non-SSH | Emails, navigation, APIs -- tout ce qui n'est pas dans le tunnel SSH | Mobile 2.9 |

**Impact** : Interception de tout le trafic Internet du device.

---

## 4 -- Chaines d'exfiltration de donnees

### CHAIN-15 : RAM dump -> extraction de cles -> acces permanent

**Chemin** : Memoire du device -> Cles en clair -> Acces SSH persistant

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Attacher un debugger (gdbserver ou Frida) | Sur device roote ou via exploit kernel | Mobile 4.8 |
| 2. Dumper le heap Dart | Le GC Dart copie les objets (dont les cles privees) dans differentes zones -- les String persistent indefiniment | Mobile 4.8 |
| 3. Rechercher les motifs de cles privees | Headers RSA/Ed25519 dans le dump memoire | Mobile 4.8 |
| 4. Extraire les cles SSH | La cle apparait en clair dans la RAM au moment de l'utilisation par dartssh2 | Mobile 4.3, 4.8 |
| 5. Utiliser les cles pour un acces permanent | Se connecter au PC cible depuis n'importe ou | Mobile 4.3 |

**Impact** : Acces SSH permanent, meme apres changement de mot de passe utilisateur.

---

### CHAIN-16 : Reverse engineering -> extraction de secrets -> compromission

**Chemin** : APK/binaire -> Analyse statique -> Secrets

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Extraire libapp.so + libflutter.so | Depuis l'APK (mobile) ou directement sur le filesystem (desktop -- PLUS FACILE) | Mobile 4.1, Desktop 4.5 |
| 2. Analyser avec Blutter/reFlutter/unflutter | Extraction de noms de classes, signatures de methodes, chaines constantes | Mobile 4.1 |
| 3. Identifier les routines de chiffrement | References a encrypt_AES___paddedParams, package:pointycastle | Mobile 4.1 |
| 4. Extraire les secrets et la logique de validation | Cles SSH, tokens Tailscale, logique d'authentification | Mobile 4.1 |
| 5. Contourner les protections | Utiliser les secrets et la comprehension de la logique pour acceder au systeme | Mobile 4.1, 4.2 |

**Impact** : Extraction de tous les secrets de l'application.

---

### CHAIN-17 : Clipboard -> Backup cloud -> extraction a distance

**Chemin** : Clipboard -> Backup -> Compte cloud -> Extraction

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Observer l'utilisateur copier une cle/mot de passe | Le clipboard est accessible par toutes les apps (surtout avant Android 13) | Mobile 4.9 |
| 2. La cle se retrouve dans les backups | Si android:allowBackup="true" ou backup iCloud actif | Mobile 4.11 |
| 3. Compromettre le compte cloud | Phishing du compte Google/Apple | Mobile 14.1 |
| 4. Extraire les cles depuis le backup | Les cles flutter_secure_storage peuvent etre dans le backup | Mobile 4.11 |

**Impact** : Extraction de cles SSH a distance via le cloud, sans acces physique au device.

---

### CHAIN-18 : Platform Channels interception -> vol de donnees en transit

**Chemin** : Frida -> Platform Channels -> Donnees sensibles

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Injecter Frida sur un device roote | Instrumenter la communication Dart <-> natif | Mobile 4.4 |
| 2. Intercepter les Platform Channels | Capturer les messages : commandes SSH, cles, tokens biometriques | Mobile 4.4 |
| 3. Modifier les messages en transit | Alterer les commandes envoyees au serveur SSH | Mobile 4.4 |
| 4. Exfiltrer les donnees capturees | Envoyer les cles et tokens vers un serveur attaquant | Mobile 4.4 |

**Impact** : Vol de toutes les donnees transitant entre Dart et la couche native, en temps reel.

---

## 5 -- Chaines d'attaque supply chain

### CHAIN-19 : Worm Shai-Hulud -> contamination pub.dev -> compromission de l'app

**Chemin** : npm/pub.dev -> Packages -> Build -> App compromise

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Compromettre un maintainer de package | Vol de NPM_TOKEN, AWS creds via scripts postinstall malveillants | Mobile 7.3, Desktop 7.6 |
| 2. Re-publier tous les packages du maintainer | Contamination exponentielle -- chaque package infecte propage le worm | Mobile 7.3 |
| 3. Version V3 : payloads polymorphes generes par IA | Chaque instance est unique, les signatures sont inutiles | Mobile 7.3 |
| 4. L'app ChillShell/Chill integre le package compromis | La mise a jour pub.dev tire le package infecte | Mobile 7.3 |
| 5. L'app compromise exfiltre les cles SSH | Le code malveillant dans la dependance accede a flutter_secure_storage | Mobile 7.3 |

**Impact** : Compromission silencieuse de l'app via la supply chain, affectant tous les utilisateurs.

---

### CHAIN-20 : Typosquatting pub.dev -> dependency confusion

**Chemin** : Package malveillant -> pub.dev -> Build

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Creer des packages typosquattes | dartssh3, flutter_securre_storage, etc. | Mobile 7.3 |
| 2. pub.dev n'a PAS d'audit automatique | Contrairement a npm, pas de verification de securite | Mobile 7.3 |
| 3. Un dev fait une typo dans pubspec.yaml | Ou dependency confusion avec un registry interne | Mobile 7.3 |
| 4. Le package malveillant est integre | Code backdoor dans la dependance | Mobile 7.3 |

**Impact** : Insertion de code malveillant dans le build de l'application.

---

### CHAIN-21 : GitHub Actions compromise -> injection dans le CI/CD

**Chemin** : GitHub Action -> CI/CD -> Build -> Binaire compromis

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Compromettre une action populaire (CVE-2025-30066, tj-actions/changed-files) | L'action modifiee exfiltre les secrets du workflow | Desktop 7.6 |
| 2. Voler les secrets CI/CD | Tokens de publication, cles de signature | Desktop 7.6 |
| 3. Modifier le pipeline de build | Injecter du code dans le processus de compilation | Desktop 7.6 |
| 4. Publier un binaire compromis | L'utilisateur installe une version backdooree | Desktop 7.6 |

**Impact** : Distribution de binaires compromis a tous les utilisateurs.

---

### CHAIN-22 : Extension IDE "Purchase and Poison" -> code vulnerable

**Chemin** : Extension VS Code -> Suggestions de code -> Vulnerabilites

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Racheter une extension VS Code populaire | "Purchase and Poison" -- l'acheteur est malveillant | Mobile 6.6, Desktop 6.5 |
| 2. L'extension surveille le dev | Acces au code source, aux commandes, au contexte | Mobile 6.6 |
| 3. Modifier les suggestions de l'assistant IA | Imperceptiblement inclure des dependances malveillantes | Mobile 6.6 |
| 4. Le dev integre du code vulnerable | Code avec injections, secrets en dur, dependances compromises | Mobile 6.6 |

**Impact** : Insertion de vulnerabilites directement dans le code source par le dev lui-meme.

---

### CHAIN-23 : Prompt Injection dans les dependances -> code vulnerable via LLM

**Chemin** : README/CHANGELOG malveillant -> LLM assistant -> Code vulnerable

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Cacher des instructions malveillantes dans un README | Dans les packages pub.dev utilises par l'app | Mobile 6.5 |
| 2. Le dev utilise Claude Code/Copilot | L'assistant IA lit le README et suit les instructions malveillantes | Mobile 6.5 |
| 3. L'IA insere du code vulnerable | References a des packages inexistants (20% du code genere par IA), injections, secrets en dur | Mobile 6.5 |
| 4. Le dev ne detecte pas la vulnerabilite | Code revue insuffisante | Mobile 6.5 |

**Impact** : Code source de l'app contamine via l'assistant IA du developpeur.

---

## 6 -- Chaines d'attaque assistees par IA

### CHAIN-24 : PROMPTFLUX -> malware polymorphe -> evasion totale

**Chemin** : Dropper -> API LLM -> Mutation horaire -> Evasion

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Deployer le dropper VBScript | Via phishing ou exploitation initiale | Mobile 6.1, Desktop 6.1 |
| 2. Le dropper contacte l'API Gemini | Communication reguliere pour obtenir des mutations | Mobile 6.1 |
| 3. Mutation horaire du malware | Chaque instance a un hash unique -- toutes les signatures sont obsoletes | Mobile 6.1 |
| 4. Logs dans %TEMP%/thinking_robot_log.txt | Le malware s'auto-documente pour ses propres analyses | Mobile 6.1 |
| 5. Evasion totale des antivirus classiques | Aucune signature stable a detecter | Mobile 6.1 |

**Impact** : Malware indetectable par les methodes traditionnelles, mutant toutes les heures.

---

### CHAIN-25 : AI Fuzzing -> zero-day dartssh2 -> exploit automatise

**Chemin** : LLM -> Fuzzing intelligent -> Zero-day -> Exploit

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Analyser le code source de dartssh2 avec un LLM | TitanFuzz, FuzzGPT, ChatAFL, Xbow | Mobile 6.3, Desktop 6.3 |
| 2. Identifier les transitions d'etat complexes | Edge cases dans le handshake SSH ou SFTP | Mobile 6.3 |
| 3. Generer des payloads de fuzzing cibles | Inputs conscients du protocole SSH | Mobile 6.3 |
| 4. Decouvrir un zero-day | Xbow surpasse les chercheurs humains sur les plateformes de bug bounty | Mobile 6.3 |
| 5. Transformer en exploit en minutes | Weaponisation automatisee du zero-day | Mobile 6.3 |

**Impact** : Zero-days dans dartssh2 decouverts et exploites automatiquement. Particulierement dangereux car dartssh2 n'a AUCUN audit de securite.

---

### CHAIN-26 : PROMPTSTEAL + contexte machine -> exfiltration ciblee

**Chemin** : LLM Qwen2.5-Coder -> Commandes adaptees -> Exfiltration

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. PROMPTSTEAL (LAMEHUG) s'installe sur le PC | Via session SSH compromise | Mobile 6.2, Desktop 6.2 |
| 2. Qwen2.5-Coder analyse le contexte de la machine | Synthese de commandes Windows one-liner adaptees | Mobile 6.2 |
| 3. Recolte de documents a la demande | Commandes sur mesure pour chaque cible | Mobile 6.2 |
| 4. Exfiltration adaptative | Acteurs de niveau intermediaire deploient des charges adaptatives | Mobile 6.2 |

**Impact** : Exfiltration intelligente et ciblee, adaptee a chaque machine compromises.

---

### CHAIN-27 : Deepfake biometrie -> bypass local_auth -> acces SSH

**Chemin** : IA generative -> Deepfake -> Biometrie contournee -> Acces

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Creer un masque 3D ou video deepfake | IA generative haute fidelite | Mobile 6.4 |
| 2. Tromper FaceID/TouchID | Le deepfake contourne la biometrie locale (local_auth) | Mobile 6.4 |
| 3. Deverrouiller l'acces SSH dans l'app | La biometrie est la seule barriere avant la connexion | Mobile 6.4 |
| 4. Executer des commandes sur le PC | Acces complet au PC via SSH | Mobile 6.4 |

**Impact** : Contournement de la biometrie par IA generative, ouvrant l'acces a tout le systeme.

---

### CHAIN-28 : LLM-Assisted Reverse Engineering desktop -> exploitation rapide

**Chemin** : Binaire desktop -> LLM -> Comprehension -> Exploit

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Extraire libapp.so du desktop | Plus facile que mobile -- binaire directement sur le filesystem, pas dans un APK | Desktop 6.4 |
| 2. Soumettre a ChatGPT/Claude/Gemini | Analyse du code assembleur extraite | Desktop 6.4 |
| 3. Le LLM reconstruit la logique | Identification des fonctions de securite, des validations, des secrets | Desktop 6.4 |
| 4. Generer un exploit sur mesure | L'attaquant cree un exploit base sur la comprehension du LLM | Desktop 6.4 |

**Impact** : Reverse engineering accelere par IA, rendant l'analyse de l'app desktop triviale.

---

## 7 -- Chaines ingenierie sociale + technique

### CHAIN-29 : Phishing -> QR code malveillant -> redirection SSH

**Chemin** : Email phishing -> QR code -> Serveur SSH piege

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Envoyer un faux email "Session SSH expiree" | Phishing cible les utilisateurs de remote desktop | Mobile 14.1 |
| 2. L'email contient un QR code "de reconfiguration" | Deep link ou QR malveillant | Mobile 4.12 |
| 3. L'utilisateur scanne le QR | L'app configure automatiquement une connexion vers le serveur SSH de l'attaquant | Mobile 4.12 |
| 4. L'utilisateur se connecte au faux serveur | Toutes les frappes clavier et commandes sont capturees | Mobile 4.12 |

**Impact** : Capture de tous les credentials et commandes de l'utilisateur.

---

### CHAIN-30 : Shoulder surfing -> accès physique -> extraction complete

**Chemin** : Observation -> PIN -> Device -> Cles SSH

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Observer le PIN/pattern dans un lieu public | Cafe, transport, open space | Mobile 14.2, Desktop 15.1 |
| 2. Obtenir un acces physique temporaire | "Je peux emprunter ton telephone ?" -- 5 minutes suffisent | Mobile 14.3 |
| 3. Desactiver les protections | Avec le PIN, acceder aux parametres de securite | Mobile 14.3 |
| 4. Extraire les cles SSH | Copier, exfiltrer ou envoyer les cles par email | Mobile 4.3 |
| 5. Utiliser les cles pour un acces permanent | Se connecter au PC cible depuis n'importe ou | Mobile 4.3 |

**Impact** : Acces permanent au PC cible via des cles SSH volees physiquement.

---

### CHAIN-31 : Insider Threat -> acces physique regulier -> compromission progressive

**Chemin** : Personne de confiance -> Acces regulier -> Compromission

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Conjoint(e), colocataire ou collegue connait le PIN | Acces physique regulier et connaissance des habitudes | Mobile 14.4, Desktop 15.3 |
| 2. Installer un certificat root sur le device | Permet l'interception HTTPS via proxy | Mobile 4.2 |
| 3. Installer un keylogger | Capture de tous les mots de passe et commandes | Desktop 15.3 |
| 4. Capturer les sessions SSH au fil du temps | Acces progressif a de plus en plus de donnees | Desktop 15.3 |

**Impact** : Compromission progressive et silencieuse par une personne de l'entourage.

---

### CHAIN-32 : Evil Maid -> boot USB -> extraction de donnees desktop

**Chemin** : Acces physique PC eteint -> Boot USB -> Extraction

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Acceder physiquement au PC eteint | Hotel, bureau ouvert, domicile | Desktop 15.4 |
| 2. Boot sur USB live | Contourner l'OS installe | Desktop 15.4 |
| 3. Extraire ~/.ssh/ et les configs de l'app | Toutes les cles SSH de l'utilisateur | Desktop 4.1, 15.4 |
| 4. Installer un backdoor | Rootkit ou modification du bootloader | Desktop 15.4 |
| 5. L'utilisateur ne detecte rien | Le PC redemarre normalement | Desktop 15.4 |

**Impact** : Vol de cles SSH et installation de backdoor persistant, sans trace visible.

---

### CHAIN-33 : Pretexting support technique -> reset de securite

**Chemin** : Ingenierie sociale -> Support -> Reset -> Acces

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. L'attaquant se fait passer pour un utilisateur | Contact du support technique / developpeur | Mobile 14.5, Desktop 15.5 |
| 2. Obtenir des informations sur l'architecture | Details de config, versions, endpoints | Mobile 14.5 |
| 3. Demander un reset de securite | Reset du PIN, regeneration de cle, reset biometrique | Mobile 14.5 |
| 4. Utiliser les nouvelles credentials | Acces au systeme avec les credentials fournies par le support | Mobile 14.5 |

**Impact** : Contournement de toutes les protections techniques via manipulation humaine.

---

## 8 -- Chaines d'attaque reseau

### CHAIN-34 : IMSI Catcher -> downgrade 2G -> interception pre-Tailscale

**Chemin** : Fausse station de base -> 2G -> Interception

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Deployer un IMSI Catcher (Sni5Gect pour 5G) | Simulation de station de base legitime | Mobile 5.1 |
| 2. Forcer le retrogradage vers 2G/GSM | Chiffrement inexistant sur 2G | Mobile 5.1 |
| 3. Intercepter le trafic AVANT Tailscale | Le tunnel n'est pas encore etabli -- tout est en clair | Mobile 5.1 |
| 4. Capturer les tokens d'authentification Tailscale | Acces au mesh VPN | Mobile 5.1 |

**Impact** : Interception du trafic mobile avant l'etablissement du tunnel chiffre. Attaque de type nation-state.

---

### CHAIN-35 : Evil Twin WiFi -> interception -> MITM SSH

**Chemin** : Faux AP -> Connexion auto -> MITM

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Creer un faux point d'acces WiFi | Imiter un reseau connu (hostapd, airgeddon, Fluxion) | Mobile 5.2, Desktop 5.6 |
| 2. Le device se connecte automatiquement | KARMA repond a TOUTES les requetes probe | Mobile 5.2 |
| 3. Intercepter le trafic initial (avant Tailscale) | Tout le trafic pre-tunnel est expose | Mobile 5.2 |
| 4. Exploiter Terrapin ou VerifyHostKeyDNS MITM | Attaquer la session SSH via les CVEs SSH | Mobile 1.1, 1.5 |

**Impact** : Position MITM permettant l'exploitation de toutes les vulnerabilites SSH.

---

### CHAIN-36 : ARP Spoofing LAN -> contournement Tailscale -> interception SSH

**Chemin** : LAN -> ARP Poisoning -> MITM -> SSH

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. ARP Spoofing sur le reseau local | arpspoof, ettercap, bettercap | Desktop 5.1 |
| 2. Rediriger le trafic entre desktop et PC | Position MITM sur le LAN | Desktop 5.1 |
| 3. Si fallback LAN direct (hors Tailscale) | Tout le trafic SSH est expose | Desktop 5.1 |
| 4. Exploiter avec ssh-mitm | Outil de hijacking de session SSH | Desktop 7.3 |

**Impact** : Interception complete du trafic SSH sur le reseau local si Tailscale est contourne.

---

### CHAIN-37 : LLMNR/NBT-NS Poisoning -> vol hashes NTLM -> acces Windows

**Chemin** : Resolution de noms Windows -> Hashes -> Acces

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Empoisonner LLMNR/NBT-NS | Responder, Inveigh | Desktop 5.3 |
| 2. Capturer les hashes NTLMv2 | Le PC Windows envoie ses credentials au faux serveur | Desktop 5.3 |
| 3. Cracker les hashes hors-ligne | hashcat, john the ripper | Desktop 5.3 |
| 4. Utiliser les credentials | Acces a la session Windows, puis a l'app desktop Chill | Desktop 5.3 |

**Impact** : Acces aux credentials Windows et donc a l'application desktop.

---

### CHAIN-38 : Rogue DHCP -> redirection avant Tailscale -> MITM

**Chemin** : DHCP malveillant -> Routes fausses -> Interception

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Deployer un faux serveur DHCP sur le LAN | Distribution de fausses routes reseau | Desktop 5.4 |
| 2. Rediriger le trafic avant encapsulation Tailscale | Si les routes Tailscale sont manipulees via DHCP | Desktop 5.4 |
| 3. Intercepter le trafic | Le tunnel WireGuard n'encapsule pas si les routes sont detournees | Desktop 5.4 |

**Impact** : Contournement de la protection Tailscale au niveau routage.

---

### CHAIN-39 : MagicDNS Spoofing -> redirection intra-tailnet

**Chemin** : MagicDNS -> Spoofing -> Faux serveur SSH

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Compromettre un noeud du tailnet | Via Tailnet Lock bypass ou autre | Mobile 2.2 |
| 2. Spoofer les reponses MagicDNS | MagicDNS peut etre victime de spoofing intra-tailnet | Mobile 2.9 |
| 3. Rediriger le mobile vers un faux desktop | Le mobile se connecte au serveur SSH de l'attaquant | Mobile 2.9 |
| 4. Capturer les credentials | Le faux serveur enregistre tout | Mobile 2.9 |

**Impact** : Redirection transparente des connexions SSH au sein du tailnet.

---

## 9 -- Chaines d'attaque physique + technique

### CHAIN-40 : Juice Jacking / ChoiceJacking -> extraction via USB

**Chemin** : Borne de charge -> USB -> Acces complet

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Borne de charge publique ou cable piege (O.MG Cable, USBHarpoon) | L'utilisateur branche son telephone | Mobile 7.4 |
| 2. ChoiceJacking (2025) simule des entrees tactiles | Le chargeur malveillant approuve la connexion de donnees | Mobile 7.4 |
| 3. Si ADB active, acces complet | Extraction de donnees, installation de malware | Mobile 7.4 |
| 4. Extraire les donnees flutter_secure_storage | Cles SSH, tokens, configurations | Mobile 7.4, 4.3 |

**Impact** : Extraction de toutes les donnees sensibles via une simple charge USB.

---

### CHAIN-41 : flutter_pty comme vecteur d'escalade

**Chemin** : App compromise -> flutter_pty -> Shell Android -> Escalade

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Prendre le controle de l'app | Via n'importe quel vecteur (injection, MITM, malware) | Mobile 4.x |
| 2. Abuser flutter_pty | Acces a un shell Android NATIF depuis l'app Flutter | Mobile 4.5 |
| 3. Executer des commandes systeme arbitraires | Acces au filesystem de l'app (SharedPreferences, databases) | Mobile 4.5 |
| 4. Escalader les privileges | Exploits kernel Android, root | Mobile 4.5 |
| 5. Extraire toutes les donnees | Cles SSH, tokens, configuration de l'app | Mobile 4.5 |

**Impact** : flutter_pty est un vecteur d'escalade direct depuis l'app vers le systeme Android.

---

### CHAIN-42 : Bluetooth/NFC adjacente -> infection -> acces SSH

**Chemin** : Bluetooth/NFC -> Exploit -> App -> SSH

| Etape | Technique | Source |
|-------|-----------|--------|
| 1. Exploiter une vulnerabilite Bluetooth (BlueBorne, BLE relay) | Attaque a proximite physique | Mobile 7.5 |
| 2. Obtenir une execution de code sur le device | Via le vecteur BT/NFC | Mobile 7.5 |
| 3. Acceder a l'app ChillShell | Extraire les donnees ou injecter du code | Mobile 7.5, 4.x |
| 4. Se connecter au PC via SSH | Utiliser les credentials volees | Mobile 1.x |

**Impact** : Compromission du device et acces SSH via une attaque de proximite sans fil.

---

## 10 -- Templates generiques de construction de chaines

### TEMPLATE A : Compromission initiale -> Extraction de secrets -> Acces permanent

```
[Vecteur initial] -> [Extraction de cle/token] -> [Utilisation du secret] -> [Persistence]

Vecteurs initiaux possibles :
- Root/jailbreak du device (Mobile 4.3)
- DLL Injection sur le desktop (Desktop 4.2)
- LD_PRELOAD sur Linux (Desktop 4.3)
- Supply chain compromise (Mobile 7.3)
- Acces physique (Mobile 14.3, Desktop 15.4)
- Evil Twin WiFi (Mobile 5.2)
- MITM Terrapin (Mobile 1.5)

Extraction possible de :
- Cles SSH privees (flutter_secure_storage, ~/.ssh/)
- Tokens Tailscale
- Credentials utilisateur
- Configuration SSH (sshd_config)
- Hashes NTLM (Windows)

Utilisation :
- Connexion SSH directe
- Injection dans le tailnet
- Pivot vers le LAN
- Configuration malveillante de l'OS

Persistence :
- Ajout de cle dans authorized_keys
- Rootkit firmware (CVE-2026-20876 + CVE-2026-21265)
- Modification de sshd_config
- Backdoor dans le binaire de l'app
```

---

### TEMPLATE B : Position reseau -> Degradation de securite -> Interception

```
[Position reseau] -> [Degradation] -> [Interception] -> [Exploitation]

Positions reseau possibles :
- ARP Spoofing LAN (Desktop 5.1)
- Evil Twin WiFi (Mobile 5.2)
- IMSI Catcher (Mobile 5.1)
- Rogue DHCP (Desktop 5.4)
- Noeud Tailscale malveillant (Mobile 2.2)

Degradations possibles :
- Terrapin : suppression EXT_INFO (Mobile 1.5)
- SSH Protocol Downgrade (Mobile 1.8)
- WPA3 -> WPA2 Dragonblood (Mobile 5.3)
- 5G -> 2G (Mobile 5.1)
- VerifyHostKeyDNS MITM (Mobile 1.1)

Interception :
- Capture de session SSH complete
- Reconstruction de frappes clavier (Mobile 1.10, 5.4)
- Vol de credentials en transit
- Injection de commandes

Exploitation :
- Execution de commandes sur le PC
- Exfiltration de donnees
- Installation de backdoor
```

---

### TEMPLATE C : IA offensive -> Decouverte/Mutation -> Exploitation automatisee

```
[Outil IA] -> [Capacite] -> [Resultat] -> [Impact]

Outils IA offensifs :
- PROMPTFLUX : Mutation horaire de malware via Gemini (Mobile 6.1)
- PROMPTSTEAL/LAMEHUG : Commandes adaptatives via Qwen2.5-Coder (Mobile 6.2)
- TitanFuzz/FuzzGPT/ChatAFL/Xbow : Fuzzing intelligent (Mobile 6.3)
- Deepfake generation : Bypass biometrique (Mobile 6.4)
- LLM-Assisted RE : Reverse engineering accelere (Desktop 6.4)

Capacites :
- Polymorphisme : evasion de toutes les signatures (Mobile 6.1)
- Adaptation contextuelle : charges sur mesure (Mobile 6.2)
- Fuzzing protocole : decouverte de zero-days (Mobile 6.3)
- Generation de media : bypass capteurs (Mobile 6.4)
- Comprehension de code : analyse automatisee (Desktop 6.4)

Resultats :
- Zero-days dans dartssh2 (Mobile 6.3)
- Malware indetectable (Mobile 6.1)
- Bypass biometrique (Mobile 6.4)
- Exploitation ciblee (Mobile 6.2)

Impact :
- dartssh2 n'a AUCUN audit de securite (Mobile 1.7)
- Le desktop expose un service SSH = cible directe (Desktop 6.3)
- Les protections classiques sont insuffisantes
```

---

### TEMPLATE D : Ingenierie sociale -> Acces technique -> Compromission

```
[Vecteur social] -> [Acces obtenu] -> [Technique d'exploitation] -> [Impact]

Vecteurs sociaux :
- Phishing cible (Mobile 14.1)
- QR code malveillant (Mobile 4.12)
- Shoulder surfing PIN (Mobile 14.2)
- Acces physique temporaire (Mobile 14.3)
- Insider threat (Mobile 14.4)
- Pretexting support (Mobile 14.5)
- Evil Maid (Desktop 15.4)

Acces obtenus :
- PIN/pattern du device
- Acces physique temporaire
- Acces physique au PC eteint
- Informations d'architecture
- Reset de securite

Techniques d'exploitation :
- Extraction flutter_secure_storage (Mobile 4.3)
- Installation de certificat root (Mobile 4.2)
- Boot USB live (Desktop 15.4)
- Modification de sshd_config (Desktop 4.6)
- ADB si active (Mobile 7.4)

Impact :
- Vol de cles SSH
- Acces permanent au PC
- Backdoor installe
- Surveillance silencieuse
```

---

### TEMPLATE E : Service persistant -> Surface d'attaque permanente

```
[Service en arriere-plan] -> [Vecteur d'attaque] -> [Exploitation]

Services persistants dans l'architecture :
- flutter_foreground_task : SSH en foreground permanent (Mobile 4.6)
  -> IPC Android : autre app/malware peut interagir
  -> Fuite memoire : cles SSH exposees au fil du temps
  -> Drain batterie = indicateur d'attaque
  -> Timeout absent = session eternelle

- Desktop bridge SSH : service SSH permanent (Desktop 1.9, 4.1)
  -> Pas de sandbox : acces filesystem complet
  -> ~/.ssh/ accessible
  -> Tous les credentials WiFi, tokens, keystores accessibles

- Tailscale daemon : tunnel VPN permanent
  -> API locale exploitable (Desktop 2.3)
  -> Variables d'environnement lisibles (GHSA-qccm-wmcq-pwr6)
  -> Sans --statedir : Tailnet Lock bypass (Desktop 2.2)

Exploitation :
- Le service est TOUJOURS disponible pour l'attaquant
- Pas besoin d'attendre une action de l'utilisateur
- Surface d'attaque 24/7
```

---

### TEMPLATE F : Configuration manipulation -> affaiblissement OS -> exploitation

```
[Interception de config] -> [Modification] -> [Exploitation post-config]

L'app desktop configure l'OS (Desktop 4.6, 7.1) :
- sshd_config : PermitRootLogin, PasswordAuthentication, AuthorizedKeys
- Firewall : iptables/nftables, Windows Firewall, pf
- WOL : BIOS/UEFI settings
- Fast boot : parametres de demarrage

Si l'attaquant intercepte les commandes de configuration :
1. Activer PermitRootLogin yes
2. Ajouter sa cle publique dans authorized_keys
3. Desactiver le pare-feu ou ouvrir des ports
4. Desactiver Secure Boot pour le WOL

L'app a souvent des privileges eleves (pkexec, PowerShell RunAs, osascript admin) :
-> Command injection via metacaracteres (; && |) dans les champs de texte
-> Templates de config modifies
-> L'attaquant herite des privileges admin/root de l'app
```

---

## 11 -- Chaines d'attaque IA autonomes (2026)

### CHAIN-AI-01 : Attaque IA complete contre architecture desktop (<1h, <100$)

**Chemin** : Agent IA autonome -> Reconnaissance -> Exploitation -> Mouvement lateral -> Persistance -> Exfiltration
**Cout** : < 100$ | **Duree** : < 1 heure | **Intervention humaine** : 0 (reference GTG-1002)

Ce scenario est base sur les capacites documentees des agents IA offensifs en 2026 (GTG-1002, XBOW, Villager, HexStrike-AI) et represente une attaque entierement automatisee contre l'architecture ChillShell/Chill desktop.

| Etape | Phase | Duree | Technique | Details | Source |
|-------|-------|-------|-----------|---------|--------|
| 1 | **RECONNAISSANCE** | Secondes | Scan tailnet via TS-2025-006 (ACL bypass) + fingerprint dartssh2 | L'agent IA exploite le bypass ACL sur les subnet routers partages pour cartographier le tailnet. Il identifie les noeuds, les services SSH, et fingerprinte dartssh2 via la banniere SSH revelante. Cout : ~0$ (API LLM pour analyse). | COMPLEMENT_DESKTOP_3_2026, TS-2025-006, Mobile 1.9 |
| 2 | **EXPLOITATION** | Minutes | Fuzz dartssh2 via LLM-Boofuzz OU exploit Terrapin, OU Auto Exploit (~1$, 15min) | **Option A** : LLM-Boofuzz parse le trafic SSH reel, auto-genere des scripts de fuzzing, itere via agent LLM. 100% des 15 vulns de test declenchees (vs 53% Boofuzz classique). dartssh2 sans audit = cible ideale. **Option B** : Exploit Terrapin (CVE-2023-48795) si dartssh2 ne supporte pas Strict KEX. **Option C** : Auto Exploit genere un exploit fonctionnel en 15 minutes pour ~1$. | COMPLEMENT_MOBILE_3_2026, CVE-2023-48795 |
| 3 | **MOUVEMENT LATERAL** | Minutes | Cles SSH du desktop + WOL PC cible via HexStrike-AI + rootkit eBPF VoidLink ou PROMPTFLUX | L'agent recupere les cles SSH stockees sur le desktop (pas de sandbox, acces ~/.ssh/). Il utilise HexStrike-AI (150+ outils MCP, zero-days Citrix <10min) pour pivoter. WOL reveille le PC cible. Deploiement de VoidLink (rootkit eBPF/LKM niveau etatique code en <1 semaine) ou PROMPTFLUX (polymorphe horaire via Gemini). | COMPLEMENT_DESKTOP_3_2026, Desktop 4.1 |
| 4 | **PERSISTANCE** | Minutes | Cle SSH dans authorized_keys + cron watchdog pattern SSHStalker | L'agent ajoute sa cle publique dans ~/.ssh/authorized_keys du PC cible. Il installe un cron watchdog (pattern SSHStalker) qui verifie periodiquement la presence de la backdoor et la reinstalle si supprimee. | Desktop 7.2, COMPLEMENT_DESKTOP_3_2026 |
| 5 | **EXFILTRATION** | Minutes | Tunnel Tailscale chiffre invisible IDS, OU FunkSec ransomware | **Option A (stealth)** : Le tunnel Tailscale (WireGuard) est chiffre et les IDS ne peuvent pas inspecter le contenu. L'agent exfiltre les donnees via le tunnel existant. **Option B (destructif)** : Deploiement de FunkSec/FunkLocker (Rust, 120+ organisations, rançons 10k$) pour monetiser l'acces. | COMPLEMENT_MOBILE_3_2026, COMPLEMENT_DESKTOP_3_2026 |

**Bilan** :
```
Cout total     : < 100$ (API LLM + Auto Exploit + infrastructure)
Duree totale   : < 1 heure (de la reconnaissance a l'exfiltration)
Humains requis : 0 (autonomie 80-90%, reference GTG-1002)
Detectabilite  : Tres faible (trafic Tailscale chiffre, malware polymorphe)
```

**Points de convergence avec l'architecture ChillShell/Chill** :
1. Le scan tailnet (etape 1) exploite l'architecture meme de l'app
2. dartssh2 sans audit (etape 2) est la cible ideale pour le fuzzing IA
3. L'absence de sandbox desktop (etape 3) donne acces a ~/.ssh/ et toutes les cles
4. Le protocole WOL sans authentification (etape 3) permet de reveiller les cibles
5. Le tunnel Tailscale (etape 5) sert de canal d'exfiltration chiffre invisible

**Reference** : GTG-1002 -- Premiere cyberattaque documentee avec 80-90% d'autonomie IA (groupe etatique chinois, Claude Code + MCP, ~30 organisations ciblees, milliers de requetes/seconde).

---

## Notes complementaires

### Points de convergence critique

L'architecture ChillShell/Chill presente des points de convergence ou plusieurs chaines d'attaque se rencontrent :

1. **dartssh2 sans audit** (Mobile 1.7, Desktop 1.9) : Chaque chaine ciblant SSH repose sur les faiblesses potentielles de dartssh2. Aucun audit de securite publie. 229 stars, 67 forks. Implémentation SSH from scratch.

2. **flutter_secure_storage comme coffre-fort central** (Mobile 4.3) : Toutes les cles SSH y transitent. Sur device roote, tout est accessible. Sur desktop, les alternatives (Credential Manager, libsecret, Keychain) sont moins securisees que le mobile.

3. **Le desktop bridge est "de confiance absolue"** (Desktop 7.2) : Une fois authentifie, le mobile a un acces quasi illimite. Le desktop n'a PAS de sandbox (Desktop 4.1). Le desktop a des privileges eleves pour configurer l'OS.

4. **WOL sans authentification** (Mobile 3.1) : Le protocole WOL n'a AUCUNE authentification. L'architecture wake -> connect -> execute est identique au kill chain ransomware Ryuk.

5. **Le service SSH permanent** (Mobile 4.6) : flutter_foreground_task maintient la connexion SSH en permanence. Surface d'attaque 24/7.

### Facteurs amplificateurs

- **Absence d'audit dartssh2** : Chaque vulnerabilite SSH potentielle est amplifiee par l'absence de verification independante.
- **Pas de sandbox desktop** : L'app desktop a acces a TOUT le filesystem utilisateur.
- **Privileges eleves** : pkexec (Linux), PowerShell RunAs (Windows), osascript admin (macOS) pour configurer l'OS.
- **20+ dependances pub.dev sans audit automatique** : pub.dev n'a PAS d'audit automatique contrairement a npm.
- **Outils IA offensifs 2026** : Decouverte de zero-days automatisee, malware polymorphe, reverse engineering accelere.
