'use client';

import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';
import ModalCloser from '@/components/modal-closer';

const HoverModal = dynamic(() => import('@/features/modals/hover-modal'), { ssr: false });
const PreviewModal = dynamic(() => import('@/features/modals/preview-modal'), { ssr: false });

const Modals = () => (
  <>
    <Suspense fallback={null}>
      <ModalCloser />
    </Suspense>
    <HoverModal />
    <PreviewModal />
  </>
);

export default Modals;
