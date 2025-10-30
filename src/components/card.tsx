import { useModalStore } from '@/stores/modal';
import { usePreviewModalStore } from '@/stores/preview-modal';
import { Genre, MediaType, type Show } from '@/types';
import * as React from 'react';

import { getMobileDetect, getNameFromShow, getSlug } from '@/lib/utils';
import CustomImage from './custom-image';
import YouTube from 'react-youtube';
import { Button } from './ui/button';
import { Icons } from './icons';

const userAgent = typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;
const { isMobile } = getMobileDetect(userAgent);
const defaultOptions = {
  playerVars: {
    rel: 0, mute: isMobile() ? 1 : 0, loop: 1, autoplay: 1, controls: 0, showinfo: 0, disablekb: 1, enablejsapi: 1, playsinline: 1, cc_load_policy: 0, modestbranding: 3,
  },
};

interface ShowCardProps {
  show: Show;
  pathname: string;
}

export const ShowCard = ({ show, pathname }: ShowCardProps) => {
    const previewModalStore = usePreviewModalStore();
    const [isHovered, setIsHovered] = React.useState(false);
    const imageOnErrorHandler = (
      event: React.SyntheticEvent<HTMLImageElement, Event>,
    ) => {
      event.currentTarget.src = '/images/grey-thumbnail.jpg';
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
      previewModalStore.setIsActive(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      previewModalStore.setIsActive(false);
    };

	const IS_MOBILE = isMobile();
	const [trailer, setTrailer] = React.useState('');
	const [genres, setGenres] = React.useState<Genre[]>([]);
	const [isAnime, setIsAnime] = React.useState(false);
	const [isMuted, setIsMuted] = React.useState(IS_MOBILE);
	const [options, setOptions] = React.useState(defaultOptions);
	const youtubeRef = React.useRef(null);
	const imageRef = React.useRef<HTMLImageElement>(null);

	const handleHref = () => {
		const type = isAnime ? 'anime' : show?.media_type === MediaType.MOVIE ? 'movie' : 'tv';
		let id = `${show?.id}`;
		if (isAnime) id = `${show?.media_type === MediaType.MOVIE ? 'm' : 't'}-${id}`;
		return `/watch/${type}/${id}`;
	  };

	const getRuntime = () =>
	  show?.media_type === MediaType.TV
		? show.number_of_seasons ? `${show.number_of_seasons} Seasons` : null
		: show?.runtime ? `${show.runtime} min` : null;

	const getAgeRating = () => show?.adult ? '18+' : (show?.vote_average || 0) >= 7 ? '16+' : (show?.vote_average || 0) >= 5 ? '13+' : 'PG';

	const getQuality = () => (show?.vote_average || 0) >= 8 ? 'HD' : 'SD';

	const getGenres = () => genres.slice(0, 3).map(g => g.name).join(' • ');


	const handleChangeMute = () => {
		setIsMuted(m => !m);
		const videoRef: any = youtubeRef.current;
		if (!videoRef) return;
		if (isMuted) videoRef.internalPlayer.unMute();
		else videoRef.internalPlayer.mute();
	  };
	
	const handleMoreDetails = () => {
		const name = getNameFromShow(show);
        const path: string =
          show.media_type === MediaType.TV ? 'tv-shows' : 'movies';
        window.history.pushState(
          null,
          '',
          `${path}/${getSlug(show.id, name)}`,
        );
        useModalStore.setState({
          show: show,
          open: true,
          play: true,
        });
	  };
	//   console.log("show in ShowCard", show);
  
    return (
      <div className="relative aspect-video group hover:scale-125 transition-all duration-10 hover:z-50" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <a
          className="pointer-events-none"
          aria-hidden={false}
          role="link"
          aria-label={getNameFromShow(show)}
          href={`/${show.media_type}/${getSlug(show.id, getNameFromShow(show))}`}
        />
        <CustomImage
          src={
            (show.backdrop_path ?? show.poster_path)
              ? `https://image.tmdb.org/t/p/w780${
                  show.backdrop_path ?? show.poster_path
                }`
              : '/images/grey-thumbnail.jpg'
          }
          alt={show.title ?? show.name ?? 'poster'}
          className="h-full w-full cursor-pointer rounded-lg px-1 transition-all"
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 100vw, 33vw"
          style={{
            objectFit: 'cover',
          }}
          onClick={() => {
            const name = getNameFromShow(show);
            const path: string =
              show.media_type === MediaType.TV ? 'tv-shows' : 'movies';
            window.history.pushState(
              null,
              '',
              `${path}/${getSlug(show.id, name)}`,
            );
            useModalStore.setState({
              show: show,
              open: true,
              play: true,
            });
          }}
          onError={imageOnErrorHandler}
        />

        	{isHovered && (
				<div className="relative bg-black/50">
					<div className="absolute z-50 w-full pointer-events-auto">
						<div className="overflow-hidden rounded-lg bg-black shadow-2xl border border-neutral-600">
							<div className="relative aspect-video">
								<CustomImage 
									fill 
									priority 
									ref={imageRef} 
									alt={previewModalStore?.show?.title ?? 'poster'}
									className="z-1 w-full object-cover"
									src={`https://image.tmdb.org/t/p/original${show?.backdrop_path ?? show?.poster_path}`}
									sizes="50vw"
								/>
								{trailer && (
									<YouTube
										opts={options}
										onEnd={e => e.target.seekTo(0)}
										onPlay={() => { 
											if (imageRef.current) imageRef.current.style.opacity = '0'; 
											const i = document.getElementById('video-trailer'); 
											if (i) i.classList.remove('opacity-0'); 
										}}
										ref={youtubeRef}
										onReady={e => { try { e?.target?.playVideo?.(); } catch {} }}
										videoId={trailer}
										id="video-trailer"
										title={show?.title ?? show?.name ?? 'video-trailer'}
										className="relative aspect-video w-full"
										style={{ width: '100%', height: '100%' }}
										iframeClassName="relative pointer-events-none w-full h-full z-[-10] opacity-0"
									/>
								)}
								<div className="absolute -bottom-1 inset-0 bg-linear-to-t from-black via-black/20 to-transparent z-10"></div>
								<div className="absolute bottom-2 z-20 flex w-full items-center justify-between gap-2 px-2">
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
									</div>

									<Button aria-label={`${isMuted ? 'Unmute' : 'Mute'} video`} className="h-7 w-7 rounded-full bg-black/50 border border-white/30 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 p-0" onClick={handleChangeMute}>
										{isMuted ? <Icons.volumeMute className="h-4 w-4" /> : <Icons.volume className="h-4 w-4" />}
									</Button>
								</div>
							</div>
							<a className="bg-black px-2" href='' >
								<div className="w-full px-2">
									<div className="flex items-center justify-between gap-2 mb-2">
										<div className="flex items-center gap-2">
											<span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">{getAgeRating()}</span>
											{getRuntime() && <span className="text-white text-xs font-medium">{getRuntime()}</span>}
											<span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">{getQuality()}</span>
										</div>

                                    <Button className="h-7 w-7 rounded-full bg-black/50 border border-white/30 text-white hover:bg-white/20 transition-all duration-200 hover:scale-105 p-0" 
										onClick={handleMoreDetails}
										data-tooltip="More details"
										>
                                        <Icons.chevronDown className="h-4 w-4" />
                                    </Button>

									</div>
									<div className="flex items-center gap-1 text-xs text-neutral-300 mb-1">
									{getGenres() && <span>{getGenres()}</span>}
									</div>
									<h1 className="text-white text-md font-medium">{show?.title}</h1>
									<span className="text-white text-xs font-medium">{show.release_date}</span>
								</div>
							</a>
						</div>
					</div>
				</div>
              )}
        </div>
    );
  };