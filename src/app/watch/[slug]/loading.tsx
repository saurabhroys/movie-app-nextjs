import { Icons } from '@/components/shared/icons';

export default function WatchLoading() {
  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-black gap-3 text-neutral-400">
      <Icons.logo className="h-8 w-8 animate-pulse" aria-hidden="true" />
      <span className="text-sm">Loading player…</span>
    </div>
  );
}
