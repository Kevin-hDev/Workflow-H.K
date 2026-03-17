# atk-web-common.md
> Common web attack patterns. Adapted for brownfield audits — focus on finding these in existing code, not preventing them from scratch.
> Tags: web, http, api, xss, csrf, injection, ssrf

---

## 1. SQL Injection — String Interpolation

**What it is:** User-controlled input concatenated into a SQL string and executed against a database. The input is parsed as SQL syntax, not as data.

**Where to look in existing code:**
- String formatting functions (`format!`, f-strings, `+` concatenation) adjacent to SQL keywords (`SELECT`, `INSERT`, `WHERE`, `FROM`)
- ORM methods accepting raw query fragments (`.raw()`, `.extra()`, `literalQuery`) with unvalidated input
- Multi-statement execution APIs receiving any externally derived string

**Impact:** Full data exfiltration, authentication bypass (`OR 1=1`), schema enumeration, arbitrary DDL/DML.

**Brownfield remediation:**
1. Replace concatenation with parameterized queries / prepared statements — one function at a time
2. Add a generic error wrapper layer to prevent schema leakage in error messages
3. Apply the fix at the data access layer, not in each individual caller

**Grep pattern:** `format!.*SELECT|f".*WHERE|f'.*INSERT|" +.*FROM`

---

## 2. SQL Injection — LIKE/GLOB Wildcard Bypass

**What it is:** Even with parameterized queries, `%` and `_` inside a `LIKE` clause are still interpreted by the SQL engine. A single `%` dumps the full table.

**Where to look:** Search fields that pass user input as the bound value of a `LIKE` predicate without wildcard escaping.

**Impact:** Full table dump, DoS via complex patterns causing full sequential scans.

**Brownfield remediation:** Add wildcard escaping before binding: replace `%` with `\%` and `_` with `\_`, add `ESCAPE '\'` to the LIKE clause.

---

## 3. SQL Injection — Second-Order (Stored Payload)

**What it is:** A payload is stored safely via parameterized insert. Later, a different code path reads that stored value and concatenates it into SQL.

**Why it's missed:** The injection point and the dangerous re-use are in different files — automated scanners and isolated code reviews miss it.

**Where to look:** Database read results passed directly into string-formatting functions that build SQL. Fields tagged "external", "imported", or "llm_output" appearing in query-construction code.

**Impact:** Same as direct SQL injection, but harder to detect and often in privileged code paths.

---

## 4. XSS — Stored via External Content

**What it is:** Content from an external source (RSS, API, scraper, LLM) is stored and later rendered without sanitization. An HTML parser is NOT a sanitizer — parsers preserve `<script>`, event handlers, SVG, MathML.

**Where to look:** Any render function (`innerHTML`, `dangerouslySetInnerHTML`, `v-html`) receiving values that originated from external sources. HTML parser import without a companion sanitizer import.

**Impact:** Session hijacking. In desktop apps with a native bridge (Electron/Tauri): stored XSS → read local files, execute subprocesses.

**Brownfield remediation:** Add a sanitization step between fetch/parse and render. Use DOMPurify (web), html-escape (server), or equivalent. Never treat a parser as a sanitizer.

**Real CVE:** CVE-2025-31477 — tauri-plugin-shell < 2.2.1 (CVSS 9.8): XSS invoked `shell.open()` with `file://` URIs.

---

## 5. XSS — DOM-Based

**What it is:** JavaScript reads from a browser-controlled source (URL fragment, `location.search`, `document.referrer`) and writes it into the DOM via a sink that executes scripts. The server is never involved.

**Where to look:** `location.hash`, `location.search`, or `document.referrer` passed to any DOM-writing function (`innerHTML`, `outerHTML`, `eval`, `href`) without encoding.

**Brownfield remediation:** Encode before writing to the DOM. Use `textContent` instead of `innerHTML` for text values. Validate URL schemes before using in `href` attributes.

---

## 6. CSRF — Missing or Bypassable Token

**What it is:** A state-changing request (fund transfer, password change, account deletion) can be triggered from a malicious third-party site because the server only validates the session cookie, not the request origin.

**Where to look:** POST/PUT/DELETE endpoints that check the session cookie but not a CSRF token. Forms without a hidden CSRF field. APIs using cookie-based auth without `SameSite` enforcement.

**Impact:** Attacker's page triggers actions on behalf of authenticated users — account takeover, data destruction.

**Brownfield remediation:**
1. Add `SameSite=Strict` or `SameSite=Lax` to session cookies (quick win, no code changes)
2. Add CSRF token validation to state-changing endpoints
3. For APIs consumed by SPA: use `Authorization: Bearer` header (not cookies) — XHR from other origins cannot set custom headers

---

## 7. SSRF — Server-Side Request Forgery

**What it is:** The server fetches a URL supplied by the user. The attacker supplies internal URLs to reach cloud metadata endpoints (`169.254.169.254`), internal services, or localhost.

**Where to look:** Any feature that fetches a URL from user input: webhooks, URL previews, import by URL, PDF generators from HTML, image proxy, OAuth callback validation.

**Impact:** Cloud credential theft via IMDS (AWS, GCP, Azure), access to internal services, port scanning the internal network, RCE via internal service exploitation.

**Brownfield remediation:**
1. Block private IP ranges before making any outbound request: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1/128`
2. Resolve the hostname and re-check the resolved IP (DNS rebinding bypass)
3. Use an allowlist of permitted domains if possible

---

## 8. Path Traversal

**What it is:** User-supplied filename or path contains `../` sequences that escape the intended base directory. The server reads, writes, or includes files outside the allowed scope.

**Where to look:** File read/write operations where the filename comes from user input or request parameters. Archive extraction (zip files with `../` in entry names = zip slip).

**Impact:** Read `/etc/passwd`, `/proc/self/environ`, application source code, secret files. Write to arbitrary locations — overwrite config files, plant webshells.

**Brownfield remediation:**
1. Resolve the path to its canonical form before any file operation
2. Assert that the resolved path starts with the allowed base directory
3. Reject null bytes in filenames (null byte injection: `file.txt\0.php`)

---

## 9. Command Injection

**What it is:** User input is concatenated into a shell command or passed to an exec-style function without sanitization. The shell interprets the input as additional commands.

**Where to look:** `exec`, `spawn`, `subprocess.run(shell=True)`, `os.system()`, `child_process.exec()` calls where the command string includes user-supplied values.

**Impact:** Arbitrary command execution on the server — RCE, file exfiltration, reverse shell.

**Brownfield remediation:**
1. Use argument arrays, not shell strings: `subprocess.run(["cmd", arg1, arg2])` not `subprocess.run(f"cmd {user_input}", shell=True)`
2. Validate inputs against a strict allowlist (alphanumeric + specific chars) before any system call
3. Never use string concatenation or interpolation to build system commands

---

## 10. Template Injection (SSTI)

**What it is:** User-controlled input is embedded in a template string that is evaluated by a template engine. The engine interprets the input as template directives.

**Where to look:** Template render calls where the template itself (not just the data) contains user-supplied strings. `render(template_string=user_input)` patterns. Report generators, email builders.

**Impact:** Ranges from data exfiltration to full RCE when the engine has access to system primitives (Python `os.popen`, Java `Runtime.exec`).

---

## Brownfield audit checklist

When reviewing existing code, search for these patterns:

| Pattern | Risk |
|---------|------|
| String formatting with SQL keywords in same block | SQL injection |
| `LIKE`/`GLOB` without wildcard escaping | Wildcard injection |
| DB read result → string format → DB execute (different functions) | Second-order SQLi |
| HTML parser import without sanitizer import | Stored XSS |
| `innerHTML`/`dangerouslySetInnerHTML` with external data | DOM XSS |
| POST/PUT/DELETE with cookie auth and no CSRF token | CSRF |
| URL fetch where URL comes from user input | SSRF |
| File open/read where path comes from user input | Path traversal |
| `exec`/`spawn` with string interpolation | Command injection |
| Template render where template string = user value | SSTI |
