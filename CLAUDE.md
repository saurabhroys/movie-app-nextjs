# CLAUDE.md

## Project Overview
- Name: `tunebox`
- Stack: Next.js 16, React 19, TypeScript, Tailwind CSS
- Purpose: Movie browsing and streaming web app using TMDb-backed metadata and external embed providers.

## Local Setup
1. Install dependencies:
   - `bun install`
2. Configure environment:
   - `cp .env.example .env`
3. Start dev server:
   - `bun run dev`

## Environment Variables
- `NEXT_PUBLIC_APP_URL`: Public app URL
- `NEXT_PUBLIC_TMDB_TOKEN`: TMDb API token
- `NEXT_PUBLIC_SITE_NAME`: Display site name

## Common Commands
- Dev: `bun run dev`
- Build: `bun run build`
- Start production build: `bun run start`
- Lint: `bun run lint`
- Type-check: `bun run typecheck`
- Format: `bun run format`

## Codebase Landmarks
- App source: `src/`
- Static assets: `public/`
- Next config: `next.config.mjs`
- Search/SEO notes: `SEARCH_OPTIMIZATION.md`

## Change Guidelines
- Keep changes scoped and minimal.
- Prefer TypeScript-safe updates over `any`.
- Match existing component and styling patterns in nearby files.
- Run lint and type-check for non-trivial changes before handing off.

## Validation Checklist
- `bun run lint`
- `bun run typecheck`
- `bun run build` (for release-sensitive changes)
