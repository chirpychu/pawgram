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

// Pawgram — Ticketmaster Discovery API (powers the "Playdates" events search)
//
// 1. Sign up for a free account at https://developer-acct.ticketmaster.com/user/register
// 2. Create a new app in "My Apps" — it gives you a "Consumer Key" immediately
// 3. Paste that Consumer Key below
//
// This key is safe to expose in client-side code — Ticketmaster's Consumer Key
// is designed for direct browser use and only grants read access to public event listings.
const TICKETMASTER_API_KEY = "C5Xuc6E78XWD2tMtRoNvM3fh4Y2zwFd1";
