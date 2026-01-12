import { type Metadata } from 'next';
import { handleMetadata } from '@/lib/utils';
import MoviePage from '../page';
import { siteConfig } from '@/configs/site';
type Props = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

import { cacheLife } from 'next/cache'; // siteConfig

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = props.params;
  return handleMetadata(params.slug, 'movies', 'movie');
}

export default async function Page() {
  return <MoviePage />;
}
