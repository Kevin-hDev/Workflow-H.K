# Phase 4: Framework and Environment Hardening

**Type** : Defensive implementation
**Executor** : LLM + Code writing
**Knowledge** : Defensive DATA categories FW, IPC, SUBPROCESS, OS, ANTI_RE
**Input** : P3_code_hardening.yaml (gaps with assigned_phase: P4)
**Output** : Concrete code in code/framework_hardening/

---

## MANDATORY: 4-Gate Protocol (BLOCKING)

---

### REFLECTION - Entry Gate P4

**Objective** : Write code that hardens the framework, IPC communications, OS privileges, anti-reverse engineering, deception, and LLM defenses. These protections operate above the runtime (P3) and protect the application and system layer.

```
REFLECTION - P4 Entry Gate
================================================

CENTRAL PROBLEM
Protect the application at the framework, OS and binary level.
The number and type of protections depend on the stack
detected in P0 and the gaps identified in P2.

UPSTREAM DATA
| Metric | Value |
|--------|-------|
| Gaps assigned to P4 | {P2.gap_summary.by_phase.P4} |
| P3 fixes written | {P3.gap_coverage.addressed} |
| P4 categories | FW, IPC, SUBPROCESS, OS, ANTI_RE |
| Stack | {P0.detected_stack} |

KNOWLEDGE TO LOAD
- Relevant defensive DATA based on active categories

================================================
STOP CHECK
- P3_code_hardening.yaml read and valid? [YES/NO]
- Framework/IPC/OS defensive DATA files READ? [YES/NO]
- Stack and active categories identified? [YES/NO]
- Ready to continue to PLANNING? [YES/NO]
================================================
```

---

### PLANNING - P4 Breakdown

Fixes are DYNAMIC: they depend on the stack detected in P0 and gaps from P2.

```
PLANNING - P4 Subtasks
================================================

| # | Fix | Applicable if | DATA source |
|---|-----|--------------|------------|
| F1 | Permissions/capabilities restriction | Framework with permissions (Tauri, Electron, Android, iOS) | def-framework-hardening + {stack}/ |
| F2 | Strict CSP | App with WebView/web frontend | def-framework-hardening + {stack}/ |
| F3 | Output sanitization (XSS) | Frontend displaying external content | def-framework-hardening + {stack}/ |
| F4 | IPC isolation/sandboxing | App with IPC (desktop, mobile) | def-ipc-hardening + {stack}/ |
| F5 | IPC auth (HMAC + anti-replay) | App with IPC between components | def-ipc-hardening + {stack}/ |
| F6 | Subprocess/sidecar validation | App launching external processes | def-ipc-hardening + {stack}/ |
| F7 | Secure privilege elevation | App with elevation (pkexec, UAC, osascript) | def-os-isolation + {stack}/ |
| F8 | Anti-debug detection | Native desktop/mobile app | DATA {stack}/ anti-RE |
| F9 | Library injection detection | Native app (LD_PRELOAD, DYLD_INSERT) | DATA {stack}/ anti-RE |
| F10 | Code signing verification | App distributed as binary | DATA {stack}/ anti-RE |
| F11 | CORS/security headers | Web/API app | def-framework-hardening + {stack}/ |

NOTE: Canary files, secure logging and LLM defenses are handled in P6, not here.

Apply only fixes whose corresponding GAP is in P2.

================================================
```

---

### EXECUTION

#### P4 Defensive Coding Method

For each GAP-xxx assigned to P4:

1. **Read the gap** : Understand exact location and problem
2. **Consult the defensive DATA** corresponding to the category
3. **Write the fix code** : Complete code in the project's language/format
4. **Write test or verification** : Tests covering normal AND adversarial cases
5. **Document integration** : Target file, how to apply

---

#### F1: Deny-by-Default Permissions/Capabilities

**Universal principle** : Grant THE MINIMUM necessary, block everything else. Each permission must be justified.

**Implementations per framework:**

| Framework | Permission mechanism | Config |
|-----------|---------------------|--------|
| Tauri v2 | `capabilities/*.json` | Explicit permissions per window |
| Electron | `sandbox: true`, `contextIsolation: true` | BrowserWindow config |
| Android | `AndroidManifest.xml` permissions | Minimal `<uses-permission>` |
| iOS | `Info.plist` + entitlements | Mandatory usage descriptions |
| Flutter desktop | OS-level sandboxing | macOS entitlements, Linux AppArmor |

**Associated CI/CD audit** (generic example):
```yaml
# Detects dangerous permissions based on framework
- name: Audit permissions
  run: |
    # Pattern to adapt based on detected framework
    DANGEROUS_PATTERNS="dangerous_framework_patterns"
    if grep -rPE "$DANGEROUS_PATTERNS" config_dir/; then
      echo "::error::Dangerous permissions detected"
      exit 1
    fi
```

---

#### F2: Strict CSP (Content Security Policy)

**Universal principle** : Block execution of unauthorized scripts in any web context (WebView, SPA, SSR).

**Minimum rules:**
```
default-src 'self';
script-src 'self';                    # NEVER unsafe-inline or unsafe-eval
style-src 'self' 'unsafe-inline';     # Inline CSS often necessary
connect-src <authorized_urls>;        # API endpoints only
img-src 'self' data: https:;
font-src 'self' data:;
frame-src 'none';                     # No iframes
object-src 'none';                    # No plugins
base-uri 'self';
form-action 'self';
frame-ancestors 'none';              # Anti-clickjacking
```

**Where to apply based on framework:**
| Framework | Where to configure CSP |
|-----------|------------------------|
| Tauri | `tauri.conf.json` > `app.security.csp` |
| Electron | `session.defaultSession.webRequest.onHeadersReceived` |
| Next.js | `next.config.js` > `headers()` |
| Django | `django-csp` middleware |
| Express | `helmet.contentSecurityPolicy()` |
| Laravel | `spatie/laravel-csp` |
| Flask | `flask-talisman` |
| Static SPA | `<meta http-equiv="Content-Security-Policy">` |

---

#### F3: Output Sanitization (Anti-XSS)

**Universal principle** : Any external content (scraping, API, database, LLM output) MUST be sanitized before display. NEVER inject raw HTML into the DOM.

**Implementations per ecosystem:**

| Ecosystem | Library | Pattern |
|-----------|---------|---------|
| React/TS | `dompurify`, `rehype-sanitize` | `DOMPurify.sanitize(html, config)` |
| Vue | `dompurify`, `v-dompurify-html` | Custom directive, not direct `v-html` |
| Angular | Built-in `DomSanitizer` | `bypassSecurityTrustHtml` with DOMPurify |
| Rust | `ammonia`, `nh3` | `ammonia::clean(html)` |
| Python | `nh3`, `bleach` (deprecated) | `nh3.clean(html, tags=ALLOWED)` |
| PHP | `HTMLPurifier` | `$purifier->purify($html)` |
| Go | `bluemonday` | `p.Sanitize(html)` |
| Dart/Flutter | `html` package + whitelist | Custom sanitizer |

**Strict rules:**
- NEVER `dangerouslySetInnerHTML` / `v-html` / `innerHTML` without sanitization
- NEVER `eval()`, `Function()`, `setTimeout(string)`
- LLM outputs ALWAYS through a sanitizing component
- Links: force `target="_blank" rel="noopener noreferrer nofollow"`
- Images: validate protocol (https only), add `loading="lazy"`

---

#### F4: IPC Isolation/Sandboxing

**Universal principle** : Communications between components (frontend <-> backend, app <-> sidecar, app <-> plugin) must be isolated and authenticated.

**Per framework:**

| Framework | Isolation mechanism |
|-----------|---------------------|
| Tauri v2 | Isolation Pattern (`pattern.use: "isolation"`) |
| Electron | `contextIsolation: true` + preload script |
| Flutter | Platform Channels with native-side validation |
| Android | Bound services with permissions |
| iOS | XPC Services |
| Web | postMessage with origin verification |

---

#### F5: IPC Authentication (HMAC + Anti-Replay)

**Universal principle** : Each critical IPC message must be signed (HMAC-SHA256) and protected against replays (nonce + timestamp + TTL).

**Generic pattern:**
```
Signed message = {
  nonce: CSPRNG(32 bytes),       # Unique per message
  timestamp: now_ms,              # Timestamp
  payload: data,                  # Message content
  signature: HMAC-SHA256(         # Signature
    shared_secret,
    nonce || timestamp || payload
  )
}

Verification = {
  1. Verify timestamp < TTL (30s max)
  2. Verify nonce not already seen (bounded cache)
  3. Verify HMAC in constant time
  4. If all OK: process payload
}
```

**Authorization guard** : Verify message origin (window, process, channel) BEFORE HMAC verification.

---

#### F6: Subprocess/Sidecar Validation

**Universal principle** : Before launching an external process, validate binary integrity and arguments.

**Checklist**:
1. **Verify integrity** : SHA-256 of binary compiled at build-time, verified at runtime
2. **Validate arguments** : Regex, allowlist, max length
3. **NEVER shell=True** : Always pass args as a list
4. **NEVER concatenate** : `["cmd", "--arg", value]` not `f"cmd --arg {value}"`
5. **Limit volumes** : Max URLs, max files, mandatory timeout
6. **End-of-options marker** : `--` before user args

**Build-time hash** (generic pattern):
```
# In build script (build.rs, webpack.config, setup.py, etc.)
hash = SHA-256(sidecar_binary)
embed(hash) into main binary
```

---

#### F7: Secure Privilege Elevation

**Universal principle** : Privilege elevation must be minimal, justified, and with HARDCODED arguments.

**Strict rules:**
- NEVER `sudo` -> Use `pkexec` (Linux), UAC (Windows), `osascript` (macOS)
- NEVER user arguments in the elevated command
- Allowlist of authorized actions (verified BEFORE elevation)
- Dedicated policy file (`.policy` for polkit, `Info.plist` for macOS)
- Mandatory user confirmation before elevation

---

#### F8: Anti-Debug Detection

**Universal principle** : Detect if a debugger is attached to the process at startup and during execution.

**Implementations per OS:**

| OS | Detection method |
|----|-----------------|
| Linux | `/proc/self/status` -> `TracerPid != 0` |
| macOS | `sysctl kern.proc.pid.{pid}` -> `P_TRACED` |
| Windows | `IsDebuggerPresent()`, `CheckRemoteDebuggerPresent()` |
| Android | `/proc/self/status` + Frida detection |
| iOS | `sysctl` + `ptrace(PT_DENY_ATTACH)` |

**Action if detected** : Log the event, zeroize secrets, terminate the process.

---

#### F9: Library Injection Detection

**Universal principle** : Detect library injection attempts at startup.

**Environment variables to check:**
- Linux : `LD_PRELOAD`, `LD_AUDIT`, `LD_LIBRARY_PATH`
- macOS : `DYLD_INSERT_LIBRARIES`, `DYLD_LIBRARY_PATH`

**Action if detected** : Refuse to start.

---

#### F10: Code Signing Verification

**Universal principle** : Verify binary signature at startup to detect post-install modifications.

**Per platform:**

| OS | Verification tool |
|----|-------------------|
| Linux | GPG signature + public key |
| macOS | `codesign --verify --deep --strict` |
| Windows | Authenticode (`Get-AuthenticodeSignature`) |
| Android | APK signature verification |
| iOS | Code signing entitlements |

---

#### F11: CORS and Security Headers

If web/API app, configure security headers:

| Header | Recommended value |
|--------|------------------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `0` (disabled, CSP replaces it) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Access-Control-Allow-Origin` | Specific domain (NEVER `*`) |

---

### VALIDATION - Completeness Check

```
VALIDATION - P4 Check
================================================

| Element verified | Status |
|-----------------|--------|
| All P4 gaps addressed? | [OK/FAIL] |
| F1 deny-by-default permissions (if applicable)? | [OK/FAIL/N/A] |
| F2 strict CSP (if applicable)? | [OK/FAIL/N/A] |
| F3 output sanitization (if applicable)? | [OK/FAIL/N/A] |
| F4 IPC isolation (if applicable)? | [OK/FAIL/N/A] |
| F5 IPC auth HMAC + anti-replay (if applicable)? | [OK/FAIL/N/A] |
| F6 subprocess validation (if applicable)? | [OK/FAIL/N/A] |
| F7 secure privilege elevation (if applicable)? | [OK/FAIL/N/A] |
| F8 anti-debug detection (if applicable)? | [OK/FAIL/N/A] |
| F9 library injection detection (if applicable)? | [OK/FAIL/N/A] |
| F10 code signing verification (if applicable)? | [OK/FAIL/N/A] |
| F11 CORS/security headers (if applicable)? | [OK/FAIL/N/A] |
| Each fix has a test or verification? | [OK/FAIL] |
| Code in the project's language/format? | [OK/FAIL] |
| gap_coverage.addressed == gap_coverage.total_gaps_p4? | [OK/FAIL] |
| P4_framework_hardening.yaml written? | [OK/FAIL] |

COMPLETION GATE
- Ready to enter P5? [YES/NO]
================================================
```

---

## P4 YAML Template

```yaml
schema_version: "1.1.0"
phase: 4
generated_at: "ISO8601"
input_ref: "P3_code_hardening.yaml"

target_stack:
  frameworks: []  # from P0
  languages: []   # from P0

fixes:
  - id: FIX-F4-001
    gap_ref: "GAP-xxx"
    category: "FW|IPC|SUBPROCESS|OS|ANTI_RE"
    title: "Fix description"
    code_file: "code/framework_hardening/fix_xxx.{ext}"
    test_file: "code/framework_hardening/test_xxx.{ext}"
    integration:
      target_file: "path/to/file.ext"
      instructions: "How to integrate the fix"
    platform_specific: false  # true if fix varies per OS

gap_coverage:
  total_gaps_p4: 0
  addressed: 0
  skipped: 0
  skipped_reasons: []
```

---

**End of P4-BLINDAGE-FRAMEWORK.md**
