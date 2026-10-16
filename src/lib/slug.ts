import { env } from '@/env';
import { MediaType, type Show } from '@/services/tmdb/types';

const SLUG_SEPARATOR_REGEX = /[^\x00-\x7F]|[&$+,:;=?@#\s<>\[\]{}|\\^%]+/gm;

export function getSlug(id: number, name: string): string {
  // Build a URL-safe slug from the name and id. Collapse consecutive
  // separators and trim leading/trailing dashes so the slug stays stable
  // across environments.
  const slugifiedName =
    (name ?? '')
      .toLowerCase()
      .replace(SLUG_SEPARATOR_REGEX, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') ?? '';
  return `${slugifiedName || 'unknown'}-${id}`;
}

export function getIdFromSlug(slug: string): number {
  // Extract the trailing id from the slug; use radix 10 and reject NaN
  // so callers can rely on a numeric result.
  if (typeof slug !== 'string' || !slug) return 0;
  const id = slug.split('-').pop();
  const parsed = Number.parseInt(id ?? '', 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getNameFromShow(show: Show | null): string {
  return show?.name ?? show?.title ?? '';
}

export function buildMovieUrl(show: Show): string {
  const name = getNameFromShow(show);
  const id = show.id;
  return `${env.NEXT_PUBLIC_APP_URL}/${show.media_type === MediaType.MOVIE ? 'movies' : 'tv-shows'
    }/${getSlug(id, name)}`;
}
