# Pawgram
A website to allow users to upload their pets photos and maybe in future videos

## Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. In the Supabase dashboard, open **SQL Editor → New query**, paste in `supabase_schema.sql`, and run it
3. In **Project Settings → API**, copy the **Project URL** and **anon public** key
4. Paste them into `config.js` (`SUPABASE_URL` and `SUPABASE_ANON_KEY`)
5. Open `index.html` — Sign up / Log in now read and write real accounts via Supabase

## Pages

- `index.html` — homepage
- `signup.html` — create an account (username + password)
- `login.html` — sign in
- `feed.html` — logged-in feed (static preview for now)
