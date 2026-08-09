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
  isCountdownActive: boolean;
  isMuted: boolean;
  showControls: boolean;
  isPaused: boolean;
  showTextElements: boolean;
}

const initialState: HeroState = {
  showTrailer: false,
  trailerFinished: false,
  isCountdownActive: false,
  isMuted: true,
  showControls: false,
  isPaused: false,
  showTextElements: true,
};

type HeroAction =
  | { type: 'RESET_SHOW' }
  | { type: 'START_COUNTDOWN' }
  | { type: 'COUNTDOWN_DONE' }
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
        isCountdownActive: false,
        showTrailer: false,
      };
    case 'START_COUNTDOWN':
      if (state.isCountdownActive) return state;
      return { ...state, isCountdownActive: true };
    case 'COUNTDOWN_DONE':
      if (state.showTrailer) return state;
      return {
        ...state,
        isCountdownActive: false,
        showTrailer: true,
      };
    case 'TRAILER_PLAY':
      if (state.showControls) return state;
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
      if (state.isPaused === action.paused) return state;
      return { ...state, isPaused: action.paused };
    case 'SHOW_TEXT':
      if (state.showTextElements) return state;
      return { ...state, showTextElements: true };
    case 'HIDE_TEXT':
      if (!state.showTextElements) return state;
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
    isCountdownActive,
    isMuted,
    showControls,
    isPaused,
    showTextElements,
  } = state;
  const youtubeRef = React.useRef<Youtube | null>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const countdownTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const textHideTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  // Mirrors the latest `showTrailer`/`playerReady` so the preload strategy can
  // start playback the instant the countdown finishes without stale closures.
  const showTrailerRef = React.useRef(false);
  const playerReadyRef = React.useRef(false);

  const reduxDispatch = useAppDispatch();
  const previewModalIsOpen = useAppSelector((state) => state.previewModal.isOpen);
  const hoverModalIsOpen = useAppSelector((state) => state.hoverModal.isOpen);
  const utils = trpc.useUtils();

  const defaultOptions = React.useMemo(
    () => ({
      playerVars: {
        rel: 0,
        mute: 1,      // required for browser autoplay policy (allows muted autoplay)
        loop: 0,
        autoplay: 0,  // disabled — we control playback explicitly (preload strategy)
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        playsinline: 1,
        modestbranding: 1, // 0/1 only; 3 is not honored by YT
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

  // Keep refs in sync so callbacks can read current state without stale closures
  React.useEffect(() => {
    showTrailerRef.current = showTrailer;
  });

  // Preload play trigger: when the countdown ends (showTrailer flips true), kick
  // off playback on the preloaded player if it's already ready.  If the player
  // isn't ready yet, `handleTrailerReady` will pick up the play call.
  React.useEffect(() => {
    if (showTrailer && !trailerFinished && playerReadyRef.current) {
      const player = youtubeRef.current as {
        internalPlayer?: { playVideo?: () => Promise<void> };
      } | null;
      if (player?.internalPlayer) {
        try {
          player.internalPlayer.playVideo?.()?.catch?.(() => {});
        } catch {}
      }
    }
  }, [showTrailer, trailerFinished]);

  // Reset states when randomShow changes
  React.useEffect(() => {
    if (randomShow?.id) {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      dispatch({ type: 'RESET_SHOW' });
      if (textHideTimerRef.current) {
        clearTimeout(textHideTimerRef.current);
      }
    }
  }, [randomShow?.id]);

  // Start countdown when trailer is available and not finished
  React.useEffect(() => {
    if (trailer && !isCountdownActive && !trailerFinished && !showTrailer) {
      dispatch({ type: 'START_COUNTDOWN' });
      countdownTimerRef.current = setTimeout(() => {
        countdownTimerRef.current = null;
        dispatch({ type: 'COUNTDOWN_DONE' });
      }, count * 1000);
    }
  }, [trailer, trailerFinished, isCountdownActive, showTrailer]);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
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

  const handleTrailerPlay = React.useCallback(() => {
    if (imageRef.current) {
      imageRef.current.style.opacity = '0';
    }
    dispatch({ type: 'TRAILER_PLAY' });

    // Start 10-second timer to hide text elements — but only once.  react-youtube
    // fires onPlay on every PLAYING state change (including resume after buffering),
    // which would otherwise restart the timer repeatedly.
    if (textHideTimerRef.current) return;
    textHideTimerRef.current = setTimeout(() => {
      textHideTimerRef.current = null;
      dispatch({ type: 'HIDE_TEXT' });
    }, 10000);
  }, []);

  const handleTrailerEnd = React.useCallback(() => {
    dispatch({ type: 'TRAILER_END' });
    // Clear the pending text-hide timer so it can't fire after the trailer ends
    if (textHideTimerRef.current) {
      clearTimeout(textHideTimerRef.current);
      textHideTimerRef.current = null;
    }
    if (imageRef.current) {
      imageRef.current.style.opacity = '1';
    }
  }, []);

  const handleTrailerReady = React.useCallback((e: { target?: { playVideo?: () => Promise<void> } }) => {
    playerReadyRef.current = true;
    // If the countdown has already completed when the player becomes ready,
    // play immediately (covers the non-preloaded / slow-network case).
    // Otherwise the preload-play effect will trigger play when showTrailer flips true.
    if (showTrailerRef.current) {
      try {
        if (e?.target && typeof e.target.playVideo === 'function') {
          e.target.playVideo()?.catch?.(() => {});
        }
      } catch {}
    }
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

  const playHref = React.useMemo(() => {
    if (!randomShow) return '#';
    if (!path.includes('/anime')) {
      const type = randomShow.media_type === MediaType.MOVIE ? 'movie' : 'tv';
      return `/watch/${randomShow.id}?type=${type}`;
    }
    const prefix = randomShow.media_type === MediaType.MOVIE ? 'm' : 't';
    return `/watch/${prefix}-${randomShow.id}?type=anime`;
  }, [randomShow, path]);

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
                playHref={playHref}
                onMoreInfo={handleMoreInfo}
                onToggleMute={handleChangeMute}
                onReplay={handleReplayTrailer}
              />
              {/* end text details */}

              {/* Timer */}
              {isCountdownActive && <HeroCountdown />}
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
