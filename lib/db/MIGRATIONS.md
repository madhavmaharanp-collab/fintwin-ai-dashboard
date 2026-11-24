# Database inspection and migration safety

No Supabase migration or RLS policy has been applied or verified. The Drizzle
models in this workspace are not evidence of the current remote schema. Do not
run `push` or `push-force` against an existing database.

## Inspect before changing anything

After authorizing your Supabase project in VS Code, use a read-only SQL session
or the Supabase SQL editor to inspect metadata (not user data):

```sql
SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
ORDER BY 1, 2;

SELECT table_name, ordinal_position, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Also inspect primary keys, foreign keys, existing grants, indexes, functions,
triggers and migration history. Treat output as confidential. Do not expose
credentials or user records in chat.

## Before applying a migration

1. Back up the project and confirm restoration works. Use a non-production
   branch or separate project for testing.
2. Compare the inspected schema with the intended application model. Design
   additive, versioned migrations for the *actual* schema; avoid replacing
   existing tables or dropping data. Do not generate or apply the current
   model blindly.
3. Design ownership constraints and RLS policies for every exposed table.
   Verify reads, inserts, updates and deletes across at least two users,
   including indirect ownership such as AI messages and their parent chats.
4. Verify backend authorization separately: a `postgres` connection normally
   bypasses RLS. Use appropriately restricted roles and explicit ownership
   checks instead of relying on policies the backend bypasses.
5. Review the SQL and rollback plan, test on the non-production copy, then
   apply only with the project owner's approval.

The supplied session-pooler address is represented by `DIRECT_URL` for Drizzle;
the application uses `DATABASE_URL`. Set passwords privately and use TLS.
