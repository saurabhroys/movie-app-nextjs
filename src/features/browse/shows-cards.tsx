import { hoverModal$, hoverModalActions } from '@/state/hover-modal';
import { previewModalActions } from '@/state/preview-modal';
import { type Show } from '@/services/tmdb/types';
import * as React from 'react';

// import { useRouter } from 'next/navigation';

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
  // const router = useRouter();
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
    // If a different show's preview is currently open, wipe it immediately
    // before arming the new hover timer so the old modal never lingers.
    const currentHoverId = hoverModal$.show.get()?.id;
    if (
      currentHoverId != null &&
      currentHoverId !== show.id &&
      hoverModal$.isOpen.get()
    ) {
      hoverModalActions.reset();
    }

    // Mark the hover zone as active so the modal stays open during card→modal transit
    hoverModalActions.setIsActive(true);

    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const immediate = hoverModal$.isOpen.get();
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    const run = () => {
      hoverModalActions.openHoverPreview({
        show,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
      });
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
    // Mark the pointer as outside the hover zone (card or modal) so the
    // close timer below is not skipped. The modal's onMouseEnter / the next
    // card's onMouseEnter re-set this to true, so leaving the card alone
    // never keeps the modal stuck open.
    hoverModalActions.setIsActive(false);
    // Increase timeout to 400ms to give the user enough time to move from the
    // card onto the modal surface. The modal's handleModalMouseLeave arms a
    // 300ms timer, so this longer window lets the card's timer fire first
    // (and see isActive=true once the modal is hovered).
    closeTimerRef.current = window.setTimeout(() => {
      // Only close if this card's own preview is still the one being shown.
      // If the user has already moved to another card, leave the new modal
      // untouched.
      if (hoverModal$.show.get()?.id !== show.id) return;
      const isActive = hoverModal$.isActive.get();
      if (!isActive) {
        hoverModalActions.reset();
      }
    }, 400);
  };

  const handleMoreDetails = () => {
    hoverModalActions.reset();
    previewModalActions.openPreviewModal({ show, play: true });
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
