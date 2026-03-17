# Hardening OS via l'App Desktop -- Base de connaissances defensive
# Skill : defensive-hardening | Fichier knowledge
# Source : CYBERSEC_DESKTOP.md section 12

---

## 1 -- Windows Defender Application Control (WDAC)

Configurer des politiques WDAC pour whitelister uniquement les binaires signes de l'app. Bloquer l'execution de code non signe.

**Source** : CYBERSEC_DESKTOP.md section 12.1

---

## 2 -- Linux AppArmor / SELinux profiles

Generer automatiquement un profil AppArmor restrictif pour le service SSH. Limiter fichiers accessibles, capabilities reseau.

### Exemple profil AppArmor

```
#include <tunables/global>

/opt/chill/chill_desktop {
  #include <abstractions/base>
  #include <abstractions/nameservice>

  # Acces reseau limite
  network inet stream,
  network inet6 stream,

  # Fichiers autorises
  /opt/chill/** r,
  /home/*/.config/chill/ rw,
  /home/*/.ssh/authorized_keys r,

  # Interdire l'acces aux autres cles SSH
  deny /home/*/.ssh/id_* rw,

  # Interdire l'elevation de privileges non autorisee
  deny /usr/bin/sudo x,
  deny /usr/bin/su x,
}
```

**Source** : CYBERSEC_DESKTOP.md section 12.2

---

## 3 -- macOS Sandbox entitlements

Limiter les acces de l'app (pas de camera, micro, contacts, acces reseau limite).

**Source** : CYBERSEC_DESKTOP.md section 12.3

---

## 4 -- Firewall rules automation

L'app genere des regles iptables/nftables (Linux), Windows Firewall, pf (macOS) autorisant le SSH QUE depuis les IPs Tailscale. Bloquer tout le reste.

### Exemple Linux (nftables)

```bash
# Autoriser SSH uniquement depuis le reseau Tailscale
nft add rule inet filter input ip saddr 100.64.0.0/10 tcp dport 22 accept
nft add rule inet filter input tcp dport 22 drop
```

**Source** : CYBERSEC_DESKTOP.md section 12.4

---

## 5 -- Templates de configuration predefinies

PAS de commandes dynamiques pour configurer l'OS. Templates signes, hashes. Backup avant modification. Verification post-application.

### Securisation critique

```dart
// VULNERABLE : commande construite dynamiquement
final cmd = 'ufw allow from $ip to any port $port';
Process.run('pkexec', ['/bin/sh', '-c', cmd]); // INJECTION POSSIBLE

// SECURISE : template avec validation stricte
if (!RegExp(r'^[0-9.]+$').hasMatch(ip)) throw ArgumentError('IP invalide');
if (port < 1 || port > 65535) throw ArgumentError('Port invalide');
// Utiliser un template pre-signe, pas de concatenation
```

**Source** : CYBERSEC_DESKTOP.md section 12.5

---

## 6 -- Android 16 (API 36 "Baklava")

### Timeout foreground service 6h dataSync

Migration vers `connectedDevice` IMPERATIVE. Le type `dataSync` expire apres 6h, ce qui tue les sessions SSH longues. Le type `connectedDevice` est exempt de ce timeout.

### Permission reseau local NEARBY_WIFI_DEVICES pour WOL

L'envoi de paquets WOL (Wake-on-LAN) sur le reseau local necessite la permission `NEARBY_WIFI_DEVICES`. A partir d'Android 17+, une demande explicite a l'utilisateur est requise.

### Advanced Protection Mode

- Bloque USB lorsque le telephone est verrouille (anti Juice Jacking)
- Empeche le sideloading (installation d'APK hors Play Store)
- API `AdvancedProtectionManager` : detecter si le mode est actif et adapter le comportement de l'app

### accessibilityDataSensitive flag

Protege les ecrans sensibles (terminal SSH, saisie de mots de passe, affichage de cles) contre les services d'accessibilite malveillants. A appliquer sur chaque widget contenant des donnees sensibles.

### Alignement 16Ko pages memoire

Recompiler toutes les libs natives avec NDK 27+. L'alignement 16Ko est obligatoire sur Android 16. Les libs compilees en 4Ko planteront.

### Intent redirection hardening

Tester systematiquement tous les deep links pour verifier qu'ils ne permettent pas de redirection vers des composants non exportes.

### Protection stations de base IRadio 3.0

Protection native contre les IMSI catchers via l'interface IRadio 3.0. Le systeme detecte et bloque les fausses stations de base.

**Source** : COMPLEMENT_MOBILE_3_2026.md

---

## 7 -- iOS 18.4

### Restriction mprotect()

- Casse le debug Flutter JIT sur device physique
- Hot reload impossible sur device physique
- Network Extensions impossible sur simulateur
- Mode Release AOT **non affecte** : aucun impact en production
- Impact : workflow de developpement uniquement, pas de risque en production

**Source** : COMPLEMENT_MOBILE_3_2026.md

---

## 8 -- iPhone 17 MIE (Memory Integrity Enforcement)

### 3 technologies combinaisons

1. **Allocateurs types** : `kalloc_type` / `xzone` -- chaque allocation est typee
2. **EMTE synchrone** : verification immediate des tags memoire a chaque acces
3. **Tag Confidentiality** : les tags sont secrets, non lisibles par l'attaquant

### Comportement

- Terminaison **immediate** du processus sur tag incorrect
- Bloque : buffer overflows, use-after-free, type confusion
- Toujours actif, integre dans le silicium, **NON desactivable**
- "L'ere des jailbreaks pourrait etre revolue" (Corellium)

### Pour les apps tierces

Activable via Xcode **Enhanced Security**. Recommande pour ChillShell iOS.

**Source** : COMPLEMENT_MOBILE_3_2026.md

---

## 9 -- iOS 26

### NEPacketTunnelProvider

Fortement recommande pour VPN/Tailscale. Utiliser `NEPacketTunnelProvider` plutot que les anciennes APIs reseau pour une meilleure integration avec le systeme.

**Source** : COMPLEMENT_MOBILE_3_2026.md

---

## 10 -- Packaging securise par OS

| OS | Format recommande | Raison |
|----|-------------------|--------|
| Windows | MSIX | Sandbox, signature obligatoire, mise a jour atomique, superieur a l'installeur classique |
| macOS | DMG notarise | Verification Apple Notarization, Gatekeeper, protection Translocation |
| Linux | Snap | Confinement AppArmor, superieur a Flatpak > .deb/.rpm > AppImage |

### Hierarchie Linux (du plus securise au moins securise)

1. **Snap** : confinement AppArmor, sandbox stricte
2. **Flatpak** : sandbox Bubblewrap, portails XDG
3. **.deb/.rpm** : pas de sandbox, mais integration systeme
4. **AppImage** : aucune sandbox, execution directe

**Source** : COMPLEMENT_DESKTOP_3_2026.md

---

## 11 -- Signature de code par OS

| OS | Outil | Details |
|----|-------|---------|
| Windows | `signtool` (Authenticode) | Signer tous les executables et DLLs, certificat EV recommande |
| macOS | Developer ID + notarisation | `codesign` + `xcrun notarytool`, Hardened Runtime obligatoire |
| Linux | GPG | Signer les paquets .deb/.rpm, verifier a l'installation |

La signature de code est la **premiere ligne de defense** contre le DLL sideloading et le remplacement de binaire.

**Source** : COMPLEMENT_DESKTOP_3_2026.md

---

## Sources

- CYBERSEC_DESKTOP.md sections 12.1-12.5
- COMPLEMENT_MOBILE_3_2026.md
- COMPLEMENT_DESKTOP_3_2026.md
