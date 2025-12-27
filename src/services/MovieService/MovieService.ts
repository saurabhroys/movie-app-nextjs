import { getNameFromShow, getSlug, hasValidImage } from '@/lib/utils';
import type {
  CategorizedShows,
  ISeason,
  KeyWordResponse,
  MediaType,
  Show,
  ShowWithGenreAndVideo,
} from '@/types';
import type { ImagesResponse } from '@/types';
import { type AxiosResponse } from 'axios';
import BaseService from '../BaseService/BaseService';
import {
  RequestType,
  type ShowRequest,
  type TmdbPagingResponse,
  type TmdbRequest,
} from '@/enums/request-type';
import { Genre } from '@/enums/genre';
import { cache } from 'react';

/**
 * Caching Strategy:
 * - React's `cache()` is used for request-level memoization (deduplication within a single render)
 * - All data-fetching methods are wrapped with `cache()` to prevent duplicate requests
 * - Cache keys are deterministic based on function parameters (primitives only for stability)
 * - This works in conjunction with Next.js ISR (revalidate) for persistent caching
 */

const requestTypesNeedUpdateMediaType = [
  RequestType.TOP_RATED,
  RequestType.NETFLIX,
  RequestType.POPULAR,
  RequestType.GENRE,
  RequestType.KOREAN,
  RequestType.INDIAN,
  RequestType.TAMIL,
  RequestType.TELUGU,
  RequestType.MALAYALAM,
  RequestType.KANNADA,
  RequestType.INDIAN_NETFLIX,
  RequestType.INDIAN_AMAZON_PRIME,
  RequestType.INDIAN_DISNEY_HOTSTAR,
  RequestType.HBO,
  RequestType.DISNEY_PLUS_TV,
  RequestType.AMAZON_PRIME_TV,
  RequestType.HBO_TV,
  RequestType.INDIAN_MOVIES,
  RequestType.INDIAN_TV_NETFLIX,
  RequestType.INDIAN_TV_AMAZON_PRIME,
  RequestType.INDIAN_TV_DISNEY_HOTSTAR,
];
const baseUrl = 'https://api.themoviedb.org/3';

class MovieService extends BaseService {
  static async findCurrentMovie(id: number, pathname: string): Promise<Show> {
    const data = await Promise.allSettled([
      this.findMovie(id),
      this.findTvSeries(id),
    ]);
    const response = data
      .filter(this.isFulfilled)
      .map(
        (item: PromiseFulfilledResult<AxiosResponse<Show>>) => item.value?.data,
      )
      .filter((item: Show) => {
        return pathname.includes(getSlug(item.id, getNameFromShow(item)));
      });
    if (!response?.length) {
      return Promise.reject('not found');
    }
    return Promise.resolve<Show>(response[0]);
  }

  /**
   * Cached: Fetches movie details by ID.
   * Deduplicates requests within the same render cycle.
   */
  static findMovie = cache(async (id: number) => {
    return this.axios(baseUrl).get<Show>(
      `/movie/${id}?append_to_response=keywords`,
    );
  });

  /**
   * Cached: Fetches TV series details by ID.
   * Deduplicates requests within the same render cycle.
   */
  static findTvSeries = cache(async (id: number) => {
    return this.axios(baseUrl).get<Show>(
      `/tv/${id}?append_to_response=keywords`,
    );
  });

  /**
   * Cached: Fetches keywords for a movie or TV show.
   * Deduplicates requests within the same render cycle.
   */
  static getKeywords = cache(
    async (id: number, type: 'tv' | 'movie'): Promise<AxiosResponse<KeyWordResponse>> => {
      return this.axios(baseUrl).get<KeyWordResponse>(`/${type}/${id}/keywords`);
    },
  );

  /**
   * Cached: Fetches season details for a TV show.
   * Deduplicates requests within the same render cycle.
   */
  static getSeasons = cache(
    async (id: number, season: number): Promise<AxiosResponse<ISeason>> => {
      return this.axios(baseUrl).get<ISeason>(`/tv/${id}/season/${season}`);
    },
  );

  /**
   * Cached: Fetches images for a movie, TV show, or anime.
   * Deduplicates requests within the same render cycle.
   */
  static getImages = cache(
    async (
      mediaType: 'movie' | 'tv' | 'anime',
      mediaId: number,
    ): Promise<AxiosResponse<ImagesResponse>> => {
      return this.axios(baseUrl).get<ImagesResponse>(
        `/${mediaType}/${mediaId}/images`,
      );
    },
  );

  /**
   * Cached: Fetches content rating for a movie or TV show.
   * Deduplicates requests within the same render cycle.
   */
  static getContentRating = cache(
    async (
      mediaType: 'movie' | 'tv',
      mediaId: number,
    ): Promise<AxiosResponse<ImagesResponse>> => {
      return this.axios(baseUrl).get<ImagesResponse>(
        `/${mediaType}/${mediaId}/content_ratings`,
      );
    },
  );

  /**
   * Cached: Fetches release dates for a movie.
   * Deduplicates requests within the same render cycle.
   */
  static getMovieReleaseDates = cache(
    async (movieId: number): Promise<AxiosResponse<any>> => {
      return this.axios(baseUrl).get<any>(`/movie/${movieId}/release_dates`);
    },
  );

  /**
   * Cached: Fetches credits for a movie or TV show.
   * Deduplicates requests within the same render cycle.
   */
  static getCredits = cache(
    async (mediaType: string, id: number): Promise<AxiosResponse<any>> => {
      return this.axios(baseUrl).get<any>(`/${mediaType}/${id}/credits`);
    },
  );

  /**
   * Cached: Fetches movie or TV show by ID and type with additional data.
   * Deduplicates requests within the same render cycle.
   * Includes retry logic for network errors and timeouts.
   */
  static findMovieByIdAndType = cache(
    async (
      id: number,
      type: string,
      language: string = 'en-US',
      maxAttempts: number = 3,
    ) => {
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      
      const isRetryable = (error: unknown): boolean => {
        // Network/transient errors we want to retry
        if (!error || typeof error !== 'object') return false;
        const anyErr = error as any;
        const code: string | undefined = anyErr?.code;
        const message: string | undefined = anyErr?.message?.toLowerCase();
        const status: number | undefined = anyErr?.response?.status;
        
        return (
          code === 'ECONNRESET' ||
          code === 'ECONNABORTED' ||
          code === 'ETIMEDOUT' ||
          code === 'ENOTFOUND' ||
          code === 'EAI_AGAIN' ||
          message?.includes('timeout') ||
          (typeof status === 'number' &&
            (status === 429 || (status >= 500 && status < 600)))
        );
      };

      let attempt = 0;
      let backoff = 300;
      
      while (true) {
        try {
          const params: Record<string, string> = {
            language: language,
            append_to_response: 'videos,keywords',
          };
          // Use a longer timeout for requests with append_to_response as they fetch more data
          const response: AxiosResponse<ShowWithGenreAndVideo> = await this.axios(
            baseUrl,
          ).get<ShowWithGenreAndVideo>(`/${type}/${id}`, { 
            params,
            timeout: 20000, // 20 seconds for requests with additional data
          });
          return Promise.resolve(response.data);
        } catch (error) {
          attempt += 1;
          if (attempt >= maxAttempts || !isRetryable(error)) {
            throw error;
          }
          // Exponential backoff with jitter
          await sleep(backoff + Math.random() * 200);
          backoff = Math.min(backoff * 2, 3000);
        }
      }
    },
  );

  static urlBuilder(req: TmdbRequest) {
    switch (req.requestType) {
      case RequestType.ANIME_LATEST:
        return `/discover/${req.mediaType}?with_keywords=210024%2C&language=en-US&sort_by=primary_release_date.desc&release_date.lte=2024-11-10&with_runtime.gte=1`;
      case RequestType.ANIME_TRENDING:
        return `/discover/${req.mediaType}?with_keywords=210024%2C&language=en-US&sort_by=popularity.desc&release_date.lte=2024-11-10&with_runtime.gte=1`;
      case RequestType.ANIME_TOP_RATED:
        return `/discover/${req.mediaType}?with_keywords=210024%2C&language=en-US&sort_by=vote_count.desc&air_date.lte=2024-11-10`;
      case RequestType.ANIME_NETFLIX:
        return `/discover/${req.mediaType}?with_keywords=210024%2C&with_networks=213&language=en-US`;

      case RequestType.TRENDING:
        return `/trending/${req.mediaType}/day?language=en-US&with_original_language=en&page=${req.page ?? 1}`;
      case RequestType.TOP_RATED:
        return `/${req.mediaType}/top_rated?page=${req.page ?? 1}&with_original_language=en&language=en-US`;
      case RequestType.NETFLIX:
        return `/discover/${req.mediaType}?with_networks=213&with_original_language=en&language=en-US&page=${req.page ?? 1}`;
      case RequestType.DISNEY_PLUS:
        return `/discover/${req.mediaType}?with_networks=2739&with_original_language=en&language=en-US&page=${req.page ?? 1}`;
      case RequestType.AMAZON_PRIME:
        return `/discover/${req.mediaType}?with_networks=1024&with_original_language=en&language=en-US&page=${req.page ?? 1}`;
      case RequestType.HBO:
        return `/discover/${req.mediaType}?with_networks=49&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;
      case RequestType.POPULAR:
        return `/${req.mediaType}/popular?language=en-US&with_original_language=en&page=${req.page ?? 1}&without_genres=${Genre.TALK},${Genre.NEWS}`;
      case RequestType.GENRE:
        return `/discover/${req.mediaType}?with_genres=${req.genre}&language=en-US&with_original_language=en&page=${req.page ?? 1}&without_genres=${Genre.TALK},${Genre.NEWS}`;
      case RequestType.ANIME_GENRE:
        return `/discover/${req.mediaType}?with_genres=${req.genre}&with_keywords=210024%2C&language=en-US&with_original_language=en&page=${req.page ?? 1}&without_genres=${Genre.TALK},${Genre.NEWS}`;
      case RequestType.KOREAN:
        return `/discover/${req.mediaType}?with_genres=${req.genre}&with_original_language=ko&language=en-US&page=${req.page ?? 1}`;
      case RequestType.INDIAN:
        return `/discover/${req.mediaType}?with_genres=${req.genre}&with_original_language=hi&language=en-US&page=${req.page ?? 1}`;
      case RequestType.TAMIL:
        return `/discover/${req.mediaType}?with_original_language=ta&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc&vote_count.gte=5&with_runtime.gte=60`;
      case RequestType.TELUGU:
        return `/discover/${req.mediaType}?with_original_language=te&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc&vote_count.gte=5&with_runtime.gte=60`;
      case RequestType.MALAYALAM:
        return `/discover/${req.mediaType}?with_original_language=ml&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc&vote_count.gte=5&with_runtime.gte=60`;
      case RequestType.KANNADA:
        return `/discover/${req.mediaType}?with_original_language=kn&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc&vote_count.gte=5&with_runtime.gte=60`;

      // OTT Platform cases for Indian content - try simpler approach first
      case RequestType.INDIAN_NETFLIX:
        return `/discover/${req.mediaType}?with_networks=213&with_original_language=hi&language=en-US&&page=${req.page ?? 1}&sort_by=popularity.desc`;
      case RequestType.INDIAN_AMAZON_PRIME:
        return `/discover/${req.mediaType}?with_networks=1024&with_original_language=hi&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;
      case RequestType.INDIAN_DISNEY_HOTSTAR:
        return `/discover/${req.mediaType}?with_networks=3919&with_original_language=hi&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;

      // New OTT Platform TV Shows
      case RequestType.DISNEY_PLUS_TV:
        return `/discover/${req.mediaType}?with_networks=2739&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;
      case RequestType.AMAZON_PRIME_TV:
        return `/discover/${req.mediaType}?with_networks=1024&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;
      case RequestType.HBO_TV:
        return `/discover/${req.mediaType}?with_networks=49&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;

      // Indian Movies
      case RequestType.INDIAN_MOVIES:
        return `/discover/${req.mediaType}?with_original_language=hi&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;

      // Indian TV Shows by platform
      case RequestType.INDIAN_TV_NETFLIX:
        return `/discover/${req.mediaType}?with_networks=213&with_original_language=hi&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;
      case RequestType.INDIAN_TV_AMAZON_PRIME:
        return `/discover/${req.mediaType}?with_networks=1024&with_original_language=hi&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;
      case RequestType.INDIAN_TV_DISNEY_HOTSTAR:
        return `/discover/${req.mediaType}?with_networks=3919&with_original_language=hi&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;

      default:
        throw new Error(
          `request type ${req.requestType} is not implemented yet`,
        );
    }
  }

  /**
   * Cached base request method for deduplication.
   * Uses stable cache keys based on serialized request parameters.
   */
  private static executeRequestCached = cache(
    (requestType: RequestType, mediaType: MediaType, page?: number, genre?: number) => {
      const url = this.urlBuilder({ requestType, mediaType, page, genre });
      return this.axios(baseUrl).get<TmdbPagingResponse>(url);
    },
  );

  static executeRequest(req: {
    requestType: RequestType;
    mediaType: MediaType;
    page?: number;
    genre?: number;
  }) {
    // Use cached version for deduplication during render
    return this.executeRequestCached(
      req.requestType,
      req.mediaType,
      req.page,
      req.genre,
    );
  }

  static async executeRequestWithRetry(
    req: {
      requestType: RequestType;
      mediaType: MediaType;
      page?: number;
      genre?: number;
    },
    maxAttempts: number = 3,
    initialBackoffMs: number = 300,
  ) {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    const isRetryable = (error: unknown): boolean => {
      // Network/transient errors we want to retry
      if (!error || typeof error !== 'object') return false;
      const anyErr = error as any;
      const code: string | undefined = anyErr?.code;
      const status: number | undefined = anyErr?.response?.status;
      return (
        code === 'ECONNRESET' ||
        code === 'ECONNABORTED' ||
        code === 'ETIMEDOUT' ||
        code === 'ENOTFOUND' ||
        code === 'EAI_AGAIN' ||
        (typeof status === 'number' &&
          (status === 429 || (status >= 500 && status < 600)))
      );
    };

    let attempt = 0;
    let backoff = initialBackoffMs;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await this.executeRequest(req);
      } catch (error) {
        attempt += 1;
        if (attempt >= maxAttempts || !isRetryable(error)) {
          throw error;
        }
        await sleep(backoff);
        backoff = Math.min(backoff * 2, 3000);
      }
    }
  }

  /**
   * Cached: Fetches multiple show categories in batches.
   * Deduplicates requests within the same render cycle.
   * Uses controlled concurrency to prevent rate limiting.
   */
  static getShows = cache(async (requests: ShowRequest[]) => {
    const shows: CategorizedShows[] = [];
    // Limit concurrency to reduce risk of socket resets and rate limiting
    const concurrency = 4;
    for (let start = 0; start < requests.length; start += concurrency) {
      const slice = requests.slice(start, start + concurrency);
      const promises = slice.map((m) => this.executeRequestWithRetry(m.req));
      const responses = await Promise.allSettled(promises);
      for (let i = 0; i < slice.length; i++) {
        const reqIndex = start + i;
        const res = responses[i];
        if (this.isRejected(res)) {
          console.error(
            `Failed to fetch shows ${requests[reqIndex].title}:`,
            res.reason,
          );
          console.error(`Request details:`, requests[reqIndex].req);
          shows.push({
            title: requests[reqIndex].title,
            shows: [],
            visible: requests[reqIndex].visible,
          });
        } else if (this.isFulfilled(res)) {
          if (
            requestTypesNeedUpdateMediaType.indexOf(
              requests[reqIndex].req.requestType,
            ) > -1
          ) {
            res.value.data.results.forEach(
              (f) => (f.media_type = requests[reqIndex].req.mediaType),
            );
          }
          shows.push({
            title: requests[reqIndex].title,
            shows: res.value.data.results,
            visible: requests[reqIndex].visible,
          });
        } else {
          throw new Error('unexpected response');
        }
      }
    }
    return shows;
  });

  /**
   * Cached: Searches for movies and TV shows.
   * Deduplicates requests within the same render cycle.
   * Now supports intelligent language/category filtering based on query analysis.
   */
  static searchMovies = cache(
    async (
      query: string,
      page?: number,
      options?: {
        languages?: string[];
        mediaType?: 'movie' | 'tv';
        year?: number;
        isLatest?: boolean;
      },
    ) => {
      // If specific languages are requested, use discover endpoint for better filtering
      if (options?.languages && options.languages.length > 0) {
        return this.searchByLanguage(query, {
          languages: options.languages,
          mediaType: options.mediaType,
          year: options.year,
          isLatest: options.isLatest,
        }, page);
      }

      // Build search URL
      let searchUrl = `/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=${
        page ?? 1
      }&include_adult=true`;

      // Add year filter if specified (TMDB search doesn't directly support this, but we'll filter results)
      const { data } = await this.axios(baseUrl).get<TmdbPagingResponse>(searchUrl);

      // Filter out results without proper media_type, without images
      // Exclude 'person' results - we only want movies and TV shows
      let filteredResults = data.results.filter(
        (item) =>
          item.media_type &&
          ((item.media_type as string) === 'movie' ||
            (item.media_type as string) === 'tv') &&
          hasValidImage(item),
      );

      // Filter by language if specified
      if (options?.languages && options.languages.length > 0) {
        filteredResults = filteredResults.filter((item) =>
          options.languages!.includes(item.original_language?.toLowerCase() || ''),
        );
      }

      // Filter by media type if specified
      if (options?.mediaType) {
        filteredResults = filteredResults.filter(
          (item) => item.media_type?.toLowerCase() === options.mediaType,
        );
      }

      // Filter by year if specified
      if (options?.year !== undefined) {
        const targetYear = options.year;
        filteredResults = filteredResults.filter((item) => {
          const releaseDate = item.release_date || item.first_air_date;
          if (!releaseDate) return false;
          const releaseYear = parseInt(releaseDate.substring(0, 4), 10);
          return releaseYear === targetYear || releaseYear === targetYear - 1;
        });
      }

      // Sort by popularity
      filteredResults.sort((a, b) => b.popularity - a.popularity);

      return { ...data, results: filteredResults };
    },
  );

  /**
   * Search using discover endpoint for language-specific queries
   * This provides better results for queries like "hindi movies", "south indian movies"
   */
  private static async searchByLanguage(
    query: string,
    options: {
      languages: string[];
      mediaType?: 'movie' | 'tv';
      year?: number;
      isLatest?: boolean;
    },
    page?: number,
  ): Promise<TmdbPagingResponse> {
    const mediaType = options.mediaType || 'movie';
    const languages = options.languages.join('|'); // TMDB supports multiple languages with |

    // Build discover URL
    let discoverUrl = `/discover/${mediaType}?with_original_language=${languages}&language=en-US&page=${
      page ?? 1
    }&include_adult=true&sort_by=popularity.desc`;

    // Add year filter if specified
    if (options.year) {
      discoverUrl += `&primary_release_year=${options.year}`;
      if (mediaType === 'tv') {
        discoverUrl += `&first_air_date_year=${options.year}`;
      }
    } else if (options.isLatest) {
      // For "latest" queries, prioritize recent content
      const currentYear = new Date().getFullYear();
      discoverUrl += `&primary_release_date.gte=${currentYear - 1}-01-01`;
      if (mediaType === 'tv') {
        discoverUrl += `&first_air_date.gte=${currentYear - 1}-01-01`;
      }
    }

    // Add minimum vote count to filter out low-quality content
    discoverUrl += '&vote_count.gte=10';

    const { data } = await this.axios(baseUrl).get<TmdbPagingResponse>(discoverUrl);

    // Filter out results without images
    const filteredResults = data.results.filter((item) => hasValidImage(item));

    // If query has additional keywords (not just language/region), filter by relevance
    const cleanQuery = query
      .toLowerCase()
      .replace(/hindi|bollywood|south indian|south|tamil|telugu|malayalam|kannada|movie|movies|film|films|latest|new|recent|show|series|tv|television/gi, '')
      .trim();

    // Only filter by additional keywords if there are meaningful search terms left
    if (cleanQuery.length > 2) {
      const queryWords = cleanQuery.split(/\s+/).filter((w) => w.length > 1);
      
      if (queryWords.length > 0) {
        // Filter results that match the remaining query keywords
        const relevantResults = filteredResults.filter((item) => {
          const title = (
            item.name ||
            item.title ||
            item.original_name ||
            item.original_title ||
            ''
          ).toLowerCase();
          const overview = (item.overview || '').toLowerCase();
          const searchText = `${title} ${overview}`;

          return queryWords.some((word) => searchText.includes(word));
        });

        // If we found relevant results, use those; otherwise use all filtered results
        // This allows for queries like "new hindi movies" - if there's no additional search term,
        // we return all recent Hindi movies
        if (relevantResults.length > 0) {
          return { ...data, results: relevantResults };
        }
      }
    }

    return { ...data, results: filteredResults };
  }

  /**
   * Cached: Fetches movie recommendations.
   * Deduplicates requests within the same render cycle.
   */
  static getMovieRecommendations = cache(
    async (mediaId: number, page?: number) => {
      const { data } = await this.axios(baseUrl).get<TmdbPagingResponse>(
        `/movie/${mediaId}/recommendations?language=en-US&page=${page ?? 1}`,
      );
      return data;
    },
  );

  /**
   * Cached: Fetches TV show recommendations.
   * Deduplicates requests within the same render cycle.
   */
  static getTvRecommendations = cache(async (tvId: number, page?: number) => {
    const { data } = await this.axios(baseUrl).get<TmdbPagingResponse>(
      `/tv/${tvId}/recommendations?language=en-US&page=${page ?? 1}`,
    );
    return data;
  });

  /**
   * Cached: Fetches similar movies.
   * Deduplicates requests within the same render cycle.
   */
  static getSimilarMovies = cache(async (mediaId: number, page?: number) => {
    const { data } = await this.axios(baseUrl).get<TmdbPagingResponse>(
      `/movie/${mediaId}/similar?language=en-US&page=${page ?? 1}`,
    );
    return data;
  });

  /**
   * Cached: Fetches similar TV shows.
   * Deduplicates requests within the same render cycle.
   */
  static getSimilarTvShows = cache(async (tvId: number, page?: number) => {
    const { data } = await this.axios(baseUrl).get<TmdbPagingResponse>(
      `/tv/${tvId}/similar?language=en-US&page=${page ?? 1}`,
    );
    return data;
  });

  /**
   * Cached: Fetches movie collection details.
   * Deduplicates requests within the same render cycle.
   */
  static getMovieCollection = cache(async (collectionId: number) => {
    const { data } = await this.axios(baseUrl).get<any>(
      `/collection/${collectionId}?language=en-US`,
    );
    return data;
  });

  /**
   * Cached: Fetches TV show seasons information.
   * Deduplicates requests within the same render cycle.
   */
  static getTvSeasons = cache(async (tvId: number) => {
    const { data } = await this.axios(baseUrl).get<any>(
      `/tv/${tvId}?language=en-US`,
    );
    return data;
  });
}

export default MovieService;
