---
type: security-data
category: defense-patterns
tags: [runtime, collections, errors, all]
loaded_by: Nyx (INDEX_THEN_SELECTIVE only)
---

# Defense Patterns — Runtime Safety

> Load this file for any project — these patterns apply universally regardless of stack.
> Focus: bounded collections, fail-closed error handling, integer safety, memory zeroization.

---

## Bounded Collections

### The rule

**Any collection fed from external input MUST have a maximum size.**
An unbounded collection is a DoS vector — it will grow until memory is exhausted.

### Implementation by language

**JavaScript / TypeScript:**
```javascript
class BoundedMap {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.map = new Map();
  }
  set(key, value) {
    if (this.map.size >= this.maxSize) {
      // Evict oldest entry
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }
}

// Usage: sessions, rate limiters, caches
const sessions = new BoundedMap(10000); // max 10K sessions
```

**Rust:**
```rust
use std::collections::HashMap;

struct BoundedMap<K, V> {
    inner: HashMap<K, V>,
    max_size: usize,
}

impl<K: Eq + std::hash::Hash + Clone, V> BoundedMap<K, V> {
    fn insert(&mut self, key: K, value: V) -> bool {
        if self.inner.len() >= self.max_size {
            return false; // Reject — do not evict silently
        }
        self.inner.insert(key, value);
        true
    }
}
```

**Python:**
```python
from collections import OrderedDict

class BoundedDict(OrderedDict):
    def __init__(self, max_size, *args, **kwargs):
        self.max_size = max_size
        super().__init__(*args, **kwargs)

    def __setitem__(self, key, value):
        if len(self) >= self.max_size:
            self.popitem(last=False)  # Evict oldest (FIFO)
        super().__setitem__(key, value)
```

### Checklist

```
Bounded Collections Checklist:
[ ] Every Map/HashMap used as a cache or session store has a maxSize
[ ] Every List/Vec/Array that grows from external input has a maximum length checked before append
[ ] Every queue or buffer has a capacity limit with explicit behavior when full (reject vs evict)
[ ] Rate limiter data structures are bounded (IP tables, user attempt counters)
[ ] Recursive functions have a maximum depth limit
```

---

## Error Handling — Fail Closed

### The principle

**A security-relevant operation that fails must BLOCK, not silently succeed.**

"Fail open" = the error is ignored, the user gets access → security hole.
"Fail closed" = the error causes the operation to be denied → security preserved.

### Anti-patterns to detect and fix

```javascript
// WRONG — fail open
try {
  const user = await verifyToken(token);
  return user;
} catch (e) {
  // Swallowed — caller receives undefined, may treat as valid
}

// WRONG — fail open
const isValid = checkPermission(user, resource) || false; // false as default = dangerous if the check fails

// CORRECT — fail closed
try {
  const user = await verifyToken(token);
  return user;
} catch (e) {
  logger.error('Token verification failed', { error: e.message }); // Log without stack trace
  throw new UnauthorizedError('Authentication failed'); // Re-throw — caller must handle
}
```

### Checklist

```
Fail-Closed Checklist:
[ ] No empty catch blocks ({ }) anywhere in the codebase
[ ] Auth checks: failure throws or returns an explicit error, never undefined/null treated as valid
[ ] Permission checks: default to DENY when the check cannot be evaluated
[ ] Database failures: fail with error, not with empty result treated as "no data"
[ ] External service failures: circuit breaker pattern, not silent degradation to insecure fallback
[ ] Every catch block either: re-throws, logs + re-throws, or converts to typed error
```

---

## Integer Safety

### Overflow and underflow

**JavaScript:** Use `BigInt` for large values. Validate numeric ranges from user input.
```javascript
function safeQuantity(input) {
  const n = parseInt(input, 10);
  if (isNaN(n) || n < 0 || n > 10000) throw new RangeError('Invalid quantity');
  return n;
}
```

**Rust:** Use checked arithmetic for user-supplied values.
```rust
let result = a.checked_add(b).ok_or(Error::Overflow)?;
```

**Python:** Python integers are arbitrary precision — overflow is not a concern.
For external values (C FFI, struct parsing): validate ranges explicitly.

### Injection via type confusion

**Never use raw user input in arithmetic without validation:**
```javascript
// DANGEROUS — user-controlled multiplier
const price = unitPrice * req.body.quantity; // quantity could be Infinity, NaN, negative

// SAFE
const quantity = parseInt(req.body.quantity, 10);
if (isNaN(quantity) || quantity < 1 || quantity > 10000) {
  throw new ValidationError('Invalid quantity');
}
const price = unitPrice * quantity;
```

---

## Memory Zeroization

### When to zeroize

After using a secret (password, key, token) in memory, clear it before releasing the memory:
- Prevents secrets from appearing in heap dumps or swap
- Reduces exposure window in case of memory disclosure

### Implementation by language

**Rust:**
```rust
use zeroize::Zeroize;

let mut secret = get_secret_bytes();
// ... use secret ...
secret.zeroize(); // Overwrites with zeros, prevents compiler optimization from removing it
```

**JavaScript (Node.js):**
```javascript
const secret = Buffer.from(rawSecret);
// ... use secret ...
secret.fill(0); // Zero out the buffer
```

**Python:**
```python
import ctypes
secret = bytearray(get_secret())
# ... use secret ...
ctypes.memset(ctypes.addressof((ctypes.c_char * len(secret)).from_buffer(secret)), 0, len(secret))
```

### What to zeroize

```
Zeroization Targets:
[ ] Plaintext passwords after hashing
[ ] Symmetric encryption keys after use
[ ] Private keys after signing
[ ] Session tokens after transmission
[ ] Decrypted sensitive data (PII, financial) after processing
```

**Note:** JavaScript garbage collection makes zeroization unreliable for GC-managed strings.
Use `Buffer` (Node.js) or `Uint8Array` for secrets that can be zeroed.

---

## Timing Attack Prevention

### The rule

**Never compare secrets with `==`.**
Standard equality comparison short-circuits at the first differing byte, leaking information about the correct value.

### Constant-time comparison by language

**Node.js:**
```javascript
const crypto = require('crypto');
const isValid = crypto.timingSafeEqual(
  Buffer.from(providedToken),
  Buffer.from(expectedToken)
);
```

**Rust:**
```rust
use subtle::ConstantTimeEq;
let is_valid = provided_token.ct_eq(expected_token).into();
```

**Python:**
```python
import hmac
is_valid = hmac.compare_digest(provided_token, expected_token)
```

**Go:**
```go
import "crypto/subtle"
isValid := subtle.ConstantTimeCompare(providedToken, expectedToken) == 1
```

### What requires constant-time comparison

```
Constant-Time Comparison Required:
[ ] API keys and tokens
[ ] Session IDs
[ ] HMAC signatures
[ ] Password reset tokens
[ ] Any value where knowing "you were close" gives an attacker an advantage
```
