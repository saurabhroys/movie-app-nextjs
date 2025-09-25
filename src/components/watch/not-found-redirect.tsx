'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icons } from '../icons';

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.back();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center text-neutral-400">
        <span className="text-4xl mb-4 block">
          {/* <Icons.logo className="h-6 w-6" aria-hidden="true" /> */}
        </span>
        <span>Not Found possible Not Released Yet</span>
        <div className="mt-4 text-sm">
          Redirecting back in {countdown} seconds...
        </div>
      </div>
    </div>
  );
}
