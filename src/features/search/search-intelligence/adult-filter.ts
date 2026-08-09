import type { Show } from '@/services/tmdb/types';
import { PORNOGRAPHIC_KEYWORDS, LEGITIMATE_SEX_TITLES } from './constants';

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
