import {
  GENRES,
  RequestType,
  type TmdbRequest,
} from './types';

/**
 * Builds the TMDB endpoint (relative to the shared base URL) for a request.
 * Single canonical source of URL construction for every discover/browse row.
 */
export function buildTmdbUrl(req: TmdbRequest) {
  const currentDate = new Date().toISOString().split('T')[0];
  const latestFilter = `&sort_by=primary_release_date.desc&primary_release_date.lte=${currentDate}&primary_release_date.gte=2024-01-01&vote_count.gte=5&with_runtime.gte=60`;

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
    case RequestType.NOW_PLAYING:
      return `/${req.mediaType}/now_playing?page=${req.page ?? 1}&with_original_language=en&language=en-US`;
    case RequestType.NETWORK:
      return `/discover/${req.mediaType}?with_networks=${req.networkId}&with_original_language=en&language=en-US&page=${req.page ?? 1}${req.isLatest ? latestFilter : ''}`;
    case RequestType.NETFLIX:
      return `/discover/${req.mediaType}?with_networks=213&with_original_language=en&language=en-US&page=${req.page ?? 1}${req.isLatest ? latestFilter : ''}`;
    case RequestType.DISNEY_PLUS:
      return `/discover/${req.mediaType}?with_networks=2739&with_original_language=en&language=en-US&page=${req.page ?? 1}${req.isLatest ? latestFilter : ''}`;
    case RequestType.AMAZON_PRIME:
      return `/discover/${req.mediaType}?with_networks=1024&with_original_language=en&language=en-US&page=${req.page ?? 1}${req.isLatest ? latestFilter : ''}`;
    case RequestType.HBO:
      return `/discover/${req.mediaType}?with_networks=49&language=en-US&page=${req.page ?? 1}${req.isLatest ? latestFilter : '&sort_by=popularity.desc'}`;
    case RequestType.POPULAR:
      return `/${req.mediaType}/popular?language=en-US&with_original_language=en&page=${req.page ?? 1}&without_genres=${GENRES.TALK},${GENRES.NEWS}`;
    case RequestType.GENRE:
      return `/discover/${req.mediaType}?with_genres=${req.genre}&language=en-US&with_original_language=en&page=${req.page ?? 1}&without_genres=${GENRES.TALK},${GENRES.NEWS}${req.isLatest ? latestFilter : ''}`;
    case RequestType.ANIME_GENRE:
      return `/discover/${req.mediaType}?with_genres=${req.genre}&with_keywords=210024%2C&language=en-US&with_original_language=en&page=${req.page ?? 1}&without_genres=${GENRES.TALK},${GENRES.NEWS}`;
    case RequestType.KOREAN:
      return `/discover/${req.mediaType}?with_genres=${req.genre}&with_original_language=ko&language=en-US&page=${req.page ?? 1}`;
    case RequestType.INDIAN:
      return `/discover/${req.mediaType}?with_genres=${req.genre}&with_original_language=hi&language=en-US&page=${req.page ?? 1}&sort_by=primary_release_date.desc&vote_count.gte=5&with_runtime.gte=60`;
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
      return `/discover/${req.mediaType}?with_networks=1024&with_original_language=hi&language=en-US&page=${req.page ?? 1}&sort_by=first_air_date.desc`;
    case RequestType.INDIAN_DISNEY_HOTSTAR:
      return `/discover/${req.mediaType}?with_networks=3919&with_original_language=hi&language=en-US&page=${req.page ?? 1}&sort_by=first_air_date.desc`;

    // New OTT Platform TV Shows
    case RequestType.DISNEY_PLUS_TV:
      return `/discover/${req.mediaType}?with_networks=2739&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;
    case RequestType.AMAZON_PRIME_TV:
      return `/discover/${req.mediaType}?with_networks=1024&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;
    case RequestType.HBO_TV:
      return `/discover/${req.mediaType}?with_networks=49&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;

    // Indian Movies
    case RequestType.INDIAN_MOVIES:
      return `/discover/${req.mediaType}?with_original_language=hi&language=en-US&page=${req.page ?? 1}${req.isLatest ? latestFilter : '&sort_by=primary_release_date.desc&vote_count.gte=100'}`;
    case RequestType.SOUTH_INDIAN:
      return `/discover/${req.mediaType}?with_original_language=te|ta|ml|kn&language=en-US&page=${req.page ?? 1}${req.isLatest ? latestFilter : '&sort_by=popularity.desc&vote_count.gte=10'}`;

    // Indian TV Shows by platform
    case RequestType.INDIAN_TV_NETFLIX:
      return `/discover/${req.mediaType}?with_networks=213&with_original_language=hi&language=en-US&page=${req.page ?? 1}&sort_by=popularity.desc`;
    case RequestType.INDIAN_TV_AMAZON_PRIME:
      return `/discover/${req.mediaType}?with_networks=1024&with_original_language=hi&language=en-US&page=${req.page ?? 1}&sort_by=first_air_date.desc`;
    case RequestType.INDIAN_TV_DISNEY_HOTSTAR:
      return `/discover/${req.mediaType}?with_networks=3919&with_original_language=hi&language=en-US&page=${req.page ?? 1}&sort_by=first_air_date.desc`;

    default:
      throw new Error(
        `request type ${req.requestType} is not implemented yet`,
      );
  }
}
