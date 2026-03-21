---
name: hk-checkpoint-guide
description: Guide de lecture/écriture de hk-state.json pour le workflow H.K
when_to_load: Chargé en step-00-init, consulté à chaque checkpoint
---

# Guide du checkpoint H.K

Structure complète : `shared/schemas/checkpoint.schema.json`
Le champ `workflow` doit toujours valoir `"H.K"`.

---

## Écriture atomique (OBLIGATOIRE)

```
1. Construire le JSON complet en mémoire
2. Écrire dans   .hk/.hk-state.tmp
3. Renommer en   .hk/hk-state.json  (opération atomique)
4. Incrémenter   checkpoint_version  à chaque écriture
```

Jamais écrire directement dans `.hk/hk-state.json` — risque de corruption si interruption.

---

## Quand sauvegarder

| Moment | Action |
|--------|--------|
| Fin de step-00-init | Créer hk-state.json initial |
| Entrée dans chaque step | Mettre à jour `current_step` + `current_mode` |
| Après chaque fichier modifié (EXECUTE) | Déplacer le fichier de `files_remaining` vers `files_completed` |
| Après chaque sous-agent (ANALYZE) | Ajouter les findings à `traceability` |
| Après chaque transition de mode | Mettre à jour `current_mode` + `last_checkpoint` |
| Fin de session | Mettre à jour `current_step = ""` + `current_mode = "IDLE"` |

---

## Re-hydratation après compaction

Quand le contexte est compacté, l'état est perdu sauf `hk-state.json`.
Au redémarrage avec `-r {task_id}` :

```
1. Lire hk-state.json
2. Vérifier les champs requis (voir schéma)
3. Vérifier workflow = "H.K"
4. Restaurer : current_step, current_mode, complexity_level, variables, plan
5. Reprendre au current_step / current_substep
6. Recharger les règles (voir hk-rules-loader.md)
```

**Champs critiques à re-hydrater** :
- `variables` : auto_mode, economy_mode, harden_mode, branch_mode, build_systems
- `plan` : files_completed, files_remaining, missions (statuts)
- `security` : risk_level (ne jamais downgrader après détection)
- `confidence` : scores pré/post — si null, recalculer avant de continuer

---

## Vérification d'intégrité

Avant de reprendre une session :

```
checkpoint_version >= 1               → pas corrompu
workflow = "H.K"                      → bon workflow
current_mode ∈ enum modes             → mode valide
complexity_level ∈ [L1,L2,L3,L4]    → niveau valide
security.risk_level ∈ [LOW,MEDIUM,HIGH] → risque valide
```

Si un champ échoue → STOP, ne pas reprendre, demander confirmation à l'utilisateur.

---

## Chemin du fichier

```
{racine_projet}/.hk/hk-state.json
{racine_projet}/.hk/.hk-state.tmp   ← fichier temporaire (nettoyé après rename)
```
