import React, { Suspense } from 'react';
import ModalCloser from '@/components/modal-closer';
import WatchContent from '@/features/watch/watch-content';
import WatchSkeleton from '@/features/watch/watch-skeleton';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; season?: string; episode?: string }>;
}

export default async function Page(props: PageProps) {
  return (
    <div className="min-h-screen w-screen bg-black">
      <ModalCloser />
      <Suspense fallback={<WatchSkeleton />}>
        <WatchContent params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
