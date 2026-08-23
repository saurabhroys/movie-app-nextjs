'use client';

import { type CategorizedShows, type Show } from '@/services/tmdb/types';
import ShowsCarousel from '@/features/browse/shows-carousel';
import ShowsGrid from '@/features/browse/shows-grid';
import { observer, use$ } from '@legendapp/state/react';
import { search$ } from '@/state/search';
import { useSearchQuery } from '@/state/search-api';
import React from 'react';

interface ShowsContainerProps {
  show?: Show;
  shows: CategorizedShows[];
  logoPaths?: Record<number, string | null>;
}

const ShowsContainer = ({ shows, logoPaths }: ShowsContainerProps) => {
  const searchQuery = use$(search$.query);
  const { data: searchShows = [] } = useSearchQuery(searchQuery, {
    skip: searchQuery.length === 0,
  });

  // if (!mounted) {
  //   return (
  //     <div className="mt-4 min-h-[800px] pt-[5%]">
  //       <ShowsSkeleton />
  //     </div>
  //   );
  // }

  if (searchQuery.length > 0) {
    return <ShowsGrid shows={searchShows} query={searchQuery} />;
  }

  return (
    <>
      {/* {modalStore.isOpen && <PreviewModal />} */}
      {shows.map(
        (item) =>
          item.visible && (
            <ShowsCarousel
              key={item.title}
              title={item.title}
              initialShows={item.shows ?? []}
              req={item.req}
              logoPaths={logoPaths}
            />
          ),
      )}
    </>
  );
};

export default observer(ShowsContainer);
