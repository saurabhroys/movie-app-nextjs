import { z } from 'zod';
import { publicProcedure, router } from '@/server/trpc';
import MovieService from '@/services/MovieService';
import { RequestType } from '@/enums/request-type';
import { MediaType } from '@/types';
import { Genre } from '@/enums/genre';

export const movieRouter = router({
    getInfiniteShows: publicProcedure
        .input(
            z.object({
                requestType: z.nativeEnum(RequestType),
                mediaType: z.nativeEnum(MediaType),
                genre: z.nativeEnum(Genre).optional(),
                isLatest: z.boolean().optional(),
                networkId: z.number().optional(),
                page: z.number().optional(),
                cursor: z.number().nullish(), // page number for infinite scroll
            }),
        )
        .query(async ({ input }) => {
            // console.log('movie.getInfiniteShows input:', JSON.stringify(input, null, 2));
            const page = input.cursor ?? 1;
            const response = await MovieService.executeRequest({
                ...input,
                page,
            });

            const data = response.data;

            return {
                items: data.results,
                nextCursor: data.page < data.totalPages ? data.page + 1 : undefined,
            };
        }),
});
