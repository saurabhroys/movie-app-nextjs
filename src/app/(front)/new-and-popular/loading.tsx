'use client';

import HeroSkeleton from '@/features/browse/hero-skeleton';
import ShowsSkeleton from '@/features/browse/shows-skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-black">
      <HeroSkeleton />
      <div className="flex flex-col gap-8 pb-10">
        <ShowsSkeleton mode="carousel" count={6} />
        <ShowsSkeleton mode="carousel" count={6} />
        <ShowsSkeleton mode="carousel" count={6} />
      </div>
    </div>
  );
}
