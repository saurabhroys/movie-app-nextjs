'use client';
import React from 'react';
import EmbedPlayer from '@/components/watch/embed-player';
import RecommendedMovies from '@/components/recommended-movies';
import PlayerSelector from '@/components/watch/player-selector';
import ModalCloser from '@/components/modal-closer';
import MovieService from '@/services/MovieService';
import { Show } from '@/types';

export default function Page(props: { params: Promise<{ slug: string }> }) {
  const [showScrollHint, setShowScrollHint] = React.useState(true);
  const [recommendedMovies, setRecommendedMovies] = React.useState<Show[]>([]);
  const [params, setParams] = React.useState<{ slug: string } | null>(null);

  // Initialize params
  React.useEffect(() => {
    props.params.then(setParams);
  }, [props.params]);

  // Scroll to 70% on initial visit
  React.useEffect(() => {
    const scrollView = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const targetScroll = scrollHeight * 0.7;
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    };
    
    // Small delay to ensure page is fully rendered
    const timer = setTimeout(scrollView, 100);
    return () => clearTimeout(timer);
  }, []);

  // Hide scroll hint and scroll back to top after 30 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowScrollHint(false);
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch recommended movies
  React.useEffect(() => {
    if (!params) return;
    const id = params.slug.split('-').pop();
    const mediaId = id ? parseInt(id) : 0;
    
    if (mediaId > 0) {
      MovieService.getMovieRecommendations(mediaId)
        .then(recommendations => {
          setRecommendedMovies(recommendations.results || []);
        })
        .catch(error => {
          console.error('Failed to fetch recommended movies:', error);
        });
    }
  }, [params]);

  if (!params) return null;
  
  const id = params.slug.split('-').pop();
  const mediaId = id ? parseInt(id) : 0;

  return (
    <div className="min-h-screen bg-black relative">
      <ModalCloser />
      {/* Main Player */}
      <div className="absolute w-full min-h-screen">
        {/* <EmbedPlayer url={`https://player.autoembed.cc/embed/movie/${id}?server=2`} /> */}
        {/* Scroll hint to choose server */}
        {showScrollHint && (
          <a
            href="#servers"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 text-neutral-400 hover:text-white transition-colors"
            aria-label="Scroll to choose server"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm text-center">
                {/* Choose Another Server 
                <br />  */}
                Scroll Down
                </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7 animate-bounce"
              >
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v12.19l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
            </div>
          </a>
        )}
      </div>

      {/* Server Selector */}
      <div id="servers">
        <PlayerSelector mediaId={id || ''} mediaType="movie" selectorClass='h-screen' playerClass='' />
      </div>

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
