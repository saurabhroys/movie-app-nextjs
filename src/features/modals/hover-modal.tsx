'use client';
import { observer, use$ } from '@legendapp/state/react';
import {
  hoverModal$,
  hoverModalActions,
  fetchPreviewData,
} from '@/state/hover-modal';
import { previewModal$, previewModalActions } from '@/state/preview-modal';
import {
  type KeyWord,
  type VideoResult,
  type MediaType,
} from '@/services/tmdb/types';
import CustomImage from '@/components/shared/custom-image';
import Youtube from 'react-youtube';
import { Icons } from '@/components/shared/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// import { useRouter } from 'next/navigation';
import * as React from 'react';

const defaultOptions = {
  playerVars: {
    rel: 0,
    mute: 0,
    loop: 1,
    autoplay: 1,
    controls: 0,
    showinfo: 0,
    disablekb: 1,
    enablejsapi: 1,
    playsinline: 0,
    cc_load_policy: 0,
    modestbranding: 0,
  },
};

const PreviewModal = () => {
  // const router = useRouter();
  const isOpen = use$(hoverModal$.isOpen);
  const show = use$(hoverModal$.show);
  const detailedShow = use$(hoverModal$.detailedShow);
  const anchorRect = use$(hoverModal$.anchorRect);
  const previewModalIsOpen = use$(previewModal$.isOpen);
  const [isMuted, setIsMuted] = React.useState(false);
  const youtubeRef = React.useRef(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  const trailer = React.useMemo(() => {
    if (!detailedShow?.videos?.results) return '';
    return (
      detailedShow.videos.results.find((v: VideoResult) => v.type === 'Trailer')
        ?.key ?? ''
    );
  }, [detailedShow]);

  const isAnime = React.useMemo(() => {
    const keywords = (
      (detailedShow as unknown as { keywords?: { results?: KeyWord[]; keywords?: KeyWord[] } })?.keywords?.results ||
      (detailedShow as unknown as { keywords?: { results?: KeyWord[]; keywords?: KeyWord[] } })?.keywords?.keywords
    );
    return !!keywords?.find((k) => k.name === 'anime');
  }, [detailedShow]);

  React.useEffect(() => {
    if (isOpen && show) {
      const type = (show.media_type as string) === 'tv' ? 'tv' : 'movie';
      void fetchPreviewData({ id: show.id, mediaType: type as MediaType });
    }
  }, [isOpen, show?.id]);

  // Close preview when the main show modal opens
  React.useEffect(() => {
    if (!previewModalIsOpen) return;
    hoverModalActions.reset();
  }, [previewModalIsOpen]);

  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  // Schedule a close when the user's pointer leaves the visible modal
  // surface. The card's mouseleave timer also runs, but it's only armed
  // when the user leaves the card, so we need a parallel timer here for
  // the case where the user moves from the card onto the modal and then
  // away from the modal entirely.
  const handleModalMouseLeave = () => {
    hoverModalActions.setIsActive(false);
    cancelCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      // Only close if the pointer didn't re-enter a hover zone (card or
      // modal) while this timer was pending. The card's mouseenter sets
      // isActive back to true, so if the user moved from the modal onto a
      // card, the pending close is skipped.
      if (hoverModal$.isActive.get()) return;
      hoverModalActions.reset();
    }, 300);
  };

  const handleModalMouseEnter = () => {
    cancelCloseTimer();
    hoverModalActions.setIsActive(true);
  };

  const handleChangeMute = () => {
    setIsMuted((m) => !m);
    const videoRef = youtubeRef.current as {
      internalPlayer?: {
        mute?: () => Promise<void>;
        unMute?: () => Promise<void>;
      };
    } | null;
    if (!videoRef?.internalPlayer) return;
    try {
      if (isMuted) videoRef.internalPlayer.unMute?.()?.catch?.(() => {});
      else videoRef.internalPlayer.mute?.()?.catch?.(() => {});
    } catch { }
  };

  const handleHref = () => {
    if (!show?.id) return '#';
    const type = isAnime
      ? 'anime'
      : (show?.media_type as string) === 'movie'
        ? 'movie'
        : 'tv';
    let id = `${show.id}`;
    if (isAnime)
      id = `${(show?.media_type as string) === 'movie' ? 'm' : 't'}-${id}`;
    return `/watch/${id}?type=${type}`;
  };

  const getRuntime = () => {
    if (!detailedShow) return null;
    return (detailedShow.media_type as string) === 'tv'
      ? detailedShow.number_of_seasons
        ? `${detailedShow.number_of_seasons} Seasons`
        : null
      : detailedShow.runtime
        ? `${detailedShow.runtime} min`
        : null;
  };

  const getQuality = () => ((show?.vote_average || 0) >= 8 ? 'HD' : 'SD');

  const getGenres = () =>
    detailedShow?.genres
      ?.slice(0, 3)
      .map((g) => g.name)
      .join(' • ') ?? '';

  // animate in/out on show change
  const [animKey, setAnimKey] = React.useState<string>('');
  React.useEffect(() => {
    if (show) {
      setAnimKey(`${show.id}-${Date.now()}`);
    }
  }, [show]);

  // Stop trailer when preview closes
  React.useEffect(() => {
    const videoRef = youtubeRef.current as {
      internalPlayer?: {
        stopVideo?: () => Promise<void>;
        seekTo?: (seconds: number) => Promise<void>;
      };
    } | null;
    if (!videoRef?.internalPlayer) return;
    if (!isOpen) {
      try {
        videoRef.internalPlayer.stopVideo?.()?.catch?.(() => {});
        videoRef.internalPlayer.seekTo?.(0)?.catch?.(() => {});
      } catch { }
      if (imageRef.current) imageRef.current.style.opacity = '1';
    }
  }, [isOpen]);

  // Close preview on any scroll start (wheel, scroll, touchmove). Attached
  // to both window and document (capture, passive) so any scroll anywhere on
  // the page instantly dismisses the hover modal.
  React.useEffect(() => {
    if (!isOpen) return;
    const close = () => {
      hoverModalActions.reset();
    };
    const onWheel = () => close();
    const onScroll = () => close();
    const onTouchMove = () => close();
    const captureOpts: AddEventListenerOptions = {
      passive: true,
      capture: true,
    };
    for (const target of [window, document]) {
      target.addEventListener('wheel', onWheel, captureOpts);
      target.addEventListener('scroll', onScroll, captureOpts);
      target.addEventListener('touchmove', onTouchMove, captureOpts);
    }
    return () => {
      for (const target of [window, document]) {
        target.removeEventListener('wheel', onWheel, true);
        target.removeEventListener('scroll', onScroll, true);
        target.removeEventListener('touchmove', onTouchMove, true);
      }
    };
  }, [isOpen]);

  // Close preview modal on navigation or window minimize
  React.useEffect(() => {
    if (!isOpen) return;

    const close = () => {
      hoverModalActions.reset();
    };

    // Close on navigation (popstate event)
    const handlePopState = () => close();

    // Close on window visibility change (minimize/restore)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        close();
      }
    };

    // Close on beforeunload (page unload)
    const handleBeforeUnload = () => close();

    // Close on focus loss (when user switches tabs/apps)
    const handleBlur = () => close();

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isOpen]);

  // Clean up the modal-level close timer on unmount/close so we don't
  // dispatch a reset after the component is gone.
  React.useEffect(() => {
    return () => {
      cancelCloseTimer();
    };
  }, []);

  if (!isOpen || !show) return null;

  // Calculate position based on anchor rect
  const getPosition = () => {
    const rect = anchorRect;
    if (!rect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    const modalWidth = 320; // w-80
    const modalHeight = 220; // approx
    const y = Math.max(8, rect.top - modalHeight * 0.4);
    let x = rect.left + rect.width / 2 - modalWidth / 2;
    x = Math.max(8, Math.min(x, window.innerWidth - modalWidth - 8));
    return { top: `${Math.round(y)}px`, left: `${Math.round(x)}px` };
  };

  const handleMoreDetails = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!show) return;
    const current = show;
    const videoRef = youtubeRef.current as {
      internalPlayer?: {
        pauseVideo?: () => Promise<void>;
        stopVideo?: () => Promise<void>;
      };
    } | null;
    try {
      videoRef?.internalPlayer?.pauseVideo?.()?.catch?.(() => {});
      videoRef?.internalPlayer?.stopVideo?.()?.catch?.(() => {});
    } catch { }
    // Close the hover modal synchronously so it doesn't stack on top of
    // the preview modal for a frame during the route transition.
    hoverModalActions.reset();
    previewModalActions.openPreviewModal({ show: current, play: true });
  };

  const handleTrailerPlay = () => {
    // setTimeout(() => {
      if (imageRef.current) {
        imageRef.current.style.opacity = '0';
      }
    // }, 4000);
  };

  const handleTrailerEnd = (e: { target?: { seekTo?: (seconds: number) => Promise<void> } }) => {
    try {
      if (e?.target && typeof e.target.seekTo === 'function') {
        e.target.seekTo(0);
      }
    } catch { }
  };

  const handleTrailerReady = (e: { target?: { playVideo?: () => Promise<void>, unloadModule?: (module: string) => void } }) => {
    try {
      if (e?.target) {
        if (typeof e.target.playVideo === 'function') {
          e.target.playVideo()?.catch?.(() => {});
        }
        if (typeof e.target.unloadModule === 'function') {
          e.target.unloadModule('captions');
          e.target.unloadModule('cc');
        }
      }
    } catch { }
  };

  // console.log(detailedShow);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      aria-label="Preview overlay">
      <div
        key={animKey}
        className="animate-in fade-in-0 zoom-in-95 pointer-events-auto absolute w-80 max-w-[90vw] duration-150 will-change-transform"
        style={getPosition()}
        onMouseEnter={handleModalMouseEnter}
        onMouseLeave={handleModalMouseLeave}
        onWheel={() => {
          hoverModalActions.reset();
        }}>
        <div className="overflow-hidden rounded-xl bg-neutral-900 shadow-lg shadow-black">
          <div className="group relative aspect-video overflow-hidden">
            <CustomImage
              fill
              preload
              ref={imageRef}
              alt={show?.title ?? 'poster'}
              className="z-1 h-auto w-full object-cover"
              src={`https://image.tmdb.org/t/p/original${show?.backdrop_path ?? show?.poster_path}`}
              sizes="50vw"
            />
            {trailer && (
              <Youtube
                opts={defaultOptions}
                onEnd={handleTrailerEnd}
                onPlay={handleTrailerPlay}
                ref={youtubeRef}
                onReady={handleTrailerReady}
                videoId={trailer}
                id="hero-trailer"
                title={show?.title ?? show?.name ?? 'hero-trailer'}
                className="z-0 h-full w-full"
                style={{ width: '100%', height: '100%' }}
                iframeClassName="w-full h-full z-10 pointer-events-none"
              />
            )}
            {detailedShow?.logoPath && (
              <div className="pointer-events-none absolute bottom-2 left-2 z-20 w-full max-w-[80%] opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100">
                <div className="relative h-12 w-full">
                  <CustomImage
                    className='h-auto max-h-12 w-auto max-w-[80%]'
                    src={`https://image.tmdb.org/t/p/w500${detailedShow.logoPath}`}
                    alt={show.title ?? show.name ?? 'logo'}
                    style={{
                      objectFit: 'contain',
                      objectPosition: 'left',
                    }}
                    fill
                  />
                </div>
              </div>
            )}

            <Link
              href={handleHref()}
              className="absolute inset-0 z-10 bg-linear-to-t from-neutral-900 via-neutral-900/20 to-transparent"></Link>

            <div className="pointer-events-auto absolute bottom-2 flex w-full items-center justify-between gap-2 px-2">
              <div className="flex items-center gap-2"></div>
              <Button
                aria-label={`${isMuted ? 'Unmute' : 'Mute'} video`}
                className="z-10 h-7 w-7 rounded-full border border-white/30 bg-neutral-950/50 p-0 text-white transition-all duration-200 hover:scale-105 hover:bg-white/20"
                onClick={handleChangeMute}>
                {isMuted ? (
                  <Icons.volumeMute className="h-4 w-4" />
                ) : (
                  <Icons.volume className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <a className="cursor-pointer px-3" onClick={handleMoreDetails}>
            <div className="w-full px-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    aria-label="Play show"
                    className="group h-7 w-7 rounded-full bg-white p-0 text-black transition-all duration-200 hover:scale-105 hover:bg-neutral-200"
                    onClick={() => {
                      window.location.href = handleHref();
                    }}>
                    <Icons.play className="h-4 w-4 fill-current" />
                  </Button>
                  {getRuntime() && (
                    <span className="text-xs font-medium text-white">
                      {getRuntime()}
                    </span>
                  )}
                  <span className="rounded border px-1 py-0.5 text-[8px] font-bold text-white">
                    {getQuality()}
                  </span>
                  <span className="rounded border px-1 py-0.5 text-[8px] font-bold text-white">
                    {detailedShow?.contentRating ?? ''}
                  </span>
                </div>

                <Button
                  className="h-7 w-7 rounded-full border border-white/30 bg-black/50 p-0 text-white transition-all duration-200 hover:scale-105 hover:bg-white/20"
                  onClick={handleMoreDetails}
                  data-tooltip="More details">
                  <Icons.chevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-300">
                {getGenres() && <span>{getGenres()}</span>}
              </div>
              <h1 className="text-md font-medium text-white">
                {show.title || show.name}
              </h1>
              <span className="text-xs font-medium text-white">
                {show?.release_date || detailedShow?.release_date}
              </span>
              <span className="rounded border px-1 py-0.5 text-[11px] font-bold text-white">
                {(detailedShow?.media_type as string) === 'movie'
                  ? (() => {
                    const runtime = detailedShow?.runtime;
                    if (!runtime) return 'N/A';
                    const hours = Math.floor(runtime / 60);
                    const minutes = runtime % 60;
                    return hours > 0
                      ? `${hours}h ${minutes}m`
                      : `${minutes}m`;
                  })()
                  : (detailedShow?.media_type as string) === 'tv'
                    ? `${detailedShow?.number_of_seasons} Season${detailedShow?.number_of_seasons !== 1 ? 's' : ''} • ${detailedShow?.number_of_episodes} Episode${detailedShow?.number_of_episodes !== 1 ? 's' : ''}`
                    : (() => {
                      // Fallback to basic show data if detailedShow is not available
                      if ((show?.media_type as string) === 'movie') {
                        const runtime = detailedShow?.runtime;
                        if (!runtime) return 'N/A';
                        const hours = Math.floor(runtime / 60);
                        const minutes = runtime % 60;
                        return hours > 0
                          ? `${hours}h ${minutes}m`
                          : `${minutes}m`;
                      }
                      return `${detailedShow?.number_of_seasons} Season${show?.number_of_seasons !== 1 ? 's' : ''} • ${detailedShow?.number_of_episodes} Episode${detailedShow?.number_of_episodes !== 1 ? 's' : ''}`;
                    })()}
              </span>
              {detailedShow?.networks && detailedShow?.networks.length > 0 && (
                <div className="absolute flex w-[95%] flex-row items-end justify-end gap-2 overflow-hidden pb-2">
                  {detailedShow?.networks.map(
                    (network, index) =>
                      network.logo_path && (
                        <div key={index} className="relative h-4 w-8">
                          <CustomImage
                            src={`https://image.tmdb.org/t/p/w92${network.logo_path}`}
                            alt={network.name || 'Network logo'}
                            style={{
                              objectFit: 'contain',
                            }}
                            fill
                          />
                        </div>
                      ),
                  )}
                </div>
              )}
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default observer(PreviewModal);
