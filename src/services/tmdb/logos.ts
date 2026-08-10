import MovieService from './movie.service';
import {
  MediaType,
  type ImagesResponse,
} from './types';

/**
 * Shared logo helpers used by the browse pages (server) and the getLogos
 * tRPC procedure (client lazy-load). No `'use cache'` here — caching is owned
 * by each caller's scope (the page `cacheLife('hours')` scopes and the
 * procedure's `cacheLife('logo')`), so these stay plain functions that any
 * scope can safely call.
 */

/** Strictly-safe concurrency bound: ~40 req/s at ~200ms RTT vs TMDb's ~50 req/s cap. */
export const LOGO_CONCURRENCY = 8;

/** Maps a show's media type to the /images endpoint segment ('anime' hits /tv). */
export function getImageType(mediaType: MediaType): 'movie' | 'tv' | 'anime' {
  if (mediaType === MediaType.MOVIE) return 'movie';
  if (mediaType === MediaType.ANIME) return 'anime';
  return 'tv';
}

/** Prefers the English logo, falling back to the first available one. */
export function pickPreferredLogo(images: ImagesResponse): string | null {
  const logo =
    images.logos?.find((l) => l.iso_639_1 === 'en') ?? images.logos?.[0];
  return logo ? logo.file_path : null;
}

/**
 * Bounded-concurrency map so a large batch never fires all requests at once
 * (the old home.tsx path fired ~280 simultaneous calls and hit rate limits,
 * which withRetry then multiplied through backoff). Per-item errors are
 * contained by the caller; the pool itself never rejects.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

/**
 * Fetches logo paths for a list of shows, deduped by id, in bounded pools.
 * A failure on any single show yields `null` for that id — the batch never
 * rejects as a whole. Accepts flat `{ id, media_type }[]` so it stays in the
 * services layer and is callable from the tRPC router.
 */
export async function fetchLogoPaths(
  shows: Array<{ id: number; media_type: MediaType }>,
  concurrency: number = LOGO_CONCURRENCY,
): Promise<Record<number, string | null>> {
  const unique = Array.from(
    new Map(shows.map((s) => [s.id, s])).values(),
  );
  const entries = await mapWithConcurrency(unique, concurrency, async (show) => {
    try {
      const { data } = await MovieService.getImages(
        getImageType(show.media_type),
        show.id,
      );
      return [show.id, pickPreferredLogo(data)] as const;
    } catch {
      return [show.id, null] as const;
    }
  });
  return Object.fromEntries(entries);
}

/**
 * Fetches the first Trailer key via the lightweight /videos endpoint.
 * Tries en-US first, falls back to hi-IN only when en-US has no Trailer.
 */
export async function fetchHeroTrailer(
  id: number,
  mediaType: MediaType,
): Promise<string | null> {
  const type: 'movie' | 'tv' = mediaType === MediaType.TV ? 'tv' : 'movie';
  for (const language of ['en-US', 'hi-IN']) {
    try {
      const { data } = await MovieService.getVideos(type, id, language);
      const key = data?.results?.find((v) => v.type === 'Trailer')?.key ?? null;
      if (key) return key;
    } catch {
      // try the next language
    }
  }
  return null;
}
