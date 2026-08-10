import ShowsPage, { type BrowsePageData } from '@/features/browse/shows-page';
import { enrichShowsWithLogos } from '@/features/browse/shows-page';
import { siteConfig } from '@/configs/site';
import { RequestType, MediaType, type ShowRequest, type Show } from '@/services/tmdb/types';
import { getShows } from '@/services/tmdb/shows';
import { type Metadata } from 'next';

import { cacheLife } from 'next/cache';
import { connection } from 'next/server';

export const metadata: Metadata = {
  title: 'Anime',
  description: `Watch the latest anime TV shows and movies on ${siteConfig.name}. Discover trending anime, top-rated series, and anime by streaming platform.`,
};

export default async function AnimePage() {
  await connection();
  const h1 = `${siteConfig.name} Anime`;
  const data = await getAnimeData();

  return (
    <>
      <h1 className="hidden">{h1}</h1>
      <ShowsPage data={data} />
    </>
  );
}

async function getAnimeData(): Promise<BrowsePageData> {
  'use cache';
  cacheLife('hours');
  const requests: ShowRequest[] = [
    {
      title: 'Anime TV Shows Latest',
      req: { requestType: RequestType.ANIME_LATEST, mediaType: MediaType.TV },
      visible: true,
    },
    {
      title: 'Anime TV Shows Trending',
      req: {
        requestType: RequestType.ANIME_TRENDING,
        mediaType: MediaType.TV,
      },
      visible: true,
    },
    {
      title: 'Anime TV Shows Top Rated',
      req: {
        requestType: RequestType.ANIME_TOP_RATED,
        mediaType: MediaType.TV,
      },
      visible: true,
    },
    {
      title: 'Netflix Anime TV Shows',
      req: { requestType: RequestType.ANIME_NETFLIX, mediaType: MediaType.TV },
      visible: true,
    },
    {
      title: 'Anime Movies Latest',
      req: {
        requestType: RequestType.ANIME_LATEST,
        mediaType: MediaType.MOVIE,
      },
      visible: true,
    },
    {
      title: 'Anime Movies Top Rated',
      req: {
        requestType: RequestType.ANIME_TOP_RATED,
        mediaType: MediaType.MOVIE,
      },
      visible: true,
    },
  ];
  const fetchedShows = await getShows(requests);
  // Fix media_type per show so fetchLogoPaths hits the correct /images endpoint
  const categorizedShows = fetchedShows.map((category, idx) => ({
    ...category,
    shows: category.shows.map((show: Show) => ({
      ...show,
      media_type: requests[idx].title.includes('Movies')
        ? MediaType.MOVIE
        : MediaType.TV,
    })),
  }));
  return enrichShowsWithLogos(categorizedShows);
}
