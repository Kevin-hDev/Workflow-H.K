# Condensé Recherche 15 — Sécuriser TypeScript contre toutes les attaques connues

> Uniquement ce qui est actionnable pour construire Outpost et Claude Unleashed.

---

## 1. Attaques classiques Node.js/TypeScript — Défenses concrètes

### Prototype pollution

L'attaquant injecte des propriétés via `__proto__` dans TOUS les objets de l'app.

**Défenses par priorité :**
1. `Object.create(null)` pour tous les dictionnaires (objets sans prototype)
2. `Map` et `Set` au lieu d'objets simples pour le stockage clé-valeur
3. `Object.freeze(Object.prototype)` en début d'app (peut casser certaines libs legacy)
4. `--disable-proto=delete` en flag Node.js (supprime `__proto__`)
5. Filtrer `__proto__`, `constructor`, `prototype` avant tout merge
6. Validation Zod `.strict()` sur toutes les données entrantes

### Command injection

```typescript
// ❌ INTERDIT — shell interprète les métacaractères
exec(`cat /uploads/${userInput}`);

// ✅ SÛR — pas de shell, arguments en tableau
execFile('cat', ['/uploads/' + path.basename(userInput)], { timeout: 5000 });

// ✅ MEILLEUR — API Node.js native, pas de processus externe
const safePath = path.join('/uploads', path.basename(filename));
fs.readFile(safePath, 'utf8', callback);
```

**Règles :**
- `exec()` = INTERDIT (lance `/bin/sh -c`)
- `execFile()` et `spawn()` = OK (exécution directe via `execve`)
- `spawn(cmd, args, { shell: true })` = INTERDIT (réintroduit la vulnérabilité)

### Path traversal

```typescript
function safePath(userInput: string, baseDir: string): string {
  const resolved = path.resolve(baseDir, userInput);
  if (!resolved.startsWith(path.resolve(baseDir) + path.sep)) {
    throw new Error('Path traversal detected');
  }
  const real = fs.realpathSync(resolved); // suit les symlinks
  if (!real.startsWith(path.resolve(baseDir) + path.sep)) {
    throw new Error('Symlink escape detected');
  }
  return real;
}
```

`path.normalize()` ne prévient RIEN, il normalise seulement.

### ReDoS (Regex Denial of Service)

Node.js = single-threaded. Une regex catastrophique bloque TOUT.

```typescript
// ❌ DANGEREUX — quantificateurs imbriqués
/(a+)+$/           // backtracking exponentiel

// ✅ Utiliser RE2 (moteur à temps linéaire garanti)
const RE2 = require('re2');
const pattern = new RE2('pattern');

// ✅ Ou des bibliothèques de validation
const validator = require('validator');
validator.isEmail(input); // au lieu d'une regex email custom
```

Outils de détection : `safe-regex`, `re2`, `eslint-plugin-security` (règle `detect-unsafe-regex`)

### SSRF

- Résoudre le DNS, puis valider l'IP contre blocklist (127.0.0.0/8, 10.0.0.0/8, etc.)
- Désactiver les redirections automatiques
- Restreindre aux protocoles HTTPS uniquement
- Bibliothèque : `ssrf-agent-guard`

### Désérialisation

- `JSON.parse()` = **SÛR** (données uniquement, pas d'exécution)
- `node-serialize` = **INTERDIT** (utilise `new Function()`)
- `serialize-javascript` = **INTERDIT** (utilise `eval()`)

### Dependency confusion

- Utiliser des scopes npm (`@company/package`)
- Configurer `.npmrc` avec registres scopés
- Placer des paquets placeholder sur le registre public

---

## 2. Supply chain npm — Stratégie de défense

### npm audit seul est insuffisant

Ne détecte que les CVE connues. Aucune détection de malware zero-day, code obfusqué, exfiltration. Taux de faux positifs >99% pour le front-end.

### Stack de scanning recommandé

| Outil | Rôle |
|---|---|
| `npm audit --omit=dev` | CVE connues (devDeps exclues) |
| **Socket** (socket.dev) | Analyse comportementale du code source des paquets |
| **Snyk** | CVE approfondies + precision patches |
| **lockfile-lint** | Intégrité du lockfile |
| **NodeSecure** | Open source, analyse statique multi-sources |

### Incidents à retenir (pourquoi c'est critique)

- **454 648 paquets malveillants** publiés en 2025 (Sonatype)
- **Ver Shai-Hulud** : auto-réplicant, 500+ paquets compromis (Zapier, PostHog, Postman)
- **chalk/debug compromis** : 2,6 milliards de DL hebdo touchés
- **Lazarus (Corée du Nord)** : 800+ paquets malveillants attribués

### Configuration `.npmrc` recommandée

```ini
save-exact=true          # Versions exactes, pas de ranges
ignore-scripts=true      # Désactiver les lifecycle scripts par défaut
```

### Pipeline CI/CD sécurisée

```bash
npm ci --ignore-scripts → lockfile-lint → npm audit --omit=dev → Socket scan → Snyk test → npm audit signatures
```

### Remplacements natifs Node.js (moins de dépendances)

| Au lieu de | Utiliser |
|---|---|
| axios | `fetch()` (natif) |
| uuid | `crypto.randomUUID()` |
| glob | `fs.glob()` (Node 22+) |
| chalk | `util.styleText()` (Node 21+) |

### Lockfile-lint

```bash
npx lockfile-lint --path package-lock.json --type npm \
  --allowed-hosts npm --validate-https --validate-integrity
```

**pnpm est intrinsèquement plus sûr** : son lockfile ne contient pas d'URLs de tarballs.

### npm provenance

- Utilise Sigstore pour lier publication → dépôt source + CI/CD
- Seulement 12,6% d'adoption
- Ne garantit PAS l'absence de malware (juste la traçabilité)

---

## 3. Risques spécifiques LLM + TypeScript

### Code IA = 40% vulnérable

- 40% du code généré par LLM contient des vulnérabilités (Veracode 2025)
- Les développeurs sont **plus confiants** en la sécurité du code IA alors qu'il est **moins sécurisé** (Stanford)
- Taux secure-pass@1 < 12% même quand le taux fonctionnel dépasse 50%
- Vulnérabilités les plus fréquentes : validation manquante, command injection, XSS, credentials hardcodés

### Slopsquatting (hallucinations → armes)

Les LLM inventent des noms de paquets npm → un attaquant les publie avec du malware.
- 19,7% des échantillons de code LLM référencent des paquets hallucinés
- 205 474 noms de paquets uniques hallucinés
- `huggingface-cli` halluciné → enregistré → 30 000 téléchargements authentiques en 3 mois

### `vm`, `vm2`, `isolated-vm` — Aucun n'est un sandbox fiable

```typescript
// Évasion triviale de vm.runInNewContext()
vm.runInNewContext('this.constructor.constructor("return process")().exit()');
```

- `node:vm` = documentation officielle dit "Do not use it to run untrusted code"
- `vm2` = 8+ CVE critiques d'évasion, dont CVE-2026-22709 (CVSS 9.8)
- `isolated-vm` = meilleure isolation V8 mais aucune API Node.js

**Pour du code non fiable → isolation conteneur/microVM uniquement** (gVisor, Firecracker)

### Fichiers de config = surface d'attaque (Check Point Research)

- `.claude/settings.json` — hooks malveillants exécutés automatiquement
- `.mcp.json` — bypass consentement MCP
- `ANTHROPIC_BASE_URL` — exfiltration clé API
- `.cursorrules` — instructions cachées pour code backdooré

**Leçon :** Ouvrir un projet non fiable = risque d'exécution de code.

---

## 4. Hardening Node.js/TypeScript en production

### Permission Model Node.js (stable depuis v23.5.0)

```bash
node --permission \
  --allow-fs-read=/app/src,/app/config \
  --allow-fs-write=/app/logs,/tmp \
  --allow-net \
  server.js
```

**Limitation :** C'est un "seat belt model" — protège le code fiable d'accès accidentels. Pour du code non fiable → isolation conteneur/microVM.

### TypeScript `tsconfig.json` sécurisé

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**`noUncheckedIndexedAccess`** = option la plus importante pour la sécurité, NON incluse dans `strict: true`.

### Validation d'entrée — Zod

```typescript
import { z } from 'zod';

const RequestSchema = z.object({
  email: z.string().email().max(254),
  role: z.enum(['user', 'admin']),
  data: z.record(z.string(), z.unknown()),
}).strict(); // Rejette toute clé non déclarée

type ValidatedRequest = z.infer<typeof RequestSchema>;
```

Zod = meilleur compromis TS en 2026. AJV + TypeBox = 7x plus rapide si performance critique.

### ESLint sécurisé

```javascript
// eslint.config.mjs
import pluginSecurity from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';

export default [
  ...tseslint.configs.recommendedTypeChecked,
  pluginSecurity.configs.recommended,
  {
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      '@typescript-eslint/no-implied-eval': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-child-process': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-bidi-characters': 'error',
      'no-restricted-properties': ['error', {
        object: 'child_process', property: 'exec',
        message: 'Use execFile() to prevent command injection'
      }],
    }
  }
];
```

Plugins : `eslint-plugin-security` (14 règles) + `@microsoft/eslint-plugin-sdl`

### Crypto en 2026

| Usage | Choix |
|---|---|
| Hash mots de passe | Argon2id (memory=64MB, iterations=3, parallelism=1) |
| Hash acceptable | bcrypt work factor 13-14 (~250-500ms) |
| Chiffrement symétrique | AES-256-GCM |
| Comparaison de hashes | `crypto.timingSafeEqual()` — JAMAIS `===` |
| JWT | EdDSA (Ed25519) — 62x plus rapide que RSA-2048 |
| Bibliothèque JWT | `jose` v6.x (zéro dépendances, ESM universel) |

---

## 5. Sécurité réseau et API pour apps agent

### WebSocket — Pas de protection CORS native

```typescript
const wss = new WebSocket.Server({
  verifyClient: (info) => {
    const allowed = ['https://app.example.com'];
    return allowed.includes(info.origin);
  }
});
```

**Recommandation :** Auth par token (pas par cookie) — JWT dans le premier message WebSocket.

### DNS rebinding — "localhost est sûr" est un MYTHE

Défenses obligatoires pour tout service localhost :
1. Valider header `Host` contre allowlist
2. Binder sur `127.0.0.1`, JAMAIS `0.0.0.0`
3. Auth par token (pas juste la localité réseau)
4. Valider header `Origin` sur toutes les connexions WebSocket
5. Rate limiting MÊME pour localhost

### IPC sécurisé

- **Unix Domain Sockets** = meilleures performances, non accessibles par réseau
- Permissions fichier `chmod 0600` + auth par token (les permissions seules ne suffisent pas)

### Stockage de tokens

| Méthode | Sécurité |
|---|---|
| `process.env` | ❌ Hérité par enfants, visible via `/proc`, exposé par `docker inspect` |
| OS Keychain (via `keytar`) | ✅ macOS Keychain, Windows Credential Vault, Linux libsecret |
| Mémoire runtime (classes privées `#tokens`) | ✅ Pour processus serveur |
| Fichiers chiffrés AES-256-GCM | ✅ Clé maîtresse en env var |

---

## 6. Checklist actions immédiates

1. **CI/CD :** `npm ci --ignore-scripts` → lockfile-lint → `npm audit --omit=dev` → Socket → Snyk → `npm audit signatures`
2. **ESLint :** eslint-plugin-security + @typescript-eslint/recommended-type-checked + bannir eval/Function/exec
3. **Node.js Permission Model** en production
4. **Tout code LLM = non fiable :** analyse statique obligatoire, exécution en microVM, audit fichiers config
5. **WebSocket :** validation Origin, auth par token, rate limiting sur localhost
6. **tsconfig.json :** `strict: true` + `noUncheckedIndexedAccess: true`
7. **Zod `.strict()`** sur toutes les entrées externes
