

## Create scenario_drafts migration

### Single file to create
`supabase/migrations/20260413000000_add_scenario_drafts.sql`

Contains exactly the SQL provided in the task:
- `scenario_drafts` table with `id`, `user_id` (FK to auth.users), `scenario_id`, `blocks` (jsonb), `updated_at`
- UNIQUE constraint on `(user_id, scenario_id)`
- Index on `(user_id, scenario_id)`
- `updated_at` trigger using a new function `update_scenario_drafts_updated_at()`
- RLS enabled with a single `FOR ALL` policy scoped to `user_id = auth.uid()`
- 50KB size check constraint on `blocks`

### What does NOT change
- No existing migrations modified
- No existing tables altered
- No edge functions or client code modified (that comes in a later task)

