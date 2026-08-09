import { type AxiosResponse } from 'axios';
import { cache } from 'react';
import { hasValidImage } from '@/lib/utils';
import { getNameFromShow, getSlug } from '@/lib/slug';
import http, { isFulfilled, withRetry } from './http';
import {
  MediaType,
  type Season,
  type KeyWordResponse,
  type Show,
  type ShowWithGenreAndVideo,
  type ImagesResponse,
  type TmdbPagingResponse,
  type ReleaseDatesResponse,
  type CreditsResponse,
} from './types';

/**
 * Caching Strategy:
 * - React's `cache()` is used for request-level memoization (deduplication within a single render)
 * - All data-fetching methods are wrapped with `cache()` to prevent duplicate requests
 * - Cache keys are deterministic based on function parameters (primitives only for stability)
 * - This works in conjunction with Next.js ISR (revalidate) for persistent caching
 */

class MovieService {
  static async findCurrentMovie(id: number, pathname: string): Promise<Show> {
    const data = await Promise.allSettled([
      this.findMovie(id),
      this.findTvSeries(id),
    ]);
    const response = data
      .filter(isFulfilled)
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
    return http.get<Show>(`/movie/${id}?append_to_response=keywords`);
  });

  /**
   * Cached: Fetches TV series details by ID.
   * Deduplicates requests within the same render cycle.
   */
  static findTvSeries = cache(async (id: number) => {
    return http.get<Show>(`/tv/${id}?append_to_response=keywords,external_ids`);
  });

  /**
   * Cached: Fetches keywords for a movie or TV show.
   * Deduplicates requests within the same render cycle.
   */
  static getKeywords = cache(
    async (id: number, type: 'tv' | 'movie'): Promise<AxiosResponse<KeyWordResponse>> => {
      return http.get<KeyWordResponse>(`/${type}/${id}/keywords`);
    },
  );

  /**
   * Cached: Fetches season details for a TV show.
   * Deduplicates requests within the same render cycle.
   */
  static getSeasons = cache(
    async (id: number, season: number): Promise<AxiosResponse<Season>> => {
      return http.get<Season>(`/tv/${id}/season/${season}`);
    },
  );

  /**
   * Cached: Fetches images for a movie, TV show, or anime with retry logic.
   * Deduplicates requests within the same render cycle.
   */
  static getImages = cache(
    async (
      mediaType: 'movie' | 'tv' | 'anime',
      mediaId: number,
      maxAttempts: number = 3,
    ): Promise<AxiosResponse<ImagesResponse>> => {
      return withRetry(
        () => {
          const apiType = mediaType === 'anime' ? 'tv' : mediaType;
          return http.get<ImagesResponse>(`/${apiType}/${mediaId}/images`);
        },
        { maxAttempts },
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
      return http.get<ImagesResponse>(
        `/${mediaType}/${mediaId}/content_ratings`,
      );
    },
  );

  /**
   * Cached: Fetches release dates for a movie.
   * Deduplicates requests within the same render cycle.
   */
  static getMovieReleaseDates = cache(
    async (movieId: number): Promise<AxiosResponse<ReleaseDatesResponse>> => {
      return http.get<ReleaseDatesResponse>(`/movie/${movieId}/release_dates`);
    },
  );

  /**
   * Cached: Fetches credits for a movie or TV show.
   * Deduplicates requests within the same render cycle.
   */
  static getCredits = cache(
    async (mediaType: string, id: number): Promise<AxiosResponse<CreditsResponse>> => {
      return http.get<CreditsResponse>(`/${mediaType}/${id}/credits`);
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
      maxAttempts: number = 1,
    ) => {
      return withRetry(
        async () => {
          const params: Record<string, string> = {
            language: language,
            append_to_response: 'videos,keywords',
          };
          // Use a longer timeout for requests with append_to_response as they fetch more data
          const response: AxiosResponse<ShowWithGenreAndVideo> = await http.get<ShowWithGenreAndVideo>(
            `/${type}/${id}`,
            {
              params,
              timeout: 8000, // 8 seconds for requests with additional data
            },
          );
          return Promise.resolve(response.data);
        },
        { maxAttempts },
      );
    },
  );

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
      let searchUrl = `/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=${page ?? 1
        }&include_adult=true`;

      // Add year filter if specified (TMDB search doesn't directly support this, but we'll filter results)
      const { data } = await http.get<TmdbPagingResponse>(searchUrl);

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
    let discoverUrl = `/discover/${mediaType}?with_original_language=${languages}&language=en-US&page=${page ?? 1
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

    const { data } = await http.get<TmdbPagingResponse>(discoverUrl);

    // Filter out results without images, and ensure media_type is set
    const filteredResults = data.results.filter((item) => {
      item.media_type = mediaType === 'movie' ? MediaType.MOVIE : MediaType.TV;
      return hasValidImage(item);
    });

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
      const { data } = await http.get<TmdbPagingResponse>(
        `/movie/${mediaId}/recommendations?language=en-US&page=${page ?? 1}`,
      );
      if (data?.results) {
        data.results.forEach((show) => {
          show.media_type = MediaType.MOVIE;
        });
      }
      return data;
    },
  );

  /**
   * Cached: Fetches TV show recommendations.
   * Deduplicates requests within the same render cycle.
   */
  static getTvRecommendations = cache(async (tvId: number, page?: number) => {
    const { data } = await http.get<TmdbPagingResponse>(
      `/tv/${tvId}/recommendations?language=en-US&page=${page ?? 1}`,
    );
    if (data?.results) {
      data.results.forEach((show) => {
        show.media_type = MediaType.TV;
      });
    }
    return data;
  });

  /**
   * Cached: Fetches similar movies.
   * Deduplicates requests within the same render cycle.
   */
  static getSimilarMovies = cache(async (mediaId: number, page?: number) => {
    const { data } = await http.get<TmdbPagingResponse>(
      `/movie/${mediaId}/similar?language=en-US&page=${page ?? 1}`,
    );
    if (data?.results) {
      data.results.forEach((show) => {
        show.media_type = MediaType.MOVIE;
      });
    }
    return data;
  });

  /**
   * Cached: Fetches similar TV shows.
   * Deduplicates requests within the same render cycle.
   */
  static getSimilarTvShows = cache(async (tvId: number, page?: number) => {
    const { data } = await http.get<TmdbPagingResponse>(
      `/tv/${tvId}/similar?language=en-US&page=${page ?? 1}`,
    );
    if (data?.results) {
      data.results.forEach((show) => {
        show.media_type = MediaType.TV;
      });
    }
    return data;
  });

  /**
   * Cached: Fetches movie collection details.
   * Deduplicates requests within the same render cycle.
   */
  static getMovieCollection = cache(async (collectionId: number) => {
    const { data } = await http.get<unknown>(
      `/collection/${collectionId}?language=en-US`,
    );
    return data;
  });

  /**
   * Cached: Fetches TV show seasons information.
   * Deduplicates requests within the same render cycle.
   */
  static getTvSeasons = cache(async (tvId: number) => {
    const { data } = await http.get<unknown>(
      `/tv/${tvId}?language=en-US`,
    );
    return data;
  });
}

export default MovieService;
