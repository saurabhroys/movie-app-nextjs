import { env } from '@/env';
import { type CategorizedShows, type Show } from '@/services/tmdb/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getYear(input: string | number): number {
  const date = new Date(input);
  return date.getFullYear();
}

export function absoluteUrl(path: string) {
  return `${env.NEXT_PUBLIC_APP_URL}${path}`;
}

export function formatEnum(input: string): string {
  const words = input.split('_');
  const capitalizedWords = words.map((word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  return capitalizedWords.join(' ');
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  timeout: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), timeout);
  };
}

export function getMobileDetect(userAgent: NavigatorID['userAgent']) {
  const isAndroid = () => Boolean(userAgent.match(/Android/i));
  const isIos = () => Boolean(userAgent.match(/iPhone|iPad|iPod/i));
  const isOpera = () => Boolean(userAgent.match(/Opera Mini/i));
  const isWindows = () => Boolean(userAgent.match(/IEMobile/i));
  const isSSR = () => Boolean(userAgent.match(/SSR/i));
  const isMobile = () =>
    Boolean(isAndroid() || isIos() || isOpera() || isWindows());
  const isDesktop = () => Boolean(!isMobile() && !isSSR());
  return {
    isMobile,
    isDesktop,
    isAndroid,
    isIos,
    isSSR,
  };
}

export function getRandomShow(allShows: CategorizedShows[]): Show | null {
  if (!allShows?.length) return null;

  // Flatten all shows from all categories
  const allShowsFlat = allShows
    .filter((category) => category.shows?.length > 0)
    .flatMap((category) => category.shows);

  if (!allShowsFlat.length) return null;

  // Select a random show from all available shows
  const randomNumber = Math.floor(Math.random() * allShowsFlat.length);
  return allShowsFlat[randomNumber];
}

/**
 * Check if a show has valid images (backdrop or poster)
 */
export function hasValidImage(show: Show): boolean {
  return !!(show.backdrop_path || show.poster_path);
}

/**
 * Filter shows to only include those with valid images
 */
export function filterShowsWithImages(shows: Show[]): Show[] {
  return shows.filter(hasValidImage);
}
