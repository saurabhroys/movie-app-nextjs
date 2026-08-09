import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Show } from '@/services/tmdb/types';

export interface SearchState {
  query: string;
  isOpen: boolean;
  shows: Show[];
  loading: boolean;
  currentRequestId: string | null;
}

const initialState: SearchState = {
  query: '',
  isOpen: false,
  shows: [],
  loading: false,
  currentRequestId: null,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    setIsOpen(state, action: PayloadAction<boolean>) {
      state.isOpen = action.payload;
    },
    setShows(state, action: PayloadAction<Show[]>) {
      state.shows = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setCurrentRequestId(state, action: PayloadAction<string | null>) {
      state.currentRequestId = action.payload;
    },
    reset(state) {
      state.query = '';
      state.isOpen = false;
      state.shows = [];
      state.loading = false;
      state.currentRequestId = null;
    },
  },
});

export const { setQuery, setIsOpen, setShows, setLoading, setCurrentRequestId, reset } = searchSlice.actions;
export default searchSlice.reducer;
