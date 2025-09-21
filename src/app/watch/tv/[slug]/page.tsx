import React from 'react';
import RecommendedMovies from '@/components/recommended-movies';
import PlayerSelector from '@/components/watch/player-selector';
import ModalCloser from '@/components/modal-closer';
import MovieService from '@/services/MovieService';
import { Show } from '@/types';

export const revalidate = 3600;

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const id = params.slug.split('-').pop();
  const tvId = id ? parseInt(id) : 0;
  
  // Fetch recommended TV shows
  let recommendedShows: Show[] = [];
  try {
    if (tvId > 0) {
      const recommendations = await MovieService.getTvRecommendations(tvId);
      recommendedShows = recommendations.results || [];
    }
  } catch (error) {
    console.error('Failed to fetch recommended TV shows:', error);
  }

  return (
    <div className="min-h-screen bg-black">
      <ModalCloser />
      {/* Player Selector with Multiple Options */}
      <PlayerSelector movieId={id || ''} mediaType="tv" />

      {/* Recommended Movies */}
      <div className="bg-gradient-to-t from-black via-black/80 to-transparent mt-10 relative z-10">
        <RecommendedMovies 
          shows={recommendedShows} 
          title="More like this" 
        />
      </div>
    </div>
  );
}
