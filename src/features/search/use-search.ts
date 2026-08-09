'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { searchApi, useSearchQuery } from '@/redux/features/search/searchApi';
import {
  setQuery as searchSetQuery,
  setIsOpen as searchSetIsOpen,
  reset as searchReset,
} from '@/redux/features/search/searchSlice';
import { clearSearch as clearSearchDom } from '@/lib/dom';

interface UseSearchOptions {
  debounceTimeout?: number;
  minQueryLength?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceTimeout = 500, minQueryLength = 2 } = options;

  const dispatch = useAppDispatch();
  const query = useAppSelector((state) => state.search.query);
  const isOpen = useAppSelector((state) => state.search.isOpen);
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

      dispatch(searchSetQuery(value));
      const trimmed = value.trim();
      if (trimmed.length < minQueryLength) {
        setActiveQuery('');
        return;
      }
      setActiveQuery(trimmed);
      void dispatch(searchApi.endpoints.search.initiate(trimmed));
    },
    [minQueryLength, dispatch],
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
    dispatch(searchReset());
    clearSearchDom();
  }, [dispatch]);

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
    setIsOpen: (value: boolean) => dispatch(searchSetIsOpen(value)),
  };
}
