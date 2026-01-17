'use client';

import { usePreviewModalStore } from '@/stores/preview-modal';
import type { Show } from '@/types';
import PreviewModal from './preview-modal';
import { ShowCard } from './shows-cards';
import { usePathname } from 'next/navigation';
import { useSearchStore } from '@/stores/search';
import ShowsSkeleton from './shows-skeleton';
import { cn } from '@/lib/utils';

interface SearchedShowsProps {
  shows: Show[];
  query?: string;
}

const ShowsGrid = ({ shows, query }: SearchedShowsProps) => {
  const pathname = usePathname();
  // modal store
  const modalStore = usePreviewModalStore();
  const searchStore = useSearchStore();

  return (
    <section aria-label="Grid of shows" className="container w-full max-w-none">
      {modalStore.isOpen && <PreviewModal />}
      <div className="main-view mt-4 min-h-[800px] pt-[5%]" id="main-view">
        {query && searchStore.loading ? (
          <ShowsSkeleton classname="pl-0" />
        ) : query && !shows?.length ? (
          <div className="text-center">
            <div className="inline-block text-left text-sm">
              <p className="mb-4">{`Your search for "${query}" did not have any matches.`}</p>
              <p className="mb-4">Suggestions:</p>
              <ul className="list-disc pl-8">
                <li>Try different keywords</li>
                <li>Looking for a movie or TV show?</li>
                <li>Try using a movie, TV show title, an actor or director</li>
                <li>Try a genre, like comedy, romance, sports, or drama</li>
              </ul>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'xxs:grid-cols-1 xxs:gap-x-1.5 xxs:gap-y-5 xs:grid-cols-2 xs:gap-y-7 grid gap-y-3.5 sm:grid-cols-2 sm:gap-y-10 md:grid-cols-4 md:gap-y-12 lg:gap-y-14 xl:grid-cols-6 xl:gap-y-16',
              query && 'max-[375px]:grid-cols-1 max-sm:grid-cols-2',
            )}>
            {shows.map((show: Show) => (
              <ShowCard key={show.id} show={show} pathname={pathname} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ShowsGrid;
