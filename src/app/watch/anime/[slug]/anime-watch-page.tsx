'use client';

import React, { useState } from 'react';
import RecommendedMovies from '@/components/recommended-movies';
import PlayerSelector from '@/components/watch/player-selector';
import SeasonsEpisodesSelector from '@/components/season';
import { Show, ISeason } from '@/types';

interface AnimeWatchPageProps {
  tvShow: Show;
  seasons: ISeason[];
  tvId: number;
  mediaId: string;
  recommendedShows: Show[];
}

const AnimeWatchPage = ({ tvShow, seasons, tvId, mediaId, recommendedShows }: AnimeWatchPageProps) => {
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);

  const handleSeasonEpisodeChange = (season: number, episode: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(episode);
  };

  return (
    <div className="min-h-screen w-screen bg-black">
      {/* Player Selector with Multiple Options */}
      <div className="grid grid-cols-12 w-full gap-3 mt-5">
        <div className="col-span-8 ml-2">
          <PlayerSelector 
            mediaId={mediaId} 
            mediaType="anime" 
            playerClass="rounded-xl border border-neutral-700 p-[1px]"
            selectorClass="h-[33rem]"
            season={selectedSeason}
            episode={selectedEpisode}
          />
        </div>

        <div className="col-span-4 h-[33rem] rounded-xl border border-neutral-700 p-1 mr-2 pt-2">
          {/* Seasons and Episodes Selector */}
          <div className="flex flex-col h-full">
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
      <div className="bg-gradient-to-t from-black via-black/80 to-transparent mt-10 relative z-10">
        <RecommendedMovies 
          shows={recommendedShows} 
          title="More like this" 
        />
      </div>
    </div>
  );
};

export default AnimeWatchPage;
