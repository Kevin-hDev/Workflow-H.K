# def-input-validation.md
> Input validation patterns for brownfield code. Fix existing validation gaps without rewriting everything.
> Tags: validation, sanitization, all

---

## Principle: Validate at the boundary, trust inside

In existing code, the goal is to identify WHERE inputs enter the system and add validation there — not to add validation at every function that uses the data downstream.

**System boundary = where untrusted data enters:**
- HTTP request handlers (body, query params, headers, path params)
- File uploads
- Webhook payloads
- Data imported from external APIs
- User-provided file contents (CSV, JSON, XML)
- CLI arguments

Once validated at the boundary, do not re-validate the same data in internal functions.

---

## 1. String Validation

**Minimum validation for any string field:**
1. **Null/empty check:** Is the field required? Reject if absent.
2. **Length bounds:** Set both minimum and maximum. Pick realistic maximums (name: 100, email: 254, description: 2000).
3. **Encoding:** Reject null bytes (`\0`) — null byte injection can bypass suffix checks.
4. **Format:** Apply regex or enum validation for structured fields (email, phone, UUID, slug).

**Common brownfield gap:** Validation exists on the frontend but not on the backend endpoint. Assume all client-side validation is absent — validate server-side unconditionally.

**Language patterns:**

| Validation | JavaScript/Node | Python | Java/Kotlin |
|------------|----------------|--------|-------------|
| Max length | `if (str.length > MAX)` | `if len(s) > MAX` | `if (s.length() > MAX)` |
| Null byte | `if (str.includes('\0'))` | `if '\0' in s` | `if (s.contains("\0"))` |
| Email | Use `validator.js` `isEmail()` | Use `email-validator` | Use Apache Commons `EmailValidator` |
| Reject empty | `if (!str?.trim())` | `if not s.strip()` | `if (s.isBlank())` |

---

## 2. SQL — Prepared Statements

**The rule:** Every SQL query that includes any variable value must use parameterized queries. No exceptions, even for "safe" values read from your own database.

**Why "from my database" is not safe:** Second-order injection — data stored safely by one code path can be injected by another code path that builds SQL with it.

**Correct patterns by language:**

```javascript
// Node.js — correct
db.query('SELECT * FROM users WHERE id = ?', [userId])
db.query('SELECT * FROM users WHERE email = $1', [email])  // PostgreSQL

// WRONG
db.query(`SELECT * FROM users WHERE id = ${userId}`)
```

```python
# Python — correct
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))

# WRONG
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
```

```java
// Java — correct
PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
stmt.setInt(1, userId);

// WRONG
Statement stmt = conn.createStatement();
stmt.execute("SELECT * FROM users WHERE id = " + userId);
```

**For LIKE queries:** Escape wildcards before binding:
```python
safe_query = user_input.replace('%', '\\%').replace('_', '\\_')
cursor.execute("SELECT * FROM items WHERE name LIKE %s ESCAPE '\\'", (f"%{safe_query}%",))
```

---

## 3. File Path Validation

**The rule:** Any file path derived from user input must be canonicalized and verified to stay within the allowed base directory.

**Pattern (language-agnostic):**
1. Canonicalize: resolve `../`, symlinks, and relative components
2. Assert prefix: the resolved path must start with the allowed base directory
3. Reject null bytes: check for `\0` before canonicalization

**Code patterns:**

```javascript
// Node.js
const path = require('path');
const ALLOWED_BASE = '/app/uploads';

function safeFilePath(userInput) {
  const resolved = path.resolve(ALLOWED_BASE, userInput);
  if (!resolved.startsWith(ALLOWED_BASE + path.sep)) {
    throw new Error('Path traversal rejected');
  }
  return resolved;
}
```

```python
import os

ALLOWED_BASE = '/app/uploads'

def safe_file_path(user_input):
    resolved = os.path.realpath(os.path.join(ALLOWED_BASE, user_input))
    if not resolved.startswith(ALLOWED_BASE + os.sep):
        raise ValueError('Path traversal rejected')
    return resolved
```

```rust
use std::path::Path;

fn safe_file_path(base: &Path, user_input: &str) -> Result<PathBuf, Error> {
    let resolved = base.join(user_input).canonicalize()?;
    if !resolved.starts_with(base) {
        return Err(Error::PathTraversal);
    }
    Ok(resolved)
}
```

**Additional:** Reject Windows reserved names (`CON`, `NUL`, `COM1–9`, `LPT1–9`) in file path inputs.

---

## 4. HTML Sanitization

**The rule:** Use a dedicated sanitization library — not a parser, not a custom regex. Sanitizers know about mXSS (Mutation XSS), SVG/MathML namespaces, and event handler attributes. Parsers do not.

**When you need HTML sanitization:**
- Rendering user-supplied content with `innerHTML`, `dangerouslySetInnerHTML`, `v-html`
- Storing and re-rendering content from external sources (feeds, APIs, LLM output)
- Any place where HTML is displayed without escaping

**Recommended libraries:**

| Platform | Library | Note |
|----------|---------|------|
| Browser / Node.js | DOMPurify ≥ 3.2.4 | Fix for CVE-2025-26791 mXSS in older versions |
| Python | bleach + html5lib | `bleach.clean()` with explicit allowlist |
| Java | OWASP Java HTML Sanitizer | `HtmlPolicyBuilder` with explicit allowlist |
| Go | bluemonday | `.StrictPolicy()` as default, then expand |

**Important:** Always sanitize with an allowlist (permitted tags + attributes), not a blocklist. Blocklists always have gaps.

---

## 5. Number and Range Validation

**Where brownfield code fails:**
- No check on negative values for quantities or offsets
- No maximum on pagination page size (`limit=9999999`)
- No check on integer overflow for calculated values

**Patterns:**
```javascript
// Reject out-of-range values
function validatePageSize(size) {
  const n = parseInt(size, 10);
  if (isNaN(n) || n < 1 || n > 100) throw new Error('Invalid page size');
  return n;
}
```

```python
def validate_quantity(value: int) -> int:
    if not isinstance(value, int) or value < 0 or value > 10_000:
        raise ValueError(f"Quantity must be 0–10000, got {value!r}")
    return value
```

---

## 6. JSON Schema Validation

For API endpoints receiving JSON payloads, validate the entire structure before processing — not field by field scattered across handler code.

**Benefits in brownfield code:**
- Single validation point — easier to audit
- Rejects unexpected fields (prevents mass assignment)
- Enforces types, formats, and required fields

**Minimal approach (add to existing endpoints):**

```javascript
// Ajv (Node.js) — add to existing handler
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const schema = {
  type: 'object',
  required: ['email', 'name'],
  properties: {
    email: { type: 'string', format: 'email', maxLength: 254 },
    name: { type: 'string', minLength: 1, maxLength: 100 }
  },
  additionalProperties: false  // rejects unknown fields
};
const validate = ajv.compile(schema);
if (!validate(req.body)) throw new ValidationError(validate.errors);
```

---

## Brownfield remediation priority

When you find validation gaps in existing code, fix in this order:

1. **CRITICAL:** SQL queries without parameterization — fix immediately, any order
2. **HIGH:** Path traversal on file operations — fix before next release
3. **HIGH:** HTML rendered without sanitization — fix before next release
4. **MEDIUM:** Missing length bounds on user-supplied strings — add to next sprint
5. **MEDIUM:** Missing number range validation on paginated/counted fields
6. **LOW:** Frontend-only validation without server-side counterpart
