'use client';
import { usePreviewModalStore } from '@/stores/preview-modal';
import { useModalStore } from '@/stores/modal';
import {
  MediaType,
  type Show,
  type Genre,
  type KeyWord,
  type ShowWithGenreAndVideo,
  type VideoResult,
} from '@/types';
import { getMobileDetect } from '@/lib/utils';
import MovieService from '@/services/MovieService';
import CustomImage from './custom-image';
import Youtube from 'react-youtube';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import * as React from 'react';
import { getNameFromShow, getSlug } from '@/lib/utils';

const userAgent =
  typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;
const { isMobile } = getMobileDetect(userAgent);
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
    playsinline: 1,
    cc_load_policy: 0,
    modestbranding: 3,
  },
};

const PreviewModal = () => {
  const p = usePreviewModalStore();
  const modal = useModalStore();
  const IS_MOBILE = isMobile();
  const [isMuted, setIsMuted] = React.useState(IS_MOBILE);
  const [options, setOptions] = React.useState(defaultOptions);
  const youtubeRef = React.useRef(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  const detailedShow = p.detailedShow;

  const trailer = React.useMemo(() => {
    if (!detailedShow?.videos?.results) return '';
    return (
      detailedShow.videos.results.find((v: VideoResult) => v.type === 'Trailer')
        ?.key ?? ''
    );
  }, [detailedShow]);

  const isAnime = React.useMemo(() => {
    const keywords: KeyWord[] =
      (detailedShow as any)?.keywords?.results ||
      (detailedShow as any)?.keywords?.keywords;
    return !!keywords?.find((k) => k.name === 'anime');
  }, [detailedShow]);

  React.useEffect(() => {
    if (p.isOpen && p.show) {
      const type = p.show.media_type === MediaType.TV ? 'tv' : 'movie';
      p.fetchPreviewData(p.show.id, type);
    }
  }, [p.isOpen, p.show?.id]);

  // Close preview when the main show modal opens
  React.useEffect(() => {
    if (!modal.isOpen) return;
    p.reset();
  }, [modal.isOpen]);

  const handleCloseModal = () => {
    p.reset();
  };

  const handleChangeMute = () => {
    setIsMuted((m) => !m);
    const videoRef: any = youtubeRef.current;
    if (!videoRef) return;
    if (isMuted) videoRef.internalPlayer.unMute();
    else videoRef.internalPlayer.mute();
  };

  const handleHref = () => {
    if (!p.show?.id) return '#';
    const type = isAnime
      ? 'anime'
      : p.show?.media_type === MediaType.MOVIE
        ? 'movie'
        : 'tv';
    let id = `${p.show.id}`;
    if (isAnime)
      id = `${p.show?.media_type === MediaType.MOVIE ? 'm' : 't'}-${id}`;
    return `/watch/${type}/${id}`;
  };

  const getRuntime = () =>
    detailedShow?.media_type === MediaType.TV
      ? detailedShow.number_of_seasons
        ? `${detailedShow.number_of_seasons} Seasons`
        : null
      : detailedShow?.runtime
        ? `${detailedShow.runtime} min`
        : null;

  const getQuality = () => ((p.show?.vote_average || 0) >= 8 ? 'HD' : 'SD');

  const getGenres = () =>
    detailedShow?.genres
      ?.slice(0, 3)
      .map((g) => g.name)
      .join(' • ') ?? '';

  // animate in/out on show change
  const [animKey, setAnimKey] = React.useState<string>('');
  React.useEffect(() => {
    if (p.show) {
      setAnimKey(`${p.show.id}-${Date.now()}`);
    }
  }, [p.show]);

  // Stop trailer when preview closes
  React.useEffect(() => {
    const videoRef: any = youtubeRef.current;
    if (!videoRef?.internalPlayer) return;
    if (!p.isOpen) {
      try {
        videoRef.internalPlayer.stopVideo?.();
        videoRef.internalPlayer.seekTo?.(0);
      } catch {}
      if (imageRef.current) imageRef.current.style.opacity = '1';
    }
  }, [p.isOpen]);

  // Close preview on any scroll start (wheel, scroll, touchmove)
  React.useEffect(() => {
    if (!p.isOpen) return;
    const close = () => {
      p.setIsActive(false);
      p.setIsOpen(false);
      p.setAnchorRect(null);
      p.setShow(null);
      p.reset();
    };
    const onWheel = () => close();
    const onScroll = () => close();
    const onTouchMove = () => close();
    window.addEventListener('wheel', onWheel, { passive: true, capture: true });
    window.addEventListener('scroll', onScroll, {
      passive: true,
      capture: true,
    });
    window.addEventListener('touchmove', onTouchMove, {
      passive: true,
      capture: true,
    });
    return () => {
      window.removeEventListener(
        'wheel',
        onWheel,
        true as unknown as EventListenerOptions,
      );
      window.removeEventListener(
        'scroll',
        onScroll,
        true as unknown as EventListenerOptions,
      );
      window.removeEventListener(
        'touchmove',
        onTouchMove,
        true as unknown as EventListenerOptions,
      );
    };
  }, [p.isOpen]);

  // Close preview modal on navigation or window minimize
  React.useEffect(() => {
    if (!p.isOpen) return;

    const close = () => {
      p.setIsActive(false);
      p.setIsOpen(false);
      p.setAnchorRect(null);
      p.setShow(null);
      p.reset();
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
  }, [p.isOpen]);

  if (!p.isOpen || !p.show) return null;

  // Calculate position based on anchor rect
  const getPosition = () => {
    const rect = p.anchorRect;
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

  const handleMoreDetails = () => {
    if (!p.show) return;
    const current = p.show;
    const name = getNameFromShow(current);
    const path: string =
      current.media_type === MediaType.TV ? 'tv-shows' : 'movies';
    const videoRef: any = youtubeRef.current;
    try {
      videoRef?.internalPlayer?.pauseVideo?.();
      videoRef?.internalPlayer?.stopVideo?.();
    } catch {}
    // Open the main modal on the next frame for smoother transition
    requestAnimationFrame(() => {
      window.history.pushState(
        null,
        '',
        `${path}/${getSlug(current.id, name)}`,
      );
      useModalStore.setState({ show: current, isOpen: true, play: true });
    });
  };

  const handleTrailerPlay = () => {
    if (imageRef.current) {
      imageRef.current.style.opacity = '0';
    }
  };

  const handleTrailerEnd = (e: any) => {
    try {
      if (e?.target && typeof e.target.seekTo === 'function') {
        e.target.seekTo(0);
      }
    } catch {}
  };

  const handleTrailerReady = (e: any) => {
    try {
      if (e?.target && typeof e.target.playVideo === 'function') {
        e.target.playVideo();
      }
    } catch {}
  };

  // console.log(detailedShow);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      aria-label="Preview overlay"
      onMouseEnter={() => p.setIsActive(true)}
      onMouseLeave={() => {
        p.setIsActive(false);
        p.setIsOpen(false);
        p.setAnchorRect(null);
        p.setShow(null);
        handleCloseModal();
      }}>
      <div
        key={animKey}
        className="animate-in fade-in-0 zoom-in-95 pointer-events-auto absolute w-80 max-w-[90vw] duration-150 will-change-transform"
        style={getPosition()}
        onWheel={() => {
          p.setIsActive(false);
          p.setIsOpen(false);
          p.setAnchorRect(null);
          p.setShow(null);
          p.reset();
        }}>
        <div className="overflow-hidden rounded-xl bg-neutral-900 shadow-lg shadow-black">
          <div className="group relative aspect-video">
            <CustomImage
              fill
              preload
              ref={imageRef}
              alt={p?.show?.title ?? 'poster'}
              className="z-1 h-auto w-full object-cover"
              src={`https://image.tmdb.org/t/p/original${p.show?.backdrop_path ?? p.show?.poster_path}`}
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
                title={p.show?.title ?? p.show?.name ?? 'hero-trailer'}
                className="z-0 h-full w-full"
                style={{ width: '100%', height: '100%' }}
                iframeClassName="w-full h-full z-10"
              />
            )}
            {detailedShow?.logoPath && (
              <div className="pointer-events-none absolute bottom-2 left-2 z-20 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100">
                <img
                  src={`https://image.tmdb.org/t/p/w500${detailedShow.logoPath}`}
                  alt={p.show.title ?? p.show.name ?? 'logo'}
                  className="h-auto max-h-12 w-auto max-w-[80%] object-contain"
                />
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
                {p.show.title || p.show.name}
              </h1>
              <span className="text-xs font-medium text-white">
                {p.show?.release_date || detailedShow?.release_date}
              </span>
              <span className="rounded border px-1 py-0.5 text-[11px] font-bold text-white">
                {detailedShow?.media_type === MediaType.MOVIE
                  ? (() => {
                      const runtime = detailedShow?.runtime;
                      if (!runtime) return 'N/A';
                      const hours = Math.floor(runtime / 60);
                      const minutes = runtime % 60;
                      return hours > 0
                        ? `${hours}h ${minutes}m`
                        : `${minutes}m`;
                    })()
                  : detailedShow?.media_type === MediaType.TV
                    ? `${detailedShow?.number_of_seasons} Season${detailedShow?.number_of_seasons !== 1 ? 's' : ''} • ${detailedShow?.number_of_episodes} Episode${detailedShow?.number_of_episodes !== 1 ? 's' : ''}`
                    : (() => {
                        // Fallback to basic show data if detailedShow is not available
                        const show = p.show;
                        if (show?.media_type === MediaType.MOVIE) {
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
                        <img
                          key={index}
                          src={`https://image.tmdb.org/t/p/w92${network.logo_path}`}
                          alt={network.name || 'Network logo'}
                          className="h-4 w-auto object-contain"
                        />
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

export default PreviewModal;
