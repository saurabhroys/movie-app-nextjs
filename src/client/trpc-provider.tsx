'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { useState } from 'react';
import superjson from 'superjson';
import { trpc } from '@/client/trpc';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { env } from '@/env';

export const TrpcProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5000, refetchOnWindowFocus: false },
        },
      }),
  );

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') return ''; // browser should use relative url
    if (process.env.NODE_ENV === 'development') return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost

    // In production SSR without VERCEL_URL, strictly enforce the Cloudflare worker origin to prevent local fetches hanging the Edge runtime
    if (env.NEXT_PUBLIC_APP_URL && env.NEXT_PUBLIC_APP_URL !== 'http://localhost:3000' && env.NEXT_PUBLIC_APP_URL !== 'https://localhost:3000') return env.NEXT_PUBLIC_APP_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return `https://tunebox.saurabhroys.workers.dev`;
  };

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools />
      </QueryClientProvider>
    </trpc.Provider>
  );
};
