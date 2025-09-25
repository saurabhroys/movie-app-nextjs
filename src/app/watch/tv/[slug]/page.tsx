import React from 'react';
import RecommendedMovies from '@/components/recommended-movies';
import PlayerSelector from '@/components/watch/player-selector';
import ModalCloser from '@/components/modal-closer';
import SeasonsEpisodesSelector from '@/components/season';
import MovieService from '@/services/MovieService';
import { Show } from '@/types';
import TvWatchPage from './tv-watch-page';
import NotFound from '../../../../components/watch/not-found-redirect';

export const revalidate = 3600;

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const id = params.slug.split('-').pop();
  const tvId = id ? parseInt(id) : 0;
  
  // Fetch TV show details and recommended TV shows
  let tvShow: Show | null = null;
  let recommendedShows: Show[] = [];
  let seasons: any[] = [];
  
  try {
    if (tvId > 0) {
      const [tvShowResponse, recommendations] = await Promise.allSettled([
        MovieService.findTvSeries(tvId),
        MovieService.getTvRecommendations(tvId)
      ]);
      
      if (tvShowResponse.status === 'fulfilled') {
        tvShow = tvShowResponse.value.data;
        recommendedShows = recommendations.status === 'fulfilled' ? recommendations.value.results || [] : [];
        
        // Fetch seasons data
        if (tvShow.number_of_seasons) {
          const seasonPromises = [];
          for (let i = 1; i <= Math.min(tvShow.number_of_seasons, 10); i++) {
            seasonPromises.push(MovieService.getSeasons(tvId, i));
          }
          const seasonResponses = await Promise.allSettled(seasonPromises);
          seasons = seasonResponses
            .filter(response => response.status === 'fulfilled')
            .map(response => (response as PromiseFulfilledResult<any>).value.data);
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch TV show data:', error);
  }

  return (
    <div className="min-h-screen w-screen bg-black">
      <ModalCloser />
      {tvShow && seasons.length > 0 ? (
        <TvWatchPage 
          tvShow={tvShow}
          seasons={seasons}
          tvId={tvId}
          mediaId={id || ''}
          recommendedShows={recommendedShows}
        />
      ) : (
        <NotFound />
      )}
    </div>
  );
}
