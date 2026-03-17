# Index Offensif — Donnees d'attaque

> **Usage : INDEX-THEN-SELECTIVE** — Lis cet index, puis charge UNIQUEMENT les fichiers pertinents pour ta simulation.

## generic/ — Attaques stack-agnostic (19 fichiers)

| Fichier | Description | Tags |
|---------|-------------|------|
| `atk-chain-patterns.md` | Attack Chain Patterns | #chains #multi-step |
| `atk-command-injection.md` | Command injection patterns | #injection #os-cmd |
| `atk-condenser-backend-js-php.md` | Backend JS/PHP — Securite 2025-2026 | #backend #js #php |
| `atk-condenser-backend-python.md` | Backend Python — Securite 2024-2026 | #backend #python |
| `atk-condenser-cloud-cicd.md` | Cloud / CI-CD Security 2025-2026 | #cloud #cicd |
| `atk-condenser-frontend-spa.md` | Securite Frontend SPA (Vue/Angular/Svelte) | #frontend #spa #xss |
| `atk-condenser-mobile-ios-android.md` | Securite mobile iOS/Android | #mobile #ios #android |
| `atk-condenser-os-security.md` | OS Security — Desktop Apps (Tauri/Electron/Flutter) | #os #desktop #tauri |
| `atk-credentials-secrets.md` | Attack Patterns: Credentials and Secrets | #creds #secrets #keys |
| `atk-injection-input.md` | Injection and input validation attacks | #injection #input #sqli |
| `atk-ipc-process.md` | Attack Patterns: Inter-Process Communication | #ipc #process |
| `atk-llm-deception.md` | LLM Deception and Output Manipulation | #llm #deception |
| `atk-llm-prompt-injection.md` | LLM Prompt Injection | #llm #prompt-injection |
| `atk-network-tls.md` | Network, TLS, and API Security attacks | #network #tls #api |
| `atk-privilege-escalation.md` | Privilege Escalation patterns | #privesc #escalation |
| `atk-reverse-engineering.md` | Reverse Engineering patterns | #re #binary #decompile |
| `atk-sandbox-kernel-failles.md` | Kernel, double-layering, routage de modeles | #kernel #sandbox |
| `atk-supply-chain.md` | Supply chain attack patterns | #supply-chain #deps |
| `atk-typescript-attaques.md` | Securiser TypeScript contre toutes les attaques | #typescript #frontend |

## rust-tauri/ — Attaques Rust/Tauri specifiques (14 fichiers)

| Fichier | Description | Tags |
|---------|-------------|------|
| `atk-chain-attack-patterns.md` | Chaines d'attaque Rust/React/Tauri | #chains #rust #tauri |
| `atk-cve-reference.md` | Catalogue CVE Rust/React/Tauri (2019-2026) | #cve #rust #tauri |
| `atk-deception-anti-re-attacks.md` | Deception et anti-reverse engineering | #deception #anti-re |
| `atk-key-storage-attacks.md` | Key storage attacks | #keys #storage #keychain |
| `atk-llm-offensive-attacks.md` | Attaques offensives LLM 2025-2026 | #llm #offensive |
| `atk-network-tls-api-attacks.md` | Network, TLS, API attacks | #network #tls #api |
| `atk-privesc-os-attacks.md` | Privilege escalation OS attacks | #privesc #os |
| `atk-security-tools-attacks.md` | Security tools attacks | #tools #bypass |
| `atk-sidecar-injection-attacks.md` | Sidecar Injection Attacks | #sidecar #injection #tauri |
| `atk-sqlcipher-injection-attacks.md` | SQLCipher injection attacks | #sqlcipher #injection #db |
| `atk-supply-chain-attacks.md` | Supply chain attacks 2025-2026 | #supply-chain #cargo #npm |
| `atk-tauri-ipc-attacks.md` | Tauri IPC Attacks | #tauri #ipc #webview |
| `atk-telegram-oauth-attacks.md` | Telegram Bot et Reddit OAuth2 Attacks | #telegram #oauth #api |
| `atk-webview-xss-attacks.md` | WebView XSS Attacks | #webview #xss #tauri |

## flutter-dart/ — Attaques Flutter specifiques (11 fichiers)

| Fichier | Description | Tags |
|---------|-------------|------|
| `atk-ai-offensive-threats.md` | Menaces IA automatisees | #ia #offensive #llm |
| `atk-chain-attack-patterns.md` | Patterns de chaines d'attaque | #chains #flutter |
| `atk-crypto-weaknesses.md` | Faiblesses cryptographiques | #crypto #weakness |
| `atk-cve-reference.md` | Reference CVE complete Flutter/Dart | #cve #flutter #dart |
| `atk-desktop-specific-attacks.md` | Attaques specifiques desktop | #desktop #flutter |
| `atk-flutter-dart-attacks.md` | Attaques Flutter/Dart | #flutter #dart #core |
| `atk-mobile-specific-attacks.md` | Attaques specifiques mobile | #mobile #flutter |
| `atk-network-attacks.md` | Attaques reseau | #network #flutter |
| `atk-ssh-attack-vectors.md` | Vecteurs d'attaque SSH | #ssh #flutter |
| `atk-storage-key-attacks.md` | Attaques stockage et cles | #storage #keys #flutter |
| `atk-tailscale-attack-vectors.md` | Vecteurs d'attaque Tailscale | #tailscale #vpn #flutter |

## llm-ai/ — Attaques LLM/AI (2 fichiers)

| Fichier | Description | Tags |
|---------|-------------|------|
| `atk-llm-deception-scheming.md` | Blindage TypeScript contre la deception LLM | #llm #deception #typescript |
| `ref-owasp-agentic-ai.md` | OWASP Agentic AI reference | #owasp #agentic #ai |

## exploits/ — PoCs The Mask (6 fichiers)

| Fichier | Description | Tags |
|---------|-------------|------|
| `atk-exploit-chains.md` | Exploit chains PoC | #exploit #chains |
| `atk-exploit-desktop.md` | Exploit desktop PoC | #exploit #desktop |
| `atk-exploit-llm.md` | Exploit LLM PoC | #exploit #llm |
| `atk-exploit-mobile.md` | Exploit mobile PoC | #exploit #mobile |
| `atk-exploit-social.md` | Exploit social engineering PoC | #exploit #social |
| `atk-exploit-web.md` | Exploit web PoC | #exploit #web |

---

**Total : 52 fichiers offensifs**

### Guide de selection rapide

- **Audit Tauri/Rust desktop** → `rust-tauri/` + `generic/atk-ipc-process.md` + `generic/atk-privilege-escalation.md`
- **Audit Flutter mobile** → `flutter-dart/` + `generic/atk-condenser-mobile-ios-android.md`
- **Audit LLM/IA** → `llm-ai/` + `generic/atk-llm-*.md` + `rust-tauri/atk-llm-offensive-attacks.md`
- **Supply chain** → `generic/atk-supply-chain.md` + `rust-tauri/atk-supply-chain-attacks.md`
- **Simulation complete** → `exploits/` pour les PoCs multi-vecteurs
