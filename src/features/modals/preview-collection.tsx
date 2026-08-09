'use client';
import { Icons } from '@/components/shared/icons';
import CustomImage from '@/components/shared/custom-image';
import { getYear } from '@/lib/utils';
import type { MovieCollection } from '@/redux/features/modals/detail-fetch-helper';

interface PreviewCollectionProps {
  collection: MovieCollection | undefined;
  onMovieClick: (movieId: number) => void;
}

/**
 * Movie-only section of the preview modal: the "collection" a film
 * belongs to (e.g. a franchise), rendered as a grid of its parts.
 */
const PreviewCollection = ({
  collection,
  onMovieClick,
}: PreviewCollectionProps) => {
  if (!collection?.parts?.length) return null;

  return (
    <div className="px-4 md:px-10 pb-6">
      <div className="flex items-start justify-start gap-4">
        <Icons.library />
        <h3 className="mb-4 text-xl font-semibold text-white">
          {collection.name}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {collection.parts.map((movie) => (
          <div
            key={movie.id}
            className="group flex cursor-pointer gap-3 rounded-lg bg-neutral-800 p-3 transition hover:bg-neutral-700/60"
            onClick={() => onMovieClick(movie.id)}>
            <div className="relative h-24 w-16 shrink-0">
              <CustomImage
                src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                alt={movie.title}
                className="h-full w-full rounded object-cover"
                width={64}
                height={96}
              />
              <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40 opacity-0 transition group-hover:opacity-100">
                <Icons.play className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-medium text-white">
                {movie.title}
              </h4>
              <p className="mt-1 text-xs text-neutral-400">
                {movie.release_date ? getYear(movie.release_date) : ''}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                {movie.overview}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewCollection;
