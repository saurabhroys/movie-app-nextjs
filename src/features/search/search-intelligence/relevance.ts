import type { Show } from '@/services/tmdb/types';
import { normalizeQuery } from './normalize';

/**
 * Intelligent Search Utilities — relevance
 * Scores and ranks search results against a normalized query.
 */

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
 * Get year from date string
 */
function getYearFromDate(dateString: string): number | null {
  if (!dateString) return null;
  const yearMatch = dateString.match(/^\d{4}/);
  return yearMatch ? parseInt(yearMatch[0], 10) : null;
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
