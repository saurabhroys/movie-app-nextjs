import { cache } from 'react';
import http from '@/services/tmdb/http';
import type { TmdbPagingResponse } from '@/services/tmdb/types';

/**
 * Cached: Fetches trending shows across all media types.
 * Deduplicates requests within the same render cycle.
 */
export const getTrendingAll = cache(async (page: number) => {
  const { data } = await http.get<TmdbPagingResponse>(
    `/trending/all/week?language=en-US&page=${page}`,
  );
  return data;
});
