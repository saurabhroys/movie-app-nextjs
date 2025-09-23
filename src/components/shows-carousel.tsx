'use client';

import { type Show } from '@/types';
import * as React from 'react';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn  } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { ShowCard } from './show-cards';

interface ShowsCarouselProps {
  title: string;
  shows: Show[];
}

const ShowsCarousel = ({ title, shows }: ShowsCarouselProps) => {
  const pathname = usePathname();

  const showsRef = React.useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // Check scroll position and update button visibility
  const checkScrollPosition = React.useCallback(() => {
    if (!showsRef.current) return;

    const { scrollLeft, scrollWidth, offsetWidth } = showsRef.current;
    const isAtStart = scrollLeft <= 0;
    const isAtEnd = scrollLeft + offsetWidth >= scrollWidth - 1; // -1 for floating point precision

    setCanScrollLeft(!isAtStart);
    setCanScrollRight(!isAtEnd);
  }, []);

  // Set up scroll event listener and initial check
  React.useEffect(() => {
    const element = showsRef.current;
    if (!element) return;

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      // Check if carousel is scrollable
      const isScrollable = element.scrollWidth > element.offsetWidth;
      setIsScrollable(isScrollable);

      // Initial check
      checkScrollPosition();
    }, 100);

    // Add scroll event listener
    element.addEventListener('scroll', checkScrollPosition);

    // Cleanup
    return () => {
      clearTimeout(timer);
      element.removeEventListener('scroll', checkScrollPosition);
    };
  }, [checkScrollPosition, shows.length]);

  // handle scroll to left and right
  const scrollToDirection = (direction: 'left' | 'right') => {
    if (!showsRef.current) return;

    const { scrollLeft, offsetWidth } = showsRef.current;
    const handleSize = offsetWidth > 1400 ? 60 : 0.04 * offsetWidth;
    const offset =
      direction === 'left'
        ? scrollLeft - (offsetWidth - 2 * handleSize)
        : scrollLeft + (offsetWidth - 2 * handleSize);
    showsRef.current.scrollTo({ left: offset, behavior: 'smooth' });

    if (scrollLeft === 0 && direction === 'left') {
      showsRef.current.scrollTo({
        left: showsRef.current.scrollWidth,
        behavior: 'smooth',
      });
    } else if (
      scrollLeft + offsetWidth === showsRef.current.scrollWidth &&
      direction === 'right'
    ) {
      showsRef.current.scrollTo({
        left: 0,
        behavior: 'smooth',
      });
    }

    // Check scroll position after scrolling
    setTimeout(() => {
      checkScrollPosition();
    }, 100);
  };

  return (
    <section aria-label="Carousel of shows" className="relative my-[3vw] p-0">
      {shows.length !== 0 && (
        <div className="space-y-1 sm:space-y-2.5">
          <h2 className="text-foreground/80 hover:text-foreground m-0 pb-2 px-[4%] text-lg font-semibold transition-colors sm:text-xl 2xl:px-[60px]">
            {title ?? '-'}
          </h2>
          <div className="relative w-full items-center justify-center overflow-disable" data-carousel>
            <Button
              aria-label="Scroll to left"
              variant="ghost"
              className={cn(
                'hover:bg-secondary/90 hover:text-foreground absolute top-0 left-0 z-10 mr-2 hidden h-full w-[4%] items-center justify-center rounded-l-none bg-transparent py-0 text-foreground md:block 2xl:w-[60px]',
                isScrollable && canScrollLeft ? 'md:block' : 'md:hidden',
              )}
              onClick={() => scrollToDirection('left')}>
              <Icons.chevronLeft className="h-8 w-8" aria-hidden="true" />
            </Button>
            <div
              ref={showsRef}
              data-carousel-scroll
              className="no-scrollbar m-0 grid auto-cols-[calc(100%/3)] grid-flow-col overflow-x-auto px-[4%] py-0 duration-500 ease-in-out sm:auto-cols-[25%] md:touch-pan-y lg:auto-cols-[20%] xl:auto-cols-[calc(100%/6)] 2xl:px-[60px]">
              {shows.map((show) => (
                <ShowCard key={show.id} show={show} pathname={pathname} />
              ))}
            </div>
            <Button
              aria-label="Scroll to right"
              variant="ghost"
              className={cn(
                'hover:bg-secondary/70 hover:text-foreground absolute top-0 right-0 z-10 m-0 ml-2 hidden h-full w-[4%] items-center justify-center rounded-r-none bg-transparent py-0 text-foreground md:block 2xl:w-[60px]',
                isScrollable && canScrollRight ? 'md:block' : 'md:hidden',
              )}
              onClick={() => scrollToDirection('right')}>
              <Icons.chevronRight className="h-8 w-8" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ShowsCarousel;
