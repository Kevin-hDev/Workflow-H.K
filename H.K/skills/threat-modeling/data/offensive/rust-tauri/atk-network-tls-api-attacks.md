# network-tls-api-attacks.md
# Base de connaissance offensive — Réseau, TLS, API et fingerprinting

## Vue d'ensemble

Une application desktop Rust/Tauri communiquant simultanément avec des APIs LLM, des services de scraping, des traducteurs et des flux RSS expose une surface d'attaque réseau considérable. Les vecteurs offensifs couvrent la chaîne complète : négociation TLS, gestion des redirections HTTP, fuites DNS, interception proxy, et détection/contournement des systèmes anti-bot.

Les bibliothèques impliquées — `reqwest` (Rust), `requests`/`urllib3` (Python), Playwright (Chromium) — ont des comportements TLS et des fingerprints radicalement différents. Chacune ouvre des vecteurs distincts.

---

## 1. TLS Downgrade Attacks

### Vecteur : forcer TLS 1.2 ou inférieur

**Prérequis :** position MITM ou contrôle du réseau intermédiaire

**Étapes :**
1. Intercepter le ClientHello TLS de la cible
2. Modifier ou forcer la négociation vers TLS 1.2 via une configuration OpenSSL contrainte (`ssl_minimum_protocol = TLSv1.2`)
3. Sur `requests` Python, le minimum TLS dépend d'OpenSSL système — pas de contrainte applicative par défaut
4. Sur `reqwest` v0.13+, le backend par défaut est rustls (TLS 1.2 minimum), configurable via `tls_version_min`
5. Les connexions TLS 1.2 restent vulnérables à BEAST (CBC), POODLE si SSLv3 accepté, et Lucky13

**Impact :** déchiffrement du trafic si cipher suites faibles acceptées (3DES, RC4), ou exploitation d'attaques connues sur les modes CBC.

**Pattern de détection :** vérifier le minimum TLS configuré dans le code Rust
```
grep -rn "tls_version_min\|TLS_1_2\|TLSv1_2\|minimum_version" --include="*.rs" --include="*.py"
```

---

## 2. API Key Leak via Redirect — Headers non-standard non supprimés

### Vecteur : fuite des clés API lors de redirections cross-domaine

**Prérequis :** aucun (vecteur passif, la cible se compromet elle-même)

**Étapes :**
1. `requests` Python supprime l'en-tête `Authorization: Bearer` lors des redirections cross-domaine (depuis v2.4.3)
2. **Mais `x-api-key` (Anthropic) et `Ocp-Apim-Subscription-Key` (Azure Translator) ne sont PAS supprimés** — ce sont des en-têtes non-standard hors de la logique de protection par défaut
3. Si un endpoint LLM est compromis ou redirige vers un domaine attaquant, la clé est envoyée en clair au serveur de destination
4. Scénario : DNS poisoning ou BGP hijacking du domaine `api.anthropic.com` → redirection 301/302 vers domaine contrôlé → `x-api-key` transmis en clair

**Providers vulnérables :**
- Anthropic : header `x-api-key` — non protégé par le strip automatique
- Azure Translator : header `Ocp-Apim-Subscription-Key` — non protégé
- Azure OpenAI : header `api-key` — non protégé
- Google Gemini : header `x-goog-api-key` — non protégé
- Apify en mode query param : `?token=apify_api_...` — visible dans les logs serveur, referer headers, et l'URL complète

**Impact :** exfiltration silencieuse de la clé API, facturation sur le compte de la victime, accès aux données/conversations.

**Code vulnérable typique :**
```python
# Vulnérable : les headers custom survivent aux redirections
response = session.post(
    "https://api.anthropic.com/v1/messages",
    headers={"x-api-key": api_key, "anthropic-version": "2023-06-01"},
    json=payload,
    timeout=60,
    # allow_redirects=True par défaut — manque de allow_redirects=False
)
```

**Pattern de détection :**
```
grep -rn "allow_redirects" --include="*.py"
# Absence de allow_redirects=False sur les appels API = vulnérable
grep -rn "x-api-key\|Ocp-Apim\|ocp-apim\|api-key" --include="*.py" --include="*.rs"
```

---

## 3. JA4+ Fingerprinting — Détection et blocage bots

### Vecteur : identification de l'application comme bot au niveau du handshake TLS

**Prérequis :** contrôle du serveur cible, ou système WAF interposé (AWS WAF, Cloudflare)

**Mécanisme d'attaque (côté défenseur = vecteur d'identification pour l'adversaire) :**

JA4+ (FoxIO) est le successeur de JA3 depuis 2025. Il produit un hash lisible (`t13_17_15ae45e35b_...`) en triant les cipher suites et extensions avant hachage, ce qui le rend résistant à la randomisation de Chrome v110+. AWS WAF a ajouté le support JA4 en mars 2025, Cloudflare suit.

**Le fingerprint TLS de `requests` Python est identifiable comme bot avant tout échange HTTP** :
- OpenSSL produit un ensemble de cipher suites distinct de tout navigateur
- ALPN souvent `http/1.1` uniquement (les navigateurs annoncent `h2,http/1.1`)
- Extensions TLS absentes ou dans un ordre non-navigateur
- Le blocage intervient au niveau du ClientHello — un User-Agent parfait ne sauvera pas la requête

**Fingerprints par outil :**

| Outil | Fingerprint TLS | Fingerprint HTTP/2 | Détectable |
|-------|-----------------|-------------------|------------|
| `requests` Python | OpenSSL, bot évident | Pas de HTTP/2 natif | Oui, immédiatement |
| `httpx` Python | OpenSSL, bot détectable | Valeurs par défaut non-navigateur | Oui |
| `reqwest` Rust (rustls) | rustls, fingerprint distinct | HTTP/2 natif mais non-Chrome | Oui, selon config |
| Playwright standard | BoringSSL/Chromium, authentique TLS | Authentique Chrome | TLS non, mais `navigator.webdriver=true` |
| `curl_cffi` | BoringSSL Chrome, authentique | Chrome authentique | Non (en mode impersonate) |
| Patchright | BoringSSL Chromium patché | Chrome authentique | Non |

**Impact pour l'attaquant :** identification de l'automatisation → blocage silencieux (faux 200, contenu dégradé) ou CAPTCHA.

**Technique offensive pour contourner :**
- `curl_cffi` avec `impersonate="chrome124"` reproduit le fingerprint TLS ET HTTP/2 de Chrome
- Patchright évite la commande CDP `Runtime.enable` qui est le signal principal détecté par Cloudflare/DataDome
- La cohérence multicouche est obligatoire : TLS Chrome + HTTP/2 Chrome + en-têtes navigateur + comportement JS

---

## 4. HTTP/2 Frame Fingerprinting — INITIAL_WINDOW_SIZE Discrepancy

### Vecteur : détection via les paramètres du frame SETTINGS HTTP/2

**Mécanisme :**

Les systèmes anti-bot analysent le frame SETTINGS HTTP/2 envoyé au démarrage de la connexion :
- `HEADER_TABLE_SIZE` : taille de la table de compression HPACK
- `INITIAL_WINDOW_SIZE` : fenêtre de contrôle de flux initiale
- `MAX_CONCURRENT_STREAMS` : nombre de streams parallèles
- Ordre des pseudo-en-têtes (`:method`, `:path`, `:scheme`, `:authority`)
- WINDOW_UPDATE frame

**Discrepancy Chrome vs Python :**
- Chrome envoie `INITIAL_WINDOW_SIZE: 6291456` + WINDOW_UPDATE de **15663105**
- Python `httpx` envoie les valeurs par défaut RFC : `65535`
- Écart : **96×** — immédiatement détectable

**Réponse des CDN :** Cloudflare, Akamai, et DataDome utilisent cette signature pour identifier les bots à la couche HTTP/2, indépendamment du TLS. Bloquer ou dégrader les requêtes avec des paramètres HTTP/2 non-navigateur.

**Pattern de détection dans le code :**
```
grep -rn "http2\|h2\|HTTP2\|SETTINGS\|window_size" --include="*.rs" --include="*.py"
```

---

## 5. CVE-2025-66418 — urllib3 DoS par décompression illimitée

**CVSS : 8.9 (High)**
**Affecte :** urllib3 < 2.6.0
**Corrigé dans :** urllib3 2.6.0

**Description :** urllib3 ne limitait pas la taille des corps de réponse décompressés (gzip, deflate, brotli). Un serveur malveillant ou compromis peut envoyer un corps compressé de quelques Ko qui se décompresse en plusieurs Go — attaque de type "zip bomb".

**Vecteur d'exploitation :**
1. Contrôler ou compromettre un endpoint interrogé par l'application
2. Retourner un corps de réponse compressé avec ratio d'expansion >1000:1
3. La bibliothèque urllib3 décompresse en RAM sans limite
4. Le processus Python épuise la mémoire disponible → OOM Kill

**Applications vulnérables :** tout code Python utilisant `requests` ou `urllib3` directement pour appeler des APIs ou scraper des URLs — flux RSS, APIs LLM tierces, services de scraping.

**CVEs liées de la même période :**
- **CVE-2025-66471** : consommation excessive de ressources en streaming (urllib3 < 2.6.0)
- **CVE-2025-50181** : contournement de contrôle des redirections (urllib3 < 2.5.0)
- **CVE-2025-50182** : contournement de contrôle des redirections (urllib3 < 2.5.0)

**Pattern de détection :**
```
grep -rn "urllib3\|requests" requirements*.txt pyproject.toml setup.py
# Chercher urllib3 < 2.6.0 ou absence de version pinnée
```

---

## 6. RUSTSEC-2025-0004 — openssl crate use-after-free

**Affecte :** crate `openssl` (backend de `native-tls`)
**Type :** use-after-free
**Contexte :** reqwest v0.12 et antérieur utilisant `native-tls` backend

**Description :** use-after-free dans le crate `openssl` Rust. Un attaquant capable de provoquer un comportement spécifique dans la gestion des connexions TLS peut exploiter cette vulnérabilité.

**Impact :** potentiellement exécution de code arbitraire ou crash du processus Rust/Tauri.

**Contexte applicatif :** la migration de reqwest v0.13 vers rustls par défaut (décembre 2025) élimine cette surface d'attaque. Les applications restant sur `reqwest` < v0.13 avec feature `native-tls` restent exposées.

**Pattern de détection :**
```
grep -rn "native-tls\|openssl" Cargo.toml Cargo.lock
# reqwest avec feature native-tls = exposé à RUSTSEC-2025-0004
```

---

## 7. DNS Leak via socks5:// vs socks5h://

### Vecteur : exposition des domaines visités au résolveur local/FAI

**Prérequis :** l'application utilise un proxy SOCKS5

**Mécanisme :**
- `socks5://proxy:1080` → résolution DNS côté client (locale), seulement l'IP envoyée au proxy → **fuite DNS**
- `socks5h://proxy:1080` → résolution DNS côté proxy (distante), le nom de domaine est envoyé au proxy → pas de fuite

**Exploitation :**
1. Observer le trafic DNS local (Wireshark, DNS local malveillant)
2. Chaque résolution DNS révèle les domaines contactés par l'application, même si le contenu est chiffré
3. Sur macOS Apple Silicon avec Python via pyenv : `socks5h://` peut néanmoins fuiter le DNS localement (issue psf/requests#6086 — bug non corrigé)

**Impact :** cartographie des APIs appelées, détection du comportement de scraping, corrélation d'identités.

**Pattern de détection :**
```
grep -rn "socks5://" --include="*.py" --include="*.rs"
# socks5:// sans le 'h' = fuite DNS garantie
```

---

## 8. MITM sur Proxy Non Authentifié

### Vecteur : interception transparente via proxy résidentiel

**Mécanisme :**

Les credentials proxy (username:password) transitent en clair dans les deux protocoles :
- En-tête `Proxy-Authorization` (HTTP CONNECT) : transmis en clair avant le tunnel TLS
- Sous-protocole d'authentification SOCKS5 (RFC 1929) : non chiffré entre client et proxy

**Exploitation sur proxy malveillant :**
1. Un proxy résidentiel d'origine douteuse est positionné comme MITM
2. Il peut inspecter les métadonnées (domaines contactés, timing)
3. Pour les connexions HTTPS, il présente un faux certificat signé par sa propre CA
4. Si la CA du proxy est installée dans le truststore de la machine cible, le MITM est transparent

**Détection d'un proxy MITM :** l'émetteur du certificat serveur reçu sera la CA du proxy (ex. "Zscaler Root CA", "Blue Coat", "Forcepoint") au lieu de la CA légitime (DigiCert, Let's Encrypt). Inspecter le champ `issuer` du certificat reçu.

**Fuite WebRTC dans Playwright :**
WebRTC utilise STUN/TURN via UDP et **contourne le tunnel proxy**, révélant l'IP réelle même derrière un SOCKS5. Le flag Chromium `--webrtc-ip-handling-policy=disable_non_proxied_udp` est requis — son absence est exploitable pour démasquer l'IP réelle.

**Pattern de détection :**
```
grep -rn "proxy\|PROXY\|socks" --include="*.py" --include="*.rs"
grep -rn "webrtc\|WebRTC\|RTCPeerConnection" --include="*.py" --include="*.js"
# Absence de disable_non_proxied_udp dans les args Playwright = fuite IP possible
```

---

## 9. Certificate Pinning Bypass Techniques

### Vecteur : contournement du pinning pour intercepter les communications API

**Types de pinning et techniques de bypass :**

**1. Pinning de certificat complet (leaf) :**
- Bypass : obtenir un nouveau certificat pour le même domaine (Let's Encrypt, DV SSL)
- Le pinning complet ne survit pas au renouvellement

**2. SPKI pinning (clé publique) :**
- Bypass : si le fournisseur génère une nouvelle paire de clés lors du renouvellement
- Survit si la même paire de clés est réutilisée

**3. Absence de pinset de secours :**
- Si le seul pin expire/change, l'application est bloquée — contrainte pour forcer une mise à jour

**4. HPKP (obsolète depuis 2018) :**
- Attaque de "pin bombing" : un attaquant peut épingler sa propre CA → DoS permanent

**Vecteur desktop spécifique :**
- Installer un certificat CA dans le truststore OS contourne tout pinning basé sur `certifi` Python
- `mitmproxy --ssl-insecure` + CA installée dans le truststore = MITM complet sans erreur
- reqwest avec `rustls-platform-verifier` utilise le truststore OS → vulnérable si CA mitmproxy installée

**Pattern de détection :**
```
grep -rn "pinning\|pin_cert\|certificate\|PinningAdapter\|SPKI" --include="*.py" --include="*.rs"
grep -rn "danger_accept_invalid_certs\|verify=False\|ignore_https_errors" --include="*.rs" --include="*.py"
```

---

## 10. Comparaison Fingerprint : requests / Playwright / reqwest

### Tableau d'identification TLS/HTTP par outil

| Attribut | requests | httpx | Playwright (standard) | reqwest (rustls) | curl_cffi |
|-----------|----------|-------|----------------------|------------------|-----------|
| Backend TLS | OpenSSL via urllib3 | OpenSSL | BoringSSL (Chromium) | rustls | BoringSSL |
| JA3/JA4 | Bot évident | Bot détectable | Chromium authentique | Distinct navigateur | Chrome/Safari |
| HTTP/2 | Non natif | Oui, non-Chrome | Natif Chrome | Natif, non-Chrome | Chrome authentique |
| INITIAL_WINDOW_SIZE | 65535 (défaut) | 65535 (défaut) | 6291456 (Chrome) | Variable | 6291456 (Chrome) |
| navigator.webdriver | N/A | N/A | `true` (détectable) | N/A | N/A |
| ALPN | http/1.1 | h2, http/1.1 | h2, http/1.1 | h2, http/1.1 | h2, http/1.1 |

**Insight critique :** les systèmes anti-bot utilisent une détection multicouche. Usurper TLS uniquement (curl_cffi) tout en gardant des en-têtes Python déclenche toujours la détection. La cohérence sur toutes les couches simultanément est obligatoire.

---

## Table des CVEs

| CVE / Advisory | CVSS | Composant affecté | Version vulnérable | Corrigé dans | Type |
|----------------|------|-------------------|--------------------|--------------|------|
| CVE-2025-66418 | 8.9 | urllib3 | < 2.6.0 | 2.6.0 | DoS décompression illimitée |
| CVE-2025-66471 | — | urllib3 | < 2.6.0 | 2.6.0 | DoS streaming ressources |
| CVE-2025-50181 | — | urllib3 | < 2.5.0 | 2.5.0 | Redirect control bypass |
| CVE-2025-50182 | — | urllib3 | < 2.5.0 | 2.5.0 | Redirect control bypass |
| RUSTSEC-2025-0004 | — | crate openssl (native-tls) | reqwest < 0.13 | reqwest 0.13+ (rustls) | Use-after-free TLS |

---

## Grep Patterns — Détection des vulnérabilités

```bash
# 1. TLS désactivé ou dégradé
grep -rn "verify=False\|verify = False\|danger_accept_invalid_certs\|ignore_https_errors=True" .

# 2. Headers non-standard survivant aux redirections
grep -rn "x-api-key\|Ocp-Apim\|api-key\|x-goog-api-key" --include="*.py" --include="*.rs"
grep -rn "allow_redirects" --include="*.py"
# Chercher les appels API sans allow_redirects=False

# 3. DNS leak via proxy SOCKS5
grep -rn "socks5://" --include="*.py" --include="*.rs"
# socks5:// sans 'h' = fuite DNS

# 4. urllib3 version vulnérable
grep -rn "urllib3" requirements*.txt pyproject.toml setup.cfg
# Toute version < 2.6.0 est vulnérable à CVE-2025-66418

# 5. native-tls backend (RUSTSEC-2025-0004)
grep -rn "native-tls\|\"openssl\"" Cargo.toml Cargo.lock

# 6. WebRTC non désactivé dans Playwright
grep -rn "playwright\|Playwright" --include="*.py" -l
grep -rn "webrtc\|disable_non_proxied_udp" --include="*.py"
# Absence = fuite IP via WebRTC

# 7. Fingerprint bot détectable
grep -rn "requests\.get\|requests\.post\|session\.get\|session\.post" --include="*.py"
# Vérifier si curl_cffi est utilisé ou si le fingerprint est un vecteur

# 8. Pinning absent
grep -rn "PinningAdapter\|ssl_context\|cafile\|ca_cert" --include="*.py" --include="*.rs"
# Absence de pinning sur les endpoints critiques (OpenAI, Anthropic)

# 9. reqwest version avec native-tls
grep -A5 'reqwest' Cargo.toml | grep -E "native-tls|features"
```
