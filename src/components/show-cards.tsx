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
    const openTimerRef = React.useRef<number | null>(null);
    const closeTimerRef = React.useRef<number | null>(null);
    const imageOnErrorHandler = (
      event: React.SyntheticEvent<HTMLImageElement, Event>,
    ) => {
      event.currentTarget.src = '/images/grey-thumbnail.jpg';
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(true);
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      const target = e.currentTarget as HTMLDivElement;
      const rect = target.getBoundingClientRect();
      const immediate = usePreviewModalStore.getState().isOpen;
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
      const run = () => {
        previewModalStore.setIsActive(true);
        previewModalStore.setShow(show);
        previewModalStore.setAnchorRect(rect);
        previewModalStore.setIsOpen(true);
      };
      if (immediate) run();
      else {
        openTimerRef.current = window.setTimeout(run, 120);
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      if (openTimerRef.current) {
        window.clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = window.setTimeout(() => {
        const { isActive } = usePreviewModalStore.getState();
        if (!isActive) {
          previewModalStore.setIsOpen(false);
          previewModalStore.setAnchorRect(null);
          previewModalStore.setShow(null);
        }
      }, 160);
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
	
    // console.log("show in card", show);
  
    return (
      <div className="relative aspect-video group" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
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
        //   onClick={() => {
        //     const name = getNameFromShow(show);
        //     const path: string =
        //       show.media_type === MediaType.TV ? 'tv-shows' : 'movies';
        //     window.history.pushState(
        //       null,
        //       '',
        //       `${path}/${getSlug(show.id, name)}`,
        //     );
        //     useModalStore.setState({
        //       show: show,
        //       open: true,
        //       play: true,
        //     });
        //   }}
          onError={imageOnErrorHandler}
        />

        {/* Hover preview is now portal-based via PreviewModal */}
        </div>
    );
  };