# Patterns de Validation Croisee -- Base de connaissances defensive
# Skill : defensive-hardening | Fichier knowledge
# Usage : Phase P7 uniquement

---

## 1 -- Principe de Validation Croisee

La validation croisee compare les resultats du skill `adversary-simulation-flutter` avec les protections ecrites par `defensive-hardening`. L'objectif est de s'assurer qu'aucune faille identifiee ne reste sans contre-mesure.

---

## 2 -- Mapping Categories Attaque -> Defense

| Categorie attaque | Categories defense correspondantes |
|-------------------|-----------------------------------|
| SSH | RT (temps constant, memoire), SC (hardware keystore, rotation) |
| NET | NW (pinning, fail closed, heartbeat) |
| TS | NW (pinning, proxy detection), RT (validation) |
| FLT | FW (anti-screenshot, tapjacking), AR (obfuscation, RASP) |
| CRY | RT (CSPRNG, nonce, temps constant) |
| STO | SC (hardware keystore, rotation), RT (memoire) |
| PHY | FW (biometrie), DC (kill switch, duress PIN) |
| SOC | FW (confirmation progressive), DC (canary tokens) |
| SUP | AR (integrite runtime, signature binaire), DC (slopsquatting monitoring) |
| AI | DC (behavioral analysis, agents IA detection, rate limiting), AR (anti-debug, anti-Frida WebSocket), BH (behavioral anomaly IA patterns) |

---

## 3 -- Matrice de Couverture Type

```
               | RT | FW | SC | NW | OS | AR | DC | BH |
SSH attacks    | XX | .  | XX | .  | .  | .  | .  | .  |
NET attacks    | .  | .  | .  | XX | .  | .  | .  | .  |
TS attacks     | X  | .  | .  | XX | .  | .  | .  | .  |
FLT attacks    | .  | XX | .  | .  | .  | XX | .  | .  |
CRY weaknesses | XX | .  | X  | .  | .  | .  | .  | .  |
STO attacks    | X  | .  | XX | .  | .  | .  | .  | .  |
PHY attacks    | .  | X  | .  | .  | X  | .  | XX | .  |
SOC attacks    | .  | X  | .  | .  | .  | .  | X  | X  |
SUP attacks    | .  | .  | .  | .  | .  | XX | .  | .  |
AI attacks     | .  | .  | .  | X  | .  | XX | XX | XX |

XX = defense principale, X = defense complementaire, . = non applicable
```

---

## 4 -- Niveaux de Couverture

| Niveau | Definition | Action |
|--------|-----------|--------|
| Complete | Au moins un FIX bloque entierement le vecteur d'attaque | Documenter |
| Partielle | Le FIX reduit le risque mais ne l'elimine pas | Documenter le risque residuel |
| Aucune | Aucun FIX ne contrecarre cette attaque | Justifier (hors scope, impossible, acceptation de risque) |

---

## 5 -- Pattern de Verification

Pour chaque VULN-xxx du rapport adversary-simulation-flutter :

```
1. Identifier la categorie d'attaque (SSH, NET, TS, etc.)
2. Consulter la matrice de mapping (section 2)
3. Chercher les FIX-xxx dans les categories defense correspondantes
4. Evaluer si le FIX contrecarre la VULN
5. Attribuer le niveau de couverture
6. Si partielle/aucune : documenter le risque residuel
```

---

## 6 -- Risques Acceptables

Certaines vulnerabilites ne peuvent pas etre contrecarrees par du code :

| Type | Exemple | Raison |
|------|---------|--------|
| Infrastructure | IMSI catchers | Necessite modification operateur mobile |
| Protocole | WOL sans authentification | Limitation du protocole WOL |
| Hardware | Evil Maid sans chiffrement disque | Necessite action utilisateur (activer BitLocker/LUKS) |
| Upstream | CVE dans Tailscale/dartssh2 | Necessite patch upstream |

Ces risques doivent etre documentes avec une recommandation d'action pour l'utilisateur.

---

## Sources

- Architecture adversary-simulation-flutter : categories d'attaque
- Architecture defensive-hardening : categories de defense
- OWASP Defense in Depth
