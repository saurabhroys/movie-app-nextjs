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
        )) as unknown as DetailedPreviewShow;
        if (!data.videos?.results?.length) {
          data = (await MovieService.findMovieByIdAndType(id, currentType, 'en-US')) as unknown as DetailedPreviewShow;
        }
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };
        // If 404, try the other media type
        if (err?.response?.status === 404) {
          currentType = currentType === 'tv' ? 'movie' : 'tv';
          
          // Update the show's media_type in the store
          const currentShow = useHoverModalStore.getState().show;
          if (currentShow) {
            set({
              show: {
                ...currentShow,
                media_type: currentType === 'tv' ? MediaType.TV : MediaType.MOVIE,
              },
            });
          }

          data = (await MovieService.findMovieByIdAndType(
            id,
            currentType,
            'hi-IN',
          )) as unknown as DetailedPreviewShow;
          if (!data.videos?.results?.length) {
            data = (await MovieService.findMovieByIdAndType(id, currentType, 'en-US')) as unknown as DetailedPreviewShow;
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
          interface RatingResult {
            iso_3166_1: string;
            rating?: string;
            certification?: string;
          }
          const response = await MovieService.getContentRating('tv', id);
          const ratingData = response.data as unknown as { results?: RatingResult[] };
          const results = ratingData?.results ?? [];
          const prefOrder = ['RU', 'UA', 'LV', 'TW'];
          for (const cc of prefOrder) {
            const match = results.find((r) => r?.iso_3166_1 === cc);
            if (match?.rating || match?.certification) {
              rating = String(match.rating ?? match.certification).trim();
              break;
            }
          }
        } else {
          interface ReleaseDate {
            certification?: string;
          }
          interface CountryRelease {
            iso_3166_1: string;
            release_dates?: ReleaseDate[];
          }
          const response = await MovieService.getMovieReleaseDates(id);
          const ratingData = response.data as unknown as { results?: CountryRelease[] };
          const countries = ratingData?.results ?? [];
          const prefOrder = ['RU', 'UA', 'LV', 'TW'];
          for (const cc of prefOrder) {
            const country = countries.find((c) => c?.iso_3166_1 === cc);
            const releases = country?.release_dates ?? [];
            const match = releases.find((rd) => rd.certification?.trim());
            if (match && match.certification) {
              rating = match.certification.trim();
              break;
            }
          }
        }
      } catch {}
      data.contentRating = rating;

      // Fetch logo
      try {
        const { data: imageData } = await MovieService.getImages(effectiveType as 'movie' | 'tv', id);
        const preferred = imageData.logos?.find((l) => l.iso_639_1 === 'en') ?? imageData.logos?.[0];
        data.logoPath = preferred ? preferred.file_path : null;
      } catch {}

      data.media_type = effectiveType === 'tv' ? MediaType.TV : MediaType.MOVIE;
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
