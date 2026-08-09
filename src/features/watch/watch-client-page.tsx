'use client';

import React, { useState } from 'react';
import RecommendedMovies from '@/components/recommended-movies';
import PlayerSelector from '@/components/watch/player-selector';
import SeasonsEpisodesSelector from '@/components/season';
import type { Show, ISeason } from '@/types';
import { useSearchParams, useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';

interface WatchClientPageProps {
  showDetails: Show;
  seasons: ISeason[];
  mediaId: string;
  mediaType: 'movie' | 'tv' | 'anime';
  imdbId?: string;
  initialSeason: number;
  initialEpisode: number;
  recommendedShows: Show[];
}

export default function WatchClientPage({
  showDetails,
  seasons,
  mediaId,
  mediaType,
  imdbId,
  initialSeason,
  initialEpisode,
  recommendedShows,
}: WatchClientPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(initialEpisode);
  const [activePlayerId, setActivePlayerId] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Sync IMDb ID into URL search parameters
  React.useEffect(() => {
    if (imdbId && !searchParams.get('imdb')) {
      const params = new URLSearchParams(window.location.search);
      params.set('imdb', imdbId);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [imdbId, searchParams, router]);

  // Sync state when URL params change (e.g. back button / navigation)
  React.useEffect(() => {
    const seasonParam = searchParams.get('season');
    const episodeParam = searchParams.get('episode');
    if (seasonParam) setSelectedSeason(Number(seasonParam));
    if (episodeParam) setSelectedEpisode(Number(episodeParam));
  }, [searchParams]);

  React.useEffect(() => {
    const isZxc = activePlayerId.includes('zxcstream') && activePlayerId !== 'vidify-fallback';
    setIsDrawerOpen(!isZxc);
  }, [activePlayerId]);

  const handleSeasonEpisodeChange = (season: number, episode: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(episode);

    const params = new URLSearchParams(window.location.search);
    params.set('season', season.toString());
    params.set('episode', episode.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const idOnly = mediaId.split('-').pop() || mediaId;

  if (mediaType === 'movie') {
    return (
      <div className="relative min-h-screen bg-black">
        <div id="servers">
          <PlayerSelector
            mediaId={idOnly}
            mediaType="movie"
            imdbId={imdbId}
            selectorClass="h-80 md:h-screen"
            playerClass=""
            title={showDetails.title || showDetails.name || ''}
            onPlayerChange={setActivePlayerId}
          />
        </div>

        <div className="relative z-10 bg-linear-to-t from-black via-black/80 to-transparent">
          <RecommendedMovies shows={recommendedShows} title="More like this" />
        </div>
      </div>
    );
  }

  if (mediaType === 'anime') {
    return (
      <div className="relative min-h-screen bg-black pt-4 md:pt-8">
        <div className="flex w-full grid-cols-17 flex-col gap-3 md:grid">
          <div className="w-full md:col-span-12 md:ml-2">
            <PlayerSelector
              mediaId={idOnly}
              mediaType="anime"
              imdbId={imdbId}
              playerClass="rounded-xl border border-neutral-700 p-px"
              selectorClass="h-80 md:h-160"
              season={selectedSeason}
              episode={selectedEpisode}
              title={showDetails.name || showDetails.title || ''}
              onPlayerChange={setActivePlayerId}
            />
          </div>

          <div className="mt-3 h-140 w-full rounded-xl border border-neutral-700 p-1 pt-2 md:col-span-5 md:mt-0 md:mr-2 md:h-160">
            <div className="flex h-full flex-col">
              <SeasonsEpisodesSelector
                tvShow={showDetails}
                seasons={seasons}
                tvId={Number(idOnly)}
                onSeasonEpisodeChange={handleSeasonEpisodeChange}
                selectedSeason={selectedSeason}
                selectedEpisode={selectedEpisode}
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-10 bg-linear-to-t from-black via-black/80 to-transparent">
          <RecommendedMovies shows={recommendedShows} title="More like this" />
        </div>
      </div>
    );
  }

  // tv type layout
  return (
    <div className="relative min-h-screen bg-black">
      <div className="flex w-full grid-cols-17 flex-col gap-3 md:grid relative">
        {isDrawerOpen && (
          <div
            className="hidden md:block fixed inset-0 z-20 cursor-default"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        <div className="w-full md:col-span-17">
          <PlayerSelector
            mediaId={idOnly}
            mediaType="tv"
            imdbId={imdbId}
            playerClass=""
            selectorClass="h-80 md:h-screen"
            season={selectedSeason}
            episode={selectedEpisode}
            title={showDetails.name || showDetails.title || ''}
            onPlayerChange={setActivePlayerId}
          />
          
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`absolute top-1/2 z-40 hidden md:flex h-16 w-6 -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 border-neutral-700 bg-neutral-900/80 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all duration-300 cursor-pointer shadow-lg shadow-black/50 ${
              isDrawerOpen ? 'md:right-80 lg:right-96' : 'right-0'
            }`}
            title={isDrawerOpen ? 'Collapse Episodes' : 'Expand Episodes'}
          >
            {isDrawerOpen ? (
              <Icons.chevronRight className="h-4 w-4" />
            ) : (
              <Icons.chevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <div
          className={`w-full mt-3 rounded-xl border border-neutral-700 p-1 pt-2 md:absolute md:top-0 md:right-0 md:z-30 md:h-full md:w-80 lg:w-96 md:bg-black/90 md:border-l md:border-t-0 md:border-b-0 md:border-r-0 md:border-neutral-800 md:mt-0 md:mr-0 md:rounded-none transition-all duration-300 ${
            isDrawerOpen 
              ? 'block md:opacity-100 md:translate-x-0' 
              : 'hidden md:block md:w-0 md:opacity-0 md:translate-x-full md:pointer-events-none'
          }`}
        >
          <div className="flex h-full flex-col p-1 md:p-3 md:overflow-y-auto">
            <SeasonsEpisodesSelector
              tvShow={showDetails}
              seasons={seasons}
              tvId={Number(idOnly)}
              onSeasonEpisodeChange={handleSeasonEpisodeChange}
              selectedSeason={selectedSeason}
              selectedEpisode={selectedEpisode}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-10 bg-linear-to-t from-black via-black/80 to-transparent">
        <RecommendedMovies shows={recommendedShows} title="More like this" />
      </div>
    </div>
  );
}
