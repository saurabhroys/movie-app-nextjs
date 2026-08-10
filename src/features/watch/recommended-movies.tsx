'use client';

import React from 'react';
import { type Show } from '@/services/tmdb/types';
import { ShowCard } from '@/features/browse/shows-cards';
import { useShowLogos } from '@/features/browse/use-show-logos';
import { usePathname } from 'next/navigation';
import ShowsSkeleton from '@/features/browse/shows-skeleton';

interface RecommendedMoviesProps {
  shows: Show[];
  title?: string;
  loading?: boolean;
}

const RecommendedMovies = ({
  shows,
  title = 'Recommended for you',
  loading = false,
}: RecommendedMoviesProps) => {
  const pathname = usePathname();
  const mergedLogoPaths = useShowLogos(shows);

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
        <ShowsSkeleton
          classname="pl-0"
          withTitle={false}
          gridClassName="xs:grid-cols-2 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        />
      </div>
    );
  }

  if (!shows?.length) {
    return (
      <div className="p-4">
        <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
        <p className="text-sm text-neutral-400">
          No recommendations available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
      {/* {modalStore.isOpen && <PreviewModal />} */}
      <div className="xs:grid-cols-2 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {shows.slice(0, 30).map((show: Show) => (
          <ShowCard
            key={show.id}
            show={show}
            pathname={pathname}
            logoPath={mergedLogoPaths[show.id]}
          />
        ))}
      </div>
    </div>
  );
};

export default RecommendedMovies;
