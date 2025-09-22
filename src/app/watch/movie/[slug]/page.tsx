import React from 'react';
import EmbedPlayer from '@/components/watch/embed-player';
import RecommendedMovies from '@/components/recommended-movies';
import PlayerSelector from '@/components/watch/player-selector';
import ModalCloser from '@/components/modal-closer';
import MovieService from '@/services/MovieService';
import { Show } from '@/types';

export const revalidate = 3600;

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const id = params.slug.split('-').pop();
  const mediaId = id ? parseInt(id) : 0;
  
  // Fetch recommended movies
  let recommendedMovies: Show[] = [];
  try {
    if (mediaId > 0) {
      const recommendations = await MovieService.getMovieRecommendations(mediaId);
      recommendedMovies = recommendations.results || [];
    }
  } catch (error) {
    console.error('Failed to fetch recommended movies:', error);
  }

  return (
    <div className="min-h-screen bg-black">
      <ModalCloser />
      {/* Main Player */}
        {/* <EmbedPlayer url={`https://player.autoembed.cc/embed/movie/${id}?server=2`} /> */}
        <PlayerSelector mediaId={id || ''} mediaType="movie" selectorClass='h-screen' playerClass='' />

      {/* Alternative Players */}

      {/* Recommended Movies */}
      <div className="bg-gradient-to-t from-black via-black/80 to-transparent relative z-10">
        <RecommendedMovies 
          shows={recommendedMovies} 
          title="More like this" 
        />
      </div>
    </div>
  );
}
