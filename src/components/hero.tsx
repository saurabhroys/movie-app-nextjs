'use client';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { getIdFromSlug, getNameFromShow, getSlug, getMobileDetect } from '@/lib/utils';
import MovieService from '@/services/MovieService';
import { useModalStore } from '@/stores/modal';
import { useSearchStore } from '@/stores/search';
import { MediaType, type Show, type ShowWithGenreAndVideo, type VideoResult } from '@/types';
import { type AxiosResponse } from 'axios';
import Link from 'next/link';
import React from 'react';
import CustomImage from './custom-image';
import { usePathname } from 'next/navigation';
import Youtube from 'react-youtube';

interface HeroProps {
  randomShow: Show | null;
}

const userAgent = typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;
const { isMobile } = getMobileDetect(userAgent);

const Hero = ({ randomShow }: HeroProps) => {
  const path = usePathname();
  const [trailer, setTrailer] = React.useState('');
  const [showTrailer, setShowTrailer] = React.useState(false);
  const [countdown, setCountdown] = React.useState(10);
  const [isCountdownActive, setIsCountdownActive] = React.useState(false);
  const youtubeRef = React.useRef(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const countdownRef = React.useRef<NodeJS.Timeout | null>(null);

  const defaultOptions = {
    playerVars: {
      rel: 0,
      mute: isMobile() ? 1 : 0,
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

  React.useEffect(() => {
    window.addEventListener('popstate', handlePopstateEvent, false);
    return () => {
      window.removeEventListener('popstate', handlePopstateEvent, false);
    };
  }, []);

  // Fetch trailer when randomShow changes
  React.useEffect(() => {
    if (randomShow?.id) {
      fetchTrailer();
    }
  }, [randomShow?.id]);

  // Start countdown when trailer is available
  React.useEffect(() => {
    if (trailer && !isCountdownActive) {
      startCountdown();
    }
  }, [trailer]);

  // Cleanup countdown on unmount
  React.useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const fetchTrailer = async () => {
    if (!randomShow?.id) return;
    
    try {
      const type = randomShow.media_type === MediaType.TV ? 'tv' : 'movie';
      const data: ShowWithGenreAndVideo = await MovieService.findMovieByIdAndType(randomShow.id, type);
      
      if (data.videos?.results?.length) {
        const trailerResult = data.videos.results.find((v: VideoResult) => v.type === 'Trailer');
        if (trailerResult?.key) {
          setTrailer(trailerResult.key);
        }
      }
    } catch (error) {
      console.error('Failed to fetch trailer:', error);
    }
  };

  const startCountdown = () => {
    setIsCountdownActive(true);
    setCountdown(10);
    
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
  };

  const handleTrailerEnd = (e: any) => {
    e.target.seekTo(0);
  };

  const handleTrailerReady = (e: any) => {
    e.target.playVideo();
  };

  const handlePopstateEvent = () => {
    const pathname = window.location.pathname;
    if (!/\d/.test(pathname)) {
      modalStore.reset();
    } else if (/\d/.test(pathname)) {
      const movieId: number = getIdFromSlug(pathname);
      if (!movieId) {
        return;
      }
      const findMovie: Promise<AxiosResponse<Show>> = pathname.includes(
        '/tv-shows',
      )
        ? MovieService.findTvSeries(movieId)
        : MovieService.findMovie(movieId);
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
  const modalStore = useModalStore();
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
    <section aria-label="Hero" className="w-full">
      {randomShow && (
        <>
          <div className="absolute inset-0 z-0 h-[100vw] w-full sm:h-[56.25vw]">
            <CustomImage
              ref={imageRef}
              src={`https://image.tmdb.org/t/p/original${
                randomShow?.backdrop_path ?? randomShow?.poster_path ?? ''
              }`}
              alt={randomShow?.title ?? 'poster'}
              className="-z-40 h-auto w-full object-cover transition-opacity duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 100vw, 33vw"
              fill
              priority
            />
            {trailer && showTrailer && (
              <Youtube
                opts={defaultOptions}
                onEnd={handleTrailerEnd}
                onPlay={handleTrailerPlay}
                ref={youtubeRef}
                onReady={handleTrailerReady}
                videoId={trailer}
                id="hero-trailer"
                title={randomShow?.title ?? randomShow?.name ?? 'hero-trailer'}
                className="absolute inset-0 z-10 h-full w-full"
                style={{ width: '100%', height: '100%' }}
                iframeClassName="absolute inset-0 w-full h-full z-10"
              />
            )}
            {/* Timer moved to center right */}
            {isCountdownActive && (
              <div
                className="absolute z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white"
                style={{
                  top: '50%',
                  right: '3vw',
                  transform: 'translateY(-50%)',
                }}
              >
                <span className="text-lg font-bold">{countdown}</span>
              </div>
            )}

            <div className="absolute top-0 right-0 bottom-0 left-0">
              <div className="absolute top-0 bottom-[35%] left-[4%] z-10 flex w-[36%] flex-col justify-end space-y-2">
                <h1 className="text-[3vw] font-bold">
                  {randomShow?.title ?? randomShow?.name}
                </h1>
                <div className="flex space-x-2 text-[2vw] font-semibold md:text-[1.2vw]">
                  <p className="text-green-600">
                    {Math.round(randomShow?.vote_average * 10) ?? '-'}% Match
                  </p>
                  {/* <p className="text-gray-300">{randomShow?.release_date ?? "-"}</p> */}
                  <p>{randomShow?.release_date ?? '-'}</p>
                </div>
                {/* <p className="line-clamp-4 text-sm text-gray-300 md:text-base"> */}
                <p className="hidden text-[1.2vw] sm:line-clamp-3">
                  {randomShow?.overview ?? '-'}
                </p>
                <div className="mt-[1.5vw] flex items-center space-x-2">
                  <Link prefetch={false} href={handleHref()}>
                    <Button
                      aria-label="Play video"
                      className="h-auto shrink-0 gap-2 rounded-xl">
                      <Icons.play className="fill-current" aria-hidden="true" />
                      Play
                    </Button>
                  </Link>
                  <Button
                    aria-label="Open show's details modal"
                    variant="outline"
                    className="h-auto shrink-0 gap-2 rounded-xl bg-gray-900/60 backdrop-blur-md"
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
              </div>
            </div>{' '}
            <div className="from-secondary absolute inset-0 right-[26.09%] z-8 bg-linear-to-r to-85% opacity-71"></div>
            <div className="from-background/0 via-background/30 to-background absolute right-0 bottom-[-1px] left-0 z-8 h-[14.7vw] bg-linear-to-b from-30% via-50% to-80%"></div>
          </div>
          <div className="relative inset-0 -z-50 mb-5 pb-[60%] sm:pb-[40%]"></div>
          <div className='absolute bottom-1 z-0 w-full h-full mask-t-from-10% mask-t-to-50% bg-neutral-50 dark:bg-neutral-950'></div>
          {/* Show this div in light mode only */}
          <div className='absolute bottom-1 z-0 w-full h-full mask-b-from-0% mask-b-to-20% block dark:hidden bg-neutral-50'></div>
          {/* Show this div in dark mode only */}
          <div className='absolute bottom-1 z-0 w-full h-full mask-b-from-0% mask-b-to-50% hidden dark:block dark:bg-neutral-950'></div>
        </>
      )}
    </section>
  );
};

export default Hero;
