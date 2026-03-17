# Backend JS/PHP — Sécurité 2025-2026 (condensé)

## Tableau synthétique CVEs critiques

| CVE | Framework | CVSS | Impact | Versions corrigées |
|-----|-----------|------|--------|-------------------|
| CVE-2025-55182 | Next.js/React RSC | **10.0** | RCE pré-auth | React 19.0.1+, Next.js 15.5.7+ |
| CVE-2025-29927 | Next.js middleware | **9.1** | Auth bypass complet | Next.js 15.2.3+ |
| CVE-2025-54782 | NestJS DevTools | **9.4** | RCE via CSRF | @nestjs/devtools 0.2.1+ |
| CVE-2024-47823 | Laravel Livewire | **9.8** | RCE via upload | Livewire 3.5.2+ |
| CVE-2022-29078 | EJS (Express) | **9.8** | RCE SSTI | EJS 3.1.7+ (partiel) |
| CVE-2025-54068 | Laravel Livewire | Critique | RCE sans auth | Livewire 3.6.4+ |
| CVE-2024-52301 | Laravel | **8.7** | Manipulation env | Laravel 11.31.0+ |
| CVE-2026-2293 | NestJS Fastify | **7.5** | Auth bypass | @nestjs/platform-fastify 11.1.14+ |
| CVE-2025-47935/44 | Express Multer | **7.5** | DoS mémoire/crash | Multer 2.0.0+ |
| CVE-2025-49826 | Next.js ISR | **7.5** | DoS persistant | Next.js 15.1.8+ |

---

## EXPRESS.JS

### Prototype pollution (CVE-2022-24999, CVSS 7.5)

```javascript
// ❌ VULN — __proto__[isAdmin]=true dans le body → bypass
const user = {}; Object.assign(user, req.body);
if (user.isAdmin) res.send("Admin Access");

// ✅ FIX — destructuration explicite, objet sans prototype
const { username, email } = req.body;
const user = Object.create(null); user.isAdmin = false;
```

**Impact** : DoS, auth bypass, XSS via gadgets `body`/`exposedHeaders`.

### EJS SSTI → RCE (CVE-2022-29078, CVSS 9.8)

```javascript
// ❌ VULN — req.query directement dans render()
app.get('/page', (req, res) => res.render('page', req.query));
// Payload : /page?settings[view%20options][outputFunctionName]=x;process.mainModule.require('child_process').execSync('id');s

// ✅ FIX
const safeData = { name: String(req.query.name || '').slice(0, 100) };
res.render('page', safeData);
```

> JAMAIS passer `req.query`, `req.body`, `req.params` directement à `res.render()`.

### Path traversal `sendFile()`

```javascript
// ❌ VULN — GET /files/..%2F..%2Fetc%2Fpasswd
res.sendFile(path.join(__dirname, 'uploads', req.params.filename));

// ✅ FIX
const rootDir = path.resolve(__dirname, 'uploads');
const filePath = path.resolve(rootDir, req.params.filename);
if (!filePath.startsWith(rootDir + path.sep)) return res.status(403).send('Forbidden');
```

### Session fixation + CORS

```javascript
// ❌ VULN session — ID inchangé après login → session fixation (CWE-384)
req.session.userId = user.id;
// ✅ FIX
req.session.regenerate((err) => { req.session.userId = user.id; req.session.save(cb); });

// ❌ VULN CORS — reflection d'origin + credentials → vol de données
res.header('Access-Control-Allow-Origin', req.headers.origin);
res.header('Access-Control-Allow-Credentials', 'true');
// ✅ FIX — liste blanche stricte
app.use(cors({ origin: (o, cb) => ['https://app.example.com'].includes(o) ? cb(null, true) : cb(new Error()), credentials: true }));
```

CVE-2024-29041 (6.1, Open Redirect), CVE-2024-43796 (5.0, XSS redirect). Corrigés Express 4.20.0.

---

## NEXT.JS

### CVE-2025-29927 — Bypass middleware (CVSS 9.1)

```http
GET /admin HTTP/1.1
x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware
```

Header interne spoofable → tout middleware bypassé. Affectées : 11.1.4 → 15.2.2.

```nginx
# Mitigation si update impossible
proxy_set_header x-middleware-subrequest "";
```

> Ne jamais reposer uniquement sur le middleware pour l'auth. Vérifier au niveau de l'accès aux données.

### CVE-2025-55182 « React2Shell » — RCE pré-auth (CVSS 10.0)

Protocole Flight RSC : désérialisation des payloads entrants **sans validation** → RCE via POST HTTP avant toute auth.

- Toute app `create-next-app` App Router vulnérable sans modification
- 39% des envs cloud vulnérables (Wiz Research), exploitation active J+2
- **Affectées** : React 19.0.0–19.2.0, Next.js 15.x/16.x
- **Corrigé** : React 19.0.1/19.1.2/19.2.1, Next.js 16.0.7, 15.5.7, 15.4.8, 15.3.6, 15.2.6

CVEs dérivées : CVE-2025-55183 (code source leak, 5.3), CVE-2025-55184/67779 (DoS boucle RSC, 7.5), CVE-2026-23864 (DoS RSC).

### Server Actions — chaque action = endpoint POST public

```typescript
// ❌ VULN — aucune auth
'use server'
export async function deleteUser(userId: string) { await db.user.delete({ where: { id: userId } }); }

// ✅ FIX
'use server'
const schema = z.object({ userId: z.string().uuid() });
export async function deleteUser(input: unknown) {
  const session = await auth(); if (!session?.user) throw new Error('Unauthorized');
  const { userId } = schema.parse(input);
  if (session.user.role !== 'admin') throw new Error('Forbidden');
  await db.user.delete({ where: { id: userId } });
}
```

### Fuite Server → Client Components + SSRF

```typescript
// ❌ VULN — hash pwd, SSN dans payload RSC
const userData = await sql`SELECT * FROM user WHERE slug = ${slug}`;
return <Profile user={userData} />

// ✅ FIX
import 'server-only';
return await sql`SELECT name, bio, avatar FROM user WHERE slug = ${slug}`;
```

**CVE-2025-49826** (7.5) : race condition cache → DoS persistant ISR.
**SSRF** : `remotePatterns: [{ hostname: '**' }]` → proxy vers `169.254.169.254`.
`NEXT_PUBLIC_` inline les secrets **au build** dans le bundle client — ne jamais préfixer des secrets.

---

## NESTJS

### CVE-2025-54782 — RCE DevTools + CSRF (CVSS 9.4)

`@nestjs/devtools-integration` ≤ 0.2.0 : `vm.runInNewContext` + pas de validation Origin → CSRF depuis tout site → sandbox escape → RCE machine dev.

```html
<form action="http://localhost:8000/inspector/graph/interact" method="POST" enctype="text/plain">
  <input name='{"code":"(function(){...process...execSync(\"calc\")...})()","bogus":"' value='"}' />
</form>
```

Corrigé 0.2.1 (sandboxjs + validation Origin/Content-Type + auth).

### CVE-2025-69211 / CVE-2026-2293 — Bypass Fastify TOCTOU

```
GET /%61dmin → Middleware voit "/%61dmin" (no match) → Fastify décode → /admin → Handler exécuté
GET /admin/  → Middleware no-match trailing slash → Fastify normalise → Handler exécuté
```

CVE-2025-69211 (6.5) → corrigé 11.1.11 | CVE-2026-2293 (7.5) → corrigé 11.1.14.

### Guard + ValidationPipe

```typescript
// ❌ VULN — RolesGuard sans AuthGuard : req.user = undefined
@UseGuards(RolesGuard)

// ✅ FIX — Auth d'abord
@UseGuards(JwtAuthGuard, RolesGuard)

// ✅ ValidationPipe global
app.useGlobalPipes(new ValidationPipe({
  whitelist: true, forbidNonWhitelisted: true, transform: true,
  transformOptions: { enableImplicitConversion: false }
}));
```

GraphQL : `depthLimit(7)`, `createComplexityLimitRule(1000)`, `introspection: false` en prod, `allowBatchedHttpRequests: false`. Guards NestJS ne s'exécutent **pas** sur WebSocket `handleConnection()` → implémenter l'auth dans `handleConnection()`.

---

## LARAVEL

### RCE Livewire (CVE-2025-54068) + env (CVE-2024-52301)

- **CVE-2025-54068** : hydratation propriétés Livewire v3 ≤ 3.6.3 sans auth → RCE. Corrigé 3.6.4.
- **CVE-2024-52301** (8.7) : `register_argc_argv` activé → env changé via query string → debug mode → secrets exposés. Corrigé Laravel 11.31.0+.

### 260 000 APP_KEY sur GitHub → RCE triviale

260 000+ APP_KEY exposées, 4 exploitables trivialement via PHPGGC (20+ chaînes Laravel/RCE1–RCE20).

```php
decrypt($value, false);  // ✅ JAMAIS omettre false — désactive désérialisation auto
// JAMAIS commiter .env dans Git
```

### Mass assignment + SQLi Raw

```php
// ❌ VULN
protected $guarded = []; User::create($request->all()); // is_admin=1 passé
DB::table('users')->insert($request->all()); // contourne Eloquent

// ✅ FIX
protected $fillable = ['name', 'email', 'password'];
$validated = $request->validate([...]); User::create($validated);

// ❌ SQLi
User::whereRaw('email = "' . $email . '"')->get();
// ✅ FIX
User::whereRaw('email = ?', [$email])->get();
$allowed = ['name','email','created_at']; // whitelist orderBy
```

### Upload triple validation (CVE-2024-47823, CVSS 9.8)

CVE-2024-47823 : extension devinée via MIME → `shell.php` uploadé comme `image/png`. CVE-2024-21546 (9.8) : bypass `filename.php.`.

```php
// ✅ FIX — validation MIME + extension + taille + stockage privé
$request->validate(['file' => ['file', 'mimes:pdf,jpg,png', 'max:10240',
  fn($a, $v, $fail) => in_array(strtolower($v->getClientOriginalExtension()),
    ['php','phar','phtml','php3']) && $fail('PHP not allowed.')]]);
$file->storeAs('documents', Str::uuid().'.'.$file->guessExtension(), 'private');
// Nginx : location ~* /uploads/.*\.php$ { deny all; }
```

---

## PHP NATIF

### `unserialize()` + `phar://` → RCE

```php
unserialize($_COOKIE['session_data']); // ❌

// ✅ FIX
json_decode($_COOKIE['data'], true); // ou
unserialize($input, ['allowed_classes' => [SafeClass::class]]);
```

**phar://** : `file_exists()`, `fopen()`, `is_dir()` sur `phar://` → désérialisation implicite.

### Type juggling PHP 8.x + PHP Filter Chains LFI→RCE

```php
// ❌ VULN — {"password": true} bypasse (true == any_string reste vrai en 8.x)
if ($input['password'] == $stored_password) authenticate();

// ✅ FIX
if (!is_string($input['password'])) throw new \InvalidArgumentException();
if (!hash_equals($stored_hash, hash('sha256', $input['password']))) deny_access();
```

**PHP Filter Chains** (Synacktiv) : `php://filter/convert.iconv.*` chaîné → octets arbitraires → **toute LFI = RCE sans upload**. Activement exploité (CVE-2026-22200, osTicket).

```
page=php://filter/convert.iconv.UTF8.CSISO2022KR|...|/resource=/etc/passwd
```

Mitigation : whitelist `include`/`require` + `open_basedir` + `allow_url_include=Off`.

### `extract()` — corruption mémoire (2025)

`EXTR_REFS` → use-after-free → RCE natif contournant `disable_functions` sur **toutes** les versions PHP.

```php
extract($_GET);  // ❌ ?is_admin=1 écrase variables
$username = $_POST['username'] ?? '';  // ✅
```

**PHP 8.1 EOL décembre 2025** — migrer PHP 8.4+. `#[SensitiveParameter]` (8.2) masque secrets dans stack traces. `Random\Randomizer` (8.2) = CSPRNG. PHP 8.5 déprécie `register_argc_argv` pour HTTP.
