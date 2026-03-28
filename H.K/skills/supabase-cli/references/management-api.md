# Management API Supabase — Operations avancees

Certaines operations du MCP Supabase n'ont pas d'equivalent CLI direct.
Utiliser la Management API via `curl`.

## Authentification

```bash
# Token stocke par `supabase login`
TOKEN=$(cat ~/.supabase/access-token 2>/dev/null)

# Project ref (depuis le projet lie)
REF=$(cat supabase/.temp/project-ref 2>/dev/null)
# Ou depuis la liste des projets :
# REF=$(supabase projects list -o json | jq -r '.[0].id')
```

## Execute SQL (remplace MCP execute_sql)

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/${REF}/database/query" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "YOUR SQL HERE"}' | jq
```

### Exemples courants

```bash
# Lister les tables
curl -s -X POST "https://api.supabase.com/v1/projects/${REF}/database/query" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = '\''public'\'' ORDER BY tablename"}' | jq

# Schema d une table
curl -s -X POST "https://api.supabase.com/v1/projects/${REF}/database/query" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = '\''public'\'' AND table_name = '\''users'\'' ORDER BY ordinal_position"}' | jq

# Politiques RLS
curl -s -X POST "https://api.supabase.com/v1/projects/${REF}/database/query" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = '\''public'\'' ORDER BY tablename"}' | jq

# Extensions installees
curl -s -X POST "https://api.supabase.com/v1/projects/${REF}/database/query" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT extname, extversion FROM pg_extension ORDER BY extname"}' | jq

# Taille des tables
curl -s -X POST "https://api.supabase.com/v1/projects/${REF}/database/query" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT relname, pg_size_pretty(pg_total_relation_size(oid)) AS size FROM pg_class WHERE relnamespace = '\''public'\''::regnamespace AND relkind = '\''r'\'' ORDER BY pg_total_relation_size(oid) DESC"}' | jq
```

## Logs (remplace MCP get_logs)

```bash
# Logs API
curl -s "https://api.supabase.com/v1/projects/${REF}/analytics/endpoints/logs.all?iso_timestamp_start=$(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ)" \
  -H "Authorization: Bearer ${TOKEN}" | jq

# Logs par service
# Services : api, postgres, edge_functions, auth, storage, realtime
curl -s "https://api.supabase.com/v1/projects/${REF}/analytics/endpoints/logs.all?source=edge_functions&iso_timestamp_start=$(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ)" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.result[:10]'
```

## Advisors (security + performance)

```bash
# Security advisors
curl -s "https://api.supabase.com/v1/projects/${REF}/advisors/security" \
  -H "Authorization: Bearer ${TOKEN}" | jq

# Performance advisors
curl -s "https://api.supabase.com/v1/projects/${REF}/advisors/performance" \
  -H "Authorization: Bearer ${TOKEN}" | jq
```

## Branching (plans payants)

```bash
# Creer une branche
curl -s -X POST "https://api.supabase.com/v1/projects/${REF}/branches" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"branch_name": "feature-x", "git_branch": "feature-x"}' | jq

# Lister les branches
curl -s "https://api.supabase.com/v1/projects/${REF}/branches" \
  -H "Authorization: Bearer ${TOKEN}" | jq

# Supprimer une branche
curl -s -X DELETE "https://api.supabase.com/v1/projects/${REF}/branches/<branch-id>" \
  -H "Authorization: Bearer ${TOKEN}"
```

## Regles de securite

1. **Jamais le TOKEN en dur** — toujours `cat ~/.supabase/access-token`
2. **LIMIT sur les SELECT** — eviter de dumper des tables entieres
3. **Pas de DROP/TRUNCATE** sans confirmation utilisateur
4. **Filtrer les secrets des logs** — ne pas afficher les tokens/cles
5. **Utiliser --dry-run** avant les operations destructives
