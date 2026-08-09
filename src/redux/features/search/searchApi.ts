import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Show } from '@/services/tmdb/types';

interface SearchError {
  message: string;
}

interface SearchResponse {
  results: Show[];
  error?: string;
}

/**
 * RTK Query wrapper for the server-side search proxy at `/api/search`.
 * The browser never talks to TMDb directly — the bearer token stays server-only.
 */
export const searchApi = createApi({
  reducerPath: 'searchApi',
  baseQuery: fakeBaseQuery<SearchError>(),
  endpoints: (builder) => ({
    search: builder.query<Show[], string>({
      async queryFn(query: string) {
        try {
          const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          });
          const data: SearchResponse = await response.json();
          if (!response.ok) {
            return { error: { message: data.error ?? 'Search failed' } };
          }
          return { data: data.results };
        } catch (error) {
          return {
            error: {
              message: error instanceof Error ? error.message : String(error),
            },
          };
        }
      },
    }),
  }),
});

export const { useSearchQuery } = searchApi;
