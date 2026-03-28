---
name: hk-cli-creator
description: Use when creating a CLI skill, wrapping a CLI tool, building a skill around terminal commands, or when the user wants to teach Claude how to use a specific tool. Triggers on: /hk-cli-creator, create cli skill, skill cli, wrap cli, terminal skill.
---

# CLI Skill Creator

Create skills that teach Claude to use CLI tools and terminal commands.
A CLI skill = a SKILL.md that gives Claude expertise on a specific tool.

## Step 0 — Understand the Target

Before writing anything, identify what you're building a skill for:

| Question | Why it matters |
|----------|---------------|
| Quel outil ? | Binaire existant (`ffmpeg`, `gh`, `docker`) ou outil custom à créer |
| Installé ? | Vérifier avec `which <tool>` ou `<tool> --version` |
| Quelle doc existe ? | `<tool> --help`, man pages, docs en ligne |
| Quel scope ? | Tout l'outil ou un sous-ensemble de commandes |

```bash
# Découvrir les commandes disponibles
<tool> --help
<tool> <subcommand> --help
man <tool>
```

Si l'outil n'existe pas encore, tu vas le créer dans `scripts/`.

---

## Step 1 — Choisir le niveau

Il existe 5 niveaux de sophistication. Choisir le bon pour le cas d'usage :

### Niveau 1 — Wrapper de commandes

Documente les commandes d'un outil existant. Claude les appelle.

```yaml
allowed-tools: Bash(ffmpeg:*)
```

**Quand l'utiliser** : l'outil est déjà installé, ses commandes couvrent le besoin,
pas besoin de logique supplémentaire.

**Exemples** : ffmpeg, gh, docker, kubectl, aws cli.

### Niveau 2 — Scripts comme outils

Des scripts Python/Bash dans `scripts/` font le travail déterministe lourd.
Claude les appelle, seule la sortie rentre en contexte — le code du script, jamais.

```yaml
allowed-tools: Bash(python ${CLAUDE_SKILL_DIR}/scripts/*)
```

**Quand l'utiliser** : besoin de traitement de données, calculs, parsing,
validation complexe, ou l'outil n'existe pas encore.

**Exemples** : analyseur financier, générateur de diagrammes, auditeur de code.

### Niveau 3 — Exécuteur de code (runtime executor)

Un script runner (`run.js`, `run.py`) qui exécute du code **que Claude écrit**.
Claude a accès à toute l'API d'une librairie, pas juste des commandes pré-construites.

```yaml
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/run.js:*)
```

**Quand l'utiliser** : la librairie sous-jacente est trop riche pour être résumée
en commandes. Claude doit pouvoir écrire du code custom à chaque utilisation.

**Exemples** : Playwright (browser automation), Puppeteer, bibliothèques de data viz.

### Niveau 4 — Injection dynamique

Le skill peut exécuter des commandes shell au chargement et injecter
la sortie directement dans le contenu. Claude reçoit les données réelles,
pas un template statique.

**Quand l'utiliser** : le skill a besoin de contexte live (état git, PR en cours,
état du système) pour être utile.

Pour la syntaxe, les exemples et les règles de sécurité, voir :
[references/dynamic-injection.md](references/dynamic-injection.md)

### Niveau 5 — Orchestrateur multi-scripts

Plusieurs scripts coordonnés, résultats écrits sur disque,
Claude orchestre et interprète.

**Quand l'utiliser** : pipeline complexe avec plusieurs étapes,
données intermédiaires, parallélisme.

Les niveaux se combinent. Un skill peut être Niveau 2 + Niveau 4
(scripts custom + injection dynamique).

---

## Step 2 — Découvrir les commandes

### Pour un outil existant

```bash
# Extraire la structure des commandes
<tool> --help 2>&1
<tool> <subcommand> --help 2>&1

# Si disponible
man <tool> | head -200
```

Faire une recherche web pour la documentation à jour de l'outil.
Les man pages locales peuvent être obsolètes. La doc en ligne a souvent
des exemples et des options non documentées dans `--help`.

Grouper les commandes par catégorie fonctionnelle (pas alphabétique).
Les catégories naturelles émergent de l'usage : core, navigation, configuration,
debug, administration...

### Pour un outil custom

Définir les commandes que l'outil devrait avoir en partant du besoin utilisateur.
Chaque commande = une action atomique. Écrire les scripts correspondants.

---

## Step 3 — Structurer le SKILL.md

### Frontmatter

```yaml
---
name: mon-cli-skill
description: [Conditions de déclenchement UNIQUEMENT — pas d'instructions]
allowed-tools: [Whitelist la plus restrictive possible]
argument-hint: "[argument1] [argument2]"
---
```

La description ne doit contenir que des conditions de déclenchement.
Si la description explique COMMENT faire, Claude saute le body et improvise.

### Choix de `allowed-tools`

| Besoin | Syntaxe |
|--------|---------|
| Un seul binaire | `Bash(tool:*)` |
| Un binaire + ses sous-commandes | `Bash(tool *)` |
| Scripts Python du skill | `Bash(python ${CLAUDE_SKILL_DIR}/scripts/*)` |
| Scripts spécifiques | `Bash(python ${CLAUDE_SKILL_DIR}/scripts/analyze.py:*)` |
| Runner JS | `Bash(node ${CLAUDE_SKILL_DIR}/run.js:*)` |
| Lecture seule | `Read, Grep, Glob` |
| Git uniquement | `Bash(git:*)` |

### Corps du SKILL.md

Structure recommandée :

```markdown
# Titre — ce que le skill permet

## Quick Start
[3-5 commandes essentielles pour commencer immédiatement]

## Commandes par catégorie
### Catégorie 1
[Commandes avec exemples concrets]

### Catégorie 2
[Commandes avec exemples concrets]

## Workflows courants
### Workflow A
[Séquence de commandes pour un cas d'usage complet]

## Tâches avancées
* [Lien vers reference/avance.md](references/avance.md) — quand X
* [Lien vers reference/troubleshoot.md](references/troubleshoot.md) — quand Y
```

**Règles :**
- Max 500 lignes. Au-delà, déplacer dans `references/`.
- Exemples concrets, pas de descriptions abstraites.
- Grouper par catégorie fonctionnelle, pas alphabétique.
- Liens directs depuis SKILL.md vers `references/`. Un seul niveau (pas de ref → ref).

---

## Step 4 — Écrire les scripts (Niveau 2+)

### Structure d'un script CLI

Tous les scripts suivent le pattern **JSON in → validate → process → JSON/text out** :

```python
#!/usr/bin/env python3
"""Description de ce que le script fait."""
import json, argparse, sys

def validate(data):
    """Valider AVANT tout traitement. Fail closed."""
    if "required_field" not in data:
        print("Erreur: champ 'required_field' manquant", file=sys.stderr)
        sys.exit(1)

def process(data):
    """Logique métier. Retourne un dict."""
    return {"result": "..."}

def main():
    parser = argparse.ArgumentParser(description="...")
    parser.add_argument("input_file", help="Fichier JSON en entrée")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args()

    try:
        with open(args.input_file) as f:
            data = json.load(f)
        validate(data)
        result = process(data)
        if args.format == "json":
            print(json.dumps(result, indent=2, default=str))
        else:
            # Format lisible humainement
            for k, v in result.items():
                print(f"{k}: {v}")
    except FileNotFoundError:
        print(f"Erreur: fichier '{args.input_file}' introuvable", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Erreur: JSON invalide: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Règles des scripts

| Règle | Pourquoi |
|-------|----------|
| **Stdlib uniquement** (zéro pip) | Marche partout sans installation |
| **Erreurs vers stderr, résultats vers stdout** | Claude parse stdout, stderr = diagnostic |
| **Validation en premier** | Fail closed — une entrée invalide bloque, pas de résultat partiel |
| **`--format json` supporté** | Claude peut parser le JSON structuré |
| **Exit code non-zéro sur erreur** | Claude détecte l'échec |
| **Pas de secrets en dur** | Variables d'environnement uniquement |

### Documentation des scripts dans SKILL.md

```markdown
## Outils disponibles

### analyze — Analyser les données
```bash
python ${CLAUDE_SKILL_DIR}/scripts/analyze.py data.json --format json
```

**Input JSON :**
```json
{"field1": "value", "field2": 42}
```

**Output :** Résumé avec métriques et recommandations.
```

---

## Step 5 — Runtime executor (Niveau 3)

Pour les cas où Claude doit avoir accès à toute l'API d'une librairie :

### Structure

```
mon-skill/
├── SKILL.md
├── run.js (ou run.py)       ← Exécute le code que Claude génère
├── lib/
│   └── helpers.js            ← Fonctions réutilisables
├── references/
│   └── api-reference.md      ← Doc API complète (progressive disclosure)
└── package.json              ← Dépendances
```

### Le runner

Le runner accepte du code de Claude et l'exécute dans un environnement préparé :
- Auto-installe les dépendances si manquantes
- Gère les fichiers temporaires (création + nettoyage)
- Change le working directory pour la résolution des modules
- Enveloppe le code brut si nécessaire (détection automatique)

### Les helpers

Fonctions réutilisables que Claude peut appeler dans le code généré :
- Setup (lancer le browser, connecter à la DB...)
- Actions courantes (click avec retry, parse HTML, wait intelligent...)
- Cleanup (fermer les connexions, supprimer les temporaires...)

Les helpers évitent que Claude réinvente la roue à chaque exécution.

### Progressive disclosure de l'API

Le SKILL.md reste léger (<500 lignes) avec les commandes essentielles.
La doc API complète va dans `references/api-reference.md`.
Le SKILL.md pointe : "Pour l'API complète, voir [api-reference.md](references/api-reference.md)".

Claude ne lit `api-reference.md` que s'il en a besoin — 0 token sinon.

---

## Step 6 — Injection dynamique (Niveau 4)

Voir [references/dynamic-injection.md](references/dynamic-injection.md) pour :
- La syntaxe exacte (bang-backtick)
- Des exemples concrets (git status, PR diff, état système)
- Les règles de sécurité (quoi éviter dans les injections)

Le principe : une commande shell s'exécute AVANT que Claude voie le skill.
La sortie remplace la commande dans le contenu. Claude reçoit les vraies données.

---

## Step 7 — Finaliser la structure

```
mon-skill/
├── SKILL.md                  ← < 500 lignes, vue d'ensemble + commandes
├── scripts/                  ← Scripts déterministes (0 token si non exécutés)
│   ├── analyze.py
│   └── generate.py
├── references/               ← Docs détaillées (0 token si non lus)
│   ├── api-reference.md
│   └── troubleshooting.md
└── examples/                 ← Outputs attendus (optionnel)
    └── sample-output.json
```

---

## Qualité — Ce qui fait un bon skill CLI

### La description décide de tout

La description détermine si Claude invoque le skill. C'est le champ le plus critique.
Données mesurées sur 200+ prompts :

| Type de description | Taux d'activation |
|--------------------|-------------------|
| Vague ("Aide avec les fichiers") | ~20% |
| Optimisée (what + when) | ~50% |
| Avec exemples de triggers | 72-90% |
| Résumé explicatif (pas de conditions) | ~0% — Claude saute le body |

```yaml
# ❌ Mauvais — trop explicatif, Claude saute le body
description: Convertit des vidéos avec ffmpeg en utilisant les commandes
  de compression H264 et d'extraction audio

# ✅ Bon — conditions de déclenchement uniquement
description: Use when converting, compressing, or extracting audio from
  video files. Triggers on: video conversion, ffmpeg, compress video,
  extract audio, transcode.
```

### Le Quick Start est obligatoire

Les 3-5 premières commandes que Claude voit doivent couvrir 80% des cas.
Si Claude doit lire 200 lignes avant de savoir quoi faire, le skill échoue.

```markdown
## Quick Start
```bash
playwright-cli open https://example.com
playwright-cli click e3
playwright-cli fill e5 "user@example.com"
playwright-cli screenshot
playwright-cli close
```
```

### Gestion de la taille

Le SKILL.md doit rester sous 500 lignes. Quand ça dépasse :

| Contenu | Garde dans SKILL.md | Déplace dans references/ |
|---------|--------------------|-----------------------|
| Quick Start | ✅ Toujours | |
| Commandes essentielles (top 20) | ✅ | |
| Commandes avancées (le reste) | | ✅ api-reference.md |
| Workflows courants (top 3) | ✅ | |
| Workflows spécialisés | | ✅ workflows.md |
| Troubleshooting | | ✅ troubleshooting.md |
| Paramètres complets d'un outil | | ✅ options.md |

Règle : si une section sert à moins de 30% des utilisations, elle va dans `references/`.

### Anti-patterns des skills CLI

| Anti-pattern | Problème | Solution |
|-------------|----------|----------|
| **Encyclopédie** — lister TOUTES les options de TOUTES les commandes | Le SKILL.md dépasse 500 lignes, Claude se perd | Quick Start + top 20 commandes, reste dans references/ |
| **Pas d'exemples** — juste la syntaxe des commandes | Claude ne sait pas comment combiner les commandes | Ajouter 2-3 workflows complets (séquences de commandes) |
| **Description explicative** | Claude lit la description, pense comprendre, saute le body | Description = triggers uniquement ("Use when...") |
| **Trop de choix** — "utilise X OU Y OU Z" | Claude hésite et choisit mal | Un outil par défaut + exception documentée |
| **Commandes sans contexte** — juste `tool cmd --flag` | Claude ne sait pas QUAND utiliser quelle commande | Grouper par cas d'usage, pas par alphabet |
| **Scripts avec pip install** | Échoue sur les machines sans les dépendances | Stdlib uniquement — zéro dépendance externe |

---

### Checklist avant de livrer

- [ ] Description = conditions de déclenchement uniquement, pas d'instructions
- [ ] Quick Start avec 3-5 commandes couvrant 80% des cas
- [ ] `allowed-tools` = whitelist la plus restrictive possible
- [ ] SKILL.md < 500 lignes (contenu avancé dans references/)
- [ ] Commandes groupées par cas d'usage avec exemples concrets
- [ ] 2-3 workflows complets (séquences de commandes)
- [ ] Scripts avec validation en premier (fail closed)
- [ ] Scripts stdlib-only (zéro pip install)
- [ ] Zéro secret en dur (env vars uniquement)
- [ ] Liens vers `references/` pour le contenu avancé (1 seul niveau)
- [ ] Injection dynamique sans `$ARGUMENTS` ni URLs non contrôlées

---

## Référence rapide — Quel niveau pour quel cas

| Situation | Niveau | Exemple |
|-----------|--------|---------|
| Outil CLI déjà installé, commandes simples | 1 — Wrapper | ffmpeg, gh, docker |
| Besoin de traitement/calcul custom | 2 — Scripts | Analyseur de données, générateur |
| Librairie riche, besoin de flexibilité totale | 3 — Executor | Playwright, data viz |
| Besoin de contexte live au chargement | 4 — Injection | PR review, état système |
| Pipeline multi-étapes avec intermédiaires | 5 — Orchestrateur | Scanners parallèles |
| Combinaison de besoins | 2+4, 3+4, etc. | Script custom + contexte git |

Pour les templates détaillés de scripts et runners, voir :
- [references/script-templates.md](references/script-templates.md) — Templates Python/Bash complets
- [references/executor-template.md](references/executor-template.md) — Template de runtime executor
