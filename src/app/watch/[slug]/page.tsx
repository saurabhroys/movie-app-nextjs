import React from 'react';
import ModalCloser from '@/components/modal-closer';
import MovieService from '@/services/MovieService';
import { type Show, type ISeason } from '@/types';
import NotFound from '@/components/watch/not-found-redirect';
import { redirect } from 'next/navigation';
import { type AxiosResponse } from 'axios';
import WatchClientPage from './watch-client-page';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; season?: string; episode?: string }>;
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const type = searchParams.type || 'movie';
  const id = params.slug.split('-').pop();
  const mediaId = id ? parseInt(id) : 0;

  if (mediaId <= 0) {
    return <NotFound />;
  }

  let showDetails: Show | null = null;
  let recommendedShows: Show[] = [];
  let seasons: ISeason[] = [];

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
        // Fallback check
        try {
          const tvResponse = await MovieService.findTvSeries(mediaId);
          if (tvResponse?.data) {
            redirect(`/watch/${params.slug}?type=tv`);
          }
        } catch {}
      }
    } else {
      // type === 'tv' or 'anime'
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
          const seasonPromises = [] as Promise<AxiosResponse<ISeason>>[];
          const maxSeasons = type === 'anime' ? Math.min(numSeasons, 10) : numSeasons;
          for (let i = 1; i <= maxSeasons; i++) {
            seasonPromises.push(MovieService.getSeasons(mediaId, i));
          }
          const seasonResponses = await Promise.allSettled(seasonPromises);
          seasons = seasonResponses
            .filter((r): r is PromiseFulfilledResult<AxiosResponse<ISeason>> => r.status === 'fulfilled')
            .map((r) => r.value.data);
        }
      } else {
        // Fallback check
        try {
          const movieResponse = await MovieService.findMovie(mediaId);
          if (movieResponse?.data) {
            redirect(`/watch/${params.slug}?type=movie`);
          }
        } catch {}
      }
    }
  } catch (error) {
    console.error('Failed to fetch media details:', error);
  }

  if (!showDetails) {
    return (
      <div className="min-h-screen w-screen bg-black">
        <ModalCloser />
        <NotFound />
      </div>
    );
  }

  const imdbId = type === 'movie'
    ? showDetails.imdb_id
    : showDetails.external_ids?.imdb_id;

  return (
    <div className="min-h-screen w-screen bg-black">
      <ModalCloser />
      <WatchClientPage
        showDetails={showDetails}
        recommendedShows={recommendedShows}
        seasons={seasons}
        mediaId={params.slug}
        mediaType={type as 'movie' | 'tv' | 'anime'}
        imdbId={imdbId || undefined}
        initialSeason={Number(searchParams.season) || 1}
        initialEpisode={Number(searchParams.episode) || 1}
      />
    </div>
  );
}
