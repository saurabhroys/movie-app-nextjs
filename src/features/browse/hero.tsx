'use client';
import {
  getIdFromSlug,
  getNameFromShow,
  getSlug,
} from '@/lib/slug';
import { trpc } from '@/client/trpc';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  openPreviewModal,
  reset as previewReset,
} from '@/features/modals/previewModalSlice';
import {
  MediaType,
  type Show,
} from '@/services/tmdb/types';
import React from 'react';
import { usePathname } from 'next/navigation';
import type Youtube from 'react-youtube';
import HeroBackdrop from './hero/hero-backdrop';
import HeroTextOverlay from './hero/hero-text-overlay';
import HeroCountdown from './hero/hero-countdown';

interface HeroProps {
  randomShow: Show | null;
  trailer?: string | null;
  logoPath?: string | null;
  contentRating?: string | null;
}

const count = 1;

interface HeroState {
  showTrailer: boolean;
  trailerFinished: boolean;
  countdown: number;
  isCountdownActive: boolean;
  isMuted: boolean;
  showControls: boolean;
  isPaused: boolean;
  showTextElements: boolean;
}

const initialState: HeroState = {
  showTrailer: false,
  trailerFinished: false,
  countdown: count,
  isCountdownActive: false,
  isMuted: true,
  showControls: false,
  isPaused: false,
  showTextElements: true,
};

type HeroAction =
  | { type: 'RESET_SHOW' }
  | { type: 'START_COUNTDOWN' }
  | { type: 'TICK' }
  | { type: 'TRAILER_PLAY' }
  | { type: 'TRAILER_END' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_PAUSED'; paused: boolean }
  | { type: 'SHOW_TEXT' }
  | { type: 'HIDE_TEXT' }
  | { type: 'REPLAY' };

function heroReducer(state: HeroState, action: HeroAction): HeroState {
  switch (action.type) {
    case 'RESET_SHOW':
      return {
        ...state,
        trailerFinished: false,
        showControls: false,
        isPaused: false,
        showTextElements: true,
      };
    case 'START_COUNTDOWN':
      return { ...state, isCountdownActive: true, countdown: count };
    case 'TICK':
      if (state.countdown <= 1) {
        return {
          ...state,
          countdown: 0,
          isCountdownActive: false,
          showTrailer: true,
        };
      }
      return { ...state, countdown: state.countdown - 1 };
    case 'TRAILER_PLAY':
      return { ...state, showControls: true };
    case 'TRAILER_END':
      return {
        ...state,
        trailerFinished: true,
        showTrailer: false,
        showTextElements: true,
      };
    case 'TOGGLE_MUTE':
      return { ...state, isMuted: !state.isMuted };
    case 'SET_PAUSED':
      return { ...state, isPaused: action.paused };
    case 'SHOW_TEXT':
      return { ...state, showTextElements: true };
    case 'HIDE_TEXT':
      return { ...state, showTextElements: false };
    case 'REPLAY':
      return {
        ...state,
        trailerFinished: false,
        showTrailer: true,
        showControls: true,
        isPaused: false,
        showTextElements: true,
      };
    default:
      return state;
  }
}

const Hero = ({ randomShow, trailer = null, logoPath = null, contentRating = null }: HeroProps) => {
  const path = usePathname();
  const [state, dispatch] = React.useReducer(heroReducer, initialState);
  const {
    showTrailer,
    trailerFinished,
    countdown,
    isCountdownActive,
    isMuted,
    showControls,
    isPaused,
    showTextElements,
  } = state;
  const youtubeRef = React.useRef<Youtube | null>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const countdownRef = React.useRef<NodeJS.Timeout | null>(null);
  const textHideTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const reduxDispatch = useAppDispatch();
  const previewModalIsOpen = useAppSelector((state) => state.previewModal.isOpen);
  const hoverModalIsOpen = useAppSelector((state) => state.hoverModal.isOpen);
  const utils = trpc.useUtils();

  const defaultOptions = React.useMemo(
    () => ({
      playerVars: {
        rel: 0,
        mute: 0,
        loop: 0,
        autoplay: 1,
        controls: 0,
        showinfo: 0,
        disablekb: 1,
        enablejsapi: 1,
        playsinline: 1,
        cc_load_policy: 0,
        modestbranding: 3,
      },
    }),
    [],
  );

  const handlePopstateEvent = React.useCallback(() => {
    const pathname = window.location.pathname;
    if (!/\d/.test(pathname)) {
      reduxDispatch(previewReset());
    } else if (/\d/.test(pathname)) {
      const mediaId: number = getIdFromSlug(pathname);
      if (!mediaId) {
        return;
      }
      const mediaType =
        pathname.includes('/tv-shows') ? MediaType.TV : MediaType.MOVIE;
      utils.movie.getShow
        .fetch({ id: mediaId, mediaType })
        .then((data: Show) => {
          reduxDispatch(openPreviewModal({ show: data, play: true }));
        })
        .catch((error) => {
          console.error(`getShow: `, error);
        });
    }
  }, [reduxDispatch, utils]);

  React.useEffect(() => {
    window.addEventListener('popstate', handlePopstateEvent, false);
    return () => {
      window.removeEventListener('popstate', handlePopstateEvent, false);
    };
  }, [handlePopstateEvent]);

  // Reset states when randomShow changes
  React.useEffect(() => {
    if (randomShow?.id) {
      dispatch({ type: 'RESET_SHOW' });
      if (textHideTimerRef.current) {
        clearTimeout(textHideTimerRef.current);
      }
    }
  }, [randomShow?.id]);

  // Start countdown when trailer is available and not finished
  React.useEffect(() => {
    if (trailer && !isCountdownActive && !trailerFinished) {
      startCountdown();
    }
  }, [trailer, trailerFinished]);

  // Clear countdown interval once the countdown deactivates
  React.useEffect(() => {
    if (!isCountdownActive && countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, [isCountdownActive]);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (textHideTimerRef.current) {
        clearTimeout(textHideTimerRef.current);
      }
    };
  }, []);

  // Pause hero trailer when any modal (detail or preview) is open, and resume when closed
  React.useEffect(() => {
    const videoRef = youtubeRef.current as {
      internalPlayer?: {
        pauseVideo?: () => Promise<void>;
        playVideo?: () => Promise<void>;
      };
    } | null;
    const isAnyModalOpen = previewModalIsOpen || hoverModalIsOpen;
    if (isAnyModalOpen) {
      if (videoRef?.internalPlayer && showTrailer && !trailerFinished) {
        try {
          videoRef.internalPlayer.pauseVideo?.()?.catch?.(() => {});
        } catch { }
        dispatch({ type: 'SET_PAUSED', paused: true });
      }
      return;
    }
    // Resume trailer when modal closes
    if (
      videoRef?.internalPlayer &&
      showTrailer &&
      !trailerFinished &&
      isPaused
    ) {
      try {
        videoRef.internalPlayer.playVideo?.()?.catch?.(() => {});
      } catch { }
      dispatch({ type: 'SET_PAUSED', paused: false });
    }
  }, [previewModalIsOpen, hoverModalIsOpen, showTrailer, trailerFinished]);

  const startCountdown = React.useCallback(() => {
    dispatch({ type: 'START_COUNTDOWN' });
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    countdownRef.current = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);
  }, []);

  const handleTrailerPlay = React.useCallback(() => {
    if (imageRef.current) {
      imageRef.current.style.opacity = '0';
    }
    dispatch({ type: 'TRAILER_PLAY' });

    // Start 10-second timer to hide text elements
    textHideTimerRef.current = setTimeout(() => {
      dispatch({ type: 'HIDE_TEXT' });
    }, 10000);
  }, []);

  const handleTrailerEnd = React.useCallback(() => {
    dispatch({ type: 'TRAILER_END' });
    if (imageRef.current) {
      imageRef.current.style.opacity = '1';
    }
  }, []);

  const handleTrailerReady = React.useCallback((e: { target?: { playVideo?: () => Promise<void> } }) => {
    try {
      if (e?.target && typeof e.target.playVideo === 'function') {
        e.target.playVideo()?.catch?.(() => {});
      }
    } catch { }
  }, []);

  const handleChangeMute = React.useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' });
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
  }, [isMuted]);

  const handleReplayTrailer = React.useCallback(() => {
    dispatch({ type: 'REPLAY' });

    // Clear existing timers and start new ones
    if (textHideTimerRef.current) {
      clearTimeout(textHideTimerRef.current);
    }

    textHideTimerRef.current = setTimeout(() => {
      dispatch({ type: 'HIDE_TEXT' });
    }, 10000);

    if (imageRef.current) {
      imageRef.current.style.opacity = '0';
    }
  }, []);

  const handleMoreInfo = React.useCallback(() => {
    if (!randomShow) return;
    const name = getNameFromShow(randomShow);
    const pathname: string =
      randomShow.media_type === MediaType.TV
        ? 'tv-shows'
        : 'movies';
    window.history.pushState(
      null,
      '',
      `/${pathname}/${getSlug(randomShow.id, name)}`,
    );
    reduxDispatch(openPreviewModal({ show: randomShow, play: true }));
  }, [randomShow, reduxDispatch]);

  const searchQuery = useAppSelector((state) => state.search.query);

  if (searchQuery.length > 0) {
    return null;
  }

  const handleHref = (): string => {
    if (!randomShow) {
      return '#';
    }
    if (!path.includes('/anime')) {
      const type = randomShow.media_type === MediaType.MOVIE ? 'movie' : 'tv';
      return `/watch/${randomShow.id}?type=${type}`;
    }
    const prefix: string =
      randomShow?.media_type === MediaType.MOVIE ? 'm' : 't';
    const id = `${prefix}-${randomShow.id}`;
    return `/watch/${id}?type=anime`;
  };

  return (
    <>
      <section aria-label="Hero" className="static w-full">
        {randomShow && (
          <>
            {/* player or poster */}
            <div className="absolute inset-0 h-[100vw] sm:h-[56.25vw] w-full">
              <HeroBackdrop
                randomShow={randomShow}
                trailer={trailer}
                showTrailer={showTrailer}
                trailerFinished={trailerFinished}
                imageRef={imageRef}
                youtubeRef={youtubeRef}
                defaultOptions={defaultOptions}
                onTrailerEnd={handleTrailerEnd}
                onTrailerPlay={handleTrailerPlay}
                onTrailerReady={handleTrailerReady}
              />

              {/* text details, Title and buttons */}
              <HeroTextOverlay
                randomShow={randomShow}
                logoPath={logoPath}
                contentRating={contentRating}
                showTextElements={showTextElements}
                showControls={showControls}
                trailerFinished={trailerFinished}
                isMuted={isMuted}
                playHref={handleHref()}
                onMoreInfo={handleMoreInfo}
                onToggleMute={handleChangeMute}
                onReplay={handleReplayTrailer}
              />
              {/* end text details */}

              {/* Timer */}
              {isCountdownActive && <HeroCountdown countdown={countdown} />}
              {/* timer end */}
            </div>
            {/* player end */}
          </>
        )}
      </section>

      <div className="relative inset-0 -z-10 mb-5 pb-[60%] sm:pb-[40%]"></div>
    </>
  );
};

export default Hero;
