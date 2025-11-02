import type { Show } from '@/types';

/**
 * Intelligent Search Utilities
 * Provides advanced search capabilities including:
 * - Query normalization
 * - Relevance scoring
 * - Fuzzy matching
 * - Query preprocessing
 * - Adult content filtering (blocks pornographic content, keeps legitimate 18+ content)
 */

/**
 * List of explicit/pornographic keywords that indicate adult content to block
 * These are terms commonly found in pornographic titles/overviews
 * NOTE: We use specific terms to avoid blocking legitimate R-rated/18+ content
 */
const PORNOGRAPHIC_KEYWORDS = [
  // Explicit content identifiers
  'xxx',
  'porn',
  'porno',
  'pornography',
  'pornographic',
  'hardcore',
  'hard-core',
  'hardcore porn',
  'adult film',
  'adult movie',
  'adult video',
  'adult content',
  'adult entertainment',
  'xxx movie',
  'xxx film',
  'xxx video',
  'xxx rated',
  'x-rated',
  'x rated',
  'nc-17',
  'nc17',
  // Explicit sexual content terms
  'sex tape',
  'sex film',
  'sex movie',
  'sex video',
  'sex content',
  'sexual content',
  'explicit sex',
  'explicit sexual',
  'explicit content',
  'full nudity',
  'graphic sex',
  'hardcore sex',
  // Adult industry terms
  'adult industry',
  'adult production',
  'adult studio',
  'adult performer',
  'escort service',
  'escort film',
  // Explicit genre terms
  'hentai',
  'ecchi',
  'yuri',
  'yaoi',
  'bdsm film',
  'bdsm movie',
  'fetish film',
  'fetish movie',
  'gangbang',
  'orgy',
  'threesome film',
  'threesome movie',
  // Other explicit indicators
  'uncensored sex',
  'uncensored film',
  'softcore porn',
  'softcore film',
  'erotica film',
  'erotic film',
  'erotic movie',
  'sexploitation',
  'sexploitation film',
];

/**
 * List of legitimate show/movie titles that contain "sex" but are not pornographic
 * These are popular mainstream shows that should not be blocked
 */
const LEGITIMATE_SEX_TITLES = [
  'sex education',
  'sex and the city',
  'sex drive',
  'sex, lies, and videotape',
  'sex and drugs and rock and roll',
  'sex ed',
];

/**
 * Check if content should be filtered as pornographic/explicit adult content
 * Returns true if content should be BLOCKED
 * 
 * Strategy:
 * 1. Block if TMDB explicitly marks it as adult (pornographic) AND has low credibility indicators
 * 2. Block if title/overview contains explicit pornographic keywords
 * 3. Block standalone "sex" queries if content is adult-flagged or has low engagement
 * 4. Keep legitimate 18+ content (R-rated movies, TV-MA shows with violence/mature themes)
 */
function isPornographicContent(show: Show): boolean {
  const title = (show.name || show.title || show.original_name || show.original_title || '').toLowerCase();
  const overview = (show.overview || '').toLowerCase();
  const searchText = `${title} ${overview}`;

  // Check if it's a legitimate show/movie with "sex" in title
  const isLegitimateSexTitle = LEGITIMATE_SEX_TITLES.some((legitTitle) =>
    title.includes(legitTitle.toLowerCase()),
  );

  // Primary check: TMDB adult flag (explicit sexual/pornographic content)
  const hasAdultFlag = show.adult === true;

  // Check for explicit pornographic keywords in title or overview
  // These are strong indicators of pornographic content
  let hasExplicitKeywords = false;
  for (const keyword of PORNOGRAPHIC_KEYWORDS) {
    // Use word boundary matching to avoid false positives
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(searchText)) {
      hasExplicitKeywords = true;
      break;
    }
  }

  // Block if explicit keywords found (unless it's a known legitimate title)
  if (hasExplicitKeywords && !isLegitimateSexTitle) {
    return true;
  }

  // Check for standalone "sex" keyword (not part of legitimate titles)
  const hasStandaloneSex = /\bsex\b/i.test(searchText) && !isLegitimateSexTitle;

  // Block if standalone "sex" + adult flag
  if (hasStandaloneSex && hasAdultFlag) {
    return true;
  }

  // Block if standalone "sex" + very low engagement (likely pornographic)
  if (hasStandaloneSex && show.vote_count < 100 && show.popularity < 10) {
    return true;
  }

  // Block if standalone "sex" + explicit patterns
  if (hasStandaloneSex) {
    const explicitSexPatterns = [
      /\bsex\s+(tape|film|movie|video|scene|content)\b/i,
      /\bexplicit\s+sex\b/i,
      /\bgraphic\s+sex\b/i,
      /\bhardcore\s+sex\b/i,
      /\bsex\s+with\b/i,
      /\bsex\s+show\b/i,
      /\bsex\s+series\b/i,
    ];
    
    for (const pattern of explicitSexPatterns) {
      if (pattern.test(searchText)) {
        return true;
      }
    }
  }

  if (hasAdultFlag) {
    // Only block adult-flagged content if it also has indicators of being pornographic
    // Legitimate R-rated content usually has:
    // - Reasonable vote count (> 50 votes)
    // - Some popularity
    // - No explicit pornographic keywords
    
    // If adult flag + very low engagement, likely pornographic
    if (show.vote_count < 50 && show.popularity < 5) {
      return true;
    }
    
    // If adult flag + explicit patterns in title, block
    const explicitPatterns = [
      /\bxxx\b/i,
      /\bporn\b/i,
      /\bpornography\b/i,
      /\bhardcore\b/i,
      /\bsex tape\b/i,
      /\bsex film\b/i,
      /\bsex movie\b/i,
      /\badult film\b/i,
      /\badult movie\b/i,
      /\badult video\b/i,
      /\bxxx rated\b/i,
      /\bx-rated\b/i,
      /\bhardcore sex\b/i,
      /\bexplicit sex\b/i,
      /\bgraphic sex\b/i,
      /\bhentai\b/i,
      /\becchi\b/i,
      /\bgangbang\b/i,
      /\borgy\b/i,
      /\buncensored sex\b/i,
      /\bsoftcore porn\b/i,
      /\berotic film\b/i,
      /\berotic movie\b/i,
    ];
    
    for (const pattern of explicitPatterns) {
      if (pattern.test(searchText)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Filter out pornographic/explicit adult content while keeping legitimate 18+ content
 * This filters shows that are explicitly pornographic but keeps R-rated movies, TV-MA shows, etc.
 */
export function filterAdultContent(shows: Show[]): Show[] {
  return shows.filter((show) => !isPornographicContent(show));
}

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
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1, // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
}

/**
 * Check if a string contains all keywords (with fuzzy matching)
 */
function containsKeywords(text: string, keywords: string[]): {
  matches: boolean;
  matchScore: number;
  matchedKeywords: number;
} {
  if (keywords.length === 0) {
    return { matches: true, matchScore: 1, matchedKeywords: 0 };
  }

  const textLower = text.toLowerCase();
  let matchedCount = 0;
  let totalMatchScore = 0;

  for (const keyword of keywords) {
    // Exact match
    if (textLower.includes(keyword)) {
      matchedCount++;
      totalMatchScore += 1;
      continue;
    }

    // Fuzzy match (check if any word starts with or contains similar substring)
    const words = textLower.split(/\s+/);
    let bestMatch = 0;
    for (const word of words) {
      if (word.includes(keyword) || keyword.includes(word)) {
        bestMatch = Math.max(bestMatch, 0.8);
      } else {
        const sim = similarityScore(word, keyword);
        if (sim > 0.6) {
          bestMatch = Math.max(bestMatch, sim * 0.7);
        }
      }
    }
    if (bestMatch > 0) {
      matchedCount++;
      totalMatchScore += bestMatch;
    }
  }

  const matchScore = matchedCount > 0 ? totalMatchScore / keywords.length : 0;
  return {
    matches: matchedCount === keywords.length,
    matchScore,
    matchedKeywords: matchedCount,
  };
}

/**
 * Extract title from a Show object
 */
function getShowTitle(show: Show): string {
  return (show.name || show.title || show.original_name || show.original_title || '').toLowerCase();
}

/**
 * Calculate intelligent relevance score for a show based on query
 */
export function calculateRelevanceScore(
  show: Show,
  queryInfo: ReturnType<typeof normalizeQuery>,
): number {
  const { normalized, keywords, year, mediaType, categories, isLatest, languages } = queryInfo;
  let score = 0;

  const title = getShowTitle(show);
  const overview = (show.overview || '').toLowerCase();
  const originalLanguage = (show.original_language || '').toLowerCase();

  // 1. Exact title match (highest priority) - 40 points
  if (title === normalized || title.includes(normalized) || normalized.includes(title)) {
    score += 40;
  } else {
    // Fuzzy title match - 20-35 points
    const titleSimilarity = similarityScore(title, normalized);
    if (titleSimilarity > 0.7) {
      score += 20 + titleSimilarity * 15;
    } else if (titleSimilarity > 0.5) {
      score += 10 + titleSimilarity * 10;
    }
  }

  // 2. Title keyword matching - 15-25 points
  const titleKeywordMatch = containsKeywords(title, keywords);
  if (titleKeywordMatch.matches) {
    score += 25 * titleKeywordMatch.matchScore;
  } else if (titleKeywordMatch.matchedKeywords > 0) {
    score += 15 * titleKeywordMatch.matchScore;
  }

  // 3. Overview keyword matching - 5-10 points
  const overviewMatch = containsKeywords(overview, keywords);
  if (overviewMatch.matches) {
    score += 10 * overviewMatch.matchScore;
  } else if (overviewMatch.matchedKeywords > 0) {
    score += 5 * overviewMatch.matchScore;
  }

  // 4. Year matching - 10 points
  if (year) {
    const showYear =
      getYearFromDate(show.release_date || show.first_air_date || '') ||
      getYearFromDate(show.last_air_date || '');
    if (showYear && Math.abs(showYear - year) <= 1) {
      score += 10;
    } else if (showYear && Math.abs(showYear - year) <= 5) {
      score += 5;
    }
  }

  // 5. Media type matching - 5 points
  if (mediaType) {
    const showMediaType = show.media_type?.toLowerCase();
    if (
      (mediaType === 'movie' && showMediaType === 'movie') ||
      (mediaType === 'tv' && showMediaType === 'tv')
    ) {
      score += 5;
    }
  }

  // 6. Quality indicators - normalize to 0-15 points
  // Rating boost (0-7 points)
  if (show.vote_average > 0) {
    score += (show.vote_average / 10) * 7;
  }

  // Vote count boost (0-5 points) - more votes = more reliable
  const voteCountScore = Math.min(show.vote_count / 1000, 5);
  score += voteCountScore;

  // Recency boost (0-3 points) - recent content gets slight boost
  const releaseDate = show.release_date || show.first_air_date;
  if (releaseDate) {
    const releaseYear = getYearFromDate(releaseDate);
    if (releaseYear) {
      const currentYear = new Date().getFullYear();
      const yearsAgo = currentYear - releaseYear;
      if (yearsAgo <= 2) {
        score += 3;
      } else if (yearsAgo <= 5) {
        score += 2;
      } else if (yearsAgo <= 10) {
        score += 1;
      }
    }
  }

  // 7. Popularity boost (normalized) - 0-10 points
  // Popularity from TMDB can be very high, so we normalize it
  const normalizedPopularity = Math.min(show.popularity / 100, 10);
  score += normalizedPopularity;

  // 8. Category/Region matching - 10-30 points
  if (categories && categories.length > 0) {
    for (const category of categories) {
      const categoryLower = category.toLowerCase();
      
      // Bollywood/Hindi content matching
      if (categoryLower.includes('bollywood') && (originalLanguage === 'hi' || title.includes('hindi'))) {
        score += 30;
      }
      
      // South Indian languages matching
      if (categoryLower.includes('south indian') || categoryLower.includes('tamil') || 
          categoryLower.includes('telugu') || categoryLower.includes('malayalam') || 
          categoryLower.includes('kannada')) {
        const southLanguages = ['ta', 'te', 'ml', 'kn'];
        if (southLanguages.includes(originalLanguage)) {
          score += 25;
        }
        // Also boost if title/overview mentions regional keywords
        const regionalKeywords = ['tamil', 'telugu', 'malayalam', 'kannada', 'south'];
        for (const keyword of regionalKeywords) {
          if (title.includes(keyword) || overview.includes(keyword)) {
            score += 15;
            break;
          }
        }
      }
      
      // Hollywood/English content
      if (categoryLower === 'hollywood' && originalLanguage === 'en') {
        score += 20;
      }
      
      // MCU/Marvel content matching
      if ((categoryLower === 'mcu' || categoryLower === 'marvel') && originalLanguage === 'en') {
        // Check for Marvel-related keywords
        const marvelKeywords = ['marvel', 'mcu', 'superhero', 'avengers', 'spiderman', 'iron man', 
                                'captain america', 'thor', 'hulk', 'black widow', 'doctor strange',
                                'guardians', 'black panther', 'captain marvel'];
        let marvelMatch = false;
        for (const keyword of marvelKeywords) {
          if (title.includes(keyword) || overview.includes(keyword)) {
            score += 30;
            marvelMatch = true;
            break;
          }
        }
        if (!marvelMatch && originalLanguage === 'en') {
          score += 10; // Slight boost for English content when searching Marvel
        }
      }
      
      // DC content
      if (categoryLower === 'dc' && originalLanguage === 'en') {
        const dcKeywords = ['dc', 'batman', 'superman', 'wonder woman', 'aquaman', 'flash', 
                           'green lantern', 'justice league'];
        for (const keyword of dcKeywords) {
          if (title.includes(keyword) || overview.includes(keyword)) {
            score += 30;
            break;
          }
        }
      }
      
      // Korean content
      if (categoryLower === 'korean' && originalLanguage === 'ko') {
        score += 25;
      }
      
      // Anime
      if (categoryLower === 'anime' && originalLanguage === 'ja') {
        score += 25;
      }
    }
  }
  
  // Language matching boost
  if (languages && languages.length > 0) {
    if (languages.includes(originalLanguage)) {
      score += 15;
    }
  }

  // 9. Latest/Recent content boost (when "latest" is in query)
  if (isLatest) {
    const releaseDate = show.release_date || show.first_air_date;
    if (releaseDate) {
      const releaseYear = getYearFromDate(releaseDate);
      if (releaseYear) {
        const currentYear = new Date().getFullYear();
        const yearsAgo = currentYear - releaseYear;
        // Much stronger boost for recent content when user searches "latest"
        if (yearsAgo === 0) {
          score += 20; // Current year
        } else if (yearsAgo === 1) {
          score += 15; // Last year
        } else if (yearsAgo === 2) {
          score += 10; // 2 years ago
        } else if (yearsAgo <= 5) {
          score += 5; // 3-5 years
        }
      }
    }
  }

  return score;
}

/**
 * Get year from date string
 */
function getYearFromDate(dateString: string): number | null {
  if (!dateString) return null;
  const yearMatch = dateString.match(/^\d{4}/);
  return yearMatch ? parseInt(yearMatch[0], 10) : null;
}

/**
 * Intelligently rank and sort search results
 */
export function rankSearchResults(
  results: Show[],
  query: string,
): Show[] {
  if (results.length === 0) return results;

  const queryInfo = normalizeQuery(query);

  // Calculate relevance scores for all results
  const resultsWithScores = results.map((show) => ({
    show,
    score: calculateRelevanceScore(show, queryInfo),
  }));

  // Sort by score (descending), then by popularity as tiebreaker
  resultsWithScores.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.5) {
      return b.score - a.score;
    }
    // Tiebreaker: popularity
    return b.show.popularity - a.show.popularity;
  });

  return resultsWithScores.map((item) => item.show);
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

