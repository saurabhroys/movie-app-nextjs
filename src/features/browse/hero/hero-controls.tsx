'use client';
import * as React from 'react';
import { Icons } from '@/components/shared/icons';
import { Button } from '@/components/ui/button';

interface HeroControlsProps {
  showControls: boolean;
  trailerFinished: boolean;
  isMuted: boolean;
  contentRating?: string | null;
  onToggleMute: () => void;
  onReplay: () => void;
}

/**
 * Right-hand side hero controls: mute/unmute toggle (or replay once the
 * trailer ends) plus the content rating badge. Memoized leaf.
 */
const HeroControls = React.memo(function HeroControls({
  showControls,
  trailerFinished,
  isMuted,
  contentRating,
  onToggleMute,
  onReplay,
}: HeroControlsProps) {
  return (
    <div className="flex flex-row items-center gap-2">
      {showControls && (
        <div className="flex cursor-pointer items-center sm:mr-5 sm:gap-2">
          {!trailerFinished ? (
            <Button
              aria-label={`${isMuted ? 'Unmute' : 'Mute'} video`}
              className="h-7 w-7 rounded-full bg-black/70 p-0 text-white/50 ring-1 ring-white/50 transition-all duration-500 hover:bg-white/20 hover:text-white hover:ring-white sm:h-10 sm:w-10 sm:ring-2"
              onClick={onToggleMute}>
              {isMuted ? (
                <Icons.volumeMute className="h-3.5 w-3.5 md:h-7 md:w-7" />
              ) : (
                <Icons.volume className="h-3.5 w-3.5 md:h-7 md:w-7" />
              )}
            </Button>
          ) : (
            <Button
              aria-label="Replay trailer"
              className="h-7 w-7 rounded-full bg-black/70 p-0 text-white/50 ring-1 ring-white/50 transition-all duration-500 hover:bg-white/20 hover:text-white hover:ring-white sm:h-10 sm:w-10 sm:ring-2"
              onClick={onReplay}>
              <Icons.replay className="h-3.5 w-3.5 md:h-7 md:w-7" />
            </Button>
          )}
        </div>
      )}
      <div className="flex h-7 w-16 md:h-10 md:w-25 items-center justify-start border-l-2 border-white bg-black/30 px-2 text-xs backdrop-blur-sm sm:h-10 sm:w-25 sm:border-l-3 sm:p-3 sm:text-lg">
        {contentRating ?? 'NA'}
      </div>
    </div>
  );
});

export default HeroControls;
