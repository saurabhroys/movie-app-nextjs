import Hero from '@/features/browse/hero';
import ShowsContainer from '@/features/browse/shows-container';
import {
  fetchLogoPaths,
  fetchHeroTrailer,
} from '@/services/tmdb/logos';
import { getRandomShow } from '@/lib/utils';
import { fetchContentRating } from '@/redux/features/modals/detail-fetch-helper';
import {
  MediaType,
  type CategorizedShows,
  type Show,
} from '@/services/tmdb/types';

/**
 * Shared server shell for all browse pages (home, movies, tv-shows, anime,
 * new-and-popular, sports). Each page keeps its own `'use cache'` +
 * `cacheLife('hours')` data scope and calls `enrichShowsWithLogos`, so the
 * logo batch + hero trailer/rating run once per cache window with a single
 * coherent key. No `'use cache'` here — that would nest a cache scope.
 */

export interface BrowsePageData {
  categorizedShows: CategorizedShows[];
  randomShow: Show | null;
  heroTrailer: string | null;
  heroLogoPath: string | null;
  heroContentRating: string | null;
  logoPaths: Record<number, string | null>;
}

/**
 * Picks the hero show and enriches the category list with logo paths,
 * hero trailer key, and hero content rating — all fetched in parallel.
 * The hero logo reuses the shared batch instead of a duplicate fetch.
 */
export async function enrichShowsWithLogos(
  categorizedShows: CategorizedShows[],
): Promise<BrowsePageData> {
  const randomShow: Show | null = getRandomShow(categorizedShows);

  const [heroTrailer, heroContentRating, logoPaths] = await Promise.all([
    randomShow
      ? fetchHeroTrailer(randomShow.id, randomShow.media_type).catch(
          () => null,
        )
      : Promise.resolve(null),
    randomShow
      ? fetchContentRating(
          randomShow.media_type === MediaType.TV ? 'tv' : 'movie',
          randomShow.id,
        ).catch(() => null)
      : Promise.resolve(null),
    fetchLogoPaths(categorizedShows.flatMap((cat) => cat.shows ?? [])),
  ]);

  const heroLogoPath: string | null =
    randomShow ? (logoPaths[randomShow.id] ?? null) : null;

  return {
    categorizedShows,
    randomShow,
    heroTrailer,
    heroLogoPath,
    heroContentRating,
    logoPaths,
  };
}

const ShowsPage = ({ data }: { data: BrowsePageData }) => {
  return (
    <>
      <Hero
        randomShow={data.randomShow}
        trailer={data.heroTrailer}
        logoPath={data.heroLogoPath}
        contentRating={data.heroContentRating}
      />
      <ShowsContainer shows={data.categorizedShows} logoPaths={data.logoPaths} />
    </>
  );
};

export default ShowsPage;
