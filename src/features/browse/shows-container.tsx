'use client';

import { usePathname } from 'next/navigation';
import { MediaType, type CategorizedShows } from '@/services/tmdb/types';

import { getIdFromSlug } from '@/lib/slug';
import ShowsCarousel from '@/features/browse/shows-carousel';
import ShowsGrid from '@/features/browse/shows-grid';
import { trpc } from '@/client/trpc';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { openPreviewModal, setFirstLoad } from '@/features/modals/previewModalSlice';
import { useSearchQuery } from '@/redux/features/search/searchApi';
import React from 'react';
import { type Show } from '@/services/tmdb/types';

interface ShowsContainerProps {
  show?: Show;
  shows: CategorizedShows[];
  logoPaths?: Record<number, string | null>;
}

const ShowsContainer = ({ shows, logoPaths }: ShowsContainerProps) => {
  // const mounted = useMounted();
  const pathname = usePathname();

  const dispatch = useAppDispatch();
  const utils = trpc.useUtils();
  const previewModalIsOpen = useAppSelector((state) => state.previewModal.isOpen);
  const searchQuery = useAppSelector((state) => state.search.query);
  const { data: searchShows = [] } = useSearchQuery(searchQuery, {
    skip: searchQuery.length === 0,
  });

  React.useEffect(() => {
    void handleOpenModal();
  }, []);

  const handleOpenModal = async (): Promise<void> => {
    if (!/\d/.test(pathname) || previewModalIsOpen) {
      return;
    }
    const mediaId: number = getIdFromSlug(pathname);
    if (!mediaId) {
      return;
    }
    try {
      const mediaType =
        pathname.includes('/tv-shows') ? MediaType.TV : MediaType.MOVIE;
      const data: Show = await utils.movie.getShow.fetch({ id: mediaId, mediaType });

      if (data) {
        dispatch(openPreviewModal({ show: data, play: true }));
        dispatch(setFirstLoad(true));
      }
    } catch {
      //swallow the error
    }
  };

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

export default ShowsContainer;
