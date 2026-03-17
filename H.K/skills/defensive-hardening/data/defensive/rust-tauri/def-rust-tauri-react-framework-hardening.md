# tauri-react-framework-hardening.md
# Blindage du framework Tauri v2 + React — défenses concrètes

Ce fichier documente les protections à appliquer au niveau du framework Tauri v2 (configuration, IPC, WebView) et du frontend React (XSS, sanitization HTML). Toutes les configurations sont directement utilisables dans un projet Tauri v2.

---

## Vue d'ensemble

Tauri v2 est deny-by-default : sans capability explicite, aucune commande n'est accessible depuis la WebView. Mais plusieurs erreurs de configuration fréquentes annulent cette protection : wildcards excessifs dans les scopes, CSP absente ou trop permissive, commandes `#[tauri::command]` accessibles sans guard d'authentification, et contenu HTML rendu sans sanitization. Ce fichier couvre chaque couche de protection, de la configuration JSON jusqu'au composant React.

---

## 1. Capabilities deny-by-default : principes et configurations

### La règle fondamentale

Chaque capability doit accorder le **minimum strict** nécessaire. Un wildcard `"path": "**"` donne accès à tout le filesystem. Un `"args": true` sur un sidecar autorise n'importe quel argument — équivalent à une injection de commande.

### Configuration capability minimale pour un projet type

```json
// src-tauri/capabilities/main.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Capability minimale pour la fenêtre principale",
  "windows": ["main"],
  "platforms": ["linux", "macOS", "windows"],
  "permissions": [
    "core:default",
    {
      "identifier": "fs:allow-read-text-file",
      "allow": [{ "path": "$APPDATA/db.sqlite" }]
    },
    {
      "identifier": "fs:allow-write-text-file",
      "allow": [{ "path": "$APPDATA/db.sqlite" }]
    }
  ]
}
```

```json
// src-tauri/capabilities/sidecar.json — capability séparée pour l'accès sidecar
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "sidecar-capability",
  "windows": ["main"],
  "permissions": [
    {
      "identifier": "shell:allow-spawn",
      "allow": [
        {
          "name": "binaries/cyber_news_scraper",
          "sidecar": true,
          "args": [
            "--scrape",
            {
              "validator": "^https://[a-zA-Z0-9][a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(/[a-zA-Z0-9._~:/?#@!$&'()*+,;=-]*)?$"
            },
            "--output",
            { "validator": "^[a-zA-Z0-9_-]{1,64}\\.json$" },
            "--exclude-keywords",
            { "validator": "^[a-zA-Z0-9 ,_-]{1,500}$" }
          ]
        }
      ]
    }
  ]
}
```

```json
// src-tauri/capabilities/http.json — requêtes HTTP avec deny des IP internes
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "http-capability",
  "windows": ["main"],
  "permissions": [
    {
      "identifier": "http:allow-fetch",
      "allow": [
        { "url": "https://api.anthropic.com/**" },
        { "url": "https://api.groq.com/**" }
      ],
      "deny": [
        { "url": "http://**" },
        { "url": "https://169.254.169.254/**" },
        { "url": "https://localhost/**" },
        { "url": "https://127.0.0.1/**" },
        { "url": "https://10.*/**" },
        { "url": "https://172.16.*/**" },
        { "url": "https://192.168.*/**" }
      ]
    }
  ]
}
```

### Deny scopes critiques pour le filesystem

```json
// Toujours ajouter ces deny explicites quand $HOME ou $APPDATA est utilisé.
{
  "identifier": "fs:allow-read-text-file",
  "allow": [{ "path": "$APPDATA/**" }],
  "deny": [
    { "path": "$HOME/.ssh/**" },
    { "path": "$HOME/.aws/**" },
    { "path": "$HOME/.gnupg/**" },
    { "path": "$HOME/.config/gh/**" },
    { "path": "$HOME/.docker/**" },
    { "path": "$HOME/.npmrc" },
    { "path": "$HOME/.pypirc" },
    { "path": "$APPLOCALDATA/EBWebView/**" }
  ]
}
```

### Guard Rust sur les commandes sensibles

```rust
// Pattern obligatoire pour les commandes qui modifient des données ou accèdent à des secrets.
// Vérification : authentification + fenêtre d'origine.
#[tauri::command]
async fn action_privilegiee(
    auth: tauri::State<'_, tokio::sync::Mutex<AuthState>>,
    webview_window: tauri::WebviewWindow,
) -> Result<String, String> {
    let auth = auth.lock().await;

    // Vérifier que l'authentification est valide.
    if !auth.is_authenticated() {
        return Err("Non autorisé".to_string());
    }

    // Vérifier que la commande vient de la fenêtre principale (pas d'un iframe).
    if webview_window.label() != "main" {
        return Err("Fenêtre non autorisée".to_string());
    }

    // Vérifier que la session n'a pas expiré.
    if auth.is_session_expired() {
        return Err("Session expirée".to_string());
    }

    Ok("Action exécutée".to_string())
}

pub struct AuthState {
    authenticated: bool,
    session_expiry: std::time::Instant,
}

impl AuthState {
    pub fn is_authenticated(&self) -> bool {
        self.authenticated
    }

    pub fn is_session_expired(&self) -> bool {
        std::time::Instant::now() > self.session_expiry
    }
}
```

### Restriction des commandes au build-time

```rust
// build.rs — liste explicite des commandes autorisées.
// Toute commande enregistrée dans invoke_handler mais absente ici est inaccessible.
fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(
                tauri_build::AppManifest::new()
                    .commands(&[
                        "get_articles",
                        "search_articles",
                        "store_api_key",
                        "delete_api_key",
                        "launch_scraper",
                    ])
            ),
    ).expect("Échec de la compilation Tauri");
}
```

---

## 2. CSP stricte : configuration production et développement

### CSP production

```json
// tauri.conf.json
{
  "app": {
    "security": {
      "csp": {
        "default-src": "'self' customprotocol: asset:",
        "script-src": "'self'",
        "style-src": "'self' 'unsafe-inline'",
        "connect-src": "ipc: http://ipc.localhost",
        "img-src": "'self' asset: http://asset.localhost https: blob: data:",
        "font-src": "'self' data:",
        "object-src": "'none'",
        "base-uri": "'self'",
        "form-action": "'self'",
        "frame-ancestors": "'none'",
        "frame-src": "'none'"
      },
      "freezePrototype": true,
      "dangerousDisableAssetCspModification": false
    }
  }
}
```

Points clés de cette CSP :
- `script-src 'self'` sans `'unsafe-inline'` : Tauri injecte automatiquement des hashes SHA-256 pour les scripts inline légitimes au build — ne jamais désactiver avec `dangerousDisableAssetCspModification: true`.
- `frame-src 'none'` et `frame-ancestors 'none'` : bloquent les iframes entrants et sortants.
- `object-src 'none'` : bloque Flash, Java, et autres plugins.
- `freezePrototype: true` : gèle `Object.prototype` contre les attaques de prototype pollution.
- `connect-src ipc:` : autorise uniquement l'IPC Tauri, pas les requêtes vers des serveurs externes depuis le frontend.

### CSP développement (avec HMR Vite)

```json
// Utiliser devUrl + un devCsp séparé pour les builds de développement.
// Ne JAMAIS mettre 'unsafe-eval' en production (requis par Vue.js templates non compilés).
{
  "app": {
    "security": {
      "devCsp": {
        "default-src": "'self' customprotocol: asset:",
        "script-src": "'self' 'unsafe-inline'",
        "style-src": "'self' 'unsafe-inline'",
        "connect-src": "ipc: http://ipc.localhost ws://localhost:* http://localhost:*",
        "img-src": "'self' asset: blob: data: https:",
        "font-src": "'self' data:"
      }
    }
  }
}
```

### Piège Vite : ne jamais exposer TAURI_PRIVATE_KEY

```typescript
// vite.config.ts — CORRECT
export default defineConfig({
  envPrefix: ['VITE_'],  // Jamais ['VITE_', 'TAURI_']
  // TAURI_PRIVATE_KEY serait exposé dans le bundle si 'TAURI_' était inclus.
});
```

---

## 3. Tauri Isolation Pattern : iframe sandboxé + IPC chiffré

### Activation de l'Isolation Pattern

```json
// tauri.conf.json
{
  "app": {
    "security": {
      "pattern": {
        "use": "isolation",
        "options": {
          "dir": "../dist-isolation"
        }
      }
    }
  }
}
```

### Contenu de l'iframe d'isolation (dist-isolation/index.html)

```html
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline'">
  </head>
  <body>
    <script>
      // Hook d'isolation — inspecte et filtre chaque message IPC sortant.
      // Ce code s'exécute dans un contexte sandboxé séparé du frontend.
      window.__TAURI_ISOLATION_HOOK__ = (payload) => {
        // Validation : seules les actions dans la liste blanche sont autorisées.
        const ACTION_ALLOWLIST = new Set([
          'get_articles',
          'search_articles',
          'store_api_key',
          'delete_api_key',
          'launch_scraper',
        ]);

        if (!ACTION_ALLOWLIST.has(payload.cmd)) {
          console.warn('[Isolation] Commande non autorisée :', payload.cmd);
          return null; // null = bloquer le message
        }

        // Validation de la taille du payload pour éviter les DoS.
        const payloadStr = JSON.stringify(payload);
        if (payloadStr.length > 65536) {
          console.warn('[Isolation] Payload trop volumineux');
          return null;
        }

        return payload; // Laisser passer
      };
    </script>
  </body>
</html>
```

### Limitation connue de l'Isolation Pattern

L'audit Radically Open Security (2024) a montré que sur Windows et Android, la clé AES-GCM peut être exfiltrée depuis le JavaScript du iframe d'isolation si la clé est marquée `extractable: true` dans SubtleCrypto (issue TAU2-040). Sur Linux, les iframes ne sont pas distinguées de la fenêtre principale (pas de `__TAURI_INVOKE_KEY__` distinct). L'Isolation Pattern est une **défense en profondeur utile**, pas une frontière de sécurité absolue.

---

## 4. WebView hardening : DevTools, file-drop, configuration

```json
// tauri.conf.json — configuration WebView sécurisée
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Mon Application",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false,
        "fileDropEnabled": false
      }
    ]
  }
}
```

```toml
# Cargo.toml — ne JAMAIS activer devtools en production
# [features]
# devtools = ["tauri/devtools"]   # Uniquement pour le développement
#
# La feature devtools active une API privée macOS incompatible avec l'App Store
# et expose l'ensemble du DOM et de la mémoire JS à quiconque peut ouvrir les DevTools.
```

```json
// tauri.conf.json — désactiver withGlobalTauri en production
{
  "app": {
    "withGlobalTauri": false
  }
}
// withGlobalTauri: true expose window.__TAURI__ dans le contexte global,
// facilitant l'exploitation post-XSS. Avec false, seul __TAURI_INTERNALS__
// reste accessible (nécessaire pour le fonctionnement), mais window.__TAURI__
// n'est pas disponible pour les scripts tiers.
```

---

## 5. React XSS prevention : DOMPurify + output encoding

### Règle fondamentale

React échappe le contenu textuel dans `{variable}` mais **pas** :
- `href="javascript:..."` : React logue un warning depuis v16.9 mais n'empêche pas l'exécution
- `dangerouslySetInnerHTML` : contourne totalement l'échappement
- `divRef.current.innerHTML = ...` : contourne React entièrement
- Attributs SVG : `<svg onload="...">` exécute du JavaScript

### Configuration DOMPurify pour le contenu scrapé

```typescript
// src/lib/sanitizer.ts
import DOMPurify from 'dompurify';

// Hook ajouté une seule fois au chargement du module.
// Force rel=noopener sur tous les liens et valide les URLs.
DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
    const href = node.getAttribute('href');
    if (href) {
      try {
        const url = new URL(href, window.location.origin);
        // Seuls http:, https:, et mailto: sont autorisés.
        // javascript:, data:, vbscript: sont bloqués.
        if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
          node.removeAttribute('href');
        }
      } catch {
        // URL malformée — supprimer l'attribut.
        node.removeAttribute('href');
      }
    }
  }

  if (node.tagName === 'IMG') {
    const src = node.getAttribute('src');
    if (src) {
      try {
        const url = new URL(src, window.location.origin);
        if (!['http:', 'https:'].includes(url.protocol)) {
          node.removeAttribute('src');
        }
      } catch {
        node.removeAttribute('src');
      }
    }
    // Chargement lazy pour éviter les requêtes réseau au tracking.
    node.setAttribute('loading', 'lazy');
  }
});

export const ARTICLE_PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'img', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'em', 'strong', 'b', 'i', 'u', 'br', 'hr',
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'figure', 'figcaption', 'span', 'div', 'sub', 'sup',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'width', 'height',
    'loading', 'target', 'rel', 'colspan', 'rowspan', 'scope',
  ],
  ALLOW_DATA_ATTR: false,     // Interdit data-* (vecteur d'exfiltration CSS)
  ALLOW_ARIA_ATTR: false,     // Interdit aria-* (non nécessaire pour le contenu scrapé)
  USE_PROFILES: { html: true }, // Bloque SVG et MathML (vecteurs mXSS)
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'svg', 'math'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
};

// Utiliser DOMPurify >= 3.2.4 pour corriger CVE-2025-26791 (mXSS namespace MathML/SVG).
export function sanitizeArticleHtml(rawHtml: string): string {
  return DOMPurify.sanitize(rawHtml, ARTICLE_PURIFY_CONFIG);
}
```

### Composant ArticleContent — rendu sécurisé

```tsx
// src/components/ArticleContent.tsx
import { useMemo } from 'react';
import { sanitizeArticleHtml } from '../lib/sanitizer';

interface ArticleContentProps {
  html: string;
}

// Seul endroit dans l'application où dangerouslySetInnerHTML est autorisé.
// La sanitization DOMPurify est appliquée AVANT chaque rendu.
// useMemo évite de re-sanitizer à chaque re-render si html n'a pas changé.
export function ArticleContent({ html }: ArticleContentProps) {
  const sanitized = useMemo(() => sanitizeArticleHtml(html), [html]);

  return (
    <article
      className="article-content"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
```

### Composant SafeLink — validation des protocoles

```tsx
// src/components/SafeLink.tsx
interface SafeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

// Wrapper pour les liens dont l'URL vient d'une source externe.
// Bloque les href="javascript:", "data:", "vbscript:" que React ne filtre pas.
export function SafeLink({ href, children, className }: SafeLinkProps) {
  const isValid = useMemo(() => {
    try {
      const url = new URL(href, window.location.origin);
      return ['http:', 'https:', 'mailto:'].includes(url.protocol);
    } catch {
      return false;
    }
  }, [href]);

  return (
    <a
      href={isValid ? href : '#'}
      rel="noopener noreferrer nofollow"
      target="_blank"
      className={className}
      // onClick bloqué si l'URL est invalide — protection supplémentaire.
      onClick={isValid ? undefined : (e) => e.preventDefault()}
    >
      {children}
    </a>
  );
}
```

---

## 6. Défense contre mXSS (CVE-2025-26791 DOMPurify)

### Le problème

CVE-2025-26791 (février 2025) affecte DOMPurify < 3.2.4. Une confusion de namespace MathML/SVG permet de contourner la sanitization via une séquence HTML spécialement construite :

```html
<!-- Payload d'attaque CVE-2025-26791 -->
<math><mtext><table><mglyph><style><!--</style>
<img src=x onerror="alert(1)">--></style></table></mtext></math>
```

### La défense

```bash
# Mettre à jour DOMPurify vers >= 3.2.4 (correction CVE-2025-26791).
npm install dompurify@latest
npm install --save-dev @types/dompurify@latest
```

```tsx
// Alternative recommandée pour les résumés LLM : react-markdown + rehype-sanitize.
// Cette combinaison évite structurellement le mXSS car elle travaille
// sur un AST — jamais de cycle parse → serialize → reparse.
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

const SCHEMA_SECURISE = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: ['href', 'title'],
    img: ['src', 'alt', 'title'],
    // Autoriser uniquement les classes de code avec préfixe "language-"
    code: [['className', /^language-/]],
  },
  protocols: {
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https'],
    // Explicitement vide pour bloquer data:, javascript:, etc.
    cite: ['http', 'https'],
  },
};

export function ResumeLLM({ contenu }: { contenu: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, SCHEMA_SECURISE]]}
    >
      {contenu}
    </ReactMarkdown>
  );
}

// react-markdown est sûr par défaut sans rehypeRaw :
// - Le HTML brut est ignoré
// - defaultUrlTransform bloque javascript:, data:, vbscript:, file:
// - Pas de innerHTML utilisé — tout passe par JSX
//
// Le DANGER est d'ajouter rehype-raw SANS rehype-sanitize.
// Toujours utiliser les deux ensemble si rehype-raw est requis.
```

---

## 7. Filtrage des événements Tauri : listen/emit scope restriction

### Le problème

`app.emit()` en Rust et `emit()` en TypeScript envoient des événements à toutes les fenêtres par défaut. Un événement contenant des données sensibles peut être reçu par une fenêtre non prévue ou par un script malveillant via `listen()`.

### La défense

```rust
// Rust — émettre vers une fenêtre spécifique uniquement.
use tauri::Manager;

#[tauri::command]
async fn notifier_resultat(app: tauri::AppHandle, data: String) {
    // emit() envoie à toutes les fenêtres — à éviter pour les données sensibles.
    // app.emit("resultat", &data);  // TROP LARGE

    // emit_to() cible une fenêtre spécifique.
    if let Some(fenetre) = app.get_webview_window("main") {
        fenetre.emit("resultat-scraping", &data)
            .unwrap_or_else(|e| tracing::warn!("Emit échoué : {}", e));
    }
}

// Pour les événements globaux, filtrer les données sensibles avant émission.
fn emettre_statut_public(app: &tauri::AppHandle, statut: &str) {
    // N'émettre que le statut, jamais les données sensibles.
    app.emit("statut-app", statut).ok();
}
```

```typescript
// TypeScript — écouter uniquement les événements attendus, valider le payload.
import { listen } from '@tauri-apps/api/event';

interface ResultatScraping {
  articles: Array<{ titre: string; url: string }>;
  count: number;
}

async function ecouterResultats() {
  const unlisten = await listen<ResultatScraping>('resultat-scraping', (event) => {
    const payload = event.payload;

    // Valider la structure du payload — ne jamais faire confiance aveuglément.
    if (typeof payload !== 'object' || !Array.isArray(payload.articles)) {
      console.error('Payload invalide reçu depuis le backend');
      return;
    }

    if (payload.articles.length > 10000) {
      console.error('Trop d\'articles dans le payload — potentiel DoS');
      return;
    }

    // Traiter les données validées.
    traiterArticles(payload.articles);
  });

  // Retourner la fonction de désinscription pour cleanup.
  return unlisten;
}
```

---

## 8. Tauri deep link validation

### Le problème

Les deep links (`monapp://action?param=value`) peuvent être forgés par des applications tierces ou via des liens malveillants. Sans validation, les paramètres peuvent être utilisés pour des traversées de chemin, des SSRF, ou des injections.

### La défense

```rust
// src-tauri/src/deep_link.rs
use tauri::Manager;
use url::Url;
use once_cell::sync::Lazy;
use regex::Regex;

static RE_CHEMIN_VALIDE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^/[a-zA-Z0-9/_-]{1,200}$").unwrap()
});

/// Actions autorisées via deep link — enum fermée, pas de string dynamique.
#[derive(Debug)]
pub enum DeepLinkAction {
    OuvrirArticle { id: u64 },
    LancerScan { preset: String },
    AfficherParametres,
}

/// Point d'entrée unique pour tous les deep links.
pub fn traiter_deep_link(raw_url: &str) -> Result<DeepLinkAction, String> {
    // 1. Limite de longueur
    if raw_url.len() > 2048 {
        return Err("URL de deep link trop longue".into());
    }

    // 2. Parsing
    let url = Url::parse(raw_url)
        .map_err(|_| "URL de deep link malformée".to_string())?;

    // 3. Vérification du schéma
    if url.scheme() != "monapp" {
        return Err(format!("Schéma non autorisé : {}", url.scheme()));
    }

    // 4. Validation du chemin — pas de traversée
    let chemin = url.path();
    if chemin.contains("..") || chemin.contains("//") {
        return Err("Traversée de chemin dans le deep link".into());
    }
    if !RE_CHEMIN_VALIDE.is_match(chemin) {
        return Err("Chemin de deep link invalide".into());
    }

    // 5. Dispatch vers l'action correspondante
    match chemin {
        "/article" => {
            let id_str = url.query_pairs()
                .find(|(k, _)| k == "id")
                .map(|(_, v)| v.into_owned())
                .ok_or("Paramètre 'id' manquant")?;
            let id: u64 = id_str.parse()
                .map_err(|_| "ID d'article invalide")?;
            Ok(DeepLinkAction::OuvrirArticle { id })
        }
        "/scan" => {
            let preset = url.query_pairs()
                .find(|(k, _)| k == "preset")
                .map(|(_, v)| v.into_owned())
                .ok_or("Paramètre 'preset' manquant")?;
            // Valider le preset — alphanumériques uniquement.
            if preset.len() > 64 || !preset.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-') {
                return Err("Nom de preset invalide".into());
            }
            Ok(DeepLinkAction::LancerScan { preset })
        }
        "/settings" => Ok(DeepLinkAction::AfficherParametres),
        autre => Err(format!("Action deep link inconnue : {}", autre)),
    }
}

#[cfg(test)]
mod tests_deep_link {
    use super::*;

    #[test]
    fn test_article_valide() {
        let action = traiter_deep_link("monapp://app/article?id=42").unwrap();
        assert!(matches!(action, DeepLinkAction::OuvrirArticle { id: 42 }));
    }

    #[test]
    fn test_traversal_rejete() {
        assert!(traiter_deep_link("monapp://app/../../../etc/passwd").is_err());
    }

    #[test]
    fn test_schema_incorrect_rejete() {
        assert!(traiter_deep_link("javascript:alert(1)").is_err());
        assert!(traiter_deep_link("file:///etc/passwd").is_err());
    }

    #[test]
    fn test_url_trop_longue_rejetee() {
        let url_longue = format!("monapp://app/article?id={}", "a".repeat(3000));
        assert!(traiter_deep_link(&url_longue).is_err());
    }
}
```

---

## 9. CI/CD : audit automatique des capabilities et dépendances

```yaml
# .github/workflows/security.yml
name: Audit de sécurité Tauri

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'  # Chaque lundi à 6h UTC

jobs:
  audit-rust:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy
      - uses: EmbarkStudios/cargo-deny-action@v2
        with:
          command: check
          manifest-path: ./src-tauri/Cargo.toml
      - name: Audit des vulnérabilités Rust
        run: |
          cargo install cargo-audit --locked
          cd src-tauri && cargo audit
      - name: Clippy sécurité
        run: |
          cd src-tauri && cargo clippy --all-targets -- \
            -D warnings \
            -W clippy::unwrap_used \
            -W clippy::expect_used \
            -W clippy::dbg_macro \
            -W clippy::todo

  audit-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit --audit-level=high
      - name: ESLint sécurité
        run: npx eslint src/ --rule '{"no-eval": "error", "react/no-danger": "error"}'

  audit-capabilities:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Détection des permissions dangereuses
        run: |
          # Chercher les patterns à risque élevé dans les capabilities.
          PATTERNS='shell:allow-execute|shell:allow-spawn|"args":\s*true'
          PATTERNS="$PATTERNS|\"path\":\s*\"\*\*\"|\"url\":\s*\"http://"
          if grep -rPE "$PATTERNS" src-tauri/capabilities/; then
            echo "::error::Permissions dangereuses détectées dans les capabilities"
            exit 1
          fi
          echo "Aucune permission dangereuse détectée."
      - name: Diff capabilities (PRs uniquement)
        if: github.event_name == 'pull_request'
        run: |
          echo "=== Modifications des capabilities dans cette PR ==="
          git diff origin/main -- src-tauri/capabilities/ || true

  sast:
    runs-on: ubuntu-latest
    container:
      image: semgrep/semgrep
    steps:
      - uses: actions/checkout@v4
      - name: Scan SAST
        run: semgrep scan --config auto --config p/rust --config p/typescript --error
```

---

## Checklist d'implémentation Tauri + React

**Capabilities :**
- [ ] `tauri-plugin-shell` est en version >= 2.2.1 (correction CVE-2025-31477)
- [ ] Aucun `"args": true` dans les scopes shell
- [ ] Aucun `"path": "**"` dans les scopes filesystem
- [ ] Des deny scopes explicites couvrent `.ssh`, `.aws`, `.gnupg`, `EBWebView`
- [ ] HTTP : scope HTTPS uniquement, deny des plages IP privées
- [ ] `"windows": ["*"]` n'est jamais utilisé avec des permissions sensibles
- [ ] Aucun fichier de test ne subsiste dans `src-tauri/capabilities/`

**CSP :**
- [ ] CSP configurée dans `tauri.conf.json` (jamais `null` ou absente)
- [ ] `dangerousDisableAssetCspModification: false`
- [ ] `freezePrototype: true`
- [ ] `script-src 'self'` sans `'unsafe-eval'` en production
- [ ] `frame-src 'none'` et `object-src 'none'`
- [ ] `envPrefix: ['VITE_']` dans `vite.config.ts`

**WebView :**
- [ ] `fileDropEnabled: false` sur toutes les fenêtres
- [ ] Feature `devtools` absente du `Cargo.toml` de production
- [ ] `withGlobalTauri: false` en production

**React :**
- [ ] DOMPurify >= 3.2.4 (correction CVE-2025-26791)
- [ ] `dangerouslySetInnerHTML` uniquement dans des composants dédiés après sanitization
- [ ] Aucun `href="javascript:..."` non filtré
- [ ] Les résumés LLM utilisent `react-markdown` + `rehype-sanitize`
- [ ] `USE_PROFILES: { html: true }` bloque SVG et MathML dans DOMPurify

**Commandes Tauri :**
- [ ] Chaque commande sensible vérifie `webview_window.label() == "main"`
- [ ] Les erreurs internes sont mappées vers `FrontendError` générique
- [ ] Aucune `rusqlite::Error` ni `keyring::Error` n'est propagée au frontend
