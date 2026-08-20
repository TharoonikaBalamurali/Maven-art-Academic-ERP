import { apiClient } from '@/lib/api';
import type { RequestOptions } from '@/shared/types';
import type { SearchResponse } from '../types';
import { searchContract } from './search.contract';

export const searchService = {
  query(q: string, options?: RequestOptions): Promise<SearchResponse> {
    return apiClient.call(searchContract.query, { query: { q }, options });
  },
};
