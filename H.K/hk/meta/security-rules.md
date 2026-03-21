# Règles de sécurité — 10 réflexes obligatoires

> Fichier rechargé à CHAQUE step. Non négociable. Aucune exception.

---

## RÈGLE 1 — Comparaison de secrets : temps constant uniquement

**INTERDIT :** `token == expected`, `hash === stored`, `key.equals(other)`
**OBLIGATOIRE :** Comparaison XOR byte par byte (temps constant)

```rust
// Rust
use subtle::ConstantTimeEq;
token.as_bytes().ct_eq(expected.as_bytes())

// Python
import hmac
hmac.compare_digest(token, expected)

// Node.js
crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
```

**Vérification :** Chercher `==` ou `.equals()` sur toute variable nommée
`token`, `secret`, `key`, `password`, `hash`, `hmac`, `signature`.

---

## RÈGLE 2 — Collections alimentées de l'extérieur : taille bornée

**INTERDIT :** Map/List/Set sans limite recevant des données extérieures.
**OBLIGATOIRE :** `maxSize` + politique d'éviction (LRU ou FIFO).

```rust
// Limiter à 10 000 entrées max, éviction FIFO
if cache.len() >= MAX_CACHE_SIZE {
    cache.pop_front();
}
```

**Vérification :** Toute collection alimentée par une requête HTTP, un
WebSocket, un fichier uploadé, ou un champ de formulaire.

---

## RÈGLE 3 — Secrets : jamais dans le code source

**INTERDIT :** Clés API, tokens, mots de passe, certificats en dur.
**OBLIGATOIRE :** Variable d'environnement ou keystore OS.

```rust
// Rust
let api_key = std::env::var("API_KEY")
    .expect("API_KEY must be set");

// Node.js
const apiKey = process.env.API_KEY ?? (() => {
    throw new Error("API_KEY not set");
})();
```

**Vérification :** Aucune chaîne ressemblant à un secret dans le code.
Grep : `sk_`, `pk_`, `Bearer `, `password =`, `secret =`.

---

## RÈGLE 4 — Entrées : validation stricte avant traitement

**INTERDIT :** Traiter une entrée sans valider type, longueur, format.
**OBLIGATOIRE :**
- SQL → prepared statements uniquement
- HTML → échappement systématique
- Chemins → interdire `..`, valider contre une liste blanche
- Longueur → rejeter au-delà du maximum défini

```rust
// Valider la longueur avant tout
if input.len() > MAX_INPUT_LENGTH {
    return Err(ValidationError::TooLong);
}
// Valider le format
if !EMAIL_REGEX.is_match(&input) {
    return Err(ValidationError::InvalidFormat);
}
```

---

## RÈGLE 5 — Erreurs visibles : zéro information interne

**INTERDIT :** Stack traces, chemins de fichiers, noms de tables, versions
de bibliothèques dans les messages d'erreur côté utilisateur.
**OBLIGATOIRE :** Message générique + log interne avec détails.

```rust
// INCORRECT
return Err("Database error at /app/src/db/users.rs:142: column 'email' not found");

// CORRECT
log::error!("DB query failed: {:?}", db_error); // log interne
return Err(AppError::Internal);                  // réponse utilisateur
```

---

## RÈGLE 6 — Tokens/IDs/Nonces : CSPRNG uniquement

**INTERDIT :** `Math.random()`, `rand::random()` non cryptographique,
timestamps, compteurs séquentiels pour tout secret.
**OBLIGATOIRE :** Source cryptographiquement sûre.

```rust
// Rust
use rand::rngs::OsRng;
use rand::RngCore;
let mut token = [0u8; 32];
OsRng.fill_bytes(&mut token);

// Node.js
const token = crypto.randomBytes(32).toString('hex');

// Python
import secrets
token = secrets.token_hex(32)
```

---

## RÈGLE 7 — Commandes système : arguments séparés, jamais concaténés

**INTERDIT :** `shell=True` avec interpolation, template strings dans exec.
**OBLIGATOIRE :** Liste d'arguments séparés, validation par regex avant.

```python
# INCORRECT
subprocess.run(f"git commit -m {user_input}", shell=True)

# CORRECT
if not re.match(r'^[\w\s\-\.]{1,100}$', user_input):
    raise ValueError("Invalid commit message")
subprocess.run(["git", "commit", "-m", user_input])
```

---

## RÈGLE 8 — Catch vide : interdit. Fail CLOSED.

**INTERDIT :** `catch {}`, `except: pass`, `_ => {}` silencieux.
**OBLIGATOIRE :** Logger l'erreur ET bloquer l'opération (pas de fallthrough).

```rust
// INCORRECT
if let Err(_) = authenticate(token) {
    // silencieux = l'utilisateur passe quand même
}

// CORRECT
authenticate(token).map_err(|e| {
    log::error!("Auth failed: {:?}", e);
    AppError::Unauthorized
})?;
```

---

## RÈGLE 9 — Logs : zéro donnée sensible

**INTERDIT :** Logger tokens, mots de passe, clés API, PII, données de
paiement — même en debug.
**OBLIGATOIRE :** Filtrer ou masquer avant tout log.

```rust
// INCORRECT
log::debug!("Auth request: token={}", token);

// CORRECT
log::debug!("Auth request: token=[REDACTED]");
log::debug!("Auth request: token_prefix={}", &token[..8]);
```

**Vérification :** Chercher `log::`, `console.log`, `print`, `println`
dans des fonctions contenant `token`, `password`, `key`, `secret`.

---

## RÈGLE 10 — Secrets en RAM : zéroïser après usage

**INTERDIT :** Laisser des secrets en mémoire après leur utilisation.
**OBLIGATOIRE :** Zéroïser le buffer, ne pas compter sur le GC.

```rust
// Rust — utiliser zeroize
use zeroize::Zeroize;
let mut password = load_password();
// ... utilisation ...
password.zeroize(); // efface en mémoire

// Node.js
buffer.fill(0);
```

---

## Checklist d'auto-vérification (avant chaque fonction)

Répondre à ces 5 questions. Un seul "non" = bloquer et corriger.

1. Si un attaquant contrôle cette entrée, que se passe-t-il ?
2. Si cette opération échoue, est-ce que ça bloque ou ça laisse passer ?
3. Est-ce que je compare des secrets avec `==` ?
4. Est-ce que cette collection peut grossir indéfiniment ?
5. Est-ce que ce message d'erreur révèle des informations internes ?
