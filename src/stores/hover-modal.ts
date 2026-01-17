import { create } from 'zustand';
import type { Show, ShowWithGenreAndVideo, KeyWord } from '@/types';
import MovieService from '@/services/MovieService';
import { MediaType } from '@/types';

interface DetailedPreviewShow extends Omit<ShowWithGenreAndVideo, 'keywords'> {
  contentRating?: string | null;
  logoPath?: string | null;
  keywords?: KeyWord[];
}

interface PreviewModalState {
  show: Show | null;
  setShow: (show: Show | null) => void;
  detailedShow: DetailedPreviewShow | null;
  setDetailedShow: (detailedShow: DetailedPreviewShow | null) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  anchorRect: DOMRect | null;
  setAnchorRect: (rect: DOMRect | null) => void;
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  reset: () => void;
  
  // Actions
  fetchPreviewData: (id: number, type: string) => Promise<void>;
}

export const useHoverModalStore = create<PreviewModalState>()((set) => ({
  show: null,
  setShow: (show: Show | null) => set(() => ({ show })),
  detailedShow: null,
  setDetailedShow: (detailedShow: DetailedPreviewShow | null) => set(() => ({ detailedShow })),
  isOpen: false,
  setIsOpen: (isOpen: boolean) => set(() => ({ isOpen })),
  anchorRect: null,
  setAnchorRect: (rect: DOMRect | null) => set(() => ({ anchorRect: rect })),
  isActive: false,
  setIsActive: (isActive: boolean) => set(() => ({ isActive })),
  isLoading: false,
  setIsLoading: (isLoading: boolean) => set(() => ({ isLoading })),
  
  fetchPreviewData: async (id: number, type: string) => {
    set({ isLoading: true });
    try {
      let currentType = type;
      let data: DetailedPreviewShow;

      try {
        // Try Hindi trailer first, fallback to English
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

      const effectiveType = currentType;

      // Fetch content rating
      let rating: string | null = null;
      try {
        if (effectiveType === 'tv') {
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
        const { data: imageData } = await MovieService.getImages(effectiveType as any, id);
        const preferred = imageData.logos?.find((l: any) => l.iso_639_1 === 'en') ?? imageData.logos?.[0];
        data.logoPath = preferred ? preferred.file_path : null;
      } catch (e) {}

      set({ detailedShow: data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch preview data:', error);
      set({ isLoading: false });
    }
  },

  reset: () => set(() => ({ 
    show: null, 
    detailedShow: null,
    isOpen: false, 
    isActive: false,
    anchorRect: null,
    isLoading: false
  })),
}));
