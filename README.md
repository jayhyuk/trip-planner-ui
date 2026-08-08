# TripTogether

A mobile-friendly Next.js app for planning trip itineraries with friends — trips, day-by-day
schedules, transportation, and accommodation. No login required: share a trip's URL/key with
friends and everyone can view and edit it.

## How it works

- The UI talks to a Travel Planner REST API (trips → days → schedules).
- All API calls go through a Next.js route proxy at `src/app/api/[...path]/route.ts`, which
  forwards requests server-side to the backend defined by `API_BASE_URL`. This keeps the backend
  URL out of the browser and avoids mixed-content/CORS issues when the app is deployed over HTTPS
  but the backend is plain HTTP.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

Copy `.env.example` to `.env.local` and set the backend URL:

```
API_BASE_URL=http://your-backend-host:port
```

This is a **server-only** variable (no `NEXT_PUBLIC_` prefix) — it is never sent to the browser.

## Deploying on Vercel

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. In Project Settings → Environment Variables, add `API_BASE_URL` pointing at your backend.
4. Deploy. Vercel builds with `npm run build` and serves the app automatically.

> Note: Vercel serverless functions call out to `API_BASE_URL` over plain HTTP if your backend
> isn't behind HTTPS — that's fine server-side, but consider putting the backend behind HTTPS/a
> domain for production reliability.

## Project structure

- `src/app/page.tsx` — trip list (home)
- `src/app/new/page.tsx` — create trip
- `src/app/trips/[tripKey]/page.tsx` — trip detail, itinerary days
- `src/app/trips/[tripKey]/days/[dayId]/page.tsx` — day schedule (places/transport/stays)
- `src/app/api/[...path]/route.ts` — API proxy to the backend
- `src/lib/api.ts` — typed API client
- `src/lib/types.ts` — API request/response types
- `src/components/` — shared UI (Button, Modal, Header, EmptyState, Spinner, ErrorBanner)

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production build locally
- `npm run lint` — lint the project
