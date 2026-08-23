'use client';

import { usePathname } from 'next/navigation';
import { MediaType, type CategorizedShows, type Show } from '@/services/tmdb/types';
import { getIdFromSlug } from '@/lib/slug';
import ShowsCarousel from '@/features/browse/shows-carousel';
import ShowsGrid from '@/features/browse/shows-grid';
import { trpc } from '@/client/trpc';
import { observer, use$ } from '@legendapp/state/react';
import { previewModal$, previewModalActions } from '@/state/preview-modal';
import { search$ } from '@/state/search';
import { useSearchQuery } from '@/state/search-api';
import React from 'react';

interface ShowsContainerProps {
  show?: Show;
  shows: CategorizedShows[];
  logoPaths?: Record<number, string | null>;
}

const ShowsContainer = ({ shows, logoPaths }: ShowsContainerProps) => {
  const pathname = usePathname();
  const utils = trpc.useUtils();
  const rawSearchQuery = use$(search$.query);
  const searchQuery = typeof rawSearchQuery === 'string' ? rawSearchQuery : '';
  const { data: searchShows = [] } = useSearchQuery(searchQuery, {
    skip: searchQuery.length === 0,
  });

  React.useEffect(() => {
    void handleOpenModal();
  }, []);

  const handleOpenModal = async (): Promise<void> => {
    if (!/\d/.test(pathname) || previewModal$.isOpen.peek()) {
      return;
    }
    const mediaId: number = getIdFromSlug(pathname);
    if (!mediaId) {
      return;
    }
    const mediaType = pathname.includes('/tv-shows') ? MediaType.TV : MediaType.MOVIE;
    try {
      const data: Show = await utils.movie.getShow.fetch({ id: mediaId, mediaType });
      if (data) {
        previewModalActions.openPreviewModal({ show: data, play: true });
        return;
      }
    } catch {
      // ignore tRPC fetch error and fallback to minimal show object
    }
    previewModalActions.openPreviewModal({
      show: { id: mediaId, media_type: mediaType } as Show,
      play: true,
    });
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

export default observer(ShowsContainer);
