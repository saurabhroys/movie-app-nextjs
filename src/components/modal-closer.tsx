'use client';

import { useEffect } from 'react';
import { useModalStore } from '@/stores/modal';

const ModalCloser = () => {
  const reset = useModalStore((state) => state.reset);

  useEffect(() => {
    // Close any open modals when this component mounts (page loads)
    reset();
  }, [reset]);

  return null; // This component doesn't render anything
};

export default ModalCloser;
