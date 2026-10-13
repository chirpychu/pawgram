# Pawgram

A pet social network — share photos of your pets, follow other owners, and
find pet-friendly events near you.

Live at **https://chirpychu.github.io/pawgram/**

## Structure

- **`client/`** — the app itself: a React + Vite single-page app (landing
  page, feed, profiles, search, playdates). See `client/README.md` for
  local dev setup.
- **`server/`** — no running server; Pawgram's backend is entirely
  [Supabase](https://supabase.com) (Postgres, Auth, Storage, RLS), called
  directly from the browser. This folder just holds that database's schema
  as SQL migrations. See `server/README.md`.
- **`.github/workflows/deploy.yml`** — builds `client/` and publishes it to
  GitHub Pages on every push to `main`.

## Tech

React, React Router, Vite, Supabase (`@supabase/supabase-js`), and the
Ticketmaster Discovery API for the Playdates event search.
