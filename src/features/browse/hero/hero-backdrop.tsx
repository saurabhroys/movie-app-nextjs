'use client';
import * as React from 'react';
import { type Show } from '@/services/tmdb/types';
import CustomImage from '@/components/shared/custom-image';
import Youtube from 'react-youtube';

interface HeroBackdropProps {
  randomShow: Show;
  trailer?: string | null;
  showTrailer: boolean;
  trailerFinished: boolean;
  imageRef: React.RefObject<HTMLImageElement | null>;
  youtubeRef: React.RefObject<Youtube | null>;
  defaultOptions: React.ComponentProps<typeof Youtube>['opts'];
  onTrailerEnd: () => void;
  onTrailerPlay: () => void;
  onTrailerReady: (e: { target?: { playVideo?: () => Promise<void> } }) => void;
}

/**
 * Base layer of the hero: the poster/backdrop image, the YouTube trailer
 * iframe, and the gradient shadows. Memoized so the heavy image/iframe
 * subtree does not re-render on every countdown tick.
 */
const HeroBackdrop = React.memo(function HeroBackdrop({
  randomShow,
  trailer,
  showTrailer,
  trailerFinished,
  imageRef,
  youtubeRef,
  defaultOptions,
  onTrailerEnd,
  onTrailerPlay,
  onTrailerReady,
}: HeroBackdropProps) {
  return (
    <div className="absolute inset-0 h-[100vw] sm:h-[56.25vw] w-full mask-t-from-60% mask-t-to-100% mask-b-from-50% mask-b-to-95% bg-neutral-950 overflow-hidden">
      <CustomImage
        ref={imageRef}
        src={`https://image.tmdb.org/t/p/original${randomShow?.backdrop_path ?? randomShow?.poster_path ?? ''
          }`}
        alt={randomShow?.title ?? 'poster'}
        className="z-0 h-auto w-full object-cover transition-opacity duration-500"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 100vw, 33vw"
        fill
        preload
      />
      {trailer && showTrailer && !trailerFinished && (
        <Youtube
          opts={defaultOptions}
          onEnd={onTrailerEnd}
          onPlay={onTrailerPlay}
          ref={youtubeRef}
          onReady={onTrailerReady}
          videoId={trailer}
          id="hero-trailer"
          title={
            randomShow?.title ?? randomShow?.name ?? 'hero-trailer'
          }
          className="absolute inset-0 z-0 h-full w-full scale-[1.35] origin-center"
          style={{ width: '100%', height: '100%' }}
          iframeClassName="absolute inset-0 w-full h-[85%] md:h-full z-10 pointer-events-none"
        />
      )}
      {/* shadows */}
      <div className="absolute inset-0 right-[26.09%] bg-linear-to-r from-neutral-900 to-85% opacity-71"></div>
      <div className="absolute right-0 bottom-[-1.1px] left-0 h-[14.7vw] bg-linear-to-b from-neutral-900/0 from-30% via-neutral-900/30 via-50% to-neutral-900 to-80%"></div>
      {/* shadows end */}
    </div>
  );
});

export default HeroBackdrop;
