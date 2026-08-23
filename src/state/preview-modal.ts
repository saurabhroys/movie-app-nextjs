import { observable } from '@legendapp/state';
import type { MediaType, Show } from '@/services/tmdb/types';
import type { DetailedShowInfo } from '@/features/modals/detail-fetch-helper';
import { getShowDetails } from '@/server/actions/get-show-details';

export interface PreviewModalState {
  isOpen: boolean;
  firstLoad: boolean;
  show: Show | null;
  detailedShow: DetailedShowInfo | null;
  isLoading: boolean;
  play: boolean;
}

const initialState: PreviewModalState = {
  isOpen: false,
  firstLoad: false,
  show: null,
  detailedShow: null,
  isLoading: false,
  play: false,
};

export const previewModal$ = observable<PreviewModalState>(initialState);

export const previewModalActions = {
  setIsOpen: (isOpen: boolean) => previewModal$.isOpen.set(isOpen),
  setFirstLoad: (firstLoad: boolean) => previewModal$.firstLoad.set(firstLoad),
  setShow: (show: Show | null) => previewModal$.show.set(show),
  setDetailedShow: (detailedShow: DetailedShowInfo | null) =>
    previewModal$.detailedShow.set(detailedShow),
  setIsLoading: (isLoading: boolean) => previewModal$.isLoading.set(isLoading),
  setPlay: (play: boolean) => previewModal$.play.set(play),
  reset: () => previewModal$.set({ ...initialState }),
  openPreviewModal: ({ show, play }: { show: Show | null; play: boolean }) => {
    previewModal$.assign({
      show,
      isOpen: true,
      firstLoad: true,
      play,
    });
  },
};

/**
 * Tracks the most recent in-flight fetch so a stale response from a
 * previous (different) show can't overwrite the current one. This avoids
 * race conditions when the user clicks through shows faster than the
 * server action resolves.
 */
let previewFetchSeq = 0;

/**
 * Fetches the detailed show info for the preview modal and stores it in the
 * previewModal observable (replaces the former Redux thunk).
 */
export async function fetchDetailedShow({
  id,
  mediaType,
}: {
  id: number;
  mediaType: MediaType;
}): Promise<DetailedShowInfo> {
  const seq = ++previewFetchSeq;
  previewModal$.assign({ isLoading: true, detailedShow: null });
  try {
    const data = await getShowDetails({ id, mediaType, includeExtras: true });

    // Drop the response if a newer fetch has been started in the meantime.
    // The sequence counter `seq` is the single source of truth — if a newer
    // fetch has started (seq !== previewFetchSeq), this response is stale.
    if (seq !== previewFetchSeq) {
      return data;
    }

    // Sync the effective media type resolved server-side (tv <-> movie 404 flip)
    const currentShow = previewModal$.show.get();
    if (
      currentShow &&
      currentShow.id === id &&
      data.media_type &&
      data.media_type !== currentShow.media_type
    ) {
      previewModal$.show.set({ ...currentShow, media_type: data.media_type });
    }

    previewModal$.detailedShow.set(data);
    return data;
  } catch (error) {
    // Only surface errors from the latest request.
    if (seq === previewFetchSeq) {
      console.error('Failed to fetch detailed show info:', error);
    }
    throw error;
  } finally {
    // Clear the loading flag only for the latest request.
    if (seq === previewFetchSeq) {
      previewModal$.isLoading.set(false);
    }
  }
}
