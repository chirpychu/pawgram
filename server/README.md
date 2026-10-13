# server/

Pawgram has no custom backend server — [Supabase](https://supabase.com) *is*
the backend (Postgres, Auth, Storage, and Row Level Security policies), and
the React app in `client/` talks to it directly from the browser via
`@supabase/supabase-js`, using the public anon key in
`client/src/services/supabaseClient.js`.

This folder exists to hold that backend's **schema as code** — SQL
migrations, not a running process — so changes to the database are tracked
the same way changes to the frontend are.

- `supabase/migrations/` — SQL migration files, newest at the bottom,
  applied in order in the Supabase SQL Editor (or via `supabase db push`
  if you set up the Supabase CLI locally).

**The full current schema (`supabase_schema.sql`) is intentionally not
committed here** — it's kept as a private, local-only file per an earlier
decision for this project, and `.gitignore` excludes it by filename
anywhere in the repo. If you want the actual schema tracked in git going
forward, the cleanest path is to export it from Supabase (Database →
Backups → or `supabase db dump`) and add it as the first migration file in
`supabase/migrations/` — just say the word and it can be added.
