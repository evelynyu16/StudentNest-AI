# StudentNest AI

## Team Members

| Name | GitHub |
|------|--------|
| Bo Hu | [`BoHu1122`](https://github.com/BoHu1122) |
| Fanchao Yu | [`evelynyu16`](https://github.com/evelynyu16) |
| Na Yin | [`ynbonvayage`](https://github.com/ynbonvayage) |

## Project Description

Finding an off-campus apartment is stressful and time-consuming for many university students. Listings are scattered across many platforms, written in inconsistent formats, and often missing key details such as total cost, lease terms, or commute time. Students new to the city, including transfer and international students who cannot visit in person, also face the risk of rental scams and unfamiliar local rules. Our team is using a human-centered design process to study how students find, compare, and verify apartments, and where that process breaks down.

## Project Status

**This is Phase 1: Research & Planning.**

## Running the app

The working prototype is a React + TypeScript app (Vite) with a few server functions in `api/`.

```bash
npm install
cp .env.example .env.local   # fill in the keys you have
npm run dev                  # http://localhost:5173
```

Every key is optional. Whatever is missing falls back to a simpler mode:

| Feature | Needs | Without it |
|---|---|---|
| Sign-in, tracker saved across devices | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Tracker is kept in this browser only; no sign-in button |
| Paste a listing → AI converts it | `OPENAI_API_KEY` (optional `OPENAI_MODEL`) | "Enter details by hand" still works |
| Real map | `VITE_GOOGLE_MAPS_KEY` (Maps JavaScript API) | Schematic map from the prototype |
| Any school/address, real travel times | `GOOGLE_MAPS_SERVER_KEY` (Geocoding API + Routes API) | Built-in list of schools; commute is a distance estimate |

### Supabase setup
1. Create a project at supabase.com (the free tier is enough).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates the `tracker_items` and `profiles` tables with row-level security, so each student only sees their own data.
3. In **Authentication → Providers**, keep Email on (magic link). Optionally turn on Google.
4. In **Authentication → URL Configuration**, add `http://localhost:5173` and your deployed URL as redirect URLs.

When Supabase is configured, the `/api` endpoints accept only signed-in users, so the OpenAI and Google keys can't be used by anyone else.

### Deploying
Deploy to Vercel: import the repo, and add the same environment variables in the project settings. Files in `api/` become serverless functions automatically.

## How it's built

- `src/lib/`: cost math, sample listings, scoring for the recommendation, API and Supabase clients
- `src/components/`: Search (filters, cards, map), Tracker (stages, recommendation, side-by-side compare), Paste dialog, Sign-in dialog
- `src/hooks/useTracker.ts`: tracker and priorities, stored locally or in Supabase. Anything saved before sign-in moves into the account on first sign-in
- `api/parse-listing.ts`: sends pasted text, screenshots or a link to OpenAI GPT (`gpt-5.4-mini` by default, structured output). Returns rent, fees, deposits, move-in date, scam warning signs and questions to ask. The student checks and edits every field before saving
- `api/geocode.ts`, `api/commute.ts`: Google Geocoding and Routes API (transit times for a weekday morning)

Sample listings around each school are generated for the demo. Listings students paste are real.
