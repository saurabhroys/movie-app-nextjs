import { AxiosResponse } from 'axios';
import MovieService from '../MovieService';
import type { Show } from '@/types';
import { filterShowsWithImages } from '@/lib/utils';
import { rankSearchResults, normalizeQuery, filterAdultContent } from '@/lib/search-intelligence';

interface SearchCache {
  [key: string]: {
    data: Show[];
    timestamp: number;
  };
}

interface PendingRequest {
  requestId: string;
  query: string;
  abortController: AbortController;
  promise: Promise<any>;
}

class SearchService {
  private static cache: SearchCache = {};
  private static pendingRequests: Map<string, PendingRequest> = new Map();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly MIN_QUERY_LENGTH = 2;

  /**
   * Generate a unique request ID
   */
  private static generateRequestId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if query is valid for search
   */
  private static isValidQuery(query: string): boolean {
    return query.trim().length >= this.MIN_QUERY_LENGTH;
  }

  /**
   * Get cached search results if available and not expired
   * Uses normalized query for better cache hits
   */
  private static getCachedResults(query: string): Show[] | null {
    // Normalize query for cache lookup (same normalization as ranking)
    const normalized = normalizeQuery(query);
    const cacheKey = normalized.normalized.toLowerCase().trim();
    
    // Check exact match first
    const cached = this.cache[cacheKey];

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // Try to find similar cached queries (fuzzy cache matching)
    const cacheKeys = Object.keys(this.cache);
    for (const key of cacheKeys) {
      const cachedItem = this.cache[key];
      if (
        cachedItem &&
        Date.now() - cachedItem.timestamp < this.CACHE_DURATION
      ) {
        // Simple similarity check - if normalized queries are very similar, use cached result
        const similarity = this.calculateSimilarity(cacheKey, key);
        if (similarity > 0.85) {
          return cachedItem.data;
        }
      }
    }

    // Remove expired cache entry
    if (cached) {
      delete this.cache[cacheKey];
    }

    return null;
  }

  /**
   * Calculate simple similarity between two strings (0-1)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    // Check if one contains the other
    if (longer.includes(shorter)) {
      return shorter.length / longer.length;
    }

    // Simple word-based similarity
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const commonWords = words1.filter((w) => words2.includes(w));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  /**
   * Cache search results
   * Uses normalized query as cache key for better reuse
   */
  private static setCachedResults(query: string, results: Show[]): void {
    // Use normalized query for consistent cache keys
    const normalized = normalizeQuery(query);
    const cacheKey = normalized.normalized.toLowerCase().trim();
    this.cache[cacheKey] = {
      data: results,
      timestamp: Date.now(),
    };
  }

  /**
   * Cancel a specific request
   */
  static cancelRequest(requestId: string): void {
    const pendingRequest = this.pendingRequests.get(requestId);
    if (pendingRequest) {
      pendingRequest.abortController.abort();
      this.pendingRequests.delete(requestId);
    }
  }

  /**
   * Cancel all pending requests
   */
  static cancelAllRequests(): void {
    this.pendingRequests.forEach((request) => {
      request.abortController.abort();
    });
    this.pendingRequests.clear();
  }

  /**
   * Search movies with request cancellation, deduplication, and caching
   */
  static async searchMovies(
    query: string,
    requestId?: string,
    page?: number,
  ): Promise<{ results: Show[]; requestId: string; total_pages?: number }> {
    // Validate query
    if (!this.isValidQuery(query)) {
      return { results: [], requestId: requestId || this.generateRequestId() };
    }

    const trimmedQuery = query.trim();
    const newRequestId = requestId || this.generateRequestId();

    // Check cache first
    const cachedResults = this.getCachedResults(trimmedQuery);
    if (cachedResults) {
      return { results: cachedResults, requestId: newRequestId };
    }

    // Normalize query for deduplication check
    const normalizedQuery = normalizeQuery(trimmedQuery).normalized.toLowerCase().trim();
    
    // Check if there's already a pending request for the same or very similar query
    const existingRequest = Array.from(this.pendingRequests.values()).find(
      (req) => {
        if (req.abortController.signal.aborted) return false;
        const reqNormalized = normalizeQuery(req.query).normalized.toLowerCase().trim();
        // Cancel if it's the same query or very similar (85%+ similarity)
        return reqNormalized === normalizedQuery || 
               this.calculateSimilarity(reqNormalized, normalizedQuery) > 0.85;
      },
    );

    if (existingRequest) {
      // Cancel the existing request
      existingRequest.abortController.abort();
      this.pendingRequests.delete(existingRequest.requestId);
    }

    // Create new abort controller for this request
    const abortController = new AbortController();

    // Create the request promise
    const requestPromise = (async () => {
      try {
        // Check if MovieService is available
        if (!MovieService || typeof MovieService.searchMovies !== 'function') {
          console.error('SearchService: MovieService not available');
          return { results: [] };
        }

        // Analyze query to extract language, media type, year, and temporal info
        const queryInfo = normalizeQuery(trimmedQuery);

        // Build search options from query analysis
        const searchOptions: {
          languages?: string[];
          mediaType?: 'movie' | 'tv';
          year?: number;
          isLatest?: boolean;
        } = {};

        if (queryInfo.languages && queryInfo.languages.length > 0) {
          searchOptions.languages = queryInfo.languages;
        }

        if (queryInfo.mediaType) {
          searchOptions.mediaType = queryInfo.mediaType;
        }

        if (queryInfo.year) {
          searchOptions.year = queryInfo.year;
        }

        if (queryInfo.isLatest) {
          searchOptions.isLatest = true;
        }

        // Call search with intelligent options
        const response = await MovieService.searchMovies(trimmedQuery, page, searchOptions);

        // Remove from pending requests when completed
        this.pendingRequests.delete(newRequestId);

        // Validate response structure
        if (!response || typeof response !== 'object') {
          console.warn('SearchService: Invalid response structure:', response);
          return { results: [] };
        }

        return response;
      } catch (error) {
        // Remove from pending requests when failed
        this.pendingRequests.delete(newRequestId);

        // Don't throw if request was aborted
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        console.error('Search request failed:', error);
        throw error;
      }
    })();

    // Store the pending request
    this.pendingRequests.set(newRequestId, {
      requestId: newRequestId,
      query: trimmedQuery,
      abortController,
      promise: requestPromise,
    });

    try {
      const response = await requestPromise;

      // Handle case where response might be undefined or not have results
      if (!response) {
        console.warn('SearchService: Empty response received');
        return { results: [], requestId: newRequestId };
      }

      // Ensure response has results property
      if (!response.results || !Array.isArray(response.results)) {
        console.warn(
          'SearchService: Response missing results array:',
          response,
        );
        return { results: [], requestId: newRequestId };
      }

      const results = response.results;

      // Filter out shows without valid images
      const showsWithImages = filterShowsWithImages(results);

      // Filter out pornographic/explicit adult content (keeps legitimate 18+ content)
      const filteredAdultContent = filterAdultContent(showsWithImages);

      // Apply intelligent ranking and relevance scoring
      const rankedResults = rankSearchResults(filteredAdultContent, trimmedQuery);

      // Cache the ranked results
      this.setCachedResults(trimmedQuery, rankedResults);

      return { results: rankedResults, requestId: newRequestId };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, return empty results
        return { results: [], requestId: newRequestId };
      }
      throw error;
    }
  }

  /**
   * Clear all cache
   */
  static clearCache(): void {
    this.cache = {};
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: Object.keys(this.cache).length,
      keys: Object.keys(this.cache),
    };
  }
}

export default SearchService;
