---
type: security-data
category: attack-patterns
tags: [desktop, electron, tauri, native, ipc]
loaded_by: Nyx, The Mask (INDEX_THEN_SELECTIVE only)
---

# Attack Patterns — Desktop Applications (Electron / Tauri / Native)

> Load this file only when the project is a desktop application built with Electron, Tauri,
> or similar frameworks that bridge web and native contexts.

---

## IPC Abuse (Inter-Process Communication)

**What it is:** Attacker exploits the IPC channel between the renderer (web) process and the main (native) process to execute privileged operations.

**Electron attack vector:**
1. Renderer uses `ipcRenderer.invoke('exec-command', userInput)` without validation
2. Main process executes the command with elevated privileges
3. Attacker injects shell commands via user input

**Tauri attack vector:**
1. Frontend calls `invoke('dangerous_command', { path: '../../../etc/passwd' })`
2. Rust backend does not validate the path before reading
3. Attacker reads arbitrary files

**Detection signals:**
- IPC handlers that accept user input and pass it directly to native APIs
- Path parameters without normalization and boundary checking
- Command execution handlers with no allowlist

**Remediation (Electron):**
- `contextIsolation: true` — mandatory, prevents renderer from accessing Node.js directly
- `nodeIntegration: false` — mandatory, disables Node in renderer
- Validate all IPC arguments before acting on them
- Use `ipcMain.handle` with explicit allowlists instead of generic `exec` handlers

**Remediation (Tauri):**
- Use Tauri's capability system to restrict which commands each window can call
- Validate and sanitize all parameters in Rust command handlers
- Apply path canonicalization and prefix checking for file operations

---

## WebView Bridge RCE (Remote Code Execution)

**What it is:** Malicious web content loaded in the WebView executes native code via the JavaScript bridge.

**Attack vector:**
1. Desktop app loads external URLs in a WebView with native bridge enabled
2. Attacker serves a page with JavaScript that calls bridge methods
3. Bridge method executes native code (file system access, shell commands, etc.)

**Detection signals:**
- App loads external URLs in a WebView
- WebView has access to native bridge methods without origin restriction

**Remediation:**
- Never load external/untrusted URLs in a WebView with native bridge access
- If external content must be loaded: use a separate WebView with no bridge access
- Allowlist specific origins that are allowed to call bridge methods
- Apply Content Security Policy (CSP) to WebView content

---

## File System Access Exploitation

**What it is:** App's file access permissions are exploited to read or write outside the intended scope.

**Attack vector:**
1. App accepts a file path from user input
2. Attacker provides `../../../../etc/passwd` or `C:\Windows\System32\config\SAM`
3. App reads a sensitive system file and exposes its contents

**Detection signals:**
- File read/write operations accepting paths from user input
- No path canonicalization or prefix validation before file operations

**Remediation:**
- Canonicalize paths with `Path::canonicalize()` (Rust) or `path.resolve()` (Node.js)
- Verify the canonical path starts with the allowed base directory
- Use a file picker dialog instead of text input for file paths
- Scope file access to the app's data directory

---

## Native Bridge Injection

**What it is:** JavaScript injection via stored XSS reaches the native bridge and executes native commands.

**Attack vector:**
1. App stores user-generated content (notes, messages) and renders it in a WebView
2. Content is not sanitized → stored XSS
3. XSS reaches native bridge → `invoke('writeFile', {path: '~/.bashrc', content: '...'})`

**Detection signals:**
- User-generated content rendered in WebView without sanitization
- WebView has native bridge access

**Remediation:**
- Sanitize all user-generated content before rendering (DOMPurify or equivalent)
- Apply strict CSP: `script-src 'self'` — no inline scripts
- Separate the WebView displaying user content from the WebView with bridge access

---

## Insecure Updates

**What it is:** Auto-update mechanism fetches and executes code without verifying its integrity.

**Attack vector:**
1. Update server is compromised or update URL is intercepted (MITM)
2. Malicious update package is served
3. App installs and executes the malicious package

**Remediation:**
- Sign all update packages with a private key
- Verify signature before installing (using the bundled public key)
- Use HTTPS for update server with certificate pinning
- Implement rollback capability in case of bad update

---

## DREAD Reference Scores

| Attack | D | R | E | A | D | Total |
|--------|---|---|---|---|---|-------|
| IPC Abuse | 9 | 7 | 7 | 7 | 6 | 36/50 — High |
| WebView Bridge RCE | 10 | 6 | 7 | 8 | 5 | 36/50 — High |
| File System Exploitation | 8 | 7 | 8 | 6 | 7 | 36/50 — High |
| Native Bridge Injection | 9 | 5 | 6 | 7 | 5 | 32/50 — High |
| Insecure Updates | 10 | 5 | 5 | 9 | 4 | 33/50 — High |
