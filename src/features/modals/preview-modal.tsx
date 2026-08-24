import { X } from 'lucide-react';
import { getYear } from '@/lib/utils';
// import { getNameFromShow, getSlug } from '@/lib/slug';
import { trpc } from '@/client/trpc';
import { observer, use$ } from '@legendapp/state/react';
import { previewModal$, previewModalActions, fetchDetailedShow } from '@/state/preview-modal';
import { useRouter } from 'next/navigation';
import {
  type KeyWord,
  type VideoResult,
  type Show,
  type Episode,
} from '@/services/tmdb/types';
import * as React from 'react';
import type Youtube from 'react-youtube';
import PreviewTrailerPane, { type YouTubeEvent } from './preview-trailer-pane';
import PreviewCastList from './preview-cast-list';
import PreviewSeasonSelector from './preview-season-selector';
import PreviewRecommendations from './preview-recommendations';
import PreviewCollection from './preview-collection';
import PreviewAbout from './preview-about';
import { Dialog, DialogDescription } from '@radix-ui/react-dialog';

const defaultOptions: Record<string, object> = {
  playerVars: {
    // https://developers.google.com/youtube/player_parameters
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
    modestbranding: 1,
  },
};

const PreviewModal = () => {
  const isOpen = use$(previewModal$.isOpen);
  const show = use$(previewModal$.show);
  const detailedShow = use$(previewModal$.detailedShow);
  const isLoading = use$(previewModal$.isLoading);
  const utils = trpc.useUtils();

  const router = useRouter();

  const [isMuted, setIsMuted] = React.useState<boolean>(false);
  const options = defaultOptions;
  const youtubeRef = React.useRef<Youtube | null>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const [trailerFinished, setTrailerFinished] = React.useState<boolean>(false);
  const [logoTransition, setLogoTransition] = React.useState<
    'initial' | 'trailer-playing' | 'trailer-ended'
  >('initial');
  const [selectedSeason, setSelectedSeason] = React.useState<number>(1);
  const [seasonEpisodes, setSeasonEpisodes] = React.useState<Episode[]>([]);

  const trailer = React.useMemo(() => {
    if (!detailedShow?.videos?.results) return '';
    return detailedShow.videos.results.find((v: VideoResult) => v.type === 'Trailer')?.key ?? '';
  }, [detailedShow]);

  const isAnime = React.useMemo(() => {
    return !!detailedShow?.keywords?.find((k: KeyWord) => k.name === 'anime');
  }, [detailedShow]);

  React.useEffect(() => {
    if (isOpen && show) {
      setIsMuted(false);
      void fetchDetailedShow({ id: show.id, mediaType: show.media_type });
    }
  }, [isOpen, show?.id]);

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
    previewModalActions.reset();
  }, []);

  // Lock body scroll and listen for ESC key when modal is open
  React.useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleCloseModal]);

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
    setTimeout(() => {
      if (imageRef.current) {
        imageRef.current.style.opacity = '0';
      }
    }, 3000);
    if (youtubeRef.current) {
      const iframeRef: HTMLElement | null =
        document.getElementById('video-trailer');
      if (iframeRef) iframeRef.classList.remove('opacity-0');
    }
  };

  const onReady = (event: YouTubeEvent) => {
    try {
      if (event?.target) {
        if (typeof event.target.unMute === 'function') {
          event.target.unMute();
        }
        if (typeof event.target.playVideo === 'function') {
          event.target.playVideo()?.catch?.(() => {});
        }
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

  const navigateToMovie = (movieId: number) => {
    // Avoid history.back() to ensure navigation happens
    previewModalActions.reset();
    router.push(`/watch/${movieId}?type=movie`);
  };

  const navigateToEpisode = (seasonNumber: number, episodeNumber: number) => {
    // Avoid history.back() to ensure navigation happens
    if (!show?.id) return;
    previewModalActions.reset();
    router.push(
      `/watch/${show.id}?type=tv&season=${seasonNumber}&episode=${episodeNumber}`,
    );
  };

  const navigateToItem = (item: Show) => {
    previewModalActions.reset();
    const type = (item.media_type as string) === 'movie' ? 'movie' : 'tv';
    router.push(`/watch/${item.id}?type=${type}`);
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
      <div
        className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/75 backdrop-blur-xs p-4 md:p-10 duration-300 animate-in fade-in-0"
        onClick={handleCloseModal}>
        <div
          id="content"
          className="relative my-auto w-full max-w-4xl overflow-hidden rounded-xl border-none bg-neutral-900 p-0 text-left align-middle shadow-2xl duration-300 animate-in zoom-in-95 sm:max-w-3xl lg:max-w-4xl"
          onClick={(e) => e.stopPropagation()}>
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
    </Dialog>
  );
};

export default observer(PreviewModal);
