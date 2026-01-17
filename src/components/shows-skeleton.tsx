import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useSearchStore } from '@/stores/search';

interface ShowsSkeletonProps {
  count?: number;
  classname?: string;
  // Default to grid to maintain backward compatibility for now, 
  // but we can switch 'mode' based on variant if needed or explicit prop.
  mode?: 'grid' | 'carousel'; 
  withTitle?: boolean;
  gridClassName?: string;
}

const ShowsSkeleton = ({
  count = 6,
  classname = '',
  // Default to grid to maintain backward compatibility for now, 
  // but we can switch 'mode' based on variant if needed or explicit prop.
  mode = 'grid', 
  withTitle = true,
  gridClassName,
}: ShowsSkeletonProps) => {
  const searchStore = useSearchStore();

  return (
    <>
      {mode === 'grid' ? (
        <div
          className={cn(
            'no-scrollbar container mx-0 w-full overflow-x-auto overflow-y-hidden',
            classname,
          )}>
          {withTitle && <Skeleton className="mb-2.5 h-[1.62rem] w-28 rounded bg-neutral-700" />}
          <div
            className={cn(
              'xxs:grid-cols-1 xxs:gap-x-1.5 xxs:gap-y-5 xs:grid-cols-2 xs:gap-y-7 grid w-full gap-y-3.5 sm:grid-cols-2 sm:gap-y-10 md:grid-cols-4 md:gap-y-12 lg:gap-y-14 xl:grid-cols-6 xl:gap-y-16',
              searchStore.query && 'max-[375px]:grid-cols-1 max-sm:grid-cols-2',
              gridClassName 
            )}
          >
            {Array.from({ length: count }, (_, i) => (
              <div key={i}>
                <Skeleton className="aspect-video w-full rounded-lg bg-neutral-700" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <section className={cn("relative my-[3vw] p-0", classname)}>
             {withTitle && <Skeleton className="mb-2.5 mx-[4%] h-[1.62rem] w-36 rounded bg-neutral-700 2xl:px-[60px]" />}
             <div className="no-scrollbar m-0 grid auto-cols-[calc(100%/3)] grid-flow-col overflow-x-auto px-[4%] py-0 sm:auto-cols-[25%] lg:auto-cols-[20%] xl:auto-cols-[calc(100%/6)] 2xl:px-[60px]"
             >
             {Array.from({ length: count }, (_, i) => (
                <div key={i} className="px-1">
                   <Skeleton className="aspect-video w-full rounded-lg bg-neutral-700" />
                </div>
              ))}
             </div>
        </section>
      )}
    </>
  );
};

export default ShowsSkeleton;
