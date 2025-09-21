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
  const movieId: string | undefined = params.slug.split('/').pop();
  const animeId = id ? parseInt(id) : 0;
  
  // Fetch recommended anime/TV shows
  let recommendedShows: Show[] = [];
  try {
    if (animeId > 0) {
      const recommendations = await MovieService.getTvRecommendations(animeId);
      recommendedShows = recommendations.results || [];
    }
  } catch (error) {
    console.error('Failed to fetch recommended anime:', error);
  }

  return (
    <div className="min-h-screen bg-black">
      <ModalCloser />
      {/* Player Selector with Multiple Options */}
      <PlayerSelector movieId={id || ''} mediaType="anime" />

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
