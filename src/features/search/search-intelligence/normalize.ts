/**
 * Intelligent Search Utilities — query processing
 * Normalizes and expands search queries for better matching.
 */

/**
 * Normalize a search query for better matching
 */
export function normalizeQuery(query: string): {
  normalized: string;
  keywords: string[];
  year?: number;
  mediaType?: 'movie' | 'tv';
  originalQuery: string;
  categories?: string[];
  isLatest?: boolean;
  languages?: string[];
} {
  const originalQuery = query.trim();
  let normalized = originalQuery.toLowerCase();

  // Extract year (e.g., "inception 2010" -> year: 2010)
  const yearMatch = normalized.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;
  if (year) {
    normalized = normalized.replace(/\b(19|20)\d{2}\b/, '').trim();
  }

  // Detect temporal modifiers (latest, new, recent)
  let isLatest = false;
  const temporalModifiers = ['latest', 'new', 'recent', 'recently'];
  for (const modifier of temporalModifiers) {
    if (normalized.includes(modifier)) {
      isLatest = true;
      normalized = normalized.replace(new RegExp(`\\b${modifier}\\b`, 'gi'), '').trim();
      break;
    }
  }

  // Detect media type hints (including webseries variations)
  let mediaType: 'movie' | 'tv' | undefined;
  const mediaKeywords = {
    movie: ['movie', 'film', 'cinema', 'movies', 'films'],
    tv: [
      'tv',
      'series',
      'show',
      'episode',
      'season',
      'tv show',
      'television',
      'webseries',
      'web series',
      'web-series',
    ],
  };

  for (const [type, keywords] of Object.entries(mediaKeywords)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        mediaType = type as 'movie' | 'tv';
        normalized = normalized.replace(new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi'), '').trim();
        break;
      }
    }
    if (mediaType) break;
  }

  // Detect category/region keywords
  const categories: string[] = [];
  const languages: string[] = [];

  const categoryKeywords: { [key: string]: { category: string; languages?: string[] } } = {
    'bollywood': { category: 'bollywood', languages: ['hi'] },
    'bollywoood': { category: 'bollywood', languages: ['hi'] }, // typo tolerance
    'hindi': { category: 'hindi', languages: ['hi'] }, // Hindi language detection
    'hindi movie': { category: 'hindi', languages: ['hi'] },
    'hindi movies': { category: 'hindi', languages: ['hi'] },
    'hindi film': { category: 'hindi', languages: ['hi'] },
    'south indian': { category: 'south indian', languages: ['ta', 'te', 'ml', 'kn'] },
    'south': { category: 'south indian', languages: ['ta', 'te', 'ml', 'kn'] },
    'tamil': { category: 'tamil', languages: ['ta'] },
    'telugu': { category: 'telugu', languages: ['te'] },
    'malayalam': { category: 'malayalam', languages: ['ml'] },
    'kannada': { category: 'kannada', languages: ['kn'] },
    'hollywood': { category: 'hollywood', languages: ['en'] },
    'mcu': { category: 'mcu', languages: ['en'] },
    'marvel': { category: 'marvel', languages: ['en'] },
    'marvels': { category: 'marvel', languages: ['en'] },
    'dc': { category: 'dc', languages: ['en'] },
    'korean': { category: 'korean', languages: ['ko'] },
    'k-drama': { category: 'korean', languages: ['ko'] },
    'kdrama': { category: 'korean', languages: ['ko'] },
    'anime': { category: 'anime', languages: ['ja'] },
  };

  for (const [keyword, info] of Object.entries(categoryKeywords)) {
    const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    if (normalized.match(regex)) {
      categories.push(info.category);
      if (info.languages) {
        languages.push(...info.languages);
      }
      normalized = normalized.replace(regex, '').trim();
    }
  }

  // Remove common stop words that don't help with movie/TV search
  const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on', 'at'];
  const words = normalized
    .split(/\s+/)
    .filter((word) => word.length > 0 && !stopWords.includes(word));

  // Remove special characters but keep spaces and hyphens
  normalized = words.join(' ').replace(/[^\w\s-]/g, '').trim();

  return {
    normalized,
    keywords: words.filter((w) => w.length > 1),
    year,
    mediaType,
    originalQuery,
    categories: categories.length > 0 ? categories : undefined,
    isLatest,
    languages: languages.length > 0 ? Array.from(new Set(languages)) : undefined,
  };
}

/**
 * Expand query with common variations and synonyms
 */
export function expandQuery(query: string): string[] {
  const variations: string[] = [query];

  // Common movie/TV show synonyms and variations
  const synonyms: { [key: string]: string[] } = {
    movie: ['film', 'cinema', 'movies'],
    film: ['movie', 'cinema', 'movies'],
    movies: ['movie', 'film', 'cinema'],
    tv: ['television', 'series', 'show', 'webseries'],
    series: ['tv', 'show', 'television', 'webseries', 'web series'],
    show: ['tv', 'series', 'television'],
    webseries: ['web series', 'web-series', 'series', 'tv'],
    'web series': ['webseries', 'web-series', 'series', 'tv'],
    bollywood: ['hindi movie', 'hindi film', 'indian movie'],
    'south indian': ['south', 'tamil', 'telugu', 'malayalam', 'kannada'],
    marvel: ['mcu', 'marvels'],
    mcu: ['marvel', 'marvels'],
    latest: ['new', 'recent', 'recently'],
    new: ['latest', 'recent', 'recently'],
  };

  const words = query.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (synonyms[word]) {
      for (const synonym of synonyms[word]) {
        const variation = [...words];
        variation[i] = synonym;
        variations.push(variation.join(' '));
      }
    }

    // Handle multi-word synonyms (e.g., "web series")
    if (i < words.length - 1) {
      const twoWord = `${words[i]} ${words[i + 1]}`;
      if (synonyms[twoWord]) {
        for (const synonym of synonyms[twoWord]) {
          const variation = [...words];
          variation[i] = synonym.split(' ')[0];
          if (synonym.includes(' ')) {
            variation[i + 1] = synonym.split(' ')[1];
          } else {
            variation.splice(i + 1, 1);
          }
          variations.push(variation.join(' '));
        }
      }
    }
  }

  return Array.from(new Set(variations));
}
