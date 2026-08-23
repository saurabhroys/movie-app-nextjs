'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { previewModalActions } from '@/state/preview-modal';
import { hoverModalActions } from '@/state/hover-modal';

const ModalCloser = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Close open modals on route navigation
    previewModalActions.reset();
    hoverModalActions.reset();
  }, [pathname]);

  return null; // This component doesn't render anything
};

export default ModalCloser;
