# Hardening Reseau et Connexion -- Base de connaissances defensive
# Skill : defensive-hardening | Fichier knowledge
# Source : CYBERSEC_MOBILE.md section 11, CYBERSEC_DESKTOP.md section 11

---

## 1 -- Network Security Config Android

### Complexite : Simple

Fichier XML forcant certificate pinning au niveau OS, bloquant le cleartext, definissant les CA de confiance.

```xml
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
</network-security-config>
```

**Source** : CYBERSEC_MOBILE.md section 11.1

---

## 2 -- App Transport Security iOS

### Complexite : Simple

Configuration stricte bloquant tout trafic non-TLS 1.3.

**Source** : CYBERSEC_MOBILE.md section 11.2

---

## 3 -- Detection proxy/VPN tiers

### Complexite : Moderee

Detecter si un proxy (Burp Suite, Charles) ou VPN non-Tailscale est actif. Lire la table de routage.

**Source** : CYBERSEC_MOBILE.md section 11.3, CYBERSEC_DESKTOP.md section 11.6

---

## 4 -- Dual SSL Pinning (Dart + natif)

### Criticite : Haute

Ne pas se contenter de HttpCertificatePinner en Dart. Deleguer les appels reseau critiques a la couche native via Platform Channels. Protections RASP plus matures cote natif.

**Source** : CYBERSEC_MOBILE.md section 11.4

---

## 5 -- mTLS applicatif

### Complexite : Avancee

Au-dessus de SSH et Tailscale, ajouter une couche mTLS entre l'app mobile et desktop. Triple couche de chiffrement.

**Source** : CYBERSEC_MOBILE.md section 11.5

---

## 6 -- Heartbeat securise

### Complexite : Moderee

Heartbeat mobile <-> desktop avec challenge-response. Detecte deconnexions ET MITM.

**Source** : CYBERSEC_MOBILE.md section 11.6, CYBERSEC_DESKTOP.md section 11.1

---

## 7 -- Pas de fallback non securise (FAIL CLOSED)

### Criticite : CRITIQUE

Si Tailscale est down ou compromis, l'app NE DOIT PAS fallback vers une connexion non securisee. Fail closed, pas fail open.

**Source** : CYBERSEC_MOBILE.md section 11.7, CYBERSEC_DESKTOP.md section 11.5

---

## 8 -- Protocole de commande securise (Desktop)

### Complexite : Avancee

Format des messages entre mobile et desktop : protobuf ou JSON signe + CBOR. Versioning, negociation de capabilities. Chaque message : chiffrement + signature + nonce.

**Source** : CYBERSEC_DESKTOP.md section 11.2

---

## 9 -- State synchronization securisee (Desktop)

Synchronisation d'etat (PC allume/eteint, session SSH active, config OS) sans exposer d'informations. Resistance aux incoherences reseau.

**Source** : CYBERSEC_DESKTOP.md section 11.3

---

## 10 -- dartssh2 2.13.0 ameliorations et risques

### Criticite : Haute

Version 2.13.0 publiee le 22 juin 2025. Derniere release, 8 mois sans mise a jour en fevrier 2026.

### Ameliorations

- **Re-keying serveur** : Support du re-keying initie par le serveur. Important pour les sessions SSH longues — le desktop bridge maintient des sessions potentiellement de plusieurs heures.
- **Encrypt-then-MAC** : Support `hmac-sha2-256-etm@openssh.com` et `hmac-sha2-512-etm@openssh.com`. Les MACs ETM sont plus securises que les MACs classiques.
- **ATTENTION** : Les combinaisons CBC+ETM restent vulnerables a Terrapin (CVE-2023-48795).

### Nouveau danger : disableHostkeyVerification

Nouveau parametre en v2.13.0 qui supprime TOUTE verification de cle hote. Ouvre la porte aux attaques MITM si active en production.

**Sur desktop c'est PIRE** : Le desktop bridge est le point de confiance central de l'architecture. Si la verification d'hote est desactivee :
1. Un MITM sur le LAN intercepte la connexion SSH vers le PC cible
2. Le desktop bridge accepte la fausse cle d'hote
3. L'attaquant capture TOUTES les commandes et identifiants
4. Le mobile ne peut pas detecter la compromission

**Action** : INTERDIRE `disableHostkeyVerification` en production. Ajouter un lint custom + check CI qui rejette tout commit contenant ce parametre.

### Terrapin toujours non corrige

dartssh2 ne supporte PAS le Strict Key Exchange (RFC 9308). L'attaque Terrapin est exploitable avec `chacha20-poly1305@openssh.com` ou les combinaisons CBC+ETM.

### 2FA keyboard-interactive casse (Issue #128)

Le support du 2FA via keyboard-interactive est casse. Empeche l'utilisation du 2FA SSH standard.

### Tableau des risques

| Risque | Gravite | Statut |
|---|---|---|
| Pas de Strict KEX (Terrapin) | CRITIQUE | Non corrige |
| `disableHostkeyVerification` | Eleve | Nouveau en 2.13.0, a interdire |
| Maintenance ralentie (8 mois) | Moyen | En cours |
| Aucun audit de securite | Moyen | Permanent |
| 2FA keyboard-interactive casse | Moyen | Issue #128 ouverte |
| 63 issues ouvertes, 7 PR, 1 contributeur | Moyen | Bus factor = 1 |

**Source** : COMPLEMENT_MOBILE_2_2026.md sections 5.1-5.5, COMPLEMENT_DESKTOP_2_2026.md sections 1.1-1.5

---

## 11 -- Configuration dartssh2 recommandee

### Criticite : CRITIQUE

Configuration stricte pour limiter la surface d'attaque de dartssh2.

### Parametres recommandes

| Parametre | Valeur | Raison |
|-----------|--------|--------|
| **KEX** | `curve25519-sha256` uniquement | Seul KEX classique sur, PQ non supporte |
| **Cipher** | `aes256-gcm@openssh.com` | Immunise contre Terrapin |
| **MAC** | `hmac-sha2-256-etm@openssh.com` | ETM uniquement, MAIS pas avec CBC |
| **Cle hote** | `ssh-ed25519` | Plus resistant que RSA |
| **disableHostkeyVerification** | JAMAIS | MITM garanti si active |

### Algorithmes a INTERDIRE

- `diffie-hellman-group1-sha1` (encore disponible dans dartssh2)
- `rsa1024-sha1` (encore disponible dans dartssh2)
- Tout cipher CBC avec ETM (vulnerable Terrapin)

**Source** : COMPLEMENT_MOBILE_3_2026.md section 1.2, COMPLEMENT_DESKTOP_3_2026.md section 8.2

---

## 12 -- sshd_config recommande PC cible (post-quantique)

### Criticite : Haute | Plateforme : Desktop (PC cible)

Configuration durcie du serveur SSH sur le PC cible, compatible post-quantique.

### Configuration recommandee

```
# Algorithmes (post-quantique si supporte par OpenSSH 10+)
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

# Re-keying (sessions longues)
RekeyLimit 1G 1h
```

### Notes

- `sntrup761x25519-sha512` et `mlkem768x25519-sha256` sont des KEX hybrides post-quantiques supportes par OpenSSH 10.0+
- dartssh2 negociera automatiquement `curve25519-sha256` (fallback classique)
- `RekeyLimit 1G 1h` force un re-keying toutes les heures ou tous les 1 Go de donnees

**Source** : COMPLEMENT_DESKTOP_3_2026.md section 8.1

---

## 13 -- IETF drafts en cours (SSH post-quantique)

### Criticite : Moyenne (preparation)

### Standards en cours de standardisation

| Draft | Statut | Description |
|-------|--------|-------------|
| **ML-KEM SSH** (`draft-ietf-sshm-mlkem-hybrid-kex-09`) | **IETF Last Call** (fevrier 2026) | Echange de cles post-quantique hybride pour SSH — standardisation imminente |
| **ML-DSA SSH** (`draft-rpe-ssh-mldsa-02`) | En cours | Signatures post-quantiques pour SSH |
| **Strict KEX** (`draft-miller-sshm-strict-kex-01`) | En cours | Formalisation du Strict Key Exchange (anti-Terrapin) |

### Impact

dartssh2 ne supporte aucun de ces standards. La negociation retombera sur les algorithmes classiques. OpenSSH 10.1 emet des avertissements pour les KEX non-PQ (WarnWeakCrypto).

### Ce que dartssh2 devrait supporter mais ne supporte PAS

1. KEX post-quantique (mlkem768x25519-sha256 ou sntrup761x25519-sha512)
2. Strict KEX (RFC 9308)
3. Desactivation par defaut des algorithmes faibles (DH group1, RSA 1024)
4. WarnWeakCrypto cote client

**Source** : COMPLEMENT_MOBILE_3_2026.md sections 1.1, 8.2, COMPLEMENT_DESKTOP_3_2026.md sections 1.1, 8.3

---

## 14 -- WireGuard post-quantique

### Criticite : Moyenne (preparation)

### Solutions disponibles

| Solution | Statut | Description |
|----------|--------|-------------|
| **ExpressVPN PQ-WireGuard** | En production (aout 2025) | ML-KEM hybride + X25519 via PSK sur TLS 1.3. Surcout 15-20ms a l'etablissement, aucun impact en regime permanent. Disponible iOS, Android, Windows |
| **Rosenpass** v0.2.2 | Open source, verifie | Classic McEliece + Kyber 512, formellement verifie ProVerif, integre a NetBird. En cours de packaging Debian |
| **Tailscale PQ** | INEXISTANT | Tailscale n'a PAS annonce de support PQ-WireGuard |

### Consequence

Le tunnel Tailscale (mobile -> desktop et desktop -> PC cible) est vulnerable au "harvest now, decrypt later". Un attaquant etatique avec des capacites d'interception peut stocker le trafic chiffre et le dechiffrer dans le futur avec un ordinateur quantique.

### Approche possible desktop

Rosenpass pourrait etre deploye sur le PC cible pour ajouter une couche PQ au-dessus de WireGuard, en attendant Tailscale PQ.

**Source** : COMPLEMENT_MOBILE_3_2026.md section 7.3, COMPLEMENT_DESKTOP_3_2026.md section 7.3

---

## 15 -- Tailscale 1.94.1 fonctionnalites securitaires

### Criticite : Haute

### Nouvelles fonctionnalites

| Fonctionnalite | Description | Impact |
|----------------|-------------|--------|
| **Chiffrement etat via TPM** | Les fichiers d'etat Tailscale sont chiffres via le TPM du PC | Protege les cles Tailscale du desktop (GA puis retire du defaut en v1.92.5 pour problemes de compatibilite) |
| **Federation d'identite workload** | Tokens OIDC ephemeres remplacant les cles auth statiques | Plus sur pour le desktop bridge — pas de cle statique a voler |
| **Audit SSH integre** | Messages LOGIN envoyes au sous-systeme d'audit kernel dans v1.94.1 | Le desktop peut loguer toutes les connexions SSH via Tailscale |

### Actions

- Activer le chiffrement TPM quand compatible
- Migrer vers les tokens OIDC ephemeres pour le desktop bridge
- Activer l'audit SSH integre pour la tracabilite

**Source** : COMPLEMENT_MOBILE_3_2026.md section 6.8, COMPLEMENT_DESKTOP_3_2026.md section 6.5

---

## Sources

- CYBERSEC_MOBILE.md sections 11.1-11.7
- CYBERSEC_DESKTOP.md sections 11.1-11.6
- COMPLEMENT_MOBILE_2_2026.md sections 5.1-5.5
- COMPLEMENT_DESKTOP_2_2026.md sections 1.1-1.5
- COMPLEMENT_MOBILE_3_2026.md sections 1.1-1.5, 6.8, 7.3, 8.1-8.3
- COMPLEMENT_DESKTOP_3_2026.md sections 1.1-1.5, 6.5, 7.3, 8.1-8.3
- CVE-2023-48795 : Terrapin Attack
- RFC 9308 : Strict Key Exchange
