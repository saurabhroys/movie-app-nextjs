import Hero from '@/components/hero';
import ShowsContainer from '@/components/shows-container';
import { siteConfig } from '@/configs/site';
import { Genre } from '@/enums/genre';
import { RequestType, type ShowRequest } from '@/enums/request-type';
import { getRandomShow } from '@/lib/utils';
import MovieService from '@/services/MovieService';
import { MediaType, type Show } from '@/types';
import { type Metadata } from 'next';

export const revalidate = 1800; // siteConfig.revalidate

export const metadata: Metadata = {
  title: 'TV Shows',
  description: `Browse and watch the latest TV shows on ${siteConfig.name}. Discover trending TV series, popular shows, and shows by genre and streaming platform.`,
};

export default async function TvShowPage() {
  const h1 = `${siteConfig.name} TV Shows`;
  const requests: ShowRequest[] = [
    {
      title: 'Trending Now',
      req: { requestType: RequestType.TRENDING, mediaType: MediaType.TV },
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
      title: 'Popular',
      req: {
        requestType: RequestType.TOP_RATED,
        mediaType: MediaType.TV,
        genre: Genre.FAMILY,
      },
      visible: true,
    },
    {
      title: 'Comedy TV Shows',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.TV,
        genre: Genre.COMEDY,
      },
      visible: true,
    },
    {
      title: 'Action TV Shows',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.TV,
        genre: Genre.ACTION_ADVENTURE,
      },
      visible: true,
    },
    {
      title: 'Drama TV Shows',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.TV,
        genre: Genre.DRAMA,
      },
      visible: true,
    },
    {
      title: 'Scary TV Shows',
      req: {
        requestType: RequestType.GENRE,
        mediaType: MediaType.TV,
        genre: Genre.THRILLER,
      },
      visible: true,
    },
    {
      title: 'Indian TV Shows - Netflix',
      req: {
        requestType: RequestType.INDIAN_TV_NETFLIX,
        mediaType: MediaType.TV,
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
      title: 'Indian TV Shows - Disney+ Hotstar',
      req: {
        requestType: RequestType.INDIAN_TV_DISNEY_HOTSTAR,
        mediaType: MediaType.TV,
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
