# Attaques Reseau -- Base de connaissance offensive
# Skill : adversary-simulation | Fichier knowledge
# Architecture cible : Mobile (ChillShell) -> Tailscale mesh -> Desktop (Chill) -> SSH -> PC

> **Source** : Extractions de CYBERSEC_MOBILE.md et CYBERSEC_DESKTOP.md

---

## TABLE DES MATIERES

1. [ARP Spoofing / ARP Poisoning](#1--arp-spoofing--arp-poisoning)
2. [DNS Poisoning local](#2--dns-poisoning-local)
3. [LLMNR / NBT-NS / mDNS Poisoning](#3--llmnr--nbt-ns--mdns-poisoning)
4. [WiFi Evil Twin / KARMA](#4--wifi-evil-twin--karma)
5. [Rogue DHCP Server](#5--rogue-dhcp-server)
6. [IMSI Catchers / Fausses stations de base](#6--imsi-catchers)
7. [Attaques IPv6](#7--attaques-ipv6)
8. [Abus du protocole Wake-On-LAN](#8--abus-du-protocole-wake-on-lan)
9. [WPA3 Downgrade / Dragonblood / PMKID](#9--wpa3-downgrade--dragonblood--pmkid)
10. [Certificate Pinning absent](#10--certificate-pinning-absent)
11. [Analyse temporelle du trafic par IA](#11--analyse-temporelle-du-trafic-par-ia)
12. [CVEs WireGuard ecosysteme](#12--cves-wireguard-ecosysteme)
13. [Botnets SSH comme vecteur reseau](#13--botnets-ssh-comme-vecteur-reseau)
14. [WireGuard identifiable par DPI et blocage etatique](#14--wireguard-identifiable-par-dpi-et-blocage-etatique)

---

## 1 -- ARP Spoofing / ARP Poisoning

- **Complexite** : Intermediaire
- **Cible** : Desktop LAN

L'attaquant envoie de faux paquets ARP pour rediriger le trafic entre le desktop et le PC cible.

### Outils

- `arpspoof` (dsniff)
- `ettercap`
- `bettercap`

### Impact sur ChillShell/Chill

- Interception du trafic SSH direct en LAN (hors tunnel Tailscale)
- Si Tailscale est contourne ou en fallback, TOUT le trafic est expose
- Combinable avec un MITM SSH

**Source** : CYBERSEC_DESKTOP.md section 5.1

---

## 2 -- DNS Poisoning local

- **Complexite** : Intermediaire
- **CVE** : CVE-2025-40778 (BIND 9)

Detournement des resolutions DNS pour rediriger les connexions Tailscale ou les mises a jour vers des serveurs malveillants.

### Impact

- Redirection vers un serveur Tailscale falsifie
- Interception des mises a jour (supply chain reseau)
- Detournement de MagicDNS Tailscale

**Source** : CYBERSEC_DESKTOP.md section 5.2

---

## 3 -- LLMNR / NBT-NS / mDNS Poisoning

- **Complexite** : Intermediaire
- **Cible** : Desktop Windows

Protocoles de resolution de noms locaux vulnerables au poisoning quand DNS echoue.

### Outils

- **Responder** (Laurent Gaffie) -- capture de hashes NTLMv2
- **Inveigh** (PowerShell)

### Impact

- Vol de hashes NTLMv2 pour pass-the-hash
- Redirection de services

**Source** : CYBERSEC_DESKTOP.md section 5.3

---

## 4 -- WiFi Evil Twin / KARMA

- **Complexite** : Intermediaire
- **Cible** : Mobile + Desktop WiFi

### Mecanisme

1. Faux AP avec le meme SSID qu'un reseau connu
2. Le telephone/desktop se connecte automatiquement
3. Tout le trafic INITIAL (avant que Tailscale ne monte son tunnel) est intercepte
4. Variante KARMA : l'AP repond a TOUTES les requetes probe

### Outils

- `hostapd`, `airgeddon`, `Fluxion`

### Impact

- Interception du trafic avant le tunnel Tailscale/WireGuard
- Capture de credentials pre-tunnel
- Portail captif pour phishing cible

**Source** : CYBERSEC_MOBILE.md section 5.2, CYBERSEC_DESKTOP.md section 5.6

---

## 5 -- Rogue DHCP Server

- **Complexite** : Intermediaire
- **Cible** : Desktop LAN

Distribution de fausses routes et serveurs DNS. Si les routes Tailscale sont manipulees avant le montage du tunnel, le trafic initial est expose.

**Source** : CYBERSEC_DESKTOP.md section 5.4

---

## 6 -- IMSI Catchers

- **Complexite** : Nation-state
- **Cible** : Mobile cellulaire

Simulation de stations de base forcant le retrogradage vers 2G/GSM. **Sni5Gect** (2026) intercepte les messages 5G sans station complete.

### Impact

- Interception du trafic AVANT le tunnel Tailscale
- Geolocalisation precise du mobile

### Contre-mesures OS

- Android 16 : APIs de protection contre les tours cellulaires malveillantes
- Desactivation manuelle du 2G

**Source** : CYBERSEC_MOBILE.md section 5.1

---

## 7 -- Attaques IPv6

- **Complexite** : Expert
- **Cible** : Desktop LAN

### Techniques

1. **Router Advertisement Spoofing** : injection de faux RA
2. **DHCPv6 Poisoning** : faux parametres reseau IPv6
3. **IPv6 SLAAC Abuse** : manipulation auto-configuration

### Impact

- Bypass des protections IPv4 (pare-feu configure uniquement en IPv4)
- Tailscale utilise IPv6 dans le mesh (100.x.y.z et fd7a:115c:a1e0::)

**Source** : CYBERSEC_DESKTOP.md section 5.5

---

## 8 -- Abus du protocole Wake-On-LAN

### 8.1 Magic Packet Spoofing (zero authentification)

Le protocole WOL n'a **AUCUNE authentification** native. Structure du Magic Packet :

```
FF:FF:FF:FF:FF:FF + [MAC cible x 16 repetitions]
```

Envoye en broadcast UDP sur les ports 7 ou 9. **Complexite** : Script kiddie.

### 8.2 Technique Ryuk -- WOL comme vecteur de ransomware

Ryuk utilise WOL dans sa kill chain :
1. Enumere la table ARP via `GetIpNetTable`
2. Envoie des WOL a toutes les adresses MAC
3. Reveille les machines endormies
4. Deploie le ransomware via SMB/SSH

**Pertinence CRITIQUE** : L'architecture ChillShell/Chill (wake -> connect -> execute) est **IDENTIQUE** a la kill chain Ryuk.

### 8.3 SecureON -- protection insuffisante

SecureON ajoute un mot de passe de 6 octets au WOL, mais :
- Circule EN CLAIR sur le reseau
- Rejouable indefiniment (pas de nonce, pas de timestamp)

### 8.4 WOL via Tailscale -- problemes de routage

Le Magic Packet est un broadcast couche 2. Tailscale est un tunnel couche 3. Le broadcast ne traverse PAS les tunnels WireGuard naturellement.

### 8.5 BIOS/UEFI et WOL

Si Secure Boot est desactive pour permettre le WOL -> risque d'Evil Maid attack.

**Source** : CYBERSEC_MOBILE.md section 3, CYBERSEC_DESKTOP.md section 3

---

## 9 -- WPA3 Downgrade / Dragonblood / PMKID

- **Complexite** : Expert
- **CVEs** : CVE-2019-9494, CVE-2019-9496

### WPA3 Transition Mode

Faiblesse structurelle : compatibilite WPA2 permet de forcer le downgrade.

### Calcul PMKID

```
PMKID = HMAC-SHA1(PMK, "PMK Name" + MAC_AP + MAC_Client)
```

Cassable hors-ligne par hashcat (mode 16800).

### Dragonblood

Attaques par canaux auxiliaires sur le handshake Dragonfly de WPA3 :
- Cache timing sur Brainpool curves
- Microarchitecture sur operations elliptiques

**Source** : CYBERSEC_MOBILE.md section 5.3

---

## 10 -- Certificate Pinning absent

### Vulnerabilite (CWE-295)

Connexions HTTPS sans certificate pinning. L'attaquant avec un certificat CA compromis intercepte le trafic HTTPS.

### Impact sur ChillShell/Chill

- Interception des communications avec les APIs Tailscale
- Manipulation des mises a jour
- Vol de tokens d'authentification

### Audit

```bash
grep -rn "HttpClient\|http\.\|https\.\|dio\|http_client" --include="*.dart" .
grep -rn "badCertificateCallback\|SecurityContext\|pinning" --include="*.dart" .
```

**Source** : CYBERSEC_MOBILE.md section 11.2

---

## 11 -- Analyse temporelle du trafic par IA

- **Complexite** : Expert

Meme chiffre par WireGuard + SSH, le trafic revele des informations par sa structure temporelle :

- Mot de passe tape : paquets courts espaces de ~100-300ms
- Commande specifique : taille de reponse caracteristique
- Type de fichier transfere : entropie et patterns de taille

En 2026, l'IA correle les micro-variations de latence pour reconstruire les frappes clavier.

**Source** : CYBERSEC_MOBILE.md sections 1.10, 5.4

---

---

## 12 -- CVEs WireGuard ecosysteme

Le protocole cryptographique WireGuard et le module kernel (~4 000 lignes) restent **sans CVE** entre juin 2025 et fevrier 2026. Les verifications formelles (Tamarin, CryptoVerif) sont toujours valides. Cependant, l'ecosysteme autour de WireGuard presente plusieurs vulnerabilites critiques.

### 12.1 CVE-2025-27093 -- Sliver C2 bypass netstack WireGuard

- **Produit** : Sliver C2 (framework de command & control)
- **CVSS** : 6.3
- **Description** : Contournement du netstack WireGuard dans Sliver. La politique par defaut est "allow" au lieu de "deny", permettant a un attaquant de bypasser les controles d'acces WireGuard.
- **Pertinence ChillShell/Chill** : Si le desktop est teste via Sliver, les tunnels WireGuard/Tailscale ne protegent pas contre ce bypass.

### 12.2 CVE-2025-7850 -- TP-Link Omada injection commande (CVSS 9.3)

- **Produit** : TP-Link Omada (routeurs entreprise)
- **CVSS** : 9.3 (CRITIQUE)
- **Description** : La cle privee WireGuard n'est **PAS sanitisee** dans l'interface web de gestion TP-Link Omada. Un attaquant peut injecter des commandes shell via le champ de cle privee WireGuard -> compromission totale du routeur avec privileges root.
- **Pertinence ChillShell/Chill** : Si le routeur LAN est un TP-Link Omada et que WireGuard est configure dessus, le routeur est compromis. L'attaquant peut alors :
  - Intercepter tout le trafic LAN
  - Manipuler le DNS et les routes
  - Se positionner en MITM entre le desktop bridge et le PC cible
- **Scenario d'attaque** :
  1. L'attaquant accede a l'interface web du routeur TP-Link Omada (credentials par defaut, phishing admin)
  2. Il injecte une commande dans le champ de cle privee WireGuard
  3. Le routeur execute la commande avec privileges root
  4. L'attaquant installe un reverse shell permanent sur le routeur
  5. MITM sur TOUT le trafic LAN -- interception SSH, WOL, mises a jour

### 12.3 CVE-2025-7851 -- TP-Link Omada code debug residuel

- **Produit** : TP-Link Omada
- **CVSS** : 8.7
- **Description** : Code de debogage residuel laisse dans le firmware de production -> acces root direct.
- **Pertinence ChillShell/Chill** : Meme impact que CVE-2025-7850. Le routeur LAN TP-Link est un point critique de l'infrastructure.

### 12.4 CVE-2025-32793 -- Cilium race condition paquets non chiffres

- **Produit** : Cilium (networking Kubernetes)
- **Description** : Race condition dans Cilium : des paquets sortent **NON chiffres** pendant une breve fenetre temporelle lors de la configuration WireGuard.
- **Pertinence ChillShell/Chill** : Impact indirect -- si le PC cible est dans un cluster Kubernetes avec Cilium et WireGuard, des paquets peuvent transiter en clair.

### 12.5 CVE-2025-59824 -- Omni SideroLink paquets arbitraires

- **Produit** : Omni SideroLink
- **Description** : Envoi de paquets arbitraires via le tunnel WireGuard SideroLink.
- **Pertinence ChillShell/Chill** : Impact indirect sur les infrastructures utilisant Talos Linux et Omni.

### 12.6 CVE-2025-58189 -- Chainguard wireguard-go bug stdlib

- **Produit** : Chainguard wireguard-go
- **Description** : Bug dans la gestion ALPN de la stdlib Go affectant l'implementation wireguard-go de Chainguard.
- **Pertinence ChillShell/Chill** : Le daemon tsnet du desktop Chill est ecrit en Go et utilise potentiellement wireguard-go -> verifier la version de la stdlib Go.

---

## 13 -- Botnets SSH comme vecteur reseau

Les botnets SSH actifs en 2025-2026 representent un vecteur d'attaque reseau direct pour l'architecture ChillShell/Chill.

### 13.1 SSHStalker -- compromission des PC Linux cibles

- **Cibles** : ~7 000 systemes Linux (USA, Europe, Asie-Pacifique)
- **Vecteur reseau** : Scanner Go deguise en nmap -> brute-force SSH -> compilation du malware sur la victime -> persistance par cron watchdog
- **Impact reseau** : Un PC cible Linux compromis par SSHStalker devient un pivot reseau. L'attaquant peut :
  - Observer tout le trafic du segment reseau
  - Compromettre le desktop bridge via les cles SSH volees
  - Installer des outils d'interception reseau (tcpdump, iptables redirect)
  - Utiliser le PC comme proxy pour scanner le reste du LAN

### 13.2 AyySSHush -- persistance firmware routeurs

- **Cibles** : 9 000+ routeurs ASUS
- **Vecteur reseau CRITIQUE** : Injection de cles SSH publiques + activation SSH sur port 53282
- **Persistance** : **Survit aux mises a jour firmware** car elle utilise les parametres legitimes ASUS
- **Impact reseau** : Le routeur est le **noeud central** du reseau. Un routeur ASUS compromis par AyySSHush donne a l'attaquant :
  - Un acces SSH permanent au routeur (port 53282)
  - La capacite de manipuler TOUT le routage reseau
  - L'interception de TOUT le trafic LAN (DNS, ARP, DHCP)
  - La capacite de se positionner en MITM entre le desktop bridge et le PC cible
  - Un point de persistance qui **survit aux mises a jour** et aux redemarrages
- **Scenario d'attaque combine** :
  1. Le routeur ASUS du LAN est compromis par AyySSHush (botnet automatise)
  2. L'attaquant a un shell SSH sur le routeur (port 53282)
  3. Il configure un MITM ARP entre le desktop bridge et le PC cible
  4. Il intercepte les sessions SSH (si le fingerprinting de cle hote est desactive ou ignore)
  5. Il capture les cles SSH et credentials
  6. Il persiste meme si l'utilisateur met a jour le firmware du routeur

### 13.3 PumaBot -- IoT comme point d'entree reseau

- **Type** : Botnet Go ciblant l'IoT Linux via brute-force SSH
- **Particularite** : Detection de honeypots (evite les pieges de securite)
- **Impact reseau** : Les appareils IoT compromis (cameras IP, NAS, imprimantes) sur le meme LAN que le desktop bridge deviennent des points d'entree pour l'attaquant. Ils permettent :
  - Scan du reseau local
  - ARP spoofing depuis un appareil de confiance
  - Pivot vers le desktop bridge et le PC cible

---

## 14 -- WireGuard identifiable par DPI et blocage etatique

### 14.1 Signatures DPI de WireGuard

Les paquets WireGuard ont des caracteristiques identifiables par inspection profonde de paquets (DPI) :

| Caracteristique | Valeur |
|----------------|--------|
| Taille paquet initiation | 148 octets (fixe) |
| Taille paquet reponse | 92 octets (fixe) |
| Taille paquet cookie | 64 octets (fixe) |
| Type de transport | UDP exclusivement |
| Entropie du payload | Haute (donnees chiffrees) |
| Structure en-tete | Fixe, type 1-4 |

### 14.2 Blocage par etats

- **Great Firewall chinois (GFW)** : Identifie et bloque WireGuard en millisecondes par DPI. Les connexions Tailscale sont coupees.
- **TSPU russe** : Systeme technique de blocage russe -- identification et blocage automatique des tunnels WireGuard.
- **Impact ChillShell/Chill** :
  - En Chine ou Russie, Tailscale/WireGuard standard est **inutilisable**
  - En environnement d'entreprise avec DPI interne, le tunnel Tailscale peut etre identifie et bloque par les equipes reseau
  - Meme dans les pays sans censure, un ISP ou un operateur reseau peut identifier le trafic Tailscale

### 14.3 Solutions d'obfuscation

| Solution | Technique | Statut | Impact Tailscale |
|----------|-----------|--------|-----------------|
| **AmneziaWG v1.5** | Constantes aleatoires dans les handshakes | Disponible | Non integre a Tailscale |
| **Mullvad LWO** | Brouillage des en-tetes WireGuard | Disponible | Non integre a Tailscale |
| **Encapsulation QUIC** | Trafic WireGuard ressemble a HTTPS | Disponible | Non integre a Tailscale |
| **GotaTun + DAITA** | Anti-analyse de trafic par IA | Disponible | Non integre a Tailscale |

**Tailscale n'integre PAS de mecanisme d'obfuscation natif** -- toutes les solutions ci-dessus doivent etre deployees separement.

---

## RESUME DES COMPLEXITES

| Vecteur | Complexite | Cible |
|---------|-----------|-------|
| ARP Spoofing | Intermediaire | Desktop LAN |
| DNS Poisoning | Intermediaire | Desktop/Mobile |
| LLMNR/NBT-NS Poisoning | Intermediaire | Desktop Windows |
| WiFi Evil Twin / KARMA | Intermediaire | Mobile + Desktop |
| Rogue DHCP | Intermediaire | Desktop LAN |
| IMSI Catchers | Nation-state | Mobile cellulaire |
| IPv6 Attacks | Expert | Desktop LAN |
| WOL Spoofing | Script kiddie | Reseau local |
| WOL Technique Ryuk | Intermediaire | Reseau local |
| WPA3 Dragonblood | Expert | WiFi |
| Certificate Pinning absent | Intermediaire | HTTPS |
| Analyse temporelle IA | Expert | Trafic chiffre |
| TP-Link Omada injection WG | Intermediaire | Routeur LAN |
| Cilium race condition | Expert | Kubernetes |
| AyySSHush routeur ASUS | Script kiddie (auto) | Routeur LAN |
| SSHStalker PC Linux | Intermediaire | PC cible Linux |
| PumaBot IoT | Script kiddie (auto) | IoT LAN |
| WireGuard DPI/Blocage | Nation-state | Censure etatique |

---

## Sources

- CYBERSEC_MOBILE.md -- Sections 3, 5, 11
- CYBERSEC_DESKTOP.md -- Sections 3, 5
- CVE-2025-40778 (BIND 9)
- CVE-2019-9494, CVE-2019-9496 (Dragonblood)
- BleepingComputer : Ryuk WOL technique
- IA+SSH+TAILSCALE_COMPLEMENT_MOBILE_3_2026.md -- Section 4 (Botnets SSH), Section 7 (WireGuard DPI/PQ)
- IA+SSH+TAILSCALE_COMPLEMENT_DESKTOP_3_2026.md -- Section 4 (Botnets SSH), Section 7 (WireGuard ecosysteme)
- CVE-2025-27093 (Sliver C2 bypass WireGuard netstack)
- CVE-2025-7850 (TP-Link Omada injection commande CVSS 9.3)
- CVE-2025-7851 (TP-Link Omada code debug residuel CVSS 8.7)
- CVE-2025-32793 (Cilium race condition paquets non chiffres)
- CVE-2025-59824 (Omni SideroLink paquets arbitraires)
- CVE-2025-58189 (Chainguard wireguard-go bug stdlib Go)
