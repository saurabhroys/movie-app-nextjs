import Link from 'next/link';
import { Icons } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <Icons.logo className="w-24 h-24 mx-auto text-red-600 mb-4" />
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-300 mb-2">Page Not Found</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Icons.play className="w-4 h-4" />
            Go Home
          </Link>
          
          <div className="text-sm text-gray-500">
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
