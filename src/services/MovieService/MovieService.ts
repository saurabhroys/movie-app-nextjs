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

  static findMovie = cache(async (id: number) => {
    return this.axios(baseUrl).get<Show>(
      `/movie/${id}?append_to_response=keywords`,
    );
  });

  static findTvSeries = cache(async (id: number) => {
    return this.axios(baseUrl).get<Show>(
      `/tv/${id}?append_to_response=keywords`,
    );
  });

  static async getKeywords(
    id: number,
    type: 'tv' | 'movie',
  ): Promise<AxiosResponse<KeyWordResponse>> {
    return this.axios(baseUrl).get<KeyWordResponse>(`/${type}/${id}/keywords`);
  }

  static async getSeasons(
    id: number,
    season: number,
  ): Promise<AxiosResponse<ISeason>> {
    return this.axios(baseUrl).get<ISeason>(`/tv/${id}/season/${season}`);
  }

  static async getImages(
    mediaType: 'movie' | 'tv' | 'anime',
    mediaId: number,
  ): Promise<AxiosResponse<ImagesResponse>> {
    return this.axios(baseUrl).get<ImagesResponse>(`/${mediaType}/${mediaId}/images`);
  }

  static async getContentRating(
    mediaType: 'movie' | 'tv',
    mediaId: number,
  ): Promise<AxiosResponse<ImagesResponse>> {
    return this.axios(baseUrl).get<ImagesResponse>(`/${mediaType}/${mediaId}/content_ratings`);
  }

  static async getMovieReleaseDates(
    movieId: number,
  ): Promise<AxiosResponse<any>> {
    return this.axios(baseUrl).get<any>(`/movie/${movieId}/release_dates`);
  }

  static async getCredits(mediaType: string, id: number): Promise<AxiosResponse<any>> {
    return this.axios(baseUrl).get<any>(`/${mediaType}/${id}/credits`);
  }

  static findMovieByIdAndType = cache(async (id: number, type: string, language: string = 'en-US') => {
    const params: Record<string, string> = {
      language: language,
      append_to_response: 'videos,keywords',
    };
    const response: AxiosResponse<ShowWithGenreAndVideo> = await this.axios(
      baseUrl,
    ).get<ShowWithGenreAndVideo>(`/${type}/${id}`, { params });
    return Promise.resolve(response.data);
  });

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
        return `/trending/${ req.mediaType }/day?language=en-US&with_original_language=en&page=${req.page ?? 1}`;
      case RequestType.TOP_RATED:
        return `/${req.mediaType}/top_rated?page=${ req.page ?? 1 }&with_original_language=en&language=en-US`;
      case RequestType.NETFLIX:
         return `/discover/${ req.mediaType }?with_networks=213&with_original_language=en&language=en-US&page=${ req.page ?? 1 }`;
      case RequestType.DISNEY_PLUS:
         return `/discover/${ req.mediaType }?with_networks=2739&with_original_language=en&language=en-US&page=${ req.page ?? 1 }`;
      case RequestType.AMAZON_PRIME:
         return `/discover/${ req.mediaType }?with_networks=1024&with_original_language=en&language=en-US&page=${ req.page ?? 1 }`;
      case RequestType.HBO:
        return `/discover/${req.mediaType}?with_networks=49&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;
      case RequestType.POPULAR:
        return `/${ req.mediaType }/popular?language=en-US&with_original_language=en&page=${ req.page ?? 1 }&without_genres=${Genre.TALK},${Genre.NEWS}`;
      case RequestType.GENRE:
        return `/discover/${req.mediaType}?with_genres=${ req.genre }&language=en-US&with_original_language=en&page=${ req.page ?? 1 }&without_genres=${Genre.TALK},${Genre.NEWS}`;
      case RequestType.ANIME_GENRE:
        return `/discover/${req.mediaType}?with_genres=${ req.genre }&with_keywords=210024%2C&language=en-US&with_original_language=en&page=${ req.page ?? 1 }&without_genres=${Genre.TALK},${Genre.NEWS}`;
      case RequestType.KOREAN:
        return `/discover/${req.mediaType}?with_genres=${ req.genre }&with_original_language=ko&language=en-US&page=${req.page ?? 1}`;
      case RequestType.INDIAN:
        return `/discover/${req.mediaType}?with_genres=${ req.genre }&with_original_language=hi&language=en-US&page=${req.page ?? 1}`;
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

  static executeRequest(req: {
    requestType: RequestType;
    mediaType: MediaType;
    page?: number;
  }) {
    const url = this.urlBuilder(req);
    // console.log(`Making request to: ${url}`);
    return this.axios(baseUrl).get<TmdbPagingResponse>(url);
  }

  static async executeRequestWithRetry(
    req: { requestType: RequestType; mediaType: MediaType; page?: number; genre?: number },
    maxAttempts: number = 3,
    initialBackoffMs: number = 300,
  ) {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
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
        (typeof status === 'number' && (status === 429 || (status >= 500 && status < 600)))
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
          console.error(`Failed to fetch shows ${requests[reqIndex].title}:`, res.reason);
          console.error(`Request details:`, requests[reqIndex].req);
          shows.push({
            title: requests[reqIndex].title,
            shows: [],
            visible: requests[reqIndex].visible,
          });
        } else if (this.isFulfilled(res)) {
          if (
            requestTypesNeedUpdateMediaType.indexOf(requests[reqIndex].req.requestType) >
            -1
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

  static searchMovies = cache(async (query: string, page?: number) => {
    const { data } = await this.axios(baseUrl).get<TmdbPagingResponse>(
      `/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=${
        page ?? 1
      }&include_adult=true`,
    );

    // Filter out results without proper media_type, without images, and sort by popularity
    data.results = data.results
      .filter((item) => 
        item.media_type && 
        (item.media_type as string === 'movie' || item.media_type as string === 'tv' || item.media_type as string === 'person') &&
        hasValidImage(item)
      )
      .sort((a, b) => {
        return b.popularity - a.popularity;
      });
    
    return data;
  });

  static getMovieRecommendations = cache(async (mediaId: number, page?: number) => {
    const { data } = await this.axios(baseUrl).get<TmdbPagingResponse>(
      `/movie/${mediaId}/recommendations?language=en-US&page=${page ?? 1}`,
    );
    return data;
  });

  static getTvRecommendations = cache(async (tvId: number, page?: number) => {
    const { data } = await this.axios(baseUrl).get<TmdbPagingResponse>(
      `/tv/${tvId}/recommendations?language=en-US&page=${page ?? 1}`,
    );
    return data;
  });

  static getSimilarMovies = cache(async (mediaId: number, page?: number) => {
    const { data } = await this.axios(baseUrl).get<TmdbPagingResponse>(
      `/movie/${mediaId}/similar?language=en-US&page=${page ?? 1}`,
    );
    return data;
  });

  static getSimilarTvShows = cache(async (tvId: number, page?: number) => {
    const { data } = await this.axios(baseUrl).get<TmdbPagingResponse>(
      `/tv/${tvId}/similar?language=en-US&page=${page ?? 1}`,
    );
    return data;
  });

  static getMovieCollection = cache(async (collectionId: number) => {
    const { data } = await this.axios(baseUrl).get<any>(
      `/collection/${collectionId}?language=en-US`,
    );
    return data;
  });

  static getTvSeasons = cache(async (tvId: number) => {
    const { data } = await this.axios(baseUrl).get<any>(
      `/tv/${tvId}?language=en-US`,
    );
    return data;
  });
}

export default MovieService;
