import React from 'react';
import ModalCloser from '@/components/modal-closer';
import MovieService from '@/services/MovieService';
import { type Show, type ISeason } from '@/types';
import AnimeWatchPage from './anime-watch-page';
import NotFound from '@/components/watch/not-found-redirect';
import { redirect } from 'next/navigation';
import { type AxiosResponse } from 'axios';

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const id = params.slug.split('-').pop();
  const animeId = id ? parseInt(id) : 0;

  return <CachedAnimePage animeId={animeId} slugId={id || ''} />;
}

async function CachedAnimePage({
  animeId,
  slugId,
}: {
  animeId: number;
  slugId: string;
}) {
  // Fetch anime (tv) show details, seasons and recommendations
  let tvShow: Show | null = null;
  let recommendedShows: Show[] = [];
  let seasons: ISeason[] = [];
  let shouldRedirect = false;

  try {
    if (animeId > 0) {
      const [tvShowResponse, recommendations] = await Promise.allSettled([
        MovieService.findTvSeries(animeId),
        MovieService.getTvRecommendations(animeId),
      ]);

      if (tvShowResponse.status === 'fulfilled') {
        tvShow = tvShowResponse.value.data;
        recommendedShows =
          recommendations.status === 'fulfilled'
            ? recommendations.value.results || []
            : [];

        if (tvShow.number_of_seasons) {
          const seasonPromises = [] as Promise<AxiosResponse<ISeason>>[];
          for (let i = 1; i <= Math.min(tvShow.number_of_seasons, 10); i++) {
            seasonPromises.push(MovieService.getSeasons(animeId, i));
          }
          const seasonResponses = await Promise.allSettled(seasonPromises);
          seasons = seasonResponses
            .filter((r): r is PromiseFulfilledResult<AxiosResponse<ISeason>> => r.status === 'fulfilled')
            .map((r) => r.value.data);
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch recommended anime:', error);
  }

  if (!tvShow && animeId > 0) {
    try {
      const movieResponse = await MovieService.findMovie(animeId);
      if (movieResponse?.data) {
        shouldRedirect = true;
      }
    } catch {
      // not a movie
    }
  }

  if (shouldRedirect) {
    redirect(`/watch/movie/${slugId}`);
  }

  return (
    <div className="min-h-screen w-screen bg-black">
      <ModalCloser />
      {tvShow && seasons.length > 0 ? (
        <AnimeWatchPage
          tvShow={tvShow}
          seasons={seasons}
          tvId={animeId}
          mediaId={slugId}
          recommendedShows={recommendedShows}
        />
      ) : (
        <NotFound />
      )}
    </div>
  );
}
