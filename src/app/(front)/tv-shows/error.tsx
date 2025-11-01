'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('TV Shows page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h2 className="mb-4 text-2xl font-semibold">Failed to load TV shows</h2>
      <p className="mb-4 text-muted-foreground">
        {error.message || 'Unable to fetch TV shows. Please try again.'}
      </p>
      <Button onClick={reset} variant="default">
        Try again
      </Button>
    </div>
  );
}

