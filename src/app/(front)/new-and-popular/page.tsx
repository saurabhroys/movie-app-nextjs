import Hero from '@/components/hero';
import ShowsContainer from '@/components/shows-container';
import { siteConfig } from '@/configs/site';
import { RequestType, type ShowRequest } from '@/enums/request-type';
import { getRandomShow } from '@/lib/utils';
import MovieService from '@/services/MovieService';
import { MediaType, type Show } from '@/types';
import { type Metadata } from 'next';

import { cacheLife } from 'next/cache';
import { connection } from 'next/server';

export const metadata: Metadata = {
  title: 'New & Popular',
  description: `Discover new and popular movies and TV shows on ${siteConfig.name}. Browse trending content, top-rated shows, and latest releases.`,
};

export default async function NewAndPopularPage() {
  await connection();
  const h1 = `${siteConfig.name} New And Popular`;
  const categorizedShows = await getNewAndPopularData();
  const randomShow: Show | null = getRandomShow(categorizedShows);

  return (
    <>
      <h1 className="hidden">{h1}</h1>
      <Hero randomShow={randomShow} />
      <ShowsContainer shows={categorizedShows} />
    </>
  );
}

async function getNewAndPopularData() {
  'use cache';
  cacheLife('show');
  const requests: ShowRequest[] = [
    {
      title: 'Trending TV Shows',
      req: { requestType: RequestType.TRENDING, mediaType: MediaType.TV },
      visible: true,
    },
    {
      title: 'Trending Movies',
      req: { requestType: RequestType.TRENDING, mediaType: MediaType.MOVIE },
      visible: true,
    },
    {
      title: 'Top Rated TV Shows',
      req: { requestType: RequestType.TOP_RATED, mediaType: MediaType.TV },
      visible: true,
    },
    {
      title: 'Top Rated Movies',
      req: { requestType: RequestType.TOP_RATED, mediaType: MediaType.MOVIE },
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
      title: 'Indian Movies',
      req: {
        requestType: RequestType.INDIAN_MOVIES,
        mediaType: MediaType.MOVIE,
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

  return await MovieService.getShows(requests);
}
