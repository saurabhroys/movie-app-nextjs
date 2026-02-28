'use client';

import { type Show } from '@/types';
import * as React from 'react';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { ShowCard } from './shows-cards';
import { trpc } from '@/client/trpc';
import { type TmdbRequest } from '@/enums/request-type';

interface ShowsCarouselProps {
  title: string;
  initialShows: Show[];
  req: TmdbRequest;
}

const ShowsCarousel = ({ title, initialShows, req }: ShowsCarouselProps) => {
  // console.log(`ShowsCarousel [${title}] req:`, JSON.stringify(req, null, 2));
  const pathname = usePathname();
  const showsRef = React.useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.movie.getInfiniteShows.useInfiniteQuery(
    { ...req },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialData: {
        pages: [
          {
            items: initialShows,
            nextCursor: 2, // Assume there's a next page initially
          },
        ],
        pageParams: [1],
      },
    }
  );

  const allShows = data?.pages.flatMap((page) => page.items) ?? initialShows;

  const [isScrollable, setIsScrollable] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScrollPosition = React.useCallback(() => {
    if (!showsRef.current) return;

    const { scrollLeft, scrollWidth, offsetWidth } = showsRef.current;
    const isAtStart = scrollLeft <= 0;
    // Trigger much earlier (500px before end) for smoother infinite scroll
    const isAtEnd = scrollLeft + offsetWidth >= scrollWidth - 500;

    setCanScrollLeft(!isAtStart);
    // Button should be active if there's more to scroll OR more pages to fetch
    setCanScrollRight(scrollLeft + offsetWidth < scrollWidth - 1 || hasNextPage);

    if (isAtEnd && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  React.useEffect(() => {
    const element = showsRef.current;
    if (!element) return;

    const timer = setTimeout(() => {
      const isScrollable = element.scrollWidth > element.offsetWidth || hasNextPage;
      setIsScrollable(isScrollable);
      checkScrollPosition();
    }, 100);

    element.addEventListener('scroll', checkScrollPosition);
    return () => {
      clearTimeout(timer);
      element.removeEventListener('scroll', checkScrollPosition);
    };
  }, [checkScrollPosition, allShows.length, hasNextPage]);

  const scrollToDirection = (direction: 'left' | 'right') => {
    if (!showsRef.current) return;

    const { scrollLeft, offsetWidth } = showsRef.current;
    const handleSize = offsetWidth > 1400 ? 60 : 0.04 * offsetWidth;
    const scrollAmount = offsetWidth - 2 * handleSize;

    const offset = direction === 'left'
      ? scrollLeft - scrollAmount
      : scrollLeft + scrollAmount;

    showsRef.current.scrollTo({ left: offset, behavior: 'smooth' });

    setTimeout(checkScrollPosition, 500); // Check after animation
  };

  return (
    <section aria-label={`Carousel of ${title}`} className="relative my-[3vw] p-0">
      {allShows.length !== 0 && (
        <div className="space-y-1 sm:space-y-2.5">
          <h2 className="text-foreground/80 hover:text-foreground m-0 px-[4%] pb-2 text-lg font-semibold transition-colors sm:text-xl 2xl:px-[60px]">
            {title}
          </h2>
          <div className="overflow-disable relative w-full items-center justify-center">
            <Button
              aria-label="Scroll left"
              variant="ghost"
              className={cn(
                'hover:bg-secondary/90 hover:text-foreground text-foreground absolute top-0 left-0 z-10 hidden h-full w-[4%] items-center justify-center rounded-l-none bg-transparent py-0 md:flex 2xl:w-[60px]',
                !canScrollLeft && 'opacity-0 pointer-events-none'
              )}
              onClick={() => scrollToDirection('left')}>
              <Icons.chevronLeft className="h-8 w-8" />
            </Button>

            <div
              ref={showsRef}
              className="no-scrollbar m-0 grid auto-cols-[calc(100%/3)] grid-flow-col overflow-x-auto px-[4%] py-0 duration-500 ease-in-out sm:auto-cols-[25%] md:touch-pan-y lg:auto-cols-[20%] xl:auto-cols-[calc(100%/6)] 2xl:px-[60px]">
              {allShows.map((show, idx) => (
                <ShowCard key={`${show.id}-${idx}`} show={show} pathname={pathname} />
              ))}
              {isFetchingNextPage && (
                <div className="flex h-full items-center justify-center p-4">
                  <Icons.spinner className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            <Button
              aria-label="Scroll right"
              variant="ghost"
              className={cn(
                'hover:bg-secondary/70 hover:text-foreground text-foreground absolute top-0 right-0 z-10 hidden h-full w-[4%] items-center justify-center rounded-r-none bg-transparent py-0 md:flex 2xl:w-[60px]',
                !canScrollRight && !hasNextPage && 'opacity-0 pointer-events-none'
              )}
              onClick={() => scrollToDirection('right')}>
              <Icons.chevronRight className="h-8 w-8" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ShowsCarousel;
