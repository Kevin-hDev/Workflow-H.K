# Template de Runtime Executor

Un runtime executor permet à Claude d'écrire du code custom et de l'exécuter.
Claude a accès à toute l'API de la librairie, pas juste des commandes pré-construites.

## Architecture

```
mon-skill/
├── SKILL.md                ← Commandes essentielles + workflow
├── run.js (ou run.py)      ← Exécuteur universel
├── lib/
│   └── helpers.js          ← Fonctions réutilisables
├── references/
│   └── api-reference.md    ← Doc API complète (chargée si besoin)
└── package.json            ← Dépendances
```

---

## Template run.js (Node.js)

```javascript
#!/usr/bin/env node
/**
 * Runtime executor — exécute du code généré par Claude.
 * Usage:
 *   node run.js script.js          # depuis un fichier
 *   node run.js -e "code ici"      # depuis la ligne de commande
 *   echo "code" | node run.js -    # depuis stdin
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Changer vers le répertoire du skill pour la résolution des modules
process.chdir(__dirname);

// Auto-installer les dépendances si manquantes
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.error('[setup] Installing dependencies...');
    execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
}

// Nettoyer les fichiers temporaires des exécutions précédentes
const tempFiles = fs.readdirSync(__dirname)
    .filter(f => f.startsWith('.temp-execution-'));
for (const f of tempFiles) {
    fs.unlinkSync(path.join(__dirname, f));
}

// Lire le code source
let code;
const args = process.argv.slice(2);

if (args[0] === '-e' && args[1]) {
    code = args[1];
} else if (args[0] === '-') {
    code = fs.readFileSync('/dev/stdin', 'utf8');
} else if (args[0]) {
    code = fs.readFileSync(args[0], 'utf8');
} else {
    console.error('Usage: node run.js <file.js | -e "code" | ->');
    process.exit(1);
}

// Détecter si le code est un script complet ou du code brut
const isCompleteScript = code.includes('require(') ||
    code.includes('import ') ||
    code.includes('module.exports');

if (!isCompleteScript) {
    // Envelopper le code brut dans un contexte préparé
    code = `
const { helpers } = require('./lib/helpers');
(async () => {
    try {
        ${code}
    } catch (err) {
        console.error('Execution error:', err.message);
        process.exit(1);
    }
})();
`;
}

// Écrire dans un fichier temporaire et exécuter
const tempFile = path.join(__dirname,
    `.temp-execution-${Date.now()}.js`);
fs.writeFileSync(tempFile, code);

try {
    require(tempFile);
} catch (err) {
    console.error('Execution failed:', err.message);
    process.exit(1);
}
```

---

## Template run.py (Python)

```python
#!/usr/bin/env python3
"""
Runtime executor Python — exécute du code généré par Claude.
Usage:
    python run.py script.py
    python run.py -e "code ici"
    echo "code" | python run.py -
"""
import sys
import os
import tempfile
import importlib.util
import argparse
import glob

# Changer vers le répertoire du skill
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Ajouter lib/ au path pour les helpers
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'lib'))


def cleanup_temp():
    """Nettoyer les fichiers temporaires des exécutions précédentes."""
    for f in glob.glob('.temp-execution-*.py'):
        os.unlink(f)


def execute_code(code):
    """Exécuter du code Python dans un environnement préparé."""
    # Créer fichier temporaire
    fd, temp_path = tempfile.mkstemp(
        prefix='.temp-execution-', suffix='.py', dir='.'
    )
    try:
        with os.fdopen(fd, 'w') as f:
            f.write(code)

        spec = importlib.util.spec_from_file_location("__main__", temp_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)


def main():
    cleanup_temp()

    parser = argparse.ArgumentParser(description="Runtime executor")
    parser.add_argument("source", nargs="?", help="Fichier ou '-' pour stdin")
    parser.add_argument("-e", "--eval", help="Code à exécuter")
    args = parser.parse_args()

    if args.eval:
        code = args.eval
    elif args.source == "-":
        code = sys.stdin.read()
    elif args.source:
        with open(args.source) as f:
            code = f.read()
    else:
        print("Usage: python run.py <file.py | -e 'code' | ->", file=sys.stderr)
        sys.exit(1)

    try:
        execute_code(code)
    except Exception as e:
        print(f"Execution failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

---

## Template lib/helpers.js

```javascript
/**
 * Helpers réutilisables pour le runtime executor.
 * Claude peut importer ces fonctions dans le code qu'il génère.
 */

async function retry(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === maxRetries - 1) throw err;
            await new Promise(r => setTimeout(r, delay * (i + 1)));
        }
    }
}

async function withTimeout(fn, ms = 30000) {
    return Promise.race([
        fn(),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
        )
    ]);
}

function writeResult(data, outputPath) {
    const fs = require('fs');
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(outputPath, content);
    console.log(`Output written to ${outputPath}`);
}

module.exports = { retry, withTimeout, writeResult };
```

---

## Template lib/helpers.py

```python
"""
Helpers réutilisables pour le runtime executor Python.
"""
import json
import time
import sys


def retry(fn, max_retries=3, delay=1.0):
    """Retry avec backoff linéaire."""
    for i in range(max_retries):
        try:
            return fn()
        except Exception as e:
            if i == max_retries - 1:
                raise
            time.sleep(delay * (i + 1))


def write_result(data, output_path):
    """Écrire le résultat sur disque + confirmer sur stdout."""
    content = data if isinstance(data, str) else json.dumps(data, indent=2, default=str)
    with open(output_path, 'w') as f:
        f.write(content)
    print(f"Output written to {output_path}")


def log(msg):
    """Log vers stderr (ne pollue pas la sortie)."""
    print(f"[INFO] {msg}", file=sys.stderr)
```

---

## Quand utiliser un executor vs des commandes

| Critère | Commandes pré-construites | Runtime executor |
|---------|--------------------------|------------------|
| API de la librairie | Simple, <20 commandes | Riche, 100+ méthodes |
| Besoins | Prévisibles, répétitifs | Variables à chaque utilisation |
| Complexité du code | 1-2 lignes par action | Scripts multi-lignes |
| Sécurité | Plus contrôlé | Claude écrit du code arbitraire |
| Setup | Zéro (commandes documentées) | Package.json + install |
