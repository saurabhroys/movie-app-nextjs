import { usePreviewModalStore } from '@/stores/preview-modal';
import { useHoverModalStore } from '@/stores/hover-modal';
import { type Show } from '@/types';
import * as React from 'react';
import MovieService from '@/services/MovieService';

import { getMobileDetect, getNameFromShow, getSlug } from '@/lib/utils';
import CustomImage from './custom-image';

const userAgent =
  typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;
const { isMobile } = getMobileDetect(userAgent);

interface ShowCardProps {
  show: Show;
  pathname?: string;
}

export const ShowCard = ({ show, pathname: _pathname }: ShowCardProps) => {
  const previewModalStore = useHoverModalStore();
  const openTimerRef = React.useRef<number | null>(null);
  const closeTimerRef = React.useRef<number | null>(null);
  const IS_MOBILE = isMobile();
  const [logoPath, setLogoPath] = React.useState<string | null>(null);
  const imageOnErrorHandler = (
    event: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    event.currentTarget.src = '/images/grey-thumbnail.jpg';
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't show preview modal on mobile devices
    if (IS_MOBILE) return;

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const immediate = useHoverModalStore.getState().isOpen;
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
    // Don't handle mouse leave on mobile devices
    if (IS_MOBILE) return;

    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      const { isActive } = useHoverModalStore.getState();
      if (!isActive) {
        previewModalStore.setIsOpen(false);
        previewModalStore.setAnchorRect(null);
        previewModalStore.setShow(null);
      }
    }, 160);
  };

  React.useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const apiMediaType =
          (show.media_type as string) === 'movie' ? 'movie' : 'tv';
        const { data } = await MovieService.getImages(apiMediaType, show.id);
        const preferred =
          data.logos?.find((l) => l.iso_639_1 === 'en') ?? data.logos?.[0];
        if (isActive) setLogoPath(preferred ? preferred.file_path : null);
      } catch {
        if (isActive) setLogoPath(null);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [show.id, show.media_type]);



  const handleMoreDetails = () => {
    const name = getNameFromShow(show);
    const path: string =
      (show.media_type as string) === 'tv' ? 'tv-shows' : 'movies';
    window.history.pushState(null, '', `/${path}/${getSlug(show.id, name)}`);
    usePreviewModalStore.setState({
      show: show,
      isOpen: true,
      play: true,
    });
  };

  const handleMobileCardClick = () => {
    if (IS_MOBILE) {
      handleMoreDetails();
    }
  };
  // console.log("show in card", show);

  return (
    <div
      className="group relative aspect-video"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleMobileCardClick}>
      <a
        className="pointer-events-none"
        aria-hidden={false}
        role="link"
        aria-label={getNameFromShow(show)}
        href={`/${show.media_type}/${getSlug(show.id, getNameFromShow(show))}`}
      />
      <div className="relative h-full w-full">
        <CustomImage
          src={
            (show.backdrop_path ?? show.poster_path)
              ? `https://image.tmdb.org/t/p/w780${show.backdrop_path ?? show.poster_path
              }`
              : '/images/grey-thumbnail.jpg'
          }
          alt={show.title ?? show.name ?? 'poster'}
          className="h-full w-full cursor-pointer rounded-lg px-1 transition-all"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 100vw, 33vw"
          style={{
            objectFit: 'cover',
          }}
          fill
          onError={imageOnErrorHandler}
        />
      </div>
      {logoPath && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden px-2">
          <div className="relative h-12 w-full max-w-[85%]">
            <CustomImage
              src={`https://image.tmdb.org/t/p/w500${logoPath}`}
              alt={show.title ?? show.name ?? 'logo'}
              style={{
                objectFit: 'contain',
              }}
              fill
              onError={imageOnErrorHandler}
            />
          </div>
        </div>
      )}

      {/* Hover preview is now portal-based via PreviewModal */}
    </div>
  );
};
