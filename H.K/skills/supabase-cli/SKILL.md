---
name: supabase-cli
description: >
  Manage Supabase projects via CLI (replaces Supabase MCP).
  Use when working with Supabase databases, migrations, Edge Functions,
  storage, auth, or project configuration. Triggers on: supabase,
  database migration, edge function, supabase storage, supabase auth,
  RLS policy, postgres schema, supabase project, db push, db pull,
  generate types, supabase inspect, supabase deploy.
  NOT for: general SQL questions, PostgreSQL theory, ORM setup.
allowed-tools: Bash(supabase:*), Bash(psql:*), Bash(/opt/homebrew/opt/libpq/bin/psql:*), Bash(curl *api.supabase.com:*)
argument-hint: "<command> [args]"
---

# Supabase CLI — Gestion complete de projets Supabase

## Quick Start

```bash
# Statut du projet local
supabase status

# Executer du SQL sur la base locale
psql "$(supabase status -o json | jq -r '.DB_URL')" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"

# Lister les tables et stats
supabase inspect db table-stats --linked

# Creer une migration
supabase migration new add_users_table

# Pousser les migrations vers le projet distant
supabase db push

# Generer les types TypeScript
supabase gen types typescript --linked > src/types/database.ts
```

## Output format

Toutes les commandes supportent `--output json` (ou `-o json`) pour
une sortie structuree. Preferer JSON quand on a besoin de parser.

```bash
supabase status -o json
supabase projects list -o json
supabase inspect db table-stats --linked -o json
```

---

## Database — Migrations & Schema

### Creer une migration

```bash
supabase migration new <nom_descriptif>
# Cree supabase/migrations/<timestamp>_<nom>.sql (vide)
# Ecrire le SQL dans ce fichier, puis push
```

### Pousser les migrations (local -> distant)

```bash
supabase db push
supabase db push --dry-run          # Preview sans appliquer
supabase db push --include-seed     # Inclut seed.sql
```

### Tirer le schema (distant -> local)

```bash
supabase db pull                    # Genere une migration depuis le distant
supabase db pull --schema public,auth
```

### Diff entre local et distant

```bash
supabase db diff                    # Diff du schema
supabase db diff --linked           # Compare avec le projet lie
supabase db diff --use-migra        # Utilise migra pour le diff
```

### Autres operations DB

```bash
supabase db reset                   # Reinitialise le local (toutes migrations)
supabase db dump --linked           # Export dump du distant
supabase db dump --linked --data-only  # Dump donnees uniquement
supabase db lint                    # Verifie le schema (erreurs de typage)
```

### Lister les migrations

```bash
supabase migration list             # Statut local vs distant
supabase migration squash           # Consolide en un seul fichier
supabase migration repair --status applied <version>  # Fixe le tracking
```

---

## SQL Execution (remplace MCP execute_sql)

### Local — psql direct

```bash
# Recuperer l'URL de la base locale
DB_URL=$(supabase status -o json | jq -r '.DB_URL')

# Executer du SQL
psql "${DB_URL}" -c "SELECT * FROM public.users LIMIT 10"

# Mode interactif
psql "${DB_URL}"

# Sortie CSV (pour export)
psql "${DB_URL}" -c "SELECT * FROM users" --csv

# Sortie JSON-like (expanded)
psql "${DB_URL}" -c "SELECT * FROM users LIMIT 5" -x
```

Si `psql` n'est pas dans le PATH : `/opt/homebrew/opt/libpq/bin/psql`

### Remote — Management API

Pour le projet distant (pas besoin du mot de passe DB) :

```bash
TOKEN=$(cat ~/.supabase/access-token 2>/dev/null)
REF=$(cat supabase/.temp/project-ref 2>/dev/null)

curl -s -X POST "https://api.supabase.com/v1/projects/${REF}/database/query" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM public.users LIMIT 10"}' | jq
```

### Queries SQL courantes

```bash
# Lister les tables
psql "${DB_URL}" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"

# Schema d une table
psql "${DB_URL}" -c "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' ORDER BY ordinal_position"

# Politiques RLS
psql "${DB_URL}" -c "SELECT tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public'"

# Extensions installees
psql "${DB_URL}" -c "SELECT extname, extversion FROM pg_extension ORDER BY extname"

# Nombre de lignes par table
psql "${DB_URL}" -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC"
```

**Regles SQL :**
- Toujours limiter les SELECT (`LIMIT 100`)
- Jamais de DROP/TRUNCATE sans confirmation utilisateur
- Prepared statements pour les valeurs dynamiques
- Pas de secrets dans les queries

---

## Inspect — Sante de la base (remplace MCP get_advisors)

```bash
# Tailles des tables + index + lignes estimees
supabase inspect db table-stats --linked

# Queries les plus lentes
supabase inspect db outliers --linked

# Tables gonflees (dead tuples)
supabase inspect db bloat --linked

# Verrous actifs
supabase inspect db locks --linked
supabase inspect db blocking --linked

# Queries en cours > 5 min
supabase inspect db long-running-queries --linked

# Stats globales (cache hit, WAL, tailles)
supabase inspect db db-stats --linked

# Stats des index (utilisation, taille)
supabase inspect db index-stats --linked

# Profil lecture/ecriture par table
supabase inspect db traffic-profile --linked

# Stats vacuum
supabase inspect db vacuum-stats --linked

# Queries les plus appelees
supabase inspect db calls --linked

# Slots de replication
supabase inspect db replication-slots --linked
```

Ajouter `-o json` pour une sortie structuree.
Ajouter `--local` au lieu de `--linked` pour inspecter la base locale.

---

## Edge Functions

```bash
# Creer une nouvelle function
supabase functions new my-function
# Cree supabase/functions/my-function/index.ts

# Tester localement
supabase functions serve
# Sert toutes les functions sur http://localhost:54321/functions/v1/

# Deployer en production
supabase functions deploy my-function
supabase functions deploy          # Deploie TOUTES les functions

# Lister les functions deployees
supabase functions list

# Telecharger le code source depuis le distant
supabase functions download my-function

# Supprimer une function deployee
supabase functions delete my-function
```

---

## Storage

```bash
# Lister les objets d un bucket
supabase storage ls ss:///bucket-name/
supabase storage ls ss:///bucket-name/folder/

# Copier un fichier local vers Storage
supabase storage cp ./local-file.png ss:///bucket-name/path/file.png

# Copier depuis Storage vers local
supabase storage cp ss:///bucket-name/path/file.png ./local-file.png

# Deplacer/renommer un objet
supabase storage mv ss:///bucket/old-name.png ss:///bucket/new-name.png

# Supprimer un objet
supabase storage rm ss:///bucket-name/path/file.png

# Flags
# --linked   (defaut) cible le projet lie
# --local    cible le projet local
# -r         recursif (pour ls et cp)
```

---

## Type Generation

```bash
# Depuis le projet lie (distant)
supabase gen types typescript --linked > src/types/database.ts

# Depuis la base locale
supabase gen types typescript --local > src/types/database.ts

# Schema specifique
supabase gen types typescript --linked --schema public,auth

# Generer un JWT
supabase gen bearer-jwt --project-ref <ref>
```

---

## Secrets & Config

```bash
# Definir un secret (Edge Functions)
supabase secrets set MY_API_KEY=sk-xxx

# Lister les secrets
supabase secrets list

# Supprimer un secret
supabase secrets unset MY_API_KEY
```

---

## Project Management

```bash
# Lister les projets
supabase projects list -o json

# Lier le projet local a un projet distant
supabase link --project-ref <ref>

# Statut du projet local
supabase status -o json

# Lancer le dev local (Docker requis)
supabase start
supabase stop
```

---

## Workflows

### Workflow 1 — Ajouter une table

```bash
# 1. Creer la migration
supabase migration new create_posts_table

# 2. Ecrire le SQL dans le fichier cree
# supabase/migrations/<timestamp>_create_posts_table.sql

# 3. Tester localement
supabase db reset

# 4. Verifier le diff
supabase db diff --linked

# 5. Pousser en production
supabase db push

# 6. Regenerer les types
supabase gen types typescript --linked > src/types/database.ts
```

### Workflow 2 — Diagnostiquer un probleme de perf

```bash
# 1. Vue globale
supabase inspect db db-stats --linked

# 2. Queries lentes
supabase inspect db outliers --linked

# 3. Tables gonflees
supabase inspect db bloat --linked

# 4. Index inutilises
supabase inspect db index-stats --linked

# 5. Verrous en cours
supabase inspect db locks --linked
```

### Workflow 3 — Deployer une Edge Function

```bash
# 1. Creer
supabase functions new process-webhook

# 2. Definir les secrets
supabase secrets set WEBHOOK_SECRET=xxx

# 3. Tester localement
supabase functions serve

# 4. Deployer
supabase functions deploy process-webhook

# 5. Verifier
supabase functions list
```

### Workflow 4 — Explorer le schema (local)

```bash
# 1. Recuperer l URL de la base
DB_URL=$(supabase status -o json | jq -r '.DB_URL')

# 2. Lister les tables
psql "${DB_URL}" -c "\dt public.*"

# 3. Schema detaille d une table
psql "${DB_URL}" -c "\d+ public.users"

# 4. Politiques RLS
psql "${DB_URL}" -c "SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public'"

# 5. Stats via inspect
supabase inspect db table-stats --linked
```

---

## Regles

1. **Toujours `--linked`** pour les commandes inspect (defaut, mais explicite)
2. **`-o json`** quand on a besoin de parser la sortie
3. **`--dry-run`** avant tout `db push` en production
4. **Jamais de DROP sans confirmation** utilisateur
5. **Regenerer les types** apres chaque migration
6. **Tester localement** (`db reset`) avant de push
7. **Max 3 appels SQL** par question — utiliser le meilleur resultat

## Avance

* [Management API](references/management-api.md) — logs, SQL, advisors via REST
