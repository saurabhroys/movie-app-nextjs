import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import SearchService from '@/services/tmdb/search.service';
import type { Show } from '@/services/tmdb/types';

interface SearchError {
  message: string;
}

export const searchApi = createApi({
  reducerPath: 'searchApi',
  baseQuery: fakeBaseQuery<SearchError>(),
  endpoints: (builder) => ({
    search: builder.query<Show[], string>({
      async queryFn(query: string) {
        try {
          const { results } = await SearchService.searchMovies(query);
          return { data: results };
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
