import type { Show, ShowWithGenreAndVideo, KeyWord, Logo } from '@/types';
import { create } from 'zustand';
import MovieService from '@/services/MovieService';
import { MediaType } from '@/types';

interface CastMember {
  id: number;
  name: string;
}

interface MovieCollection {
  id: number;
  name: string;
  parts?: {
    id: number;
    title: string;
    overview: string | null;
    poster_path: string | null;
    release_date: string | null;
  }[];
}

interface DetailedShowInfo extends Omit<ShowWithGenreAndVideo, 'keywords'> {
  cast?: CastMember[];
  directors?: string[];
  writers?: string[];
  recommendations?: Show[];
  contentRating?: string | null;
  logoPath?: string | null;
  keywords?: KeyWord[];
  collection?: MovieCollection;
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
        )) as unknown as DetailedShowInfo;
        if (!data.videos?.results?.length) {
          data = (await MovieService.findMovieByIdAndType(id, currentType, 'en-US')) as unknown as DetailedShowInfo;
        }
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };
        // If 404, try the other media type
        if (err?.response?.status === 404) {
          currentType = currentType === 'tv' ? 'movie' : 'tv';
          // Update mediaType for subsequent logic in this function
          mediaType = currentType === 'tv' ? MediaType.TV : MediaType.MOVIE;
          
          // Update the show's media_type in the store
          const currentShow = get().show;
          if (currentShow) {
            set({ show: { ...currentShow, media_type: mediaType } });
          }

          data = (await MovieService.findMovieByIdAndType(
            id,
            currentType,
            'hi-IN',
          )) as unknown as DetailedShowInfo;
          if (!data.videos?.results?.length) {
            data = (await MovieService.findMovieByIdAndType(id, currentType, 'en-US')) as unknown as DetailedShowInfo;
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
        const { data: imageData } = await MovieService.getImages(type as 'movie' | 'tv', id);
        const preferred = imageData.logos?.find((l: Logo) => l.iso_639_1 === 'en') ?? imageData.logos?.[0];
        data.logoPath = preferred ? preferred.file_path : null;
      } catch {}

      // Fetch credits
      try {
        interface CrewMember {
          job?: string;
          name?: string;
        }
        const { data: credits } = await MovieService.getCredits(type, id);
        if (credits?.cast) {
          const cast = credits.cast as { id: number; name: string }[];
          data.cast = cast.slice(0, 10).map((actor) => ({
            id: Number(actor.id),
            name: String(actor.name),
          }));
        }
        const crew = credits?.crew as CrewMember[] | undefined;
        data.directors = crew?.filter((c) => c?.job === 'Director').map((c) => String(c.name));
        data.writers = crew?.filter((c) => ['Writer', 'Screenplay', 'Story', 'Teleplay'].includes(c?.job || '')).map((c) => String(c.name));
      } catch {}

      // Fetch recommendations
      try {
        const primary = mediaType === MediaType.TV
          ? await MovieService.getTvRecommendations(id)
          : await MovieService.getMovieRecommendations(id);
        let results = primary?.results ?? [];
        if (!results?.length) {
          const fallback = mediaType === MediaType.TV
            ? await MovieService.getSimilarTvShows(id)
            : await MovieService.getSimilarMovies(id);
          results = fallback?.results ?? [];
        }
        data.recommendations = results;
      } catch {}

      const rawShow = data as unknown as Show;
      const keywordsData = rawShow?.keywords?.results || rawShow?.keywords?.keywords;
      data.keywords = keywordsData;

      // Fetch collection
      if (mediaType === MediaType.MOVIE && data.belongs_to_collection) {
        try {
          const collectionData = await MovieService.getMovieCollection(data.belongs_to_collection.id);
          data.collection = collectionData as MovieCollection;
        } catch {}
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
            }] as [number, { runtime: number | null; number_of_seasons: number | null }];
          } catch { return [s.id, { runtime: null, number_of_seasons: null }] as [number, { runtime: number | null; number_of_seasons: number | null }]; }
        });

        const logos = await Promise.all(logoPromises);
        const details = await Promise.all(detailPromises);

        data.recommendedLogos = Object.fromEntries(logos.filter(([, l]) => l)) as Record<number, string | null>;
        data.recommendedDetails = Object.fromEntries(details) as Record<number, { runtime: number | null; number_of_seasons: number | null }>;
      }

      data.media_type = mediaType;
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
