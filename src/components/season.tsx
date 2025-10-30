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
  selectedEpisode: propSelectedEpisode,
}: SeasonsEpisodesSelectorProps) => {
  const [internalSelectedSeason, setInternalSelectedSeason] =
    useState<number>(1);
  const [internalSelectedEpisode, setInternalSelectedEpisode] =
    useState<number>(1);

  const selectedSeason = propSelectedSeason ?? internalSelectedSeason;
  const selectedEpisode = propSelectedEpisode ?? internalSelectedEpisode;

  const currentSeason = seasons.find(
    (season) => season.season_number === selectedSeason,
  );
  const currentEpisode = currentSeason?.episodes?.find(
    (episode) => episode.episode_number === selectedEpisode,
  );

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
      <div className="flex h-full flex-col overflow-hidden px-1">
        {/* Season Selector */}
        <div className="mb-0.5">
          <div className="flex flex-row justify-evenly gap-2">
            {seasons && (
              <h4 className="relative mb-1 text-xs font-medium text-neutral-300 md:text-sm">
                Season
                <span className="absolute mt-0.5 ml-1 h-3 w-3 place-content-center rounded-full bg-neutral-50 text-center text-[8px] text-black md:ml-2 md:h-4 md:w-4 md:text-[10px]">
                  {seasons?.length || 0}
                </span>
              </h4>
            )}
            {currentSeason && (
              <h4 className="mb-2 text-xs font-medium text-neutral-300 md:text-sm">
                Episodes
                <span className="absolute mt-0.5 ml-1 h-3 w-3 place-content-center rounded-full bg-neutral-50 text-center text-[8px] text-black md:ml-2 md:h-4 md:w-4 md:text-[10px]">
                  {currentSeason.episodes?.length || 0}
                </span>
              </h4>
            )}
          </div>
          <div className="mb-1 flex flex-wrap gap-1 md:gap-1.5">
            {seasons.map((season) => (
              <button
                key={season.season_number}
                // variant={selectedSeason === season.season_number ? "default" : "outline"}
                // size="sm"
                onClick={() => handleSeasonChange(season.season_number)}
                className={`cursor-pointer rounded-md border px-1.5 py-0.5 text-[10px] font-bold md:px-2 md:text-xs ${
                  selectedSeason === season.season_number
                    ? 'bg-neutral-900 text-white ring-1 ring-blue-500 hover:bg-neutral-800'
                    : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                }`}>
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
            <div className="h-full space-y-1 overflow-y-auto px-1 py-2">
              {currentSeason.episodes?.map((episode) => (
                <button
                  key={episode.episode_number}
                  onClick={() => handleEpisodeChange(episode.episode_number)}
                  className={`w-full cursor-pointer rounded-lg border p-1.5 text-left transition-colors md:p-2 ${
                    selectedEpisode === episode.episode_number
                      ? 'bg-neutral-900 text-white ring-2 ring-blue-500'
                      : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                  }`}>
                  <div className="relative flex items-center gap-1 md:gap-1.5">
                    {/* Episode image */}
                    {episode.still_path && (
                      <div className="relative -m-1.5 mr-0 h-12 w-16 shrink-0 overflow-hidden rounded-l-md border border-neutral-800 bg-neutral-900 md:-m-2 md:mr-0 md:h-17 md:w-23">
                        <img
                          src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                          alt={episode.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <span className="absolute -top-1.5 -left-1.5 h-3 w-3 place-content-center rounded-full border bg-neutral-950 text-center text-[8px] font-medium text-white md:-top-2 md:-left-2 md:h-4 md:w-4 md:text-[10px]">
                      {episode.episode_number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium md:text-xs">
                        {episode.name}
                      </p>
                      {episode.overview && (
                        <p className="mt-0.5 line-clamp-1 text-[9px] text-neutral-400 md:mt-1 md:line-clamp-2 md:text-xs">
                          {episode.overview}
                        </p>
                      )}
                    </div>
                    {episode.runtime && (
                      <span className="text-[9px] text-neutral-400 md:text-xs">
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
          <div className="mt-1 rounded-lg border bg-neutral-950 p-1">
            <div className="mb-1 flex items-center gap-1 md:gap-2">
              <Icons.play className="h-3 w-3 text-blue-500 md:h-4 md:w-4" />
              <span className="truncate text-[10px] font-medium text-white md:text-sm">
                {showName} — {currentEpisode.name}
              </span>
            </div>
            <h5 className="mb-1 text-[10px] font-medium text-white md:text-sm">
              {/* Episode: {currentEpisode.name} */} Season: {selectedSeason} —
              Episode: {selectedEpisode}
            </h5>
            {currentEpisode.overview && (
              <p className="line-clamp-2 text-[9px] text-neutral-400 md:line-clamp-3 md:text-xs">
                {currentEpisode.overview}
              </p>
            )}
            <div className="mt-1 flex items-center gap-2 text-[9px] text-neutral-400 md:mt-2 md:gap-4 md:text-xs">
              {currentEpisode.air_date && (
                <span>
                  {new Date(currentEpisode.air_date).toLocaleDateString()}
                </span>
              )}
              {currentEpisode.vote_average > 0 && (
                <span className="flex items-center gap-1">
                  <Icons.star className="h-2.5 w-2.5 md:h-3 md:w-3" />
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
