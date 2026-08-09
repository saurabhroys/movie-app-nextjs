'use client';

import {
  Dialog,
  DialogDescription,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { getMobileDetect, getYear } from '@/lib/utils';
import { trpc } from '@/client/trpc';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { reset as previewReset } from '@/features/modals/previewModalSlice';
import { fetchDetailedShow } from '@/features/modals/previewModalThunks';
import { useLockBody } from '@/hooks/use-lock-body';
import {
  type KeyWord,
  type VideoResult,
  type Show,
  type Episode,
} from '@/services/tmdb/types';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import type Youtube from 'react-youtube';
import PreviewTrailerPane, { type YouTubeEvent } from './preview-trailer-pane';
import PreviewCastList from './preview-cast-list';
import PreviewSeasonSelector from './preview-season-selector';
import PreviewRecommendations from './preview-recommendations';
import PreviewCollection from './preview-collection';
import PreviewAbout from './preview-about';

const userAgent =
  typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;
const { isMobile } = getMobileDetect(userAgent);
const defaultOptions: Record<string, object> = {
  playerVars: {
    // https://developers.google.com/youtube/player_parameters
    rel: 0,
    mute: isMobile() ? 1 : 0,
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
};

const PreviewModal = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.previewModal.isOpen);
  const show = useAppSelector((state) => state.previewModal.show);
  const detailedShow = useAppSelector((state) => state.previewModal.detailedShow);
  const firstLoad = useAppSelector((state) => state.previewModal.firstLoad);
  const isLoading = useAppSelector((state) => state.previewModal.isLoading);
  const utils = trpc.useUtils();

  const IS_MOBILE: boolean = isMobile();
  const router = useRouter();

  const [isMuted, setIsMuted] = React.useState<boolean>(
    firstLoad || IS_MOBILE,
  );
  const [options, setOptions] =
    React.useState<Record<string, object>>(defaultOptions);
  const youtubeRef = React.useRef<Youtube | null>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const [trailerFinished, setTrailerFinished] = React.useState<boolean>(false);
  const [logoTransition, setLogoTransition] = React.useState<
    'initial' | 'trailer-playing' | 'trailer-ended'
  >('initial');
  const [selectedSeason, setSelectedSeason] = React.useState<number>(1);
  const [seasonEpisodes, setSeasonEpisodes] = React.useState<Episode[]>([]);
  const isClosingRef = React.useRef(false);

  const trailer = React.useMemo(() => {
    if (!detailedShow?.videos?.results) return '';
    return detailedShow.videos.results.find((v: VideoResult) => v.type === 'Trailer')?.key ?? '';
  }, [detailedShow]);

  const isAnime = React.useMemo(() => {
    return !!detailedShow?.keywords?.find((k: KeyWord) => k.name === 'anime');
  }, [detailedShow]);

  React.useEffect(() => {
    if (isOpen && show) {
      dispatch(fetchDetailedShow({ id: show.id, mediaType: show.media_type }));
    }
  }, [isOpen, show?.id]);

  React.useEffect(() => {
    if (firstLoad || IS_MOBILE) {
      setOptions((state: Record<string, object>) => ({
        ...state,
        playerVars: { ...state.playerVars, mute: 1 },
      }));
    }
  }, [firstLoad, IS_MOBILE]);

  // Initial fetch for Season 1 episodes when opening a TV show
  React.useEffect(() => {
    if (
      isOpen &&
      (show?.media_type as string) === 'tv' &&
      detailedShow?.seasons?.length
    ) {
      // Default to season 1 or the first available season number
      const defaultSeason = detailedShow.seasons[0]?.season_number || 1;
      setSelectedSeason(defaultSeason);
      handleSeasonChange(defaultSeason);
    }
  }, [isOpen, show?.media_type, detailedShow?.id]); // depend on detailedShow.id to trigger only when data is ready

  const handleCloseModal = React.useCallback(() => {
    if (isClosingRef.current || !isOpen) return;
    isClosingRef.current = true;
    dispatch(previewReset());
    if (!show || firstLoad) {
      window.history.pushState(null, '', '/');
    } else {
      window.history.back();
    }
    setTimeout(() => {
      isClosingRef.current = false;
    }, 100);
  }, [isOpen, show, firstLoad, dispatch]);

  const onEnd = () => {
    setTrailerFinished(true);
    setLogoTransition('trailer-ended');
    if (imageRef.current) {
      imageRef.current.style.opacity = '1';
    }
  };

  const onPlay = () => {
    setTrailerFinished(false);
    setLogoTransition('trailer-playing');
    if (imageRef.current) {
      imageRef.current.style.opacity = '0';
    }
    if (youtubeRef.current) {
      const iframeRef: HTMLElement | null =
        document.getElementById('video-trailer');
      if (iframeRef) iframeRef.classList.remove('opacity-0');
    }
  };

  const onReady = (event: YouTubeEvent) => {
    try {
      if (event?.target && typeof event.target.playVideo === 'function') {
        event.target.playVideo()?.catch?.(() => {});
      }
    } catch { }
  };

  const handleChangeMute = () => {
    setIsMuted((state: boolean) => !state);
    if (!youtubeRef.current) return;
    const videoRef = youtubeRef.current as {
      internalPlayer?: {
        mute?: () => Promise<void>;
        unMute?: () => Promise<void>;
      };
    } | null;
    try {
      if (isMuted && videoRef?.internalPlayer) {
        videoRef.internalPlayer.unMute?.()?.catch?.(() => {});
      } else if (videoRef?.internalPlayer) {
        videoRef.internalPlayer.mute?.()?.catch?.(() => {});
      }
    } catch { }
  };

  const handleReplay = () => {
    setTrailerFinished(false);
    setLogoTransition('trailer-playing');
    if (!youtubeRef.current) return;
    const videoRef = youtubeRef.current as {
      internalPlayer?: {
        seekTo?: (seconds: number) => Promise<void>;
        playVideo?: () => Promise<void>;
      };
    } | null;
    try {
      if (videoRef?.internalPlayer) {
        videoRef.internalPlayer.seekTo?.(0)?.catch?.(() => {});
        videoRef.internalPlayer.playVideo?.()?.catch?.(() => {});
      }
    } catch {
      // noop
    }
    if (imageRef.current) {
      imageRef.current.style.opacity = '0';
    }
  };

  const handleSeasonChange = async (seasonNumber: number) => {
    if (!show?.id) return;
    setSelectedSeason(seasonNumber);
    try {
      const seasonData = await utils.movie.getSeasons.fetch({
        id: show.id,
        season: seasonNumber,
      });
      setSeasonEpisodes(seasonData.episodes || []);
    } catch (error) {
      console.error('Failed to fetch season episodes:', error);
    }
  };

  const loadingRecommended = isLoading;

  const handleHref = (): string => {
    const type = isAnime
      ? 'anime'
      : (show?.media_type as string) === 'movie'
        ? 'movie'
        : 'tv';
    let id = `${show?.id}`;
    if (isAnime) {
      const prefix: string =
        (show?.media_type as string) === 'movie' ? 'm' : 't';
      id = `${prefix}-${id}`;
    }
    return `/watch/${id}?type=${type}`;
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const contentEl = document.getElementById('content');
    if (!contentEl) return;
    if (e.target instanceof Node && contentEl.contains(e.target)) {
      return;
    }
    e.stopPropagation(); // Prevent Dialog's onOpenChange from firing
    handleCloseModal();
  };

  const navigateToMovie = (movieId: number) => {
    // Avoid history.back() to ensure navigation happens
    dispatch(previewReset());
    router.push(`/watch/${movieId}?type=movie`);
  };

  const navigateToEpisode = (seasonNumber: number, episodeNumber: number) => {
    // Avoid history.back() to ensure navigation happens
    if (!show?.id) return;
    dispatch(previewReset());
    router.push(
      `/watch/${show.id}?type=tv&season=${seasonNumber}&episode=${episodeNumber}`,
    );
  };

  const navigateToItem = (item: Show) => {
    dispatch(previewReset());
    const type = (item.media_type as string) === 'movie' ? 'movie' : 'tv';
    router.push(`/watch/${item.id}?type=${type}`);
  };

  const BodyScrollLock = () => {
    useLockBody();
    return null;
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleCloseModal();
        }
      }}
      aria-label="Modal containing show's details">
      {isOpen && <BodyScrollLock />}
      <div
        className="'bg-black/20 data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-0 z-50 backdrop-blur-[1px]"
        onClick={handleOverlayClick}>
        <div className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 translate-all fixed top-[50%] left-[50%] z-50 grid h-full w-full translate-x-[-50%] translate-y-[-50%] overflow-y-auto py-10 duration-500 disabled:pointer-events-none">
          <div className="flex justify-center">
            <div
              id="content"
              className="relative w-full overflow-y-auto rounded-md border-none bg-neutral-900 p-0 text-left align-middle ring-0 sm:max-w-3xl lg:max-w-4xl">
              <PreviewTrailerPane
                show={show}
                detailedShow={detailedShow}
                trailer={trailer}
                isMuted={isMuted}
                trailerFinished={trailerFinished}
                logoTransition={logoTransition}
                options={options}
                imageRef={imageRef}
                youtubeRef={youtubeRef}
                playHref={handleHref()}
                onEnd={onEnd}
                onPlay={onPlay}
                onReady={onReady}
                onToggleMute={handleChangeMute}
                onReplay={handleReplay}
              />

              {/* Two Column Layout */}
              <div className="relative z-40 -mt-10 flex flex-wrap md:flex-nowrap w-full gap-4 px-4 md:px-10 pb-10">
                <div className="w-full md:w-3/4">
                  {/* Movie Details Row */}
                  <div className="flex items-center space-x-2 text-sm">
                    {/* Release Year */}
                    {show?.release_date ? (
                      <p className="text-sm font-bold text-slate-200">
                        {getYear(show?.release_date)}
                      </p>
                    ) : show?.first_air_date ? (
                      <p className="text-sm font-bold text-slate-200">
                        {getYear(show?.first_air_date)}
                      </p>
                    ) : null}

                    {/* Duration */}
                    {detailedShow?.runtime && (
                      <p className="text-sm font-bold text-slate-200">
                        {Math.floor(detailedShow.runtime / 60)}h {detailedShow.runtime % 60}m
                      </p>
                    )}
                    {/* Seasons (TV only) */}
                    {(show?.media_type as string) === 'tv' &&
                      (() => {
                        const count = detailedShow?.number_of_seasons ?? show?.number_of_seasons ?? null;
                        return typeof count === 'number' && count > 0 ? (
                          <p className="text-sm font-bold text-slate-200">
                            {count} {count === 1 ? 'Season' : 'Seasons'}
                          </p>
                        ) : null;
                      })()}

                    {/* Quality Badge */}
                    <span className="place-items-center rounded-[3px] border border-neutral-500 px-1.5 py-0 text-[10px] font-semibold text-neutral-300">
                      HD
                    </span>

                    {/* Language */}
                    {show?.original_language && (
                      <span className="place-items-center rounded-[3px] border border-neutral-500 px-1.5 py-0 text-[10px] font-bold text-neutral-300">
                        {show.original_language.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Age Rating */}
                    <span className="w-9 place-items-center border border-neutral-400 px-[0.4rem] text-center text-[12px] font-bold text-neutral-200">
                      {detailedShow?.contentRating ?? '16+'}
                    </span>
                    {/* KeyWords */}
                    <span className="text-sm text-slate-50">
                      {detailedShow?.keywords && detailedShow.keywords.length > 0
                        ? detailedShow.keywords
                          .slice(0, 3)
                          .map((keyword) => keyword.name)
                          .join(', ')
                        : 'content warning'}
                    </span>
                  </div>

                  {/* Description */}
                  <DialogDescription className="pt-5 text-[15px] leading-relaxed text-slate-50">
                    {show?.overview ?? '-'}
                  </DialogDescription>
                </div>

                <PreviewCastList detailedShow={detailedShow} />
              </div>

              {/* Movie Collection Section */}
              <PreviewCollection
                collection={detailedShow?.collection}
                onMovieClick={navigateToMovie}
              />

              {/* TV Seasons Section */}
              <PreviewSeasonSelector
                show={show}
                detailedShow={detailedShow}
                selectedSeason={selectedSeason}
                seasonEpisodes={seasonEpisodes}
                onSeasonChange={handleSeasonChange}
                onEpisodeClick={navigateToEpisode}
              />

              {/* More like this */}
              <PreviewRecommendations
                detailedShow={detailedShow}
                loadingRecommended={loadingRecommended}
                onShowClick={navigateToItem}
              />

              {/* About Section */}
              <PreviewAbout show={show} detailedShow={detailedShow} />

              <button
                className="absolute top-4 right-4 z-30 cursor-pointer rounded-full bg-black p-1 text-slate-50 opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseModal();
                }}>
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default PreviewModal;
