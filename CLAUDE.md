# CLAUDE.md

## Project Overview
- Name: `tunebox`
- Stack: Next.js 16, React 19, TypeScript, Tailwind CSS
- Purpose: Movie browsing and streaming web app using TMDb-backed metadata and external embed providers.

## Local Setup
1. Install dependencies:
   - `npm install`
2. Configure environment:
   - `cp .env.example .env`
3. Start dev server:
   - `npm run dev`

## Environment Variables
- `NEXT_PUBLIC_APP_URL`: Public app URL
- `NEXT_PUBLIC_TMDB_TOKEN`: TMDb API token
- `NEXT_PUBLIC_SITE_NAME`: Display site name

## Common Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Start production build: `npm run start`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`
- Format: `npm run format`

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
- `npm run lint`
- `npm run typecheck`
- `npm run build` (for release-sensitive changes)
