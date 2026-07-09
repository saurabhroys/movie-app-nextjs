'use client';
import React from 'react';
import RecommendedMovies from '@/components/recommended-movies';
import PlayerSelector from '@/components/watch/player-selector';
import ModalCloser from '@/components/modal-closer';
import MovieService from '@/services/MovieService';
import { type Show, MediaType } from '@/types';
import { RequestType } from '@/enums/request-type';
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
          const currentMovie = res.data;
          setMovie(currentMovie);
          // Movie exists, fetch recommendations
          return Promise.all([
            currentMovie,
            MovieService.getMovieRecommendations(mediaId)
          ]);
        })
        .then(async ([currentMovie, recommendations]) => {
          let recs = recommendations.results || [];
          const isSouthIndian = ['te', 'ta', 'ml', 'kn'].includes(currentMovie.original_language || '');
          
          if (recs.length === 0 || isSouthIndian) {
            try {
              const southIndianData = await MovieService.getShows([
                {
                  title: 'South Indian Movies',
                  req: {
                    requestType: RequestType.SOUTH_INDIAN,
                    mediaType: MediaType.MOVIE,
                    isLatest: true,
                  },
                  visible: true,
                }
              ]);
              const southIndianShows = southIndianData[0]?.shows || [];
              const filteredShows = southIndianShows.filter((show) => show.id !== mediaId);
              
              if (recs.length === 0) {
                recs = filteredShows;
              } else {
                const combined = [...filteredShows, ...recs];
                const seenIds = new Set();
                recs = combined.filter((show) => {
                  if (seenIds.has(show.id)) return false;
                  seenIds.add(show.id);
                  return true;
                });
              }
            } catch (err) {
              console.error('Failed to fetch South Indian movie suggestions:', err);
            }
          }
          setRecommendedMovies(recs);
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

  return (
    <div className="relative min-h-screen bg-black">
      <ModalCloser />


      {/* Server Selector */}
      <div id="servers">
        <PlayerSelector
          mediaId={id || ''}
          mediaType="movie"
          selectorClass="h-80 md:h-screen"
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
