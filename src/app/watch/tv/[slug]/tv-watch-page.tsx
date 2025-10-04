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

  // console.log("tvShow-",tvShow,"seasons-", seasons,"tvId-", tvId,"mediaId-", mediaId,)

  return (
    <div className="">
      {/* Player Selector with Multiple Options */}
      <div className="flex flex-col md:grid grid-cols-17 w-full gap-3">
        <div className="w-full md:col-span-12 md:ml-2">
          <PlayerSelector 
            mediaId={mediaId} 
            mediaType="tv" 
            playerClass="border border-neutral-700 rounded-xl p-[1px]"
            selectorClass="h-[20rem] md:h-[40rem]"
            season={selectedSeason}
            episode={selectedEpisode}
          />
        </div>

        <div className="w-full md:col-span-5 h-[35rem] md:h-[40rem] rounded-xl border border-neutral-700 p-1 md:mr-2 pt-2 mt-3 md:mt-0">
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
