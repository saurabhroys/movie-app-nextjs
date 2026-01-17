'use client';

import { usePathname } from 'next/navigation';
// import { useMounted } from '@/hooks/use-mounted';
// import { usePreviewModalStore } from "@/stores/modal"
// import { useProfileStore } from "@/stores/profile"
import { useSearchStore } from '@/stores/search';
import type { CategorizedShows } from '@/types';

// import { api } from "@/lib/api/api"
import { getIdFromSlug } from '@/lib/utils';
// import PreviewModal from '@/components/preview-modal';
import ShowsCarousel from '@/components/shows-carousel';
import ShowsGrid from '@/components/shows-grid';
// import ShowsSkeleton from '@/components/shows-skeleton';
import { usePreviewModalStore } from '@/stores/preview-modal';
import React from 'react';
import { type Show } from '@/types/index';
import { type AxiosResponse } from 'axios';
import MovieService from '@/services/MovieService';

interface ShowsContainerProps {
  show?: Show;
  shows: CategorizedShows[];
}

const ShowsContainer = ({ shows }: ShowsContainerProps) => {
  // const mounted = useMounted();
  const pathname = usePathname();

  // stores
  const modalStore = usePreviewModalStore();
  const searchStore = useSearchStore();

  React.useEffect(() => {
    void handleOpenModal();
  }, []);

  const handleOpenModal = async (): Promise<void> => {
    if (!/\d/.test(pathname) || modalStore.isOpen) {
      return;
    }
    const mediaId: number = getIdFromSlug(pathname);
    if (!mediaId) {
      return;
    }
    try {
      const response: AxiosResponse<Show> = pathname.includes('/tv-shows')
        ? await MovieService.findTvSeries(mediaId)
        : await MovieService.findMovie(mediaId);
      const data: Show = response.data;

      if (data)
        usePreviewModalStore.setState({
          show: data,
          isOpen: true,
          play: true,
          firstLoad: true,
        });
    } catch (error) {}
  };

  // if (!mounted) {
  //   return (
  //     <div className="mt-4 min-h-[800px] pt-[5%]">
  //       <ShowsSkeleton />
  //     </div>
  //   );
  // }

  if (searchStore.query.length > 0) {
    return <ShowsGrid shows={searchStore.shows} query={searchStore.query} />;
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
              shows={item.shows ?? []}
            />
          ),
      )}
    </>
  );
};

export default ShowsContainer;
