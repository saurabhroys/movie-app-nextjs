'use client';
import { usePreviewModalStore } from '@/stores/preview-modal';
import { useModalStore } from '@/stores/modal';
import { MediaType, type Show, type Genre, type KeyWord, type ShowWithGenreAndVideo, type VideoResult } from '@/types';
import { getMobileDetect } from '@/lib/utils';
import MovieService from '@/services/MovieService';
import CustomImage from './custom-image';
import Youtube from 'react-youtube';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import * as React from 'react';
import { getNameFromShow, getSlug } from '@/lib/utils';

const userAgent = typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;
const { isMobile } = getMobileDetect(userAgent);
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
    iv_load_policy: 3,
    fs: 0,
  },
};

const PreviewModal = () => {
  const p = usePreviewModalStore();
  const modal = useModalStore();
  const IS_MOBILE = isMobile();
  const [trailer, setTrailer] = React.useState('');
  const [genres, setGenres] = React.useState<Genre[]>([]);
  const [isAnime, setIsAnime] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(IS_MOBILE);
  const [options, setOptions] = React.useState(defaultOptions);
  const [detailedShow, setDetailedShow] = React.useState<Show | null>(null);
  const youtubeRef = React.useRef(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (IS_MOBILE) setOptions(s => ({ ...s, playerVars: { ...s.playerVars, mute: 1 } }));
    (async () => {
      const id = p.show?.id, type = p.show?.media_type === MediaType.TV ? 'tv' : 'movie';
      if (!id || !type) return;
      // Try Hindi trailer first, fallback to English
      let data: ShowWithGenreAndVideo = await MovieService.findMovieByIdAndType(id, type, 'hi-IN');
      if (!data.videos?.results?.length) {
        data = await MovieService.findMovieByIdAndType(id, type, 'en-US');
      }
      const keywords: KeyWord[] = data?.keywords?.results || data?.keywords?.keywords;
      if (keywords?.length) setIsAnime(!!keywords.find(k => k.name === 'anime'));
      if (data?.genres) setGenres(data.genres);
      if (data) setDetailedShow(data); // Store the detailed show data with runtime
      if (data.videos?.results?.length) {
        const result = data.videos.results.find((v: VideoResult) => v.type === 'Trailer');
        if (result?.key) setTrailer(result.key);
      }
    })();
  }, [p.show]);
  React.useEffect(() => { setIsAnime(false); }, [p.show]);

  // Close preview when the main show modal opens
  React.useEffect(() => {
    if (!modal.open) return;
    p.setIsActive(false);
    p.setIsOpen(false);
    p.setAnchorRect(null);
    p.setShow(null);
  }, [modal.open]);

  const handleCloseModal = () => {
    p.reset();
  };

  const handleChangeMute = () => {
    setIsMuted(m => !m);
    const videoRef: any = youtubeRef.current;
    if (!videoRef) return;
    if (isMuted) videoRef.internalPlayer.unMute();
    else videoRef.internalPlayer.mute();
  };

  const handleHref = () => {
    if (!p.show?.id) return '#';
    const type = isAnime ? 'anime' : p.show?.media_type === MediaType.MOVIE ? 'movie' : 'tv';
    let id = `${p.show.id}`;
    if (isAnime) id = `${p.show?.media_type === MediaType.MOVIE ? 'm' : 't'}-${id}`;
    return `/watch/${type}/${id}`;
  };

  const getRuntime = () =>
    p.show?.media_type === MediaType.TV
      ? p.show.number_of_seasons ? `${p.show.number_of_seasons} Seasons` : null
      : p.show?.runtime ? `${p.show.runtime} min` : null;


  const getQuality = () => (p.show?.vote_average || 0) >= 8 ? 'HD' : 'SD';

  const getGenres = () => genres.slice(0, 3).map(g => g.name).join(' • ');

  // animate in/out on show change
  const [animKey, setAnimKey] = React.useState<string>('');
  React.useEffect(() => {
    if (p.show) {
      setAnimKey(`${p.show.id}-${Date.now()}`);
    }
  }, [p.show]);

  // Stop trailer when preview closes
  React.useEffect(() => {
    const player: any = youtubeRef.current;
    if (!player?.internalPlayer) return;
    if (!p.isOpen) {
      try {
        player.internalPlayer.stopVideo?.();
        player.internalPlayer.seekTo?.(0);
      } catch {}
      if (imageRef.current) imageRef.current.style.opacity = '1';
    }
  }, [p.isOpen]);

  // Close preview on any scroll start (wheel, scroll, touchmove)
  React.useEffect(() => {
    if (!p.isOpen) return;
    const close = () => {
      p.setIsActive(false);
      p.setIsOpen(false);
      p.setAnchorRect(null);
      p.setShow(null);
    };
    const onWheel = () => close();
    const onScroll = () => close();
    const onTouchMove = () => close();
    window.addEventListener('wheel', onWheel, { passive: true, capture: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
    return () => {
      window.removeEventListener('wheel', onWheel, true as unknown as EventListenerOptions);
      window.removeEventListener('scroll', onScroll, true as unknown as EventListenerOptions);
      window.removeEventListener('touchmove', onTouchMove, true as unknown as EventListenerOptions);
    };
  }, [p.isOpen]);

  if (!p.isOpen || !p.show) return null;

  // Calculate position based on anchor rect
  const getPosition = () => {
    const rect = p.anchorRect;
    if (!rect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    const modalWidth = 320; // w-80
    const modalHeight = 240; // approx
    const y = Math.max(8, rect.top - modalHeight * 0.3);
    let x = rect.left + rect.width / 2 - modalWidth / 2;
    x = Math.max(8, Math.min(x, window.innerWidth - modalWidth - 8));
    return { top: `${Math.round(y)}px`, left: `${Math.round(x)}px` };
  };

  const handleMoreDetails = () => {
    if (!p.show) return;
    const current = p.show;
    const name = getNameFromShow(current);
    const path: string = current.media_type === MediaType.TV ? 'tv-shows' : 'movies';
    const player: any = youtubeRef.current;
    try {
      player?.internalPlayer?.pauseVideo?.();
      player?.internalPlayer?.stopVideo?.();
    } catch {}
    // Open the main modal on the next frame for smoother transition
    requestAnimationFrame(() => {
      window.history.pushState(null, '', `${path}/${getSlug(current.id, name)}`);
      useModalStore.setState({ show: current, open: true, play: true });
    });
  };


  console.log("detailedShow", detailedShow);
  



  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-label="Preview overlay"
      onMouseEnter={() => p.setIsActive(true)}
      onMouseLeave={() => {
        p.setIsActive(false);
        p.setIsOpen(false);
        p.setAnchorRect(null);
        p.setShow(null);
      }}
    >
      <div
        key={animKey}
        className="absolute w-80 max-w-[90vw] pointer-events-auto will-change-transform animate-in fade-in-0 zoom-in-95 duration-150"
        style={getPosition()}
        onWheel={() => {
          p.setIsActive(false);
          p.setIsOpen(false);
          p.setAnchorRect(null);
          p.setShow(null);
        }}
      >
        <div className="overflow-hidden rounded-md bg-black border shadow-md shadow-neutral-800">
			<div className="relative aspect-video">
				<CustomImage 
				fill 
				priority 
				ref={imageRef} 
				alt={p?.show?.title ?? 'poster'}
				className="z-1 h-auto w-full object-cover"
				src={`https://image.tmdb.org/t/p/original${p.show?.backdrop_path ?? p.show?.poster_path}`}
				sizes="50vw"
			/>
			{trailer && (
				<Youtube
				key={trailer}
				opts={options}
				onEnd={(e: any) => {
					try {
					e.target.seekTo(0);
					if (p.isOpen) e.target.playVideo();
					else e.target.stopVideo?.();
					} catch {}
				}}
				onPlay={(e: any) => {
					if (!p.isOpen) {
					try { e.target.pauseVideo(); } catch {}
					return;
					}
					if (imageRef.current) imageRef.current.style.opacity = '0';
					const i = document.getElementById('video-trailer');
					if (i) i.classList.remove('opacity-0');
				}}
				ref={youtubeRef}
				onReady={(e: any) => {
					try {
					if (p.isOpen) e.target.playVideo();
					} catch {}
				}}
				videoId={trailer}
				id="video-trailer"
				title={p.show?.title ?? p.show?.name ?? 'video-trailer'}
				className="relative aspect-video w-full h-full"
				iframeClassName="relative pointer-events-none w-full h-full"
				/>
			)}
			<div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
			<div className="absolute bottom-2 z-20 flex w-full items-center justify-between gap-2 px-2">
				<div className="flex items-center gap-2">

				</div>
				<Button aria-label={`${isMuted ? 'Unmute' : 'Mute'} video`} className="h-7 w-7 rounded-full bg-black/50 border border-white/30 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 p-0" onClick={handleChangeMute}>
				{isMuted ? <Icons.volumeMute className="h-4 w-4" /> : <Icons.volume className="h-4 w-4" />}
				</Button>
			</div>
			</div>
			<Link className="bg-black px-3" href={handleHref()} >
				<div className="w-full px-2">
					<div className="flex items-center justify-between gap-2 mb-2">

						<div className="flex items-center gap-2">
							<Button 
								aria-label="Play show" 
								className="group h-7 w-7 rounded-full bg-white text-black hover:bg-neutral-200 transition-all duration-200 hover:scale-105 p-0"
								onClick={() => {
								window.location.href = handleHref();
								}}
							>
								<Icons.play className="h-4 w-4 fill-current" />
							</Button>
							{getRuntime() && <span className="text-white text-xs font-medium">{getRuntime()}</span>}
							<span className="border text-white font-bold text-[8px] px-1 py-0.5 rounded">{getQuality()}</span>
						</div>

						<Button className="h-7 w-7 rounded-full bg-black/50 border border-white/30 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 p-0" 
							onClick={handleMoreDetails}
							data-tooltip="More details"
							>
							<Icons.chevronDown className="h-4 w-4"/>
						</Button>

					</div>
					<div className="flex items-center gap-1 text-xs text-neutral-300 mb-1">
					{getGenres() && <span>{getGenres()}</span>}
					</div>
					<h1 className="text-white text-md font-medium">{p.show.title || p.show.name}</h1>
					<span className="text-white text-xs font-medium">{p.show.release_date}</span>
					<span className="border text-white font-bold text-[8px] px-1 py-0.5 rounded">
						{detailedShow?.media_type === MediaType.MOVIE 
							? (() => {
								const runtime = detailedShow.runtime;
								if (!runtime) return 'N/A';
								const hours = Math.floor(runtime / 60);
								const minutes = runtime % 60;
								return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
							})()
							: `${detailedShow?.number_of_seasons} Season${detailedShow?.number_of_seasons !== 1 ? 's' : ''} • ${detailedShow?.number_of_episodes} Episode${detailedShow?.number_of_episodes !== 1 ? 's' : ''}`
						}
					</span>
				</div>
			</Link>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
