'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/shared/icons';
import { Button } from '@/components/ui/button';

export default function WatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console (and any error reporting service wired here).
    console.error('Watch page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black px-4 text-center text-neutral-200">
      <span className="mb-4 block">
        <Icons.logo className="h-8 w-8" aria-hidden="true" />
      </span>
      <h2 className="mb-2 text-xl font-semibold">
        Something went wrong loading this player
      </h2>
      <p className="mb-6 max-w-md text-sm text-neutral-400">
        {error.message || 'An unexpected error occurred while loading the video player.'}
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
