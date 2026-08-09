import { siteConfig } from '@/configs/site';
import { env } from '@/env';
import MovieService from '@/services/tmdb/movie.service';
import {
  type KeyWord,
  type KeyWordResponse,
  type Show,
} from '@/services/tmdb/types';
import { type AxiosResponse } from 'axios';
import { cache } from 'react';
import { getIdFromSlug, getNameFromShow } from './slug';

export const handleMetadata = cache(
  async (slug: string, page: string, type: 'tv' | 'movie') => {
    const mediaId: number = getIdFromSlug(slug);
    let keywords: string[] = [];
    let data: Show | null = null;
    try {
      const response: AxiosResponse<Show> =
        'tv' === type
          ? await MovieService.findTvSeries(mediaId)
          : await MovieService.findMovie(mediaId);
      data = response.data;
      const keywordResponse: AxiosResponse<KeyWordResponse> =
        await MovieService.getKeywords(mediaId, type);
      const res =
        type === 'tv'
          ? keywordResponse.data.results
          : keywordResponse.data.keywords;
      keywords = res.map((item: KeyWord) => item.name).filter(Boolean);
    } catch (error) {
      console.error(error);
    }

    return {
      description: data?.overview,
      title: getNameFromShow(data),
      keywords: [
        ...keywords,
        slug.replace(`-${mediaId}`, ''),
        env.NEXT_PUBLIC_SITE_NAME || 'TuneBox',
      ].filter(Boolean),
      openGraph: {
        type: 'website',
        locale: 'en_US',
        url: `${siteConfig.url}/${page}/${slug}`,
        images: `https://image.tmdb.org/t/p/original${data?.backdrop_path ?? data?.poster_path ?? ''
          }`,
        title: getNameFromShow(data),
        description: data?.overview ?? '',
        siteName: siteConfig.name || 'TuneBox',
      },
      twitter: {
        card: 'summary_large_image',
        title: getNameFromShow(data),
        description: data?.overview ?? '',
        images: `https://image.tmdb.org/t/p/original${data?.backdrop_path ?? data?.poster_path ?? ''
          }`,
        creator: siteConfig.author,
      },
    };
  },
);

export async function handleModal(slug: string): Promise<Show | null> {
  if (!slug) return null;
  const mediaId: number = getIdFromSlug(slug);
  if (!mediaId) return null;
  return MovieService.findCurrentMovie(mediaId, slug);
}
