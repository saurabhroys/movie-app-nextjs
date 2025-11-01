'use client';

import ShowsSkeleton from '@/components/shows-skeleton';

export default function Loading() {
  return (
    <div className="mt-4 min-h-[800px] pt-[5%]">
      <ShowsSkeleton count={6} variant="with-title" />
    </div>
  );
}

