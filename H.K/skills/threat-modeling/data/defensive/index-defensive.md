# Index Defensif — Donnees de hardening

> **Usage : INDEX-THEN-SELECTIVE** — Lis cet index, puis charge UNIQUEMENT les fichiers pertinents pour ton blindage.

## generic/ — Defenses stack-agnostic (13 fichiers)

| Fichier | Description | Tags |
|---------|-------------|------|
| `def-audit-logging.md` | Tamper-Evident Audit Logging | #audit #logging #integrity |
| `def-auth-patterns.md` | Authentication patterns | #auth #authn #session |
| `def-crypto-secrets.md` | Cryptography and Secret Management | #crypto #secrets #keys |
| `def-deception-monitoring.md` | Deception and Active Monitoring | #deception #honeypot #monitoring |
| `def-framework-hardening.md` | Application Framework Hardening | #framework #hardening |
| `def-ipc-hardening.md` | IPC Hardening | #ipc #process #isolation |
| `def-llm-deception-blindage.md` | Blindage TypeScript contre la deception LLM | #llm #deception #typescript |
| `def-llm-pipeline.md` | LLM Pipeline Security | #llm #pipeline #sanitize |
| `def-network-tls.md` | Network and TLS Hardening | #network #tls #pinning |
| `def-os-isolation.md` | OS Isolation and Process Privilege Hardening | #os #isolation #privilege |
| `def-runtime-memory.md` | Runtime and Memory Security | #runtime #memory #zeroize |
| `def-sandbox-architectures.md` | Architectures, incidents et lecons | #sandbox #architecture |
| `def-sandbox-kernel-isolation.md` | Kernel, double-layering, routage de modeles | #kernel #sandbox #isolation |

## rust-tauri/ — Defenses Rust/Tauri specifiques (10 fichiers)

| Fichier | Description | Tags |
|---------|-------------|------|
| `def-rust-anti-reverse-engineering.md` | Anti-Reverse Engineering Rust/Tauri | #anti-re #obfuscation #rust |
| `def-rust-cross-validation-patterns.md` | Cross-Validation Adversary to Defensive | #cross-validation #mapping |
| `def-rust-deception-monitoring.md` | Deception et Monitoring Rust/Tauri | #deception #monitoring #rust |
| `def-rust-ipc-sidecar-hardening.md` | IPC Sidecar Hardening | #ipc #sidecar #tauri |
| `def-rust-llm-defense-strategies.md` | LLM Defense Strategies Rust/React | #llm #defense #rust |
| `def-rust-network-tls-hardening.md` | Network TLS Hardening | #network #tls #rust |
| `def-rust-os-privilege-hardening.md` | OS Privilege Hardening | #os #privilege #rust |
| `def-rust-rust-runtime-hardening.md` | Rust Runtime Hardening | #runtime #memory #rust |
| `def-rust-storage-crypto-hardening.md` | Storage Crypto Hardening | #storage #crypto #rust |
| `def-rust-tauri-react-framework-hardening.md` | Tauri React Framework Hardening | #tauri #react #framework |

## flutter-dart/ — Defenses Flutter specifiques (9 fichiers)

| Fichier | Description | Tags |
|---------|-------------|------|
| `def-flutter-ai-defense-strategies.md` | Strategies de defense contre l'IA offensive | #ia #defense #flutter |
| `def-flutter-anti-reverse-engineering.md` | Anti-Reverse Engineering Flutter | #anti-re #flutter |
| `def-flutter-cross-validation-patterns.md` | Patterns de validation croisee | #cross-validation #flutter |
| `def-flutter-dart-runtime-hardening.md` | Hardening Runtime Dart | #runtime #dart #flutter |
| `def-flutter-deception-monitoring.md` | Deception et Monitoring Flutter | #deception #monitoring #flutter |
| `def-flutter-flutter-framework-hardening.md` | Hardening Framework Flutter | #framework #flutter |
| `def-flutter-network-hardening.md` | Hardening Reseau et Connexion | #network #flutter |
| `def-flutter-os-hardening.md` | Hardening OS via l'App Desktop | #os #desktop #flutter |
| `def-flutter-storage-crypto-hardening.md` | Hardening Stockage et Crypto | #storage #crypto #flutter |

## platform/ — Par OS (7 fichiers)

| Fichier | Description | Tags |
|---------|-------------|------|
| `platform-android.md` | Platform Android Security Patterns | #android #mobile |
| `platform-ios.md` | Platform iOS Security Patterns | #ios #mobile |
| `platform-linux.md` | Platform Linux Security Patterns | #linux #desktop |
| `platform-macos.md` | Platform macOS Security Patterns | #macos #desktop |
| `platform-mobile-zero-days.md` | Securite mobile iOS/Android 2025-2026 | #mobile #zeroday |
| `platform-os-security-advanced.md` | OS Security Desktop Apps avance | #os #desktop #advanced |
| `platform-windows.md` | Platform Windows Security Patterns | #windows #desktop |

## stack/ — Par framework (8 fichiers)

| Fichier | Description | Tags |
|---------|-------------|------|
| `stack-frontend-spa.md` | Securite Frontend SPA condensee | #frontend #spa |
| `stack-frontend.md` | Stack Frontend SPA Security Patterns | #frontend #spa |
| `stack-js-node.md` | Stack JS/Node Security Patterns | #js #node |
| `stack-js-php-backend.md` | Backend JS/PHP Securite condensee | #js #php #backend |
| `stack-php.md` | Stack PHP/Laravel Security Patterns | #php #laravel |
| `stack-python-backend.md` | Backend Python Securite condensee | #python #backend |
| `stack-python.md` | Stack Python Security Patterns | #python |
| `stack-typescript.md` | Securiser TypeScript contre toutes les attaques | #typescript |

## infra/ — Cloud/CI-CD/containers (4 fichiers)

| Fichier | Description | Tags |
|---------|-------------|------|
| `infra-cicd.md` | Infra CI/CD Security Patterns | #cicd #pipeline |
| `infra-cloud-cicd-advanced.md` | Cloud / CI-CD Security avancee | #cloud #cicd #advanced |
| `infra-cloud.md` | Infra Cloud Security Patterns | #cloud #aws #gcp |
| `infra-containers.md` | Infra Containers Security Patterns | #containers #docker #k8s |

---

**Total : 51 fichiers defensifs**

### Guide de selection rapide

- **Hardening Tauri/Rust desktop** → `rust-tauri/` + `generic/def-ipc-hardening.md` + `generic/def-os-isolation.md`
- **Hardening Flutter mobile** → `flutter-dart/` + `platform/platform-ios.md` + `platform/platform-android.md`
- **Hardening LLM/IA** → `generic/def-llm-pipeline.md` + `generic/def-llm-deception-blindage.md` + `rust-tauri/def-rust-llm-defense-strategies.md`
- **Hardening reseau** → `generic/def-network-tls.md` + `rust-tauri/def-rust-network-tls-hardening.md`
- **Hardening par OS** → `platform/` pour les patterns specifiques a chaque OS
- **Hardening par stack** → `stack/` pour les patterns specifiques a chaque framework
- **Hardening infra** → `infra/` pour cloud, CI/CD, containers
