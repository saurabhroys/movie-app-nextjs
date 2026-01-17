import { Skeleton } from '@/components/ui/skeleton';
import ShowsSkeleton from '@/components/shows-skeleton';

export default function WatchSkeleton() {
  return (
    <div className="min-h-screen w-screen bg-black pt-5">
      <div className="flex w-full grid-cols-17 flex-col gap-3 md:grid">
        {/* Player Skeleton */}
        <div className="w-full md:col-span-12 md:ml-2">
          <Skeleton className="h-80 w-full rounded-xl border border-neutral-700 bg-neutral-800 md:h-160" />
        </div>

        {/* Sidebar/Episodes Skeleton */}
        <div className="mt-3 h-140 w-full rounded-xl border border-neutral-700 p-1 pt-2 md:col-span-5 md:mt-0 md:mr-2 md:h-160">
          <div className="flex h-full flex-col gap-4 p-2">
            <Skeleton className="h-10 w-full rounded bg-neutral-800" />
            <div className="space-y-2 overflow-hidden">
               {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded bg-neutral-800" />
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Skeleton */}
      <div className="relative z-10 mt-10 bg-linear-to-t from-black via-black/80 to-transparent p-4">
        <Skeleton className="mb-4 h-8 w-48 rounded bg-neutral-800" />
        <ShowsSkeleton 
            mode="grid" 
            withTitle={false} 
            gridClassName="xs:grid-cols-2 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        />
      </div>
    </div>
  );
}
