import SearchContainer from '@/components/search-container';
import { siteConfig } from '@/configs/site';
import SearchService from '@/services/SearchService';
import { redirect } from 'next/navigation';
import { cacheLife } from 'next/cache';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q : '';

  if (!query.trim().length) {
    redirect('/');
  }

  return <CachedSearch query={query} />;
}

async function CachedSearch({ query }: { query: string }) {
  'use cache';
  cacheLife('show');
  const { results } = await SearchService.searchMovies(query);
  return <SearchContainer query={query} shows={results} />;
}
