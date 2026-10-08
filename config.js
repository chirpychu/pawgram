// Pawgram — Supabase connection config
//
// 1. Create a free project at https://supabase.com
// 2. Run supabase_schema.sql in the SQL Editor (Project → SQL Editor → New query)
// 3. Go to Project Settings → API and copy "Project URL" and "anon public" key below
//
// These two values are safe to expose in client-side code — the anon key only
// grants whatever the Row Level Security policies in supabase_schema.sql allow.

const SUPABASE_URL = "https://bdpgwaeaubsxbxydjvfo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcGd3YWVhdWJzeGJ4eWRqdmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzA1NjksImV4cCI6MjEwNzA0NjU2OX0.LWry_M73He_GePXzIE4NaR1P24gA-aRTFuTtFa0WvE8";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
