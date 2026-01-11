import SearchContainer from '@/components/search-container';
import { siteConfig } from '@/configs/site';
import SearchService from '@/services/SearchService';
import { redirect } from 'next/navigation';

interface SearchProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export const revalidate = 1800; // siteConfig.revalidate

export default async function SearchPage(props: SearchProps) {
  const searchParams = await props.searchParams;
  if (!searchParams?.q?.trim()?.length) {
    redirect('/');
  }

  const { results } = await SearchService.searchMovies(searchParams.q);
  return <SearchContainer query={searchParams.q} shows={results} />;
}
