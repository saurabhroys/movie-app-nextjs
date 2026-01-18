'use client';

import React, { useState } from 'react';
import RecommendedMovies from '@/components/recommended-movies';
import PlayerSelector from '@/components/watch/player-selector';
import SeasonsEpisodesSelector from '@/components/season';
import { Show, ISeason } from '@/types';
import { useSearchParams, useRouter } from 'next/navigation';

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

  const handleSeasonEpisodeChange = (season: number, episode: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(episode);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('season', season.toString());
    params.set('episode', episode.toString());
    
    // Use scroll: false to prevent jumping to top
    // casting to any because nextjs types might strictly require string url
    router.push(`?${params.toString()}`, { scroll: false } as any);
  };

  return (
    <div className="">
      {/* Player Selector with Multiple Options */}
      <div className="flex w-full grid-cols-17 flex-col gap-3 md:grid">
        <div className="w-full md:col-span-12 md:ml-2">
          <PlayerSelector
            mediaId={mediaId}
            mediaType="tv"
            playerClass="border border-neutral-700 rounded-xl p-px"
            selectorClass="h-80 md:h-160"
            season={selectedSeason}
            episode={selectedEpisode}
          />
        </div>

        <div className="mt-3 h-140 w-full rounded-xl border border-neutral-700 p-1 pt-2 md:col-span-5 md:mt-0 md:mr-2 md:h-160">
          {/* Seasons and Episodes Selector */}
          <div className="flex h-full flex-col">
            {/* <h3 className="text-lg font-semibold text-white mb-0 p-0.5 text-center">Seasons & Episodes</h3> */}
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
