import ShowsPage, { type BrowsePageData } from '@/features/browse/shows-page';
import { enrichShowsWithLogos } from '@/features/browse/shows-page';
import { siteConfig } from '@/configs/site';
import { RequestType, MediaType, type ShowRequest } from '@/services/tmdb/types';
import { getShows } from '@/services/tmdb/shows';

import { cacheLife } from 'next/cache';
import { connection } from 'next/server';

export default async function SportsPage() {
  await connection();
  const h1 = `${siteConfig.name} Sports`;
  const data = await getSportsData();
  return (
    <>
      <h1 className="hidden">{h1}</h1>
      <ShowsPage data={data} />
    </>
  );
}

async function getSportsData(): Promise<BrowsePageData> {
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
  return await enrichShowsWithLogos(await getShows(requests));
}
