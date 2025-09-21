import { create } from 'zustand';

interface PreviewModalState {
  cardPosition: { x: number; y: number; width: number; height: number } | null;
  setCardPosition: (position: { x: number; y: number; width: number; height: number } | null) => void;
  reset: () => void;
}

export const usePreviewModalStore = create<PreviewModalState>()((set) => ({
  cardPosition: null,
  setCardPosition: (position: { x: number; y: number; width: number; height: number } | null) => 
    set(() => ({ cardPosition: position })),
  reset: () => set(() => ({ cardPosition: null })),
}));
