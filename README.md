# MediaHub

MediaHub is a personal media tracker built with Next.js and TMDB. It lets you browse movies/series, open rich detail pages, manage TMDB list/watchlist actions, rate titles, and keep private thoughts in a local persistent database.

## Quick Start (30 Seconds)

1. Create `.env.local` in project root:

```bash
TMDB_ACCESS_TOKEN=your_tmdb_v4_bearer_token
```

2. Install dependencies and start dev server:

```bash
npm install
npm run dev
```

3. Open http://localhost:3000

4. Go to `/dashboard` and sign in with TMDB to enable watchlist, ratings, and list actions.

That is all you need to run the app. See the sections below for full details.

## What You Can Do

- Browse trending and discovery rows for movies and series.
- Search TMDB and add items to your configured list or watchlist.
- View movie/series/person detail pages with cast, crew, videos, images, recommendations, and seasons/episodes.
- Manage TMDB watchlist state inline (with instant UI updates and action toasts).
- Save personal ratings to TMDB.
- Save personal text thoughts for movie, tv, and episode entities.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui-style component primitives
- TMDB v3 + v4 APIs (proxied through server routes)
- SQLite for persistent thought notes via Node built-in `node:sqlite`

## Requirements

- Node.js 22.5+ (required for `node:sqlite` used by thoughts storage)
- npm (or another supported package manager)
- TMDB access token (v4 bearer token)

## Environment Variables

Create a `.env.local` file in the project root:

```bash
TMDB_ACCESS_TOKEN=your_tmdb_v4_bearer_token
```

How to get it:
1. Go to TMDB account settings.
2. Create/locate your API Read Access Token (v4 auth).
3. Copy it into `TMDB_ACCESS_TOKEN`.

## Run Locally

```bash
npm install
npm run dev
```

Then open:

http://localhost:3000

Other scripts:

```bash
npm run build
npm run start
npm run lint
```

## Authentication and Account Data

MediaHub uses TMDB session credentials for account-specific actions (watchlist, ratings, list writes).

- Credentials are stored client-side in localStorage.
- You can sign in from the dashboard flow.
- Once signed in, watchlist/rating/list features become available across pages.

## Personal Thoughts Storage

Thoughts are not stored in TMDB (TMDB has no personal text-thought endpoint). They are stored locally in SQLite:

- Database path: `.data/mediahub.sqlite`
- Route: `app/api/thoughts/route.ts`
- Runtime: Node.js runtime

Thought keys are scoped by account and entity type so notes are isolated by user + title/episode.

## Route Overview

Main app routes:

- `/` home (trending/discovery)
- `/dashboard`
- `/movies`
- `/series`
- `/movies/[id]`
- `/series/[id]`
- `/series/[id]/seasons/[seasonNumber]`
- `/series/[id]/seasons/[seasonNumber]/episodes/[episodeNumber]`
- `/person/[id]`
- `/tmdb-results`

API routes:

- `/api/tmdb` feature-based TMDB proxy
	- `feature=trending`
	- `feature=discover`
	- `feature=auth`
	- `feature=lists`
	- `feature=watchlist`
	- `feature=rating`
- `/api/thoughts` CRUD for personal thought notes

## Project Structure

High-level directories:

- `app/` pages and API routes
- `components/` UI + feature components
- `components/ui/` reusable UI primitives
- `lib/` TMDB/data utilities and shared types
- `public/` static assets

## Notes and Constraints

- The app relies on TMDB account/session for write actions.
- If watchlist/list/rating operations fail, check token/session validity first.
- Thoughts persistence depends on Node runtime with `node:sqlite` support.

## Troubleshooting

### 401/403 from TMDB

- Verify `TMDB_ACCESS_TOKEN` is set and valid.
- Re-authenticate on the dashboard to refresh session/account ids.

### Watchlist not updating

- Ensure account id + session id are present.
- Confirm you are signed in to TMDB in the app.

### Thoughts not saving

- Verify Node version is 22.5+.
- Ensure app has permission to create/write `.data/mediahub.sqlite`.

## Contributing

Contributions are welcome.

1. Create a feature branch.
2. Make changes with clear commit messages.
3. Run lint/build checks.
4. Open a pull request.

## Acknowledgements

- Data provided by The Movie Database (TMDB): https://www.themoviedb.org
- Built with Next.js and React.
