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
import { useModalStore } from '@/stores/modal';
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

const ShowModal = () => {
  // stores
  const modalStore = useModalStore();
  const IS_MOBILE: boolean = isMobile();
  const router = useRouter();

  const [trailer, setTrailer] = React.useState('');
  const [isPlaying, setPlaying] = React.useState(true);
  const [genres, setGenres] = React.useState<Genre[]>([]);
  const [isAnime, setIsAnime] = React.useState<boolean>(false);
  const [isMuted, setIsMuted] = React.useState<boolean>(
    modalStore.firstLoad || IS_MOBILE,
  );
  const [options, setOptions] =
    React.useState<Record<string, object>>(defaultOptions);
  const youtubeRef = React.useRef(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const [contentRating, setContentRating] = React.useState<string | null>(null);
  const [trailerFinished, setTrailerFinished] = React.useState<boolean>(false);
  const [logoPath, setLogoPath] = React.useState<string | null>(null);
  const [logoTransition, setLogoTransition] = React.useState<
    'initial' | 'trailer-playing' | 'trailer-ended'
  >('initial');
  const [runtime, setRuntime] = React.useState<number | null>(null);
  const [cast, setCast] = React.useState<any[]>([]);
  const [keywords, setKeywords] = React.useState<KeyWord[]>([]);
  const [movieCollection, setMovieCollection] = React.useState<any>(null);
  const [tvSeasons, setTvSeasons] = React.useState<any>(null);
  const [selectedSeason, setSelectedSeason] = React.useState<number>(1);
  const [seasonEpisodes, setSeasonEpisodes] = React.useState<any[]>([]);
  const [recommendedShows, setRecommendedShows] = React.useState<Show[]>([]);
  const [loadingRecommended, setLoadingRecommended] =
    React.useState<boolean>(false);
  const pathname = usePathname();
  const [recommendedLogos, setRecommendedLogos] = React.useState<
    Record<number, string | null>
  >({});
  const [recommendedDetails, setRecommendedDetails] = React.useState<
    Record<number, { runtime: number | null; number_of_seasons: number | null }>
  >({});
  const [directors, setDirectors] = React.useState<string[]>([]);
  const [writers, setWriters] = React.useState<string[]>([]);

  React.useEffect(() => {
    const fetchContentRating = async () => {
      if (!modalStore.show?.id) return;
      try {
        const isTv = modalStore.show.media_type === MediaType.TV;
        if (isTv) {
          const { data }: any = await MovieService.getContentRating(
            'tv',
            modalStore.show.id,
          );
          const results: any[] = data?.results ?? [];
          const prefOrder = ['RU', 'UA', 'LV', 'TW'];
          let rating: string | null = null;
          for (const cc of prefOrder) {
            const match = results.find((r: any) => r?.iso_3166_1 === cc);
            const candidate = match?.rating ?? match?.certification ?? '';
            if (candidate && String(candidate).trim().length > 0) {
              rating = String(candidate).trim();
              break;
            }
          }
          if (!rating) {
            const firstNonEmpty = results.find(
              (r: any) =>
                (r?.rating ?? r?.certification ?? '').toString().trim().length >
                0,
            );
            rating = firstNonEmpty
              ? String(
                  firstNonEmpty.rating ?? firstNonEmpty.certification,
                ).trim()
              : null;
          }
          setContentRating(rating);
          return;
        }

        // Movies use release_dates endpoint
        const { data }: any = await MovieService.getMovieReleaseDates(
          modalStore.show.id,
        );
        const countries: any[] = data?.results ?? [];
        const prefOrder = ['RU', 'UA', 'LV', 'TW'];
        const getFirstNonEmpty = (c: any): string | null => {
          const arr = (c?.release_dates ?? [])
            .filter((rd: any) => rd && typeof rd.certification === 'string')
            .map((rd: any) => ({
              cert: rd.certification?.trim?.() ?? '',
              date: rd.release_date,
            }))
            .filter((x: any) => x.cert.length > 0)
            .sort(
              (a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
          return arr.length ? arr[0].cert : null;
        };
        let cert: string | null = null;
        for (const cc of prefOrder) {
          const country = countries.find((c: any) => c?.iso_3166_1 === cc);
          cert = getFirstNonEmpty(country);
          if (cert) break;
        }
        if (!cert) {
          // fallback to first country with a non-empty certification
          for (const c of countries) {
            cert = getFirstNonEmpty(c);
            if (cert) break;
          }
        }
        setContentRating(cert);
      } catch (error) {
        console.error('Failed to fetch content rating:', error);
        setContentRating(null);
      }
    };
    fetchContentRating();
  }, [modalStore.show?.id, modalStore.show?.media_type]);

  // get trailer and genres of show
  React.useEffect(() => {
    if (modalStore.firstLoad || IS_MOBILE) {
      setOptions((state: Record<string, object>) => ({
        ...state,
        playerVars: { ...state.playerVars, mute: 1 },
      }));
    }
    void handleGetData();
  }, []);

  React.useEffect(() => {
    setIsAnime(false);
  }, [modalStore]);

  // Fetch logo for the current show
  React.useEffect(() => {
    const fetchLogo = async () => {
      try {
        if (!modalStore.show?.id) return;
        const type =
          modalStore.show.media_type === MediaType.TV ? 'tv' : 'movie';
        const { data }: any = await MovieService.getImages(
          type,
          modalStore.show.id,
        );
        const preferred =
          data?.logos?.find((l: any) => l?.iso_639_1 === 'en') ??
          data?.logos?.[0];
        setLogoPath(preferred ? preferred.file_path : null);
      } catch (error) {
        console.error('Failed to fetch logo:', error);
        setLogoPath(null);
      }
    };
    fetchLogo();
  }, [modalStore.show?.id, modalStore.show?.media_type]);

  const handleGetData = async () => {
    const id: number | undefined = modalStore.show?.id;
    const type: string =
      modalStore.show?.media_type === MediaType.TV ? 'tv' : 'movie';
    if (!id || !type) {
      return;
    }
    // Try Hindi trailer first, fallback to English
    let data: ShowWithGenreAndVideo = await MovieService.findMovieByIdAndType(
      id,
      type,
      'hi-IN',
    );
    if (!data.videos?.results?.length) {
      data = await MovieService.findMovieByIdAndType(id, type, 'en-US');
    }

    const keywords: KeyWord[] =
      data?.keywords?.results || data?.keywords?.keywords;

    if (keywords?.length) {
      setKeywords(keywords);
      setIsAnime(
        !!keywords.find((keyword: KeyWord) => keyword.name === 'anime'),
      );
    } else {
      setKeywords([]);
    }

    if (data?.genres) {
      setGenres(data.genres);
    }
    if (data.videos?.results?.length) {
      const videoData: VideoResult[] = data.videos?.results;
      const result: VideoResult | undefined = videoData.find(
        (item: VideoResult) => item.type === 'Trailer',
      );
      if (result?.key) setTrailer(result.key);
    }

    // Fetch runtime and cast
    try {
      const details = await MovieService.findMovieByIdAndType(
        id,
        type,
        'en-US',
      );
      if (details.runtime) {
        setRuntime(details.runtime);
      }

      // Fetch cast and crew information
      const { data: credits } = await MovieService.getCredits(type, id);
      if (credits?.cast) {
        setCast(credits.cast.slice(0, 10));
      }
      if (credits?.crew) {
        const directorNames: string[] = credits.crew
          .filter((c: any) => c?.job === 'Director')
          .map((c: any) => String(c.name))
          .filter(Boolean);
        const writerNames: string[] = credits.crew
          .filter((c: any) =>
            ['Writer', 'Screenplay', 'Story', 'Teleplay'].includes(c?.job),
          )
          .map((c: any) => String(c.name))
          .filter(Boolean);
        const uniqueDirectors = Array.from(new Set<string>(directorNames));
        const uniqueWriters = Array.from(new Set<string>(writerNames));
        setDirectors(uniqueDirectors.slice(0, 3));
        setWriters(uniqueWriters.slice(0, 3));
      }

      // Fetch movie collection if it's a movie
      if (type === 'movie' && (details as any).belongs_to_collection?.id) {
        try {
          const collectionData = await MovieService.getMovieCollection(
            (details as any).belongs_to_collection.id,
          );
          setMovieCollection(collectionData);
        } catch (error) {
          console.error('Failed to fetch movie collection:', error);
        }
      }

      // Fetch TV seasons if it's a TV show
      if (type === 'tv') {
        try {
          const seasonsData = await MovieService.getTvSeasons(id);
          setTvSeasons(seasonsData);
          if (seasonsData.seasons && seasonsData.seasons.length > 0) {
            setSelectedSeason(1);
            // Fetch episodes for first season
            const seasonData = await MovieService.getSeasons(id, 1);
            setSeasonEpisodes(seasonData.data.episodes || []);
          }
        } catch (error) {
          console.error('Failed to fetch TV seasons:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch additional details:', error);
    }
  };

  const handleCloseModal = () => {
    modalStore.reset();
    if (!modalStore.show || modalStore.firstLoad) {
      window.history.pushState(null, '', '/');
    } else {
      window.history.back();
    }
  };

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
      event?.target?.playVideo?.();
    } catch {}
  };

  const handleChangeMute = () => {
    setIsMuted((state: boolean) => !state);
    if (!youtubeRef.current) return;
    const videoRef: YouTubePlayer = youtubeRef.current as YouTubePlayer;
    if (isMuted && youtubeRef.current) {
      videoRef.internalPlayer.unMute();
    } else if (youtubeRef.current) {
      videoRef.internalPlayer.mute();
    }
  };

  const handleReplay = () => {
    setTrailerFinished(false);
    setLogoTransition('trailer-playing');
    if (!youtubeRef.current) return;
    const videoRef: YouTubePlayer = youtubeRef.current as YouTubePlayer;
    try {
      videoRef.internalPlayer.seekTo(0);
      videoRef.internalPlayer.playVideo();
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

  // Fetch recommendations (fallback to similar) for More like this
  React.useEffect(() => {
    const fetchRecommendations = async () => {
      const id: number | undefined = modalStore.show?.id;
      if (!id) return;
      setLoadingRecommended(true);
      try {
        const isTv = modalStore.show?.media_type === MediaType.TV;
        const primary = isTv
          ? await MovieService.getTvRecommendations(id)
          : await MovieService.getMovieRecommendations(id);
        let results: any[] =
          (primary as any)?.results ?? (primary as any)?.data?.results ?? [];
        if (!results?.length) {
          const fallback = isTv
            ? await MovieService.getSimilarTvShows(id)
            : await MovieService.getSimilarMovies(id);
          results =
            (fallback as any)?.results ??
            (fallback as any)?.data?.results ??
            [];
        }
        const normalized: Show[] = (results || []).map((r: any) => ({
          media_type:
            (r?.media_type as MediaType) ??
            modalStore.show?.media_type ??
            MediaType.MOVIE,
          adult: !!r?.adult,
          backdrop_path: r?.backdrop_path ?? null,
          budget: null,
          homepage: null,
          showId: String(r?.id ?? ''),
          id: Number(r?.id ?? 0),
          imdb_id: null,
          original_language: r?.original_language ?? 'en',
          original_title: r?.original_title ?? null,
          overview: r?.overview ?? null,
          popularity: Number(r?.popularity ?? 0),
          poster_path: r?.poster_path ?? null,
          number_of_seasons: r?.number_of_seasons ?? null,
          number_of_episodes: r?.number_of_episodes ?? null,
          release_date: r?.release_date ?? null,
          first_air_date: r?.first_air_date ?? null,
          last_air_date: r?.last_air_date ?? null,
          revenue: null,
          runtime: r?.runtime ?? null,
          status: r?.status ?? null,
          tagline: r?.tagline ?? null,
          title: r?.title ?? null,
          name: r?.name ?? null,
          video: !!r?.video,
          vote_average: Number(r?.vote_average ?? 0),
          vote_count: Number(r?.vote_count ?? 0),
          keywords: { id: 0, keywords: [], results: [] },
          seasons: [],
        }));
        setRecommendedShows(normalized);

        // Fetch logos for recommended shows in parallel (best-effort)
        const logoEntries = await Promise.all(
          normalized.slice(0, 24).map(async (s) => {
            try {
              const type = s.media_type === MediaType.TV ? 'tv' : 'movie';
              const { data }: any = await MovieService.getImages(type, s.id);
              const preferred =
                data?.logos?.find((l: any) => l?.iso_639_1 === 'en') ??
                data?.logos?.[0];
              return [s.id, preferred ? preferred.file_path : null] as const;
            } catch {
              return [s.id, null] as const;
            }
          }),
        );
        setRecommendedLogos((prev) => ({
          ...prev,
          ...Object.fromEntries(logoEntries),
        }));

        // Fetch missing details (runtime for movies, seasons for TV) for cards
        const detailsEntries = await Promise.all(
          normalized.slice(0, 24).map(async (s) => {
            try {
              const type = s.media_type === MediaType.TV ? 'tv' : 'movie';
              const details: any = await MovieService.findMovieByIdAndType(
                s.id,
                type,
                'en-US',
              );
              return [
                s.id,
                {
                  runtime:
                    typeof details?.runtime === 'number'
                      ? details.runtime
                      : null,
                  number_of_seasons:
                    typeof details?.number_of_seasons === 'number'
                      ? details.number_of_seasons
                      : null,
                },
              ] as const;
            } catch {
              return [
                s.id,
                { runtime: null, number_of_seasons: null },
              ] as const;
            }
          }),
        );
        setRecommendedDetails((prev) => ({
          ...prev,
          ...Object.fromEntries(detailsEntries),
        }));
      } catch (err) {
        setRecommendedShows([]);
      } finally {
        setLoadingRecommended(false);
      }
    };
    fetchRecommendations();
  }, [modalStore.show?.id, modalStore.show?.media_type]);

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

  return (
    <Dialog
      open={modalStore.open}
      onOpenChange={handleCloseModal}
      aria-label="Modal containing show's details">
      {modalStore.open && <BodyScrollLock />}
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
                  priority
                  ref={imageRef}
                  alt={modalStore?.show?.title ?? 'poster'}
                  className="z-1 h-auto w-full object-cover"
                  src={`https://image.tmdb.org/t/p/original${
                    modalStore.show?.backdrop_path ??
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
                    iframeClassName={`relative pointer-events-none w-[100%] h-[100%] z-[-10] opacity-0`}
                  />
                )}

                {/* Show logo with transition states */}
                {logoPath && (
                  <div
                    className={`absolute z-30 flex items-center p-6 transition-all duration-[1500] ease-in-out ${
                      logoTransition === 'initial' ||
                      logoTransition === 'trailer-ended'
                        ? 'inset-0 justify-center'
                        : 'bottom-25 left-0 justify-start'
                    }`}>
                    <CustomImage
                      src={`https://image.tmdb.org/t/p/original${logoPath}`}
                      alt={`${modalStore.show?.title ?? modalStore.show?.name} logo`}
                      className={`object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-[1500] ease-in-out ${
                        logoTransition === 'initial' ||
                        logoTransition === 'trailer-ended'
                          ? 'h-auto max-w-[60%]'
                          : 'h-auto max-w-[40%]'
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

                <div className="absolute bottom-20 z-30 flex w-full items-center justify-between gap-2 px-10">
                  <div className="flex items-center gap-2.5">
                    <Link href={handleHref()}>
                      <Button
                        aria-label={`${isPlaying ? 'Pause' : 'Play'} show`}
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
              <div className="relative z-40 -mt-10 flex w-full gap-4 px-10 pb-10">
                <div className="w-3/4">
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
                    {runtime && (
                      <p className="text-sm font-bold text-slate-200">
                        {Math.floor(runtime / 60)}h {runtime % 60}m
                      </p>
                    )}
                    {/* Seasons (TV only) */}
                    {modalStore.show?.media_type === MediaType.TV &&
                      (() => {
                        const count = tvSeasons?.seasons?.length ?? modalStore.show?.number_of_seasons ?? null;
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
                      {contentRating ?? '16+'}
                    </span>
                    {/* KeyWords */}
                    <span className="text-sm text-slate-50">
                      {keywords.length > 0
                        ? keywords
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

                <div className="flex w-1/4 flex-col gap-3 text-sm text-neutral-400">
                  {/* Left Column */}
                  <div className="">
                    <div>
                      <span className="text-neutral-50">Cast: </span>
                      <span>
                        {cast.length > 0
                          ? `${cast.map((actor) => actor.name).join(', ')}, more`
                          : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="">
                    <div>
                      <span className="text-neutral-50">Genres: </span>
                      <span>
                        {genres.map((genre) => genre.name).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Movie Collection Section */}
              {movieCollection &&
                modalStore.show?.media_type === MediaType.MOVIE && (
                  <div className="px-10 pb-6">
                    <div className="flex items-start justify-start gap-4">
                      <Icons.library />
                      <h3 className="mb-4 text-xl font-semibold text-white">
                        {movieCollection.name}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {movieCollection.parts?.map(
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
              {tvSeasons && modalStore.show?.media_type === MediaType.TV && (
                <div className="px-10 pb-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">
                      Episodes
                    </h3>
                    {tvSeasons.seasons && tvSeasons.seasons.length > 1 && (
                      <select
                        value={selectedSeason}
                        onChange={(e) =>
                          handleSeasonChange(Number(e.target.value))
                        }
                        className="rounded border border-neutral-600 bg-neutral-800 px-3 py-1 text-white">
                        {tvSeasons.seasons.map((season: any) => (
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
              <div className="px-10 pb-8">
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
                      const detail = recommendedDetails[show.id];
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
                            {recommendedLogos[show.id] && (
                              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden px-2">
                                <img
                                  src={`https://image.tmdb.org/t/p/w500${recommendedLogos[show.id]}`}
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
              <div className="px-10 pb-8">
                <h3 className="mb-3 text-xl font-semibold text-white">
                  About {modalStore.show?.title ?? modalStore.show?.name}
                </h3>
                <div className="space-y-2 text-sm">
                  {directors.length > 0 && (
                    <div className="text-neutral-300">
                      <span className="text-neutral-400">Director: </span>
                      <span className="text-neutral-200">
                        {directors.join(', ')}
                      </span>
                    </div>
                  )}
                  {cast.length > 0 && (
                    <div className="text-neutral-300">
                      <span className="text-neutral-400">Cast: </span>
                      <span className="text-neutral-200">
                        {cast
                          .map((a: any) => a.name)
                          .slice(0, 12)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  {writers.length > 0 && (
                    <div className="text-neutral-300">
                      <span className="text-neutral-400">Writer: </span>
                      <span className="text-neutral-200">
                        {writers.join(', ')}
                      </span>
                    </div>
                  )}
                  {genres.length > 0 && (
                    <div className="text-neutral-300">
                      <span className="text-neutral-400">Genres: </span>
                      <span className="text-neutral-200">
                        {genres.map((g) => g.name).join(', ')}
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
                      {keywords
                        .slice(0, 4)
                        .map((k) => k.name)
                        .join(', ') || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-300">
                    <span className="text-neutral-400">Maturity Rating: </span>
                    <span className="place-items-center border border-neutral-500 px-1.5 py-0.5 text-[10px] font-bold text-neutral-200">
                      {contentRating ??
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
                onClick={handleCloseModal}>
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

export default ShowModal;
