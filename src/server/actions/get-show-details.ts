'use server';

import { cacheLife } from 'next/cache';
import type { MediaType } from '@/services/tmdb/types';
import {
  fetchDetailedShowData,
  type DetailedShowInfo,
} from '@/redux/features/modals/detail-fetch-helper';

export interface GetShowDetailsInput {
  id: number;
  mediaType: MediaType;
  includeExtras?: boolean;
}

/**
 * Cached server action that collapses ~30 TMDb calls per modal open into
 * one server round-trip. The cache key is derived from (id, mediaType,
 * includeExtras) by `'use cache'`.
 */
export async function getShowDetails({
  id,
  mediaType,
  includeExtras = true,
}: GetShowDetailsInput): Promise<DetailedShowInfo> {
  'use cache';
  cacheLife('show');

  return fetchDetailedShowData({
    id,
    mediaType,
    onFlipMediaType: () => {
      // The effective media type is returned on `data.media_type` and
      // synced to the store by the caller after the round-trip.
    },
    includeExtras,
  });
}
