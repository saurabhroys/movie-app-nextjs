# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
- **Name:** `tunebox`
- **Stack:** Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS v4, tRPC, TanStack Query, Zustand
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

Required env vars (see `src/env.ts`):
- `NEXT_PUBLIC_APP_URL` — deployed URL
- `NEXT_PUBLIC_TMDB_TOKEN` — TMDb API Bearer token
- `NEXT_PUBLIC_SITE_NAME` — display name

## Architecture

### Data Flow
```
TMDb API → BaseService (axios) → MovieService → tRPC router → React components
                                              ↓
                                    Zustand stores (client state)
```

### Key Directories
- `src/services/` — API layer. `BaseService` handles axios instance; `MovieService` wraps all TMDb endpoints with React `cache()` for request deduplication
- `src/server/` — tRPC router (`appRouter`) with procedures for movies, search, sports
- `src/stores/` — Zustand stores: `preview-modal`, `hover-modal`, `search`
- `src/components/watch/` — Player ecosystem: `player-selector.tsx` builds embed URLs from multiple providers; `embed-player.tsx` renders iframes
- `src/hooks/` — Custom hooks including `use-keyboard-shortcuts`, `use-search`, `use-on-click-outside`

### Video Player System
`player-selector.tsx` manages multiple embed providers:
- TV/Movie: Netflix Live (zxcstream), Vidify, Gemma, VidSrc.to, VidSrc.pk
- Anime: VidSrc, VidNest, VidFast, VidEasy, AutoEmbed

Player selection persists to `localStorage.activePlayerId`. URLs built in `buildPlayerUrl()` based on `mediaId`, `season`, `episode`, and `imdbId`.

### Routing & Pages
- `(front)/` — Main app routes: `/`, `/movies`, `/tv-shows`, `/anime`, `/search`, `/new-and-popular`
- `watch/[slug]/` — Streaming page; `slug` format is `{title}-{tmdbId}`
- `download/[mediaType]/[mediaId]/` — Download links page

### UI Components
- `src/components/ui/` — Radix-based primitives (dialog, dropdown-menu, button, etc.)
- `shows-carousel.tsx` — Horizontal scroll carousel for movie rows
- `shows-cards.tsx` — Grid/list items with hover preview integration
- `preview-modal.tsx` — Full-screen modal with trailer, season selector, cast
- `hover-modal.tsx` — Lightweight preview on card hover (desktop only)

### Caching Strategy
- **Request deduplication:** React `cache()` wraps all MovieService methods
- **ISR config:** `next.config.ts` sets `cacheLife` for show data (5min stale, 30min revalidate, 24hr expire)
- **TanStack Query:** `staleTime: 5000ms` in `trpc-provider.tsx`

### Content Filtering
`src/lib/search-intelligence.ts` contains keyword-based content filtering for adult content in search results.

## Important Patterns

### Slug ↔ ID Conversion
- `getSlug(id, name)` → `"{name}-{id}"` (URL-safe)
- `getIdFromSlug(slug)` → extracts ID from slug
- Used in all detail page routing

### Image Handling
- `src/components/tmdb-image.tsx` — TMDb image component with optimization
- `src/components/custom-image.tsx` — Generic optimized image wrapper
- Domain: `image.tmdb.org` (configured in `env.NEXT_PUBLIC_IMAGE_DOMAIN`)

### Client vs Server
- `use client` components: stores, hooks, player, modals
- Server components: pages, layout, metadata generation
- `use-mounted.ts` hook guards client-only code (e.g., `window` access)

## Deployment
- **Vercel:** Primary deployment target. Click deploy button in README with env vars.
- Build validates env vars via `@t3-oss/env-nextjs`. Set `SKIP_ENV_VALIDATION=1` for Docker builds.
