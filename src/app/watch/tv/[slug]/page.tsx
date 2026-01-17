import React from 'react';
import RecommendedMovies from '@/components/recommended-movies';
import PlayerSelector from '@/components/watch/player-selector';
import ModalCloser from '@/components/modal-closer';
import SeasonsEpisodesSelector from '@/components/season';
import MovieService from '@/services/MovieService';
import { Show } from '@/types';
import TvWatchPage from './tv-watch-page';
import NotFound from '../../../../components/watch/not-found-redirect';
import { siteConfig } from '@/configs/site';

import { cacheLife } from 'next/cache'; // siteConfig

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const id = params.slug.split('-').pop();
  const tvId = id ? parseInt(id) : 0;

  return <CachedTvPage tvId={tvId} slugId={id || ''} />;
}

async function CachedTvPage({ tvId, slugId }: { tvId: number; slugId: string }) {
  'use cache';
  cacheLife('show');

  // Fetch TV show details and recommended TV shows
  let tvShow: Show | null = null;
  let recommendedShows: Show[] = [];
  let seasons: any[] = [];

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
            .filter((response) => response.status === 'fulfilled')
            .map(
              (response) =>
                (response as PromiseFulfilledResult<any>).value.data,
            );
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch TV show data:', error);
  }

  return (
    <div className="min-h-screen w-screen bg-black pt-5">
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
