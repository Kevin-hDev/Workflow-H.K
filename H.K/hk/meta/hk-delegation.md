---
name: hk-delegation
description: Règles de délégation sous-agents spécifiques au workflow H.K par niveau de complexité
when_to_load: Avant tout déploiement de sous-agent (step-01-analyze, step-03-execute, step-04-validate)
---

# Délégation H.K — Sous-agents par niveau

Format des résumés : `shared/meta/delegation-format.md`
**Règle absolue** : JAMAIS Opus en sous-agent (sauf demande explicite de l'utilisateur).

---

## Sous-agents par niveau

| Niveau | Step ANALYZE | Step EXECUTE | Step VALIDATE |
|--------|-------------|--------------|---------------|
| `L1` | 0 sous-agent | 0 (agent principal code direct) | 0 (inline) |
| `L2` | 1 Haiku (exploration rapide) | 0 (agent principal) | 0 (inline) |
| `L3` | 2-3 Haiku en parallèle | 0-1 Sonnet (si waves P1/P2) | 1 Sonnet (SelfCheck anti-biais) |
| `L4` | 2-3 Sonnet en parallèle | 1 Sonnet par wave (max 5 fichiers) | 1 Sonnet (validation adversariale) |

---

## Règles de déploiement

**Haiku** — Tâches de lecture/exploration (pas de raisonnement complexe) :
- Lire et résumer des fichiers existants
- Compter les fichiers impactés, détecter les domaines
- Extraire des signatures de fonctions, lister des dépendances

**Sonnet** — Tâches de code, sécurité, validation :
- Écrire du code dans plusieurs fichiers
- Review sécurité (risk_level MEDIUM ou HIGH)
- SelfCheck post-validate (anti-biais de confirmation)
- Validation adversariale (L4)

**Anti-patterns interdits** :
- Déployer un sous-agent pour lire 1 seul fichier (utiliser Read direct)
- Charger 10 fichiers "au cas où" dans un sous-agent
- Sous-agent sans périmètre précis ("explore tout le projet")

---

## Périmètre par sous-agent (L3-L4 ANALYZE)

Chaque sous-agent reçoit un domaine précis. Exemple pour un projet Rust+React :

```
Sous-agent 1 (Haiku) : src/auth/ + src/session/
  → Résumer les types, fonctions publiques, mécanismes de sécurité

Sous-agent 2 (Haiku) : src/api/ + src/middleware/
  → Résumer les routes, handlers, validations d'entrée

Sous-agent 3 (Haiku) : frontend/src/components/ + frontend/src/hooks/
  → Résumer les composants, hooks, gestion d'état
```

---

## Résumé attendu par sous-agent

Voir template complet dans `shared/meta/delegation-format.md`.
Format minimal par fichier : 5 lignes (struct, fonctions, dépendances, sécurité, tests).
Format dossier : 6 lignes (responsabilité, entrées, sorties, dépendances, points d'attention, fichiers clés).
Max 80 lignes par résumé de sous-agent.
