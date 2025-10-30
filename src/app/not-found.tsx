import Link from 'next/link';
import { Icons } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="mb-8">
          <Icons.logo_long className="mx-auto mb-4 h-auto w-24 text-neutral-800" />
          <h1 className="mb-4 text-6xl font-bold text-white">404</h1>
          <h2 className="mb-2 text-2xl font-semibold text-neutral-300">
            Page Not Found
          </h2>
          <p className="mx-auto mb-8 max-w-md text-neutral-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-white transition-colors hover:bg-red-700">
            <Icons.logo_long className="h-auto w-7" />
            Go Home
          </Link>

          <div className="text-sm text-neutral-500">
            <Link
              href="/movies"
              className="mr-4 transition-colors hover:text-white">
              Movies
            </Link>
            <Link
              href="/tv-shows"
              className="mr-4 transition-colors hover:text-white">
              TV Shows
            </Link>
            <Link href="/anime" className="transition-colors hover:text-white">
              Anime
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
