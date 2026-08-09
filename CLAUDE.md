# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
- **Name:** `tunebox`
- **Stack:** Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS v4, tRPC, TanStack Query, Redux Toolkit (RTK + RTK Query)
- **Purpose:** Netflix-style movie/TV show browsing and streaming app using TMDb API for metadata and multiple embed providers for video playback

## Commands
```bash
bun run dev          # Start dev server (Turbopack)
bun run build        # Production build
bun run start        # Start production server
bun run lint         # ESLint on src/
bun run typecheck    # TypeScript check
bun run format       # Prettier format all files
```

## Environment Setup
```bash
cp .env.example .env
bun install
bun run dev
```

Environment variables are validated in `src/env.ts` via `@t3-oss/env-nextjs`. Server-only vars (`NODE_ENV`) never reach the client; everything else is client-prefixed `NEXT_PUBLIC_`:
- `NEXT_PUBLIC_APP_URL` — deployed URL
- `TMDB_TOKEN` — TMDb API Bearer token, **server-only** (used by the axios instance; never shipped to the browser)
- `NEXT_PUBLIC_SITE_NAME` — display name
- `NEXT_PUBLIC_IMAGE_DOMAIN` — image host (default `image.tmdb.org`)
- `NEXT_PUBLIC_TMDB_API_URL` — TMDb API base (default `https://api.themoviedb.org/3`)
- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` — analytics

## Architecture

### Data Flow
```
TMDb API → src/services/tmdb (axios) → MovieService / SearchService → tRPC router (browse) | RTK Query (search)
                                              ↓
                                    Redux Toolkit store (client state)
```

### Key Directories
- `src/services/tmdb/` — API layer. `http.ts` owns the shared axios instance (Bearer auth, retry with backoff); `movie.service.ts` wraps TMDb endpoints; `search.service.ts` adds request cancellation + deduplication; `shows.ts` batches category requests and wraps the base call in React `cache()` for request deduplication; `url-builder.ts` + `types.ts` support them
- `src/server/` — tRPC: `trpc.ts` (init), `index.ts` (`appRouter`), `routers/movie.ts` (the only router: `getInfiniteShows`). `actions/get-show-details.ts` is a `'use server'` action that collapses ~30 TMDb calls into one cached round-trip for modal data
- `src/redux/` — Redux Toolkit store: `store.ts`, `root-reducer.ts`, `hooks.ts`. Slices: `previewModal`, `hoverModal`, `search`; `searchApi` is RTK Query. Detail fetching lives in `src/redux/features/modals/` + `src/features/modals/*Thunks.ts`
- `src/features/` — feature folders: `browse/`, `modals/`, `search/`, `sitemap/`, `watch/`
- `src/components/` — cross-cutting: `layout/`, `navigation/`, `providers/`, `shared/`, `ui/` (Radix primitives)
- `src/hooks/` — `use-keyboard-shortcuts`, `use-lock-body`, `use-mounted`, `use-on-click-outside`, `use-window-listeners`; `use-search` lives in `src/features/search/`

### Video Player System
`src/features/watch/player-selector.tsx` manages multiple embed providers:
- TV/Movie: Netflix Live (zxcstream), Vidify, Gemma, VidSrc.to, VidSrc.pk
- Anime: VidSrc.pk, VidNest, VidNest (Delta), VidFast, VidEasy, AutoEmbed, VidSrc.to

Player selection persists to `localStorage.activePlayerId`. URLs built in `buildPlayerUrl()` based on `mediaId`, `season`, `episode`, and `imdbId`. `embed-player.tsx` renders the iframes.

### Routing & Pages
- `(front)/` — Main app routes: `/`, `/movies`, `/tv-shows`, `/anime`, `/search`, `/new-and-popular`, `/sports`
- `watch/[slug]/` — Streaming page; `slug` format is `{title}-{tmdbId}`
- `download/[mediaType]/[mediaId]/` — Download links page
- `sitemap.xml` + `sitemap/[id]` — generated from `src/features/sitemap/`

### UI Components
- `src/components/ui/` — Radix-based primitives (dialog, dropdown-menu, button, etc.)
- `src/features/browse/` — `shows-carousel.tsx` (horizontal rows), `shows-cards.tsx` (grid/list items), `shows-container.tsx`, `shows-grid.tsx`, `shows-skeleton.tsx`
- `src/features/modals/` — `preview-modal.tsx` (full-screen modal with trailer, season selector, cast), `hover-modal.tsx` (lightweight desktop hover preview)

### State Management (Redux Toolkit)
- Store: `src/redux/store.ts`; `root-reducer.ts` combines the `previewModal`, `hoverModal`, `search` slices plus the `searchApi` reducer
- Search is RTK Query (`searchApi` in `src/redux/features/search/searchApi.ts`) calling `SearchService` directly — no tRPC procedure
- Modal data thunks in `src/features/modals/*Thunks.ts`; `detail-fetch-helper.ts` aggregates the TMDb calls behind the `getShowDetails` server action

### Caching Strategy
- **Request deduplication:** React `cache()` wraps the base TMDb call in `src/services/tmdb/shows.ts`
- **`'use cache'` profiles** (`next.config.ts`): `hours` for browse pages, `search` for the search page, and `show` for `getShowDetails` (5min stale, 30min revalidate, 24hr expire)
- **TanStack Query:** `staleTime: 300000ms` (5min), `gcTime: 600000ms`, `refetchOnWindowFocus: false` in `trpc-provider.tsx`

### Content Filtering
`src/features/search/search-intelligence/` contains keyword-based content filtering (`filterAdultContent`), query normalization (`normalizeQuery`, `expandQuery`), and relevance ranking (`rankSearchResults`) for search results.

## Important Patterns

### Slug ↔ ID Conversion
`src/lib/slug.ts`:
- `getSlug(id, name)` → `"{name}-{id}"` (URL-safe)
- `getIdFromSlug(slug)` → extracts ID from slug
- Used in all detail page routing

### Image Handling
- `src/components/shared/custom-image.tsx` — optimized image wrapper
- Domain: `image.tmdb.org` (configured via `NEXT_PUBLIC_IMAGE_DOMAIN`)

### Client vs Server
- `use client` components: providers, hooks, modals, player, Redux-connected UI
- Server components: pages, layout, metadata generation
- Server actions (`'use server'`): `getShowDetails` for modal data
- `use-mounted.ts` hook guards client-only code (e.g., `window` access)

## Deployment
- **Vercel:** Primary deployment target. Click deploy button in README with env vars.
- Build validates env vars via `@t3-oss/env-nextjs`. Set `SKIP_ENV_VALIDATION=1` for Docker builds.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
