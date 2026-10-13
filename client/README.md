# Pawgram client

React + Vite single-page app. Backend is Supabase (see `../server/README.md`) —
there's no API server to run alongside this.

## Local dev

```bash
npm install
npm run dev
```

Opens at http://localhost:5173/pawgram/ (the `/pawgram/` base matches the
production GitHub Pages path — see `vite.config.js`).

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Structure

```
src/
  components/   reusable UI pieces (sidebar, post card, hero carousel, auth forms/drawer, ...)
  pages/        route-level screens (Landing, LoginPage, SignupPage, Feed, Profile, Search)
  hooks/        useAuth, useScrollReveal, useElapsedLabel
  services/     supabaseClient.js, ticketmaster.js
  styles/       global.css
  utils/        timeAgo, image compression, search helpers
```

Supabase URL/anon key and the Ticketmaster key are baked into
`src/services/`, same as the old `config.js` — they're safe to expose
client-side (gated by Row Level Security / read-only on Ticketmaster's
side). Override them locally via `.env.local` if needed — see
`.env.example`.
