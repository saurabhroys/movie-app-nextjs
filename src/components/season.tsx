'use client';

import React, { useState } from 'react';
import { Show, ISeason, IEpisode } from '@/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

interface SeasonsEpisodesSelectorProps {
  tvShow: Show;
  seasons: ISeason[];
  tvId: number;
  onSeasonEpisodeChange?: (season: number, episode: number) => void;
  selectedSeason?: number;
  selectedEpisode?: number;
}

const SeasonsEpisodesSelector = ({ 
  tvShow, 
  seasons, 
  tvId, 
  onSeasonEpisodeChange,
  selectedSeason: propSelectedSeason,
  selectedEpisode: propSelectedEpisode
}: SeasonsEpisodesSelectorProps) => {
  const [internalSelectedSeason, setInternalSelectedSeason] = useState<number>(1);
  const [internalSelectedEpisode, setInternalSelectedEpisode] = useState<number>(1);
  
  const selectedSeason = propSelectedSeason ?? internalSelectedSeason;
  const selectedEpisode = propSelectedEpisode ?? internalSelectedEpisode;

  const currentSeason = seasons.find(season => season.season_number === selectedSeason);
  const currentEpisode = currentSeason?.episodes?.find(episode => episode.episode_number === selectedEpisode);

  const showName = tvShow.name || tvShow.title || tvShow.original_name || '-';

  const handleSeasonChange = (seasonNumber: number) => {
    if (onSeasonEpisodeChange) {
      onSeasonEpisodeChange(seasonNumber, 1);
    } else {
      setInternalSelectedSeason(seasonNumber);
      setInternalSelectedEpisode(1);
    }
  };

  const handleEpisodeChange = (episodeNumber: number) => {
    if (onSeasonEpisodeChange) {
      onSeasonEpisodeChange(selectedSeason, episodeNumber);
    } else {
      setInternalSelectedEpisode(episodeNumber);
    }
  };

  return (
    <>
      <div className="flex flex-col px-1 h-full overflow-hidden">
        {/* Season Selector */}
        <div className="mb-0.5">
          <div className="flex flex-row justify-evenly gap-2">
            {seasons && (
              <h4 className="text-sm font-medium text-neutral-300 mb-1">Season 
                  <span className="p-1 px-1.5 ml-2 rounded-full text-[10px] text-black bg-neutral-50">
                    {seasons?.length || 0 }
                  </span>
              </h4>
            )}
            {currentSeason && (
              <h4 className="text-sm font-medium text-neutral-300 mb-2">
                Episodes 
                <span className="p-1 px-1.5 ml-2 rounded-full text-[10px] text-black bg-neutral-50">
                  {currentSeason.episodes?.length || 0}
                </span>
              </h4>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-1">
            {seasons.map((season) => (
              <button
                key={season.season_number}
                // variant={selectedSeason === season.season_number ? "default" : "outline"}
                // size="sm"
                onClick={() => handleSeasonChange(season.season_number)}
                className={`text-sm px-4 font-bold rounded-md cursor-pointer py-0.5 border ${
                  selectedSeason === season.season_number
                    ? 'bg-neutral-900 ring-2 ring-blue-500 hover:bg-neutral-800 text-white'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
               S {season.season_number}
              </button>
            ))}
          </div>


        </div>

        {/* Episode Selector */}
        {currentSeason && (
          <div className="flex-1 overflow-hidden">
            {/* <h4 className="text-sm font-medium text-neutral-300 mb-2">
              Episodes 
              <span className="p-1 px-1.5 ml-2 rounded-full text-[10px] text-black bg-neutral-50">
                {currentSeason.episodes?.length || 0}
              </span>
            </h4> */}
            <div className="h-full overflow-y-auto px-1 py-2 space-y-1">
              {currentSeason.episodes?.map((episode) => (
                <button
                  key={episode.episode_number}
                  onClick={() => handleEpisodeChange(episode.episode_number)}
                  className={`w-full cursor-pointer text-left p-2 rounded-lg transition-colors border ${
                    selectedEpisode === episode.episode_number
                      ? 'bg-neutral-900 ring-2 ring-blue-500 text-white'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {episode.episode_number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {episode.name}
                      </p>
                      {episode.overview && (
                        <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                          {episode.overview}
                        </p>
                      )}
                    </div>
                    {episode.runtime && (
                      <span className="text-xs text-neutral-400">
                        {episode.runtime}m
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
      <div className="">
         {/* Current Selection Info */}
         {currentEpisode && (
            <div className=" p-1 mt-1 bg-neutral-950 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Icons.play className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-white">
                  {showName} — {currentEpisode.name}
                </span>
              </div>
              <h5 className="text-sm font-medium text-white mb-1">
                {/* Episode: {currentEpisode.name} */} Season- {selectedSeason} —  Episode -{selectedEpisode}
              </h5>
              {currentEpisode.overview && (
                <p className="text-xs text-neutral-400 line-clamp-3">
                  {currentEpisode.overview}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
                {currentEpisode.air_date && (
                  <span>
                    {new Date(currentEpisode.air_date).toLocaleDateString()}
                  </span>
                )}
                {currentEpisode.vote_average > 0 && (
                  <span className="flex items-center gap-1">
                    <Icons.star className="w-3 h-3" />
                    {currentEpisode.vote_average.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          )}
      </div>
    </>
  );
};

export default SeasonsEpisodesSelector;