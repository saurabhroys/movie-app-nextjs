import { create } from 'zustand';
import type { Show } from '@/types';

interface PreviewModalState {
  show: Show | null;
  setShow: (show: Show | null) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  anchorRect: DOMRect | null;
  setAnchorRect: (rect: DOMRect | null) => void;
  reset: () => void;
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
}

export const usePreviewModalStore = create<PreviewModalState>()((set) => ({
  show: null,
  setShow: (show: Show | null) => set(() => ({ show })),
  isOpen: false,
  setIsOpen: (isOpen: boolean) => set(() => ({ isOpen })),
  anchorRect: null,
  setAnchorRect: (rect: DOMRect | null) => set(() => ({ anchorRect: rect })),
  reset: () => set(() => ({ show: null, isOpen: false })),
  isActive: false,
  setIsActive: (isActive: boolean) => set(() => ({ isActive })),
}));
