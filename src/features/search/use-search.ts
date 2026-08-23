'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { use$ } from '@legendapp/state/react';
import { search$, searchActions } from '@/state/search';
import { useSearchQuery, searchShows } from '@/state/search-api';
import { clearSearch as clearSearchDom } from '@/lib/dom';

interface UseSearchOptions {
  debounceTimeout?: number;
  minQueryLength?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceTimeout = 500, minQueryLength = 2 } = options;

  const query = use$(search$.query);
  const isOpen = use$(search$.isOpen);
  const [activeQuery, setActiveQuery] = useState('');
  const { data: shows = [], isFetching: loading } = useSearchQuery(activeQuery, {
    skip: activeQuery.trim().length < minQueryLength,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchImmediate = useCallback(
    (value: string) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      searchActions.setQuery(value);
      const trimmed = value.trim();
      if (trimmed.length < minQueryLength) {
        setActiveQuery('');
        return;
      }
      setActiveQuery(trimmed);
      void searchShows(trimmed);
    },
    [minQueryLength],
  );

  const search = useCallback(
    (value: string) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout for debounced search
      timeoutRef.current = setTimeout(() => {
        searchImmediate(value);
      }, debounceTimeout);
    },
    [searchImmediate, debounceTimeout],
  );

  const clearSearch = useCallback(() => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Reset store
    setActiveQuery('');
    searchActions.reset();
    clearSearchDom();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    search,
    searchImmediate,
    clearSearch,
    query,
    shows,
    loading,
    isOpen,
    setIsOpen: (value: boolean) => searchActions.setIsOpen(value),
  };
}
