'use client';

import ShowsSkeleton from '@/components/shows-skeleton';

export default function Loading() {
  return (
    <div className="mt-4 min-h-[800px] pt-[5%]">
      <ShowsSkeleton 
        mode="grid" 
        withTitle={false} 
        gridClassName="xxs:grid-cols-1 xxs:gap-x-1.5 xxs:gap-y-5 xs:grid-cols-2 xs:gap-y-7 grid w-full gap-y-3.5 sm:grid-cols-2 sm:gap-y-10 md:grid-cols-4 md:gap-y-12 lg:gap-y-14 xl:grid-cols-6 xl:gap-y-16"
      />
    </div>
  );
}
