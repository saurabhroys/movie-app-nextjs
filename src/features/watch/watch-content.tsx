import MovieService from '@/services/tmdb/movie.service';
import { type Show, type Season } from '@/services/tmdb/types';
import NotFound from '@/features/watch/not-found-redirect';
import { redirect } from 'next/navigation';
import { type AxiosResponse } from 'axios';
import WatchClientPage from '@/features/watch/watch-client-page';

interface WatchContentProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; season?: string; episode?: string }>;
}

export default async function WatchContent({
  params,
  searchParams,
}: WatchContentProps) {
  const [{ slug }, { type: typeParam, season, episode }] = await Promise.all([
    params,
    searchParams,
  ]);

  const type = typeParam || 'movie';
  const id = slug.split('-').pop();
  const mediaId = id ? parseInt(id) : 0;

  if (mediaId <= 0) {
    return <NotFound />;
  }

  let showDetails: Show | null = null;
  let recommendedShows: Show[] = [];
  let seasons: Season[] = [];
  let redirectTo: string | null = null;

  try {
    if (type === 'movie') {
      const [showResponse, recommendations] = await Promise.allSettled([
        MovieService.findMovie(mediaId),
        MovieService.getMovieRecommendations(mediaId),
      ]);

      if (showResponse.status === 'fulfilled') {
        showDetails = showResponse.value.data;
        recommendedShows =
          recommendations.status === 'fulfilled'
            ? recommendations.value.results || []
            : [];
      } else {
        const tvResponse = await MovieService.findTvSeries(mediaId);
        if (tvResponse?.data) {
          // Set the redirect target here, but redirect AFTER the try/catch below —
          // `redirect()` throws internally, so calling it inside a try/catch
          // swallows the NEXT_REDIRECT error and breaks the navigation.
          redirectTo = `/watch/${slug}?type=tv`;
        }
      }
    } else {
      const [showResponse, recommendations] = await Promise.allSettled([
        MovieService.findTvSeries(mediaId),
        MovieService.getTvRecommendations(mediaId),
      ]);

      if (showResponse.status === 'fulfilled') {
        showDetails = showResponse.value.data;
        recommendedShows =
          recommendations.status === 'fulfilled'
            ? recommendations.value.results || []
            : [];

        if (showDetails) {
          const numSeasons = showDetails.number_of_seasons || 1;
          const seasonPromises = [] as Promise<AxiosResponse<Season>>[];
          const maxSeasons =
            type === 'anime' ? Math.min(numSeasons, 10) : numSeasons;
          for (let i = 1; i <= maxSeasons; i++) {
            seasonPromises.push(MovieService.getSeasons(mediaId, i));
          }
          const seasonResponses = await Promise.allSettled(seasonPromises);
          seasons = seasonResponses
            .filter(
              (r): r is PromiseFulfilledResult<AxiosResponse<Season>> =>
                r.status === 'fulfilled',
            )
            .map((r) => r.value.data);
        }
      } else {
        const movieResponse = await MovieService.findMovie(mediaId);
        if (movieResponse?.data) {
          redirectTo = `/watch/${slug}?type=movie`;
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch media details:', error);
  }

  // Perform any type-correction redirect outside try/catch so the
  // NEXT_REDIRECT error thrown by `redirect()` propagates correctly.
  if (redirectTo) {
    redirect(redirectTo);
  }

  if (!showDetails) {
    return <NotFound />;
  }

  const imdbId =
    type === 'movie'
      ? showDetails.imdb_id
      : showDetails.external_ids?.imdb_id;

  return (
    <WatchClientPage
      showDetails={showDetails}
      recommendedShows={recommendedShows}
      seasons={seasons}
      mediaId={slug}
      mediaType={type as 'movie' | 'tv' | 'anime'}
      imdbId={imdbId || undefined}
      initialSeason={Number(season) || 1}
      initialEpisode={Number(episode) || 1}
    />
  );
}
