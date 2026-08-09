import { useAppDispatch } from '@/redux/hooks';
import { store } from '@/redux/store';
import {
  setIsOpen as hoverSetIsOpen,
  setAnchorRect as hoverSetAnchorRect,
  setShow as hoverSetShow,
  openHoverPreview,
} from '@/features/modals/hoverModalSlice';
import { openPreviewModal } from '@/features/modals/previewModalSlice';
import { type Show } from '@/services/tmdb/types';
import * as React from 'react';

import { getMobileDetect } from '@/lib/utils';
import { getNameFromShow, getSlug } from '@/lib/slug';
import CustomImage from '@/components/shared/custom-image';

const userAgent =
  typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;
const { isMobile } = getMobileDetect(userAgent);

interface ShowCardProps {
  show: Show;
  pathname?: string;
  logoPath?: string | null;
}

export const ShowCard = React.memo(({ show, pathname: _pathname, logoPath = null }: ShowCardProps) => {
  const dispatch = useAppDispatch();
  const openTimerRef = React.useRef<number | null>(null);
  const closeTimerRef = React.useRef<number | null>(null);
  const IS_MOBILE = isMobile();
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
    const immediate = store.getState().hoverModal.isOpen;
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    const run = () => {
      dispatch(
        openHoverPreview({
          show,
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
        }),
      );
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
      const { isActive } = store.getState().hoverModal;
      if (!isActive) {
        dispatch(hoverSetIsOpen(false));
        dispatch(hoverSetAnchorRect(null));
        dispatch(hoverSetShow(null));
      }
    }, 160);
  };

  const handleMoreDetails = () => {
    const name = getNameFromShow(show);
    const path: string =
      (show.media_type as string) === 'tv' ? 'tv-shows' : 'movies';
    window.history.pushState(null, '', `/${path}/${getSlug(show.id, name)}`);
    dispatch(openPreviewModal({ show, play: true }));
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
});
