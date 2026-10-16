import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

const isProd = process.env.NODE_ENV === 'production';

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    if (!isProd) return shape;

    // In production, strip internal error details (message/stack) of
    // unexpected failures so they are not leaked to the client. Expected
    // errors (e.g. NOT_FOUND) keep their meaningful message.
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      return {
        ...shape,
        message: 'Internal server error',
        data: { ...shape.data, stack: undefined },
      };
    }
    return shape;
  },
});

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
