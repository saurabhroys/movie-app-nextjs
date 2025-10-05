import SearchContainer from '@/components/search-container';
import SearchService from '@/services/SearchService';
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

  const { results } = await SearchService.searchMovies(searchParams.q);
  return <SearchContainer query={searchParams.q} shows={results} />;
}
