import Hero from '@/features/browse/hero';
import ShowsContainer from '@/features/browse/shows-container';
import { siteConfig } from '@/configs/site';
import { GENRES, RequestType, type ShowRequest } from '@/services/tmdb/types';
import { getRandomShow } from '@/lib/utils';
import { getShows } from '@/services/tmdb/shows';
import { MediaType, type Show } from '@/services/tmdb/types';
import { type Metadata } from 'next';

import { cacheLife } from 'next/cache';
import { connection } from 'next/server';

export const metadata: Metadata = {
  title: 'TV Shows',
  description: `Browse and watch the latest TV shows on ${siteConfig.name}. Discover trending TV series, popular shows, and shows by genre and streaming platform.`,
};

export default async function TvShowPage() {
  await connection();
  const h1 = `${siteConfig.name} TV Shows`;
  const categorizedShows = await getTvShowData();
  const randomShow: Show | null = getRandomShow(categorizedShows);

  return (
    <>
      <h1 className="hidden">{h1}</h1>
      <Hero randomShow={randomShow} />
      <ShowsContainer shows={categorizedShows} />
    </>
  );
}

async function getTvShowData() {
  'use cache';
  cacheLife('hours');
  const requests: ShowRequest[] = [
    {
      title: 'Trending Now',
      req: { requestType: RequestType.TRENDING, mediaType: MediaType.TV },
      visible: true,
    },
    {
      title: 'Netflix TV Shows',
      req: { requestType: RequestType.NETFLIX, mediaType: MediaType.TV },
      visible: true,
    },
    {
      title: 'Disney+ TV Shows',
      req: { requestType: RequestType.DISNEY_PLUS_TV, mediaType: MediaType.TV },
      visible: true,
    },
    {
      title: 'Amazon Prime TV Shows',
      req: {
        requestType: RequestType.AMAZON_PRIME_TV,
        mediaType: MediaType.TV,
      },
      visible: true,
    },
    {
      title: 'HBO TV Shows',
      req: { requestType: RequestType.HBO_TV, mediaType: MediaType.TV },
      visible: true,
    },
    {
      title: 'Popular',
      req: {
        requestType: RequestType.TOP_RATED,
        mediaType: MediaType.TV,
        genre: GENRES.FAMILY,
      },
      visible: true,
    },
    {
      title: 'Comedy TV Shows',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.TV,
        genre: GENRES.COMEDY,
      },
      visible: true,
    },
    {
      title: 'Action TV Shows',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.TV,
        genre: GENRES.ACTION_ADVENTURE,
      },
      visible: true,
    },
    {
      title: 'Drama TV Shows',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.TV,
        genre: GENRES.DRAMA,
      },
      visible: true,
    },
    {
      title: 'Scary TV Shows',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.TV,
        genre: GENRES.THRILLER,
      },
      visible: true,
    },
    {
      title: 'Indian TV Shows - Netflix',
      req: {
        requestType: RequestType.INDIAN_TV_NETFLIX,
        mediaType: MediaType.TV,
      },
      visible: true,
    },
    {
      title: 'Indian TV Shows - Amazon Prime Video',
      req: {
        requestType: RequestType.INDIAN_TV_AMAZON_PRIME,
        mediaType: MediaType.TV,
      },
      visible: true,
    },
    {
      title: 'Indian TV Shows - Disney+ Hotstar',
      req: {
        requestType: RequestType.INDIAN_TV_DISNEY_HOTSTAR,
        mediaType: MediaType.TV,
      },
      visible: true,
    },
  ];
  return await getShows(requests);
}
