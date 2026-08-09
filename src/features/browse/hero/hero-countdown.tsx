'use client';
import * as React from 'react';

interface HeroCountdownProps {
  countdown: number;
}

/**
 * Countdown badge shown before the hero trailer auto-plays.
 * Pure leaf — memoized so it only re-renders when the countdown value changes.
 */
const HeroCountdown = React.memo(function HeroCountdown({
  countdown,
}: HeroCountdownProps) {
  return (
    <div
      className="absolute flex items-center gap-2"
      style={{
        top: '50%',
        right: '3vw',
        zIndex: '999',
      }}>
      <div className="z-50 flex items-center justify-center rounded-lg bg-black/50 px-2 py-1.5 text-white backdrop-blur-md sm:rounded-xl sm:px-3 sm:py-2">
        <span className="z-50 text-sm font-bold text-white sm:text-lg">
          Trailer - {countdown}
        </span>
      </div>
    </div>
  );
});

export default HeroCountdown;
