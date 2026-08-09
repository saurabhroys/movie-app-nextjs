'use client';
import type { DetailedShowInfo } from '@/redux/features/modals/detail-fetch-helper';

interface PreviewCastListProps {
  detailedShow: DetailedShowInfo | null;
}

/**
 * Side metadata column of the preview modal: the credited cast and genres.
 */
const PreviewCastList = ({ detailedShow }: PreviewCastListProps) => {
  return (
    <div className="flex w-full md:w-1/4 flex-col gap-3 text-sm text-neutral-400">
      {/* Left Column */}
      <div className="">
        <div>
          <span className="text-neutral-50">Cast: </span>
          <span>
            {detailedShow?.cast && detailedShow.cast.length > 0
              ? `${detailedShow.cast.map((actor) => actor.name).slice(0, 5).join(', ')}, more`
              : '-'}
          </span>
        </div>
      </div>

      {/* Right Column */}
      <div className="">
        <div>
          <span className="text-neutral-50">Genres: </span>
          <span>
            {detailedShow?.genres?.map((genre) => genre.name).join(', ') ?? '-'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PreviewCastList;
