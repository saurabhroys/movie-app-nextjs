import Hero from '@/components/hero';
import ShowsContainer from '@/components/shows-container';
import { MediaType, type Show } from '@/types';
import { siteConfig } from '@/configs/site';
import { RequestType, type ShowRequest } from '@/enums/request-type';
import MovieService from '@/services/MovieService';
import { Genre } from '@/enums/genre';
import { getRandomShow } from '@/lib/utils';

import { cacheLife } from 'next/cache';
import { connection } from 'next/server';

export default async function Home() {
  await connection();
  const h1 = `${siteConfig.name} Home`;
  const categorizedShows = await getHomeData();

  // Flatten for random show selection
  const randomShow: Show | null = getRandomShow(categorizedShows);

  return (
    <>
      <h1 className="hidden">{h1}</h1>
      <Hero randomShow={randomShow} />
      <ShowsContainer shows={categorizedShows} />
    </>
  );
}

async function getHomeData() {
  'use cache';
  cacheLife('show');
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
        genre: Genre.TV_MOVIE,
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
        genre: Genre.THRILLER,
      },
      visible: true,
    },
    {
      title: 'Comedy Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: Genre.COMEDY,
      },
      visible: true,
    },
    {
      title: 'Action Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: Genre.ACTION,
      },
      visible: true,
    },
    {
      title: 'Romance Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: Genre.ROMANCE,
      },
      visible: true,
    },
    {
      title: 'Scary Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: Genre.THRILLER,
      },
      visible: true,
    },
  ];

  return await MovieService.getShows(requests);
}
