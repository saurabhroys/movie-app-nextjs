import { z } from 'zod';
import { publicProcedure, router } from '@/server/trpc';
import { executeRequest } from '@/services/tmdb/shows';
import {
  GENRES,
  MediaType,
  RequestType,
} from '@/services/tmdb/types';

export const movieRouter = router({
    getInfiniteShows: publicProcedure
        .input(
            z.object({
                requestType: z.nativeEnum(RequestType),
                mediaType: z.nativeEnum(MediaType),
                genre: z.nativeEnum(GENRES).optional(),
                isLatest: z.boolean().optional(),
                networkId: z.number().optional(),
                page: z.number().optional(),
                cursor: z.number().nullish(), // page number for infinite scroll
            }),
        )
        .query(async ({ input }) => {
            'use cache';
            const page = input.cursor ?? 1;
            const response = await executeRequest({
                ...input,
                page,
            });

            const data = response.data;

            return {
                items: data.results,
                nextCursor: data.page < data.total_pages ? data.page + 1 : undefined,
            };
        }),
});
