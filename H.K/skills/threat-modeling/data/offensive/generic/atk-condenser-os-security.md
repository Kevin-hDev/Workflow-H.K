# OS Security 2025-2026 — Condensé (Desktop Apps: Tauri/Electron/Flutter)

## WINDOWS

### UAC Bypass
- **Fodhelper** (Glupteba, ValleyRAT) : écrit payload dans `HKCU\Software\Classes\ms-settings\shell\open\command` + `DelegateExecute` vide → auto-élévation. Variantes : eventvwr, computerdefaults, sdclt, CMSTP.
- **COM auto-elevation** : rundll32 charge DLL craftée → objet COM élevé → opérations fichier privilégiées silencieuses.
- Fix : UAC = "Always Notify", WDAC, Sysmon sur `HKCU\Software\Classes` + symbolic links.

### WDAC vs AppLocker
- WDAC = kernel mode (CI.dll), frontière sécurité officielle → bounties. AppLocker = user mode → **pas une frontière de sécurité**.
- **Bypass WDAC** : LOLBAS (MSBuild, InstallUtil, mshta). IBM X-Force 2024 : **legacy Teams (Electron, signé Microsoft)** weaponisable en remplaçant `/resources/app/` JS → base du **Loki C2**.
- Tauri moins risqué : pas de répertoire JS remplaçable post-signature.

### VBS / Credential Guard
- Win11 22H2+ / Server 2025 : Credential Guard isole LSASS dans VTL1 (LSAIso.exe). **Mimikatz sekurlsa::logonpasswords ne fonctionne plus.**
- HVCI bloque drivers non signés. Conséquence : pivot vers vol de tokens navigateur, ADCS abuse (16 chemins ESC).

### AMSI Bypass (évolution)
- Classique (patch `AmsiScanBuffer`) : détecté par ETWTi.
- **Actuel OpSec-safe** : hardware breakpoint via VEH (CrowdStrike Black Hat MEA) — breakpoint sur AmsiScanBuffer, VEH redirige vers return propre.
- **AMSI Write Raid** (OffSec 2024-25) : entrée writable dans System.Management.Automation.dll, sans VirtualProtect.
- Détection : NtSetContextThread via ETW `Microsoft-Windows-Kernel-Audit-API-Calls`.

### SmartScreen / MotW — CVEs
| CVE | CVSS | Description | Statut |
|-----|------|-------------|--------|
| CVE-2024-21412 | 8.8 | .url shortcut MotW bypass (Water Hydra APT + WebDAV) | Patché |
| CVE-2024-29988 | 8.8 | Bypass via archive zippée | Patché |
| CVE-2025-0411 | — | 7-Zip : MotW non propagé double-compression (Ukraine) | Patché |
| CVE-2026-21510 | 8.8 | Shell SmartScreen bypass 0-day (fév 2026) | Exploité actif |
| CVE-2026-21513 | 8.8 | MSHTML security bypass 0-day (fév 2026) | Exploité actif |

ISO/VHD/VHDX efficaces : fichiers montés n'héritent pas du MotW. Depuis mars 2024 : EV certs ne donnent plus la réputation SmartScreen instantanément.

### CVEs Kernel Windows
| CVE | CVSS | Impact | Statut |
|-----|------|--------|--------|
| CVE-2025-62215 | 7.0 | Race condition + double-free → SYSTEM | Patché nov 2025 |
| CVE-2025-24983 | 7.0 | Win32 Kernel UAF, attaques ciblées (ESET) | Patché mar 2025 |
| CVE-2026-21519 | 7.8 | Desktop Window Manager EoP 0-day | Patché fév 2026 |
| CVE-2025-55234 | 9.8 | SMB auth bypass via credential replay | Critique |
| CVE-2025-33073 | 8.8 | NTLM reflection nouvelle technique (Synacktiv) → SYSTEM remote | Sans patch SMB signing |
| CVE-2025-49708 | 9.9 | Graphics Component VM escape → SYSTEM hôte | Critique |
| CVE-2025-60724 | 9.8 | Graphics heap overflow RCE | Critique |

### DLL Hijacking + Potato Family
- Ordre DLL : Known DLLs → app dir → System32 → System → Windows → cwd → PATH.
- **Phantom DLL** : cible DLLs inexistantes (plus dur à détecter). **Side-loading** dans apps signées → bypass WDAC (voir Electron).

| Outil | Statut 2025 | Prérequis |
|-------|-------------|-----------|
| JuicyPotato | Mort (Win10 1809+) | CLSID legacy |
| PrintSpoofer | Actif | SeImpersonatePrivilege |
| GodPotato | Très utilisé | SeImpersonatePrivilege |
| SigmaPotato | Actif | Support OS étendu |
| PrintNotifyPotato | Actif | Spooler désactivé OK |

### NTLM / ADCS
- PetitPotam (CVE-2021-36942) : coercion non-auth bloquée, **auth toujours possible**.
- **16 chemins ESC** documentés. ESC15 ("EKUwu", CVE-2024-49019) : injection arbitraire de policy via templates V1 schema.
- Fix : SMB signing partout, EPA sur ADCS/IIS, désactiver NTLM.

### DPAPI
- Clé de backup domaine **immuable** → compromission = reconstruction domaine entier (SpecterOps juil 2025).
- Mimikatz : `dpapi::masterkey /rpc` + `lsadump::backupkeys /export`.
- Credential Guard (VTL1) protège les master keys → mitigation principale.
- Desktop apps : `CryptProtectData()` avec `CRYPTPROTECT_LOCAL_MACHINE`, jamais dans dossiers lisibles globalement.

---

## LINUX

### MAC Layers (SELinux / AppArmor / seccomp)
- **SELinux** : Type Enforcement (domaine process ↔ type fichier). Booleans dangereux : `httpd_can_network_connect`, `selinuxuser_execmod`. openSUSE → SELinux par défaut fév 2025.
- **AppArmor** : path-based. Hard links contournent (mitigé par Yama). Pas de filtrage réseau granulaire.
- **seccomp-bpf** : filtre syscalls à l'entrée kernel. `SECCOMP_RET_KILL` / `SECCOMP_RET_ERRNO`. Docker bloque ~44 syscalls (bpf, userfaultfd, keyctl...). **Limite** : ne peut pas inspecter les arguments pointeur.
- **Landlock** (kernel 5.13+, ABI v7 mars 2025) : auto-sandbox sans root, filesystem + TCP + sockets UNIX + signals. Hérité par enfants, non relaxable. **Idéal pour Tauri/Electron post-init.**

### CVEs Kernel Linux 2025
| CVE | CVSS | Description |
|-----|------|-------------|
| CVE-2025-21756 | 7.8 | vsock UAF "Attack of the Vsock" → root, PoC public |
| CVE-2025-38236 | — | UNIX sockets MSG_OOB UAF (Jann Horn) → **Chrome sandbox escape → kernel control** (kernel 6.9+) |
| CVE-2025-38617 | — | Packet socket race → privesc + container escape, CAP_NET_RAW, existait depuis Linux 2.6.12 |
| CVE-2025-38352 | — | POSIX CPU timers TOCTOU, exploité in-the-wild, CISA KEV sept 2025 |
| CVE-2024-1086 | — | netfilter nf_tables UAF, CISA KEV |

**5 530 CVEs kernel en 2025** (+28%). 7 entrées CISA KEV kernel.

### io_uring — Rootkit "Curing" (ARMO, avril 2025)
- 61 opérations io_uring **contournent la surveillance syscall traditionnelle**.
- Evade : Falco, Microsoft Defender for Linux, eBPF-based tools.
- Google a désactivé io_uring sur Android.
- Fix : KRSI (Kernel Runtime Security Instrumentation) + Tetragon configuré spécifiquement.

### eBPF Verifier Bugs
- Pattern : verifier exploité → OOB map → leak kernel pointers → overwrite credentials → root.
- CVE-2025-0009 (type confusion), CVE-2025-21362 (bypass SELinux/AppArmor), CVE-2023-2163 (branch pruning).
- **`kernel.unprivileged_bpf_disabled=1` : critique en production.**

### Container Escapes runc (novembre 2025)
| CVE | Description | Fix |
|-----|-------------|-----|
| CVE-2025-31133 | Race : `/dev/null` → symlink → `core_pattern` → code exec hôte | runc v1.2.8+ |
| CVE-2025-52565 | `/dev/console` bind-mount race → écriture procfs | runc v1.2.8+ |
| CVE-2025-52881 | Contourne tous les LSMs, redirige vers `core_pattern` ou `sysrq-trigger` | runc v1.2.8+, affecte crun/youki |
| CVE-2024-21626 | "Leaky Vessels" : fd leak via `WORKDIR /proc/self/fd/7/` → filesystem hôte | Metasploit dispo |

Escapes classiques : cgroup v1 `release_agent` (mitigé par cgroup-v2), `core_pattern` write, exposition socket Docker.

### Wayland vs X11
- **X11** : toute app connectée peut keylogger, capturer écran, injecter input. CVE-2025-62229/62230/62231 (UAF/overflow 20+ ans). **Red Hat supprime Xorg de RHEL 10 en 2025.**
- **Wayland** : isolation client par design, capture écran = permission explicite xdg-desktop-portal.
- Electron : Wayland via `--ozone-platform=wayland`. Tauri : WebKitGTK natif Wayland → meilleure posture.

### Secret Storage Linux — Faille critique
- Fallback : quand aucun keyring daemon n'est actif, **Chromium/Electron chiffrent avec un mot de passe hardcodé** → équivalent à pas de chiffrement.
- Tout process sur le session D-Bus peut lire les secrets (pas d'isolation par app).
- Fix : libsecret simple API (portail Flatpak auto), détecter + avertir si pas de keyring daemon.

---

## macOS

### TCC Bypasses — CVEs Critiques
| CVE | CVSS | Description |
|-----|------|-------------|
| CVE-2025-43530 | — | VoiceOver `com.apple.scrod` : `SecStaticCodeCreateWithPath` (path-based) au lieu d'audit token → TOCTOU → code arbitraire dans binaires Apple-signés → micro/cam/docs silencieux. PoC public. |
| CVE-2025-24204 | 9.8 | `/usr/bin/gcore` avec `com.apple.system-task-ports.read` → lecture mémoire tout process même SIP actif → dump `securityd` → master Keychain key |
| CVE-2025-8672/9190/53811/53813 | — | Apps avec Python bundlé ou **Electron RunAsNode activé** héritent TCC parent → code arbitraire via interpréteur. **Critique Electron/Tauri.** |
| CVE-2025-8597/8700 | — | `com.apple.security.get-task-allow` en prod → tout process local peut injecter + hériter TCC. **Ne jamais shipper en prod.** |

### SIP Bypasses
- **CVE-2024-44243** (patché déc 2024) : `storagekitd` avec `com.apple.rootless.install.heritable` → drop bundle dans `/Library/Filesystems` → binaires custom sans SIP → rootkit/TCC bypass.
- **Principe** : bypass une restriction SIP = bypass toutes les autres.

### macOS Kernel / WebKit Zero-Days 2025-2026
| CVE | CVSS | Description |
|-----|------|-------------|
| CVE-2025-24118 | 9.8 | XNU race condition credentials (zalloc_ro_mut non-atomique) → privesc kernel |
| CVE-2025-43529 | — | WebKit UAF → code exec arbitraire, attaques ciblées "extremely sophisticated" (Google TAG) |
| CVE-2025-14174 | — | WebKit/ANGLE memory corruption → **impacte Electron ET Tauri simultanément** |
| CVE-2026-20700 | — | dyld memory corruption 0-day (fév 2026), premier 0-day exploité 2026, affecte toutes les apps macOS |

### Sandbox Escapes XPC
- **CVE-2024-54498** (CVSS 8.8) : path traversal dans `sharedfilelistd` → escape + PoC récupère sandbox token.
- **CVE-2025-31191** (Microsoft) : security-scoped bookmarks — supprimer ACL `com.apple.scopedbookmarksagent.xpc` → insérer secret connu → forger bookmarks → accès fichier arbitraire depuis toute app sandboxée.
- **CVE-2025-24277** : `osanalyticshelperd` crash report → symlink race → fichiers arbitraires en root.
- Chercheur jhftss : 10+ escapes CVE en 2023-2024 via XPC services sans validation client.

### Dylib Hijacking
1. `DYLD_INSERT_LIBRARIES` : bloqué par SIP + Hardened Runtime. CVE-2025-62686 : apps sans hardened runtime encore vulnérables.
2. **@rpath hijacking** : plusieurs LC_RPATH → dylib absente du chemin primaire → attaquant plante dans chemin antérieur.
3. `LC_LOAD_WEAK_DYLIB` : dylibs optionnelles → attaquant fournit version malveillante.
4. `DYLD_FALLBACK_LIBRARY_PATH` : process non restreint cherche dans `$HOME/lib` et `/usr/local/lib`.

Fix : Hardened Runtime (`codesign --options runtime`), Library Validation, `__RESTRICT` segment, sanitiser variables DYLD_* au démarrage.

### Entitlements Hardened Runtime
| Entitlement | Risque |
|-------------|--------|
| `cs.allow-jit` | Requis V8 ; augmente surface |
| `cs.disable-library-validation` | **HIGH** — enable dylib hijacking |
| `cs.debugger` | **TRÈS HIGH** — lecture/écriture mémoire autre process |
| `get-task-allow` | **JAMAIS en production** |

Helpers : fichiers d'entitlements séparés obligatoires.

---

## COMPARATIF CROSS-OS

### Secret Storage
| Feature | Windows DPAPI | macOS Keychain | Linux Secret Service |
|---------|--------------|----------------|---------------------|
| Chiffrement | AES-256, PBKDF2 | AES-256-GCM, Secure Enclave | AES-128 GNOME Keyring |
| Hardware | TPM optionnel | Secure Enclave (T2/M) | Aucun |
| Isolation par app | Implicite (tout process user) | ACLs explicites | Aucune (session D-Bus) |
| Faille critique | Domain backup key immuable | Dump mémoire → master key | **Mot de passe hardcodé en fallback** |

### Sandboxing
- **AppContainer** (Win) : 6 dimensions kernel-enforced.
- **App Sandbox** (macOS) : seatbelt + entitlements.
- **Flatpak** : namespaces + seccomp + cgroups. `filesystem=home` = sandbox nulle.
- **Tauri v2** : deny-by-default IPC, permissions par fenêtre/commande.

### Auto-Update Signatures
- **Tauri updater** : Ed25519 (Minisign) **obligatoire**, non désactivable.
- **electron-updater** : historiquement comparaison string `publisherName` (pas crypto). **CVE-2025-55305** : V8 heap snapshots non vérifiés malgré ASAR integrity fuses → backdoor dans Signal/1Password/Slack/Chrome. Fix Electron 35.7.5+/36.8.1+/37.3.1+/38.0.0-beta.6+.
- **Sparkle** CVE-2025-10015/10016 : pas de validation client XPC → trigger update avec bundle arbitraire → LPE root.

### IPC
| | Windows Named Pipes | macOS XPC | Linux D-Bus |
|-|--------------------|-----------|----|
| Sécurité défaut | DACL (anyone peut lire) | Entitlement + code signing | Tout process session |
| Attaques | Pipe squatting, Potato | XPC interception | Polkit (CVE-2021-3560, PwnKit) |
| MitM | **Élevé** | Faible | Modéré |

### Frameworks Desktop
| Dimension | Tauri v2 | Electron (durci) | Flutter Desktop |
|-----------|----------|-----------------|----------------|
| Défaut sécurité | Deny-by-default IPC | Config explicite requise | Aucun modèle |
| Surface attaque | ~3-10 MB (OS WebView) | ~150 MB (Chromium bundlé) | ~20-50 MB natif |
| XSS→RCE | Faible (capability-gated) | Élevé sans config | N/A |
| Mémoire | Rust (compile-time) | Node.js (prototype pollution) | Dart (GC) |
| Signatures update | Ed25519 obligatoire | Optionnel, historiquement faible | Aucun |
| Rétro-ingénierie | Binaire Rust (difficile) | ASAR unpack (trivial) | AOT Dart (modéré) |
| Audit formel | ROS 2024 (publié) | Aucun publié | Aucun publié |

Audit Tauri ROS (nov 2023 – août 2024) : 11 High, 2 Elevated, 3 Moderate, 5 Low — tous corrigés. Findings clés : IPC appelable depuis n'importe quelle origine (TAU2-003), IDs ressource séquentiels cross-window (TAU2-044/047), FS plugin merge scopes cross-windows (TAU2-049).

**CVE Tauri** : CVE-2025-31477 (CVSS 9.3) : `plugin-shell` exécution via protocoles dangereux (file://, smb://, nfs://). CVE-2024-24576 : Rust stdlib Windows Command injection (batch files).
