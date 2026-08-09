'use client';
import type { Show } from '@/services/tmdb/types';
import type { DetailedShowInfo } from '@/redux/features/modals/detail-fetch-helper';

interface PreviewAboutProps {
  show: Show | null;
  detailedShow: DetailedShowInfo | null;
}

/**
 * "About" section of the preview modal: directors, cast, writers,
 * genres, keywords and the maturity rating for the current show.
 */
const PreviewAbout = ({ show, detailedShow }: PreviewAboutProps) => {
  const isTv = (show?.media_type as string) === 'tv';

  return (
    <div className="px-4 md:px-10 pb-6">
      <h3 className="mb-3 text-xl font-semibold text-white">
        About {show?.title ?? show?.name}
      </h3>
      <div className="space-y-2 text-sm">
        {detailedShow?.directors && detailedShow.directors.length > 0 && (
          <div className="text-neutral-300">
            <span className="text-neutral-400">Director: </span>
            <span className="text-neutral-200">
              {detailedShow.directors.join(', ')}
            </span>
          </div>
        )}
        {detailedShow?.cast && detailedShow.cast.length > 0 && (
          <div className="text-neutral-300">
            <span className="text-neutral-400">Cast: </span>
            <span className="text-neutral-200">
              {detailedShow.cast
                .map((a) => a.name)
                .slice(0, 12)
                .join(', ')}
            </span>
          </div>
        )}
        {detailedShow?.writers && detailedShow.writers.length > 0 && (
          <div className="text-neutral-300">
            <span className="text-neutral-400">Writer: </span>
            <span className="text-neutral-200">
              {detailedShow.writers.join(', ')}
            </span>
          </div>
        )}
        {detailedShow?.genres && detailedShow.genres.length > 0 && (
          <div className="text-neutral-300">
            <span className="text-neutral-400">Genres: </span>
            <span className="text-neutral-200">
              {detailedShow.genres.map((g) => g.name).join(', ')}
            </span>
          </div>
        )}
        <div className="text-neutral-300">
          <span className="text-neutral-400">This {isTv ? 'Show' : 'Movie'} Is: </span>
          <span className="text-neutral-200">
            {detailedShow?.keywords
              ?.slice(0, 4)
              .map((k) => k.name)
              .join(', ') || '—'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-neutral-300">
          <span className="text-neutral-400">Maturity Rating: </span>
          <span className="place-items-center border border-neutral-500 px-1.5 py-0.5 text-[10px] font-bold text-neutral-200">
            {detailedShow?.contentRating ??
              ((show?.vote_average ?? 0) >= 8
                ? '18+'
                : '16+')}
          </span>
          <span className="text-xs text-neutral-400">
            {(show?.vote_average ?? 0) >= 8
              ? 'Recommended for ages 18 and up'
              : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PreviewAbout;
