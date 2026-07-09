'use client';

import React, { useState } from 'react';
import { type Show, type ISeason } from '@/types';
import CustomImage from './custom-image';

interface SeasonsEpisodesSelectorProps {
  tvShow?: Show;
  seasons: ISeason[];
  tvId?: number;
  onSeasonEpisodeChange?: (season: number, episode: number) => void;
  selectedSeason?: number;
  selectedEpisode?: number;
}

const SeasonsEpisodesSelector = ({
  seasons,
  tvId: _tvId,
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
          <div className="mb-1 flex flex-wrap gap-3 pt-1.5">
              {seasons.map((season) => (
                <button
                  key={season.season_number}
                  onClick={() => handleSeasonChange(season.season_number)}
                  className={`relative cursor-pointer rounded-md border px-3 py-1 text-[10px] font-bold md:px-3.5 md:py-1.5 md:text-xs transition-all ${
                    selectedSeason === season.season_number
                      ? 'bg-neutral-900 text-white ring-1 ring-blue-500 border-blue-500 hover:bg-neutral-800'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                  }`}>
                  <span>S {season.season_number}</span>
                  <span className={`absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[8px] font-bold text-white ring-1 ring-neutral-950 ${
                    selectedSeason === season.season_number ? 'bg-blue-600' : 'bg-zinc-700'
                  }`}>
                    {season.episodes?.length || 0}
                  </span>
                </button>
              ))}
            </div>
        </div>

        {/* Episode Selector */}
        {currentSeason && (
          <div className="flex-1 overflow-hidden">
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
                        <CustomImage
                          src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                          alt={episode.name}
                          className="h-full w-full object-cover"
                          fill
                          sizes="(max-width: 768px) 64px, 92px"
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

    </>
  );
};

export default SeasonsEpisodesSelector;
