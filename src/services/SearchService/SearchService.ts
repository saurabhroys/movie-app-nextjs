import { AxiosResponse } from 'axios';
import MovieService from '../MovieService';
import type { Show } from '@/types';
import { filterShowsWithImages } from '@/lib/utils';
import { rankSearchResults, normalizeQuery, filterAdultContent } from '@/lib/search-intelligence';



interface PendingRequest {
  requestId: string;
  query: string;
  abortController: AbortController;
  promise: Promise<any>;
}

class SearchService {
  private static pendingRequests: Map<string, PendingRequest> = new Map();
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



    // Normalize query for deduplication check
    const normalizedQuery = normalizeQuery(trimmedQuery).normalized.toLowerCase().trim();
    
    // Check if there's already a pending request for the same or very similar query
    const existingRequest = Array.from(this.pendingRequests.values()).find(
      (req) => {
        if (req.abortController.signal.aborted) return false;
        const reqNormalized = normalizeQuery(req.query).normalized.toLowerCase().trim();
        // Cancel if it's the same query
        return reqNormalized === normalizedQuery;
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



      return { results: rankedResults, requestId: newRequestId };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, return empty results
        return { results: [], requestId: newRequestId };
      }
      throw error;
    }
  }


}

export default SearchService;
