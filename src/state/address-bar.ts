import { observable, observe, type Observable } from '@legendapp/state';
import { getNameFromShow, getSlug } from '@/lib/slug';
import type { PreviewModalState } from '@/state/preview-modal';

export interface AddressBarState {
  previousUrl: string | null;
  activeSlugUrl: string | null;
}

export const addressBar$ = observable<AddressBarState>({
  previousUrl: null,
  activeSlugUrl: null,
});

/**
 * Route prefix check for player pages. The address bar sync must NEVER
 * touch window.history while the user is on (or navigating to) one of
 * these routes, otherwise it overwrites the active /watch/... URL with
 * the referer URL (e.g. "/") and the next router.replace/push re-routes
 * the player back to the home page.
 */
const PLAYER_ROUTE_PREFIXES = ['/watch', '/download'] as const;

const isPlayerRoute = (pathname: string): boolean =>
  PLAYER_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export function initAddressBarSync(previewModal$: Observable<PreviewModalState>) {
  if (typeof window === 'undefined') return;

  let pushTimer: ReturnType<typeof setTimeout> | null = null;

  observe(() => {
    const isOpen = previewModal$.isOpen.get();
    const show = previewModal$.show.get();

    if (isOpen && show) {
      const currentPath = window.location.pathname;

      // Never seed the address bar state from a player route.
      if (isPlayerRoute(currentPath)) {
        addressBar$.set({
          previousUrl: null,
          activeSlugUrl: null,
        });
        return;
      }

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
        // Only push while the modal is actually open AND we are still on
        // a regular browse route (not on /watch or /download after the
        // user clicked Play).
        const pathNow = window.location.pathname;
        if (
          previewModal$.isOpen.peek() &&
          !isPlayerRoute(pathNow) &&
          pathNow !== slugUrl
        ) {
          window.history.pushState({ modalOpened: true }, '', slugUrl);
        }
        pushTimer = null;
      }, 2000);
    } else if (!isOpen) {
      if (pushTimer) {
        clearTimeout(pushTimer);
        pushTimer = null;
      }

      const currentPath = window.location.pathname;

      // On player routes we must leave the URL alone: the user is on
      // /watch or /download, so restoring the previous browse URL here
      // would clobber the player's address. Do not resolve previousUrl
      // against pathname when that route check fails.
      if (!isPlayerRoute(currentPath)) {
        const prevUrl = addressBar$.previousUrl.peek();

        // Synchronously restore address bar URL so pathname clears digits instantly on close
        if (prevUrl && !isPlayerRoute(prevUrl)) {
          window.history.replaceState(null, '', prevUrl);
        } else if (/\d/.test(currentPath)) {
          const segments = currentPath.split('/').filter(Boolean);
          const basePath = segments.length > 1 ? `/${segments[0]}` : '/';
          window.history.replaceState(null, '', basePath);
        }
      }

      // Always clear the state so no stale previousUrl/activeSlugUrl can
      // be replayed by a later observer run or timer into the address bar.
      addressBar$.set({
        previousUrl: null,
        activeSlugUrl: null,
      });
    }
  });

  window.addEventListener('popstate', () => {
    const currentPath = window.location.pathname;

    // Never close modals or mutate state on player routes.
    if (isPlayerRoute(currentPath)) {
      return;
    }

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
