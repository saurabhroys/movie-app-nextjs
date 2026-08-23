'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { previewModalActions } from '@/state/preview-modal';
import { hoverModalActions } from '@/state/hover-modal';
import { addressBar$ } from '@/state/address-bar';

const ModalCloser = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Check if the current pathname is the slug URL pushed by the preview modal
    const isModalSlug =
      addressBar$.activeSlugUrl.peek() &&
      pathname === addressBar$.activeSlugUrl.peek();

    // Close open modals on route navigation
    if (!isModalSlug) {
      previewModalActions.reset();
    }
    hoverModalActions.reset();
  }, [pathname]);

  return null; // This component doesn't render anything
};

export default ModalCloser;
