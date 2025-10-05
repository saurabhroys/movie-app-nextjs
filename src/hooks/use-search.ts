import { useCallback, useEffect, useRef } from 'react';
import { useSearchStore } from '@/stores/search';
import SearchService from '@/services/SearchService';
import type { Show } from '@/types';

interface UseSearchOptions {
  debounceTimeout?: number;
  minQueryLength?: number;
  onError?: (error: Error) => void;
}

export function useSearch(options: UseSearchOptions = {}) {
  const {
    debounceTimeout = 500,
    minQueryLength = 2,
    onError,
  } = options;

  const searchStore = useSearchStore();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const search = useCallback(
    async (query: string) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Cancel existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear results if query is too short
      if (query.trim().length < minQueryLength) {
        searchStore.setShows([]);
        searchStore.setLoading(false);
        searchStore.setQuery(query);
        return;
      }

      // Set loading state
      searchStore.setLoading(true);
      searchStore.setQuery(query);

      try {
        const { results, requestId } = await SearchService.searchMovies(query);
        
        // Only update if this is still the current request
        if (requestId === searchStore.currentRequestId || !searchStore.currentRequestId) {
          searchStore.setShows(results);
          searchStore.setCurrentRequestId(requestId);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Search error:', error);
          searchStore.setShows([]);
          onError?.(error as Error);
        }
      } finally {
        searchStore.setLoading(false);
      }
    },
    [searchStore, minQueryLength, onError]
  );

  const debouncedSearch = useCallback(
    (query: string) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout for debounced search
      timeoutRef.current = setTimeout(() => {
        void search(query);
      }, debounceTimeout);
    },
    [search, debounceTimeout]
  );

  const clearSearch = useCallback(() => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cancel request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset store
    searchStore.reset();
  }, [searchStore]);

  const cancelCurrentRequest = useCallback(() => {
    if (searchStore.currentRequestId) {
      SearchService.cancelRequest(searchStore.currentRequestId);
      searchStore.setCurrentRequestId(null);
    }
  }, [searchStore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      cancelCurrentRequest();
    };
  }, [cancelCurrentRequest]);

  return {
    search: debouncedSearch,
    searchImmediate: search,
    clearSearch,
    cancelCurrentRequest,
    query: searchStore.query,
    shows: searchStore.shows,
    loading: searchStore.loading,
    isOpen: searchStore.isOpen,
    setOpen: searchStore.setOpen,
  };
}
