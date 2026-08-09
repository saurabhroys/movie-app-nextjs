import { Skeleton } from '@/components/ui/skeleton';

export default function HeroSkeleton() {
  return (
    <section aria-label="Hero Skeleton" className="static w-full">
      <div className="absolute inset-0 h-[100vw] w-full sm:h-[56.25vw]">
        {/* Background placeholder */}
        <div className="absolute inset-0 bg-neutral-900" />
        <Skeleton className="absolute inset-0 h-full w-full bg-neutral-800" />
        
        {/* Shadow overlays matching Hero */}
        <div className="absolute inset-0 right-[26.09%] bg-linear-to-r from-neutral-900 to-85% opacity-71" />
        <div className="absolute right-0 bottom-[-1.1px] left-0 h-[14.7vw] bg-linear-to-b from-neutral-900/0 from-30% via-neutral-900/30 via-50% to-neutral-900 to-80%" />

        {/* Content Skeleton */}
        <div className="absolute right-0 bottom-[35%] left-0 z-10 w-full pl-[4%] pb-4 md:bottom-[30%] sm:pb-0 2xl:pl-[60px]">
          <div className="flex w-[50%] flex-col justify-end gap-4 space-y-2">
            {/* Title Skeleton */}
            <Skeleton className="h-8 w-3/4 max-w-lg rounded-md bg-neutral-700 sm:h-10 md:h-12 lg:h-16" />

            {/* Meta Info Skeleton */}
            <div className="flex space-x-2">
               <Skeleton className="h-4 w-16 rounded bg-neutral-700" />
               <Skeleton className="h-4 w-24 rounded bg-neutral-700" />
            </div>

            {/* Description Skeleton */}
            <div className="hidden space-y-2 sm:block">
              <Skeleton className="h-4 w-full max-w-xl rounded bg-neutral-700" />
              <Skeleton className="h-4 w-2/3 max-w-lg rounded bg-neutral-700" />
            </div>

            {/* Buttons Skeleton */}
            <div className="mt-[1.5vw] flex w-full items-center justify-between">
              <div className="flex items-center gap-2 sm:space-x-2">
                <Skeleton className="h-10 w-24 rounded-lg bg-neutral-700 sm:w-32" />
                <Skeleton className="h-10 w-24 rounded-lg bg-neutral-700 sm:w-32" />
              </div>
              
              {/* Rating Skeleton */}
              <div className="flex flex-row items-center gap-2">
                 <Skeleton className="h-10 w-16 rounded bg-neutral-700" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative inset-0 -z-10 mb-5 pb-[60%] sm:pb-[40%]" />
    </section>
  );
}
