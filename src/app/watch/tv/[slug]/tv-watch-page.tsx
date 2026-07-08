'use client';

import React, { useState } from 'react';
import RecommendedMovies from '@/components/recommended-movies';
import PlayerSelector from '@/components/watch/player-selector';
import SeasonsEpisodesSelector from '@/components/season';
import type { Show, ISeason } from '@/types';
import { useSearchParams, useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';

interface TvWatchPageProps {
  tvShow: Show;
  seasons: ISeason[];
  tvId: number;
  mediaId: string;
  recommendedShows: Show[];
}

const TvWatchPage = ({
  tvShow,
  seasons,
  tvId,
  mediaId,
  recommendedShows,
}: TvWatchPageProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize from URL or default to 1, but keep them responsive to URL changes if we want purely URL driven
  // However, for smoother UI sometimes local state + effect is used. 
  // Let's rely on local state synced with URL.
  const initialSeason = Number(searchParams.get('season')) || 1;
  const initialEpisode = Number(searchParams.get('episode')) || 1;
  
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(initialEpisode);
  const [activePlayerId, setActivePlayerId] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Sync state when URL params change (e.g. back button)
  React.useEffect(() => {
    const seasonParam = searchParams.get('season');
    const episodeParam = searchParams.get('episode');
    
    if (seasonParam) {
      setSelectedSeason(Number(seasonParam));
    }
    if (episodeParam) {
      setSelectedEpisode(Number(episodeParam));
    }
  }, [searchParams]);

  React.useEffect(() => {
    const isZxc = activePlayerId.includes('zxcstream') && activePlayerId !== 'vidify-fallback';
    setIsDrawerOpen(!isZxc);
  }, [activePlayerId]);

  const handleSeasonEpisodeChange = (season: number, episode: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(episode);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('season', season.toString());
    params.set('episode', episode.toString());
    
    // Use scroll: false to prevent jumping to top
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="">
      {/* Player Selector with Multiple Options */}
      <div className="flex w-full grid-cols-17 flex-col gap-3 md:grid relative">
        {/* Backdrop for closing drawer on click outside */}
        {isDrawerOpen && (
          <div
            className="hidden md:block fixed inset-0 z-20 cursor-default"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        <div className="w-full md:col-span-17">
          <PlayerSelector
            mediaId={mediaId}
            mediaType="tv"
            playerClass=""
            selectorClass="h-80 md:h-screen"
            season={selectedSeason}
            episode={selectedEpisode}
            title={tvShow.name || tvShow.title || ''}
            onPlayerChange={setActivePlayerId}
          />
          
          {/* Collapse/Expand Toggle Button */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`absolute top-1/2 z-40 hidden md:flex h-16 w-6 -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 border-neutral-700 bg-neutral-900/80 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all duration-300 cursor-pointer shadow-lg shadow-black/50 ${
              isDrawerOpen ? 'md:right-80 lg:right-96' : 'right-0'
            }`}
            title={isDrawerOpen ? "Collapse Episodes" : "Expand Episodes"}
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
          {/* Seasons and Episodes Selector */}
          <div className="flex h-full flex-col p-1 md:p-3 md:overflow-y-auto">
            <SeasonsEpisodesSelector
              tvShow={tvShow}
              seasons={seasons}
              tvId={tvId}
              onSeasonEpisodeChange={handleSeasonEpisodeChange}
              selectedSeason={selectedSeason}
              selectedEpisode={selectedEpisode}
            />
          </div>
        </div>
      </div>

      {/* Recommended Movies */}
      <div className="relative z-10 mt-10 bg-linear-to-t from-black via-black/80 to-transparent">
        <RecommendedMovies shows={recommendedShows} title="More like this" />
      </div>
    </div>
  );
};

export default TvWatchPage;
