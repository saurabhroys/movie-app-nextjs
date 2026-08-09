'use client';

import dynamic from 'next/dynamic';

const HoverModal = dynamic(() => import('@/features/modals/hover-modal'), { ssr: false });
const PreviewModal = dynamic(() => import('@/features/modals/preview-modal'), { ssr: false });

const Modals = () => (
  <>
    <HoverModal />
    <PreviewModal />
  </>
);

export default Modals;
