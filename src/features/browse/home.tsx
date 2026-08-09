import Hero from '@/features/browse/hero';
import ShowsContainer from '@/features/browse/shows-container';
import { siteConfig } from '@/configs/site';
import MovieService from '@/services/tmdb/movie.service';
import { getShows } from '@/services/tmdb/shows';
import {
  GENRES,
  MediaType,
  RequestType,
  type Show,
  type ShowRequest,
  type CategorizedShows,
} from '@/services/tmdb/types';
import { getRandomShow } from '@/lib/utils';
import { fetchDetailedShowData } from '@/redux/features/modals/detail-fetch-helper';

import { cacheLife } from 'next/cache';
import { connection } from 'next/server';

interface HomeData {
  categorizedShows: CategorizedShows[];
  randomShow: Show | null;
  heroTrailer: string | null;
  heroLogoPath: string | null;
  heroContentRating: string | null;
  logoPaths: Record<number, string | null>;
}

export default async function Home() {
  await connection();
  const h1 = `${siteConfig.name} Home`;
  const {
    categorizedShows,
    randomShow,
    heroTrailer,
    heroLogoPath,
    heroContentRating,
    logoPaths,
  } = await getHomeData();

  return (
    <>
      <h1 className="hidden">{h1}</h1>
      <Hero
        randomShow={randomShow}
        trailer={heroTrailer}
        logoPath={heroLogoPath}
        contentRating={heroContentRating}
      />
      <ShowsContainer shows={categorizedShows} logoPaths={logoPaths} />
    </>
  );
}

async function getHomeData(): Promise<HomeData> {
  'use cache';
  cacheLife('hours');
  const requests: ShowRequest[] = [
    {
      title: 'Trending Now',
      req: { requestType: RequestType.TRENDING, mediaType: MediaType.ALL },
      visible: true,
    },
    {
      title: 'Netflix TV Shows',
      req: { requestType: RequestType.NETFLIX, mediaType: MediaType.TV },
      visible: true,
    },
    {
      title: 'Disney+ TV Shows',
      req: { requestType: RequestType.DISNEY_PLUS_TV, mediaType: MediaType.TV },
      visible: true,
    },
    {
      title: 'Amazon Prime TV Shows',
      req: {
        requestType: RequestType.AMAZON_PRIME_TV,
        mediaType: MediaType.TV,
      },
      visible: true,
    },
    {
      title: 'HBO TV Shows',
      req: { requestType: RequestType.HBO_TV, mediaType: MediaType.TV },
      visible: true,
    },
    {
      title: 'Popular TV Shows',
      req: {
        requestType: RequestType.TOP_RATED,
        mediaType: MediaType.TV,
        genre: GENRES.TV_MOVIE,
      },
      visible: true,
    },
    {
      title: 'Latest Bollywood Movies',
      req: {
        requestType: RequestType.INDIAN_MOVIES,
        mediaType: MediaType.MOVIE,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'South Indian Movies',
      req: {
        requestType: RequestType.SOUTH_INDIAN,
        mediaType: MediaType.MOVIE,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Indian TV Shows - Amazon Prime Video',
      req: {
        requestType: RequestType.INDIAN_TV_AMAZON_PRIME,
        mediaType: MediaType.TV,
      },
      visible: true,
    },
    {
      title: 'Korean Movies',
      req: {
        requestType: RequestType.KOREAN,
        mediaType: MediaType.MOVIE,
        genre: GENRES.THRILLER,
      },
      visible: true,
    },
    {
      title: 'Comedy Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.COMEDY,
      },
      visible: true,
    },
    {
      title: 'Action Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.ACTION,
      },
      visible: true,
    },
    {
      title: 'Romance Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.ROMANCE,
      },
      visible: true,
    },
    {
      title: 'Scary Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: GENRES.THRILLER,
      },
      visible: true,
    },
  ];

  const categorizedShows = await getShows(requests);
  const randomShow: Show | null = getRandomShow(categorizedShows);

  let heroTrailer: string | null = null;
  let heroLogoPath: string | null = null;
  let heroContentRating: string | null = null;

  if (randomShow) {
    try {
      const details = await fetchDetailedShowData({
        id: randomShow.id,
        mediaType: randomShow.media_type,
        onFlipMediaType: () => {},
        includeExtras: false,
      });
      heroTrailer =
        details.videos?.results?.find((v) => v.type === 'Trailer')?.key ?? null;
      heroLogoPath = details.logoPath ?? null;
      heroContentRating = details.contentRating ?? null;
    } catch {
      // hero is decorative — keep defaults if lookups fail
    }
  }

  const logoPaths = await fetchAllLogos(categorizedShows);

  return {
    categorizedShows,
    randomShow,
    heroTrailer,
    heroLogoPath,
    heroContentRating,
    logoPaths,
  };
}

/**
 * Batch-fetches logo paths for every show on the home page in a single
 * server-side pass. Runs inside the cached `getHomeData` scope, so the
 * ~280 image lookups happen once per cache window instead of per card.
 */
async function fetchAllLogos(
  categorizedShows: CategorizedShows[],
): Promise<Record<number, string | null>> {
  const shows = categorizedShows.flatMap((cat) => cat.shows ?? []);
  const unique = Array.from(
    new Map(shows.map((s) => [s.id, s])).values(),
  );
  const entries = await Promise.all(
    unique.map(async (show) => {
      try {
        const type: 'movie' | 'tv' | 'anime' =
          show.media_type === MediaType.MOVIE
            ? 'movie'
            : show.media_type === MediaType.ANIME
              ? 'anime'
              : 'tv';
        const { data } = await MovieService.getImages(type, show.id);
        const preferred =
          data.logos?.find((l) => l.iso_639_1 === 'en') ?? data.logos?.[0];
        return [show.id, preferred ? preferred.file_path : null] as const;
      } catch {
        return [show.id, null] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}
