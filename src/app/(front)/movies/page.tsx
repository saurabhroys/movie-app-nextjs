import Hero from '@/components/hero';
import ShowsContainer from '@/components/shows-container';
import { siteConfig } from '@/configs/site';
import { Genre } from '@/enums/genre';
import { RequestType, type ShowRequest } from '@/enums/request-type';
import { getRandomShow } from '@/lib/utils';
import MovieService from '@/services/MovieService';
import { MediaType, type Show } from '@/types';
import { type Metadata } from 'next';

export const revalidate = siteConfig.revalidate;

export const metadata: Metadata = {
  title: 'Movies',
  description: `Browse and watch the latest movies on ${siteConfig.name}. Discover trending movies, popular releases, and movies by genre.`,
};

export default async function MoviePage() {
  const h1 = `${siteConfig.name} Movie`;
  const requests: ShowRequest[] = [
    {
      title: 'Trending Now',
      req: { requestType: RequestType.TRENDING, mediaType: MediaType.MOVIE },
      visible: true,
    },
    {
      title: 'Popular',
      req: { requestType: RequestType.POPULAR, mediaType: MediaType.MOVIE },
      visible: true,
    },
    {
      title: 'Top Rated Movies',
      req: { requestType: RequestType.TOP_RATED, mediaType: MediaType.MOVIE },
      visible: true,
    },
    {
      title: 'Latest Movies',
      req: { requestType: RequestType.NOW_PLAYING, mediaType: MediaType.MOVIE },
      visible: true,
    },
    // {
    //   title: 'Netflix Movies',
    //   req: {
    //     requestType: RequestType.NETWORK,
    //     mediaType: MediaType.MOVIE,
    //     networkId: 213,
    //     isLatest: true,
    //   },
    //   visible: true,
    // },
    // {
    //   title: 'Disney+ Movies',
    //   req: {
    //     requestType: RequestType.NETWORK,
    //     mediaType: MediaType.MOVIE,
    //     networkId: 2739,
    //     isLatest: true,
    //   },
    //   visible: true,
    // },
    // {
    //   title: 'Amazon Prime Movies',
    //   req: {
    //     requestType: RequestType.NETWORK,
    //     mediaType: MediaType.MOVIE,
    //     networkId: 1024,
    //     isLatest: true,
    //   },
    //   visible: true,
    // },
    // {
    //   title: 'HBO Movies',
    //   req: {
    //     requestType: RequestType.NETWORK,
    //     mediaType: MediaType.MOVIE,
    //     networkId: 49,
    //     isLatest: true,
    //   },
    //   visible: true,
    // },
    {
      title: 'Comedy Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: Genre.COMEDY,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Action Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: Genre.ACTION,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Animation Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: Genre.ANIMATION,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Sci-Fi Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: Genre.SCIENCE_FICTION,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Horror Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: Genre.HORROR,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Romance Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: Genre.ROMANCE,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Scary Movies',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: Genre.THRILLER,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Documentaries',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.MOVIE,
        genre: Genre.DOCUMENTARY,
        isLatest: true,
      },
      visible: true,
    },
    {
      title: 'Indian Movies',
      req: {
        requestType: RequestType.INDIAN_MOVIES,
        mediaType: MediaType.MOVIE,
        isLatest: true,
      },
      visible: true,
    },
  ];
  const allShows = await MovieService.getShows(requests);
  const randomShow: Show | null = getRandomShow(allShows);
  return (
    <>
      <h1 className="hidden">{h1}</h1>
      <Hero randomShow={randomShow} />
      <ShowsContainer shows={allShows} />
    </>
  );
}
