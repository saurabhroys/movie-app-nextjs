import { helloRouter } from '@/server/routers/hello';
import { movieRouter } from '@/server/routers/movie';
import { router } from '@/server/trpc';

export const appRouter = router({
  hello: helloRouter,
  movie: movieRouter,
});

export type AppRouter = typeof appRouter;
