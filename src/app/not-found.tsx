import Link from 'next/link';
import { Icons } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <Icons.logo_long className="w-24 h-auto mx-auto text-neutral-800 mb-4" />
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-neutral-300 mb-2">Page Not Found</h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Icons.logo_long className="w-7 h-auto" />
            Go Home
          </Link>
          
          <div className="text-sm text-neutral-500">
            <Link href="/movies" className="hover:text-white transition-colors mr-4">
              Movies
            </Link>
            <Link href="/tv-shows" className="hover:text-white transition-colors mr-4">
              TV Shows
            </Link>
            <Link href="/anime" className="hover:text-white transition-colors">
              Anime
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
