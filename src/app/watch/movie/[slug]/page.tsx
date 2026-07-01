'use client';
import React from 'react';
import EmbedPlayer from '@/components/watch/embed-player';
import RecommendedMovies from '@/components/recommended-movies';
import PlayerSelector from '@/components/watch/player-selector';
import ModalCloser from '@/components/modal-closer';
import MovieService from '@/services/MovieService';
import { Show } from '@/types';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';

export default function Page(props: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [showScrollHint, setShowScrollHint] = React.useState(true);
  const [showScrollHintBackdrop, setShowScrollHintBackdrop] =
    React.useState(true);
  const [recommendedMovies, setRecommendedMovies] = React.useState<Show[]>([]);
  const [movie, setMovie] = React.useState<Show | null>(null);
  const [isRecommendationsLoading, setIsRecommendationsLoading] =
    React.useState<boolean>(true);
  const [params, setParams] = React.useState<{ slug: string } | null>(null);
  const [serverRecommendationEnabled, setServerRecommendationEnabled] =
    React.useState<boolean>(true);

  // Initialize params
  React.useEffect(() => {
    props.params.then(setParams);
  }, [props.params]);


  const timeOutTimer = 8000;
  const scrollDuration = 1000;

  // Initialize server recommendation flag from localStorage (default true on first visit)
  React.useEffect(() => {
    try {
      const key = 'serverRecommandationSystem';
      const stored =
        typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (stored === null) {
        window.localStorage.setItem(key, 'true');
        setServerRecommendationEnabled(true);
      } else {
        const enabled = stored === 'true';
        setServerRecommendationEnabled(enabled);
        if (!enabled) {
          setShowScrollHint(false);
          setShowScrollHintBackdrop(false);
        }
      }
    } catch {
      // If localStorage fails, keep default true
      setServerRecommendationEnabled(true);
    }
  }, []);



  React.useEffect(() => {
    if (!serverRecommendationEnabled) return;
    const timer = setTimeout(() => {
      setShowScrollHint(false);
    }, timeOutTimer);
    return () => clearTimeout(timer);
  }, [serverRecommendationEnabled]);

  React.useEffect(() => {
    if (!serverRecommendationEnabled) return;
    const timer = setTimeout(() => {
      setShowScrollHintBackdrop(false);
    }, timeOutTimer);
    return () => clearTimeout(timer);
  }, [serverRecommendationEnabled]);

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

  if (!params) return null;

  const id = params.slug.split('-').pop();
  const mediaId = id ? parseInt(id) : 0;

  return (
    <div className="relative min-h-screen bg-black">
      <ModalCloser />
      {/* Main Player */}
      <div
        className={`absolute z-10 min-h-screen w-full pointer-events-none ${serverRecommendationEnabled ? 'block' : 'hidden'}`}>
        {/* <EmbedPlayer url={`https://player.autoembed.cc/embed/movie/${id}?server=2`} /> */}
        {/* Scroll hint to choose server */}
        {serverRecommendationEnabled && showScrollHint && (
          <div
            className={`h-screen place-content-center justify-center text-center`}>
            <div className="mx-auto flex items-center justify-center space-x-2 pointer-events-auto">
              <div className="flex items-center justify-center gap-3 rounded-xl border bg-neutral-800/80 p-4 backdrop-blur-md">
                <Switch
                  id="airplane-mode"
                  checked={serverRecommendationEnabled}
                  onCheckedChange={(checked) => {
                    try {
                      window.localStorage.setItem(
                        'serverRecommandationSystem',
                        String(checked),
                      );
                    } catch {}
                    setServerRecommendationEnabled(checked);
                    if (!checked) {
                      setShowScrollHint(false);
                      setShowScrollHintBackdrop(false);
                      window.scrollTo({ top: 0 });
                    }
                  }}
                />
                <Label htmlFor="airplane-mode">
                  Turn Off Scroll Down Suggestion
                </Label>
              </div>
            </div>

            <h1
              className={`mb-10 text-3xl text-neutral-50/80 hover:text-white/80`}>
              Multiple Streaming Server Available
            </h1>
            <a
              href="#servers"
              className="mt-5 text-neutral-50/80 transition-colors hover:text-white/80"
              aria-label="Scroll to choose server">
              <div className="flex flex-col items-center gap-1">
                <span className="text-center text-3xl">
                  {/* Choose Another Server 
                    <br />  */}
                  Scroll Down
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-10 w-10 animate-bounce">
                  <path
                    fillRule="evenodd"
                    d="M12 3.75a.75.75 0 01.75.75v12.19l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V4.5a.75.75 0 01.75-.75z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </a>
          </div>
        )}
        {serverRecommendationEnabled && showScrollHint && (
          <a
            href="#servers"
            className="absolute -bottom-1 left-1/2 z-20 -translate-x-1/2 text-neutral-50 transition-colors hover:text-white/80"
            aria-label="Scroll to choose server">
            <div className="flex flex-col items-center gap-1">
              <span className="text-center text-sm">
                {/* Choose Another Server 
                <br />  */}
                Scroll Down
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7 animate-bounce">
                <path
                  fillRule="evenodd"
                  d="M12 3.75a.75.75 0 01.75.75v12.19l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V4.5a.75.75 0 01.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </a>
        )}
      </div>

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
