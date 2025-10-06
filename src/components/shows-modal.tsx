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
} from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import Youtube from 'react-youtube';
import CustomImage from './custom-image';

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
  const [isMuted, setIsMuted] = React.useState<boolean>( modalStore.firstLoad || IS_MOBILE, );
  const [options, setOptions] = React.useState<Record<string, object>>(defaultOptions);
  const youtubeRef = React.useRef(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const [contentRating, setContentRating] = React.useState<string | null>(null);
  const [trailerFinished, setTrailerFinished] = React.useState<boolean>(false);
  const [logoPath, setLogoPath] = React.useState<string | null>(null);
  const [logoTransition, setLogoTransition] = React.useState<'initial' | 'trailer-playing' | 'trailer-ended'>('initial');
  const [runtime, setRuntime] = React.useState<number | null>(null);
  const [cast, setCast] = React.useState<any[]>([]);
  const [keywords, setKeywords] = React.useState<KeyWord[]>([]);
  const [movieCollection, setMovieCollection] = React.useState<any>(null);
  const [tvSeasons, setTvSeasons] = React.useState<any>(null);
  const [selectedSeason, setSelectedSeason] = React.useState<number>(1);
  const [seasonEpisodes, setSeasonEpisodes] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchContentRating = async () => {
      if (!modalStore.show?.id) return;
      try {
        const isTv = modalStore.show.media_type === MediaType.TV;
        if (isTv) {
          const { data }: any = await MovieService.getContentRating('tv', modalStore.show.id);
          const results: any[] = data?.results ?? [];
          const prefOrder = ['RU','UA', 'LV', 'TW'];
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
            const firstNonEmpty = results.find((r: any) => (r?.rating ?? r?.certification ?? '').toString().trim().length > 0);
            rating = firstNonEmpty ? String(firstNonEmpty.rating ?? firstNonEmpty.certification).trim() : null;
          }
          setContentRating(rating);
          return;
        }
    
        // Movies use release_dates endpoint
        const { data }: any = await MovieService.getMovieReleaseDates(modalStore.show.id);
        const countries: any[] = data?.results ?? [];
        const prefOrder = ['RU','UA', 'LV', 'TW'];
        const getFirstNonEmpty = (c: any): string | null => {
          const arr = (c?.release_dates ?? [])
            .filter((rd: any) => rd && typeof rd.certification === 'string')
            .map((rd: any) => ({ cert: rd.certification?.trim?.() ?? '', date: rd.release_date }))
            .filter((x: any) => x.cert.length > 0)
            .sort((a: any, b: any) => (new Date(b.date).getTime()) - (new Date(a.date).getTime()));
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
        const type = modalStore.show.media_type === MediaType.TV ? 'tv' : 'movie';
        const { data }: any = await MovieService.getImages(type, modalStore.show.id);
        const preferred = data?.logos?.find((l: any) => l?.iso_639_1 === 'en') ?? data?.logos?.[0];
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
    let data: ShowWithGenreAndVideo = await MovieService.findMovieByIdAndType(id, type, 'hi-IN');
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
      const details = await MovieService.findMovieByIdAndType(id, type, 'en-US');
      if (details.runtime) {
        setRuntime(details.runtime);
      }
      
      // Fetch cast information
      const { data: credits } = await MovieService.getCredits(type, id);
      if (credits?.cast) {
        setCast(credits.cast.slice(0, 3)); // Get first 3 cast members
      }

      // Fetch movie collection if it's a movie
      if (type === 'movie' && (details as any).belongs_to_collection?.id) {
        try {
          const collectionData = await MovieService.getMovieCollection((details as any).belongs_to_collection.id);
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
      window.history.pushState(null, '', '/home');
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
    event.target.playVideo();
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
      const seasonData = await MovieService.getSeasons(modalStore.show.id, seasonNumber);
      setSeasonEpisodes(seasonData.data.episodes || []);
    } catch (error) {
      console.error('Failed to fetch season episodes:', error);
    }
  };

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
    router.push(`/watch/tv/${showId}?season=${seasonNumber}&episode=${episodeNumber}`);
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
      <div className="'bg-black/20 data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-0 z-50 backdrop-blur-[1px]" onClick={handleOverlayClick}>
        <div
          className="w-full disabled:pointer-events-none overflow-y-auto h-full py-10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 translate-all duration-500 fixed top-[50%] left-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%]"
        >
        <div className="flex justify-center" >
          <div id='content' className="w-full overflow-y-auto rounded-md bg-neutral-900 p-0 text-left align-middle sm:max-w-3xl lg:max-w-4xl border-none ring-0 relative">
            <div className="relative aspect-video z-10"
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
                    modalStore.show?.backdrop_path ?? modalStore.show?.poster_path
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
                    className={`absolute z-30 flex items-center p-6 transition-all duration-[1500ms] ease-in-out ${
                      logoTransition === 'initial' || logoTransition === 'trailer-ended'
                        ? 'inset-0 justify-center'
                        : 'bottom-25 left-0 justify-start'
                    }`}
                  >
                    <CustomImage
                      src={`https://image.tmdb.org/t/p/original${logoPath}`}
                      alt={`${modalStore.show?.title ?? modalStore.show?.name} logo`}
                      className={`object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-[1500ms] ease-in-out ${
                        logoTransition === 'initial' || logoTransition === 'trailer-ended'
                          ? 'max-w-[60%] h-auto'
                          : 'max-w-[40%] h-auto'
                      }`}
                      width={logoTransition === 'initial' || logoTransition === 'trailer-ended' ? 800 : 400}
                      height={logoTransition === 'initial' || logoTransition === 'trailer-ended' ? 400 : 200}
                    />
                  </div>
                )}

                <div className='absolute bottom-[-5px] z-10 w-full h-full mask-t-from-9% mask-t-to-50% bg-neutral-900'></div>
                
                <div className="absolute bottom-20 z-30 flex w-full items-center justify-between gap-2 px-10">
                  <div className="flex items-center gap-2.5">
                    <Link href={handleHref()}>
                      <Button
                        aria-label={`${isPlaying ? 'Pause' : 'Play'} show`}
                        className="group h-auto rounded-[9px] py-1.5 bg-neutral-50 text-black hover:bg-neutral-300">
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
                  {trailer && (
                    !trailerFinished ? (
                      <button
                        aria-label={`${isMuted ? 'Unmute' : 'Mute'} video`}
                        className="h-8 w-8 rounded-full cursor-pointer bg-black/70 ring-2 ring-white/50 hover:ring-white text-white/50 hover:text-white hover:bg-white/20 transition-all duration-500 p-0 flex items-center justify-center"
                        onClick={handleChangeMute}>
                        {isMuted ? (
                          <Icons.volumeMute className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <Icons.volume className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      <button
                        aria-label="Replay trailer"
                        className="h-8 w-8 rounded-full cursor-pointer bg-black/70 ring-2 ring-white/50 hover:ring-white text-white/50 hover:text-white hover:bg-white/20 transition-all duration-500 p-0 flex items-center justify-center"
                        onClick={handleReplay}>
                        <Icons.replay className="h-5 w-5" aria-hidden="true" />
                      </button>
                    )
                  )}
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="relative flex w-full z-40 gap-4 -mt-10 px-10 pb-10">
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
                      <p className='text-slate-200 font-bold text-sm'>{getYear(modalStore.show?.release_date)}</p>
                    ) : modalStore.show?.first_air_date ? (
                      <p className='text-slate-200 font-bold text-sm'>{getYear(modalStore.show?.first_air_date)}</p>
                    ) : null}
                    
                    {/* Duration */}
                    {runtime && (
                      <p className='text-slate-200 font-bold text-sm'>{Math.floor(runtime / 60)}h {runtime % 60}m</p>
                    )}
                  
                  {/* Quality Badge */}
                  <span className="place-items-center text-[10px] font-semibold rounded-[3px] px-1.5 py-0 text-neutral-300 border border-neutral-500">
                    HD
                  </span>
                  
                  
                  {/* Language */}
                  {modalStore.show?.original_language && (
                    <span className="place-items-center text-[10px] font-bold rounded-[3px] px-1.5 py-0 text-neutral-300 border border-neutral-500">
                      {modalStore.show.original_language.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Age Rating */}
                  <span className="place-items-center w-9 text-center text-[12px] font-bold px-[0.4rem] text-neutral-200 border border-neutral-400">
                    {contentRating ?? '16+'}
                  </span>
                  {/* KeyWords */}
                  <span className="text-sm text-slate-50">
                    {keywords.length > 0 
                      ? keywords.slice(0, 3).map(keyword => keyword.name).join(', ')
                      : 'content warning'
                    }
                  </span>
                </div>

                {/* Description */}
                <DialogDescription className="pt-5 text-[15px] text-slate-50 leading-relaxed">
                  {modalStore.show?.overview ?? '-'}
                </DialogDescription>
                </div>

                <div className="w-1/4 flex-col flex gap-3 text-sm text-neutral-400">
                  {/* Left Column */}
                  <div className="">
                    <div>
                      <span className="text-neutral-50">Cast: </span>
                      <span>
                        {cast.length > 0 
                          ? `${cast.map(actor => actor.name).join(', ')}, more`
                          : '-'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div className="">
                    <div>
                      <span className="text-neutral-50">Genres: </span>
                      <span>{genres.map((genre) => genre.name).join(', ')}</span>
                    </div>
                  </div>

                </div>

            </div>

            {/* Movie Collection Section */}
            {movieCollection && modalStore.show?.media_type === MediaType.MOVIE && (
                <div className="px-10 pb-6">
                  <div className="flex gap-4 items-start justify-start">
                    <Icons.library/>
                    <h3 className="text-xl font-semibold text-white mb-4">{movieCollection.name} Collection</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {movieCollection.parts?.map((movie: any, index: number) => (
                      <div key={movie.id} className="group flex gap-3 bg-neutral-800 rounded-lg p-3 cursor-pointer hover:bg-neutral-700/60 transition" onClick={() => navigateToMovie(movie.id)}>
                        <div className="w-16 h-24 flex-shrink-0 relative">
                          <CustomImage
                            src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover rounded"
                            width={64}
                            height={96}
                          />
                          <div className="absolute inset-0 rounded bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <Icons.play className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{movie.title}</h4>
                          <p className="text-neutral-400 text-xs mt-1">{getYear(movie.release_date)}</p>
                          <p className="text-neutral-500 text-xs mt-1 line-clamp-2">{movie.overview}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            )}

            {/* TV Seasons Section */}
            {tvSeasons && modalStore.show?.media_type === MediaType.TV && (
                <div className="px-10 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">Episodes</h3>
                    {tvSeasons.seasons && tvSeasons.seasons.length > 1 && (
                      <select
                        value={selectedSeason}
                        onChange={(e) => handleSeasonChange(Number(e.target.value))}
                        className="bg-neutral-800 text-white px-3 py-1 rounded border border-neutral-600"
                      >
                        {tvSeasons.seasons.map((season: any) => (
                          <option key={season.season_number} value={season.season_number}>
                            Season {season.season_number}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {seasonEpisodes.length > 0 && (
                    <div className="space-y-3">
                      {seasonEpisodes.map((episode: any, index: number) => (
                        <div key={episode.id} className="group flex gap-4 bg-neutral-800 rounded-lg p-4 cursor-pointer hover:bg-neutral-700/60 transition" onClick={() => navigateToEpisode(selectedSeason, episode.episode_number)}>
                          <div className="w-32 h-20 flex-shrink-0 relative">
                            <CustomImage
                              src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                              alt={episode.name}
                              className="w-full h-full object-cover rounded"
                              width={128}
                              height={80}
                            />
                            <div className="absolute inset-0 rounded bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <Icons.play className="w-7 h-7 text-white" />
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                              {Math.floor(episode.runtime / 60)}h {episode.runtime % 60}m
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium text-sm">{episode.episode_number}</span>
                              <span className="text-neutral-400 text-sm">{episode.name}</span>
                            </div>
                            <p className="text-neutral-300 text-sm line-clamp-2">{episode.overview}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            )}

            <button className="absolute p-1 bg-black top-4 right-4 z-30 rounded-full opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none cursor-pointer text-slate-50"
              onClick={handleCloseModal}
            >
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
