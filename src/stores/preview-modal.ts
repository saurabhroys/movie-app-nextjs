import type { Show, ShowWithGenreAndVideo, KeyWord, Genre, VideoResult, Logo } from '@/types';
import { create } from 'zustand';
import MovieService from '@/services/MovieService';
import { MediaType } from '@/types';

interface DetailedShowInfo extends Omit<ShowWithGenreAndVideo, 'keywords'> {
  cast?: any[];
  directors?: string[];
  writers?: string[];
  recommendations?: Show[];
  contentRating?: string | null;
  logoPath?: string | null;
  keywords?: KeyWord[];
  collection?: any;
  recommendedLogos?: Record<number, string | null>;
  recommendedDetails?: Record<number, { runtime: number | null; number_of_seasons: number | null }>;
}

interface ModalState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  firstLoad: boolean;
  setFirstLoad: (firstLoad: boolean) => void;
  show: Show | null;
  setShow: (show: Show | null) => void;
  detailedShow: DetailedShowInfo | null;
  setDetailedShow: (detailedShow: DetailedShowInfo | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  play: boolean;
  setPlay: (play: boolean) => void;
  reset: () => void;
  
  // Actions
  fetchDetailedShow: (id: number, type: MediaType) => Promise<void>;
}

export const usePreviewModalStore = create<ModalState>()((set, get) => ({
  isOpen: false,
  setIsOpen: (isOpen: boolean) => set(() => ({ isOpen })),
  firstLoad: false,
  setFirstLoad: (firstLoad: boolean) => set(() => ({ firstLoad })),
  show: null,
  setShow: (show: Show | null) => set(() => ({ show })),
  detailedShow: null,
  setDetailedShow: (detailedShow: DetailedShowInfo | null) => set(() => ({ detailedShow })),
  isLoading: false,
  setIsLoading: (isLoading: boolean) => set(() => ({ isLoading })),
  play: false,
  setPlay: (play: boolean) => set(() => ({ play })),
  
  fetchDetailedShow: async (id: number, mediaType: MediaType) => {
    set({ isLoading: true });
    try {
      let currentType = mediaType === MediaType.TV ? 'tv' : 'movie';
      let data: DetailedShowInfo;

      try {
        // Fetch basic details with trailer
        data = (await MovieService.findMovieByIdAndType(
          id,
          currentType,
          'hi-IN',
        )) as any;
        if (!data.videos?.results?.length) {
          data = (await MovieService.findMovieByIdAndType(id, currentType, 'en-US')) as any;
        }
      } catch (error: any) {
        // If 404, try the other media type
        if (error?.response?.status === 404) {
          currentType = currentType === 'tv' ? 'movie' : 'tv';
          // Update mediaType for subsequent logic in this function
          mediaType = currentType === 'tv' ? MediaType.TV : MediaType.MOVIE;
          
          data = (await MovieService.findMovieByIdAndType(
            id,
            currentType,
            'hi-IN',
          )) as any;
          if (!data.videos?.results?.length) {
            data = (await MovieService.findMovieByIdAndType(id, currentType, 'en-US')) as any;
          }
        } else {
          throw error;
        }
      }

      const type = currentType;

      // Fetch content rating
      let rating: string | null = null;
      try {
        if (mediaType === MediaType.TV) {
          const { data: ratingData }: any = await MovieService.getContentRating('tv', id);
          const results = ratingData?.results ?? [];
          const prefOrder = ['RU', 'UA', 'LV', 'TW'];
          for (const cc of prefOrder) {
            const match = results.find((r: any) => r?.iso_3166_1 === cc);
            if (match?.rating || match?.certification) {
              rating = String(match.rating ?? match.certification).trim();
              break;
            }
          }
        } else {
          const { data: ratingData }: any = await MovieService.getMovieReleaseDates(id);
          const countries = ratingData?.results ?? [];
          const prefOrder = ['RU', 'UA', 'LV', 'TW'];
          for (const cc of prefOrder) {
            const country = countries.find((c: any) => c?.iso_3166_1 === cc);
            const releases = country?.release_dates ?? [];
            const match = releases.find((rd: any) => rd.certification?.trim());
            if (match) {
              rating = match.certification.trim();
              break;
            }
          }
        }
      } catch (e) {}
      data.contentRating = rating;

      // Fetch logo
      try {
        const { data: imageData } = await MovieService.getImages(type as any, id);
        const preferred = imageData.logos?.find((l: Logo) => l.iso_639_1 === 'en') ?? imageData.logos?.[0];
        data.logoPath = preferred ? preferred.file_path : null;
      } catch (e) {}

      // Fetch credits
      try {
        const { data: credits } = await MovieService.getCredits(type, id);
        data.cast = credits?.cast?.slice(0, 10);
        data.directors = credits?.crew?.filter((c: any) => c?.job === 'Director').map((c: any) => String(c.name));
        data.writers = credits?.crew?.filter((c: any) => ['Writer', 'Screenplay', 'Story', 'Teleplay'].includes(c?.job)).map((c: any) => String(c.name));
      } catch (e) {}

      // Fetch recommendations
      try {
        const primary = mediaType === MediaType.TV
          ? await MovieService.getTvRecommendations(id)
          : await MovieService.getMovieRecommendations(id);
        let results = (primary as any)?.results ?? (primary as any)?.data?.results ?? [];
        if (!results?.length) {
          const fallback = mediaType === MediaType.TV
            ? await MovieService.getSimilarTvShows(id)
            : await MovieService.getSimilarMovies(id);
          results = (fallback as any)?.results ?? (fallback as any)?.data?.results ?? [];
        }
        data.recommendations = results;
      } catch (e) {}

      const keywordsData: any = (data as any)?.keywords?.results || (data as any)?.keywords?.keywords;
      data.keywords = keywordsData;

      // Fetch collection
      if (mediaType === MediaType.MOVIE && data.belongs_to_collection) {
        try {
          const collectionData = await MovieService.getMovieCollection(data.belongs_to_collection.id);
          data.collection = collectionData;
        } catch (e) {}
      }

      // Fetch logos and details for recommendations
      if (data.recommendations?.length) {
        const topRecs = data.recommendations.slice(0, 12);
        
        // Parallel fetch logos
        const logoPromises = topRecs.map(async (s) => {
          try {
            const { data: imgData } = await MovieService.getImages(
              s.media_type === MediaType.TV ? 'tv' : 'movie',
              s.id
            );
            const logo = imgData.logos?.find(l => l.iso_639_1 === 'en')?.file_path ?? imgData.logos?.[0]?.file_path;
            return [s.id, logo] as [number, string | undefined];
          } catch { return [s.id, undefined] as [number, string | undefined]; }
        });

        // Parallel fetch details
        const detailPromises = topRecs.map(async (s) => {
          try {
            const res = await MovieService.findMovieByIdAndType(
              s.id,
              s.media_type === MediaType.TV ? 'tv' : 'movie',
              'en-US'
            );
            return [s.id, {
              runtime: res.runtime,
              number_of_seasons: res.number_of_seasons
            }] as [number, any];
          } catch { return [s.id, { runtime: null, number_of_seasons: null }] as [number, any]; }
        });

        const logos = await Promise.all(logoPromises);
        const details = await Promise.all(detailPromises);

        data.recommendedLogos = Object.fromEntries(logos.filter(([, l]) => l)) as any;
        data.recommendedDetails = Object.fromEntries(details) as any;
      }

      set({ detailedShow: data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch detailed show info:', error);
      set({ isLoading: false });
    }
  },

  reset: () =>
    set(() => ({
      show: null,
      detailedShow: null,
      isOpen: false,
      play: false,
      firstLoad: false,
      isLoading: false,
    })),
}));
