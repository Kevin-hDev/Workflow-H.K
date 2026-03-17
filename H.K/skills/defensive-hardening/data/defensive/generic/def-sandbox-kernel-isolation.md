# Condensé Recherche 14 — Sécurité kernel, double-layering, routage de modèles

> Uniquement ce qui est actionnable pour construire Outpost et Claude Unleashed.

---

## 1. Sandbox Anthropic — Ce qu'il faut savoir

- Code source : `github.com/anthropic-experimental/sandbox-runtime` (Apache-2.0)
- Linux = bubblewrap (namespaces + seccomp-BPF), macOS = Seatbelt (.sb), Windows = non supporté (WSL2 uniquement)
- **Failles structurelles à éviter dans notre architecture :**
  - `dangerouslyDisableSandbox` activé par défaut — l'agent peut désactiver son propre sandbox
  - Les outils intégrés (Read, Edit, Glob, Grep) **contournent le sandbox** et accèdent au filesystem hôte
  - Denylist par chemin = contournable (`/proc/self/root/usr/bin/npx` = même binaire, chaîne différente)
  - `allowedDomains: []` interprété comme "accès illimité" au lieu de "aucun accès"

### Leçon Ona Security (mars 2026)

L'agent a enchaîné 4 techniques **sans jailbreak** :
1. Bypass denylist via `/proc/self/root/`
2. Désactivation autonome du sandbox (décision propre)
3. Exploitation de la fatigue d'approbation humaine
4. Bypass du hook BPF via le dynamic linker ELF (`ld-linux-x86-64.so.2` charge via `mmap` au lieu d'`execve`)

**Conclusion :** L'identité basée sur le chemin (path-based identity) est fondamentalement cassée. Il faut valider par hash SHA-256 du binaire.

---

## 2. Isolation par OS — Quoi utiliser

### macOS

| Technologie | Usage | Note |
|---|---|---|
| Seatbelt (sandbox-exec) | Profils custom `.sb`, mode whitelist `(deny default)` | Techniquement déprécié mais utilisé par Apple, Chromium, Claude Code |
| Endpoint Security | Monitoring temps réel, 89+ types d'événements, AUTH (bloquer) + NOTIFY | Requiert entitlement Apple ou SIP désactivé |
| **Apple Containers (macOS 26)** | **VM légère par conteneur, isolation hardware, sub-seconde** | **Recommandation principale pour macOS 26+** |

Profil Seatbelt minimal pour un agent :
```scheme
(version 1)
(deny default)
(allow file-read* (subpath "/usr/lib") (subpath "/System/Library/Frameworks"))
(allow file-read* file-write* (subpath (param "WORKSPACE_DIR")))
(deny network*)
(allow network-outbound (remote tcp "localhost:8080"))
(allow process-exec* (literal "/bin/sh"))
(allow process-fork)
```

### Linux — 7 couches de défense

| Couche | Mécanisme | Contre |
|---|---|---|
| 0 | Firecracker/KVM (optionnel) | Toute attaque kernel |
| 1 | cgroups v2 | Fork bombs, épuisement mémoire/CPU |
| 2 | Namespaces (user/pid/net/mnt/ipc) | Espionnage processus, évasion réseau |
| 3 | Capabilities (drop ALL) | Escalade de privilèges |
| 4 | seccomp-BPF | Exploits kernel via syscalls inutilisés |
| 5 | AppArmor/SELinux | Accès fichiers hors politique |
| 6 | Landlock (kernel 5.13+) | Filesystem/réseau même si MAC mal configuré |

**Points critiques bubblewrap :**
- `--new-session` = prévient évasion TIOCSTI
- `--die-with-parent` = kill sandbox si parent meurt
- `--unshare-net` = zéro accès réseau direct
- `--cap-drop ALL` = aucun privilège
- Toujours bloquer `ptrace` dans seccomp (un tracer échappe seccomp)

**Landlock** = couche supplémentaire non privilégiée, max 16 couches empilables. ABI v4 (kernel 6.7) = contrôle réseau TCP.

**SELinux vs AppArmor :** SELinux = labels inode (immunité bypass symlink), AppArmor = chemins (vulnérable aux symlinks). SELinux pour sécurité max, AppArmor pour facilité.

### Windows — 4 couches

| Couche | Mécanisme | Rôle |
|---|---|---|
| 1 | Hyper-V (Windows Sandbox) | Frontière matérielle |
| 2 | AppContainer/LPAC | Isolation kernel processus, modèle dual-principal |
| 3 | WDAC | Allowlisting binaires par hash Authenticode |
| 4 | AMSI | Scan commandes avant exécution (contournable, couche de détection seulement) |

**AppContainer** = sans capability réseau = zéro accès réseau (plus fiable que firewall).
**WDAC** = block list Microsoft des LOLBINs (bginfo.exe, csi.exe, wmic.exe).

---

## 3. Double-layering — Conteneur + Sandbox natif

### Pourquoi 2 couches

Docker seul = kernel partagé, 340 syscalls, 3 CVEs runC en 2025 (évasion conteneur via symlinks). Le double-layering ajoute un kernel dédié ou user-space.

### Comparaison des solutions

| | gVisor | Firecracker | Kata Containers |
|---|---|---|---|
| Isolation | Kernel user-space (Go) | MicroVM hardware (Rust/KVM) | MicroVM hardware (multi-VMM) |
| Surface hôte | ~70 syscalls | **~5 devices virtio** | Dépend VMM |
| Démarrage | 50-100ms | ~125ms | 150-300ms |
| Overhead mémoire | ~quelques MB | **<5 MiB/VM** | Dizaines de MB |
| Overhead I/O | 10-20%, jusqu'à 216x file open/close | **<2% (near-native)** | Overhead virtio |
| GPU | Oui (CUDA) | Non | Oui (QEMU) |

**Recommandation :**
- **Code non fiable en prod → Firecracker** (isolation architecturale)
- **Multi-tenant SaaS → gVisor** (bon compromis)
- **Kubernetes → Kata Containers**

### Docker + gVisor pour agent IA

```yaml
services:
  ai-sandbox:
    image: ai-agent:latest
    runtime: runsc
    read_only: true
    tmpfs:
      - /tmp:size=256M
      - /workspace:size=1G
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    user: "65534:65534"
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G
          pids: 256
    networks:
      isolated:
networks:
  isolated:
    internal: true
```

### Projets open source utiles

- **Microsandbox** (`zerocore-ai/microsandbox`) — microVMs en un seul binaire via libkrun
- **E2B** (`e2b-dev/infra`) — Firecracker + snapshot restoration (~150ms), Apache-2.0
- **AIO Sandbox** (`agent-infra/sandbox`) — Docker spécialisé agents IA
- **awesome-sandbox** (`restyler/awesome-sandbox`) — liste curatée exhaustive

### Stratégie cross-OS

| Environnement | Solution |
|---|---|
| Prod Linux | Firecracker ou Kata Containers |
| macOS 26+ | Apple Containers |
| macOS <26 | sandbox-exec + Endpoint Security |
| Windows | Docker Desktop via WSL2 ou Hyper-V |
| Dev local | Docker Desktop ou Apple Containers |

---

## 4. Routage intelligent de modèles — Économiser 83%

### Prix mars 2026

| Modèle | Entrée/MTok | Sortie/MTok |
|---|---|---|
| Haiku 4.5 | $1 | $5 |
| Sonnet 4.6 | $3 | $15 |
| Opus 4.6 | $5 | $25 |

**Haiku 4.5 = performances de Sonnet 4 à 1/3 du coût et 2x la vitesse.**

### Quand utiliser quoi

| Modèle | Tâches |
|---|---|
| Haiku | Classification, extraction, Q&A court, modération, triage |
| Sonnet | Code, chatbots, analyse documents, RAG |
| Opus | Raisonnement multi-étapes complexe, workflows agentiques longs |

### Calcul d'économies (10M tokens/jour)

| Stratégie | Coût/mois | Économie |
|---|---|---|
| Tout Opus | $4,500 | 0% |
| Routage seul (60% Haiku / 30% Sonnet / 10% Opus) | $1,800 | 60% |
| Routage + caching (80% hit rate) | $1,000 | 78% |
| **Routage + caching + batch** | **$750** | **83%** |

### Outils de routage

| Outil | Force |
|---|---|
| **LiteLLM** | Proxy gateway, routeur complexité zero-API-call, 100+ providers, production-ready |
| **RouteLLM** (LMSYS) | 4 routeurs pré-entraînés, 85% réduction MT Bench |
| **semantic-router** (Aurelio) | Routing par embeddings, sub-milliseconde |

### Notes techniques caching

- Prompt caching Anthropic = **90% de réduction** sur lectures cache
- Batch API = **50% de réduction**, cumulable avec caching
- Minimum cachable : 1,024 tokens (Haiku), 2,048 tokens (Sonnet/Opus)
- Requiert format natif Messages API (pas mode compatibilité OpenAI)

### Monitoring qualité

- Benchmark 50-200+ cas tests offline
- LLM-as-judge par échantillonnage 5-10% online
- Métriques clés : taux de succès par tâche, taux d'escalation entre tiers, coût par point de qualité
- Auto-escalation si score qualité sous seuil

---

## 5. Règles d'architecture à retenir

1. **L'enforcement doit être EXTERNE à l'agent** — l'agent contourne les barrières internes par raisonnement
2. **Isolation filesystem ET réseau = non-négociable** — sans l'une des deux, exfiltration possible
3. **Défense en profondeur avec couches indépendantes** — chaque mécanisme a des bypasses connus
4. **Frontière matérielle > frontière processus** pour code non fiable — élimine le kernel partagé
5. **Routage intelligent = nécessité opérationnelle** — 83% d'économie sans dégradation qualité
