# Milka Service Board v7 — Supabase Realtime

This version keeps the Milka board UI but adds shared live sync between devices.

## What changed
- state still works locally if Supabase is not configured
- if Supabase is configured, the full board state syncs to the `board_state` table
- all connected devices receive live updates through Supabase Realtime
- status badge in the header shows `SYNC`, `LOCAL`, `LINK`, or `ERROR`

## 1. Install
```bash
npm install
```

## 2. Environment
Create `.env` from `.env.example`.

```bash
cp .env.example .env
```

Fill in:
- `ANTHROPIC_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 3. Supabase SQL
Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.

## 4. Start locally
```bash
npm run dev
```

## 5. Deploy
This is still a Vite app. On Vercel or Netlify, the root must directly contain:
- `package.json`
- `index.html`
- `src/`

## Notes
- This version syncs one shared board row: `id = main`
- It uses the public anon key on the client, which is normal for Supabase browser access
- RLS in the sample SQL is open to authenticated and anonymous users for fast setup; tighten it later if needed
