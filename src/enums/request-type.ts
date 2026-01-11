import { type MediaType, type Show } from '@/types';
import { type Genre } from './genre';

export enum RequestType {
  TRENDING = 'trending',
  TOP_RATED = 'top_rated',
  NOW_PLAYING = 'now_playing',
  NETFLIX = 'netflix',
  DISNEY_PLUS = 'disney+',
  AMAZON_PRIME = 'amazon_prime',
  HBO = 'hbo',
  POPULAR = 'popular',
  GENRE = 'genre',
  ANIME_GENRE = 'anime_genre',
  KOREAN = 'korean',
  INDIAN = 'indian',
  TAMIL = 'tamil',
  TELUGU = 'telugu',
  MALAYALAM = 'malayalam',
  KANNADA = 'kannada',
  DEFAULT = 'default',
  ANIME_LATEST = 'anime_latest',
  ANIME_TRENDING = 'anime_trending',
  ANIME_TOP_RATED = 'anime_top_rated',
  ANIME_NETFLIX = 'anime_netflix',
  // OTT Platform request types for Indian content
  INDIAN_NETFLIX = 'indian_netflix',
  INDIAN_AMAZON_PRIME = 'indian_amazon_prime',
  INDIAN_DISNEY_HOTSTAR = 'indian_disney_hotstar',
  // OTT Platform request types for TV Shows
  DISNEY_PLUS_TV = 'disney_plus_tv',
  AMAZON_PRIME_TV = 'amazon_prime_tv',
  HBO_TV = 'hbo_tv',
  // Indian Movies
  INDIAN_MOVIES = 'indian_movies',
  // Indian TV Shows by platform
  INDIAN_TV_NETFLIX = 'indian_tv_netflix',
  INDIAN_TV_AMAZON_PRIME = 'indian_tv_amazon_prime',
  INDIAN_TV_DISNEY_HOTSTAR = 'indian_tv_disney_hotstar',
}

export type TmdbPagingResponse = {
  results: Show[];
  page: number;
  totalPages: number;
  totalResults: number;
};

export type TmdbRequest = {
  requestType: RequestType;
  mediaType: MediaType;
  genre?: Genre;
  page?: number;
  isLatest?: boolean;
};

export type ShowRequest = {
  title: string;
  req: TmdbRequest;
  visible: boolean;
};
