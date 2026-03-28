# Injection Dynamique — Syntaxe et sécurité

## Syntaxe

Dans un SKILL.md, la syntaxe bang-backtick exécute une commande shell
AVANT que Claude voie le contenu. La sortie remplace la commande.

Syntaxe : point d'exclamation + backtick + commande + backtick

```
!`commande shell ici`
```

## Exemples dans un SKILL.md

```yaml
---
name: pr-review
description: Use when reviewing a pull request.
context: fork
allowed-tools: Bash(gh *)
---

## Contexte de la PR

Fichiers modifiés :
!`gh pr diff --name-only`

Diff complet :
!`gh pr diff`

Commentaires :
!`gh pr view --comments`

## Tâche
Analyser cette PR...
```

Quand le skill se charge, les trois commandes `gh` s'exécutent.
Claude reçoit le SKILL.md avec les vrais résultats à la place des commandes.

## Autres exemples

```
# État git
!`git status --short`

# Branche courante
!`git branch --show-current`

# Date du jour
!`date +%Y-%m-%d`

# Avec piping et filtrage
!`git diff --name-only | grep "\.js$"`

# Avec fallback en cas d'erreur
!`docker ps 2>/dev/null || echo "Docker not running"`

# Limiter la taille de la sortie
!`git log --oneline | tail -20`
```

## Règles de sécurité

### Sûr

| Pattern | Pourquoi |
|---------|----------|
| `!`git status`` | Commande fixe, source locale |
| `!`gh pr diff`` | Commande fixe, source contrôlée (GitHub) |
| `!`date +%Y-%m-%d`` | Info système, pas de données sensibles |

### Dangereux — NE JAMAIS FAIRE

| Pattern | Pourquoi |
|---------|----------|
| `!`curl $ARGUMENTS`` | Entrée utilisateur injectée dans le shell |
| `!`curl https://site-inconnu.com`` | URL externe non contrôlée |
| `!`eval $0`` | Exécution de code arbitraire |

### Règle absolue

Jamais de `$ARGUMENTS` dans une injection dynamique.
Les arguments utilisateur doivent être traités par Claude APRÈS le chargement,
pas injectés dans le préprocesseur shell.

## Combinaison avec d'autres niveaux

L'injection dynamique se combine bien avec les niveaux 1 et 2 :

```yaml
---
name: deploy-status
description: Use when checking deployment status.
allowed-tools: Bash(kubectl:*)
---

## État actuel du cluster
!`kubectl get pods --no-headers | head -20`

## Commandes disponibles
kubectl get pods
kubectl describe pod <name>
kubectl logs <name>
```

Le skill charge avec l'état réel du cluster, puis Claude peut exécuter
des commandes supplémentaires pour investiguer.
