# Templates de scripts pour skills CLI

## Template Python — Script d'analyse

```python
#!/usr/bin/env python3
"""
Analyser [domaine]. Stdlib uniquement.
Usage: python analyze.py data.json [--format json] [--threshold N]
"""
import json
import argparse
import sys
import os
from datetime import datetime


class Analyzer:
    """Logique métier encapsulée."""

    def __init__(self, data):
        self.data = data
        self.errors = []

    def validate(self):
        """Validation stricte. Fail closed."""
        if not isinstance(self.data, dict):
            self.errors.append("L'entrée doit être un objet JSON")
        # Ajouter validations spécifiques au domaine
        if self.errors:
            return False
        return True

    def analyze(self):
        """Traitement principal. Retourne un dict."""
        result = {
            "timestamp": datetime.now().isoformat(),
            "summary": {},
            "details": [],
            "recommendations": []
        }
        # Logique métier ici
        return result

    def format_text(self, result):
        """Sortie lisible humainement."""
        lines = [f"# Analyse — {result['timestamp']}", ""]
        lines.append("## Résumé")
        for k, v in result["summary"].items():
            lines.append(f"- {k}: {v}")
        if result["recommendations"]:
            lines.append("\n## Recommandations")
            for r in result["recommendations"]:
                lines.append(f"- {r}")
        return "\n".join(lines)


def safe_divide(num, denom, default=0):
    """Division sûre — jamais de ZeroDivisionError."""
    return num / denom if denom != 0 else default


def main():
    parser = argparse.ArgumentParser(description="Analyser [domaine]")
    parser.add_argument("input_file", help="Fichier JSON en entrée")
    parser.add_argument(
        "--format", choices=["text", "json"], default="text",
        help="Format de sortie"
    )
    parser.add_argument(
        "--threshold", type=float, default=0.5,
        help="Seuil de filtrage"
    )
    args = parser.parse_args()

    try:
        with open(args.input_file) as f:
            data = json.load(f)

        analyzer = Analyzer(data)
        if not analyzer.validate():
            for err in analyzer.errors:
                print(f"Erreur validation: {err}", file=sys.stderr)
            sys.exit(1)

        result = analyzer.analyze()

        if args.format == "json":
            print(json.dumps(result, indent=2, default=str, ensure_ascii=False))
        else:
            print(analyzer.format_text(result))

    except FileNotFoundError:
        print(f"Erreur: fichier '{args.input_file}' introuvable", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Erreur: JSON invalide: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Erreur inattendue: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

---

## Template Bash — Wrapper de commande

```bash
#!/usr/bin/env bash
# Usage: ./wrapper.sh <action> [arguments...]
# Actions: scan, report, status
set -euo pipefail

ACTION="${1:-help}"
shift 2>/dev/null || true

case "$ACTION" in
    scan)
        # Validation entrée
        if [ -z "${1:-}" ]; then
            echo "Erreur: chemin requis" >&2
            exit 1
        fi
        TARGET="$1"
        if [ ! -e "$TARGET" ]; then
            echo "Erreur: '$TARGET' n'existe pas" >&2
            exit 1
        fi
        # Logique
        echo "Scan de $TARGET..."
        ;;
    report)
        # Générer rapport
        echo "Rapport généré."
        ;;
    status)
        echo "OK"
        ;;
    help|*)
        echo "Usage: $0 <scan|report|status> [args...]"
        exit 0
        ;;
esac
```

---

## Template Python — Générateur

Script qui produit un fichier de sortie (pas juste du texte) :

```python
#!/usr/bin/env python3
"""
Générer [artefact]. Stdlib uniquement.
Usage: python generate.py config.json --output result.html
"""
import json
import argparse
import sys


def validate_config(config):
    """Vérifier la config avant de générer."""
    required = ["title", "data"]
    missing = [k for k in required if k not in config]
    if missing:
        print(f"Erreur: champs manquants: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)


def generate(config):
    """Générer le contenu."""
    # Logique de génération
    return f"<html><body><h1>{config['title']}</h1></body></html>"


def main():
    parser = argparse.ArgumentParser(description="Générer [artefact]")
    parser.add_argument("config_file", help="Config JSON")
    parser.add_argument("--output", "-o", required=True, help="Fichier de sortie")
    args = parser.parse_args()

    try:
        with open(args.config_file) as f:
            config = json.load(f)

        validate_config(config)
        content = generate(config)

        with open(args.output, "w") as f:
            f.write(content)

        # Confirmer sur stdout (Claude voit ça)
        print(json.dumps({
            "status": "success",
            "output": args.output,
            "size_bytes": len(content)
        }, indent=2))

    except FileNotFoundError:
        print(f"Erreur: '{args.config_file}' introuvable", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Erreur: JSON invalide: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

---

## Patterns communs à tous les scripts

### Sortie JSON safe

```python
# Gère Infinity, NaN, datetime, et objets custom
json.dumps(result, indent=2, default=str, ensure_ascii=False)
```

### Lecture depuis stdin OU fichier

```python
if args.input_file == "-":
    data = json.load(sys.stdin)
else:
    with open(args.input_file) as f:
        data = json.load(f)
```

### Logging vers stderr (pas stdout)

```python
import sys

def log(msg):
    """Log de diagnostic — ne pollue pas la sortie."""
    print(f"[INFO] {msg}", file=sys.stderr)
```
