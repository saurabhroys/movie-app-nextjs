import { type Metadata } from 'next';
import { handleMetadata } from '@/lib/utils';
import TvShowPage from '../page';
import { siteConfig } from '@/configs/site';
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const revalidate = siteConfig.revalidate;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  return handleMetadata(params.slug, 'tv-shows', 'tv');
}

export default async function Page() {
  return <TvShowPage />;
}
