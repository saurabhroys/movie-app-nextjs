import MovieService from '@/services/tmdb/movie.service';
import {
  MediaType,
  type KeyWord,
  type Logo,
  type Show,
  type ShowWithGenreAndVideo,
} from '@/services/tmdb/types';

export interface CastMember {
  id: number;
  name: string;
}

export interface MovieCollection {
  id: number;
  name: string;
  parts?: {
    id: number;
    title: string;
    overview: string | null;
    poster_path: string | null;
    release_date: string | null;
  }[];
}

export interface DetailedShowInfo extends Omit<ShowWithGenreAndVideo, 'keywords'> {
  cast?: CastMember[];
  directors?: string[];
  writers?: string[];
  recommendations?: Show[];
  contentRating?: string | null;
  logoPath?: string | null;
  keywords?: KeyWord[];
  collection?: MovieCollection;
  recommendedLogos?: Record<number, string | null>;
  recommendedDetails?: Record<
    number,
    { runtime: number | null; number_of_seasons: number | null }
  >;
}

export interface FetchDetailedShowOptions {
  id: number;
  mediaType: MediaType;
  onFlipMediaType: (mediaType: MediaType) => void;
  includeExtras?: boolean;
}

interface RatingResult {
  iso_3166_1: string;
  rating?: string;
  certification?: string;
}

interface ReleaseDate {
  certification?: string;
}

interface CountryRelease {
  iso_3166_1: string;
  release_dates?: ReleaseDate[];
}

interface CrewMember {
  job?: string;
  name?: string;
}

interface TrailerFetchResult {
  data: DetailedShowInfo | null;
  notFound: boolean;
}

const RATING_PREFERENCE = ['RU', 'UA', 'LV', 'TW'];

function isNotFound(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 404;
}

/**
 * Fetches the content rating for a movie or TV show, preferring the
 * RATING_PREFERENCE country codes. Used by the modals and the hero, which
 * both need just the rating without pulling the full show payload.
 */
export async function fetchContentRating(
  type: 'movie' | 'tv',
  id: number,
): Promise<string | null> {
  try {
    if (type === 'tv') {
      const response = await MovieService.getContentRating('tv', id);
      const ratingData = response.data as unknown as { results?: RatingResult[] };
      const results = ratingData?.results ?? [];
      for (const cc of RATING_PREFERENCE) {
        const match = results.find((r) => r?.iso_3166_1 === cc);
        if (match?.rating || match?.certification) {
          return String(match.rating ?? match.certification).trim();
        }
      }
    } else {
      const response = await MovieService.getMovieReleaseDates(id);
      const ratingData = response.data as unknown as {
        results?: CountryRelease[];
      };
      const countries = ratingData?.results ?? [];
      for (const cc of RATING_PREFERENCE) {
        const country = countries.find((c) => c?.iso_3166_1 === cc);
        const releases = country?.release_dates ?? [];
        const match = releases.find((rd) => rd.certification?.trim());
        if (match && match.certification) {
          return match.certification.trim();
        }
      }
    }
  } catch {}
  return null;
}

async function fetchWithTrailer(
  id: number,
  currentType: 'tv' | 'movie',
): Promise<TrailerFetchResult> {
  const request = async (language: string): Promise<TrailerFetchResult> => {
    try {
      const data = (await MovieService.findMovieByIdAndType(
        id,
        currentType,
        language,
      )) as unknown as DetailedShowInfo;
      return { data, notFound: false };
    } catch (error) {
      return { data: null, notFound: isNotFound(error) };
    }
  };

  // Fetch hi-IN and en-US in parallel so whichever has a trailer wins fast
  const [hi, en] = await Promise.all([request('hi-IN'), request('en-US')]);
  if (hi.notFound || en.notFound) {
    return { data: null, notFound: true };
  }
  return {
    data: hi.data?.videos?.results?.length ? hi.data : en.data,
    notFound: false,
  };
}

/**
 * Shared detail fetch used by both the preview and hover modals.
 * Handles the tv<->movie 404 media-type flip and enriches the base
 * show with rating, logo, keywords and (optionally) the heavier
 * credits/recommendations payloads.
 */
export async function fetchDetailedShowData({
  id,
  mediaType,
  onFlipMediaType,
  includeExtras = true,
}: FetchDetailedShowOptions): Promise<DetailedShowInfo> {
  let currentType: 'tv' | 'movie' = mediaType === MediaType.TV ? 'tv' : 'movie';
  let effectiveMediaType = mediaType;

  let result = await fetchWithTrailer(id, currentType);
  if (result.notFound) {
    // The id exists under the other media type — flip and retry
    currentType = currentType === 'tv' ? 'movie' : 'tv';
    effectiveMediaType = currentType === 'tv' ? MediaType.TV : MediaType.MOVIE;
    onFlipMediaType(effectiveMediaType);
    result = await fetchWithTrailer(id, currentType);
  }
  if (result.notFound || !result.data) {
    throw new Error('Failed to fetch show details');
  }
  const data = result.data;
  const type = currentType;

  // Content rating (reuses the shared exported helper)
  data.contentRating = await fetchContentRating(type, id);

  // Logo
  try {
    const { data: imageData } = await MovieService.getImages(type, id);
    const preferred =
      imageData.logos?.find((l: Logo) => l.iso_639_1 === 'en') ??
      imageData.logos?.[0];
    data.logoPath = preferred ? preferred.file_path : null;
  } catch {}

  // Keywords
  const rawShow = data as unknown as Show;
  data.keywords = rawShow?.keywords?.results || rawShow?.keywords?.keywords;

  if (includeExtras) {
    // Credits
    try {
      const { data: credits } = await MovieService.getCredits(type, id);
      if (credits?.cast) {
        const cast = credits.cast as { id: number; name: string }[];
        data.cast = cast.slice(0, 10).map((actor) => ({
          id: Number(actor.id),
          name: String(actor.name),
        }));
      }
      const crew = credits?.crew as CrewMember[] | undefined;
      data.directors = crew
        ?.filter((c) => c?.job === 'Director')
        .map((c) => String(c.name));
      data.writers = crew
        ?.filter((c) =>
          ['Writer', 'Screenplay', 'Story', 'Teleplay'].includes(c?.job || ''),
        )
        .map((c) => String(c.name));
    } catch {}

    // Recommendations
    try {
      const primary =
        effectiveMediaType === MediaType.TV
          ? await MovieService.getTvRecommendations(id)
          : await MovieService.getMovieRecommendations(id);
      let results = primary?.results ?? [];
      if (!results?.length) {
        const fallback =
          effectiveMediaType === MediaType.TV
            ? await MovieService.getSimilarTvShows(id)
            : await MovieService.getSimilarMovies(id);
        results = fallback?.results ?? [];
      }
      data.recommendations = results;
    } catch {}

    // Collection
    if (effectiveMediaType === MediaType.MOVIE && data.belongs_to_collection) {
      try {
        const collectionData = await MovieService.getMovieCollection(
          data.belongs_to_collection.id,
        );
        data.collection = collectionData as MovieCollection;
      } catch {}
    }

    // Logos and details for recommendations
    if (data.recommendations?.length) {
      const topRecs = data.recommendations.slice(0, 12);

      const logoPromises = topRecs.map(async (s) => {
        try {
          const { data: imgData } = await MovieService.getImages(
            s.media_type === MediaType.TV ? 'tv' : 'movie',
            s.id,
          );
          const logo =
            imgData.logos?.find((l) => l.iso_639_1 === 'en')?.file_path ??
            imgData.logos?.[0]?.file_path;
          return [s.id, logo] as [number, string | undefined];
        } catch {
          return [s.id, undefined] as [number, string | undefined];
        }
      });

      const detailPromises = topRecs.map(async (s) => {
        try {
          const res = await MovieService.findMovieByIdAndType(
            s.id,
            s.media_type === MediaType.TV ? 'tv' : 'movie',
            'en-US',
          );
          return [
            s.id,
            {
              runtime: res.runtime,
              number_of_seasons: res.number_of_seasons,
            },
          ] as [number, { runtime: number | null; number_of_seasons: number | null }];
        } catch {
          return [
            s.id,
            { runtime: null, number_of_seasons: null },
          ] as [number, { runtime: number | null; number_of_seasons: number | null }];
        }
      });

      const logos = await Promise.all(logoPromises);
      const details = await Promise.all(detailPromises);

      data.recommendedLogos = Object.fromEntries(
        logos.filter(([, l]) => l),
      ) as Record<number, string | null>;
      data.recommendedDetails = Object.fromEntries(details) as Record<
        number,
        { runtime: number | null; number_of_seasons: number | null }
      >;
    }
  }

  data.media_type = effectiveMediaType;
  return data;
}
