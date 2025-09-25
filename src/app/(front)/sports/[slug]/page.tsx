import { type Metadata } from 'next';
import { handleMetadata } from '@/lib/utils';
import MoviePage from '../page';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Record<string, string | string[] | undefined>;
};

export const revalidate = 3600;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  return handleMetadata(params.slug, 'movies', 'movie');
}

export default async function Home() {
  return MoviePage();
}
