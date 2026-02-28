'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { getMobileDetect, getYear } from '@/lib/utils';
import MovieService from '@/services/MovieService';
import { usePreviewModalStore } from '@/stores/preview-modal';
import { useLockBody } from '@/hooks/use-lock-body';
import {
  type KeyWord,
  MediaType,
  type Genre,
  type ShowWithGenreAndVideo,
  type VideoResult,
  type Show,
} from '@/types';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import * as React from 'react';
import Youtube from 'react-youtube';
import CustomImage from './custom-image';
import { ShowCard } from './shows-cards';
import ShowsSkeleton from './shows-skeleton';

type YouTubePlayer = {
  mute: () => void;
  unMute: () => void;
  playVideo: () => void;
  seekTo: (value: number) => void;
  container: HTMLDivElement;
  internalPlayer: YouTubePlayer;
};

type YouTubeEvent = {
  target: YouTubePlayer;
};

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
  // stores
  const modalStore = usePreviewModalStore();
  const IS_MOBILE: boolean = isMobile();
  const router = useRouter();

  const [isMuted, setIsMuted] = React.useState<boolean>(
    modalStore.firstLoad || IS_MOBILE,
  );
  const [options, setOptions] =
    React.useState<Record<string, object>>(defaultOptions);
  const youtubeRef = React.useRef(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const [trailerFinished, setTrailerFinished] = React.useState<boolean>(false);
  const [logoTransition, setLogoTransition] = React.useState<
    'initial' | 'trailer-playing' | 'trailer-ended'
  >('initial');
  const [selectedSeason, setSelectedSeason] = React.useState<number>(1);
  const [seasonEpisodes, setSeasonEpisodes] = React.useState<any[]>([]);
  const isClosingRef = React.useRef(false);

  const detailedShow = modalStore.detailedShow;
  const trailer = React.useMemo(() => {
    if (!detailedShow?.videos?.results) return '';
    return detailedShow.videos.results.find((v: VideoResult) => v.type === 'Trailer')?.key ?? '';
  }, [detailedShow]);

  const isAnime = React.useMemo(() => {
    return !!detailedShow?.keywords?.find((k: KeyWord) => k.name === 'anime');
  }, [detailedShow]);

  React.useEffect(() => {
    if (modalStore.isOpen && modalStore.show) {
      modalStore.fetchDetailedShow(modalStore.show.id, modalStore.show.media_type);
    }
  }, [modalStore.isOpen, modalStore.show?.id]);

  React.useEffect(() => {
    if (modalStore.firstLoad || IS_MOBILE) {
      setOptions((state: Record<string, object>) => ({
        ...state,
        playerVars: { ...state.playerVars, mute: 1 },
      }));
    }
  }, [modalStore.firstLoad, IS_MOBILE]);

  // Initial fetch for Season 1 episodes when opening a TV show
  React.useEffect(() => {
    if (
      modalStore.isOpen &&
      modalStore.show?.media_type === MediaType.TV &&
      detailedShow?.seasons?.length
    ) {
      // Default to season 1 or the first available season number
      const defaultSeason = detailedShow.seasons[0]?.season_number || 1;
      setSelectedSeason(defaultSeason);
      handleSeasonChange(defaultSeason);
    }
  }, [modalStore.isOpen, modalStore.show?.media_type, detailedShow?.id]); // depend on detailedShow.id to trigger only when data is ready

  const handleCloseModal = React.useCallback(() => {
    if (isClosingRef.current || !modalStore.isOpen) return;
    isClosingRef.current = true;
    modalStore.reset();
    if (!modalStore.show || modalStore.firstLoad) {
      window.history.pushState(null, '', '/');
    } else {
      window.history.back();
    }
    setTimeout(() => {
      isClosingRef.current = false;
    }, 100);
  }, [modalStore]);

  const onEnd = (event: YouTubeEvent) => {
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
        event.target.playVideo();
      }
    } catch { }
  };

  const handleChangeMute = () => {
    setIsMuted((state: boolean) => !state);
    if (!youtubeRef.current) return;
    const videoRef: YouTubePlayer = youtubeRef.current as YouTubePlayer;
    if (isMuted && videoRef.internalPlayer) {
      videoRef.internalPlayer.unMute?.();
    } else if (videoRef.internalPlayer) {
      videoRef.internalPlayer.mute?.();
    }
  };

  const handleReplay = () => {
    setTrailerFinished(false);
    setLogoTransition('trailer-playing');
    if (!youtubeRef.current) return;
    const videoRef: YouTubePlayer = youtubeRef.current as YouTubePlayer;
    try {
      if (videoRef.internalPlayer) {
        videoRef.internalPlayer.seekTo?.(0);
        videoRef.internalPlayer.playVideo?.();
      }
    } catch (e) {
      // noop
    }
    if (imageRef.current) {
      imageRef.current.style.opacity = '0';
    }
  };

  const handleSeasonChange = async (seasonNumber: number) => {
    if (!modalStore.show?.id) return;
    setSelectedSeason(seasonNumber);
    try {
      const seasonData = await MovieService.getSeasons(
        modalStore.show.id,
        seasonNumber,
      );
      setSeasonEpisodes(seasonData.data.episodes || []);
    } catch (error) {
      console.error('Failed to fetch season episodes:', error);
    }
  };

  const recommendedShows = modalStore.detailedShow?.recommendations || [];
  const loadingRecommended = modalStore.isLoading;

  const handleHref = (): string => {
    const type = isAnime
      ? 'anime'
      : modalStore.show?.media_type === MediaType.MOVIE
        ? 'movie'
        : 'tv';
    let id = `${modalStore.show?.id}`;
    if (isAnime) {
      const prefix: string =
        modalStore.show?.media_type === MediaType.MOVIE ? 'm' : 't';
      id = `${prefix}-${id}`;
    }
    return `/watch/${type}/${id}`;
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
    modalStore.reset();
    router.push(`/watch/movie/${movieId}`);
  };

  const navigateToEpisode = (seasonNumber: number, episodeNumber: number) => {
    // Avoid history.back() to ensure navigation happens
    const showId = modalStore.show?.id;
    if (!showId) return;
    modalStore.reset();
    router.push(
      `/watch/tv/${showId}?season=${seasonNumber}&episode=${episodeNumber}`,
    );
  };

  const navigateToShow = (show: Show) => {
    modalStore.reset();
    const type = show.media_type === MediaType.MOVIE ? 'movie' : 'tv';
    router.push(`/watch/${type}/${show.id}`);
  };

  const BodyScrollLock = () => {
    useLockBody();
    return null;
  };

  if (!modalStore.isOpen) return null;

  return (
    <Dialog
      open={modalStore.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleCloseModal();
        }
      }}
      aria-label="Modal containing show's details">
      {modalStore.isOpen && <BodyScrollLock />}
      <div
        className="'bg-black/20 data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-0 z-50 backdrop-blur-[1px]"
        onClick={handleOverlayClick}>
        <div className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 translate-all fixed top-[50%] left-[50%] z-50 grid h-full w-full translate-x-[-50%] translate-y-[-50%] overflow-y-auto py-10 duration-500 disabled:pointer-events-none">
          <div className="flex justify-center">
            <div
              id="content"
              className="relative w-full overflow-y-auto rounded-md border-none bg-neutral-900 p-0 text-left align-middle ring-0 sm:max-w-3xl lg:max-w-4xl">
              <div
                className="relative z-10 aspect-video"
              // style={{
              //   background: 'linear-gradient(0deg, #181818, transparent 100%)',
              //   opacity: 1,
              //   paddingBottom: 'calc(var(--spacing) * 1)'
              // }}
              >
                <CustomImage
                  fill
                  preload
                  ref={imageRef}
                  alt={modalStore?.show?.title ?? 'poster'}
                  className="z-1 h-auto w-full object-cover"
                  src={`https://image.tmdb.org/t/p/original${modalStore.show?.backdrop_path ??
                    modalStore.show?.poster_path
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
                      modalStore.show?.title ??
                      modalStore.show?.name ??
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
                      alt={`${modalStore.show?.title ?? modalStore.show?.name} logo`}
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
                    <Link href={handleHref()}>
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
                        onClick={handleChangeMute}>
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
                        onClick={handleReplay}>
                        <Icons.replay className="h-5 w-5" aria-hidden="true" />
                      </button>
                    ))}
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="relative z-40 -mt-10 flex flex-wrap md:flex-nowrap w-full gap-4 px-4 md:px-10 pb-10">
                <div className="w-full md:w-3/4">
                  {/* Title */}
                  {/* <DialogTitle className="text-lg leading-6 font-medium text-slate-50 sm:text-xl">
                  {modalStore.show?.title ?? modalStore.show?.name}
                </DialogTitle> */}

                  {/* Match percentage */}
                  {/* <div className="flex items-center space-x-2 text-sm sm:text-base">
                  <p className="font-semibold text-green-400">
                    {Math.round((Number(modalStore.show?.vote_average) / 10) * 100) ??
                      '-'}
                    % Match
                  </p>
                </div> */}

                  {/* Movie Details Row */}
                  <div className="flex items-center space-x-2 text-sm">
                    {/* Release Year */}
                    {modalStore.show?.release_date ? (
                      <p className="text-sm font-bold text-slate-200">
                        {getYear(modalStore.show?.release_date)}
                      </p>
                    ) : modalStore.show?.first_air_date ? (
                      <p className="text-sm font-bold text-slate-200">
                        {getYear(modalStore.show?.first_air_date)}
                      </p>
                    ) : null}

                    {/* Duration */}
                    {detailedShow?.runtime && (
                      <p className="text-sm font-bold text-slate-200">
                        {Math.floor(detailedShow.runtime / 60)}h {detailedShow.runtime % 60}m
                      </p>
                    )}
                    {/* Seasons (TV only) */}
                    {modalStore.show?.media_type === MediaType.TV &&
                      (() => {
                        const count = detailedShow?.number_of_seasons ?? modalStore.show?.number_of_seasons ?? null;
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
                    {modalStore.show?.original_language && (
                      <span className="place-items-center rounded-[3px] border border-neutral-500 px-1.5 py-0 text-[10px] font-bold text-neutral-300">
                        {modalStore.show.original_language.toUpperCase()}
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
                    {modalStore.show?.overview ?? '-'}
                  </DialogDescription>
                </div>

                <div className="flex w-full md:w-1/4 flex-col gap-3 text-sm text-neutral-400">
                  {/* Left Column */}
                  <div className="">
                    <div>
                      <span className="text-neutral-50">Cast: </span>
                      <span>
                        {detailedShow?.cast && detailedShow.cast.length > 0
                          ? `${detailedShow.cast.map((actor: any) => actor.name).slice(0, 5).join(', ')}, more`
                          : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="">
                    <div>
                      <span className="text-neutral-50">Genres: </span>
                      <span>
                        {detailedShow?.genres?.map((genre) => genre.name).join(', ') ?? '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Movie Collection Section */}
              {detailedShow?.collection &&
                modalStore.show?.media_type === MediaType.MOVIE && (
                  <div className="px-4 md:px-10 pb-6">
                    <div className="flex items-start justify-start gap-4">
                      <Icons.library />
                      <h3 className="mb-4 text-xl font-semibold text-white">
                        {detailedShow?.collection.name}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {detailedShow?.collection.parts?.map(
                        (movie: any, index: number) => (
                          <div
                            key={movie.id}
                            className="group flex cursor-pointer gap-3 rounded-lg bg-neutral-800 p-3 transition hover:bg-neutral-700/60"
                            onClick={() => navigateToMovie(movie.id)}>
                            <div className="relative h-24 w-16 shrink-0">
                              <CustomImage
                                src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                                alt={movie.title}
                                className="h-full w-full rounded object-cover"
                                width={64}
                                height={96}
                              />
                              <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40 opacity-0 transition group-hover:opacity-100">
                                <Icons.play className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-sm font-medium text-white">
                                {movie.title}
                              </h4>
                              <p className="mt-1 text-xs text-neutral-400">
                                {getYear(movie.release_date)}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                                {movie.overview}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* TV Seasons Section */}
              {detailedShow && modalStore.show?.media_type === MediaType.TV && (
                <div className="px-4 md:px-10 pb-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">
                      Episodes
                    </h3>
                    {detailedShow.seasons && detailedShow.seasons.length > 1 && (
                      <select
                        value={selectedSeason}
                        onChange={(e) =>
                          handleSeasonChange(Number(e.target.value))
                        }
                        className="rounded border border-neutral-600 bg-neutral-800 px-3 py-1 text-white">
                        {detailedShow.seasons.map((season: any) => (
                          <option
                            key={season.season_number}
                            value={season.season_number}>
                            Season {season.season_number}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {seasonEpisodes.length > 0 && (
                    <div className="space-y-3">
                      {seasonEpisodes.map((episode: any, index: number) => (
                        <div
                          key={episode.id}
                          className="group flex cursor-pointer gap-4 rounded-lg bg-neutral-800 p-4 transition hover:bg-neutral-700/60"
                          onClick={() =>
                            navigateToEpisode(
                              selectedSeason,
                              episode.episode_number,
                            )
                          }>
                          <div className="relative h-20 w-32 shrink-0">
                            <CustomImage
                              src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                              alt={episode.name}
                              className="h-full w-full rounded object-cover"
                              width={128}
                              height={80}
                            />
                            <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40 opacity-0 transition group-hover:opacity-100">
                              <Icons.play className="h-7 w-7 text-white" />
                            </div>
                            <div className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-xs text-white">
                              {Math.floor(episode.runtime / 60)}h{' '}
                              {episode.runtime % 60}m
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-sm font-medium text-white">
                                {episode.episode_number}
                              </span>
                              <span className="text-sm text-neutral-400">
                                {episode.name}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-sm text-neutral-300">
                              {episode.overview}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* More like this */}
              <div className="px-4 md:px-10 pb-6">
                <h3 className="mb-4 text-xl font-semibold text-white">
                  More like this
                </h3>
                {loadingRecommended ? (
                  <ShowsSkeleton classname="pl-0" />
                ) : recommendedShows.length === 0 ? (
                  <p className="text-sm text-neutral-400">
                    No recommendations available at the moment.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                    {recommendedShows.slice(0, 12).map((show) => {
                      const isTv = show.media_type === MediaType.TV;
                      const detail = (detailedShow?.recommendedDetails as any)?.[show.id];
                      const seasons = isTv
                        ? (detail?.number_of_seasons ??
                          show.number_of_seasons ??
                          null)
                        : null;
                      const runtimeMin = !isTv
                        ? (detail?.runtime ??
                          (typeof show.runtime === 'number'
                            ? (show.runtime as number)
                            : null))
                        : null;
                      const durationLabel = isTv
                        ? seasons != null
                          ? `${seasons} ${seasons === 1 ? 'Season' : 'Seasons'}`
                          : undefined
                        : runtimeMin != null
                          ? `${Math.floor(runtimeMin / 60)}h ${runtimeMin % 60}m`
                          : undefined;
                      const year = show.release_date
                        ? getYear(show.release_date)
                        : show.first_air_date
                          ? getYear(show.first_air_date)
                          : undefined;
                      return (
                        <div
                          key={show.id}
                          className="group overflow-hidden rounded-xl border border-neutral-700/60 bg-neutral-800 transition-colors hover:border-neutral-600">
                          <div
                            className="relative aspect-video cursor-pointer"
                            onClick={() => navigateToShow(show)}>
                            <img
                              src={
                                (show.backdrop_path ?? show.poster_path)
                                  ? `https://image.tmdb.org/t/p/w780${show.backdrop_path ?? show.poster_path}`
                                  : '/images/grey-thumbnail.jpg'
                              }
                              alt={show.title ?? show.name ?? 'poster'}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  '/images/grey-thumbnail.jpg';
                              }}
                            />
                            {/* Centered logo overlay */}
                            {(detailedShow?.recommendedLogos as any)?.[show.id] && (
                              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden px-2">
                                <img
                                  src={`https://image.tmdb.org/t/p/w500${(detailedShow?.recommendedLogos as any)?.[show.id]}`}
                                  alt={
                                    (show.title ??
                                      show.name ??
                                      'logo') as string
                                  }
                                  className="h-auto max-h-10 w-auto max-w-[85%] object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)] sm:max-h-12"
                                  onError={(e) => {
                                    (
                                      e.currentTarget as HTMLImageElement
                                    ).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            {/* Hover play icon */}
                            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 ring-2 ring-white/60 sm:h-12 sm:w-12">
                                <Icons.play className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                              </div>
                            </div>
                            {durationLabel && (
                              <div className="absolute top-2 right-2 z-30 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                                {durationLabel}
                              </div>
                            )}
                            <div className="absolute inset-0 z-10 bg-linear-to-t from-black/70 via-black/0 to-black/0"></div>
                          </div>
                          <div className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="place-items-center border border-neutral-500 px-1.5 py-0.5 text-[10px] font-bold text-neutral-200">
                                  {(show.vote_average ?? 0) >= 8
                                    ? '18+'
                                    : '16+'}
                                </span>
                                <span className="place-items-center rounded-[3px] border border-neutral-500 px-1.5 py-0 text-[10px] font-semibold text-neutral-300">
                                  HD
                                </span>
                                {year && (
                                  <span className="rounded-[3px] border border-neutral-500 px-1.5 py-0 text-[10px] font-semibold text-neutral-300">
                                    {year}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="mt-3 line-clamp-3 text-xs text-neutral-300">
                              {show.overview ?? ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* About Section */}
              <div className="px-4 md:px-10 pb-6">
                <h3 className="mb-3 text-xl font-semibold text-white">
                  About {modalStore.show?.title ?? modalStore.show?.name}
                </h3>
                <div className="space-y-2 text-sm">
                  {detailedShow?.directors && detailedShow.directors.length > 0 && (
                    <div className="text-neutral-300">
                      <span className="text-neutral-400">Director: </span>
                      <span className="text-neutral-200">
                        {detailedShow.directors.join(', ')}
                      </span>
                    </div>
                  )}
                  {detailedShow?.cast && detailedShow.cast.length > 0 && (
                    <div className="text-neutral-300">
                      <span className="text-neutral-400">Cast: </span>
                      <span className="text-neutral-200">
                        {detailedShow.cast
                          .map((a: any) => a.name)
                          .slice(0, 12)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  {detailedShow?.writers && detailedShow.writers.length > 0 && (
                    <div className="text-neutral-300">
                      <span className="text-neutral-400">Writer: </span>
                      <span className="text-neutral-200">
                        {detailedShow.writers.join(', ')}
                      </span>
                    </div>
                  )}
                  {detailedShow?.genres && detailedShow.genres.length > 0 && (
                    <div className="text-neutral-300">
                      <span className="text-neutral-400">Genres: </span>
                      <span className="text-neutral-200">
                        {detailedShow.genres.map((g) => g.name).join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="text-neutral-300">
                    <span className="text-neutral-400">
                      This{' '}
                      {modalStore.show?.media_type === MediaType.TV
                        ? 'Show'
                        : 'Movie'}{' '}
                      Is:{' '}
                    </span>
                    <span className="text-neutral-200">
                      {detailedShow?.keywords
                        ?.slice(0, 4)
                        .map((k) => k.name)
                        .join(', ') || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-300">
                    <span className="text-neutral-400">Maturity Rating: </span>
                    <span className="place-items-center border border-neutral-500 px-1.5 py-0.5 text-[10px] font-bold text-neutral-200">
                      {detailedShow?.contentRating ??
                        ((modalStore.show?.vote_average ?? 0) >= 8
                          ? '18+'
                          : '16+')}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {(modalStore.show?.vote_average ?? 0) >= 8
                        ? 'Recommended for ages 18 and up'
                        : ''}
                    </span>
                  </div>
                </div>
              </div>

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
