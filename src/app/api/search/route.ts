import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import SearchService from '@/services/tmdb/search.service';

const MAX_QUERY_LENGTH = 200;

/**
 * Server-side proxy for the search API. Keeps the TMDb bearer token out of the
 * browser bundle — the client RTK Query layer POSTs here instead of calling
 * TMDb directly.
 */
export async function POST(request: NextRequest) {
  let query: unknown;
  try {
    ({ query } = (await request.json()) as { query: unknown });
  } catch {
    return NextResponse.json({ results: [], error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof query !== 'string' || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ results: [], error: 'Query too long' }, { status: 400 });
  }

  try {
    const { results } = await SearchService.searchMovies(query.trim());
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
