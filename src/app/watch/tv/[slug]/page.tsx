import React from 'react';
import ModalCloser from '@/components/modal-closer';
import MovieService from '@/services/MovieService';
import { type Show, type ISeason } from '@/types';
import TvWatchPage from './tv-watch-page';
import NotFound from '../../../../components/watch/not-found-redirect';
import { redirect } from 'next/navigation';
import { type AxiosResponse } from 'axios';

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const id = params.slug.split('-').pop();
  const tvId = id ? parseInt(id) : 0;

  return <CachedTvPage tvId={tvId} slugId={id || ''} />;
}

async function CachedTvPage({ tvId, slugId }: { tvId: number; slugId: string }) {
  // Fetch TV show details and recommended TV shows
  let tvShow: Show | null = null;
  let recommendedShows: Show[] = [];
  let seasons: ISeason[] = [];
  let shouldRedirect = false;

  try {
    if (tvId > 0) {
      const [tvShowResponse, recommendations] = await Promise.allSettled([
        MovieService.findTvSeries(tvId),
        MovieService.getTvRecommendations(tvId),
      ]);

      if (tvShowResponse.status === 'fulfilled') {
        tvShow = tvShowResponse.value.data;
        recommendedShows =
          recommendations.status === 'fulfilled'
            ? recommendations.value.results || []
            : [];

        // Fetch seasons data
        if (tvShow.seasons?.length) {
          const seasonPromises = tvShow.seasons.map((season) =>
            MovieService.getSeasons(tvId, season.season_number)
          );
          
          const seasonResponses = await Promise.allSettled(seasonPromises);
          seasons = seasonResponses
            .filter((response): response is PromiseFulfilledResult<AxiosResponse<ISeason>> => response.status === 'fulfilled')
            .map(
              (response) =>
                response.value.data,
            );
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch TV show data:', error);
  }

  if (!tvShow && tvId > 0) {
    try {
      const movieResponse = await MovieService.findMovie(tvId);
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
      {tvShow ? (
        <TvWatchPage
          tvShow={tvShow}
          seasons={seasons.length > 0 ? seasons : (tvShow.seasons || []).map(s => ({...s, episodes: []}))}
          tvId={tvId}
          mediaId={slugId}
          recommendedShows={recommendedShows}
        />
      ) : (
        <NotFound />
      )}
    </div>
  );
}
