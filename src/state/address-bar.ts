import { observable, observe, type Observable } from '@legendapp/state';
import { getNameFromShow, getSlug } from '@/lib/slug';
import type { PreviewModalState } from '@/state/preview-modal';

export interface AddressBarState {
  previousUrl: string | null;
  activeSlugUrl: string | null;
  isPushed: boolean;
}

export const addressBar$ = observable<AddressBarState>({
  previousUrl: null,
  activeSlugUrl: null,
  isPushed: false,
});

export function initAddressBarSync(previewModal$: Observable<PreviewModalState>) {
  if (typeof window === 'undefined') return;

  let pushTimer: ReturnType<typeof setTimeout> | null = null;

  observe(() => {
    const isOpen = previewModal$.isOpen.get();
    const show = previewModal$.show.get();

    if (isOpen && show) {
      const currentPath = window.location.pathname;
      const fullUrl = currentPath + window.location.search + window.location.hash;
      const name = getNameFromShow(show);
      const path: string = (show.media_type as string) === 'tv' ? 'tv-shows' : 'movies';
      const slugUrl = `/${path}/${getSlug(show.id, name)}`;

      // Save previous URL if not currently on a slug URL
      if (!/\d/.test(currentPath) && !addressBar$.previousUrl.peek()) {
        addressBar$.previousUrl.set(fullUrl);
      }

      addressBar$.activeSlugUrl.set(slugUrl);

      if (pushTimer) {
        clearTimeout(pushTimer);
        pushTimer = null;
      }

      // Wait 2 seconds before pushing slug to address bar
      pushTimer = setTimeout(() => {
        if (previewModal$.isOpen.peek() && window.location.pathname !== slugUrl) {
          window.history.pushState({ modalOpened: true }, '', slugUrl);
          addressBar$.isPushed.set(true);
        }
        pushTimer = null;
      }, 2000);
    } else if (!isOpen) {
      if (pushTimer) {
        clearTimeout(pushTimer);
        pushTimer = null;
      }

      const prevUrl = addressBar$.previousUrl.peek();

      // Synchronously restore address bar URL so pathname clears digits instantly on close
      if (prevUrl) {
        window.history.replaceState(null, '', prevUrl);
      } else {
        const currentPath = window.location.pathname;
        if (/\d/.test(currentPath)) {
          const segments = currentPath.split('/').filter(Boolean);
          const basePath = segments.length > 1 ? `/${segments[0]}` : '/';
          window.history.replaceState(null, '', basePath);
        }
      }

      addressBar$.set({
        previousUrl: null,
        activeSlugUrl: null,
        isPushed: false,
      });
    }
  });

  window.addEventListener('popstate', () => {
    const currentPath = window.location.pathname;
    if (!/\d/.test(currentPath) && previewModal$.isOpen.peek()) {
      previewModal$.set({
        isOpen: false,
        firstLoad: false,
        show: null,
        detailedShow: null,
        isLoading: false,
        play: false,
      });
    }
  });
}
