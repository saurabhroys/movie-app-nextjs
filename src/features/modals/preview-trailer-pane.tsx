'use client';
import * as React from 'react';
import Youtube from 'react-youtube';
import Link from 'next/link';
import { Icons } from '@/components/shared/icons';
import { Button } from '@/components/ui/button';
import CustomImage from '@/components/shared/custom-image';
import type { Show } from '@/services/tmdb/types';
import type { DetailedShowInfo } from '@/redux/features/modals/detail-fetch-helper';

type YouTubePlayer = {
  mute: () => void;
  unMute: () => void;
  playVideo: () => Promise<void>;
  seekTo: (value: number) => void;
  container: HTMLDivElement;
  internalPlayer: YouTubePlayer;
};

export type YouTubeEvent = {
  target: YouTubePlayer;
};

export type LogoTransition = 'initial' | 'trailer-playing' | 'trailer-ended';

interface PreviewTrailerPaneProps {
  show: Show | null;
  detailedShow: DetailedShowInfo | null;
  trailer: string;
  isMuted: boolean;
  trailerFinished: boolean;
  logoTransition: LogoTransition;
  options: Record<string, object>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  youtubeRef: React.RefObject<Youtube | null>;
  playHref: string;
  onEnd: () => void;
  onPlay: () => void;
  onReady: (event: YouTubeEvent) => void;
  onToggleMute: () => void;
  onReplay: () => void;
}

/**
 * Trailer pane of the preview modal: backdrop poster, the autoplaying
 * YouTube trailer, the animated show logo, and the Play / mute-replay
 * controls overlaid on the bottom.
 */
const PreviewTrailerPane = ({
  show,
  detailedShow,
  trailer,
  isMuted,
  trailerFinished,
  logoTransition,
  options,
  imageRef,
  youtubeRef,
  playHref,
  onEnd,
  onPlay,
  onReady,
  onToggleMute,
  onReplay,
}: PreviewTrailerPaneProps) => {
  return (
    <div className="relative z-10 aspect-video overflow-hidden">
      <CustomImage
        fill
        preload
        ref={imageRef}
        alt={show?.title ?? 'poster'}
        className="z-1 h-auto w-full object-cover"
        src={`https://image.tmdb.org/t/p/original${show?.backdrop_path ??
          show?.poster_path
          }`}
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 100vw, 33vw"
      />
      {trailer && (
        <Youtube
          opts={options}
          onEnd={onEnd}
          onPlay={onPlay}
          ref={youtubeRef}
          onReady={onReady}
          videoId={trailer}
          id="video-trailer"
          title={
            show?.title ??
            show?.name ??
            'video-trailer'
          }
          className="relative aspect-video w-full"
          style={{ width: '100%', height: '100%' }}
          iframeClassName={`relative pointer-events-none w-full h-full -z-10 opacity-0`}
        />
      )}

      {/* Show logo with transition states */}
      {detailedShow?.logoPath && (
        <div
          className={`absolute z-30 flex items-center p-3 md:p-6 transition-all duration-[1500] ease-in-out ${logoTransition === 'initial' ||
              logoTransition === 'trailer-ended'
              ? 'inset-0 justify-center'
              : 'bottom-22 md:bottom-25 left-0 justify-start'
            }`}>
          <CustomImage
            src={`https://image.tmdb.org/t/p/original${detailedShow.logoPath}`}
            alt={`${show?.title ?? show?.name} logo`}
            className={`object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-[1500] ease-in-out ${logoTransition === 'initial' ||
                logoTransition === 'trailer-ended'
                ? 'h-auto max-w-[60%]'
                : 'h-auto max-w-[24%] md:max-w-[40%]'
              }`}
            width={
              logoTransition === 'initial' ||
                logoTransition === 'trailer-ended'
                ? 800
                : 400
            }
            height={
              logoTransition === 'initial' ||
                logoTransition === 'trailer-ended'
                ? 400
                : 200
            }
          />
        </div>
      )}

      <div className="absolute bottom-[-5px] z-10 h-full w-full bg-neutral-900 mask-t-from-9% mask-t-to-50%"></div>

      <div className="absolute bottom-14 md:bottom-20 z-30 flex w-full items-center justify-between gap-2 px-4 md:px-10">
        <div className="flex items-center gap-2.5">
          <Link href={playHref}>
            <Button
              aria-label={`${!trailerFinished ? 'Pause' : 'Play'} show`}
              className="group h-auto rounded-[9px] bg-neutral-50 py-1.5 text-black hover:bg-neutral-300">
              <>
                <Icons.play
                  className="mr-1.5 h-6 w-6 fill-current"
                  aria-hidden="true"
                />
                Play
              </>
            </Button>
          </Link>
        </div>
        {trailer &&
          (!trailerFinished ? (
            <button
              aria-label={`${isMuted ? 'Unmute' : 'Mute'} video`}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/70 p-0 text-white/50 ring-2 ring-white/50 transition-all duration-500 hover:bg-white/20 hover:text-white hover:ring-white"
              onClick={onToggleMute}>
              {isMuted ? (
                <Icons.volumeMute
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              ) : (
                <Icons.volume
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              )}
            </button>
          ) : (
            <button
              aria-label="Replay trailer"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/70 p-0 text-white/50 ring-2 ring-white/50 transition-all duration-500 hover:bg-white/20 hover:text-white hover:ring-white"
              onClick={onReplay}>
              <Icons.replay className="h-5 w-5" aria-hidden="true" />
            </button>
          ))}
      </div>
    </div>
  );
};

export default PreviewTrailerPane;
