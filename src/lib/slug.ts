import { env } from '@/env';
import { MediaType, type Show } from '@/services/tmdb/types';

export function getSlug(id: number, name: string): string {
  // build slug from name and id
  const regex = /([^\x00-\x7F]|[&$\+,:;=\?@#\s<>\[\]\{\}|\\\^%])+/gm;
  return `${name.toLowerCase().replace(regex, '-')}-${id}`;
}

export function getIdFromSlug(slug: string): number {
  // get id from slug
  const id: string | undefined = slug.split('-').pop();
  return id ? parseInt(id) : 0;
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
