export const MediaType = {
  ALL: 'all',
  TV: 'tv',
  MOVIE: 'movie',
  ANIME: 'anime',
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const RequestType = {
  TRENDING: 'trending',
  TOP_RATED: 'top_rated',
  NOW_PLAYING: 'now_playing',
  NETWORK: 'network',
  NETFLIX: 'netflix',
  DISNEY_PLUS: 'disney+',
  AMAZON_PRIME: 'amazon_prime',
  HBO: 'hbo',
  POPULAR: 'popular',
  GENRE: 'genre',
  ANIME_GENRE: 'anime_genre',
  KOREAN: 'korean',
  INDIAN: 'indian',
  TAMIL: 'tamil',
  TELUGU: 'telugu',
  MALAYALAM: 'malayalam',
  KANNADA: 'kannada',
  DEFAULT: 'default',
  ANIME_LATEST: 'anime_latest',
  ANIME_TRENDING: 'anime_trending',
  ANIME_TOP_RATED: 'anime_top_rated',
  ANIME_NETFLIX: 'anime_netflix',
  // OTT Platform request types for Indian content
  INDIAN_NETFLIX: 'indian_netflix',
  INDIAN_AMAZON_PRIME: 'indian_amazon_prime',
  INDIAN_DISNEY_HOTSTAR: 'indian_disney_hotstar',
  // OTT Platform request types for TV Shows
  DISNEY_PLUS_TV: 'disney_plus_tv',
  AMAZON_PRIME_TV: 'amazon_prime_tv',
  HBO_TV: 'hbo_tv',
  // Indian Movies
  INDIAN_MOVIES: 'indian_movies',
  SOUTH_INDIAN: 'south_indian',
  // Indian TV Shows by platform
  INDIAN_TV_NETFLIX: 'indian_tv_netflix',
  INDIAN_TV_AMAZON_PRIME: 'indian_tv_amazon_prime',
  INDIAN_TV_DISNEY_HOTSTAR: 'indian_tv_disney_hotstar',
} as const;

export type RequestType = (typeof RequestType)[keyof typeof RequestType];

export const GENRES = {
  ACTION: 28,
  ADVENTURE: 12,
  ANIMATION: 16,
  COMEDY: 35,
  CRIME: 80,
  DOCUMENTARY: 99,
  DRAMA: 18,
  FAMILY: 10751,
  FANTASY: 14,
  HISTORY: 36,
  HORROR: 27,
  MUSIC: 10402,
  MYSTERY: 9648,
  ROMANCE: 10749,
  SCIENCE_FICTION: 878,
  TV_MOVIE: 10770,
  THRILLER: 53,
  WAR: 10752,
  WESTERN: 37,
  ACTION_ADVENTURE: 10759,
  KIDS: 10762,
  NEWS: 10763,
  REALITY: 10764,
  SCIFI_FANTASY: 10765,
  SOAP: 10766,
  TALK: 10767,
  WAR_POLITICS: 10768,
} as const;

export type GenreId = (typeof GENRES)[keyof typeof GENRES];

export type Genre = {
  id: number;
  name: string | null;
};

export type TmdbPagingResponse = {
  results: Show[];
  page: number;
  total_pages: number;
  total_results: number;
};

export type TmdbRequest = {
  requestType: RequestType;
  mediaType: MediaType;
  genre?: GenreId;
  page?: number;
  isLatest?: boolean;
  networkId?: number;
};

export type ShowRequest = {
  title: string;
  req: TmdbRequest;
  visible: boolean;
};

export type CategorizedShows = {
  title: string;
  shows: Show[];
  visible: boolean;
  req: TmdbRequest;
};

export type Show = {
  adult: boolean;
  backdrop_path: string | null;
  media_type: MediaType;
  budget: number | null;
  homepage: string | null;
  showId: string;
  id: number;
  imdb_id: string | null;
  external_ids?: {
    imdb_id?: string | null;
  };
  original_language: string;
  original_title: string | null;
  overview: string | null;
  popularity: number;
  poster_path: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  release_date: string | null;
  first_air_date: string | null;
  last_air_date: string | null;
  revenue: number | null;
  runtime: number | null;
  status: string | null;
  tagline: string | null;
  title: string | null;
  name: string | null;
  video: boolean;
  vote_average: number;
  vote_count: number;
  original_name?: string;
  keywords: KeyWordResponse;
  seasons: Season[];
  networks?: Network[];
  logos?: Logo[];
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  };
};

export type Network = {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
};

export type Logo = {
  aspect_ratio: number;
  height: number;
  iso_639_1: string;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
};

export type ImagesResponse = {
  backdrops: Logo[];
  logos: Logo[];
  posters: Logo[];
};

export type KeyWord = {
  id: number;
  name: string;
};

export type KeyWordResponse = {
  id: number;
  keywords: KeyWord[];
  results: KeyWord[];
};

export type VideoType =
  | 'Bloopers'
  | 'Featurette'
  | 'Behind the Scenes'
  | 'Clip'
  | 'Trailer'
  | 'Teaser';

export type VideoResult = {
  iso_639_1: string;
  iso_3166_1: string;
  name: string;
  key: string;
  site: string;
  size: number;
  type: VideoType;
  official: boolean;
  published_at: string;
  id: string;
};

export type ShowWithGenreAndVideo = Show & {
  genres: Genre[];
  videos?: {
    results: VideoResult[];
  };
};

export type Season = {
  _id: string;
  air_date: string;
  name: string;
  overview: string;
  id: number;
  poster_path: string;
  season_number: number;
  vote_average: number;
  episodes: Episode[];
};

export type Episode = {
  air_date: string;
  episode_number: number;
  id: number;
  name: string;
  overview: string;
  production_code: string;
  runtime: number;
  season_number: number;
  show_id: number;
  still_path: string;
  vote_average: number;
  vote_count: number;
};

/**
 * Request types whose discover endpoints omit a reliable `media_type` on the
 * results — the requested media type must be forced onto every item.
 * Single canonical source, shared by `executeRequest` and `getShows`.
 */
export const requestTypesNeedUpdateMediaType = new Set<RequestType>([
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
  RequestType.SOUTH_INDIAN,
  RequestType.INDIAN_TV_NETFLIX,
  RequestType.INDIAN_TV_AMAZON_PRIME,
  RequestType.INDIAN_TV_DISNEY_HOTSTAR,
]);

export interface ReleaseDatesResponse {
  results?: Record<string, unknown>[];
}

export interface CreditsResponse {
  cast?: Record<string, unknown>[];
  crew?: Record<string, unknown>[];
}
