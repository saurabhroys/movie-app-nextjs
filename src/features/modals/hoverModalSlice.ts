import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Show } from '@/services/tmdb/types';
import type { DetailedShowInfo } from '@/redux/features/modals/detail-fetch-helper';

export interface SerializedRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface HoverModalState {
  show: Show | null;
  detailedShow: DetailedShowInfo | null;
  isOpen: boolean;
  anchorRect: SerializedRect | null;
  isActive: boolean;
  isLoading: boolean;
}

const initialState: HoverModalState = {
  show: null,
  detailedShow: null,
  isOpen: false,
  anchorRect: null,
  isActive: false,
  isLoading: false,
};

const hoverModalSlice = createSlice({
  name: 'hoverModal',
  initialState,
  reducers: {
    setShow(state, action: PayloadAction<Show | null>) {
      state.show = action.payload;
    },
    setDetailedShow(state, action: PayloadAction<DetailedShowInfo | null>) {
      state.detailedShow = action.payload;
    },
    setIsOpen(state, action: PayloadAction<boolean>) {
      state.isOpen = action.payload;
    },
    setAnchorRect(state, action: PayloadAction<SerializedRect | null>) {
      state.anchorRect = action.payload;
    },
    setIsActive(state, action: PayloadAction<boolean>) {
      state.isActive = action.payload;
    },
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    reset(state) {
      state.show = null;
      state.detailedShow = null;
      state.isOpen = false;
      state.isActive = false;
      state.anchorRect = null;
      state.isLoading = false;
    },
    openHoverPreview(
      state,
      action: PayloadAction<{ show: Show; rect: SerializedRect }>,
    ) {
      state.show = action.payload.show;
      state.anchorRect = action.payload.rect;
      state.isOpen = true;
      state.isActive = true;
    },
  },
});

export const {
  setShow,
  setDetailedShow,
  setIsOpen,
  setAnchorRect,
  setIsActive,
  setIsLoading,
  reset,
  openHoverPreview,
} = hoverModalSlice.actions;

export default hoverModalSlice.reducer;
