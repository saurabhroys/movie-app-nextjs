import { movieRouter } from '@/server/routers/movie';
import { router } from '@/server/trpc';

export const appRouter = router({
  movie: movieRouter,
});

export type AppRouter = typeof appRouter;
