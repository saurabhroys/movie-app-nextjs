'use client';

import React from 'react';
import { Show } from '@/types';
import { ShowCard } from './show-cards';
import { usePathname } from 'next/navigation';
import { useModalStore } from '@/stores/modal';
import ShowModal from './shows-modal';
import ShowsSkeleton from './shows-skeleton';

interface RecommendedMoviesProps {
  shows: Show[];
  title?: string;
  loading?: boolean;
}

const RecommendedMovies = ({ shows, title = "Recommended for you", loading = false }: RecommendedMoviesProps) => {
  const pathname = usePathname();
  const modalStore = useModalStore();

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
        <ShowsSkeleton classname="pl-0" />
      </div>
    );
  }

  if (!shows?.length) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
        <p className="text-neutral-400 text-sm">No recommendations available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      {modalStore.open && <ShowModal />}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {shows.slice(0, 30).map((show: Show) => (
          <ShowCard key={show.id} show={show} pathname={pathname} />
        ))}
      </div>
    </div>
  );
};

export default RecommendedMovies;
