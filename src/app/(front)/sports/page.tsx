import Hero from '@/features/browse/hero';
import ShowsContainer from '@/features/browse/shows-container';
import { siteConfig } from '@/configs/site';
import { RequestType, type ShowRequest } from '@/services/tmdb/types';
import { getRandomShow } from '@/lib/utils';
import { getShows } from '@/services/tmdb/shows';
import { MediaType, type Show } from '@/services/tmdb/types';

import { cacheLife } from 'next/cache';
import { connection } from 'next/server';

export default async function SportsPage() {
  await connection();
  const h1 = `${siteConfig.name} Sports`;
  const categorizedShows = await getSportsData();
  const randomShow: Show | null = getRandomShow(categorizedShows);
  return (
    <>
      <h1 className="hidden">{h1}</h1>
      <Hero randomShow={randomShow} />
      <ShowsContainer shows={categorizedShows} />
    </>
  );
}

async function getSportsData() {
  'use cache';
  cacheLife('hours');
  const requests: ShowRequest[] = [
    {
      title: 'Trending Now',
      req: { requestType: RequestType.TRENDING, mediaType: MediaType.MOVIE },
      visible: true,
    },
    {
      title: 'Netflix Movies',
      req: { requestType: RequestType.NETFLIX, mediaType: MediaType.MOVIE },
      visible: true,
    },
    {
      title: 'Popular',
      req: { requestType: RequestType.POPULAR, mediaType: MediaType.MOVIE },
      visible: true,
    },
  ];
  return await getShows(requests);
}
