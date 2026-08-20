import { endpoint } from '@/lib/api';
import type { SearchResponse } from '../types';

/**
 * Global search contract (§ search). The backend scopes results to what the
 * caller may read; there is no client-side record filtering.
 *
 * TBD — BACKEND CONTRACT: provisional path and query name.
 */
export const searchContract = {
  query: endpoint<void, SearchResponse, { q: string }>({
    method: 'GET',
    path: '/search',
    auth: true,
  }),
} as const;
