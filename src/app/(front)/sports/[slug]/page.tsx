import { type Metadata } from 'next';
import { handleMetadata } from '@/lib/metadata';
import MoviePage from '../page';
type Props = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = props.params;
  return handleMetadata(params.slug, 'movies', 'movie');
}

export default async function Page() {
  return <MoviePage />;
}
