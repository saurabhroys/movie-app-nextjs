'use client';
import React from 'react';
import EmbedPlayer from '@/components/watch/embed-player';
import RecommendedMovies from '@/components/recommended-movies';
import PlayerSelector from '@/components/watch/player-selector';
import ModalCloser from '@/components/modal-closer';
import MovieService from '@/services/MovieService';
import { Show } from '@/types';
import { useRouter } from 'next/navigation';
import WatchSkeleton from '@/components/watch/watch-skeleton';

export default function Page(props: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [recommendedMovies, setRecommendedMovies] = React.useState<Show[]>([]);
  const [movie, setMovie] = React.useState<Show | null>(null);
  const [isRecommendationsLoading, setIsRecommendationsLoading] =
    React.useState<boolean>(true);
  const [params, setParams] = React.useState<{ slug: string } | null>(null);

  // Initialize params
  React.useEffect(() => {
    props.params.then(setParams);
  }, [props.params]);

  // Fetch recommended movies with safety redirection check
  React.useEffect(() => {
    if (!params) return;
    const id = params.slug.split('-').pop();
    const mediaId = id ? parseInt(id) : 0;

    if (mediaId > 0) {
      setIsRecommendationsLoading(true);
      MovieService.findMovie(mediaId)
        .then((res) => {
          setMovie(res.data);
          // Movie exists, fetch recommendations
          return MovieService.getMovieRecommendations(mediaId);
        })
        .then((recommendations) => {
          setRecommendedMovies(recommendations.results || []);
        })
        .catch((error) => {
          if (error?.response?.status === 404) {
            // Check if it's a TV show
            MovieService.findTvSeries(mediaId)
              .then(() => {
                // It is a TV show! Redirect to TV watch page
                router.replace(`/watch/tv/${params.slug}`);
              })
              .catch(() => {
                console.error('Show not found on either movie or TV endpoints');
              });
          } else {
            console.error('Failed to fetch movie data:', error);
          }
        })
        .finally(() => {
          setIsRecommendationsLoading(false);
        });
    }
  }, [params, router]);

  if (!params || !movie) return <WatchSkeleton />;

  const id = params.slug.split('-').pop();
  const mediaId = id ? parseInt(id) : 0;

  return (
    <div className="relative min-h-screen bg-black">
      <ModalCloser />


      {/* Server Selector */}
      <div id="servers">
        <PlayerSelector
          mediaId={id || ''}
          mediaType="movie"
          selectorClass="h-screen"
          playerClass=""
          title={movie?.title || movie?.name || ''}
        />
      </div>

      {/* Alternative Players */}

      {/* Recommended Movies */}
      <div className="relative z-10 bg-linear-to-t from-black via-black/80 to-transparent">
        <RecommendedMovies
          shows={recommendedMovies}
          title="More like this"
          loading={isRecommendationsLoading}
        />
      </div>
    </div>
  );
}
