import ShowsPage, { type BrowsePageData } from '@/features/browse/shows-page';
import { enrichShowsWithLogos } from '@/features/browse/shows-page';
import { siteConfig } from '@/configs/site';
import { GENRES, RequestType, MediaType, type ShowRequest } from '@/services/tmdb/types';
import { getShows } from '@/services/tmdb/shows';
import { type Metadata } from 'next';

import { cacheLife } from 'next/cache';
import { connection } from 'next/server';

export const metadata: Metadata = {
  title: 'Movies',
  description: `Browse and watch the latest movies on ${siteConfig.name}. Discover trending movies, popular releases, and movies by genre.`,
};

export default async function MoviePage() {
  await connection();
  const h1 = `${siteConfig.name} Movie`;
  const data = await getMovieData();
  return (
    <>
      <h1 className="hidden">{h1}</h1>
      <ShowsPage data={data} />
    </>
  );
}

async function getMovieData(): Promise<BrowsePageData> {
  'use cache';
  cacheLife('hours');
  const requests: ShowRequest[] = [
    {
      title: 'Trending Now',
      req: { requestType: RequestType.TRENDING, mediaType: MediaType.MOVIE },
      visible: true,
    },
    {
      title: 'Popular',
      req: { requestType: RequestType.POPULAR, mediaType: MediaType.MOVIE },
      visible: true,
    },
    {
      title: 'Top Rated Movies',
      req: { requestType: RequestType.TOP_RATED, mediaType: MediaType.MOVIE },
      visible: true,
    },
    {
      title: 'Latest Movies',
      req: { requestType: RequestType.NOW_PLAYING, mediaType: MediaType.MOVIE },
      visible: true,
    },
    {
      title: 'Comedy Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.COMEDY,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Action Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.ACTION,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Animation Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.ANIMATION,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Sci-Fi Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.SCIENCE_FICTION,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Horror Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.HORROR,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Romance Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.ROMANCE,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Scary Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.THRILLER,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Documentaries',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.DOCUMENTARY,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Indian Movies',
      req: {
        requestType: RequestType.INDIAN_MOVIES,
        mediaType: MediaType.MOVIE,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'South Indian Movies',
      req: {
        requestType: RequestType.SOUTH_INDIAN,
        mediaType: MediaType.MOVIE,
        isLatest: true,
      },
      visible: true,
    },
  ];

  return await enrichShowsWithLogos(await getShows(requests));
}
