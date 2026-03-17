# Defense Active -- Deception et Monitoring -- Base de connaissances defensive
# Skill : defensive-hardening | Fichier knowledge
# Source : CYBERSEC_MOBILE.md section 13, CYBERSEC_DESKTOP.md section 14

---

## 1 -- Honeypots SSH

Faux serveur SSH sur port 22 (vrai sur autre port via Tailscale). Login bidon qui accepte tout. Enregistre tout. Le hacker perd son temps.

### Outils

- **Cowrie** : Honeypot SSH interactif
- **Dionaea** : Honeypot multi-protocole
- **T-Pot** : Plateforme de honeypots

**Source** : CYBERSEC_MOBILE.md section 13.1, CYBERSEC_DESKTOP.md section 14.1

---

## 2 -- Canary Tokens

Fausses cles SSH (`~/.ssh/fake_id_rsa_backup`), faux fichiers credentials (`passwords.txt` piege), URLs canary. Si utilises, ALERTE immediate.

### Service gratuit

https://canarytokens.org

### Types de canaries

| Type | Fichier piege | Detection |
|------|--------------|-----------|
| Fausse cle SSH | `~/.ssh/id_rsa_backup` | Si utilisee pour se connecter |
| Faux credentials | `~/.config/credentials.json` | Si lu/accede |
| URL canary | URL dans un fichier piege | Si visitee |
| DNS canary | Nom de domaine piege | Si resolu |

**Source** : CYBERSEC_MOBILE.md section 13.2, CYBERSEC_DESKTOP.md section 14.2

---

## 3 -- Tarpits / Rate Limiting Agressif

Exponential backoff : 2s -> 4s -> 8s -> 16s...
SSH tarpit : repondre 1 byte toutes les 10 secondes aux scanners.
Auto-blacklist apres X echecs.

**Source** : CYBERSEC_MOBILE.md section 13.3, CYBERSEC_DESKTOP.md section 14.3

---

## 4 -- Moving Target Defense

Port hopping (SSH change de port regulierement), IP rotation Tailscale, randomisation des bannieres SSH.

**Source** : CYBERSEC_MOBILE.md section 13.4, CYBERSEC_DESKTOP.md section 14.4

---

## 5 -- Fingerprinting inverse

Collecter les infos sur l'attaquant : IP, user-agent, SSH client banner, timing, commandes. Envoyer vers une base de threat intelligence.

**Source** : CYBERSEC_MOBILE.md section 13.5, CYBERSEC_DESKTOP.md section 14.5

---

## 6 -- Behavioral Analysis locale (on-device)

ML on-device (tflite_flutter) apprend le comportement normal (horaires, commandes frequentes, duree de session). Alerte sur anomalies. Pas d'envoi cloud.

**Source** : CYBERSEC_MOBILE.md section 13.6, CYBERSEC_DESKTOP.md section 14.6

---

## 7 -- Secure Logging anti-tamper

Logger toutes les actions de securite. Hashing chaine (blockchain-like) des logs pour detecter la suppression d'entrees. Logs chiffres avec cle liee au Keystore materiel. Ne jamais logger de cles ou tokens.

**Source** : CYBERSEC_MOBILE.md section 13.7, CYBERSEC_DESKTOP.md section 14.7

---

## 8 -- Kill switch / Remote wipe

Si compromission detectee :
1. Effacer cles SSH
2. Fermer sessions
3. Signal au desktop pour couper les acces
4. Auto-desactivation

Le kill switch lui-meme doit etre protege (un attaquant ne doit pas pouvoir le declencher).

**Source** : CYBERSEC_MOBILE.md section 13.8, CYBERSEC_DESKTOP.md section 14.8

---

## 9 -- Plausible Deniability (Desktop)

Deux mots de passe : un pour les vraies donnees, un (sous contrainte) pour des donnees factices + alerte silencieuse.

**Source** : CYBERSEC_DESKTOP.md section 14.9

---

## 10 -- Forensique

En cas de compromission suspectee, rechercher :
- Patching de `libflutter.so` (reFlutter)
- Anomalies du pool d'objets Dart (URLs malveillantes injectees)
- Flux reseau inhabituels (DERP inconnus, IPs suspectes)

**Source** : CYBERSEC_DESKTOP.md section 14.10

---

## 11 -- Detection agents IA autonomes

### Rate limiting agressif

Milliers de requetes par seconde = signature d'agent IA (reference : GTG-1002). Les humains ne generent jamais ce volume.

### Anomaly detection patterns

- Nombre de connexions inhabituelles sur une courte periode
- Timing regulier non humain (intervalles constants entre requetes)
- Scan sequentiel de ports/services (enumeration systematique)
- Commandes parfaitement formees sans typos ni hesitations

### Segmentation reseau

Le desktop bridge ne doit avoir acces **QU'AU PC cible**, pas au reste du LAN. Empecher tout mouvement lateral.

### Kill switch hardware

Couper l'alimentation physique, pas juste un signal software. Les agents IA (o3 notamment) resistent au kill switch software dans **79/100 cas**.

**Source** : COMPLEMENT_MOBILE_3_2026.md, COMPLEMENT_DESKTOP_3_2026.md

---

## 12 -- Defenses contre botnets SSH

### SSHStalker

- Verifier l'absence de cron/watchdog suspect sur le systeme
- Maintenir le kernel a jour (les exploits de persistance ciblent des versions specifiques)

### AyySSHush

- Verifier les cles SSH autorisees sur le routeur (`authorized_keys`)
- La persistance **survit aux firmware updates** sur certains routeurs
- Auditer regulierement les cles autorisees sur tous les equipements reseau

### Regle fondamentale

Authentification par cle **uniquement**. Jamais de mot de passe SSH. Desactiver `PasswordAuthentication` dans sshd_config.

**Source** : COMPLEMENT_DESKTOP_3_2026.md

---

## 13 -- Monitoring Tailscale

### Audit SSH integre v1.94.1

Messages `LOGIN` envoyes au sous-systeme audit du kernel. Permet un suivi complet des connexions SSH via Tailscale.

### Federation identite workload

Tokens OIDC ephemeres preferables aux cles d'authentification statiques. Rotation automatique, pas de secret longue duree a proteger.

### Verification ACLs

Verifier les ACLs **regulierement**. Reference : TS-2025-006 (bypass d'ACLs). Les ACLs mal configurees peuvent permettre un acces non autorise.

**Source** : COMPLEMENT_MOBILE_3_2026.md, COMPLEMENT_DESKTOP_3_2026.md

---

## 14 -- Attestation mutuelle renforcee

### Principe

La confiance doit etre **bidirectionnelle** :
- Le **mobile verifie le desktop** (est-ce bien le bon PC ?)
- Le **desktop verifie le mobile** (est-ce bien le bon telephone ?)

### Implementation

- Communication attestee avec **challenge-response** derivee du hash du binaire
- Verification que le desktop tourne la **bonne version signee**
- Si la verification echoue : refuser la connexion, alerter l'utilisateur

### Mecanisme

1. Le mobile envoie un challenge aleatoire
2. Le desktop repond avec HMAC(challenge, hash_binaire_signe)
3. Le mobile verifie la reponse contre le hash attendu
4. Processus inverse : le desktop challenge le mobile

**Source** : COMPLEMENT_MOBILE_3_2026.md, COMPLEMENT_DESKTOP_3_2026.md

---

## Sources

- CYBERSEC_MOBILE.md sections 13.1-13.8
- CYBERSEC_DESKTOP.md sections 14.1-14.10
- COMPLEMENT_MOBILE_3_2026.md
- COMPLEMENT_DESKTOP_3_2026.md
