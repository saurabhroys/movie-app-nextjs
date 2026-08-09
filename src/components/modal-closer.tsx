'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { reset } from '@/features/modals/previewModalSlice';

const ModalCloser = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Close any open modals when this component mounts (page loads)
    dispatch(reset());
  }, [dispatch]);

  return null; // This component doesn't render anything
};

export default ModalCloser;
