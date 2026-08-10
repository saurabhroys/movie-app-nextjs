import ShowsPage, { type BrowsePageData } from '@/features/browse/shows-page';
import { enrichShowsWithLogos } from '@/features/browse/shows-page';
import { siteConfig } from '@/configs/site';
import {
  GENRES,
  MediaType,
  RequestType,
  type ShowRequest,
} from '@/services/tmdb/types';
import { getShows } from '@/services/tmdb/shows';

import { cacheLife } from 'next/cache';
import { connection } from 'next/server';

export default async function Home() {
  await connection();
  const h1 = `${siteConfig.name} Home`;
  const data = await getHomeData();

  return (
    <>
      <h1 className="hidden">{h1}</h1>
      <ShowsPage data={data} />
    </>
  );
}

async function getHomeData(): Promise<BrowsePageData> {
  'use cache';
  cacheLife('hours');
  const requests: ShowRequest[] = [
    {
      title: 'Trending Now',
      req: { requestType: RequestType.TRENDING, mediaType: MediaType.ALL },
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
      title: 'Popular TV Shows',
      req: {
        requestType: RequestType.TOP_RATED,
        mediaType: MediaType.TV,
        genre: GENRES.TV_MOVIE,
      },
      visible: true,
    },
    {
      title: 'Latest Bollywood Movies',
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
    {
      title: 'Indian TV Shows - Amazon Prime Video',
      req: {
        requestType: RequestType.INDIAN_TV_AMAZON_PRIME,
        mediaType: MediaType.TV,
      },
      visible: true,
    },
    {
      title: 'Korean Movies',
      req: {
        requestType: RequestType.KOREAN,
        mediaType: MediaType.MOVIE,
        genre: GENRES.THRILLER,
      },
      visible: true,
    },
    {
      title: 'Comedy Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.COMEDY,
      },
      visible: true,
    },
    {
      title: 'Action Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.ACTION,
      },
      visible: true,
    },
    {
      title: 'Romance Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.ROMANCE,
      },
      visible: true,
    },
    {
      title: 'Scary Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.THRILLER,
      },
      visible: true,
    },
  ];

  return await enrichShowsWithLogos(await getShows(requests));
}
