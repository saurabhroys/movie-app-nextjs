'use client';
import { useModalStore } from '@/stores/modal';
import { usePreviewModalStore } from '@/stores/preview-modal';
import { MediaType, type Genre, type KeyWord, type ShowWithGenreAndVideo, type VideoResult } from '@/types';
import { getMobileDetect } from '@/lib/utils';
import MovieService from '@/services/MovieService';
import CustomImage from './custom-image';
import Youtube from 'react-youtube';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import * as React from 'react';

const userAgent = typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;
const { isMobile } = getMobileDetect(userAgent);
const defaultOptions = {
  playerVars: {
    rel: 0, mute: isMobile() ? 1 : 0, loop: 1, autoplay: 1, controls: 0, showinfo: 0, disablekb: 1, enablejsapi: 1, playsinline: 1, cc_load_policy: 0, modestbranding: 3,
  },
};

const PreviewModal = () => {
  const modalStore = useModalStore();
  const previewModalStore = usePreviewModalStore();
  const IS_MOBILE = isMobile();
  const [trailer, setTrailer] = React.useState('');
  const [genres, setGenres] = React.useState<Genre[]>([]);
  const [isAnime, setIsAnime] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(modalStore.firstLoad || IS_MOBILE);
  const [options, setOptions] = React.useState(defaultOptions);
  const youtubeRef = React.useRef(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (modalStore.firstLoad || IS_MOBILE) setOptions(s => ({ ...s, playerVars: { ...s.playerVars, mute: 1 } }));
    (async () => {
      const id = modalStore.show?.id, type = modalStore.show?.media_type === MediaType.TV ? 'tv' : 'movie';
      if (!id || !type) return;
      const data: ShowWithGenreAndVideo = await MovieService.findMovieByIdAndType(id, type);
      const keywords: KeyWord[] = data?.keywords?.results || data?.keywords?.keywords;
      if (keywords?.length) setIsAnime(!!keywords.find(k => k.name === 'anime'));
      if (data?.genres) setGenres(data.genres);
      if (data.videos?.results?.length) {
        const result = data.videos.results.find((v: VideoResult) => v.type === 'Trailer');
        if (result?.key) setTrailer(result.key);
      }
    })();
  }, []);
  React.useEffect(() => { setIsAnime(false); }, [modalStore]);

  const handleCloseModal = () => {
    modalStore.reset();
    previewModalStore.reset();
    if (!modalStore.show || modalStore.firstLoad) window.history.pushState(null, '', '/home');
    else window.history.back();
  };

  const handleChangeMute = () => {
    setIsMuted(m => !m);
    const videoRef: any = youtubeRef.current;
    if (!videoRef) return;
    if (isMuted) videoRef.internalPlayer.unMute();
    else videoRef.internalPlayer.mute();
  };

  const handleHref = () => {
    const type = isAnime ? 'anime' : modalStore.show?.media_type === MediaType.MOVIE ? 'movie' : 'tv';
    let id = `${modalStore.show?.id}`;
    if (isAnime) id = `${modalStore.show?.media_type === MediaType.MOVIE ? 'm' : 't'}-${id}`;
    return `/watch/${type}/${id}`;
  };

  const getRuntime = () =>
    modalStore.show?.media_type === MediaType.TV
      ? modalStore.show.number_of_seasons ? `${modalStore.show.number_of_seasons} Seasons` : null
      : modalStore.show?.runtime ? `${modalStore.show.runtime} min` : null;

  const getAgeRating = () =>
    modalStore.show?.adult ? '18+' : (modalStore.show?.vote_average || 0) >= 7 ? '16+' : (modalStore.show?.vote_average || 0) >= 5 ? '13+' : 'PG';

  const getQuality = () =>
    (modalStore.show?.vote_average || 0) >= 8 ? 'HD' : 'SD';

  const getGenres = () => genres.slice(0, 3).map(g => g.name).join(' • ');

  if (!modalStore.open || !modalStore.show) return null;

  // Calculate position based on card position
  const getPosition = () => {
    if (!previewModalStore.cardPosition) {
      // Fallback to center if no card position
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const { x, y, width, height } = previewModalStore.cardPosition;
    const modalWidth = 320; // w-80 = 320px
    const modalHeight = 240; // approximate height
    const padding = 20;

    // Position modal to the right of the card by default
    let top = y - modalHeight / 2;
    let left = x + width / 2 + 10; // 10px gap from card

    // If not enough space on the right, position to the left
    if (left + modalWidth > window.innerWidth - padding) {
      left = x - modalWidth - 10; // 10px gap from card
    }

    // If still not enough space, center horizontally
    if (left < padding) {
      left = Math.max(padding, (window.innerWidth - modalWidth) / 2);
    }

    // Adjust vertical position if needed
    if (top < padding) {
      top = padding;
    } else if (top + modalHeight > window.innerHeight - padding) {
      top = window.innerHeight - modalHeight - padding;
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      transform: 'none'
    };
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-label="Preview overlay"
    >
      <div 
        className="absolute w-80 max-w-[90vw] pointer-events-auto transition-all duration-200"
        style={getPosition()}
      >
        <div className="overflow-hidden rounded-lg bg-black shadow-2xl border border-gray-600">
        <div className="relative aspect-video">
            <CustomImage 
              fill 
              priority 
              ref={imageRef} 
              alt={modalStore?.show?.title ?? 'poster'}
            className="z-1 h-auto w-full object-cover"
            src={`https://image.tmdb.org/t/p/original${modalStore.show?.backdrop_path ?? modalStore.show?.poster_path}`}
            sizes="50vw"
          />
          {trailer && (
            <Youtube
              opts={options}
              onEnd={e => e.target.seekTo(0)}
                onPlay={() => { 
                  if (imageRef.current) imageRef.current.style.opacity = '0'; 
                  const i = document.getElementById('video-trailer'); 
                  if (i) i.classList.remove('opacity-0'); 
                }}
              ref={youtubeRef}
              onReady={e => e.target.playVideo()}
              videoId={trailer}
              id="video-trailer"
              title={modalStore.show?.title ?? modalStore.show?.name ?? 'video-trailer'}
              className="relative aspect-video w-full"
              style={{ width: '100%', height: '100%' }}
              iframeClassName="relative pointer-events-none w-full h-full z-[-10] opacity-0"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
          <div className="absolute bottom-2 z-20 flex w-full items-center justify-between gap-2 px-2">
            <div className="flex items-center gap-2">
              <Button 
                aria-label="Play show" 
                className="group h-7 w-7 rounded-full bg-white text-black hover:bg-gray-200 transition-all duration-200 hover:scale-105 p-0"
                onClick={() => {
                  window.location.href = handleHref();
                }}
              >
                <Icons.play className="h-4 w-4 fill-current" />
              </Button>
              <Button aria-label="Add to watchlist" className="h-7 w-7 rounded-full bg-black/50 border border-white/30 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 p-0">
                <Icons.plus className="h-4 w-4" />
              </Button>
              <Button aria-label="Like show" className="h-7 w-7 rounded-full bg-black/50 border border-white/30 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 p-0">
                <Icons.thumbsUp className="h-4 w-4" />
              </Button>
            </div>
            <Button aria-label={`${isMuted ? 'Unmute' : 'Mute'} video`} className="h-7 w-7 rounded-full bg-black/50 border border-white/30 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 p-0" onClick={handleChangeMute}>
              {isMuted ? <Icons.volumeMute className="h-4 w-4" /> : <Icons.volume className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="bg-black px-2 py-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">{getAgeRating()}</span>
            {getRuntime() && <span className="text-white text-xs font-medium">{getRuntime()}</span>}
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">{getQuality()}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-300 mb-1">
            {getGenres() && <span>{getGenres()}</span>}
          </div>
            <p className="text-white text-xs leading-snug max-w-xs">
            {modalStore.show?.overview ?? 'No description available.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
