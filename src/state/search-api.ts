import { observable } from '@legendapp/state';
import { useEffect } from 'react';
import { useSelector } from '@legendapp/state/react';
import type { Show } from '@/services/tmdb/types';

interface SearchResponse {
  results: Show[];
  error?: string;
}

const searchCache$ = observable<Record<string, Show[]>>({});
const searchFetching$ = observable<Record<string, boolean>>({});
const inFlight = new Map<string, Promise<Show[]>>();

async function doSearch(trimmed: string): Promise<Show[]> {
  searchFetching$[trimmed].set(true);
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: trimmed }),
    });
    const data: SearchResponse = await response.json();
    if (!response.ok) {
      console.error('Search failed:', data.error ?? 'Search failed');
      return [];
    }
    const results = data.results ?? [];
    searchCache$[trimmed].set(results);
    return results;
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  } finally {
    searchFetching$[trimmed].set(false);
  }
}

/**
 * Fetches search results for a query through the server-side proxy at
 * `/api/search`. Results are cached per query and in-flight requests are
 * deduplicated. Never rejects — failures resolve to an empty list.
 */
export function searchShows(query: string): Promise<Show[]> {
  const trimmed = query.trim();
  if (!trimmed) return Promise.resolve([]);
  const cached = searchCache$[trimmed].get();
  if (cached) return Promise.resolve(cached);
  const pending = inFlight.get(trimmed);
  if (pending) return pending;
  const promise = doSearch(trimmed);
  inFlight.set(trimmed, promise);
  void promise.finally(() => {
    inFlight.delete(trimmed);
  });
  return promise;
}

/** Seeds the cache with server-rendered search results (replaces RTK Query upsertQueryData). */
export function upsertSearchQuery(query: string, shows: Show[]): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  searchCache$[trimmed].set(shows);
}

interface UseSearchQueryOptions {
  skip?: boolean;
}

/**
 * React hook that subscribes to the cached results and fetching state for a
 * query, triggering a fetch when the query becomes active (drop-in for the
 * former RTK Query `useSearchQuery`).
 */
export function useSearchQuery(
  query: string,
  options: UseSearchQueryOptions = {},
): { data: Show[] | undefined; isFetching: boolean } {
  const { skip = false } = options;
  const trimmed = query.trim();
  const enabled = !skip && trimmed.length > 0;

  const data = useSelector(() =>
    enabled ? searchCache$[trimmed].get() : undefined
  );
  const isFetching = useSelector(() =>
    enabled ? searchFetching$[trimmed].get() : false
  );

  useEffect(() => {
    if (!enabled) return;
    if (!searchCache$[trimmed].get()) {
      void searchShows(trimmed);
    }
  }, [trimmed, enabled]);

  return { data, isFetching };
}
