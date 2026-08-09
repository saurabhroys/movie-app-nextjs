import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Show } from '@/services/tmdb/types';
import type { DetailedShowInfo } from '@/redux/features/modals/detail-fetch-helper';

export interface PreviewModalState {
  isOpen: boolean;
  firstLoad: boolean;
  show: Show | null;
  detailedShow: DetailedShowInfo | null;
  isLoading: boolean;
  play: boolean;
}

const initialState: PreviewModalState = {
  isOpen: false,
  firstLoad: false,
  show: null,
  detailedShow: null,
  isLoading: false,
  play: false,
};

const previewModalSlice = createSlice({
  name: 'previewModal',
  initialState,
  reducers: {
    setIsOpen(state, action: PayloadAction<boolean>) {
      state.isOpen = action.payload;
    },
    setFirstLoad(state, action: PayloadAction<boolean>) {
      state.firstLoad = action.payload;
    },
    setShow(state, action: PayloadAction<Show | null>) {
      state.show = action.payload;
    },
    setDetailedShow(state, action: PayloadAction<DetailedShowInfo | null>) {
      state.detailedShow = action.payload;
    },
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setPlay(state, action: PayloadAction<boolean>) {
      state.play = action.payload;
    },
    reset(state) {
      state.show = null;
      state.detailedShow = null;
      state.isOpen = false;
      state.play = false;
      state.firstLoad = false;
      state.isLoading = false;
    },
    openPreviewModal(
      state,
      action: PayloadAction<{ show: Show | null; play: boolean }>,
    ) {
      state.show = action.payload.show;
      state.isOpen = true;
      state.play = action.payload.play;
    },
  },
});

export const {
  setIsOpen,
  setFirstLoad,
  setShow,
  setDetailedShow,
  setIsLoading,
  setPlay,
  reset,
  openPreviewModal,
} = previewModalSlice.actions;

export default previewModalSlice.reducer;
