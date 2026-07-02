'use client';

import { Skeleton } from '@/components/ui/skeleton';
import ShowsSkeleton from '@/components/shows-skeleton';
import { usePathname } from 'next/navigation';

export default function WatchSkeleton() {
  const pathname = usePathname();
  const isTv = pathname?.includes('/watch/tv/');

  return (
    <div className="min-h-screen w-full bg-black overflow-x-hidden flex flex-col">
      {/* Player and Sidebar Container */}
      <div className="flex w-full grid-cols-17 flex-col gap-3 md:grid relative">
        {/* Player Layout Skeleton */}
        <div className="w-full md:col-span-17 relative">
          <div className="relative w-full h-80 md:h-screen bg-[#060606] flex flex-col justify-between p-4 md:p-10 border-b border-neutral-900 select-none">
            {/* Top Bar */}
            <div className="flex w-full items-center justify-between z-10">
              {/* Back Arrow */}
              <div className="flex items-center">
                <svg
                  className="h-8 w-8 text-neutral-500 animate-pulse cursor-default"
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
                  />
                </svg>
              </div>

              {/* Server selector mock */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-neutral-800/80 bg-neutral-950/80 px-4 py-2 shadow-md">
                <div className="h-3 w-14 bg-neutral-700 rounded animate-pulse" />
                <div className="h-3.5 w-3.5 bg-neutral-700 rounded-full animate-pulse" />
              </div>

              {/* Settings layout alignment spacer */}
              <div className="w-8 h-8" />
            </div>

            {/* Bottom Info and Controls Area */}
            <div className="flex flex-col gap-6 w-full z-10">
              {/* Metadata Details */}
              <div className="flex flex-col gap-2.5">
                {/* Red tag line & indicator */}
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-red-600 rounded-sm" />
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider animate-pulse">
                    You're Watching
                  </span>
                </div>

                {/* Show Title */}
                <Skeleton className="h-8 w-56 md:h-12 md:w-[420px] bg-neutral-800 rounded-lg" />

                {/* Badges metadata list */}
                <div className="flex items-center gap-2 mt-1">
                  <Skeleton className="h-3.5 w-10 bg-neutral-800" />
                  <span className="text-neutral-800 text-xs">|</span>
                  <Skeleton className="h-3.5 w-20 bg-neutral-800" />
                  <span className="text-neutral-800 text-xs">|</span>
                  <Skeleton className="h-3.5 w-16 bg-neutral-800" />
                </div>
              </div>

              {/* Player Timeline Bar controls */}
              <div className="w-full flex flex-col gap-4 mt-2">
                {/* Track Slider Bar */}
                <Skeleton className="h-1 w-full bg-neutral-800 rounded-full" />

                {/* Controls and values */}
                <div className="flex items-center justify-between w-full text-neutral-500 px-1">
                  {/* Left Side: Playback and volume indicators */}
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-4 bg-neutral-700 rounded animate-pulse" />
                    <div className="h-4 w-4 bg-neutral-700 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-neutral-700 rounded animate-pulse" />
                  </div>

                  {/* Right Side: Settings & Fullscreen layout */}
                  <div className="flex items-center gap-4">
                    <div className="h-7 w-20 bg-neutral-950 border border-neutral-800/80 rounded-lg px-2 flex items-center gap-1">
                      <div className="h-3 w-3 bg-neutral-700 rounded-full animate-pulse" />
                      <div className="h-3 w-10 bg-neutral-700 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-4 bg-neutral-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar/Episodes Selector (Only for TV) */}
        {isTv && (
          <div className="w-full mt-3 rounded-xl border border-neutral-700 p-1 pt-2 md:absolute md:top-0 md:right-0 md:z-30 md:h-full md:w-80 lg:w-96 md:bg-black/90 md:border-l md:border-t-0 md:border-b-0 md:border-r-0 md:border-neutral-800 md:mt-0 md:mr-0 md:rounded-none">
            <div className="flex h-full flex-col gap-4 p-3 overflow-hidden">
              {/* Season selector tabs skeleton */}
              <div className="flex gap-2.5 pb-2">
                <Skeleton className="h-8 w-12 rounded bg-neutral-700" />
                <Skeleton className="h-8 w-12 rounded bg-neutral-700" />
              </div>
              {/* Episodes list items skeleton */}
              <div className="flex-1 space-y-2 overflow-hidden">
                 {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded bg-neutral-700" />
                 ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      <div className="relative z-10 bg-linear-to-t from-black via-black/80 to-transparent p-4 mt-10">
        <Skeleton className="mb-4 h-8 w-48 rounded bg-neutral-700" />
        <ShowsSkeleton 
            mode="grid" 
            withTitle={false} 
            gridClassName="xs:grid-cols-2 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        />
      </div>
    </div>
  );
}
