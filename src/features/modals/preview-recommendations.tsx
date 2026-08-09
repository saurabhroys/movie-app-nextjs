'use client';
import { Icons } from '@/components/shared/icons';
import CustomImage from '@/components/shared/custom-image';
import ShowsSkeleton from '@/features/browse/shows-skeleton';
import { getYear } from '@/lib/utils';
import type { Show } from '@/services/tmdb/types';
import type { DetailedShowInfo } from '@/redux/features/modals/detail-fetch-helper';

interface PreviewRecommendationsProps {
  detailedShow: DetailedShowInfo | null;
  loadingRecommended: boolean;
  onShowClick: (item: Show) => void;
}

/**
 * "More like this" row of the preview modal: a grid of recommended
 * shows, each displaying a poster, duration badge, and short overview.
 */
const PreviewRecommendations = ({
  detailedShow,
  loadingRecommended,
  onShowClick,
}: PreviewRecommendationsProps) => {
  const recommendedShows = detailedShow?.recommendations || [];

  return (
    <div className="px-4 md:px-10 pb-6">
      <h3 className="mb-4 text-xl font-semibold text-white">
        More like this
      </h3>
      {loadingRecommended ? (
        <ShowsSkeleton classname="pl-0" />
      ) : recommendedShows.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No recommendations available at the moment.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {recommendedShows.slice(0, 12).map((show) => {
            const isTv = (show.media_type as string) === 'tv';
            const detail = detailedShow?.recommendedDetails?.[show.id];
            const seasons = isTv
              ? (detail?.number_of_seasons ??
                show.number_of_seasons ??
                null)
              : null;
            const runtimeMin = !isTv
              ? (detail?.runtime ??
                (typeof show.runtime === 'number'
                  ? (show.runtime as number)
                  : null))
              : null;
            const durationLabel = isTv
              ? seasons != null
                ? `${seasons} ${seasons === 1 ? 'Season' : 'Seasons'}`
                : undefined
              : runtimeMin != null
                ? `${Math.floor(runtimeMin / 60)}h ${runtimeMin % 60}m`
                : undefined;
            const year = show.release_date
              ? getYear(show.release_date)
              : show.first_air_date
                ? getYear(show.first_air_date)
                : undefined;
            return (
              <div
                key={show.id}
                className="group overflow-hidden rounded-xl border border-neutral-700/60 bg-neutral-800 transition-colors hover:border-neutral-600">
                <div
                  className="relative aspect-video cursor-pointer"
                  onClick={() => onShowClick(show)}>
                  <CustomImage
                    src={
                      (show.backdrop_path ?? show.poster_path)
                        ? `https://image.tmdb.org/t/p/w780${show.backdrop_path ?? show.poster_path}`
                        : '/images/grey-thumbnail.jpg'
                    }
                    alt={show.title ?? show.name ?? 'poster'}
                    className="h-full w-full object-cover"
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        '/images/grey-thumbnail.jpg';
                    }}
                  />
                  {/* Centered logo overlay */}
                  {detailedShow?.recommendedLogos?.[show.id] && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden px-2">
                      <div className="relative h-10 w-full max-w-[85%] sm:h-12">
                        <CustomImage
                          src={`https://image.tmdb.org/t/p/w500${detailedShow?.recommendedLogos?.[show.id]}`}
                          alt={(show.title ?? show.name ?? 'logo') as string}
                          style={{
                            objectFit: 'contain',
                          }}
                          fill
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Hover play icon */}
                  <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 ring-2 ring-white/60 sm:h-12 sm:w-12">
                      <Icons.play className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                    </div>
                  </div>
                  {durationLabel && (
                    <div className="absolute top-2 right-2 z-30 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                      {durationLabel}
                    </div>
                  )}
                  <div className="absolute inset-0 z-10 bg-linear-to-t from-black/70 via-black/0 to-black/0"></div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="place-items-center border border-neutral-500 px-1.5 py-0.5 text-[10px] font-bold text-neutral-200">
                        {(show.vote_average ?? 0) >= 8
                          ? '18+'
                          : '16+'}
                      </span>
                      <span className="place-items-center rounded-[3px] border border-neutral-500 px-1.5 py-0 text-[10px] font-semibold text-neutral-300">
                        HD
                      </span>
                      {year && (
                        <span className="rounded-[3px] border border-neutral-500 px-1.5 py-0 text-[10px] font-semibold text-neutral-300">
                          {year}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-3 text-xs text-neutral-300">
                    {show.overview ?? ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PreviewRecommendations;
