import { type Metadata } from 'next';
import { handleMetadata } from '@/lib/utils';
import MoviePage from '../page';
import { siteConfig } from '@/configs/site';
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = 1800; // siteConfig.revalidate

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  return handleMetadata(params.slug, 'movies', 'movie');
}

export default async function Page() {
  return <MoviePage />;
}
