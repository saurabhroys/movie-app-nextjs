import { observable } from '@legendapp/state';

export interface SearchState {
  query: string;
  isOpen: boolean;
}

const initialState: SearchState = {
  query: '',
  isOpen: false,
};

export const search$ = observable<SearchState>(initialState);

export const searchActions = {
  setQuery: (query: string) => search$.query.set(query),
  setIsOpen: (isOpen: boolean) => search$.isOpen.set(isOpen),
  reset: () => search$.set({ ...initialState }),
};
