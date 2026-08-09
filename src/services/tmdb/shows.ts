import { cache } from 'react';
import http, { isFulfilled, isRejected, withRetry } from './http';
import { buildTmdbUrl } from './url-builder';
import {
  MediaType,
  type RequestType,
  type TmdbPagingResponse,
  type TmdbRequest,
  type ShowRequest,
  type CategorizedShows,
  type GenreId,
  requestTypesNeedUpdateMediaType,
} from './types';

/**
 * Cached base request method for deduplication.
 * Uses stable cache keys based on all relevant request parameters.
 */
const executeRequestCached = cache(
  (
    requestType: RequestType,
    mediaType: MediaType,
    page?: number,
    genre?: GenreId,
    isLatest?: boolean,
    networkId?: number,
  ) => {
    const url = buildTmdbUrl({
      requestType,
      mediaType,
      page,
      genre,
      isLatest,
      networkId,
    });
    return http.get<TmdbPagingResponse>(url);
  },
);

export async function executeRequest(req: TmdbRequest) {
  // Use cached version for deduplication during render
  const res = await executeRequestCached(
    req.requestType,
    req.mediaType,
    req.page,
    req.genre,
    req.isLatest,
    req.networkId,
  );

  const reqMediaType = req.mediaType;
  if (res.data?.results) {
    res.data.results.forEach((f) => {
      if (
        requestTypesNeedUpdateMediaType.has(req.requestType) ||
        (!f.media_type && reqMediaType && reqMediaType !== MediaType.ALL)
      ) {
        f.media_type = reqMediaType;
      }
    });
  }
  return res;
}

export async function executeRequestWithRetry(
  req: TmdbRequest,
  maxAttempts: number = 3,
  initialBackoffMs: number = 300,
) {
  return withRetry(() => executeRequest(req), { maxAttempts, initialBackoffMs });
}

/**
 * Fetches multiple show categories in batches.
 * Uses controlled concurrency to prevent rate limiting.
 */
export async function getShows(requests: ShowRequest[]) {
  const shows: CategorizedShows[] = [];
  // Limit concurrency to reduce risk of socket resets and rate limiting
  const concurrency = 5;
  for (let start = 0; start < requests.length; start += concurrency) {
    const slice = requests.slice(start, start + concurrency);
    const promises = slice.map((m) => executeRequestWithRetry(m.req));
    const responses = await Promise.allSettled(promises);
    for (let i = 0; i < slice.length; i++) {
      const reqIndex = start + i;
      const res = responses[i];
      if (isRejected(res)) {
        console.error(
          `Failed to fetch shows "${requests[reqIndex].title}":`,
          res.reason,
        );
        console.error(
          `Request details:`,
          JSON.stringify(requests[reqIndex].req),
        );
        shows.push({
          title: requests[reqIndex].title,
          shows: [],
          visible: requests[reqIndex].visible,
          req: requests[reqIndex].req,
        });
      } else if (isFulfilled(res)) {
        const reqMediaType = requests[reqIndex].req.mediaType;
        res.value.data.results.forEach((f) => {
          if (
            requestTypesNeedUpdateMediaType.has(
              requests[reqIndex].req.requestType,
            ) ||
            (!f.media_type && reqMediaType && reqMediaType !== MediaType.ALL)
          ) {
            f.media_type = reqMediaType;
          }
        });
        shows.push({
          title: requests[reqIndex].title,
          shows: res.value.data.results,
          visible: requests[reqIndex].visible,
          req: requests[reqIndex].req,
        });
      }
    }
  }
  return shows;
}
