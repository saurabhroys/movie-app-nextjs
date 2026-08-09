'use client';
import * as React from 'react';
import { Icons } from '@/components/shared/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { type Show } from '@/services/tmdb/types';
import CustomImage from '@/components/shared/custom-image';
import HeroControls from './hero-controls';

interface HeroTextOverlayProps {
  randomShow: Show;
  logoPath?: string | null;
  contentRating?: string | null;
  showTextElements: boolean;
  showControls: boolean;
  trailerFinished: boolean;
  isMuted: boolean;
  playHref: string;
  onMoreInfo: () => void;
  onToggleMute: () => void;
  onReplay: () => void;
}

/**
 * Foreground text/details of the hero: show logo (or title), match %
 * metadata, overview, and the Play / More Info / mute-replay controls.
 * Memoized leaf.
 */
const HeroTextOverlay = React.memo(function HeroTextOverlay({
  randomShow,
  logoPath,
  contentRating,
  showTextElements,
  showControls,
  trailerFinished,
  isMuted,
  playHref,
  onMoreInfo,
  onToggleMute,
  onReplay,
}: HeroTextOverlayProps) {
  return (
    <div className="absolute right-0 bottom-[35%] md:bottom-[30%] left-0 z-10 w-full pl-[4%] pb-4 sm:pb-0 2xl:pl-[60px]">
      <div className="">
        {/* Show logo when trailer is playing, otherwise show title */}
        <div className="flex w-[30.87vw] flex-col justify-end gap-4 space-y-2">
          {logoPath ? (
            <div
              className={` ${showTextElements
                  ? 'h-auto w-[30.87vw]'
                  : 'h-auto w-[26.46vw]'
                }`}
              style={{
                transformOrigin: 'left bottom',
                transform: showTextElements
                  ? 'scale(1) translate3d(0px, 0px, 0px)'
                  : 'scale(0.8) translate3d(0px, 0px, 0px)',
                transitionDuration: '1300ms',
                transitionDelay: '0ms',
              }}>
              <CustomImage
                src={`https://image.tmdb.org/t/p/original${logoPath}`}
                alt={`${randomShow?.title ?? randomShow?.name} logo`}
                className="h-auto w-full object-contain"
                width={showTextElements ? 500 : 200}
                height={showTextElements ? 250 : 100}
              />
            </div>
          ) : (
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl xl:text-[3vw]">
              {randomShow?.title ?? randomShow?.name}
            </h1>
          )}

          {/* Show text elements when showTextElements is true */}
          <div
            className={`overflow-hidden ${showTextElements ? 'max-h-96' : 'max-h-0'
              }`}
            style={{
              transform: showTextElements
                ? 'translate3d(0px, 0px, 0px)'
                : 'translate3d(0px, 24px, 0px)',
              transitionDuration: '1300ms',
              transitionDelay: '0ms',
              opacity: showTextElements ? 1 : 0,
            }}>
            <div className="flex space-x-2 text-[2vw] font-semibold md:text-[1.2vw]">
              <p className="text-green-600">
                {Math.round(randomShow?.vote_average * 10) ?? '-'}%
                Match
              </p>
              <p>{randomShow?.release_date ?? '-'}</p>
            </div>
            <p className="hidden text-[1.2vw] sm:line-clamp-3">
              {randomShow?.overview ?? '-'}
            </p>
          </div>
        </div>

        {/* Combined controls with justify-between */}
        <div className="mt-[1.5vw] flex w-full items-center justify-between">
          {/* Left side - Play and More Info buttons */}
          <div className="flex items-center gap-2 sm:space-x-2">
            <Link prefetch={false} href={playHref}>
              <Button
                aria-label="Play video"
                className="h-7 shrink-0 gap-1.5 rounded-lg px-2 text-xs sm:h-auto sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm">
                <Icons.play
                  className="h-3 w-3 fill-current md:h-7 md:w-7"
                  aria-hidden="true"
                />
                Play
              </Button>
            </Link>
            <Button
              aria-label="Open show's details modal"
              variant="outline"
              className="h-7 shrink-0 gap-1.5 rounded-lg bg-neutral-900/60 px-2 text-xs backdrop-blur-md sm:h-auto sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm"
              onClick={onMoreInfo}>
              <Icons.info className="h-3 w-3 md:h-7 md:w-7" aria-hidden="true" />
              More Info
            </Button>
          </div>

          {/* Right side - Mute/Replay button */}
          <HeroControls
            showControls={showControls}
            trailerFinished={trailerFinished}
            isMuted={isMuted}
            contentRating={contentRating}
            onToggleMute={onToggleMute}
            onReplay={onReplay}
          />
          {/* buttons end */}
        </div>
      </div>
    </div>
  );
});

export default HeroTextOverlay;
