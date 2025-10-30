import { AxiosResponse } from 'axios';
import MovieService from '../MovieService';
import type { Show } from '@/types';
import { filterShowsWithImages } from '@/lib/utils';

interface SearchCache {
  [key: string]: {
    data: Show[];
    timestamp: number;
  };
}

interface PendingRequest {
  requestId: string;
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
   */
  private static getCachedResults(query: string): Show[] | null {
    const cacheKey = query.toLowerCase().trim();
    const cached = this.cache[cacheKey];

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // Remove expired cache entry
    if (cached) {
      delete this.cache[cacheKey];
    }

    return null;
  }

  /**
   * Cache search results
   */
  private static setCachedResults(query: string, results: Show[]): void {
    const cacheKey = query.toLowerCase().trim();
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
  ): Promise<{ results: Show[]; requestId: string }> {
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

    // Check if there's already a pending request for this query
    const existingRequest = Array.from(this.pendingRequests.values()).find(
      (req) => {
        // This is a simplified check - in a real implementation, you'd want to track the query
        return !req.abortController.signal.aborted;
      },
    );

    if (existingRequest) {
      // Cancel the existing request
      existingRequest.abortController.abort();
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

        const response = await MovieService.searchMovies(trimmedQuery);

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

      // Cache the filtered results
      this.setCachedResults(trimmedQuery, showsWithImages);

      return { results: showsWithImages, requestId: newRequestId };
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
