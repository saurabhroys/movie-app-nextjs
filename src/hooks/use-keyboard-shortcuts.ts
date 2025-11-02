'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useModalStore } from '@/stores/modal';
import { useSearchStore } from '@/stores/search';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const modalStore = useModalStore();
  const searchStore = useSearchStore();

  // Navigation shortcuts
  const navigateToHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const navigateToMovies = useCallback(() => {
    router.push('/movies');
  }, [router]);

  const navigateToTVShows = useCallback(() => {
    router.push('/tv-shows');
  }, [router]);

  const navigateToAnime = useCallback(() => {
    router.push('/anime');
  }, [router]);

  const navigateToNewAndPopular = useCallback(() => {
    router.push('/new-and-popular');
  }, [router]);

  const navigateToSearch = useCallback(() => {
    router.push('/search');
  }, [router]);

  // Search shortcuts
  const openSearch = useCallback(() => {
    searchStore.setOpen(true);
    // Focus search input after a short delay to ensure it's rendered
    setTimeout(() => {
      const searchInput = document.getElementById(
        'search-input',
      ) as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
  }, [searchStore]);

  const closeSearch = useCallback(() => {
    searchStore.setOpen(false);
    searchStore.reset();
  }, [searchStore]);

  // Modal shortcuts
  const closeModal = useCallback(() => {
    modalStore.setOpen(false);
    modalStore.reset();
  }, [modalStore]);

  const togglePlayPause = useCallback(() => {
    // This would need to be implemented based on your video player
    // For now, we'll just toggle the play state
    modalStore.setPlay(!modalStore.play);
  }, [modalStore]);

  // Carousel shortcuts
  const scrollCarouselLeft = useCallback(() => {
    const carousels = document.querySelectorAll('[data-carousel]');
    carousels.forEach((carousel) => {
      const leftButton = carousel.querySelector(
        '[aria-label="Scroll to left"]',
      ) as HTMLButtonElement;
      if (leftButton && !leftButton.disabled) {
        leftButton.click();
      }
    });
  }, []);

  const scrollCarouselRight = useCallback(() => {
    const carousels = document.querySelectorAll('[data-carousel]');
    carousels.forEach((carousel) => {
      const rightButton = carousel.querySelector(
        '[aria-label="Scroll to right"]',
      ) as HTMLButtonElement;
      if (rightButton && !rightButton.disabled) {
        rightButton.click();
      }
    });
  }, []);

  // Help shortcut
  const showHelp = useCallback(() => {
    // Create a help modal or tooltip
    const helpModal = document.createElement('div');
    helpModal.className =
      'fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-md';
    helpModal.innerHTML = `
      <div class="bg-white dark:bg-neutral-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Keyboard Shortcuts</h2>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-neutral-500 hover:text-neutral-700 cursor-pointer font-medium text-2xl">×</button>
        </div>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h3 class="font-semibold mb-2">Navigation</h3>
              <div class="space-y-1 text-sm">
                <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">1</kbd> Home</div>
                <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">2</kbd> Movies</div>
                <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">3</kbd> TV Shows</div>
                <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">4</kbd> Anime</div>
                <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">5</kbd> New & Popular</div>
                <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">H</kbd> Home</div>
                <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">S</kbd> Open Search</div>
              </div>
            </div>
            <div>
              <h3 class="font-semibold mb-2">Search & Media</h3>
              <div class="space-y-1 text-sm">
                <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">Ctrl+K</kbd> / <kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">⌘K</kbd> Open Search</div>
                <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">Esc</kbd> Close Search/Modal</div>
                <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">Space</kbd> Play/Pause</div>
              </div>
            </div>
            // <div>
            //   <h3 class="font-semibold mb-2">Theme</h3>
            //   <div class="space-y-1 text-sm">
            //     <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">T</kbd> Toggle Theme</div>
            //     <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">L</kbd> Light Theme</div>
            //     <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">D</kbd> Dark Theme</div>
            //   </div>
            // </div>
            <div>
              <h3 class="font-semibold mb-2">Carousel</h3>
              <div class="space-y-1 text-sm">
                <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">←</kbd> Scroll Left</div>
                <div class="my-2"><kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">→</kbd> Scroll Right</div>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t space-y-1">
            <div class="text-sm text-neutral-600 dark:text-neutral-400">
              <div class="my-2">
                <kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">?</kbd> Show this help<br>
              </div>
              <div class="my-2">
                <kbd class="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded">Shift+H</kbd> Show this help
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(helpModal);

    // Close on escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        helpModal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Close on click outside
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        helpModal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    });
  }, []);

  // Define all shortcuts
  const shortcuts: ShortcutConfig[] = [
    // Navigation shortcuts
    {
      key: '1',
      description: 'Go to Home',
      action: navigateToHome,
      preventDefault: true,
    },
    {
      key: '2',
      description: 'Go to Movies',
      action: navigateToMovies,
      preventDefault: true,
    },
    {
      key: '3',
      description: 'Go to TV Shows',
      action: navigateToTVShows,
      preventDefault: true,
    },
    {
      key: '4',
      description: 'Go to Anime',
      action: navigateToAnime,
      preventDefault: true,
    },
    {
      key: '5',
      description: 'Go to New & Popular',
      action: navigateToNewAndPopular,
      preventDefault: true,
    },
    {
      key: 'h',
      description: 'Go to Home',
      action: navigateToHome,
      preventDefault: true,
    },
    {
      key: 's',
      description: 'Go to Search',
      action: openSearch,
      preventDefault: true,
    },

    // Search shortcuts
    {
      key: 'k',
      ctrlKey: true,
      description: 'Open Search',
      action: openSearch,
      preventDefault: true,
    },
    {
      key: 'k',
      metaKey: true,
      description: 'Open Search',
      action: openSearch,
      preventDefault: true,
    },
    {
      key: 'Escape',
      description: 'Close Search/Modal',
      action: closeSearch,
      preventDefault: true,
    },

    // Theme shortcuts
    // {
    //   key: 't',
    //   description: 'Toggle Theme',
    //   action: toggleTheme,
    //   preventDefault: true,
    // },
    // {
    //   key: 'l',
    //   description: 'Light Theme',
    //   action: setLightTheme,
    //   preventDefault: true,
    // },
    // {
    //   key: 'd',
    //   description: 'Dark Theme',
    //   action: setDarkTheme,
    //   preventDefault: true,
    // },

    // Modal shortcuts
    {
      key: 'Escape',
      description: 'Close Modal',
      action: closeModal,
      preventDefault: true,
    },
    {
      key: ' ',
      description: 'Play/Pause',
      action: togglePlayPause,
      preventDefault: true,
    },

    // Carousel shortcuts
    {
      key: 'ArrowLeft',
      description: 'Scroll Carousel Left',
      action: scrollCarouselLeft,
      preventDefault: true,
    },
    {
      key: 'ArrowRight',
      description: 'Scroll Carousel Right',
      action: scrollCarouselRight,
      preventDefault: true,
    },

    // Help shortcut
    {
      key: '?',
      description: 'Show Help',
      action: showHelp,
      preventDefault: true,
    },
    {
      key: 'h',
      shiftKey: true,
      description: 'Show Help',
      action: showHelp,
      preventDefault: true,
    }, // Shift+H for help
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('[contenteditable="true"]')
      ) {
        // Allow some shortcuts even in input fields
        if (event.key === 'Escape') {
          const shortcut = shortcuts.find((s) => s.key === 'Escape');
          if (shortcut) {
            if (shortcut.preventDefault) {
              event.preventDefault();
            }
            shortcut.action();
          }
        }
        return;
      }

      // Find matching shortcut
      const shortcut = shortcuts.find((s) => {
        return (
          s.key.toLowerCase() === event.key.toLowerCase() &&
          !!s.ctrlKey === event.ctrlKey &&
          !!s.metaKey === event.metaKey &&
          !!s.shiftKey === event.shiftKey &&
          !!s.altKey === event.altKey
        );
      });

      if (shortcut) {
        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);

  return {
    shortcuts,
    showHelp,
  };
}
