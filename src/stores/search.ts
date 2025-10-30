import { clearSearch } from '@/lib/utils';
import type { Show } from '@/types';
import { create } from 'zustand';

interface SearchState {
  query: string;
  setQuery: (query: string) => void;
  shows: Show[];
  setShows: (shows: Show[]) => void;
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  currentRequestId: string | null;
  setCurrentRequestId: (id: string | null) => void;
  reset: () => void;
}

export const useSearchStore = create<SearchState>()((set) => ({
  query: '',
  setQuery: (query: string) => set(() => ({ query })),
  shows: [],
  setShows: (shows: Show[]) => set(() => ({ shows })),
  isOpen: false,
  setOpen: (value: boolean) => set(() => ({ isOpen: value })),
  loading: false,
  setLoading: (value: boolean) => set(() => ({ loading: value })),
  currentRequestId: null,
  setCurrentRequestId: (id: string | null) =>
    set(() => ({ currentRequestId: id })),
  reset: () =>
    set(() => {
      clearSearch();
      return { query: '', shows: [], loading: false, currentRequestId: null };
    }),
}));
