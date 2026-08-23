import { observable } from '@legendapp/state';
import type { MediaType, Show } from '@/services/tmdb/types';
import type { DetailedShowInfo } from '@/features/modals/detail-fetch-helper';
import { getShowDetails } from '@/server/actions/get-show-details';

export interface SerializedRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface HoverModalState {
  show: Show | null;
  detailedShow: DetailedShowInfo | null;
  isOpen: boolean;
  anchorRect: SerializedRect | null;
  isActive: boolean;
  isLoading: boolean;
}

const initialState: HoverModalState = {
  show: null,
  detailedShow: null,
  isOpen: false,
  anchorRect: null,
  isActive: false,
  isLoading: false,
};

export const hoverModal$ = observable<HoverModalState>(initialState);

export const hoverModalActions = {
  setShow: (show: Show | null) => hoverModal$.show.set(show),
  setDetailedShow: (detailedShow: DetailedShowInfo | null) =>
    hoverModal$.detailedShow.set(detailedShow),
  setIsOpen: (isOpen: boolean) => hoverModal$.isOpen.set(isOpen),
  setAnchorRect: (anchorRect: SerializedRect | null) =>
    hoverModal$.anchorRect.set(anchorRect),
  setIsActive: (isActive: boolean) => hoverModal$.isActive.set(isActive),
  setIsLoading: (isLoading: boolean) => hoverModal$.isLoading.set(isLoading),
  reset: () => hoverModal$.set({ ...initialState }),
  openHoverPreview: ({
    show,
    rect,
  }: {
    show: Show;
    rect: SerializedRect;
  }) => {
    hoverModal$.assign({
      show,
      anchorRect: rect,
      isOpen: true,
      isActive: true,
    });
  },
};

/**
 * Tracks the most recent in-flight fetch so a stale response from a
 * previous (different) show can't overwrite the current one. This avoids
 * race conditions when the user hovers rapidly across multiple cards.
 */
let hoverFetchSeq = 0;

/**
 * Fetches the preview data for the hover modal and stores it in the
 * hoverModal observable (replaces the former Redux thunk).
 */
export async function fetchPreviewData({
  id,
  mediaType,
}: {
  id: number;
  mediaType: MediaType;
}): Promise<DetailedShowInfo> {
  const seq = ++hoverFetchSeq;
  hoverModal$.isLoading.set(true);
  try {
    const data = await getShowDetails({ id, mediaType, includeExtras: false });

    // Drop the response if a newer fetch has been started in the meantime.
    // The sequence counter `seq` is the single source of truth — if a newer
    // fetch has started (seq !== hoverFetchSeq), this response is stale.
    if (seq !== hoverFetchSeq) {
      return data;
    }

    // Sync the effective media type resolved server-side (tv <-> movie 404 flip)
    const currentShow = hoverModal$.show.get();
    if (
      currentShow &&
      currentShow.id === id &&
      data.media_type &&
      data.media_type !== currentShow.media_type
    ) {
      hoverModal$.show.set({ ...currentShow, media_type: data.media_type });
    }

    hoverModal$.detailedShow.set(data);
    return data;
  } catch (error) {
    // Only surface errors from the latest request.
    if (seq === hoverFetchSeq) {
      console.error('Failed to fetch preview data:', error);
    }
    throw error;
  } finally {
    // Clear the loading flag only for the latest request.
    if (seq === hoverFetchSeq) {
      hoverModal$.isLoading.set(false);
    }
  }
}
