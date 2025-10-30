'use client';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  getIdFromSlug,
  getNameFromShow,
  getSlug,
  getMobileDetect,
} from '@/lib/utils';
import MovieService from '@/services/MovieService';
import { useSearchStore } from '@/stores/search';
import {
  MediaType,
  type Show,
  type ShowWithGenreAndVideo,
  type VideoResult,
} from '@/types';
import { type AxiosResponse } from 'axios';
import Link from 'next/link';
import React from 'react';
import CustomImage from './custom-image';
import { usePathname } from 'next/navigation';
import Youtube from 'react-youtube';
import { useModalStore } from '@/stores/modal';
import { usePreviewModalStore } from '@/stores/preview-modal';

interface HeroProps {
  randomShow: Show | null;
}

const userAgent =
  typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;
const { isMobile } = getMobileDetect(userAgent);

const count = 1;
const Hero = ({ randomShow }: HeroProps) => {
  const path = usePathname();
  const [trailer, setTrailer] = React.useState('');
  const [showTrailer, setShowTrailer] = React.useState(false);
  const [trailerFinished, setTrailerFinished] = React.useState(false);
  const [countdown, setCountdown] = React.useState(count);
  const [isCountdownActive, setIsCountdownActive] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(isMobile() ? true : false);
  const [showControls, setShowControls] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [showLogo, setShowLogo] = React.useState(false);
  const [logoPath, setLogoPath] = React.useState<string | null>(null);
  const [showTextElements, setShowTextElements] = React.useState(true);
  const [contentRating, setContentRating] = React.useState<string | null>(null);
  const youtubeRef = React.useRef(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const countdownRef = React.useRef<NodeJS.Timeout | null>(null);
  const textHideTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const prevMutedRef = React.useRef<boolean>(isMuted);
  const modalStore = useModalStore();
  const previewModalStore = usePreviewModalStore();

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

  React.useEffect(() => {
    window.addEventListener('popstate', handlePopstateEvent, false);
    return () => {
      window.removeEventListener('popstate', handlePopstateEvent, false);
    };
  }, []);

  // Fetch logo immediately when randomShow changes
  React.useEffect(() => {
    if (randomShow?.id) {
      fetchLogo();
      setShowLogo(true); // Show logo immediately when poster loads
    }
  }, [randomShow?.id]);

  // Fetch trailer and reset states when randomShow changes
  React.useEffect(() => {
    if (randomShow?.id) {
      setTrailerFinished(false);
      setShowControls(false);
      setIsPaused(false);
      setShowTextElements(true);
      if (textHideTimerRef.current) {
        clearTimeout(textHideTimerRef.current);
      }
      fetchTrailer();
    }
  }, [randomShow?.id]);

  // Fetch content rating (prefer RU, then fallbacks)
  React.useEffect(() => {
    const fetchContentRating = async () => {
      if (!randomShow?.id) return;
      try {
        const isTv = randomShow.media_type === MediaType.TV;
        if (isTv) {
          const { data }: any = await MovieService.getContentRating(
            'tv',
            randomShow.id,
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
          randomShow.id,
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
  }, [randomShow?.id, randomShow?.media_type]);

  // Start countdown when trailer is available and not finished
  React.useEffect(() => {
    if (trailer && !isCountdownActive && !trailerFinished) {
      startCountdown();
    }
  }, [trailer, trailerFinished]);

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
    const videoRef: any = youtubeRef.current;
    const isAnyModalOpen = modalStore.open || previewModalStore.isOpen;
    if (isAnyModalOpen) {
      if (videoRef?.internalPlayer && showTrailer && !trailerFinished) {
        videoRef.internalPlayer.pauseVideo();
        setIsPaused(true);
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
      videoRef.internalPlayer.playVideo();
      setIsPaused(false);
    }
  }, [modalStore.open, previewModalStore.isOpen, showTrailer, trailerFinished]);

  const fetchTrailer = async () => {
    if (!randomShow?.id) return;

    try {
      const type = randomShow.media_type === MediaType.TV ? 'tv' : 'movie';

      // Try to fetch Hindi trailer first
      let data: ShowWithGenreAndVideo = await MovieService.findMovieByIdAndType(
        randomShow.id,
        type,
        'hi-IN',
      );

      if (data.videos?.results?.length) {
        const trailerResult = data.videos.results.find(
          (v: VideoResult) => v.type === 'Trailer',
        );
        if (trailerResult?.key) {
          setTrailer(trailerResult.key);
          return;
        }
      }

      // Fallback to English trailer if no Hindi trailer found
      data = await MovieService.findMovieByIdAndType(
        randomShow.id,
        type,
        'en-US',
      );

      if (data.videos?.results?.length) {
        const trailerResult = data.videos.results.find(
          (v: VideoResult) => v.type === 'Trailer',
        );
        if (trailerResult?.key) {
          setTrailer(trailerResult.key);
        }
      }
    } catch (error) {
      console.error('Failed to fetch trailer:', error);
    }
  };

  const fetchLogo = async () => {
    if (!randomShow?.id) return;

    try {
      const type = randomShow.media_type === MediaType.TV ? 'tv' : 'movie';
      const { data } = await MovieService.getImages(type, randomShow.id);
      const preferred =
        data.logos?.find((l) => l.iso_639_1 === 'en') ?? data.logos?.[0];
      setLogoPath(preferred ? preferred.file_path : null);
    } catch (error) {
      console.error('Failed to fetch logo:', error);
      setLogoPath(null);
    }
  };

  const startCountdown = () => {
    setIsCountdownActive(true);
    setCountdown(count);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsCountdownActive(false);
          setShowTrailer(true);
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTrailerPlay = () => {
    if (imageRef.current) {
      imageRef.current.style.opacity = '0';
    }
    setShowControls(true);

    // Start 10-second timer to hide text elements
    textHideTimerRef.current = setTimeout(() => {
      setShowTextElements(false);
    }, 10000);
  };

  const handleTrailerEnd = (e: any) => {
    setTrailerFinished(true);
    setShowTrailer(false);
    setShowTextElements(true); // Show text elements again when trailer ends
    if (imageRef.current) {
      imageRef.current.style.opacity = '1';
    }
  };

  const handleTrailerReady = (e: any) => {
    try {
      e?.target?.playVideo?.();
    } catch {}
  };

  const handleChangeMute = () => {
    setIsMuted((m) => !m);
    const videoRef: any = youtubeRef.current;
    if (!videoRef) return;
    if (isMuted) videoRef.internalPlayer.unMute();
    else videoRef.internalPlayer.mute();
  };

  const handleReplayTrailer = () => {
    setTrailerFinished(false);
    setShowTrailer(true);
    setShowControls(true);
    setIsPaused(false);
    setShowTextElements(true);

    // Clear existing timers and start new ones
    if (textHideTimerRef.current) {
      clearTimeout(textHideTimerRef.current);
    }

    textHideTimerRef.current = setTimeout(() => {
      setShowTextElements(false);
    }, 10000);

    if (imageRef.current) {
      imageRef.current.style.opacity = '0';
    }
  };

  const handlePopstateEvent = () => {
    const pathname = window.location.pathname;
    if (!/\d/.test(pathname)) {
      modalStore.reset();
    } else if (/\d/.test(pathname)) {
      const mediaId: number = getIdFromSlug(pathname);
      if (!mediaId) {
        return;
      }
      const findMovie: Promise<AxiosResponse<Show>> = pathname.includes(
        '/tv-shows',
      )
        ? MovieService.findTvSeries(mediaId)
        : MovieService.findMovie(mediaId);
      findMovie
        .then((response: AxiosResponse<Show>) => {
          const { data } = response;
          useModalStore.setState({ show: data, open: true, play: true });
        })
        .catch((error) => {
          console.error(`findMovie: `, error);
        });
    }
  };

  // stores
  const searchStore = useSearchStore();

  if (searchStore.query.length > 0) {
    return null;
  }

  const handleHref = (): string => {
    if (!randomShow) {
      return '#';
    }
    if (!path.includes('/anime')) {
      const type = randomShow.media_type === MediaType.MOVIE ? 'movie' : 'tv';
      return `/watch/${type}/${randomShow.id}`;
    }
    const prefix: string =
      randomShow?.media_type === MediaType.MOVIE ? 'm' : 't';
    const id = `${prefix}-${randomShow.id}`;
    return `/watch/anime/${id}`;
  };

  return (
    <>
      <section aria-label="Hero" className="static w-full">
        {randomShow && (
          <>
            {/* player or poster */}
            <div className="absolute inset-0 h-[100vw] w-full bg-neutral-50 mask-t-from-60% mask-t-to-110% mask-b-from-50% mask-b-to-95% sm:h-[56.25vw] dark:bg-neutral-950 dark:mask-t-to-100%">
              {/* Background Image - Base Layer */}
              <CustomImage
                ref={imageRef}
                src={`https://image.tmdb.org/t/p/original${
                  randomShow?.backdrop_path ?? randomShow?.poster_path ?? ''
                }`}
                alt={randomShow?.title ?? 'poster'}
                className="z-0 h-auto w-full object-cover transition-opacity duration-500"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 100vw, 33vw"
                fill
                priority
              />
              {trailer && showTrailer && !trailerFinished && (
                <Youtube
                  opts={defaultOptions}
                  onEnd={handleTrailerEnd}
                  onPlay={handleTrailerPlay}
                  ref={youtubeRef}
                  onReady={handleTrailerReady}
                  videoId={trailer}
                  id="hero-trailer"
                  title={
                    randomShow?.title ?? randomShow?.name ?? 'hero-trailer'
                  }
                  className="absolute inset-0 z-0 h-full w-full"
                  style={{ width: '100%', height: '100%' }}
                  iframeClassName="absolute inset-0 w-full h-full z-10"
                />
              )}
              {/* shadows */}
              <div className="absolute inset-0 right-[26.09%] bg-linear-to-r from-neutral-900 to-85% opacity-71"></div>
              <div className="absolute right-0 bottom-[-1.1px] left-0 h-[14.7vw] bg-linear-to-b from-neutral-900/0 from-30% via-neutral-900/30 via-50% to-neutral-900 to-80%"></div>
              {/* shadows end */}
            </div>
            {/* player end */}

            {/* text details, Title and buttons */}
            <div className="absolute right-0 bottom-[30%] left-0 z-10 w-full pl-[4%] 2xl:pl-[60px]">
              <div className="">
                {/* Show logo when trailer is playing, otherwise show title */}
                <div className="flex w-[30.87vw] flex-col justify-end gap-4 space-y-2">
                  {showLogo && logoPath ? (
                    <div
                      className={` ${
                        showTextElements
                          ? 'h-auto w-[30.87vw]'
                          : 'h-auto w-[26.46vw]'
                      }`}
                      style={{
                        transformOrigin: 'left bottom',
                        transform: showTextElements
                          ? 'scale(1) translate3d(0px, 0px, 0px)'
                          : 'scale(0.8) translate3d(0px, 0px, 0px)',
                        transitionDuration: '1300ms',
                        transitionDelay: '0ms',
                      }}>
                      <CustomImage
                        src={`https://image.tmdb.org/t/p/original${logoPath}`}
                        alt={`${randomShow?.title ?? randomShow?.name} logo`}
                        className="h-auto w-full object-contain"
                        width={showTextElements ? 500 : 200}
                        height={showTextElements ? 250 : 100}
                      />
                    </div>
                  ) : (
                    <h1 className="text-[3vw] font-bold">
                      {randomShow?.title ?? randomShow?.name}
                    </h1>
                  )}

                  {/* Show text elements when showTextElements is true */}
                  <div
                    className={`overflow-hidden ${
                      showTextElements ? 'max-h-96' : 'max-h-0'
                    }`}
                    style={{
                      transform: showTextElements
                        ? 'translate3d(0px, 0px, 0px)'
                        : 'translate3d(0px, 24px, 0px)',
                      transitionDuration: '1300ms',
                      transitionDelay: '0ms',
                      opacity: showTextElements ? 1 : 0,
                    }}>
                    <div className="flex space-x-2 text-[2vw] font-semibold md:text-[1.2vw]">
                      <p className="text-green-600">
                        {Math.round(randomShow?.vote_average * 10) ?? '-'}%
                        Match
                      </p>
                      <p>{randomShow?.release_date ?? '-'}</p>
                    </div>
                    <p className="hidden text-[1.2vw] sm:line-clamp-3">
                      {randomShow?.overview ?? '-'}
                    </p>
                  </div>
                </div>

                {/* Combined controls with justify-between */}
                <div className="mt-[1.5vw] flex w-full items-center justify-between">
                  {/* Left side - Play and More Info buttons */}
                  <div className="flex items-center space-x-2">
                    <Link prefetch={false} href={handleHref()}>
                      <Button
                        aria-label="Play video"
                        className="h-auto shrink-0 gap-2 rounded-xl">
                        <Icons.play
                          className="fill-current"
                          aria-hidden="true"
                        />
                        Play
                      </Button>
                    </Link>
                    <Button
                      aria-label="Open show's details modal"
                      variant="outline"
                      className="h-auto shrink-0 gap-2 rounded-xl bg-neutral-900/60 backdrop-blur-md"
                      onClick={() => {
                        const name = getNameFromShow(randomShow);
                        const path: string =
                          randomShow.media_type === MediaType.TV
                            ? 'tv-shows'
                            : 'movies';
                        window.history.pushState(
                          null,
                          '',
                          `${path}/${getSlug(randomShow.id, name)}`,
                        );
                        useModalStore.setState({
                          show: randomShow,
                          open: true,
                          play: true,
                        });
                      }}>
                      <Icons.info aria-hidden="true" />
                      More Info
                    </Button>
                  </div>

                  {/* Right side - Mute/Replay button */}
                  <div className="flex flex-row">
                    {showControls && (
                      <div className="mr-5 flex cursor-pointer items-center gap-2">
                        {!trailerFinished ? (
                          <Button
                            aria-label={`${isMuted ? 'Unmute' : 'Mute'} video`}
                            className="h-10 w-10 rounded-full bg-black/70 p-0 text-white/50 ring-2 ring-white/50 transition-all duration-500 hover:bg-white/20 hover:text-white hover:ring-white"
                            onClick={handleChangeMute}>
                            {isMuted ? (
                              <Icons.volumeMute className="h-5 w-5" />
                            ) : (
                              <Icons.volume className="h-5 w-5" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            aria-label="Replay trailer"
                            className="h-10 w-10 rounded-full bg-black/70 p-0 text-white/50 ring-2 ring-white/50 transition-all duration-500 hover:bg-white/20 hover:text-white hover:ring-white"
                            onClick={handleReplayTrailer}>
                            <Icons.replay className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    )}
                    <div className="flex h-10 w-25 items-center border-l-3 border-white bg-black/30 p-3 text-lg backdrop-blur-sm">
                      {contentRating ?? 'NA'}
                    </div>
                  </div>
                  {/* buttons end */}
                </div>
              </div>
            </div>
            {/* end text details */}

            {/* Timer */}
            {isCountdownActive && (
              <div
                className="absolute flex items-center gap-2"
                style={{
                  top: '75%',
                  right: '3vw',
                  zIndex: '999',
                }}>
                <div className="z-50 flex items-center justify-center rounded-xl bg-black/50 px-3 py-2 text-white backdrop-blur-md">
                  <span className="z-50 text-lg font-bold text-white">
                    Trailer - {countdown}
                  </span>
                </div>
              </div>
            )}
            {/* timer end */}
          </>
        )}
      </section>

      <div className="relative inset-0 -z-10 mb-5 pb-[60%] sm:pb-[40%]"></div>
    </>
  );
};

export default Hero;
