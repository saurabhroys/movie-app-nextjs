import SearchContainer from '@/components/search-container';
import MovieService from '@/services/MovieService';
import { redirect } from 'next/navigation';

interface SearchProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export const revalidate = 3600;

export default async function SearchPage(props: SearchProps) {
  const searchParams = await props.searchParams;
  if (!searchParams?.q?.trim()?.length) {
    redirect('/home');
  }

  const shows = await MovieService.searchMovies(searchParams.q);
  return <SearchContainer query={searchParams.q} shows={shows.results} />;
}
