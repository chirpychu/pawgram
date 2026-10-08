// Pawgram — Supabase connection config
//
// 1. Create a free project at https://supabase.com
// 2. Run supabase_schema.sql in the SQL Editor (Project → SQL Editor → New query)
// 3. Go to Project Settings → API and copy "Project URL" and "anon public" key below
//
// These two values are safe to expose in client-side code — the anon key only
// grants whatever the Row Level Security policies in supabase_schema.sql allow.

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
