'use client';

import React from 'react';
import { type Show, MediaType } from '@/services/tmdb/types';
import { trpc } from '@/client/trpc';
import { useMounted } from '@/hooks/use-mounted';

/**
 * Client-side lazy logo fetcher for surfaces where logos aren't supplied by
 * the server batch — infinite-scroll cards (page 2+ per carousel), the
 * /search grid, and /watch recommendations.
 *
 * Merges the server-supplied batch (covers the initial page render) with
 * logos fetched lazily via the `getLogos` tRPC procedure (covers cards
 * that arrived after the server render). `React.memo` on `ShowCard` stays
 * intact because the hook lives in the parent (carousel/grid).
 */
export function useShowLogos(
  shows: Show[],
  serverLogoPaths?: Record<number, string | null>,
): Record<number, string | null> {
  const mounted = useMounted();
  const [fetched, setFetched] = React.useState<Record<number, string | null>>(
    {},
  );
  // Idempotency guard: ids we've already issued a getLogos request for are
  // never sent again even if React re-renders the component with the same
  // `shows` list.
  const requestedRef = React.useRef<Set<number>>(new Set());

  // Compute the ids that need a logo: no server path AND not already fetched
  // AND not already in-flight AND not MediaType.ALL (unresolvable endpoint).
  const missing = React.useMemo(() => {
    const map = new Map<number, Show>();
    for (const show of shows) {
      if (show.media_type === MediaType.ALL) continue;
      if (serverLogoPaths?.[show.id] !== undefined) continue;
      if (fetched[show.id] !== undefined) continue;
      if (requestedRef.current.has(show.id)) continue;
      if (!map.has(show.id)) map.set(show.id, show);
    }
    return Array.from(map.values()).slice(0, 50);
  }, [shows, serverLogoPaths, fetched]);

  // Mark missing ids as requested so the query won't re-fire next render.
  React.useEffect(() => {
    for (const show of missing) {
      requestedRef.current.add(show.id);
    }
  }, [missing]);

  const { data } = trpc.movie.getLogos.useQuery(
    {
      shows: missing.map((s) => ({ id: s.id, mediaType: s.media_type })),
    },
    {
      enabled: mounted && missing.length > 0,
      staleTime: 300000, // 5 min — match QueryClient defaults explicitly
    },
  );

  // Merge the freshly fetched logos into local state.
  React.useEffect(() => {
    if (data) {
      setFetched((prev) => ({ ...prev, ...data }));
    }
  }, [data]);

  return { ...serverLogoPaths, ...fetched };
}
