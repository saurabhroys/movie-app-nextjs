'use client';
import { Icons } from '@/components/shared/icons';
import CustomImage from '@/components/shared/custom-image';
import type { Show, Episode } from '@/services/tmdb/types';
import type { DetailedShowInfo } from '@/redux/features/modals/detail-fetch-helper';

interface PreviewSeasonSelectorProps {
  show: Show | null;
  detailedShow: DetailedShowInfo | null;
  selectedSeason: number;
  seasonEpisodes: Episode[];
  onSeasonChange: (seasonNumber: number) => void;
  onEpisodeClick: (seasonNumber: number, episodeNumber: number) => void;
}

/**
 * TV-only section of the preview modal: the season dropdown and the
 * clickable episode list for the currently selected season.
 */
const PreviewSeasonSelector = ({
  show,
  detailedShow,
  selectedSeason,
  seasonEpisodes,
  onSeasonChange,
  onEpisodeClick,
}: PreviewSeasonSelectorProps) => {
  if (!detailedShow || (show?.media_type as string) !== 'tv') return null;

  return (
    <div className="px-4 md:px-10 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">
          Episodes
        </h3>
        {detailedShow.seasons && detailedShow.seasons.length > 1 && (
          <select
            value={selectedSeason}
            onChange={(e) =>
              onSeasonChange(Number(e.target.value))
            }
            className="rounded border border-neutral-600 bg-neutral-800 px-3 py-1 text-white">
            {detailedShow.seasons.map((season) => (
              <option
                key={season.season_number}
                value={season.season_number}>
                Season {season.season_number}
              </option>
            ))}
          </select>
        )}
      </div>

      {seasonEpisodes.length > 0 && (
        <div className="space-y-3">
          {seasonEpisodes.map((episode) => (
            <div
              key={episode.id}
              className="group flex cursor-pointer gap-4 rounded-lg bg-neutral-800 p-4 transition hover:bg-neutral-700/60"
              onClick={() =>
                onEpisodeClick(
                  selectedSeason,
                  episode.episode_number,
                )
              }>
              <div className="relative h-20 w-32 shrink-0">
                <CustomImage
                  src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                  alt={episode.name}
                  className="h-full w-full rounded object-cover"
                  width={128}
                  height={80}
                />
                <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <Icons.play className="h-7 w-7 text-white" />
                </div>
                <div className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-xs text-white">
                  {Math.floor(episode.runtime / 60)}h{' '}
                  {episode.runtime % 60}m
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {episode.episode_number}
                  </span>
                  <span className="text-sm text-neutral-400">
                    {episode.name}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-neutral-300">
                  {episode.overview}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviewSeasonSelector;
