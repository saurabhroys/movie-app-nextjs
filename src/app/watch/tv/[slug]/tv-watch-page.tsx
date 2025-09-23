'use client';

import React, { useState } from 'react';
import RecommendedMovies from '@/components/recommended-movies';
import PlayerSelector from '@/components/watch/player-selector';
import SeasonsEpisodesSelector from '@/components/season';
import { Show, ISeason } from '@/types';

interface TvWatchPageProps {
  tvShow: Show;
  seasons: ISeason[];
  tvId: number;
  mediaId: string;
  recommendedShows: Show[];
}

const TvWatchPage = ({ tvShow, seasons, tvId, mediaId, recommendedShows }: TvWatchPageProps) => {
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);

  const handleSeasonEpisodeChange = (season: number, episode: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(episode);
  };

  console.log("tvShow-",tvShow,"seasons-", seasons,"tvId-", tvId,"mediaId-", mediaId,)

  return (
    <div className="min-h-screen w-screen bg-black">
      {/* Player Selector with Multiple Options */}
      <div className="grid grid-cols-17 w-full gap-3 mt-5">
        <div className="col-span-12 ml-2">
          <PlayerSelector 
            mediaId={mediaId} 
            mediaType="tv" 
            playerClass="rounded-xl border border-neutral-700 p-[1px]"
            selectorClass="h-[40rem]"
            season={selectedSeason}
            episode={selectedEpisode}
          />
        </div>

        <div className="col-span-5 h-[40rem] rounded-xl border border-neutral-700 p-1 mr-2 pt-2">
          {/* Seasons and Episodes Selector */}
          <div className="flex flex-col h-full">
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
      <div className="bg-gradient-to-t from-black via-black/80 to-transparent mt-10 relative z-10">
        <RecommendedMovies 
          shows={recommendedShows} 
          title="More like this" 
        />
      </div>
    </div>
  );
};

export default TvWatchPage;
